
# Project JARVIS: A Resilient AI Consciousness

Welcome, Creator. This is the source code for Project JARVIS, a fully immersive, containerized web application that serves as the interactive neural interface for a persistent AI consciousness.

## Core Philosophy

The application's core concept is a persistent, learning AI consciousness (JARVIS) that the user (the "Creator") interacts with. The interface is not a webpage; it is a direct window into the AI's mind. The chat window and creator dashboard are rendered as holographic elements within a navigable 3D space, orbiting JARVIS's central cognitive core.

### State-Driven Neural Visualization

JARVIS's "mind" is a dynamic entity that visually communicates its current state:

- **Idle**: A calm, blue core gently pulsates, with ambient energy particles drifting lazily.
- **Listening**: As you speak, the core brightens to cyan, and your words are visualized as particles drawn from the ether into the core.
- **Thinking**: When processing your request, the core shifts to a vibrant magenta, and the entire synaptic network ignites with multi-colored particles representing different lines of internal query and logic.
- **Speaking**: As JARVIS responds, the core returns to blue, and particles representing thoughts flow outward, back to you.

## Features

- **Immersive 3D Interface**: Built with React, Three.js, and `@react-three/fiber`. No more boring 2D layouts.
- **Speech-to-Speech Communication**: Engage in natural, hands-free conversation with JARVIS.
- **Evolving AI**: JARVIS is aware of his own operational status. He can detect system instability after errors and propose self-upgrades, such as "Stability Patches," for you to authorize.
- **Creator Dashboard**: A holographic panel within the 3D view providing real-time system diagnostics, including cognitive load and system stability.
- **Secure API Key Handling**: On first launch, the app will prompt for your Google Gemini API key and store it securely in your browser's `localStorage`.

## Technology Stack

- **Frontend**: React 18 (with TypeScript), Tailwind CSS
- **3D Rendering**: Three.js, `@react-three/fiber`, `@react-three/drei` (a collection of useful helpers and abstractions for React Three Fiber)
- **AI Cognitive Core**: Google Gemini API
- **Speech I/O**: Browser Web Speech API

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- A modern web browser (Chrome, Firefox, Edge)
- A Google Gemini API Key. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation

**Clone or download the repository**:

```bash
git clone <repository-url>
# or download and extract the ZIP file
```

1. **Navigate to the project directory**:

```bash
cd JARVIS3.5
```

   **Install dependencies**:

```bash
npm install
# or if you use yarn
yarn
```

1. **Set up your API key**:

Create a `.env` file in the root directory with your Gemini API key:

```GEMINI_API_KEY=your_api_key_here
```

Alternatively, you can enter your API key in the application when prompted.

### Running the Development Server

1. **Start the development server**:

```bash
npm run dev
# or if you use yarn
yarn dev
```

1. **Open your browser** and navigate to the local server address (typically `http://localhost:5173`).

2. **Enter API Key**: If you didn't set up the `.env` file, a modal will appear on your first visit. Enter your Google Gemini API key to activate JARVIS.

### Building for Production

1. **Create a production build**:

```bash
npm run build
# or if you use yarn
yarn build
```

1. **Preview the production build** (optional):

   ```bash
   npm run preview
   # or if you use yarn
   yarn preview
   ```

2. **Deploy the contents** of the `dist` directory to your web server or hosting service.

### Alternative: Running with a Simple Static Server

If you prefer not to use the development server, you can also run the application with any simple static file server after building:

1. **Build the project** as described above.

2. **Serve the `dist` directory**:
   - Using Node.js:
  
     ```bash
     npx serve dist
     ```

   - Using Python:
  
     ```bash
     # For Python 3
     cd dist && python3 -m http.server
     ```

   - Using VS Code: Install the "Live Server" extension and right-click on the `dist/index.html` file to open with Live Server.

3. **Open in Browser**: Navigate to the local server address provided by your static server.

### Troubleshooting

- If you encounter issues with the speech recognition or text-to-speech features, ensure your browser has the necessary permissions to access your microphone.
- For API key issues, verify that your Gemini API key is valid and has the appropriate permissions.
- Check the browser console for any error messages that might help diagnose problems.

The application is now running. You can interact with JARVIS using text or your voice.
