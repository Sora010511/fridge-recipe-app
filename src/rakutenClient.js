const CATEGORY_LIST_URL =
  "https://app.rakuten.co.jp/services/api/Recipe/CategoryList/20170426";
const CATEGORY_RANKING_URL =
  "https://app.rakuten.co.jp/services/api/Recipe/CategoryRanking/20170426";

class RakutenNotConfiguredError extends Error {
  constructor() {
    super("RAKUTEN_APP_ID が設定されていません");
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

function getAppId() {
  const appId = process.env.RAKUTEN_APP_ID;
  if (!appId) {
    throw new RakutenNotConfiguredError();
  }
  return appId;
}

async function fetchCategoryList() {
  const cacheKey = "categoryList";
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const appId = getAppId();
  const url = `${CATEGORY_LIST_URL}?applicationId=${encodeURIComponent(appId)}&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`楽天カテゴリ一覧APIエラー: ${res.status}`);
  }
  const data = await res.json();
  setCached(cacheKey, data, 24 * 60 * 60 * 1000); // 24時間
  return data;
}

async function fetchCategoryRanking(categoryId) {
  const cacheKey = `ranking:${categoryId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const appId = getAppId();
  const url = `${CATEGORY_RANKING_URL}?applicationId=${encodeURIComponent(appId)}&categoryId=${encodeURIComponent(categoryId)}&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`楽天ランキングAPIエラー(category=${categoryId}): ${res.status}`);
  }
  const data = await res.json();
  const recipes = data.result || [];
  setCached(cacheKey, recipes, 60 * 60 * 1000); // 1時間
  return recipes;
}

// 中カテゴリの候補を先頭から limit 件選び、各カテゴリの人気ランキング(上位4件)を取得して集約する。
// カテゴリの選定基準は要件書9章の通りMVPでは簡易固定とし、使用感を見ながら調整する前提。
async function fetchCandidateRecipes(limit) {
  const categoryList = await fetchCategoryList();
  const mediumCategories = (categoryList.result && categoryList.result.medium) || [];
  const targetCategories = mediumCategories.slice(0, limit);

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
