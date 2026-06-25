import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
      },
    ],
    total: { type: Number, default: 0 }, 
  },
  { timestamps: true }
);
cartSchema.pre("save", function () {
  this.total = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
});

export default mongoose.model("Cart", cartSchema);
