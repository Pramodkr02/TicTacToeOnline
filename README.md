# Nakama Arena

A real-time multiplayer mobile-first game platform built with Nakama, Go, CockroachDB, and React (Vite) + TailwindCSS.

## Features

- User authentication (signup, login, logout)
- Email verification
- Real-time multiplayer gameplay with a lobby system
- Room creation and joining
- Leaderboard with auto-refresh
- Player statistics
- Dark/Light theme toggle

## Tech Stack

- **Backend**: Nakama (Go)
- **Database**: CockroachDB
- **Frontend**: React, Vite, Tailwind CSS
- **Real-time**: WebSocket (via Nakama)
- **Authentication**: Nakama + JWT
- **Containerization**: Docker + Docker Compose

## Project Structure

```
/
├── backend/
│   ├── modules/
│   │   ├── main.go
│   │   ├── init.go
│   │   └── tic_tac_toe.go
│   ├── data/
│   └── config/
├── frontend/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── services/
│       └── pages/
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js and npm
- Go

### Running the Project

1.  Clone the repository.
2.  Start the backend services:
    ```bash
    docker-compose up -d
    ```
3.  Start the frontend development server:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
4.  Access the application at `http://localhost:5173`.

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

- **Backend**: Nakama (Go)
- **Database**: CockroachDB
- **Frontend**: React, Vite, Tailwind CSS
- **Real-time**: WebSocket (via Nakama)
- **Authentication**: Nakama + JWT
- **Containerization**: Docker + Docker Compose

## Project Structure