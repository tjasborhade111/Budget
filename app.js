const transactionForm = document.getElementById("transaction-form");
const transactionContainer = document.getElementById("transaction-container");
let transactions = [];
const LOCAL_STORAGE_KEY = "budgetingToolTransactions";

// Load Transactions from LocalStorage
function loadTransactions() {
  const savedTransactions = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (savedTransactions) {
    transactions = JSON.parse(savedTransactions);
    renderTransactions();
  }
}

// Save Transactions to LocalStorage
function saveTransactions() {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(transactions));
}

// Add Transaction
function addTransaction(description, amount, contributions) {
  const transaction = {
    id: Date.now(),
    description,
    amount: parseFloat(amount),
    contributors: contributions.map((contribution) => ({
      id: Date.now() + Math.random(),
      name: contribution.name,
      amount: parseFloat(contribution.amount),
    })),
  };

  transactions.push(transaction);
  saveTransactions();
  renderTransactions();
}

// Parse Contributions
function parseContributions(contributionsStr, amount, description) {
  let contributions = [];
  let totalContributed = 0;

  if (contributionsStr) {
    contributions = contributionsStr.split(",").map((item) => {
      const [name, amt] = item.split("-").map((val) => val.trim());
      const parsedAmt = parseFloat(amt);
      if (!name || isNaN(parsedAmt)) {
        throw new Error("Invalid format. Use 'Name-Amount'.");
      }
      totalContributed += parsedAmt;
      return { name, amount: parsedAmt };
    });
  } else {
    const names = description.split(",").map((n) => n.trim());
    const splitAmt = amount / names.length;
    contributions = names.map((name) => ({ name, amount: parseFloat(splitAmt.toFixed(2)) }));
    totalContributed = amount;
    return { contributions, totalContributed };
  }

  if (totalContributed < amount) {
    const remaining = amount - totalContributed;

    // Get unique contributor names
    const existingNames = contributions.map((c) => c.name.toLowerCase());
    const allNames = description.split(",").map((n) => n.trim());

    const missingNames = allNames.filter((name) => !existingNames.includes(name.toLowerCase()));

    if (missingNames.length === 0) {
      throw new Error("Total contribution is less than required, and no new names to split the remaining amount.");
    }

    const splitAmount = parseFloat((remaining / missingNames.length).toFixed(2));
    missingNames.forEach((name) => {
      contributions.push({ name, amount: splitAmount });
      totalContributed += splitAmount;
    });
  }

  return { contributions, totalContributed };
}


// Handle Form Submission
transactionForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const description = document.getElementById("description").value.trim();
  const amount = parseFloat(document.getElementById("amount").value.trim());
  const contributionsStr = document.getElementById("individual-contributions").value.trim();

  if (!description || isNaN(amount)) {
    alert("Please enter valid details!");
    return;
  }

  try {
    const { contributions, totalContributed } = parseContributions(contributionsStr, amount, description);
    if (totalContributed !== amount) {
      alert(`The total contributions (${totalContributed}) do not match the total amount (${amount}).`);
      return;
    }
    addTransaction(description, amount, contributions);
    transactionForm.reset();
  } catch (error) {
    alert(error.message);
  }
});

// Render Transactions
function renderTransactions() {
  transactionContainer.innerHTML = "";

  transactions.forEach((transaction) => {
    const transactionGroup = document.createElement("div");
    transactionGroup.classList.add("transaction-group");

    let contributorsHTML = transaction.contributors
      .map(
        (contributor) => `
        <div>
          <p><strong>${contributor.name}:</strong> ₹${contributor.amount}</p>
          <button class="delete-contributor-btn" onclick="deleteContributor(${transaction.id}, ${contributor.id})">Delete</button>
        </div>`
      )
      .join("");

    transactionGroup.innerHTML = `
      <p><strong>Description:</strong> ${transaction.description}</p>
      <p><strong>Total Amount:</strong> ₹${transaction.amount}</p>
      <div class="transaction-actions">
        ${contributorsHTML}
        <canvas id="chart-${transaction.id}" class="transaction-chart" style="display: none;"></canvas>
        <button class="view-chart-btn" onclick="toggleChart(${transaction.id})">View Chart</button>
        <button class="delete-btn" onclick="deleteTransaction(${transaction.id})">Delete Transaction</button>
      </div>
    `;

    transactionContainer.appendChild(transactionGroup);
  });
}

// Delete Contributor
function deleteContributor(transactionId, contributorId) {
  const transaction = transactions.find((t) => t.id === transactionId);
  if (transaction) {
    transaction.contributors = transaction.contributors.filter((c) => c.id !== contributorId);
    if (transaction.contributors.length === 0) {
      transactions = transactions.filter((t) => t.id !== transactionId);
    }
    saveTransactions();
    renderTransactions();
  }
}

// Delete Entire Transaction
function deleteTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);
  saveTransactions();
  renderTransactions();
}

// Toggle Chart Visibility
function toggleChart(transactionId) {
  const chartCanvas = document.getElementById(`chart-${transactionId}`);
  if (chartCanvas.style.display === "none" || chartCanvas.style.display === "") {
    chartCanvas.style.display = "block";
    renderChart(transactionId, chartCanvas);
  } else {
    chartCanvas.style.display = "none";
  }
}

// Render Chart for Individual Transaction
function renderChart(transactionId, canvas) {
  const ctx = canvas.getContext("2d");
  if (canvas.chart) {
    canvas.chart.destroy();
  }
  const transaction = transactions.find((t) => t.id === transactionId);
  const labels = transaction.contributors.map((c) => c.name);
  const data = transaction.contributors.map((c) => c.amount);

  canvas.chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [{ data, backgroundColor: ["#2ecc71", "#3498db", "#e74c3c", "#f1c40f"] }],
    },
  });
}


// Initialize App
document.addEventListener("DOMContentLoaded", loadTransactions);
