const Book = require('../models/book.model');

const bookFields = ['name', 'category', 'price', 'author', 'image'];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function createSort(sortQuery) {
  if (!sortQuery) {
    return { createdAt: -1 };
  }

  return Object.fromEntries(
    sortQuery.split(',').map((sortField) => {
      const descending = sortField.startsWith('-');
      const field = descending ? sortField.slice(1) : sortField;
      return [field, descending ? -1 : 1];
    })
  );
}

function pickBookFields(source) {
  return Object.fromEntries(
    bookFields
      .filter((field) => source[field] !== undefined)
      .map((field) => [field, source[field]])
  );
}

function sendBookNotFound(res) {
  return res.status(404).json({
    success: false,
    error: { message: 'Book not found' },
  });
}

async function listBooks(req, res) {
  const page = req.query.page || 1;
  const limit = req.query.limit || 10;
  const skip = (page - 1) * limit;
  const filter = {};

  if (req.query.category) {
    filter.category = {
      $regex: `^${escapeRegex(req.query.category)}$`,
      $options: 'i',
    };
  }

  if (req.query.author) {
    filter.author = {
      $regex: `^${escapeRegex(req.query.author)}$`,
      $options: 'i',
    };
  }

  if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
    filter.price = {};
    if (req.query.minPrice !== undefined) {
      filter.price.$gte = req.query.minPrice;
    }
    if (req.query.maxPrice !== undefined) {
      filter.price.$lte = req.query.maxPrice;
    }
  }

  if (req.query.search) {
    const search = new RegExp(escapeRegex(req.query.search), 'i');
    filter.$or = [
      { name: search },
      { category: search },
      { author: search },
    ];
  }

  if (
    req.query.minPrice !== undefined &&
    req.query.maxPrice !== undefined &&
    req.query.minPrice > req.query.maxPrice
  ) {
    return res.status(400).json({
      success: false,
      error: { message: 'minPrice must be less than or equal to maxPrice' },
    });
  }

  const [books, totalItems] = await Promise.all([
    Book.find(filter).sort(createSort(req.query.sort)).skip(skip).limit(limit),
    Book.countDocuments(filter),
  ]);
  const totalPages = Math.ceil(totalItems / limit);

  return res.json({
    success: true,
    data: books,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  });
}

async function createBook(req, res) {
  const book = await Book.create(pickBookFields(req.body));
  return res.status(201).json({ success: true, data: book });
}

async function getBookById(req, res) {
  const book = await Book.findById(req.params.id);
  if (!book) {
    return sendBookNotFound(res);
  }

  return res.json({ success: true, data: book });
}

async function updateBook(req, res) {
  const book = await Book.findByIdAndUpdate(
    req.params.id,
    pickBookFields(req.body),
    { new: true, runValidators: true }
  );
  if (!book) {
    return sendBookNotFound(res);
  }

  return res.json({ success: true, data: book });
}

async function deleteBook(req, res) {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) {
    return sendBookNotFound(res);
  }

  return res.status(204).send();
}

module.exports = {
  listBooks,
  createBook,
  getBookById,
  updateBook,
  deleteBook,
};