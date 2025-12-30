// budgetCode.js

document.addEventListener("DOMContentLoaded", () => {
  // --- Budget App Code Handling ---
  let budgetCode = localStorage.getItem("budgetCode");

  // Force entering a code if empty
  while (!budgetCode) {
    budgetCode = prompt("Please enter your Budget App Code first:");
    if (budgetCode) localStorage.setItem("budgetCode", budgetCode);
  }

  // Display the code in the UI
  const codeDisplay = document.getElementById("budgetCodeDisplay");
  if (codeDisplay) codeDisplay.innerText = budgetCode;

  // Clear/reset button
  const clearBtn = document.getElementById("clearBudgetCode");
  if (clearBtn) {
    clearBtn.onclick = () => {
      localStorage.removeItem("budgetCode");
      location.reload(); // reload page to force re-entering code
    };
  }

  // Expose headers function globally
  window.getBudgetCodeHeaders = () => {
    if (!budgetCode) {
      alert("Please enter your Budget App Code first!");
      throw new Error("Budget code not set");
    }
    return { "Content-Type": "application/json", "x-budget-code": budgetCode };
  };

  // Load nav
  const navPlaceholder = document.getElementById("nav-placeholder");
  if (navPlaceholder) {
    fetch("nav.html")
      .then((res) => res.text())
      .then((html) => (navPlaceholder.innerHTML = html));
  }
});
