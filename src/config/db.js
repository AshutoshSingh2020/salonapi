const mongoose = require("mongoose");
const { env } = require("./env");

let connectPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectPromise) {
    connectPromise = mongoose.connect(env.db.uri, {
      dbName: env.db.database,
      autoIndex: true
    });
  }

  try {
    await connectPromise;
    return mongoose.connection;
  } catch (error) {
    connectPromise = null;
    throw error;
  }
};

const getDb = () => {
  if (!mongoose.connection?.db) {
    throw new Error("MongoDB not connected");
  }
  return mongoose.connection.db;
};

const withTransaction = async (handler) => {
  await connectDB();
  const session = await mongoose.startSession();
  let response;

  try {
    await session.withTransaction(async () => {
      response = await handler(session);
    });
    return response;
  } finally {
    await session.endSession();
  }
};

module.exports = { connectDB, getDb, withTransaction };
