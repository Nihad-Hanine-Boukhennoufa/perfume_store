import mongoose from "mongoose";
import slugify from "slugify";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    image: {
      type: String,
      required: true,
    },

    imagePublicId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique slug
brandSchema.pre("validate", async function () {
  if (!this.isModified("name") && !this.isNew) return;

  const Brand = this.constructor;

  const baseSlug = slugify(this.name, {
    lower: true,
    strict: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (
    await Brand.findOne({
      slug,
      _id: { $ne: this._id },
    }).lean()
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
});

brandSchema.index({ name: 1 });
brandSchema.index({ slug: 1 });

export default mongoose.model("Brand", brandSchema);