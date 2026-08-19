const express = require("express");
const { Pool } = require("pg");
const path = require("path");

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Database connection failed."
    });
  }
});

app.post("/api/products", async (req, res) => {
  const { name, category, price, stock } = req.body;

  if (!name || price === undefined || stock === undefined) {
    return res.status(400).json({
      error: "Name, price and stock are required."
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO products (name, category, price, stock) VALUES ($1, $2, $3, $4) RETURNING id",
      [name, category || "General", Number(price), Number(stock)]
    );

    res.status(201).json({
      id: result.rows[0].id,
      name,
      category: category || "General",
      price: Number(price),
      stock: Number(stock)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Could not add product."
    });
  }
});

app.put("/api/products/:id", async (req, res) => {
  const { name, category, price, stock } = req.body;

  try {
    await pool.query(
      "UPDATE products SET name=$1, category=$2, price=$3, stock=$4 WHERE id=$5",
      [
        name,
        category,
        Number(price),
        Number(stock),
        req.params.id
      ]
    );

    res.json({ message: "Product updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Could not update product."
    });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM products WHERE id=$1",
      [req.params.id]
    );

    res.json({ message: "Product deleted." });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Could not delete product."
    });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Inventory Billing System running on port ${PORT}`);
});
