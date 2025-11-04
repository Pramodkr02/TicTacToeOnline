package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

// nk represents the Nakama server instance
var nk runtime.NakamaModule

// InitModule wires up RPCs, matches and hooks. Kept minimal for clarity.
func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nakama runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("Initializing Nakama Arena modules")

	// Set global Nakama module
	nk = nakama

	// RPCs
	if err := initializer.RegisterRpc("register_player", registerPlayer); err != nil {
		logger.Error("Unable to register RPC register_player: %v", err)
		return err
	}
	if err := initializer.RegisterRpc("update_player_stats", updatePlayerStats); err != nil {
		logger.Error("Unable to register RPC update_player_stats: %v", err)
		return err
	}
	if err := initializer.RegisterRpc("get_leaderboard", getLeaderboard); err != nil {
		logger.Error("Unable to register RPC get_leaderboard: %v", err)
		return err
	}

	// Match handler
	if err := initializer.RegisterMatch("tic_tac_toe", createTicTacToeMatch); err != nil {
		logger.Error("Unable to register match handler: %v", err)
		return err
	}

	// Hooks
	if err := initializer.RegisterBeforeMatchCreate(beforeMatchCreate); err != nil {
		logger.Error("Unable to register before match create: %v", err)
		return err
	}

	logger.Info("Nakama Arena modules initialized")
	return nil
}
