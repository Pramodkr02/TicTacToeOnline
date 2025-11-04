-- Create custom tables for our game
CREATE TABLE IF NOT EXISTS player_stats (
  user_id UUID PRIMARY KEY,
  username VARCHAR(128) NOT NULL,
  score INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  rank INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL,
  player2_id UUID NOT NULL,
  winner_id UUID,
  is_draw BOOLEAN DEFAULT FALSE,
  game_state JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS player_stats_score_idx ON player_stats(score DESC);
CREATE INDEX IF NOT EXISTS matches_player1_idx ON matches(player1_id);
CREATE INDEX IF NOT EXISTS matches_player2_idx ON matches(player2_id);