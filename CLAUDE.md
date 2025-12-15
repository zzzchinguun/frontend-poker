# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 poker frontend application with:
- **Supabase** for authentication, database (lobby data), and real-time subscriptions
- **Socket.IO** for authoritative game server communication (in-game actions)

## Development Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **React**: 19.2.1
- **Styling**: Tailwind CSS 4 with PostCSS
- **TypeScript**: 5.x with strict mode
- **Linting**: ESLint 9 with Next.js core web vitals and TypeScript configs
- **Backend**: Supabase (auth, DB, realtime) + Socket.IO (game server)

## Project Structure

- `src/app/` - Next.js App Router pages and layouts
- `src/app/globals.css` - Global styles with Tailwind CSS and CSS variables for theming
- Path alias: `@/*` maps to `./src/*`

## Architecture

### Authentication (Supabase)
- Email/password signup and login via Supabase Auth
- Session persistence for seamless game rejoining

### Lobby (Supabase + Realtime)
- `poker_tables` table with RLS for fetching active tables
- Real-time subscription (`stream()`) for live lobby updates
- Table data: name, blinds, max players, current player count

### In-Game (Socket.IO - Authoritative Server)
The game server manages all game state. Frontend responsibilities:
- **Seat UI**: Display player positions, chips, dealer/blind indicators
- **Hole Cards**: Render player's private cards (dealt face-up to owner only)
- **Community Cards**: Display board cards as they're dealt
- **Actions**: Show Fold/Check/Call/Bet/Raise buttons with timer when it's player's turn
- **Real-time Updates**: Pot size, chip deductions, player actions
- **Timeouts**: Server auto-folds inactive players; frontend reflects state changes
- **Hand Conclusion**: Display winner, pot distribution, reset UI for next hand

### Navigation Flow
```
Login/Signup → Lobby → Join Table → Game Screen → Leave → Lobby
```

## Styling Conventions

- Uses CSS variables for theming (`--background`, `--foreground`)
- Dark mode support via `prefers-color-scheme: dark`
- Geist font family (Sans and Mono variants)
