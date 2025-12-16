# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 poker frontend application with:
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

- **Framework**: Next.js 15 with App Router
- **React**: 19
- **Styling**: Tailwind CSS 4 with PostCSS
- **TypeScript**: 5.x with strict mode
- **Linting**: ESLint 9 with Next.js core web vitals and TypeScript configs
- **Backend**: Supabase (auth, DB, realtime) + Socket.IO (game server)

## Project Structure

```
src/
├── app/
│   ├── auth/page.tsx        # Login/signup page with split layout
│   ├── lobby/page.tsx       # Table listing with stats bar
│   ├── game/[tableId]/page.tsx  # Main game table UI
│   ├── demo/page.tsx        # Demo mode (no auth required)
│   ├── globals.css          # Design system with CSS variables
│   ├── layout.tsx           # Root layout with AuthProvider
│   └── page.tsx             # Landing page (redirects to auth)
├── contexts/
│   └── AuthContext.tsx      # Supabase auth context provider
└── lib/
    ├── supabase.ts          # Supabase client configuration
    └── socket.ts            # Socket.IO client configuration
```

Path alias: `@/*` maps to `./src/*`

## Architecture

### Authentication (Supabase)
- Email/password signup and login via Supabase Auth
- Session persistence for seamless game rejoining
- AuthContext provides `user`, `loading`, `signIn`, `signUp`, `signOut`

### Lobby (Supabase + Realtime)
- `poker_tables` table with RLS for fetching active tables
- Real-time subscription for live lobby updates (INSERT/UPDATE/DELETE)
- Table data: `id`, `name`, `small_blind`, `big_blind`, `max_players`, `current_players`, `created_by`

### In-Game (Socket.IO - Authoritative Server)
The game server at `NEXT_PUBLIC_SOCKET_URL` manages all game state. Frontend responsibilities:
- **Seat UI**: Display player positions around oval table (up to 8 players)
- **Hole Cards**: Render player's private cards (dealt face-up to owner only)
- **Community Cards**: Display board cards as they're dealt (flop, turn, river)
- **Actions**: Show Fold/Check/Call/Bet/Raise buttons with timer when it's player's turn
- **Real-time Updates**: Pot size, chip stacks, player actions, phase changes
- **Timeouts**: Server auto-folds inactive players; frontend reflects state changes
- **Hand Conclusion**: Display winner announcement, pot distribution

Socket events:
- `join_table`, `leave_table` - Table membership
- `player_action` - Fold/Check/Call/Raise with amount
- `game_state` - Full game state updates from server

### Navigation Flow
```
Landing → Auth (Login/Signup) → Lobby → Join Table → Game Screen → Leave → Lobby
```

## Design System

### Color Palette (60-30-10 Rule)
- **60% Dark backgrounds**: `#0d0d0d`, `#141414`, `#1a1a1a`
- **30% Accent surfaces**: `#262626`, `#333333`
- **10% Primary accents**: Green (`#22c55e`), Gold (`#d4af37`)

### CSS Variables (globals.css)
```css
--bg-primary: #0d0d0d;
--bg-secondary: #141414;
--accent-primary: #22c55e;
--accent-gold: #d4af37;
--felt-green: #1a472a;
```

### Key UI Components
- `.playing-card` - Card styling with red/black colors and face-down state
- `.poker-felt` - Table felt texture with radial gradient
- `.btn-primary` - Green gradient buttons with hover effects
- `.text-gold` - Gold gradient text for highlights
- `.glass` - Frosted glass effect for overlays

### Player Positioning
Players are positioned around the table using absolute positioning with percentage values.
Positions are OUTSIDE the table oval to prevent overlap with pot/community cards:
```typescript
const PLAYER_POSITIONS = {
  0: { bottom: '-5%', left: '50%' },    // Bottom center (hero)
  1: { bottom: '5%', left: '-5%' },     // Bottom left
  2: { top: '50%', left: '-8%' },       // Left middle
  // ... up to 8 positions
};
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SOCKET_URL=your_socket_server_url
```

## Supabase Database Schema

### poker_tables
```sql
CREATE TABLE poker_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  small_blind INTEGER NOT NULL,
  big_blind INTEGER NOT NULL,
  max_players INTEGER NOT NULL DEFAULT 6,
  current_players INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Game State Interface

```typescript
interface GameState {
  tableId: string;
  players: Player[];
  communityCards: string[];  // e.g., ['A♠', 'K♥', '10♦']
  pot: number;
  currentBet: number;
  phase: 'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  turnTimer: number;
  winner?: { playerId: string; hand: string; amount: number };
}

interface Player {
  id: string;
  name: string;
  chips: number;
  cards: string[];
  bet: number;
  folded: boolean;
  isDealer: boolean;
  isTurn: boolean;
  seatIndex: number;
}
```

## Related Repositories

- **Backend Game Server**: `/Users/zzzchinguun/Developer/Backend-Development/poker-server`
  - Socket.IO server handling game logic
  - Supabase integration for auth verification
