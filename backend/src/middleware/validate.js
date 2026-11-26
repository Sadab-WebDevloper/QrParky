const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    const firstErrorMessage = err.errors && err.errors.length > 0 ? err.errors[0].message : null;
    const issues = err.errors 
      ? err.errors.map(e => {
          const field = e.path.filter(p => p !== 'body' && p !== 'query' && p !== 'params').join('.');
          return field ? `${field}: ${e.message}` : e.message;
        }).join('; ') 
      : err.message;
    return res.status(400).json({
      success: false,
      message: firstErrorMessage || issues || 'Validation Error',
      errors: err.errors,
    });
  }
};

module.exports = validate;
