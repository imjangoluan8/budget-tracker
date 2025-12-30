// budgetCode.js

// --- Budget App Code Handling ---
// Make budgetCode global
window.budgetCode = localStorage.getItem("budgetCode");

// Force entering a code if empty
while (!window.budgetCode) {
  window.budgetCode = prompt("Please enter your Budget App Code first:");
  if (window.budgetCode) {
    localStorage.setItem("budgetCode", window.budgetCode);
  }
}

// Display the code in the UI
const codeDisplay = document.getElementById("budgetCodeDisplay");
codeDisplay.innerText = window.budgetCode;

// Clear/reset button
document.getElementById("clearBudgetCode").onclick = () => {
  localStorage.removeItem("budgetCode");
  location.reload(); // reload page to force re-entering code
};

// Function to get headers for fetch requests
function getBudgetCodeHeaders() {
  if (!window.budgetCode) {
    alert("Please enter your Budget App Code first!");
    throw new Error("Budget code not set");
  }
  return {
    "Content-Type": "application/json",
    "x-budget-code": window.budgetCode,
  };
}

function loadNav() {
  const navPlaceholder = document.getElementById("nav-placeholder");
  if (!navPlaceholder) return;
  fetch("nav.html")
    .then((res) => res.text())
    .then((html) => (navPlaceholder.innerHTML = html));
}
