const { validationResult } = require('express-validator');

function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Request validation failed',
        details: result.array(),
      },
    });
  }

  return next();
}

module.exports = validateRequest;