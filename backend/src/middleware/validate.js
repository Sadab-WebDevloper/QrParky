const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const issues = err.errors 
      ? err.errors.map(e => {
          const field = e.path.filter(p => p !== 'body' && p !== 'query' && p !== 'params').join('.');
          return field ? `${field}: ${e.message}` : e.message;
        }).join('; ') 
      : err.message;
    return res.status(400).json({
      success: false,
      message: issues || 'Validation Error',
      errors: err.errors,
    });
  }
};

module.exports = validate;
