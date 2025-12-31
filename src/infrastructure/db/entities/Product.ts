import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stripePriceId: {
    type: String,
    required: true,
  },
  images: {
    type: [String],
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },

  features: {
    type: [String],
    default: [],
  },

  reviews: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Review",
    default: [],
  },
  colorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Color",
    required: false,
  },
  description: {
    type: String,
    required: false, // optional field
    default: "",
  },

});

const Product = mongoose.model("Product", productSchema);

export default Product;