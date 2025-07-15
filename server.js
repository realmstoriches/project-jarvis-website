// server.js

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4242;

// --- Step 1: Define the absolute path to your static files ---
// We use path.resolve for a more reliable path than path.join.
const staticFilesPath = path.resolve(__dirname, 'docs');

// --- Step 2: Log the path to make sure it's correct ---
// This will show up in your Render logs. We can see if the path is right.
console.log(`Serving static files from: ${staticFilesPath}`);

// --- Step 3: Serve the static files ---
// This tells Express to serve all files from the 'docs' folder.
app.use(express.static(staticFilesPath));

// --- Step 4: A "catch-all" route for Single Page Applications ---
// This makes sure that any request that doesn't match a file
// still gets sent your index.html. This is robust.
app.get('*', (req, res) => {
  const indexPath = path.resolve(staticFilesPath, 'index.html');
  console.log(`Attempting to send index.html from: ${indexPath}`);
  res.sendFile(indexPath, (err) => {
    if (err) {
      // If there's an error sending the file, log it.
      console.error('Error sending index.html:', err);
      res.status(500).send('Error serving the page.');
    }
  });
});

// --- Step 5: Start the server ---
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));