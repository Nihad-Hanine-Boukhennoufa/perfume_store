import mongoose from "mongoose";
import slugify from "slugify";
import imageSchema from "./schemas/Image.js";

const variantSchema = new mongoose.Schema(
  {
    volume: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    variants: {
      type: [variantSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Product must have at least one variant",
      },
    },

    gender: {
      type: String,
      enum: ["Men", "Women", "Unisex"],
      required: true,
    },

    concentration: {
      type: String,
      enum: [
        "Parfum",
        "Extrait de Parfum",
        "EDP",
        "EDT",
        "EDC",
      ],
      required: true,
    },

    scentType: [
      {
        type: String,
        enum: [
          "Classic",
          "Floral",
          "Woody",
          "Fresh",
          "Oriental",
          "Citrus",
          "Aquatic",
          "Fruity",
          "Leather",
          "Sweet",
          "Powdery",
          "Spicy",
          "Aromatic",
          "Green",
          "Amber",
          "Musky",
          "Gourmand",
        ],
      },
    ],

    season: [
      {
        type: String,
        enum: [
          "Winter",
          "Spring",
          "Summer",
          "Autumn",
          "All Seasons",
        ],
      },
    ],

    notes: {
      top: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
          },
        ],
        default: [],
      },

      heart: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
          },
        ],
        default: [],
      },

      base: {
        type: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Note",
          },
        ],
        default: [],
      },
    },

    images: {
      type: [imageSchema],
      required: true,
      validate: {
        validator: (v) => v.length > 0,
        message: "Product must have at least one image",
      },
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    reviewsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


// -------------------- Indexes --------------------

productSchema.index({ gender: 1 });

productSchema.index({ brand: 1 });

productSchema.index({ rating: -1 });

productSchema.index({ isPublished: 1, createdAt: -1 });

productSchema.index({ brand: 1, gender: 1 });

productSchema.index({ name: "text", description: "text" });


// -------------------- Slug --------------------

productSchema.pre("validate", async function () {
  if (!this.isModified("name") && !this.isNew) return;

  const Product = this.constructor;

  const baseSlug = slugify(this.name, {
    lower: true,
    strict: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (
    await Product.findOne({
      slug,
      _id: { $ne: this._id },
    }).lean()
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
});


// -------------------- Business Rules --------------------

productSchema.pre("save", function () {
  // At least one image
  if (!this.images.length) {
    throw new Error("Product must have at least one image");
  }

  // Only one primary image
  const primaryImages = this.images.filter((img) => img.isPrimary);

  if (primaryImages.length === 0) {
    this.images[0].isPrimary = true;
  }

  if (primaryImages.length > 1) {
    let found = false;

    this.images.forEach((img) => {
      if (img.isPrimary && !found) {
        found = true;
      } else {
        img.isPrimary = false;
      }
    });
  }

  // At least one note
  const notesCount =
    this.notes.top.length +
    this.notes.heart.length +
    this.notes.base.length;

  if (notesCount === 0) {
    throw new Error("Product must contain at least one note");
  }

  // Duplicate volumes
  const volumes = this.variants.map((v) => v.volume);

  if (new Set(volumes).size !== volumes.length) {
    throw new Error("Duplicate volume is not allowed");
  }
});

const Product = mongoose.model("Product", productSchema);

export default Product;