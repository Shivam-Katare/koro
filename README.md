# Koro

A shop assistant for the work that happens beyond a sale.

[Live App](https://koroo.vercel.app/) · [Watch Demo](https://youtu.be/_JWejnDfWi4) · [Source Code](https://github.com/Shivam-Katare/koro)

Koro helps neighborhood retail shopkeepers track shelf locations, stock levels, handwritten sales slips, and WhatsApp restock orders through voice, text, or manual controls. Inspired by watching what it takes to run my mom's cosmetics shop.

## What it does

- Find shelf locations, prices, and stock counts by voice or text (Hindi, Hinglish, English).
- Scan and extract items from handwritten sales slips.
- Prepare daily restock lists ready to send to suppliers on WhatsApp.
- Configure your **own store layout** by adding as many shelves, rows, or sections as you need. Product locations are flexible, not hard-coded to a fixed layout.
- Instant demo mode preloaded with a sample cosmetics & bangles store.

## Tech stack

Next.js (App Router), TypeScript, Tailwind CSS, Supabase, Google Gemini. Built with Wispr Flow for voice-driven prompt engineering and documentation.

## Built with Wispr Flow

I used Wispr Flow throughout the build, from dictating prompts for coding agents and exploring ideas with other language models to writing documentation, the demo script, and video-generation prompts. I worked in Antigravity and used Flow to make voice a part of my actual development workflow.

## Running locally

1. Clone the repo:
   ```bash
   git clone https://github.com/Shivam-Katare/koro.git
   cd koro
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app locally.

**Demo store note:** Gemini free-tier rate limits may temporarily affect AI responses in the hosted demo. The demo store and its manual workflows remain usable.