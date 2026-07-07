require("dotenv").config();
const path = require("path");
const express = require("express");

const ingredientsRouter = require("./src/routes/ingredients");
const recipesRouter = require("./src/routes/recipes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/ingredients", ingredientsRouter);
app.use("/api/recipes", recipesRouter);

app.listen(PORT, () => {
  console.log(`冷蔵庫レシピ提案アプリ: http://localhost:${PORT} で起動しました`);
});
