const { getDb } = require("../config/db");

const asNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const sessionOptions = (session) => (session ? { session } : {});

const stripMongoId = (document) => {
  if (!document) return null;
  const { _id, ...rest } = document;
  return rest;
};

const stripMongoIds = (documents = []) => documents.map(stripMongoId);

const getCollection = (name) => getDb().collection(name);

const nextId = async (counterName, session = null) => {
  const counters = getCollection("counters");
  const result = await counters.findOneAndUpdate(
    { _id: counterName },
    {
      $inc: { seq: 1 },
      $setOnInsert: { seq: 0 }
    },
    {
      upsert: true,
      returnDocument: "after",
      ...sessionOptions(session)
    }
  );

  const counter = result?.value || result;
  return Number(counter?.seq || 1);
};

module.exports = {
  asNumber,
  sessionOptions,
  stripMongoId,
  stripMongoIds,
  getCollection,
  nextId
};
