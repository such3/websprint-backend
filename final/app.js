require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const { nanoid } = require("nanoid");
const Secret = require("./models/Secret");
const Message = require("./models/Message");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Home / Create Link
app.get("/", (req, res) => {
  res.render("create");
});

app.post("/create", async (req, res) => {
  const secretId = nanoid(8);
  const password = nanoid(6);
  const newSecret = new Secret({ secretId, password });
  await newSecret.save();
  res.render("create", { link: `/secret/${secretId}`, secretId, password });
});

// Message Form
app.get("/secret/:id", async (req, res) => {
  const secret = await Secret.findOne({ secretId: req.params.id });
  if (!secret) return res.status(404).send("Link not found");
  res.render("message_form", { secretId: req.params.id });
});

app.post("/secret/:id", async (req, res) => {
  const { content } = req.body;
  await Message.create({ secretId: req.params.id, content });
  res.send("Message sent!");
});

// View Messages Form
app.get("/view", (req, res) => {
  res.render("view_messages", { messages: null, error: null });
});

// In your Express app.js or routes file
app.post("/view", async (req, res) => {
  const { secretId, password } = req.body;
  const secret = await Secret.findOne({ secretId });

  if (!secret || secret.password !== password) {
    // If error, pass an error message to the template
    return res.render("view_messages", {
      error: "Invalid link or password",
      messages: null, // Ensure messages are null when error occurs
    });
  }

  const messages = await Message.find({ secretId });
  res.render("view_messages", { messages });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
