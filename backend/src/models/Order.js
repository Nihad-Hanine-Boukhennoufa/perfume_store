import mongoose from "mongoose";

const orderSchema = new mongoose.Schema ({
    userId: { type: String, required: true },
    items: [ 
        {
            productId: { type: String, required: true },
            quantity: { type: Number, required: true, min: 1 },
            price: { type: Number, required: true, min: 0 }
        }
    ],
    total: { type: Number, required: true, min: 0 },
    orderDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'shipped', 'delivered', 'cancelled'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
