CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(500),
    timezone VARCHAR(50) NOT NULL DEFAULT 'Europe/Moscow',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color CHAR(7) NOT NULL DEFAULT '#3498db',
    icon VARCHAR(50),
    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    location VARCHAR(300),
    is_private BOOLEAN NOT NULL DEFAULT TRUE,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    recurrence_rule VARCHAR(255),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    priority INT NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 3),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_event_range CHECK (end_date IS NULL OR end_date >= event_date)
);

CREATE TABLE IF NOT EXISTS event_permissions (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'view',
    granted_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    granted_by INT REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT unique_event_user UNIQUE(event_id, user_id),
    CONSTRAINT valid_permission_level CHECK (
        permission_level IN ('view', 'edit', 'comment', 'owner')
    )
);

CREATE TABLE IF NOT EXISTS reminders (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    notification_type VARCHAR(20) NOT NULL DEFAULT 'push',
    is_sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_notification_type CHECK (notification_type IN ('push', 'email', 'both')),
    CONSTRAINT valid_sent_fields CHECK (
        (is_sent = FALSE AND sent_at IS NULL) OR (is_sent = TRUE AND sent_at IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS media_files (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    thumbnail_path VARCHAR(500),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_file_type CHECK (file_type IN ('image', 'video', 'document', 'audio'))
);

CREATE TABLE IF NOT EXISTS user_categories (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color CHAR(7) NOT NULL DEFAULT '#3498db',
    icon VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_category UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS user_devices (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
    fcm_token VARCHAR(255) NOT NULL UNIQUE,
    device_name VARCHAR(100),
    app_version VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(is_active);

CREATE TABLE IF NOT EXISTS event_occurrence_exceptions (
    id SERIAL PRIMARY KEY,
    event_id INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    original_date TIMESTAMPTZ NOT NULL,
    new_date TIMESTAMPTZ,
    is_cancelled BOOLEAN NOT NULL DEFAULT FALSE,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_exception CHECK (
        (is_cancelled = TRUE AND new_date IS NULL)
        OR
        (is_cancelled = FALSE AND new_date IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_exceptions_event_original ON event_occurrence_exceptions(event_id, original_date);

CREATE TABLE IF NOT EXISTS notification_logs (
    id SERIAL PRIMARY KEY,
    reminder_id INT REFERENCES reminders(id) ON DELETE SET NULL,
    event_id INT REFERENCES events(id) ON DELETE SET NULL,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    channel VARCHAR(10) NOT NULL CHECK (channel IN ('push', 'email')),
    status VARCHAR(12) NOT NULL CHECK (status IN ('queued', 'sent', 'failed', 'delivered')),
    error_text TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_notif_user_created ON notification_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notif_event ON notification_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_notif_reminder ON notification_logs(reminder_id);

