CREATE TABLE IF NOT EXISTS app_logs (
  id BIGSERIAL PRIMARY KEY,
  ts TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  request_id UUID,
  user_id INT,
  method VARCHAR(10),
  path TEXT,
  status INT,
  ms NUMERIC,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_app_logs_ts ON app_logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_app_logs_level ON app_logs(level);
CREATE INDEX IF NOT EXISTS idx_app_logs_request_id ON app_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_app_logs_user_id ON app_logs(user_id);