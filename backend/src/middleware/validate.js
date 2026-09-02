const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const issues = err.errors ? err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') : err.message;
    return res.status(400).json({
      success: false,
      message: `Validation Error: ${issues}`,
      errors: err.errors,
    });
  }
};

module.exports = validate;
