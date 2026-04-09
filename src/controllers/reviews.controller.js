const {
  listApprovedReviews,
  listAllReviews,
  createReview,
  updateReviewStatus,
  deleteReview
} = require("../repositories/review.repo");
const { REVIEW_STATUS } = require("../utils/constants");

const listPublic = async (req, res) => {
  const data = await listApprovedReviews(req.tenantId);
  res.json(data);
};

const listAdmin = async (req, res) => {
  const data = await listAllReviews(req.tenantId);
  res.json(data);
};

const create = async (req, res) => {
  const { rating, comment } = req.validated.body;
  const id = await createReview({
    tenantId: req.tenantId,
    userId: req.user.id,
    rating,
    comment,
    status: REVIEW_STATUS.PENDING
  });
  res.status(201).json({ id });
};

const updateStatus = async (req, res) => {
  const { status } = req.body;
  await updateReviewStatus(req.tenantId, req.params.id, status || REVIEW_STATUS.APPROVED);
  res.json({ success: true });
};

const remove = async (req, res) => {
  await deleteReview(req.tenantId, req.params.id);
  res.json({ success: true });
};

module.exports = { listPublic, listAdmin, create, updateStatus, remove };
