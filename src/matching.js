const { normalize } = require("./normalize");

// 塩・醤油・酒などの調味料は大半の家庭に常備されており、冷蔵庫の「主要食材」として
// 登録される対象ではないため、マッチ度の分母から除外する。完全な辞書ではなく、
// 実装しながら使用感を見て調整する前提の軽量なキーワードリスト。
const SEASONING_KEYWORDS = [
  "塩", "こしょう", "コショウ", "胡椒", "醤油", "しょうゆ", "しょう油",
  "砂糖", "酒", "みりん", "味噌", "みそ", "酢", "ごま油", "サラダ油",
  "片栗粉", "小麦粉", "薄力粉", "強力粉", "パン粉",
  "にんにく", "ニンニク", "生姜", "しょうが", "ショウガ", "チューブ",
  "だし", "出汁", "スープの素", "コンソメ", "鶏ガラ",
  "オイスターソース", "ケチャップ", "マヨネーズ", "ソース", "ぽん酢", "ポン酢",
  "めんつゆ", "わさび", "からし", "唐辛子", "一味", "七味", "ごま", "胡麻",
  "はちみつ", "蜂蜜", "バター", "マーガリン", "レモン汁", "豆板醤", "甜麺醤",
  "ラー油", "塩麹",
].map(normalize);

function isSeasoning(normalizedMaterial) {
  return SEASONING_KEYWORDS.some((keyword) => normalizedMaterial.includes(keyword));
}

// レシピの材料リストと登録済み食材を照合し、マッチ度を算出する。
// 「豚肉」が「豚バラ肉 200g」にマッチするような軽い表記ゆれ対応として、
// 完全一致ではなく正規化後の部分一致（相互includes）を採用する。
// マッチ度は「調味料を除いた主要食材」に対する一致割合として算出する。
function scoreRecipe(recipe, normalizedIngredients) {
  const materials = recipe.recipeMaterial || [];

  const mainMaterials = [];
  const matchedMaterials = [];
  for (const material of materials) {
    const normalizedMaterial = normalize(material);
    if (isSeasoning(normalizedMaterial)) continue;
    mainMaterials.push(material);
    const isMatched = normalizedIngredients.some(
      (ing) => normalizedMaterial.includes(ing) || ing.includes(normalizedMaterial)
    );
    if (isMatched) matchedMaterials.push(material);
  }

  if (mainMaterials.length === 0) {
    return { matchCount: 0, matchRatio: 0, matchedMaterials: [] };
  }

  return {
    matchCount: matchedMaterials.length,
    matchRatio: matchedMaterials.length / mainMaterials.length,
    matchedMaterials,
  };
}

function rankRecipes(recipes, ingredientNames) {
  const normalizedIngredients = ingredientNames.map(normalize).filter(Boolean);

  const seen = new Set();
  const scored = [];
  for (const recipe of recipes) {
    if (!recipe.recipeId || seen.has(recipe.recipeId)) continue;
    seen.add(recipe.recipeId);
    const { matchCount, matchRatio, matchedMaterials } = scoreRecipe(
      recipe,
      normalizedIngredients
    );
    scored.push({
      recipeId: recipe.recipeId,
      title: recipe.recipeTitle,
      imageUrl: recipe.foodImageUrl,
      recipeUrl: recipe.recipeUrl,
      indication: recipe.recipeIndication,
      cost: recipe.recipeCost,
      materials: recipe.recipeMaterial || [],
      matchedMaterials,
      matchCount,
      matchRatio,
    });
  }

  scored.sort((a, b) => b.matchRatio - a.matchRatio || b.matchCount - a.matchCount);
  return scored;
}

module.exports = { rankRecipes };
