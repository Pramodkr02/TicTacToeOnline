package main

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/heroiclabs/nakama-common/runtime"
)

// nk represents the Nakama server instance
var nk runtime.NakamaModule

// InitModule is called when the server starts
func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("Initializing Nakama Arena game module")

	// Set the global nakama instance
	nk = nk

	// Register RPC functions
	if err := initializer.RegisterRpc("register_player", registerPlayer); err != nil {
		logger.Error("Unable to register RPC function: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("update_player_stats", updatePlayerStats); err != nil {
		logger.Error("Unable to register RPC function: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("get_leaderboard", getLeaderboard); err != nil {
		logger.Error("Unable to register RPC function: %v", err)
		return err
	}

	// Register match handler for our game
	if err := initializer.RegisterMatch("tic_tac_toe", createTicTacToeMatch); err != nil {
		logger.Error("Unable to register match handler: %v", err)
		return err
	}

	// Register before match create hook to handle bot matches
	if err := initializer.RegisterBeforeMatchCreate(beforeMatchCreate); err != nil {
		logger.Error("Unable to register before match create hook: %v", err)
		return err
	}

	logger.Info("Nakama Arena game module initialized successfully")
	return nil
}

// registerPlayer creates or updates player stats record
func registerPlayer(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if !ok {
		return "", runtime.NewError("User ID not found", 401)
	}

	username, ok := ctx.Value(runtime.RUNTIME_CTX_USERNAME).(string)
	if !ok {
		return "", runtime.NewError("Username not found", 401)
	}

	// Insert or update player stats
	query := `
		INSERT INTO player_stats (user_id, username)
		VALUES ($1, $2)
		ON CONFLICT (user_id) DO UPDATE
		SET username = $2, updated_at = NOW()
		RETURNING user_id, username, score, wins, losses, draws, rank
	`

	var dbUserID, dbUsername string
	var score, wins, losses, draws, rank int

	err := db.QueryRowContext(ctx, query, userID, username).Scan(&dbUserID, &dbUsername, &score, &wins, &losses, &draws, &rank)
	if err != nil {
		logger.Error("Error registering player: %v", err)
		return "", runtime.NewError("Error registering player", 500)
	}

	// Return player stats as JSON
	result := map[string]interface{}{
		"user_id":  dbUserID,
		"username": dbUsername,
		"score":    score,
		"wins":     wins,
		"losses":   losses,
		"draws":    draws,
		"rank":     rank,
	}

	jsonResult, err := json.Marshal(result)
	if err != nil {
		logger.Error("Error marshaling result: %v", err)
		return "", runtime.NewError("Error processing result", 500)
	}

	return string(jsonResult), nil
}

// updatePlayerStats updates a player's stats after a match
func updatePlayerStats(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	// Parse payload
	var input struct {
		UserID string `json:"user_id"`
		Win    bool   `json:"win"`
		Draw   bool   `json:"draw"`
		Score  int    `json:"score"`
	}

	if err := json.Unmarshal([]byte(payload), &input); err != nil {
		logger.Error("Error parsing payload: %v", err)
		return "", runtime.NewError("Invalid payload", 400)
	}

	// Update player stats based on match result
	var query string
	var args []interface{}

	if input.Draw {
		query = `
			UPDATE player_stats
			SET draws = draws + 1, score = score + $2, updated_at = NOW()
			WHERE user_id = $1
			RETURNING user_id, username, score, wins, losses, draws, rank
		`
		args = []interface{}{input.UserID, input.Score}
	} else if input.Win {
		query = `
			UPDATE player_stats
			SET wins = wins + 1, score = score + $2, updated_at = NOW()
			WHERE user_id = $1
			RETURNING user_id, username, score, wins, losses, draws, rank
		`
		args = []interface{}{input.UserID, input.Score}
	} else {
		query = `
			UPDATE player_stats
			SET losses = losses + 1, updated_at = NOW()
			WHERE user_id = $1
			RETURNING user_id, username, score, wins, losses, draws, rank
		`
		args = []interface{}{input.UserID}
	}

	var dbUserID, dbUsername string
	var score, wins, losses, draws, rank int

	err := db.QueryRowContext(ctx, query, args...).Scan(&dbUserID, &dbUsername, &score, &wins, &losses, &draws, &rank)
	if err != nil {
		logger.Error("Error updating player stats: %v", err)
		return "", runtime.NewError("Error updating player stats", 500)
	}

	// Update ranks for all players
	_, err = db.ExecContext(ctx, `
		WITH ranked_players AS (
			SELECT user_id, RANK() OVER (ORDER BY score DESC) as new_rank
			FROM player_stats
		)
		UPDATE player_stats ps
		SET rank = rp.new_rank
		FROM ranked_players rp
		WHERE ps.user_id = rp.user_id
	`)

	if err != nil {
		logger.Error("Error updating player ranks: %v", err)
		// Continue despite error in rank update
	}

	// Return updated player stats
	result := map[string]interface{}{
		"user_id":  dbUserID,
		"username": dbUsername,
		"score":    score,
		"wins":     wins,
		"losses":   losses,
		"draws":    draws,
		"rank":     rank,
	}

	jsonResult, err := json.Marshal(result)
	if err != nil {
		logger.Error("Error marshaling result: %v", err)
		return "", runtime.NewError("Error processing result", 500)
	}

	return string(jsonResult), nil
}

// getLeaderboard returns the top players
func getLeaderboard(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	// Parse payload for limit
	var input struct {
		Limit int `json:"limit"`
	}

	if err := json.Unmarshal([]byte(payload), &input); err != nil {
		// Default to 10 if not specified
		input.Limit = 10
	}

	if input.Limit <= 0 {
		input.Limit = 10
	}

	// Query top players
	query := `
		SELECT user_id, username, score, wins, losses, draws, rank
		FROM player_stats
		ORDER BY score DESC
		LIMIT $1
	`

	rows, err := db.QueryContext(ctx, query, input.Limit)
	if err != nil {
		logger.Error("Error querying leaderboard: %v", err)
		return "", runtime.NewError("Error retrieving leaderboard", 500)
	}
	defer rows.Close()

	// Build leaderboard result
	var leaderboard []map[string]interface{}

	for rows.Next() {
		var userID, username string
		var score, wins, losses, draws, rank int

		if err := rows.Scan(&userID, &username, &score, &wins, &losses, &draws, &rank); err != nil {
			logger.Error("Error scanning leaderboard row: %v", err)
			continue
		}

		leaderboard = append(leaderboard, map[string]interface{}{
			"user_id":  userID,
			"username": username,
			"score":    score,
			"wins":     wins,
			"losses":   losses,
			"draws":    draws,
			"rank":     rank,
		})
	}

	// Return leaderboard as JSON
	result := map[string]interface{}{
		"leaderboard": leaderboard,
	}

	jsonResult, err := json.Marshal(result)
	if err != nil {
		logger.Error("Error marshaling result: %v", err)
		return "", runtime.NewError("Error processing result", 500)
	}

	return string(jsonResult), nil
}

// beforeMatchCreate is called before a match is created
func beforeMatchCreate(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, matchID string, node string, params map[string]interface{}) (map[string]interface{}, error) {
	// Check if this is a bot match
	isBotMatch, ok := params["bot_match"].(bool)
	if ok && isBotMatch {
		// Add bot flag to match params
		params["bot_match"] = true
		params["bot_difficulty"] = params["bot_difficulty"].(string)
	}

	return params, nil
}
