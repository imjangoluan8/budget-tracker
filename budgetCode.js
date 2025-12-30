// budgetCode.js

// --- Budget App Code Handling ---
let budgetCode = localStorage.getItem("budgetCode");

if (!budgetCode) {
  // Loop until user enters a non-empty value
  do {
    budgetCode = prompt("Enter your Budget App Code:");
  } while (!budgetCode); // repeats if budgetCode is null or empty string

  localStorage.setItem("budgetCode", budgetCode);
}
const codeInput = document.getElementById("budgetCodeInput");
const setCodeBtn = document.getElementById("setCodeBtn");
const clearCodeBtn = document.getElementById("clearCodeBtn");
const currentCodeDisplay = document.getElementById("currentCode");

// Function to display current code
function displayCode() {
  if (!currentCodeDisplay || !codeInput || !setCodeBtn) return;

  if (budgetCode) {
    currentCodeDisplay.innerText = "Current Code: " + budgetCode;
    codeInput.style.display = "none";
    setCodeBtn.style.display = "none";
  } else {
    currentCodeDisplay.innerText = "";
    codeInput.style.display = "inline-block";
    setCodeBtn.style.display = "inline-block";
  }
}
displayCode();

// Set code
if (setCodeBtn) {
  setCodeBtn.onclick = () => {
    const val = codeInput.value.trim();
    if (!val) return alert("Budget App Code cannot be empty");
    budgetCode = val;
    localStorage.setItem("budgetCode", budgetCode);
    displayCode();

    // Call a page-specific function if exists
    if (typeof reloadPageData === "function") reloadPageData();
  };
}

// Clear / Reset code
if (clearCodeBtn) {
  clearCodeBtn.onclick = () => {
    localStorage.removeItem("budgetCode");
    budgetCode = null;
    displayCode();

    // Clear tables if exists
    const transactionTable = document.getElementById("transactionTable");
    const summaryTable = document.getElementById("summaryTable");
    if (transactionTable)
      transactionTable
        .querySelectorAll("tr:not(:first-child)")
        .forEach((r) => r.remove());
    if (summaryTable)
      summaryTable
        .querySelectorAll("tr:not(:first-child)")
        .forEach((r) => r.remove());
  };
}

// Function to get headers for fetch requests
function getBudgetCodeHeaders() {
  if (!budgetCode) {
    alert("Please enter your Budget App Code first!");
    throw new Error("Budget code not set");
  }
  return { "Content-Type": "application/json", "x-budget-code": budgetCode };
}

function loadNav() {
  const navPlaceholder = document.getElementById("nav-placeholder");
  if (!navPlaceholder) return;
  fetch("nav.html")
    .then((res) => res.text())
    .then((html) => (navPlaceholder.innerHTML = html));
}
