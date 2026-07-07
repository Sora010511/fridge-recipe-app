const express = require("express");
const db = require("../db");
const { fetchCandidateRecipes, RakutenNotConfiguredError } = require("../rakutenClient");
const { rankRecipes } = require("../matching");

const router = express.Router();

router.get("/", async (req, res) => {
  const ingredients = db.prepare("SELECT name FROM ingredients").all().map((r) => r.name);

  const categoryLimit = Number(process.env.RECIPE_CATEGORY_LIMIT) || 20;

  try {
    const candidates = await fetchCandidateRecipes(categoryLimit);
    const ranked = rankRecipes(candidates, ingredients);
    res.json({ recipes: ranked });
  } catch (err) {
    if (err instanceof RakutenNotConfiguredError) {
      return res.status(503).json({
        error: "RAKUTEN_APP_ID_MISSING",
        message:
          "楽天レシピAPIのアプリIDが未設定です。README.mdの手順に従って .env に RAKUTEN_APP_ID を設定してください。",
      });
    }
    console.error(err);
    res.status(502).json({ error: "RAKUTEN_API_ERROR", message: "レシピ情報の取得に失敗しました" });
  }
});

module.exports = router;
