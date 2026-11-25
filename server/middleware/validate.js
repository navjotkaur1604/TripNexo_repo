const { validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return res.status(400).json({
      success: false,
      message: errors[0]?.message || 'Validation failed',
      errors,
    });
  }
  next();
}

module.exports = { handleValidationErrors };
