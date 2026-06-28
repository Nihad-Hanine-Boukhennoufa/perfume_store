import mongoose from "mongoose";
import slugify from "slugify";

const noteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, 
    },

    slug: {
      type: String,
      unique: true, 
      lowercase: true,
    },

    image: {
      type: String,
      required: true,
    },

    imagePublicId: {
      type: String,
      required: true,
    },

    family: {
      type: String,
      enum: [
        "Citrus",
        "Floral",
        "Woody",
        "Oriental",
        "Fresh",
        "Fruity",
        "Spicy",
        "Aromatic",
        "Sweet",
        "Leather",
        "Aquatic",
        "Powdery",
        "Green",
        "Musky",
        "Amber",
        "Gourmand",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

noteSchema.pre("validate", async function () {
  if (!this.isModified("name") && !this.isNew) return;

  const Note = this.constructor;

  const baseSlug = slugify(this.name, {
    lower: true,
    strict: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (
    await Note.findOne({
      slug,
      _id: { $ne: this._id },
    }).lean()
  ) {
    slug = `${baseSlug}-${counter++}`;
  }

  this.slug = slug;
});


noteSchema.index({ family: 1 });

export default mongoose.model("Note", noteSchema);