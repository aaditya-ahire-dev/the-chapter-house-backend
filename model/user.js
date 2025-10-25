import mongoose from "mongoose";

const BuyedBookSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Book",
    required: true,
  },
  bookStatus: {
    type: String,
    enum: ["reading", "downloaded", "not_downloaded"],
    default: "not_downloaded",
  },
});

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  // password: {
  //   type: String,
  //   required: true,
  // },
  buyedBooks: [BuyedBookSchema],
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
}, { timestamps: true });

const User = mongoose.model("user", userSchema);
export default User;
