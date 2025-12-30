const mongoose = require("mongoose");

mongoose
  .connect("mongodb://localhost:27017/budgetTracker")
  .then(async () => {
    // Define Bank model inline
    const bankSchema = new mongoose.Schema({
      name: String,
      balance: Number,
    });
    const Bank = mongoose.model("Bank", bankSchema);

    // Define Transaction model inline
    const transactionSchema = new mongoose.Schema({
      type: String,
      amount: Number,
      month: String,
      bankId: String,
      sourceName: String,
      destName: String,
      isLedger: { type: Boolean, default: false },
    });
    const Transaction = mongoose.model("Transaction", transactionSchema);

    // Delete all data
    await Bank.deleteMany({});
    await Transaction.deleteMany({});
    console.log("All data cleared");
    process.exit();
  })
  .catch((err) => console.error(err));
