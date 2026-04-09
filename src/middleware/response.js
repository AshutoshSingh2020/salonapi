const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const isStandardEnvelope = (payload) => {
  if (!isObject(payload)) return false;
  return (
    Object.prototype.hasOwnProperty.call(payload, "success") &&
    Object.prototype.hasOwnProperty.call(payload, "message") &&
    Object.prototype.hasOwnProperty.call(payload, "data") &&
    Object.prototype.hasOwnProperty.call(payload, "errors")
  );
};

const responseEnvelope = (_req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (res.locals.skipEnvelope || isStandardEnvelope(payload)) {
      return originalJson(payload);
    }
    const message = res.locals.successMessage || "Request successful";
    return originalJson({
      success: true,
      message,
      data: payload ?? null,
      errors: null
    });
  };

  next();
};

module.exports = { responseEnvelope };
