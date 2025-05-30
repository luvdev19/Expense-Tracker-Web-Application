let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editingId = null;

function addTransaction() {
  const date = document.getElementById("date").value;
  const description = document.getElementById("description").value.trim();
  const category = document.getElementById("category").value;
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const error = document.getElementById("error");

  if (!date || !description || !category || isNaN(amount) || amount <= 0) {
    error.textContent = "Please enter all fields with valid values.";
    return;
  }

  error.textContent = "";

  if (editingId) {
    transactions = transactions.map(t =>
      t.id === editingId ? { ...t, date, description, category, amount, type } : t
    );
    editingId = null;
  } else {
    const transaction = {
      id: Date.now(),
      date,
      description,
      category,
      amount,
      type
    };
    transactions.push(transaction);
  }

  localStorage.setItem("transactions", JSON.stringify(transactions));
  clearForm();
  renderTransactions();
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem("transactions", JSON.stringify(transactions));
  renderTransactions();
}

function editTransaction(id) {
  const tx = transactions.find(t => t.id === id);
  if (tx) {
    document.getElementById("date").value = tx.date;
    document.getElementById("description").value = tx.description;
    document.getElementById("category").value = tx.category;
    document.getElementById("amount").value = tx.amount;
    document.getElementById("type").value = tx.type;
    editingId = id;
  }
}

function clearForm() {
  document.getElementById("date").value = "";
  document.getElementById("description").value = "";
  document.getElementById("category").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("type").value = "income";
}

function renderTransactions() {
  const list = document.getElementById("transactionList");
  const incomeDisplay = document.getElementById("totalIncome");
  const expenseDisplay = document.getElementById("totalExpense");
  const netDisplay = document.getElementById("netIncome");

  const filter = document.getElementById("filterCategory").value;
  const filteredTx = filter === "All" ? transactions : transactions.filter(t => t.category === filter);

  list.innerHTML = "";

  let income = 0;
  let expense = 0;

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  });

  filteredTx.forEach(tx => {
    const li = document.createElement("li");
    li.classList.add(tx.type);

    li.innerHTML = `
      <span>${tx.date} - ${tx.description} (${tx.category}): ${formatter.format(tx.amount)}</span>
      <div>
        <button onclick="editTransaction(${tx.id})">✏️</button>
        <button onclick="deleteTransaction(${tx.id})">❌</button>
      </div>
    `;

    list.appendChild(li);

    if (tx.type === "income") {
      income += tx.amount;
    } else {
      expense += tx.amount;
    }
  });

  incomeDisplay.textContent = formatter.format(income);
  expenseDisplay.textContent = formatter.format(expense);
  netDisplay.textContent = formatter.format(income - expense);

  updateChart();
}

function updateChart() {
  const ctx = document.getElementById('expenseChart').getContext('2d');
  const expenseCategories = {};

  transactions.forEach(tx => {
    if (tx.type === 'expense') {
      expenseCategories[tx.category] = (expenseCategories[tx.category] || 0) + tx.amount;
    }
  });

  const chartData = {
    labels: Object.keys(expenseCategories),
    datasets: [{
      data: Object.values(expenseCategories),
      backgroundColor: ['#ff6384', '#36a2eb', '#ffcd56', '#4bc0c0', '#9966ff']
    }]
  };

  if (window.expenseChart) {
    window.expenseChart.data = chartData;
    window.expenseChart.update();
  } else {
    window.expenseChart = new Chart(ctx, {
      type: 'pie',
      data: chartData
    });
  }
}

function exportData() {
  const dataStr = JSON.stringify(transactions, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "transactions.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        transactions = data;
        localStorage.setItem("transactions", JSON.stringify(transactions));
        renderTransactions();
      } else {
        alert("Invalid file format");
      }
    } catch {
      alert("Failed to read file");
    }
  };
  reader.readAsText(file);
}

window.onload = renderTransactions;
