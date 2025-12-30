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
    if (s.type === "income") totalIncome += s.amount;
    if (s.type === "expense") totalExpense += s.amount;
  });

  const totalBalance = totalIncome - totalExpense;

  document.getElementById("totalIncome").innerText = formatPeso(totalIncome);
  document.getElementById("totalExpense").innerText = formatPeso(totalExpense);
  document.getElementById("totalBalance").innerText = formatPeso(totalBalance);

  const summaryMap = {};
  primaryTransactions.forEach((t) => {
    if (!summaryMap[t.month])
      summaryMap[t.month] = {
        totalIncome: 0,
        totalExpense: 0,
        balance: 0,
      };
    if (t.type === "income") summaryMap[t.month].totalIncome += t.amount;
    else summaryMap[t.month].totalExpense += t.amount;
    summaryMap[t.month].balance =
      summaryMap[t.month].totalIncome - summaryMap[t.month].totalExpense;
  });

  const sortedEntries = Object.entries(summaryMap).sort(([monthA], [monthB]) =>
    monthA.localeCompare(monthB)
  );

  const months = sortedEntries.map(([month]) => month);
  const incomes = sortedEntries.map(([, s]) => s.totalIncome);
  const expenses = sortedEntries.map(([, s]) => s.totalExpense);
  const balances = sortedEntries.map(([, s]) => s.balance);

  // Populate table
  const table = document.getElementById("summaryTable");
  table.querySelectorAll("tr:not(:first-child)").forEach((r) => r.remove());
  Object.keys(summaryMap)
    .sort()
    .forEach((s) => {
      const row = table.insertRow();
      row.insertCell(0).innerText = s;
      row.insertCell(1).innerText = formatPeso(summaryMap[s].totalIncome);
      row.insertCell(2).innerText = formatPeso(summaryMap[s].totalExpense);
      row.insertCell(3).innerText = formatPeso(summaryMap[s].balance);
    });
  //Banks Table
  const bankTable = document.getElementById("banksBalance");
  banks.forEach((bank) => {
    const row = bankTable.insertRow();
    row.insertCell(0).innerText = bank.name;
    row.insertCell(1).innerText = formatPeso(bank.balance);
  });
  const lastRow = bankTable.insertRow();

  const labelCell = lastRow.insertCell(0);
  labelCell.innerText = "Total";
  labelCell.style.fontWeight = "bold";

  const valueCell = lastRow.insertCell(1);
  valueCell.innerText = formatPeso(
    banks.reduce((acc, bank) => acc + bank.balance, 0)
  );
  valueCell.style.fontWeight = "bold";

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
