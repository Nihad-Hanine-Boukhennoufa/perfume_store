import Transaction from "../models/Transaction.js";

// ---------------------------------------------------------------------------
// createTransaction
//
// Creates a financial Transaction record for a finalized order.
// Fully idempotent — safe to call multiple times for the same order.
//
// Uses findOneAndUpdate + upsert + $setOnInsert:
//   - If no transaction exists for this order → inserts a new one
//   - If one already exists              → does nothing ($setOnInsert is skipped)
//   - If two concurrent calls race       → one wins, the other hits E11000
//     which is silently caught below
// ---------------------------------------------------------------------------
export const createTransaction = async ({ orderId, userId, amount }) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { order: orderId },       // Lookup key — unique index guarantees at most one
      {
        $setOnInsert: {         // Only written on INSERT, never on UPDATE
          order: orderId,
          user: userId,
          amount,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        writeConcern: { w: "majority" }, // Durable write on replica sets
      }
    );

    return transaction;
  } catch (err) {

    // E11000 = duplicate key — a transaction already exists for this order.
    if (err.code === 11000) return null;

    // Any other error is unexpected — re-throw for the caller to handle
    throw err;
  }
};

// ---------------------------------------------------------------------------
// getTotalRevenue
// ---------------------------------------------------------------------------
export const getTotalRevenue = async () => {
  const result = await Transaction.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$amount" },
      },
    },
  ]);

  return result[0]?.totalRevenue ?? 0;
};

// ---------------------------------------------------------------------------
// getRevenueByMonth
//
// Returns a monthly revenue breakdown for the last N months (default: 12).
// Output shape: [{ year, month, revenue, count }, ...]
// ---------------------------------------------------------------------------
export const getRevenueByMonth = async (months = 12) => {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const result = await Transaction.aggregate([
    {
      $match: { createdAt: { $gte: since } },
    },
    {
      $group: {
        _id: {
          year:  { $year:  "$createdAt" },
          month: { $month: "$createdAt" },
        },
        revenue: { $sum: "$amount" },
        count:   { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
    {
      $project: {
        _id: 0,
        year:    "$_id.year",
        month:   "$_id.month",
        revenue: 1,
        count:   1,
      },
    },
  ]);

  return result;
};