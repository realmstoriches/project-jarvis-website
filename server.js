// server.js

// Import necessary libraries
const express = require('express');
const path = require('path');
const rateLimit = require('express-rate-limit'); // Assuming you will use this later

// Create an instance of the Express application
const app = express();

// Define the port the server will run on.
// Render will set this automatically. For local testing, it defaults to 4242.
const PORT = process.env.PORT || 4242;

// --- This is the ONLY line you need to serve your website files ---
// It tells Express that the 'docs' folder is the root of your website
// and contains all static files (HTML, CSS, images, and your Jarvis app).
app.use(express.static(path.join(__dirname, 'docs')));


// --- This is a fallback route for the main page ---
// This ensures that any direct visit to your site's root domain (like yourdomain.onrender.com)
// will always serve the main index.html file from your 'docs' folder.
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'));
});


// Add any other server-side routes or API endpoints for Stripe/Gemini below this line.
// For example:
// app.post('/api/stripe-payment', (req, res) => {
//   // Your Stripe payment logic would go here
// });


// This starts the server and makes it listen for incoming requests on the defined port.
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));