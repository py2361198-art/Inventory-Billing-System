const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "inventory_billing",
  waitForConnections: true,
  connectionLimit: 10
});

app.get("/api/products", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM products ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database connection failed. Check MySQL setup." });
  }
});

app.post("/api/products", async (req, res) => {
  const { name, category, price, stock } = req.body;
  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({ error: "Name, price and stock are required." });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO products (name, category, price, stock) VALUES (?, ?, ?, ?)",
      [name, category || "General", Number(price), Number(stock)]
    );
    res.status(201).json({ id: result.insertId, name, category: category || "General", price, stock });
  } catch (err) {
    res.status(500).json({ error: "Could not add product." });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { name, category, price, stock } = req.body;
  try {
    await pool.query(
      "UPDATE products SET name=?, category=?, price=?, stock=? WHERE id=?",
      [name, category, Number(price), Number(stock), req.params.id]
    );
    res.json({ message: "Product updated." });
  } catch (err) {
    res.status(500).json({ error: "Could not update product." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE id=?", [req.params.id]);
    res.json({ message: "Product deleted." });
  } catch (err) {
    res.status(500).json({ error: "Could not delete product." });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Inventory Billing System running at http://localhost:${PORT}`);
});