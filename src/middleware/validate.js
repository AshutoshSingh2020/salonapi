const { badRequest } = require("../utils/errors");

const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message
    }));
    return next(badRequest("Validation failed", details));
  }
  req.validated = result.data;
  return next();
};

module.exports = { validate };
