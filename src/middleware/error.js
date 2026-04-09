const { ApiError } = require("../utils/errors");

const errorHandler = (err, _req, res, _next) => {
  let status = err instanceof ApiError ? err.status : 500;
  let message = err.message || "Internal Server Error";
  let details = err instanceof ApiError ? err.details : undefined;

  if (!(err instanceof ApiError) && err?.name === "ZodError") {
    status = 400;
    message = "Validation failed";
    details = Array.isArray(err.issues)
      ? err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message
        }))
      : undefined;
  }

  if (!(err instanceof ApiError) && err?.code === "ER_DUP_ENTRY") {
    status = 409;
    const match = typeof err.message === "string"
      ? err.message.match(/Duplicate entry '(.+)' for key '(.+)'/)
      : null;
    const key = match?.[2] || "";
    const field = key.includes(".") ? key.split(".").pop() : key;
    message = field ? `Duplicate value for ${field}.` : "Duplicate value already exists.";
    details = field
      ? [{ field, message: "This value already exists." }]
      : [{ field: "", message: "This value already exists." }];
  }

  if (!(err instanceof ApiError) && err?.code === "ER_NO_REFERENCED_ROW_2") {
    status = 400;
    message = "Referenced record not found.";
  }

  if (!(err instanceof ApiError) && err?.code === "ER_ROW_IS_REFERENCED_2") {
    status = 409;
    message = "Cannot delete this record because it is in use.";
  }

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  const errors = Array.isArray(details) && details.length
    ? details
    : [{ field: "", message }];
  const payload = {
    success: false,
    message,
    data: null,
    errors
  };
  res.status(status).json(payload);
};

module.exports = { errorHandler };
