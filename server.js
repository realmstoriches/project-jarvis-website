

// Add your instrumentation key or use the APPLICATIONINSIGHTSKEY environment variable on your production machine to start collecting data.
//var ai = require('applicationinsights');
//ai.setup(process.env.APPLICATIONINSIGHTSKEY || 'your_instrumentation_key').start();// server.js

// Import necessary libraries
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit');

// Create an instance of the Express application
const app = express();
app.use(express.static('docs'));

// Define the port the server will run on.
// It will use the host's port if available (for production), otherwise it defaults to 4242.
const PORT = process.env.PORT || 4242;

// This is the most important line for your frontend.
// It tells Express that the 'public' folder contains static files
// (like HTML, CSS, images, and your Jarvis app) that can be served directly.
app.use(express.static(path.join(__dirname, 'public')));

// This route ensures that if someone visits the root URL (e.g., http://localhost:4242),
// they are served your main index.html file.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// This starts the server and makes it listen for incoming requests on the defined port.
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));