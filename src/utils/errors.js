class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const badRequest = (message, details) => new ApiError(400, message, details);
const unauthorized = (message, details) => new ApiError(401, message, details);
const forbidden = (message, details) => new ApiError(403, message, details);
const notFound = (message, details) => new ApiError(404, message, details);

module.exports = { ApiError, badRequest, unauthorized, forbidden, notFound };
