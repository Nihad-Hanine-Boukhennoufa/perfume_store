import Transaction from "../models/Transaction.js";

// ---------------------------------------------------------------------------
// createTransaction
//
// Called from orderController as:
//   createTransaction({ order: order._id, user: order.userId, amount: order.total })
//
// ✅ FIX: original destructured { orderId, userId, amount } but the caller passes
//         { order, user, amount } — orderId and userId were always undefined,
//         saving Transaction records with null refs. Aligned param names to match.
//
// Fully idempotent via upsert + $setOnInsert:
//   - First call  → inserts a new Transaction
//   - Repeat call → no-op ($setOnInsert is skipped on update)
//   - Race/concurrent calls → one wins, the other hits E11000 (caught below)
// ---------------------------------------------------------------------------
export const createTransaction = async ({ order, user, amount }) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { order },                  // Lookup by order — unique index ensures at most one
      {
        $setOnInsert: {           // Only written on INSERT, never on UPDATE
          order,
          user,
          amount,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        writeConcern: { w: "majority" },
      }
    );

    return transaction;
  } catch (err) {
    // E11000 = duplicate key — a transaction already exists for this order
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
    { $match: { createdAt: { $gte: since } } },
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
        _id:     0,
        year:    "$_id.year",
        month:   "$_id.month",
        revenue: 1,
        count:   1,
      },
    },
  ]);

  return result;
};