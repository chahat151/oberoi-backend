const dotenv = require("dotenv");
const mongoose = require("mongoose");
const app = require("./app");
const yargs = require("yargs");
// require("./utils/prototypes");

process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down....");
  console.error(err.name, err.message);
  process.exit(1);
});

// Parse command-line arguments
const argv = yargs.option("port", {
  alias: "p",
  description: "Specify the port number",
  type: "number",
//   default: 3001,
}).argv;

dotenv.config({ path: "./.env" });

const DB = process.env.DATABASE.replace(
  "<password>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => {
  console.log("Connected to database!");
  startServer();
});

function startServer() {
  // const PORT = process.env.PORT || 3000;
  const PORT = argv.port || process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}...`);
  });

  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.log(err.name, err.message, err);
    server.close(() => {
      process.exit(1);
    });
  });
}
