package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/heroiclabs/nakama-common/runtime"
)

// nk represents the Nakama server instance
var nk runtime.NakamaModule

func generateOTP() (string, error) {
	code := ""
	for i := 0; i < 6; i++ {
		code += strconv.Itoa(rand.Intn(10))
	}
	return code, nil
}

func deliverEmail(ctx context.Context, logger runtime.Logger, to string, code string) error {
    url := os.Getenv("EMAIL_WEBHOOK_URL")
    if strings.TrimSpace(url) == "" {
        logger.Info("EMAIL_WEBHOOK_URL not set; verification code for %s is %s", to, code)
        return nil
    }
    payload := map[string]string{
        "to":      to,
        "subject": os.Getenv("EMAIL_SUBJECT_PREFIX") + "Your verification code",
        "text":    "Your verification code is: " + code + "\nIt expires in 10 minutes.",
    }
    b, _ := json.Marshal(payload)
    req, _ := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(string(b)))
    req.Header.Set("Content-Type", "application/json")
    httpClient := &http.Client{Timeout: 5 * time.Second}
    resp, err := httpClient.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()
    if resp.StatusCode < 200 || resp.StatusCode >= 300 {
        return errors.New("email webhook returned non-2xx")
    }
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

// --- Email verification types and RPCs ---
type verifyStorage struct {
    Code      string    `json:"code"`
    ExpiresAt time.Time `json:"expires_at"`
    Verified  bool      `json:"verified"`
    Email     string    `json:"email"`
}

// requestVerification generates and stores an OTP; optionally triggers email via webhook
func requestVerification(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    userID, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
    if !ok || userID == "" {
        return "", runtime.NewError("unauthorized", 401)
    }
    var in struct{ Email string `json:"email"` }
    if payload != "" {
        _ = json.Unmarshal([]byte(payload), &in)
    }
    if strings.TrimSpace(in.Email) == "" {
        acc, err := nk.AccountGetId(ctx, userID)
        if err != nil || acc == nil || acc.Email == "" {
            return "", runtime.NewError("email not set on account", 400)
        }
        in.Email = acc.Email
    }
    code, err := generateOTP()
    if err != nil {
        logger.Error("otp gen error: %v", err)
        return "", runtime.NewError("internal error", 500)
    }
    vs := verifyStorage{Code: code, ExpiresAt: time.Now().Add(10 * time.Minute), Verified: false, Email: in.Email}
    data, _ := json.Marshal(vs)
    write := &runtime.StorageWrite{
        Collection:      "email_verify",
        Key:             "status",
        UserID:          userID,
        Value:           string(data),
        PermissionRead:  1,
        PermissionWrite: 1,
    }
    if _, err := nk.StorageWrite(ctx, []*runtime.StorageWrite{write}); err != nil {
        logger.Error("storage write error: %v", err)
        return "", runtime.NewError("internal error", 500)
    }
    if err := deliverEmail(ctx, logger, in.Email, code); err != nil {
        logger.Warn("email delivery failed: %v", err)
    }
    out := map[string]any{"ok": true, "message": "verification code sent"}
    b, _ := json.Marshal(out)
    return string(b), nil
}

func verifyCode(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    userID, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
    if !ok || userID == "" {
        return "", runtime.NewError("unauthorized", 401)
    }
    var in struct{ Code string `json:"code"` }
    if err := json.Unmarshal([]byte(payload), &in); err != nil || strings.TrimSpace(in.Code) == "" {
        return "", runtime.NewError("invalid code", 400)
    }
    objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{{Collection: "email_verify", Key: "status", UserID: userID}})
    if err != nil || len(objects) == 0 {
        return "", runtime.NewError("no verification session", 400)
    }
    var cur verifyStorage
    if err := json.Unmarshal([]byte(objects[0].Value), &cur); err != nil {
        return "", runtime.NewError("bad verification state", 500)
    }
    if cur.Verified {
        return "{\"ok\":true,\"verified\":true}", nil
    }
    if time.Now().After(cur.ExpiresAt) {
        return "", runtime.NewError("code expired", 400)
    }
    if cur.Code != in.Code {
        return "", runtime.NewError("incorrect code", 400)
    }
    cur.Verified = true
    cur.Code = ""
    data, _ := json.Marshal(cur)
    write := &runtime.StorageWrite{Collection: "email_verify", Key: "status", UserID: userID, Value: string(data), PermissionRead: 1, PermissionWrite: 1}
    if _, err := nk.StorageWrite(ctx, []*runtime.StorageWrite{write}); err != nil {
        logger.Error("storage write verify error: %v", err)
        return "", runtime.NewError("internal error", 500)
    }
    return "{\"ok\":true,\"verified\":true}", nil
}

func getVerificationStatus(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    userID, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
    if !ok || userID == "" {
        return "", runtime.NewError("unauthorized", 401)
    }
    objects, err := nk.StorageRead(ctx, []*runtime.StorageRead{{Collection: "email_verify", Key: "status", UserID: userID}})
    if err != nil || len(objects) == 0 {
        return "{\"verified\":false}", nil
    }
    var cur verifyStorage
    if err := json.Unmarshal([]byte(objects[0].Value), &cur); err != nil {
        return "{\"verified\":false}", nil
    }
    out := map[string]any{"verified": cur.Verified}
    b, _ := json.Marshal(out)
    return string(b), nil
}



func rpcMakeMove(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	userID, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
	if !ok {
		return "", runtime.NewError("User ID not found", 401)
	}

	var input struct {
		MatchID string `json:"match_id"`
		Move    int    `json:"move"`
	}

	if err := json.Unmarshal([]byte(payload), &input); err != nil {
		return "", runtime.NewError("Invalid payload", 400)
	}

	// In a real-world scenario, you would have a more complex state management.
	// For this example, we'll just broadcast the move to the other player.

	// Create the data to send
	data, _ := json.Marshal(map[string]interface{}{
		"move":     input.Move,
		"sender":   userID,
		"op_code":  1, // OpCode for a move
	})

	// Send the data to the match
	nk.MatchSignal(ctx, input.MatchID, string(data))

	return "{\"success\":true}", nil
}

func rpcListRooms(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	const limit = 10

	matches, err := nk.MatchList(ctx, limit, true, "", nil, nil, "")
	if err != nil {
		logger.Error("Error listing matches: %v", err)
		return "", err
	}

	// We use a map to deduplicate matches by ID, as a match can have multiple nodes.
	deduplicatedMatches := make(map[string]interface{})
	matchList := make([]map[string]interface{}, 0)
	
	for _, match := range matches {
		if _, ok := deduplicatedMatches[match.MatchId]; !ok {
			deduplicatedMatches[match.MatchId] = true
			matchList = append(matchList, map[string]interface{}{
				"match_id":     match.MatchId,
				"authoritative": match.Authoritative,
				"size":         match.Size,
			})
		}
	}

	// Create a response structure
	response := struct {
		Rooms []map[string]interface{} `json:"rooms"`
	}{
		Rooms: matchList,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		logger.Error("Error marshalling response: %v", err)
		return "", err
	}

	return string(jsonResponse), nil
}

func rpcCreateRoom(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
	matchID, err := nk.MatchCreate(ctx, "tic_tac_toe", map[string]interface{}{"name": "New Room"})
	if err != nil {
		logger.Error("Error creating match: %v", err)
		return "", err
	}

	response := map[string]string{"match_id": matchID}
	jsonResponse, _ := json.Marshal(response)

	return string(jsonResponse), nil
}

func rpcJoinRoom(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, payload string) (string, error) {
    _, ok := ctx.Value(runtime.RUNTIME_CTX_USER_ID).(string)
    if !ok {
		return "", runtime.NewError("User ID not found", 401)
	}

	var input struct {
		MatchID string `json:"match_id"`
	}

	if err := json.Unmarshal([]byte(payload), &input); err != nil {
		return "", runtime.NewError("Invalid payload", 400)
	}

	return "{\"success\":true,\"match_id\":\"" + input.MatchID + "\"}", nil
}
