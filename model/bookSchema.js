import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
  user: { type: String, ref: "User", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
});

// Main Book schema
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      index: true,
    },
    publisher: {
      type: String,
      required: true,
    },
    publishedYear: {
      type: Number,
    },
    language: {
      type: String,
      default: "English",
    },
    coverImage: {
      type: String,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      enum: ["PDF", "EPUB", "MOBI"],
      default: "PDF",
    },
    ratings: [ratingSchema], 
    avrrating: {              
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const Book = mongoose.model("Book", bookSchema);
export default Book;
