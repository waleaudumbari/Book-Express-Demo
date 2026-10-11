const express = require('express');
const { body, param, query } = require('express-validator');
const bookController = require('../controllers/book.controller');
const validateRequest = require('../middleware/validate-request');

const router = express.Router();
const sortableFields = new Set(['name', 'category', 'price', 'author', 'createdAt']);
const maxPageSize = 10;

const bookIdValidation = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
  validateRequest,
];

const listQueryValidation = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: maxPageSize }).toInt(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('category').optional().trim().notEmpty(),
  query('author').optional().trim().notEmpty(),
  query('search').optional().trim().isLength({ min: 1, max: 100 }),
  query('sort')
    .optional()
    .custom((value) =>
      value.split(',').every((item) => {
        const field = item.startsWith('-') ? item.slice(1) : item;
        return sortableFields.has(field);
      })
    )
    .withMessage('sort contains an unsupported field'),
  validateRequest,
];

const createBookValidation = [
  body('name').trim().notEmpty().withMessage('name is required').bail().isLength({ max: 200 }),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('category is required')
    .bail()
    .isLength({ max: 100 }),
  body('price').isFloat({ min: 0.01 }).withMessage('price must be greater than zero').toFloat(),
  body('author')
    .trim()
    .notEmpty()
    .withMessage('author is required')
    .bail()
    .isLength({ max: 120 }),
  body('image')
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('image must be a valid HTTP or HTTPS URL'),
  validateRequest,
];

const updateBookValidation = [
  body().custom((value) => {
    if (!value || !['name', 'category', 'price', 'author', 'image'].some((field) => field in value)) {
      throw new Error('At least one book field must be provided');
    }
    return true;
  }),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('category').optional().trim().notEmpty().isLength({ max: 100 }),
  body('price').optional().isFloat({ min: 0.01 }).toFloat(),
  body('author').optional().trim().notEmpty().isLength({ max: 120 }),
  body('image')
    .optional()
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true }),
  validateRequest,
];

router
  .route('/')
  .get(listQueryValidation, bookController.listBooks)
  .post(createBookValidation, bookController.createBook);

router
  .route('/:id')
  .get(bookIdValidation, bookController.getBookById)
  .patch([...bookIdValidation.slice(0, 1), ...updateBookValidation], bookController.updateBook)
  .delete(bookIdValidation, bookController.deleteBook);

module.exports = router;