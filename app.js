const express = require("express");
require("dotenv").config();

const authRouter = require("./Routes/authRouter");
const notesRouter = require("./Routes/notesRouter");
const categoriesRouter = require("./Routes/categoriesRouter");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Minder API"));

app.use(express.json());

app.use("/apiv1/auth", authRouter);
app.use("/apiv1/notes", notesRouter);
app.use("/apiv1/categories", categoriesRouter);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));