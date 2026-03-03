const express = require("express");
require("dotenv").config();

const authRouter = require("./Routes/authRouter");
const notesRouter = require("./Routes/notesRouter");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());

app.get("/", (req, res) => res.send("Minder API"));

app.use("/apiv1/auth", authRouter);
app.use("/apiv1/notes", notesRouter);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));