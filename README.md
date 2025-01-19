# ChatGPT Clone with User Edit Message Branching

This is a simplified ChatGPT clone built using **Next.js**, **TypeScript**, and **Supabase**, with a focus on implementing the user message editing and branching functionality, currently a live feature on [chatgpt.com](https://chatgpt.com). This feature allows users to:

- Edit their original prompts
- View previous versions of their prompts
- See related follow-up messages for each branch of the conversation

The project utilizes the **Gemini-pro model** for the AI-driven conversation.

## Tech Stack

- **Next.js**
- **TypeScript**
- **Supabase**
- **Gemini-pro model**

## Setup

Before starting the project, you'll need to create a `.env.local` file in the root directory of your project and add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_API_KEY=your_google_api_key
```

Make sure to replace `your_supabase_url`, `your_supabase_anon_key`, and `your_google_api_key` with the actual values provided by Supabase and Google API.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/tanujbhaud/chatgpt_clone.git
   cd chatgpt_clone
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Project

To run the development server:

```bash
npm run dev
```

To build the project for production:

```bash
npm run build
```

To start the production server:

```bash
npm run start
```

## Features

- **User Message Editing**: Users can edit their original messages and the previous versions are saved.
- **Branching Conversations**: Each edit creates a branch of the conversation, and users can follow each branch and see related follow-up messages.
- **AI-driven Responses**: The conversation is powered by the **Gemini-pro model**, ensuring a dynamic and intelligent interaction with the user.
