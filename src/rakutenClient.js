const { normalize } = require("./normalize");

// 2026年5月の楽天API仕様移行により、旧 app.rakuten.co.jp は廃止され
// openapi.rakuten.co.jp + applicationId/accessKey/Origin ヘッダーの方式に変更された。
const CATEGORY_LIST_URL =
  "https://openapi.rakuten.co.jp/recipems/api/Recipe/CategoryList/20170426";
const CATEGORY_RANKING_URL =
  "https://openapi.rakuten.co.jp/recipems/api/Recipe/CategoryRanking/20170426";

class RakutenNotConfiguredError extends Error {
  constructor() {
    super("RAKUTEN_APP_ID または RAKUTEN_ACCESS_KEY が設定されていません");
    this.name = "RakutenNotConfiguredError";
  }
}

// 個人利用・単一プロセス前提のシンプルなインメモリキャッシュ。
const cache = new Map();

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data, ttlMs) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function getCredentials() {
  const appId = process.env.RAKUTEN_APP_ID;
  const accessKey = process.env.RAKUTEN_ACCESS_KEY;
  const origin = process.env.RAKUTEN_ORIGIN;
  if (!appId || !accessKey || !origin) {
    throw new RakutenNotConfiguredError();
  }
  return { appId, accessKey, origin };
}

async function callRakutenApi(baseUrl, params) {
  const { appId, accessKey, origin } = getCredentials();
  const query = new URLSearchParams({ ...params, applicationId: appId, format: "json" });
  const res = await fetch(`${baseUrl}?${query.toString()}`, {
    headers: {
      accessKey,
      Origin: origin,
    },
  });
  if (!res.ok) {
    throw new Error(`楽天APIエラー: ${res.status}`);
  }
  return res.json();
}

async function fetchCategoryList() {
  const cacheKey = "categoryList";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const data = await callRakutenApi(CATEGORY_LIST_URL, {});
  setCached(cacheKey, data, 24 * 60 * 60 * 1000); // 24時間
  return data;
}

async function fetchCategoryRanking(categoryId) {
  const cacheKey = `ranking:${categoryId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const data = await callRakutenApi(CATEGORY_RANKING_URL, { categoryId });
  const recipes = data.result || [];
  setCached(cacheKey, recipes, 60 * 60 * 1000); // 1時間
  return recipes;
}

// 登録食材名とカテゴリ名が一致する中カテゴリを優先的に選び、残り枠を先頭からの
// カテゴリで埋める。カテゴリ数自体の上限(limit)は変えず、登録食材に関係の薄い
// カテゴリばかり呼び出してしまうのを避けるための優先度付けのみを行う。
function selectTargetCategories(mediumCategories, ingredientNames, limit) {
  const normalizedIngredients = ingredientNames.map(normalize).filter(Boolean);

  const relevant = [];
  const others = [];
  for (const cat of mediumCategories) {
    const normalizedCategoryName = normalize(cat.categoryName || "");
    const isRelevant = normalizedIngredients.some(
      (ing) => normalizedCategoryName.includes(ing) || ing.includes(normalizedCategoryName)
    );
    (isRelevant ? relevant : others).push(cat);
  }

  return [...relevant, ...others].slice(0, limit);
}

// 中カテゴリの候補を最大 limit 件選び、各カテゴリの人気ランキング(上位4件)を取得して集約する。
// カテゴリの選定基準は要件書9章の通りMVPでは簡易な優先度付けとし、使用感を見ながら調整する前提。
async function fetchCandidateRecipes(limit, ingredientNames = []) {
  const categoryList = await fetchCategoryList();
  const mediumCategories = (categoryList.result && categoryList.result.medium) || [];
  const targetCategories = selectTargetCategories(mediumCategories, ingredientNames, limit);

  const recipeLists = await Promise.all(
    targetCategories.map((cat) =>
      fetchCategoryRanking(`${cat.parentCategoryId}-${cat.categoryId}`).catch(() => [])
    )
  );

  return recipeLists.flat();
}

module.exports = {
  RakutenNotConfiguredError,
  fetchCategoryList,
  fetchCategoryRanking,
  fetchCandidateRecipes,
};
