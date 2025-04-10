let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

const form = document.getElementById("transaction-form");
const list = document.getElementById("transaction-list");
const totalIncome = document.getElementById("total-income");
const totalExpenses = document.getElementById("total-expenses");
const netBalance = document.getElementById("net-balance");
const filterCategory = document.getElementById("filter-category");
const chartCanvas = document.getElementById("expense-chart");
const exportBtn = document.getElementById("export-btn");
const importInput = document.getElementById("import-input");

let chart;

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const date = document.getElementById("date").value;
  const description = document.getElementById("description").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const category = document.getElementById("category").value;

  if (!date || !description || isNaN(amount) || !category) {
    alert("Please fill in all fields with valid data.");
    return;
  }

  const transaction = {
    id: Date.now(),
    date,
    description,
    amount,
    category,
  };

  transactions.push(transaction);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  form.reset();
  updateUI();
});

function updateUI() {
  list.innerHTML = "";
  const filtered = filterCategory.value === "All"
    ? transactions
    : transactions.filter(t => t.category === filterCategory.value);

  filtered.forEach((t) => {
    const li = document.createElement("li");
    li.innerHTML = `${t.date} - ${t.description} - ₹${t.amount} - ${t.category}
      <button class="edit-btn" onclick="editTransaction(${t.id})">Edit</button>
      <button class="delete-btn" onclick="deleteTransaction(${t.id})">Delete</button>`;
    list.appendChild(li);
  });

  const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0);

  totalIncome.textContent = income.toFixed(2);
  totalExpenses.textContent = Math.abs(expenses).toFixed(2);
  netBalance.textContent = (income + expenses).toFixed(2);

  updateChart();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  updateUI();
}

function editTransaction(id) {
  const transaction = transactions.find(t => t.id === id);
  if (transaction) {
    document.getElementById("date").value = transaction.date;
    document.getElementById("description").value = transaction.description;
    document.getElementById("amount").value = transaction.amount;
    document.getElementById("category").value = transaction.category;
    deleteTransaction(id);
  }
}

filterCategory.addEventListener("change", updateUI);

function updateChart() {
  const expenseData = transactions.filter(t => t.amount < 0);
  const categoryTotals = {};

  expenseData.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        label: "Expenses by Category",
        data: data,
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"]
      }]
    }
  });
}

// Export
exportBtn.addEventListener("click", () => {
  const dataStr = JSON.stringify(transactions, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.json";
  a.click();
  URL.revokeObjectURL(url);
});

// Import
importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    try {
      const importedData = JSON.parse(event.target.result);
      if (Array.isArray(importedData)) {
        transactions = importedData;
        localStorage.setItem("transactions", JSON.stringify(transactions));
        updateUI();
      } else {
        alert("Invalid JSON format");
      }
    } catch {
      alert("Failed to parse file. Please upload a valid JSON file.");
    }
  };
  reader.readAsText(file);
});

updateUI();
