const express = require("express");
require("dotenv").config();

const authRouter = require("./Routes/authRouter");
const notesRouter = require("./Routes/notesRouter");
const categoriesRouter = require("./Routes/categoriesRouter");

const logger = require("./services/logger");
const requestId = require("./middleware/requestId");
const requestLogger = require("./middleware/requestLogger");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(requestId);
app.use(requestLogger);

app.get("/", (req, res) => res.send("Minder API"));

app.use("/apiv1/auth", authRouter);
app.use("/apiv1/notes", notesRouter);
app.use("/apiv1/categories", categoriesRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found" });
});

app.use((err, req, res, next) => {
  logger.error("Unhandled error", err, {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    userId: req.user?.userId,
  });
  res.status(500).json({ success: false, message: "Server error" });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));