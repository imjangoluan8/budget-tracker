// ===============================
// CONFIG
// ===============================
const BASE_URL = "https://budget-backend-gucg.onrender.com";
const apiUrl = `${BASE_URL}/transactions`;
const summaryUrl = `${BASE_URL}/summary`;
const headers = getBudgetCodeHeaders();

// ===============================
// GLOBAL STATE
// ===============================
let activeFilter = null;

// ===============================
// LOAD NAVIGATION
// ===============================
function loadNav() {
  const navPlaceholder = document.getElementById("nav-placeholder");
  if (!navPlaceholder) return;

  fetch("nav.html")
    .then((res) => res.text())
    .then((html) => (navPlaceholder.innerHTML = html));
}

// ===============================
// FORMAT CURRENCY
// ===============================
function formatPeso(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

// ===============================
// FETCH TRANSACTIONS
// ===============================
async function fetchTransactions() {
  console.log("Fetching transactions. Active filter:", activeFilter);

  const res = await fetch(apiUrl, { headers });
  const data = await res.json();

  // Filter Primary Bank only
  let primaryTransactions = data.filter(
    (t) => t.bankId?.name === "Payroll Bank(RBANK)"
  );

  // Apply month filter
  if (activeFilter) {
    primaryTransactions = primaryTransactions.filter((t) =>
      (t.month || "").startsWith(activeFilter)
    );
  }

  displayTransactions(primaryTransactions);
  calculateSummary(primaryTransactions);
}

// ===============================
// DISPLAY TRANSACTIONS
// ===============================
function displayTransactions(transactions) {
  const table = document.getElementById("transactionTable");
  table.querySelectorAll("tr:not(:first-child)").forEach((r) => r.remove());

  let balance = 0;

  transactions.forEach((t) => {
    const row = table.insertRow();
    row.insertCell(0).innerText = t.bankId?.name || "Payroll Bank(RBANK)";
    row.insertCell(1).innerText = t.type;
    row.insertCell(2).innerText = formatPeso(t.amount);
    row.insertCell(3).innerText = t.month;
    row.insertCell(
      4
    ).innerHTML = `<button onclick="deleteTransaction('${t._id}')">Delete</button>`;

    balance += t.type === "income" ? t.amount : -t.amount;
  });

  document.getElementById("balance").innerText = formatPeso(balance);
}

// ===============================
// ADD TRANSACTION
// ===============================
async function addTransaction() {
  const type = document.getElementById("type").value;
  let amount = document.getElementById("amount").value.replace(/,/g, "");
  amount = parseFloat(amount);
  const month = document.getElementById("month").value;

  if (isNaN(amount) || !month) {
    alert("Fill all fields");
    return;
  }

  await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ type, amount, month }),
  });

  closeModal();
  fetchTransactions();
}

// ===============================
// DELETE TRANSACTION
// ===============================
async function deleteTransaction(id) {
  await fetch(`${apiUrl}/${id}`, { method: "DELETE", headers });
  fetchTransactions();
}

// ===============================
// CALCULATE SUMMARY (NO EXTRA API CALL)
// ===============================
function calculateSummary(transactions) {
  const summaryMap = {};

  transactions.forEach((t) => {
    if (!summaryMap[t.month]) {
      summaryMap[t.month] = {
        totalIncome: 0,
        totalExpense: 0,
      };
    }

    if (t.type === "income") {
      summaryMap[t.month].totalIncome += t.amount;
    } else {
      summaryMap[t.month].totalExpense += t.amount;
    }
  });

  const table = document.getElementById("summaryTable");
  table.querySelectorAll("tr:not(:first-child)").forEach((r) => r.remove());

  Object.keys(summaryMap)
    .sort()
    .forEach((month) => {
      const row = table.insertRow();
      const income = summaryMap[month].totalIncome;
      const expense = summaryMap[month].totalExpense;
      const balance = income - expense;

      row.insertCell(0).innerText = month;
      row.insertCell(1).innerText = formatPeso(income);
      row.insertCell(2).innerText = formatPeso(expense);
      row.insertCell(3).innerText = formatPeso(balance);
    });
}

// ===============================
// FILTER CONTROLS
// ===============================
function initFilters() {
  const filterInput = document.getElementById("filterMonthYear");
  const applyBtn = document.getElementById("applyFilterBtn");
  const clearBtn = document.getElementById("clearFilterBtn");

  applyBtn.addEventListener("click", () => {
    activeFilter = filterInput.value || null;
    fetchTransactions();
  });

  clearBtn.addEventListener("click", () => {
    filterInput.value = "";
    activeFilter = null;
    fetchTransactions();
  });
}

// ===============================
// MODAL CONTROLS
// ===============================
function initModal() {
  const modal = document.getElementById("transactionModal");
  const openBtn = document.getElementById("openModalBtn");
  const closeBtn = document.querySelector(".close");
  const amountInput = document.getElementById("amount");
  const monthInput = document.getElementById("month");

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;

  openBtn.onclick = () => {
    modal.style.display = "block";
    amountInput.value = "0";
    monthInput.value = currentMonth;
  };

  closeBtn.onclick = closeModal;

  window.onclick = (e) => {
    if (e.target === modal) closeModal();
  };

  // Format amount with commas
  amountInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/,/g, "");
    if (!isNaN(value) && value !== "") {
      e.target.value = parseInt(value).toLocaleString("en-PH");
    } else {
      e.target.value = "";
    }
  });
}

function closeModal() {
  document.getElementById("transactionModal").style.display = "none";
}

// ===============================
// INITIALIZE EVERYTHING
// ===============================
window.addEventListener("DOMContentLoaded", () => {
  loadNav();
  initFilters();
  initModal();

  const filterInput = document.getElementById("filterMonthYear");

  if (filterInput) {
    const today = new Date();
    const currentMonth = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    filterInput.value = currentMonth;
    activeFilter = currentMonth;
  } else {
    console.warn("filterMonthYear input not found");
  }

  fetchTransactions();
});
