## How to Run the Project Locally

To test the AI Bouncer, you will need to run the Node.js backend and load the extension into your browser.

### 1. Set Up the Backend
The backend uses Fastify and SQLite to process the AI requests and track user stats.

1. Open your terminal and navigate to the backend folder:
   \`\`\`bash
   cd backend
   \`\`\`
2. Install the dependencies:
   \`\`\`bash
   npm install
   \`\`\`
3. Set up your environment variables:
   * Copy the \`env.sample\` file and rename it to \`.env\`.
   * Add your Mistral API key: \`MISTRAL_API_KEY=your_key_here\`
4. Build and start the server:
   \`\`\`bash
   npm run build
   npm start
   \`\`\`
   *The server should now be running on \`http://localhost:3000\`.*

### 2. Install the Extension
1. Open Google Chrome or any Chromium-based browser (Brave, Edge).
2. Navigate to \`chrome://extensions/\`.
3. Toggle **"Developer mode"** ON in the top right corner.
4. Click **"Load unpacked"** in the top left.
5. Select the \`extension\` folder from this repository.

### 3. Test the AI Bouncer!
1. Open a new tab and try to visit a distracting site (e.g., \`https://youtube.com\`).
2. The AI Bouncer will instantly block the page.
3. Type an excuse, hit "Request Access", and see if the Mistral AI lets you through!
