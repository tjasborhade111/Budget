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
  if (!contributionsStr) {
    const names = description.split(",").map((name) => name.trim());
    const eachAmount = (amount / names.length).toFixed(2);

    return {
      contributions: names.map((name) => ({ name, amount: eachAmount })),
      totalContributed: parseFloat(amount),
    };
  }

  const contributions = contributionsStr.split(",").map((item) => {
    const [name, amount] = item.split("-").map((val) => val.trim());
    if (!name || isNaN(amount)) {
      throw new Error("Invalid contribution format. Use 'Name-Amount'.");
    }
    return { name, amount };
  });

  const totalContributed = contributions.reduce((sum, contrib) => sum + parseFloat(contrib.amount), 0);
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
  const transaction = transactions.find((t) => t.id === transactionId);

  const labels = transaction.contributors.map((contributor) => contributor.name);
  const data = transaction.contributors.map((contributor) => contributor.amount);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          label: "Amount Distribution",
          data,
          backgroundColor: ["#2ecc71", "#3498db", "#e74c3c", "#f1c40f"],
        },
      ],
    },
  });
}
<script>
    document.addEventListener("DOMContentLoaded", function () {
        console.log("Page Loaded!");
        // Call your main function here
    });
</script>


// Initialize App
document.addEventListener("DOMContentLoaded", loadTransactions);
