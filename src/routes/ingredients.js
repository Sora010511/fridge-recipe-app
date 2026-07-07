const express = require("express");
const db = require("../db");
const { normalize } = require("../normalize");

const router = express.Router();

router.get("/", (req, res) => {
  const rows = db
    .prepare("SELECT id, name, created_at FROM ingredients ORDER BY created_at DESC, id DESC")
    .all();
  res.json(rows);
});

router.post("/", (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) {
    return res.status(400).json({ error: "NAME_REQUIRED", message: "食材名を入力してください" });
  }
  const normalized = normalize(name);
  const result = db
    .prepare("INSERT INTO ingredients (name, normalized_name) VALUES (?, ?)")
    .run(name, normalized);
  const created = db
    .prepare("SELECT id, name, created_at FROM ingredients WHERE id = ?")
    .get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "INVALID_ID" });
  }
  const result = db.prepare("DELETE FROM ingredients WHERE id = ?").run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: "NOT_FOUND" });
  }
  res.status(204).end();
});

module.exports = router;
