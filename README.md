# Nakama Arena

A real-time multiplayer mobile-first game platform built with Nakama, Go, CockroachDB, and React (Vite) + TailwindCSS.

## Features

- Authentication (Signup-first, Login, Logout)
- Email verification (OTP UI flow) after signup
- Instant Matchmaking (vs Player or Bot) — no search animation
- Real-time gameplay via WebSockets (Nakama)
- Local Multiplayer mode (X/O on same device)
- Leaderboard with periodic realtime updates
- Docs page with game rules
- Profile page (edit username)
- Dark/Light theme toggle (top-right, persisted)
- Responsive, mobile-first UI/UX

## Tech Stack

- **Backend**: Nakama + Go
- **Database**: CockroachDB
- **Frontend**: React + TailwindCSS (mobile-first)
- **Real-time**: WebSocket (via Nakama)
- **Auth**: Nakama + JWT
- **Containerization**: Docker + Docker Compose

## Project Structure

```
/
├── backend/                      # Nakama and Go backend code
│   ├── modules/
│   │   ├── main.go
│   │   ├── init.go
│   │   └── tic_tac_toe.go       # Match handler, bot logic, RPC hooks
│   ├── data/
│   └── config/
├── frontend/                     # React + Vite + Tailwind
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js        # darkMode: 'class'
│   └── src/
│       ├── main.jsx              # theme init + providers
│       ├── App.jsx               # routes
│       ├── components/
│       │   ├── Layout.jsx        # header nav + theme toggle
│       │   └── ProtectedRoute.jsx
│       ├── contexts/
│       │   └── AuthContext.jsx   # Nakama auth/session
│       ├── services/
│       │   └── nakama.js         # Nakama client helpers
│       └── pages/
│           ├── Login.jsx
│           ├── Register.jsx      # navigates to /verify-email after signup
│           ├── VerifyEmail.jsx   # OTP UI, then goes to /dashboard
│           ├── Dashboard.jsx
│           ├── Matchmaking.jsx   # creates match immediately
│           ├── Game.jsx          # online match
│           ├── LocalGame.jsx     # local X/O with working buttons
│           ├── Leaderboard.jsx   # polls every 5s
│           ├── Profile.jsx       # edit username
│           └── Docs.jsx          # game rules
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and npm (for frontend development)
- Go (for backend development)

### Running the Project

1. Clone the repository
2. Start the backend services:
   ```
   docker-compose up -d
   ```
3. Start the frontend development server:
   ```
   cd frontend
   npm install
   npm run dev
   ```
4. Access the application at `http://localhost:5173`

Environment variables for the frontend (optional):

- VITE_NAKAMA_HOST (default: localhost)
- VITE_NAKAMA_PORT (default: 7350)
- VITE_NAKAMA_KEY (default: defaultkey)
- VITE_NAKAMA_SSL (default: false)

## Game Logic

The game implements Tic-Tac-Toe with:
- Player vs Player (Nakama match)
- Player vs Bot with difficulty options
- Local Multiplayer on one device
- Real-time updates via Nakama WebSockets
- Leaderboard tracking via RPCs

## Development

1. Open the project folder in VS Code
2. Install recommended extensions:
   - Docker
   - Go
   - ES7 React/Redux/GraphQL/React-Native snippets
   - Tailwind CSS IntelliSense
3. Use the integrated terminal to run commands
4. Debug the frontend using the Chrome debugger

Notes:
- Default landing shows the Signup page. Unauthenticated routes redirect to /register.
- Theme toggle persists preference in localStorage.

## License

MIT

## Features

- Authentication (Login/Signup/Logout)
- Matchmaking (play vs player or bot)
- Real-time gameplay via WebSockets
- Leaderboard system
- Responsive UI for mobile and web

## Tech Stack

- **Backend**: Nakama + Go
- **Database**: CockroachDB
- **Frontend**: React + TailwindCSS (mobile-first)
- **Real-time**: WebSocket (via Nakama)
- **Auth**: Nakama + JWT
- **Containerization**: Docker + Docker Compose

## Project Structure