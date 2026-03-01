# Aisanat – AI Bouncer Browser Extension Automation

## Overview

**Aisanat** is an AI productivity bouncer designed to help users stay focused, break bad habits, and prevent social media distractions. This automation uses **n8n** and **Mistral AI** to evaluate user access requests to distracting websites, provide motivational guidance, and coach productivity.

It intercepts user attempts to visit sites like Instagram, Twitter, and YouTube, evaluates the reason for access, checks usage history, and either grants a timed pass or provides constructive advice.

---

## Workflow Nodes

1. **Chat Trigger (`@n8n/n8n-nodes-langchain.chatTrigger`)**  
   - Starts the conversation whenever the user sends a message.

2. **Set Node (Optional)**  
   - Prepares variables for workflow: `reason`, `approvals_today`, `total_time_today`, `requested_minutes`, `site`, `url`, `current_time`.

3. **AI Agent Node (`@n8n/n8n-nodes-langchain.agent`)**  
   - Uses the system prompt to process user input, evaluate requests, and provide guidance.

4. **Mistral Cloud Chat Model (`@n8n/n8n-nodes-langchain.lmChatMistralCloud`)**  
   - Runs the language model to evaluate user input.

5. **Output Parser Node**  
   - Converts AI responses into clean JSON for the browser extension.

---

## Available Variables

| Variable | Description |
|----------|-------------|
| `{{$json.reason}}` | User’s reason for accessing a site. |
| `{{$json.approvals_today}}` | Number of times the user has been approved today. |
| `{{$json.total_time_today}}` | Total minutes spent on distracting sites today. |
| `{{$json.requested_minutes}}` | Minutes requested for site access. |
| `{{$json.site}}` | Name of the site the user wants to visit. |
| `{{$json.url}}` | URL of the requested site. |
| `{{$json.current_time}}` | Current timestamp for the session. |

---
## Workflow

<img width="1004" height="330" alt="workflow" src="https://github.com/user-attachments/assets/e356d1c4-c110-4a7f-9afc-39efd34660c4" />

