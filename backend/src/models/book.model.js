const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    price: {
      type: Number,
      required: true,
      min: 0.01,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    image: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);