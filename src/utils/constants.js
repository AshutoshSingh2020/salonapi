const ROLES = {
  CUSTOMER: "customer",
  ADMIN: "admin",
  STAFF: "staff",
  SUPER_ADMIN: "super_admin"
};

const BOOKING_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  CHECKED_IN: "checked_in",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
};

const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded"
};

const REVIEW_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
};

module.exports = { ROLES, BOOKING_STATUS, PAYMENT_STATUS, REVIEW_STATUS };
