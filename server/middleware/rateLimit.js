const rateLimit = require("express-rate-limit");

/**
 * Rate limiter for upload endpoints.
 * Allows 10 requests per minute per IP.
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many uploads. Please try again in a minute.",
  },
});

/**
 * General rate limiter for all other endpoints.
 * Allows 100 requests per minute per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests. Please slow down.",
  },
});

module.exports = { uploadLimiter, generalLimiter };
