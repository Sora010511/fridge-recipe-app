const { normalize } = require("./normalize");

// レシピの材料リストと登録済み食材を照合し、マッチ度を算出する。
// 「豚肉」が「豚バラ肉 200g」にマッチするような軽い表記ゆれ対応として、
// 完全一致ではなく正規化後の部分一致（相互includes）を採用する。
function scoreRecipe(recipe, normalizedIngredients) {
  const materials = recipe.recipeMaterial || [];
  if (materials.length === 0) {
    return { matchCount: 0, matchRatio: 0, matchedMaterials: [] };
  }

  const matchedMaterials = [];
  for (const material of materials) {
    const normalizedMaterial = normalize(material);
    const isMatched = normalizedIngredients.some(
      (ing) => normalizedMaterial.includes(ing) || ing.includes(normalizedMaterial)
    );
    if (isMatched) matchedMaterials.push(material);
  }

  return {
    matchCount: matchedMaterials.length,
    matchRatio: matchedMaterials.length / materials.length,
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
