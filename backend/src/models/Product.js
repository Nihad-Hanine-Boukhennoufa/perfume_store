import mongoose from 'mongoose';
import slugify from "slugify";

const imageSchema = new mongoose.Schema({
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    isPrimary: { type: Boolean, default: false }
}, { _id: false });

const noteSchema = new mongoose.Schema({
    text: { type: String, trim: true, required: true },
    image: {
        url: { type: String, required: true },
        publicId: { type: String, required: true }
    }
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true, trim: true },

    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", required: true },
    description: { type: String, required: true, trim: true },

    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },

    gender: { type: String, required: true, enum: ["Men", "Women", "Unisex"] },
    concentration: { type: String, required: true, enum: ["EDP", "EDT", "Perfume"] },
    scentType: [{ type: String, required: true, enum: ["Classic", "Floral", "Woody", "Fresh", "Oriental", "Citrus", "Aquatic", "Fruity", "Leather","Sweet", "Powdery","Spicy","Aromatic"] }],
    season: { type: String, required: true, enum: ["Winter", "Summer","Spring", "All Seasons"] },

    notes: { type: [noteSchema], required: true },
    images: { type: [imageSchema], required: true },

    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },

    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },

}, { timestamps: true });

// --- Indexes ---

productSchema.index({ price: 1 });
productSchema.index({ gender: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ isPublished: 1, createdAt: -1 });
productSchema.index({ brand: 1, gender: 1, price: 1 });
productSchema.index({ name: "text", description: "text" });

// --- Slug Generation (pre-validate) ---
productSchema.pre("validate", async function () {
    // Generate slug only when name is new or modified
    if (!this.isModified("name") && !this.isNew) return;

    const Product = this.constructor;
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    // Keep incrementing until we find a unique slug
    while (await Product.findOne({ slug, _id: { $ne: this._id } }).lean()) {
        slug = `${baseSlug}-${counter++}`;
    }

    this.slug = slug;
});

// --- Business Rules Validation (pre-save) ---
productSchema.pre("save", function () {
    // 1. Ensure at least one image exists
    if (!this.images || this.images.length === 0) {
        throw new Error("Product must have at least one image");
    }

    // 2. Ensure only one primary image
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length === 0) {
        this.images[0].isPrimary = true;
    } else if (primaryImages.length > 1) {
        let primarySet = false;
        this.images.forEach(img => {
            img.isPrimary = !primarySet && img.isPrimary ? (primarySet = true) : false;
        });
    }

    // 3. Ensure note texts are unique within the product
    const texts = this.notes.map(n => n.text.toLowerCase().trim());
    if (new Set(texts).size !== texts.length) {
        throw new Error("Duplicate note text is not allowed");
    }
});

const Product = mongoose.model('Product', productSchema);
export default Product;