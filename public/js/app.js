const ingredientForm = document.getElementById("ingredient-form");
const ingredientInput = document.getElementById("ingredient-input");
const ingredientListEl = document.getElementById("ingredient-list");
const searchBtn = document.getElementById("search-recipes-btn");
const recipesMessageEl = document.getElementById("recipes-message");
const recipeListEl = document.getElementById("recipe-list");

async function loadIngredients() {
  const res = await fetch("/api/ingredients");
  const ingredients = await res.json();
  renderIngredients(ingredients);
}

function renderIngredients(ingredients) {
  ingredientListEl.innerHTML = "";
  if (ingredients.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-message";
    li.textContent = "まだ食材が登録されていません";
    ingredientListEl.appendChild(li);
    return;
  }
  for (const ing of ingredients) {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = ing.name;
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "×";
    delBtn.setAttribute("aria-label", `${ing.name}を削除`);
    delBtn.addEventListener("click", () => deleteIngredient(ing.id));
    li.appendChild(span);
    li.appendChild(delBtn);
    ingredientListEl.appendChild(li);
  }
}

async function addIngredient(name) {
  const res = await fetch("/api/ingredients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (res.ok) {
    await loadIngredients();
  }
}

async function deleteIngredient(id) {
  await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
  await loadIngredients();
}

ingredientForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = ingredientInput.value.trim();
  if (!name) return;
  await addIngredient(name);
  ingredientInput.value = "";
  ingredientInput.focus();
});

function renderRecipes(recipes) {
  recipeListEl.innerHTML = "";
  for (const recipe of recipes) {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const img = document.createElement("img");
    img.src = recipe.imageUrl || "";
    img.alt = recipe.title;
    card.appendChild(img);

    const body = document.createElement("div");
    body.className = "recipe-card-body";

    const badge = document.createElement("span");
    badge.className = "match-badge";
    badge.textContent = `マッチ度 ${Math.round(recipe.matchRatio * 100)}%`;
    body.appendChild(badge);

    const title = document.createElement("div");
    title.className = "recipe-title";
    title.textContent = recipe.title;
    body.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "recipe-meta";
    meta.textContent = `調理時間目安：${recipe.indication || "不明"}`;
    body.appendChild(meta);

    const materials = document.createElement("p");
    materials.className = "recipe-materials";
    materials.textContent = `材料：${recipe.materials.join("、")}`;
    body.appendChild(materials);

    const link = document.createElement("a");
    link.className = "recipe-link";
    link.href = recipe.recipeUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "レシピを見る（楽天レシピ）";
    body.appendChild(link);

    card.appendChild(body);
    recipeListEl.appendChild(card);
  }
}

searchBtn.addEventListener("click", async () => {
  recipesMessageEl.textContent = "検索中...";
  recipeListEl.innerHTML = "";
  try {
    const res = await fetch("/api/recipes");
    const data = await res.json();
    if (!res.ok) {
      recipesMessageEl.textContent = data.message || "レシピの取得に失敗しました";
      return;
    }
    recipesMessageEl.textContent =
      data.recipes.length === 0 ? "候補となるレシピが見つかりませんでした" : "";
    renderRecipes(data.recipes);
  } catch (err) {
    recipesMessageEl.textContent = "通信エラーが発生しました";
  }
});

loadIngredients();
