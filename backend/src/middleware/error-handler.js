function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode =
    error.statusCode ||
    (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : 500);

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    success: false,
    error: {
      message: statusCode >= 500 ? 'Internal server error' : error.message,
    },
  });
}

module.exports = errorHandler;