loadNav();
function loadNav() {
  const navPlaceholder = document.getElementById("nav-placeholder");
  if (!navPlaceholder) return;
  fetch("nav.html")
    .then((res) => res.text())
    .then((html) => (navPlaceholder.innerHTML = html));
}
const initBalance = document.getElementById("accountBalance");
const openAddModalBtn = document.getElementById("openAddModalBtn");
const modal = document.getElementById("addBankModal");

openAddModalBtn.onclick = () => {
  modal.style.display = "block";
  // Set default values
  initBalance.value = "0";
};
let budgetCode = localStorage.getItem("budgetCode");

const BASE_URL = "https://budget-backend-gucg.onrender.com";
const apiUrl = `${BASE_URL}/banks`;
const transactionUrl = `${BASE_URL}/transactions`;
let banks = [];
let sourceBankId = null;

// Modal logic
const addModal = document.getElementById("addBankModal");
const transferModal = document.getElementById("transferModal");
const ledgerModal = document.getElementById("ledgerModal");

// document.getElementById("openAddModalBtn").onclick = ()=>addModal.style.display="block";
document.getElementsByClassName("close")[0].onclick = () =>
  (addModal.style.display = "none");
document.getElementById("closeTransfer").onclick = () =>
  (transferModal.style.display = "none");
document.getElementById("closeLedger").onclick = () =>
  (ledgerModal.style.display = "none");
window.onclick = (e) => {
  if (e.target == addModal) addModal.style.display = "none";
  if (e.target == transferModal) transferModal.style.display = "none";
  if (e.target == ledgerModal) ledgerModal.style.display = "none";
};

function formatPeso(amount) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Add commas while typing
document.getElementById("accountBalance").addEventListener("input", (e) => {
  let v = e.target.value.replace(/,/g, "");
  if (!isNaN(v) && v !== "") {
    e.target.value = parseInt(v).toLocaleString("en-PH");
  } else e.target.value = "";
});
document.getElementById("transferAmount").addEventListener("input", (e) => {
  let v = e.target.value.replace(/,/g, "");
  if (!isNaN(v) && v !== "") {
    e.target.value = parseInt(v).toLocaleString("en-PH");
  } else e.target.value = "";
});

// Fetch banks
async function fetchBanks() {
  const headers = getBudgetCodeHeaders();
  const res = await fetch(apiUrl, { headers });
  banks = await res.json();
  displayBanks();
}

function displayBanks() {
  const table = document.getElementById("bankTable");
  table.querySelectorAll("tr:not(:first-child)").forEach((r) => r.remove());

  banks.forEach((acc) => {
    const row = table.insertRow();
    row.insertCell(0).innerText = acc.name;
    row.insertCell(1).innerText = formatPeso(acc.balance);
    row.insertCell(2).innerHTML = `
            ${
              acc.name === "Payroll Bank(RBANK)"
                ? ""
                : `<button onclick="deleteAccount('${acc._id}')">Delete</button>`
            }
            <button onclick="openTransfer('${acc._id}','${
      acc.name
    }')">Transfer</button>
            ${
              acc.name !== "Payroll Bank(RBANK)"
                ? `<button onclick="openLedger('${acc._id}')">View Ledger</button>`
                : ""
            }
        `;
  });
}

// Add account
async function addAccount() {
  const name = document.getElementById("accountName").value;
  let balance = document
    .getElementById("accountBalance")
    .value.replace(/,/g, "");
  balance = parseFloat(balance);

  if (!name || isNaN(balance)) return alert("Fill all fields");
  const headers = getBudgetCodeHeaders();

  // 1️⃣ Create bank
  const bankRes = await fetch(apiUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ name, balance }),
  });

  const newBank = await bankRes.json();

  // 2️⃣ If initial balance > 0, create income transaction
  if (balance > 0) {
    const today = new Date();
    const month = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;
    const headers = getBudgetCodeHeaders();

    await fetch(transactionUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        type: "income",
        amount: balance,
        month,
        bankId: newBank._id,
        sourceName: "Initial Balance",
        destName: newBank.name,
        isLedger: true,
      }),
    });
  }

  // Reset + refresh
  addModal.style.display = "none";
  document.getElementById("accountName").value = "";
  document.getElementById("accountBalance").value = "0";
  fetchBanks();
}

// Delete account
async function deleteAccount(id) {
  const headers = getBudgetCodeHeaders();

  await fetch(`${apiUrl}/${id}`, { method: "DELETE", headers });
  fetchBanks();
}

// Open transfer modal
function openTransfer(id, name) {
  sourceBankId = id;
  document.getElementById("sourceBankName").innerText = name;
  const destSelect = document.getElementById("destinationBank");
  const amountInput = document.getElementById("transferAmount");
  amountInput.value = 0;
  // Get current month in YYYY-MM format
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}`;
  const month = document.getElementById("transferMonth");
  month.value = currentMonth;
  destSelect.innerHTML = "";
  banks
    .filter((b) => b._id !== id)
    .forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b._id;
      opt.innerText = b.name;
      destSelect.appendChild(opt);
    });
  transferModal.style.display = "block";
}

// Submit transfer (creates two transactions)
async function submitTransfer() {
  const destId = document.getElementById("destinationBank").value;
  let amount = document
    .getElementById("transferAmount")
    .value.replace(/,/g, "");
  amount = parseFloat(amount);
  const month = document.getElementById("transferMonth").value;
  if (!amount || !destId || !month) return alert("Fill all fields");

  const source = banks.find((b) => b._id === sourceBankId);
  if (amount > source.balance) return alert("Insufficient balance");
  const dest = banks.find((b) => b._id === destId);

  // // Update balances
  // await fetch(`${apiUrl}/${sourceBankId}`,{
  //     method:'PATCH',
  //     headers:{'Content-Type':'application/json'},
  //     body:JSON.stringify({ balance: source.balance - amount })
  // });
  // await fetch(`${apiUrl}/${destId}`,{
  //     method:'PATCH',
  //     headers:{'Content-Type':'application/json'},
  //     body:JSON.stringify({ balance: dest.balance + amount })
  // });

  // Create two transactions
  const transactionsToCreate = [
    {
      type: "expense",
      amount,
      month,
      bankId: source._id,
      sourceName: source.name,
      destName: dest.name,
      isLedger: source.name !== "Payroll Bank(RBANK)", // non-primary source
    },
    {
      type: "income",
      amount,
      month,
      bankId: dest._id,
      sourceName: source.name,
      destName: dest.name,
      isLedger: dest.name !== "Payroll Bank(RBANK)", // non-primary destination
    },
  ];
  const headers = getBudgetCodeHeaders();

  await fetch("http://localhost:3000/transfer", {
    method: "POST",
    headers,
    body: JSON.stringify({
      sourceId: source._id,
      destId: dest._id,
      amount,
      month,
    }),
  });

  transferModal.style.display = "none";
  document.getElementById("transferAmount").value = "";
  document.getElementById("transferMonth").value = "";
  fetchBanks();
}

// Open Ledger for a specific bank
async function openLedger(bankId) {
  const headers = getBudgetCodeHeaders();

  const res = await fetch(transactionUrl, { headers });
  const transactions = await res.json();

  const ledgerTable = document.getElementById("ledgerTable");
  ledgerTable
    .querySelectorAll("tr:not(:first-child)")
    .forEach((r) => r.remove());

  const bank = banks.find((b) => b._id === bankId);
  console.log(transactions);
  transactions.forEach((t) => {
    if (t.isLedger && t.bankId._id === bankId) {
      console.log(t);
      const row = ledgerTable.insertRow();
      row.insertCell(0).innerText = t.sourceName;
      row.insertCell(1).innerText = t.destName;
      row.insertCell(2).innerText = formatPeso(t.amount);
      row.insertCell(3).innerText = t.month;
      row.insertCell(4).innerText = t.type;
    }
  });

  ledgerModal.style.display = "block";
}

// Initial load
fetch("nav.html")
  .then((res) => res.text())
  .then((html) => {
    document.getElementById("nav-placeholder").innerHTML = html;
  });
fetchBanks();
