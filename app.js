let products = [];

async function loadProducts() {
  const res = await fetch("/api/products");
  products = await res.json();
  render();
}

function render() {
  const q = document.getElementById("search").value.toLowerCase();
  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    (p.category || "").toLowerCase().includes(q)
  );

  document.getElementById("totalProducts").textContent = products.length;
  document.getElementById("totalStock").textContent =
    products.reduce((sum, p) => sum + Number(p.stock), 0);
  document.getElementById("inventoryValue").textContent =
    "₹" + products.reduce((sum, p) => sum + Number(p.price) * Number(p.stock), 0).toFixed(2);

  const tbody = document.getElementById("productTable");
  tbody.innerHTML = filtered.length ? filtered.map(p => `
    <tr>
      <td>${escapeHtml(p.name)}</td>
      <td>${escapeHtml(p.category || "General")}</td>
      <td>₹${Number(p.price).toFixed(2)}</td>
      <td class="${Number(p.stock) < 10 ? "low" : ""}">${p.stock}</td>
      <td><button class="delete" onclick="deleteProduct(${p.id})">Delete</button></td>
    </tr>
  `).join("") : `<tr><td colspan="5" class="empty">No products found</td></tr>`;
}

document.getElementById("productForm").addEventListener("submit", async e => {
  e.preventDefault();
  const body = {
    name: document.getElementById("name").value.trim(),
    category: document.getElementById("category").value.trim(),
    price: document.getElementById("price").value,
    stock: document.getElementById("stock").value
  };
  const res = await fetch("/api/products", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  const data = await res.json();
  document.getElementById("message").textContent = data.error || "Product added successfully.";
  if (res.ok) {
    e.target.reset();
    loadProducts();
  }
});

async function deleteProduct(id) {
  if (!confirm("Delete this product?")) return;
  await fetch(`/api/products/${id}`, {method:"DELETE"});
  loadProducts();
}

document.getElementById("search").addEventListener("input", render);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

loadProducts().catch(() => {
  document.getElementById("message").textContent =
    "Start the Node.js server and MySQL database to use the app.";
});