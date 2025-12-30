const BASE_URL = "https://budget-backend-gucg.onrender.com";
const summaryUrl = `${BASE_URL}/summary`;

const banksUrl = `${BASE_URL}/banks`;

const transactionUrl = `${BASE_URL}/transactions`;

// Format Philippine Peso
function formatPeso(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

async function fetchSummary() {
  const headers = getBudgetCodeHeaders();

  const res = await fetch(summaryUrl, { headers });
  const summary = await res.json();

  const banksRes = await fetch(banksUrl, { headers });
  const banks = await banksRes.json();

  const transactionsRes = await fetch(transactionUrl, { headers });
  const transactions = await transactionsRes.json();

  console.log(transactions);
  const primaryTransactions = transactions.filter(
    (t) => t.bankId?.name === "Payroll Bank(RBANK)"
  );
  // Total income, expense, balance
  let totalIncome = 0,
    totalExpense = 0;
  primaryTransactions.forEach((s) => {
    console.log(s);
    console.log(s.type, s.amount, typeof s.amount);
    // if (s.type === "income") totalIncome += s.amount;
    // else if (s.type === "expense") totalExpense += s.amount;
  });

  //   console.log(primaryTransactions);
  const totalBalance = totalIncome - totalExpense;

  document.getElementById("totalIncome").innerText = formatPeso(totalIncome);
  document.getElementById("totalExpense").innerText = formatPeso(totalExpense);
  document.getElementById("totalBalance").innerText = formatPeso(totalBalance);

  const months = summary.map((s) => s.month);
  const incomes = summary.map((s) => s.totalIncome);
  const expenses = summary.map((s) => s.totalExpense);
  const balances = summary.map((s) => s.balance);

  // Populate table
  const table = document.getElementById("summaryTable");
  table.querySelectorAll("tr:not(:first-child)").forEach((r) => r.remove());
  summary.forEach((s) => {
    const row = table.insertRow();
    row.insertCell(0).innerText = s.month;
    row.insertCell(1).innerText = formatPeso(s.totalIncome);
    row.insertCell(2).innerText = formatPeso(s.totalExpense);
    row.insertCell(3).innerText = formatPeso(s.balance);
  });

  // Charts
  const ctx1 = document.getElementById("incomeExpenseChart").getContext("2d");
  new Chart(ctx1, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Income",
          data: incomes,
          backgroundColor: "rgba(54, 162, 235, 0.7)",
        },
        {
          label: "Expense",
          data: expenses,
          backgroundColor: "rgba(255, 99, 132, 0.7)",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
      scales: { y: { beginAtZero: true } },
    },
  });

  const ctx2 = document.getElementById("balanceChart").getContext("2d");
  new Chart(ctx2, {
    type: "line",
    data: {
      labels: months,
      datasets: [
        {
          label: "Balance",
          data: balances,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          fill: true,
          tension: 0.2,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "top" } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

// Initial load
fetch("nav.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("nav-placeholder").innerHTML = html;
  });
fetchSummary();
