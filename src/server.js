const { app } = require("./app");
const { env } = require("./config/env");
const { connectDB } = require("./config/db");

const start = async () => {
  await connectDB();

  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on port ${env.port}`);
  });
};

start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start API:", error);
  process.exit(1);
});
