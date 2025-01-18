const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");

const globalErrorHandler = require("./controllers/errorController");
const AppError = require("./utils/appError");
const userRoutes = require("./routes/userRoutes");
const statRoutes = require("./routes/statRoutes");
const Bottleneck = require("bottleneck");

const app = express();

// Use CORS middleware
app.use(cors());

// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 1000,
  windowMs: 60 * 60 * 1000,
  message: "Too many request from this IP, Please try again in one hour!",
});
app.use("/api", limiter);

// Create a limiter with max 5 requests per second
exports.apiCallLimiter = new Bottleneck({
  minTime: 500, // Minimum time between each request (e.g., 200ms)
  maxConcurrent: 5, // Maximum concurrent requests
});

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "10kb" })); //approx 10k characters long

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// Routes
app.get("/test", (req, res) => {
  return res.send("Hello from the server!");
});

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/stats", statRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
