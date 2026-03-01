# AI Bouncer: A Social Media Blocker Extension

## Problem
Social media addiction is a real challenge for productivity. We often find ourselves distracted by platforms like Instagram, Twitter, and YouTube when we should be focused on work—like coding or other important tasks. The AI Bouncer extension aims to tackle this problem by adding friction to the process of accessing distracting websites.

## The Idea
The AI Bouncer works as a browser extension that intercepts attempts to access social media sites. Instead of immediately granting access, users must provide a reason for needing to visit the site. This reason is evaluated by an AI (powered by Mistral) which checks how many times the user has been approved in the past and how much time they've spent on these platforms today. Based on this, the AI either:

- Grants a **timed pass** to the site.
- **Roasts** the user for excessive social media use (in a fun way).
- Provides **advice** to help break the habit.
- Or **blocks** the page entirely.

The goal is to increase the friction in accessing social media, which has been scientifically proven to help break bad habits.

---

## Project Architecture

### Backend (Fastify + SQLite)

- **Fastify**: Handles the requests from the extension and serves the AI evaluation logic.
- **SQLite**: Stores the data about user interactions, including the number of approved requests, time spent on social media, and reasons provided for access.
- **Mistral AI**: Evaluates the user’s reason and provides a pass or advice based on a set of conditions.

### Browser Extension

- The extension intercepts page loads for social media sites like Instagram, Twitter, and YouTube.
- If the user tries to visit a blocked site, the extension will display a popup asking for the reason for access.
- The AI evaluates the reason, checks user stats, and either grants access or blocks the page.

---

## How to Run the Project Locally

### 1. Set Up the Backend

The backend is built using Fastify and SQLite. It processes AI requests and tracks user data.

1. Open your terminal and navigate to the `backend` folder:
    ```bash
    cd backend
    ```
   
2. Install the dependencies:
    ```bash
    npm install
    ```

3. Set up your environment variables:
    - Copy the `env.sample` file and rename it to `.env`.
    - Add your **Mistral API key**:
    ```env
    MISTRAL_API_KEY=your_key_here
    ```

4. Build and start the server:
    ```bash
    npm run build
    npm start
    ```

   The backend server should now be running on `http://localhost:3000`.

---

### 2. Install the Extension

1. Open **Google Chrome** or any **Chromium-based browser** (e.g., Brave, Edge).

2. Go to the **Extensions** page:
    - Navigate to `chrome://extensions/`
    - Toggle "Developer mode" ON (top right).

3. Click "Load unpacked" in the top left.

4. Select the `extension` folder from this repository.

---

### 3. Test the AI Bouncer!

1. Open a new tab and try to visit a distracting website (e.g., `https://youtube.com`).
   
2. The AI Bouncer will block the page and ask you to provide an excuse.

3. Type your excuse, hit "Request Access," and see if Mistral AI lets you through based on your reason!

---

## Architecture Overview
<img width="890" height="844" alt="image" src="https://github.com/user-attachments/assets/d62c1c16-c944-4e17-b6d9-c6d4b3b3c996" />

Here's a high-level overview of how the AI Bouncer works:

1. **User attempts to access a social media site**.
2. **Extension intercepts the request** and shows a popup asking for a reason.
3. **User submits the reason** and the backend receives the request.
4. **Backend (Fastify) evaluates the request** by:
   - Checking how many times the user has been approved.
   - Checking how much time the user has spent on social media today.
   - Sending the reason to the **Mistral AI** for evaluation.
5. Based on the evaluation, the backend either:
   - Grants access to the site with a **timed pass**.
   - **Roasts** the user for overuse or provides **advice**.
   - Blocks the page entirely.
6. **User sees the result** in the browser.

---


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
