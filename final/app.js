// Load environment variables from .env file
require("dotenv").config();

// Import required dependencies
const express = require("express"); // Express web framework
const mongoose = require("mongoose"); // MongoDB ODM for Node.js
const { nanoid } = require("nanoid"); // To generate unique IDs
const Secret = require("./models/Secret"); // Secret model for handling secret IDs
const Message = require("./models/Message"); // Message model for handling messages

// Initialize Express app
const app = express();

// Middleware for handling URL-encoded form data and serving static files
app.use(express.urlencoded({ extended: true })); // Parse incoming requests with URL-encoded payloads
app.use(express.static("public")); // Serve static files (like images, styles, etc.) from the 'public' folder

// Set the view engine to EJS (Embedded JavaScript) for rendering HTML pages
app.set("view engine", "ejs");

// =======================================
// MONGODB CONNECTION
// =======================================

// Connect to MongoDB using the connection URI from environment variables
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true, // Use the new MongoDB connection string parser
  useUnifiedTopology: true, // Use the new server discovery and monitoring engine
});

// =======================================
// ROUTES
// =======================================

// GET: Home Page - Show Create Secret Form
// This route displays the home page with a form to create a new secret.
app.get("/", (req, res) => {
  res.render("create"); // Render the 'create' view
});

// POST: Create Secret - Generates a Secret ID & Password
// This route handles the form submission for creating a new secret.
// It generates a unique secret ID and password, saves it to the database, and then
// renders the page with the secret link for the user.
app.post("/create", async (req, res) => {
  // Generate a short unique ID for the secret (8 characters long)
  const secretId = nanoid(8); // Example: "a1b2c3d4"

  // Generate a random password (6 characters long)
  const password = nanoid(6); // Example: "r4T9qL"

  // Save the new secret to the database
  const newSecret = new Secret({ secretId, password });
  await newSecret.save();

  // Build the full URL for the secret (e.g., http://localhost:3000/secret/a1b2c3d4)
  const fullLink = `${req.protocol}://${req.get("host")}/secret/${secretId}`;

  // Render the 'create' view with the generated link and secret details
  res.render("create", {
    link: fullLink,
    secretId,
    password,
  });
});

// GET: Secret Message Form - Display message submission form
// This route displays a form for submitting a message linked to a specific secret ID.
// It searches for the secret in the database by the ID and renders the form if found.
app.get("/secret/:id", async (req, res) => {
  // Find the secret by ID
  const secret = await Secret.findOne({ secretId: req.params.id });

  // If the secret is not found, return a 404 error
  if (!secret) return res.status(404).send("Link not found");

  // Render the message submission form for the given secret ID
  res.render("message_form", { secretId: req.params.id });
});

// POST: Submit Message - Save the message to DB
// This route handles the form submission for a message.
// It saves the submitted message to the database, associated with the secret ID.
app.post("/secret/:id", async (req, res) => {
  const { content } = req.body; // Extract the message content from the request body

  // Save the message to the database, linking it to the provided secret ID
  await Message.create({ secretId: req.params.id, content });

  // Respond with a success message
  res.send("Message sent!");
});

// GET: View Messages Page - Show the form to enter secret & password
// This route displays the form for users to enter the secret ID and password to view the associated messages.
app.get("/view", (req, res) => {
  res.render("view_messages", {
    messages: null, // No messages are displayed initially
    error: null, // No error message initially
  });
});

// POST: View Messages - Verify credentials and show messages
// This route verifies the secret ID and password submitted by the user and
// fetches all the messages associated with the secret if the credentials are correct.
app.post("/view", async (req, res) => {
  let { secretId, password } = req.body;

  // Clean the secret ID from the full URL (if provided in a full format like '/secret/xxxx')
  const match = secretId.match(/\/secret\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    secretId = match[1]; // Extract the clean secret ID
  }

  // Find the secret by ID from the database
  const secret = await Secret.findOne({ secretId });

  // If the secret is not found or the password is incorrect, return an error message
  if (!secret || secret.password !== password) {
    return res.render("view_messages", {
      error: "Invalid link or password", // Error message
      messages: null, // No messages are shown
    });
  }

  // If credentials are correct, fetch and display the messages linked to the secret ID
  const messages = await Message.find({ secretId });
  res.render("view_messages", { messages, error: null });
});

// POST: Clear Messages - Delete all messages associated with a given secret ID
// This route clears all the messages related to the provided secret ID.
app.post("/clear", async (req, res) => {
  const { secretId } = req.body; // Get the secret ID from the form

  // Delete all messages linked to the given secret ID
  await Message.deleteMany({ secretId });

  // Redirect the user back to the view messages page
  res.redirect("/view");
});

// =======================================
// SERVER LISTENING
// =======================================

// Define the server's listening port (either from the environment variable or default to 3000)
const PORT = process.env.PORT || 3000;

// Start the server and log the URL to the console
app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
