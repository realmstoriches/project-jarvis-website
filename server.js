// server.js

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4242;

// --- Step 1: Import API routes ---
const userRoutes = require('./docs/src/api/routes/userRoutes');

// --- Step 2: Add middleware ---
// This middleware is for parsing JSON in the body of requests (e.g., for POST requests)
app.use(express.json());

// --- Step 3: Use the API routes ---
// All routes defined in userRoutes will be prefixed with /api
app.use('/api', userRoutes);

// --- Step 4: Define the absolute path to your static files ---
const staticFilesPath = path.resolve(__dirname, 'docs');

// --- Step 5: Log the path to make sure it's correct ---
console.log(`Serving static files from: ${staticFilesPath}`);

// --- Step 6: Serve the static files ---
// This tells Express to serve all files from the 'docs' folder.
app.use(express.static(staticFilesPath));

// --- Step 7: A "catch-all" route for Single Page Applications ---
// This MUST come AFTER your API routes.
app.get('*', (req, res) => {
  const indexPath = path.resolve(staticFilesPath, 'index.html');
  console.log(`Attempting to send index.html from: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Error serving the page.');
    }
  });
});

// --- Step 8: Start the server ---
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));