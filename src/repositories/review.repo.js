const { asNumber, getCollection, nextId, stripMongoIds } = require("./_mongo");

const enrichWithUserNames = async (rows) => {
  const reviews = stripMongoIds(rows);
  const userIds = [...new Set(reviews.map((row) => row.user_id).filter((id) => id !== null && id !== undefined))];
  if (!userIds.length) {
    return reviews.map((review) => ({ ...review, user_name: null }));
  }

  const users = await getCollection("users")
    .find({ id: { $in: userIds } })
    .project({ _id: 0, id: 1, name: 1 })
    .toArray();

  const userNameMap = new Map(users.map((user) => [Number(user.id), user.name]));

  return reviews.map((review) => ({
    ...review,
    user_name: userNameMap.get(Number(review.user_id)) || null
  }));
};

const listApprovedReviews = async (tenantId) => {
  const rows = await getCollection("reviews")
    .find({ tenant_id: asNumber(tenantId), status: "approved" })
    .sort({ created_at: -1, id: -1 })
    .toArray();
  return enrichWithUserNames(rows);
};

const listAllReviews = async (tenantId) => {
  const rows = await getCollection("reviews")
    .find({ tenant_id: asNumber(tenantId) })
    .sort({ created_at: -1, id: -1 })
    .toArray();
  return enrichWithUserNames(rows);
};

const createReview = async ({ tenantId, userId, rating, comment, status }) => {
  const id = await nextId("reviews");
  await getCollection("reviews").insertOne({
    id,
    tenant_id: asNumber(tenantId),
    user_id: asNumber(userId),
    rating: Number(rating),
    comment,
    status,
    created_at: new Date()
  });
  return id;
};

const updateReviewStatus = async (tenantId, id, status) => {
  await getCollection("reviews").updateOne(
    { id: asNumber(id), tenant_id: asNumber(tenantId) },
    { $set: { status } }
  );
};

const deleteReview = async (tenantId, id) => {
  await getCollection("reviews").deleteOne({
    id: asNumber(id),
    tenant_id: asNumber(tenantId)
  });
};

module.exports = { listApprovedReviews, listAllReviews, createReview, updateReviewStatus, deleteReview };
