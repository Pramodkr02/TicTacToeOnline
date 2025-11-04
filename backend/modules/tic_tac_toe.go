package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"math/rand"
	"time"

	"github.com/heroiclabs/nakama-common/runtime"
)

const (
	// Match states
	MatchStateInit      = 0
	MatchStateReady     = 1
	MatchStateInProgress = 2
	MatchStateComplete  = 3
	
	// Board size
	BoardSize = 3
	
	// Player marks
	MarkEmpty = 0
	MarkX     = 1
	MarkO     = 2
)

// TicTacToeState represents the game state
type TicTacToeState struct {
	Board       [][]int          `json:"board"`
	CurrentTurn int              `json:"current_turn"` // 1 for X, 2 for O
	Winner      int              `json:"winner"`       // 0 for no winner yet, 1 for X, 2 for O, 3 for draw
	Players     map[string]int   `json:"players"`      // Map of user ID to player mark
	Presences   map[string]bool  `json:"presences"`    // Map of user ID to presence status
	MatchState  int              `json:"match_state"`
	BotMatch    bool             `json:"bot_match"`
	BotDifficulty string         `json:"bot_difficulty"`
	LastMoveTime time.Time       `json:"last_move_time"`
}

// createTicTacToeMatch creates a new Tic-Tac-Toe match
func createTicTacToeMatch(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule) (runtime.Match, error) {
	return &TicTacToeMatch{
		logger: logger,
		db:     db,
		nk:     nk,
	}, nil
}

// TicTacToeMatch implements the runtime.Match interface
type TicTacToeMatch struct {
	logger runtime.Logger
	db     *sql.DB
	nk     runtime.NakamaModule
	
	matchID   string
	state     *TicTacToeState
	rng       *rand.Rand
	tickRate  int
	labelUpdateRateSec int
}

// MatchInit initializes the match
func (m *TicTacToeMatch) MatchInit(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, params map[string]interface{}) (interface{}, int, string, error) {
	m.logger = logger
	m.db = db
	m.nk = nk
	m.tickRate = 1
	m.labelUpdateRateSec = 5
	m.rng = rand.New(rand.NewSource(time.Now().UnixNano()))
	
	// Initialize game state
	state := &TicTacToeState{
		Board:       make([][]int, BoardSize),
		CurrentTurn: MarkX, // X goes first
		Winner:      0,
		Players:     make(map[string]int),
		Presences:   make(map[string]bool),
		MatchState:  MatchStateInit,
		LastMoveTime: time.Now(),
	}
	
	// Initialize empty board
	for i := 0; i < BoardSize; i++ {
		state.Board[i] = make([]int, BoardSize)
		for j := 0; j < BoardSize; j++ {
			state.Board[i][j] = MarkEmpty
		}
	}
	
	// Check if this is a bot match
	botMatch, ok := params["bot_match"].(bool)
	if ok && botMatch {
		state.BotMatch = true
		
		// Get bot difficulty
		botDifficulty, ok := params["bot_difficulty"].(string)
		if ok {
			state.BotDifficulty = botDifficulty
		} else {
			state.BotDifficulty = "medium" // Default difficulty
		}
	}
	
	m.state = state
	
	// Set match label for discoverability
	label := map[string]interface{}{
		"open": true,
		"type": "tic_tac_toe",
	}
	labelJSON, err := json.Marshal(label)
	if err != nil {
		return nil, 0, "", err
	}
	
	return state, m.tickRate, string(labelJSON), nil
}

// MatchJoinAttempt is called when a player attempts to join the match
func (m *TicTacToeMatch) MatchJoinAttempt(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presence runtime.Presence, metadata map[string]string) (interface{}, bool, string, error) {
	s := state.(*TicTacToeState)
	
	// Check if the match is already full
	if len(s.Players) >= 2 && !s.BotMatch {
		return s, false, "Match is full", nil
	}
	
	// Check if the player is already in the match
	if _, ok := s.Players[presence.GetUserId()]; ok {
		return s, true, "Rejoining match", nil
	}
	
	// For bot matches, only allow one human player
	if s.BotMatch && len(s.Players) >= 1 {
		// Check if this is the same player reconnecting
		for playerID := range s.Players {
			if playerID == presence.GetUserId() {
				return s, true, "Rejoining bot match", nil
			}
		}
		return s, false, "Bot match already has a player", nil
	}
	
	return s, true, "Join successful", nil
}

// MatchJoin is called when a player successfully joins the match
func (m *TicTacToeMatch) MatchJoin(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	s := state.(*TicTacToeState)
	
	for _, presence := range presences {
		userID := presence.GetUserId()
		
		// Assign player mark if not already assigned
		if _, ok := s.Players[userID]; !ok {
			// First player is X, second is O
			if len(s.Players) == 0 {
				s.Players[userID] = MarkX
			} else {
				s.Players[userID] = MarkO
			}
		}
		
		// Mark player as present
		s.Presences[userID] = true
	}
	
	// If this is a bot match and we have one player, add a bot player
	if s.BotMatch && len(s.Players) == 1 {
		// Add bot as player 2 (O)
		s.Players["bot"] = MarkO
		s.Presences["bot"] = true
	}
	
	// Check if we have enough players to start
	if len(s.Players) == 2 {
		s.MatchState = MatchStateReady
		
		// Notify players that the game is ready
		dispatcher.BroadcastMessage(1, []byte(`{"message":"Game is ready to start"}`), nil, nil, true)
		
		// Start the game
		s.MatchState = MatchStateInProgress
		dispatcher.BroadcastMessage(2, []byte(`{"message":"Game started"}`), nil, nil, true)
		
		// If bot goes first, make a move
		if s.BotMatch && s.CurrentTurn == s.Players["bot"] {
			s = m.makeBotMove(s, dispatcher)
		}
	}
	
	return s
}

// MatchLeave is called when a player leaves the match
func (m *TicTacToeMatch) MatchLeave(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, presences []runtime.Presence) interface{} {
	s := state.(*TicTacToeState)
	
	for _, presence := range presences {
		userID := presence.GetUserId()
		
		// Mark player as not present
		s.Presences[userID] = false
		
		// If the game is in progress, the leaving player forfeits
		if s.MatchState == MatchStateInProgress && !s.BotMatch {
			// Find the other player
			var otherPlayerID string
			for playerID := range s.Players {
				if playerID != userID {
					otherPlayerID = playerID
					break
				}
			}
			
			// Set the other player as winner
			if otherPlayerID != "" {
				s.Winner = s.Players[otherPlayerID]
				s.MatchState = MatchStateComplete
				
				// Notify players of forfeit
				message := map[string]interface{}{
					"message": "Player forfeited",
					"winner":  otherPlayerID,
				}
				messageJSON, _ := json.Marshal(message)
				dispatcher.BroadcastMessage(3, messageJSON, nil, nil, true)
				
				// Update player stats
				m.updatePlayerStats(ctx, otherPlayerID, true, false)
				m.updatePlayerStats(ctx, userID, false, false)
				
				// Record match result
				m.recordMatchResult(ctx, s)
			}
		}
	}
	
	return s
}

// MatchLoop is called on each match tick
func (m *TicTacToeMatch) MatchLoop(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, messages []runtime.MatchData) interface{} {
	s := state.(*TicTacToeState)
	
	// Process player messages
	for _, message := range messages {
		if message.GetOpCode() == 1 { // Move operation
			// Only process moves if the game is in progress
			if s.MatchState != MatchStateInProgress {
				continue
			}
			
			// Parse move data
			var move struct {
				Row int `json:"row"`
				Col int `json:"col"`
			}
			
			if err := json.Unmarshal(message.GetData(), &move); err != nil {
				logger.Error("Error parsing move data: %v", err)
				continue
			}
			
			// Validate move
			if move.Row < 0 || move.Row >= BoardSize || move.Col < 0 || move.Col >= BoardSize {
				logger.Error("Invalid move: out of bounds")
				continue
			}
			
			if s.Board[move.Row][move.Col] != MarkEmpty {
				logger.Error("Invalid move: cell already occupied")
				continue
			}
			
			// Check if it's the player's turn
			playerMark := s.Players[message.GetUserId()]
			if playerMark != s.CurrentTurn {
				logger.Error("Invalid move: not player's turn")
				continue
			}
			
			// Make the move
			s.Board[move.Row][move.Col] = playerMark
			s.LastMoveTime = time.Now()
			
			// Check for win or draw
			if m.checkWin(s.Board, move.Row, move.Col) {
				s.Winner = playerMark
				s.MatchState = MatchStateComplete
				
				// Notify players of win
				winnerID := message.GetUserId()
				var loserID string
				for playerID, mark := range s.Players {
					if mark != playerMark {
						loserID = playerID
						break
					}
				}
				
				winMessage := map[string]interface{}{
					"message": "Player won",
					"winner":  winnerID,
				}
				winMessageJSON, _ := json.Marshal(winMessage)
				dispatcher.BroadcastMessage(3, winMessageJSON, nil, nil, true)
				
				// Update player stats
				m.updatePlayerStats(ctx, winnerID, true, false)
				if loserID != "bot" {
					m.updatePlayerStats(ctx, loserID, false, false)
				}
				
				// Record match result
				m.recordMatchResult(ctx, s)
			} else if m.checkDraw(s.Board) {
				s.Winner = 3 // Draw
				s.MatchState = MatchStateComplete
				
				// Notify players of draw
				drawMessage := map[string]interface{}{
					"message": "Game ended in a draw",
				}
				drawMessageJSON, _ := json.Marshal(drawMessage)
				dispatcher.BroadcastMessage(3, drawMessageJSON, nil, nil, true)
				
				// Update player stats for both players
				for playerID := range s.Players {
					if playerID != "bot" {
						m.updatePlayerStats(ctx, playerID, false, true)
					}
				}
				
				// Record match result
				m.recordMatchResult(ctx, s)
			} else {
				// Switch turns
				if s.CurrentTurn == MarkX {
					s.CurrentTurn = MarkO
				} else {
					s.CurrentTurn = MarkX
				}
				
				// Notify players of the move
				moveMessage := map[string]interface{}{
					"row":          move.Row,
					"col":          move.Col,
					"mark":         playerMark,
					"current_turn": s.CurrentTurn,
				}
				moveMessageJSON, _ := json.Marshal(moveMessage)
				dispatcher.BroadcastMessage(4, moveMessageJSON, nil, nil, true)
				
				// If it's a bot match and it's the bot's turn, make a bot move
				if s.BotMatch && s.CurrentTurn == s.Players["bot"] {
					s = m.makeBotMove(s, dispatcher)
				}
			}
		}
	}
	
	// Check for inactive game
	if s.MatchState == MatchStateInProgress && time.Since(s.LastMoveTime) > 5*time.Minute {
		// End the game as a draw due to inactivity
		s.Winner = 3 // Draw
		s.MatchState = MatchStateComplete
		
		// Notify players of timeout
		timeoutMessage := map[string]interface{}{
			"message": "Game ended due to inactivity",
		}
		timeoutMessageJSON, _ := json.Marshal(timeoutMessage)
		dispatcher.BroadcastMessage(3, timeoutMessageJSON, nil, nil, true)
		
		// Update player stats for both players
		for playerID := range s.Players {
			if playerID != "bot" {
				m.updatePlayerStats(ctx, playerID, false, true)
			}
		}
		
		// Record match result
		m.recordMatchResult(ctx, s)
	}
	
	// Update match label periodically
	if tick%int64(m.tickRate*m.labelUpdateRateSec) == 0 {
		label := map[string]interface{}{
			"open": s.MatchState == MatchStateInit,
			"type": "tic_tac_toe",
		}
		labelJSON, _ := json.Marshal(label)
		dispatcher.MatchLabelUpdate(string(labelJSON))
	}
	
	return s
}

// MatchTerminate is called when the match is terminated
func (m *TicTacToeMatch) MatchTerminate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, dispatcher runtime.MatchDispatcher, tick int64, state interface{}, graceSeconds int) interface{} {
	s := state.(*TicTacToeState)
	
	// If the game is still in progress, end it as a draw
	if s.MatchState == MatchStateInProgress {
		s.Winner = 3 // Draw
		s.MatchState = MatchStateComplete
		
		// Update player stats for both players
		for playerID := range s.Players {
			if playerID != "bot" {
				m.updatePlayerStats(ctx, playerID, false, true)
			}
		}
		
		// Record match result
		m.recordMatchResult(ctx, s)
	}
	
	return s
}

// makeBotMove makes a move for the bot based on difficulty
func (m *TicTacToeMatch) makeBotMove(s *TicTacToeState, dispatcher runtime.MatchDispatcher) *TicTacToeState {
	// Wait a bit to simulate thinking
	time.Sleep(1 * time.Second)
	
	var row, col int
	
	switch s.BotDifficulty {
	case "easy":
		// Easy bot makes random moves
		row, col = m.makeRandomMove(s.Board)
	case "hard":
		// Hard bot uses minimax algorithm
		row, col = m.makeMinimaxMove(s.Board, s.Players["bot"])
	default: // medium
		// Medium bot has 50% chance to make optimal move, 50% chance to make random move
		if m.rng.Intn(2) == 0 {
			row, col = m.makeMinimaxMove(s.Board, s.Players["bot"])
		} else {
			row, col = m.makeRandomMove(s.Board)
		}
	}
	
	// Make the move
	s.Board[row][col] = s.Players["bot"]
	s.LastMoveTime = time.Now()
	
	// Check for win or draw
	if m.checkWin(s.Board, row, col) {
		s.Winner = s.Players["bot"]
		s.MatchState = MatchStateComplete
		
		// Notify players of bot win
		winMessage := map[string]interface{}{
			"message": "Bot won",
			"winner":  "bot",
		}
		winMessageJSON, _ := json.Marshal(winMessage)
		dispatcher.BroadcastMessage(3, winMessageJSON, nil, nil, true)
		
		// Update player stats for human player
		for playerID := range s.Players {
			if playerID != "bot" {
				m.updatePlayerStats(context.Background(), playerID, false, false)
				break
			}
		}
		
		// Record match result
		m.recordMatchResult(context.Background(), s)
	} else if m.checkDraw(s.Board) {
		s.Winner = 3 // Draw
		s.MatchState = MatchStateComplete
		
		// Notify players of draw
		drawMessage := map[string]interface{}{
			"message": "Game ended in a draw",
		}
		drawMessageJSON, _ := json.Marshal(drawMessage)
		dispatcher.BroadcastMessage(3, drawMessageJSON, nil, nil, true)
		
		// Update player stats for human player
		for playerID := range s.Players {
			if playerID != "bot" {
				m.updatePlayerStats(context.Background(), playerID, false, true)
				break
			}
		}
		
		// Record match result
		m.recordMatchResult(context.Background(), s)
	} else {
		// Switch turns
		s.CurrentTurn = MarkX
		
		// Notify players of the bot move
		moveMessage := map[string]interface{}{
			"row":          row,
			"col":          col,
			"mark":         s.Players["bot"],
			"current_turn": s.CurrentTurn,
		}
		moveMessageJSON, _ := json.Marshal(moveMessage)
		dispatcher.BroadcastMessage(4, moveMessageJSON, nil, nil, true)
	}
	
	return s
}

// makeRandomMove returns a random valid move
func (m *TicTacToeMatch) makeRandomMove(board [][]int) (int, int) {
	// Find all empty cells
	var emptyCells [][2]int
	for i := 0; i < BoardSize; i++ {
		for j := 0; j < BoardSize; j++ {
			if board[i][j] == MarkEmpty {
				emptyCells = append(emptyCells, [2]int{i, j})
			}
		}
	}
	
	// Pick a random empty cell
	if len(emptyCells) > 0 {
		randomIndex := m.rng.Intn(len(emptyCells))
		return emptyCells[randomIndex][0], emptyCells[randomIndex][1]
	}
	
	// Should never reach here if board validation is correct
	return 0, 0
}

// makeMinimaxMove returns the best move using minimax algorithm
func (m *TicTacToeMatch) makeMinimaxMove(board [][]int, botMark int) (int, int) {
	// Define opponent mark
	opponentMark := MarkX
	if botMark == MarkX {
		opponentMark = MarkO
	}
	
	// Find best move
	var bestScore = -1000
	var bestRow, bestCol int
	
	for i := 0; i < BoardSize; i++ {
		for j := 0; j < BoardSize; j++ {
			// Check if cell is empty
			if board[i][j] == MarkEmpty {
				// Make the move
				board[i][j] = botMark
				
				// Calculate score using minimax
				score := m.minimax(board, 0, false, botMark, opponentMark)
				
				// Undo the move
				board[i][j] = MarkEmpty
				
				// Update best score
				if score > bestScore {
					bestScore = score
					bestRow = i
					bestCol = j
				}
			}
		}
	}
	
	return bestRow, bestCol
}

// minimax implements the minimax algorithm for optimal move selection
func (m *TicTacToeMatch) minimax(board [][]int, depth int, isMaximizing bool, botMark int, opponentMark int) int {
	// Check for terminal states
	if m.checkWinForMark(board, botMark) {
		return 10 - depth
	}
	if m.checkWinForMark(board, opponentMark) {
		return depth - 10
	}
	if m.checkDraw(board) {
		return 0
	}
	
	if isMaximizing {
		// Maximizing player (bot)
		var bestScore = -1000
		
		for i := 0; i < BoardSize; i++ {
			for j := 0; j < BoardSize; j++ {
				if board[i][j] == MarkEmpty {
					board[i][j] = botMark
					score := m.minimax(board, depth+1, false, botMark, opponentMark)
					board[i][j] = MarkEmpty
					bestScore = max(score, bestScore)
				}
			}
		}
		
		return bestScore
	} else {
		// Minimizing player (opponent)
		var bestScore = 1000
		
		for i := 0; i < BoardSize; i++ {
			for j := 0; j < BoardSize; j++ {
				if board[i][j] == MarkEmpty {
					board[i][j] = opponentMark
					score := m.minimax(board, depth+1, true, botMark, opponentMark)
					board[i][j] = MarkEmpty
					bestScore = min(score, bestScore)
				}
			}
		}
		
		return bestScore
	}
}

// checkWin checks if the last move resulted in a win
func (m *TicTacToeMatch) checkWin(board [][]int, row int, col int) bool {
	mark := board[row][col]
	
	// Check row
	rowWin := true
	for i := 0; i < BoardSize; i++ {
		if board[row][i] != mark {
			rowWin = false
			break
		}
	}
	if rowWin {
		return true
	}
	
	// Check column
	colWin := true
	for i := 0; i < BoardSize; i++ {
		if board[i][col] != mark {
			colWin = false
			break
		}
	}
	if colWin {
		return true
	}
	
	// Check diagonals
	if row == col {
		// Main diagonal
		diagWin := true
		for i := 0; i < BoardSize; i++ {
			if board[i][i] != mark {
				diagWin = false
				break
			}
		}
		if diagWin {
			return true
		}
	}
	
	if row+col == BoardSize-1 {
		// Anti-diagonal
		antiDiagWin := true
		for i := 0; i < BoardSize; i++ {
			if board[i][BoardSize-1-i] != mark {
				antiDiagWin = false
				break
			}
		}
		if antiDiagWin {
			return true
		}
	}
	
	return false
}

// checkWinForMark checks if the given mark has won
func (m *TicTacToeMatch) checkWinForMark(board [][]int, mark int) bool {
	// Check rows
	for i := 0; i < BoardSize; i++ {
		if board[i][0] == mark && board[i][1] == mark && board[i][2] == mark {
			return true
		}
	}
	
	// Check columns
	for i := 0; i < BoardSize; i++ {
		if board[0][i] == mark && board[1][i] == mark && board[2][i] == mark {
			return true
		}
	}
	
	// Check diagonals
	if board[0][0] == mark && board[1][1] == mark && board[2][2] == mark {
		return true
	}
	if board[0][2] == mark && board[1][1] == mark && board[2][0] == mark {
		return true
	}
	
	return false
}

// checkDraw checks if the game is a draw
func (m *TicTacToeMatch) checkDraw(board [][]int) bool {
	// Check if board is full
	for i := 0; i < BoardSize; i++ {
		for j := 0; j < BoardSize; j++ {
			if board[i][j] == MarkEmpty {
				return false
			}
		}
	}
	
	// No empty cells and no winner means it's a draw
	return true
}

// updatePlayerStats updates a player's stats after a match
func (m *TicTacToeMatch) updatePlayerStats(ctx context.Context, userID string, win bool, draw bool) {
	// Skip for bot players
	if userID == "bot" {
		return
	}
	
	// Prepare RPC payload
	payload := map[string]interface{}{
		"user_id": userID,
		"win":     win,
		"draw":    draw,
		"score":   win ? 10 : (draw ? 5 : 0), // 10 points for win, 5 for draw, 0 for loss
	}
	
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		m.logger.Error("Error marshaling player stats payload: %v", err)
		return
	}
	
	// Call RPC to update player stats
	_, err = m.nk.RpcFunc(ctx, "update_player_stats", string(payloadJSON), userID, true)
	if err != nil {
		m.logger.Error("Error updating player stats: %v", err)
	}
}

// recordMatchResult records the match result in the database
func (m *TicTacToeMatch) recordMatchResult(ctx context.Context, s *TicTacToeState) {
	// Get player IDs
	var player1ID, player2ID, winnerID string
	
	for playerID, mark := range s.Players {
		if mark == MarkX {
			player1ID = playerID
		} else if mark == MarkO {
			player2ID = playerID
		}
	}
	
	// Set winner ID
	if s.Winner == MarkX {
		winnerID = player1ID
	} else if s.Winner == MarkO {
		winnerID = player2ID
	}
	
	// Skip recording for bot matches
	if player1ID == "bot" || player2ID == "bot" {
		return
	}
	
	// Insert match record
	query := `
		INSERT INTO matches (player1_id, player2_id, winner_id, is_draw, game_state)
		VALUES ($1, $2, $3, $4, $5)
	`
	
	// Convert game state to JSON
	gameStateJSON, err := json.Marshal(s)
	if err != nil {
		m.logger.Error("Error marshaling game state: %v", err)
		return
	}
	
	// Execute query
	_, err = m.db.ExecContext(ctx, query, player1ID, player2ID, winnerID, s.Winner == 3, gameStateJSON)
	if err != nil {
		m.logger.Error("Error recording match result: %v", err)
	}
}

// Helper functions
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}