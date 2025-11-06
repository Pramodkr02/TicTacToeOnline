package main

import (
	"context"
	"database/sql"

	"github.com/heroiclabs/nakama-common/runtime"
)

// InitModule is called when the server starts
func InitModule(ctx context.Context, logger runtime.Logger, db *sql.DB, nk runtime.NakamaModule, initializer runtime.Initializer) error {
	logger.Info("Initializing Nakama Arena game module")

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

	if err := initializer.RegisterRpc("request_verification", requestVerification); err != nil {
		logger.Error("Unable to register RPC function request_verification: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("verify_code", verifyCode); err != nil {
		logger.Error("Unable to register RPC function verify_code: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("get_verification_status", getVerificationStatus); err != nil {
 		logger.Error("Unable to register RPC function get_verification_status: %v", err)
 		return err
 	}

	if err := initializer.RegisterRpc("make_move", rpcMakeMove); err != nil {
		logger.Error("Unable to register RPC function make_move: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("list_rooms", rpcListRooms); err != nil {
		logger.Error("Unable to register RPC: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("create_room", rpcCreateRoom); err != nil {
		logger.Error("Unable to register RPC: %v", err)
		return err
	}

	if err := initializer.RegisterRpc("join_room", rpcJoinRoom); err != nil {
		logger.Error("Unable to register RPC: %v", err)
		return err
	}

	// Register match handler for our game
    if err := initializer.RegisterMatch("tic_tac_toe", createTicTacToeMatch); err != nil {
		logger.Error("Unable to register match handler: %v", err)
		return err
	}

	logger.Info("Nakama Arena game module initialized successfully")
	return nil
}
