INSERT INTO users (username, email, password_hash, full_name, timezone, email_verified, is_active)
VALUES
  ('ivan',  'ivan@mail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6qjJ4fOq3ZQJfX5VvG5WpL6Y8zQ1C', 'Иван Петров', 'Europe/Moscow', TRUE,  TRUE),
  ('maria', 'maria@mail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6qjJ4fOq3ZQJfX5VvG5WpL6Y8zQ1C', 'Мария Иванова','Europe/Moscow', FALSE, TRUE),
  ('alex',  'alex@mail.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMye3Z6qjJ4fOq3ZQJfX5VvG5WpL6Y8zQ1C', 'Алексей Сидоров','Europe/Moscow', TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;

INSERT INTO categories (name, color, icon, description, is_system)
VALUES
  ('Работа',     '#3498db', 'briefcase', 'Рабочие события', TRUE),
  ('Учёба',      '#9b59b6', 'book',      'Учебные события', TRUE),
  ('Здоровье',   '#e74c3c', 'heart',     'Врачи и здоровье', TRUE),
  ('Спорт',      '#2ecc71', 'football',  'Тренировки и игры', TRUE),
  ('Праздники',  '#f1c40f', 'gift',      'Дни рождения и праздники', TRUE),
  ('Поездки',    '#16a085', 'map',       'Путешествия и поездки', TRUE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_categories (user_id, name, color, icon)
SELECT u.id, x.name, x.color, x.icon
FROM users u
JOIN (VALUES
  ('ivan',  'Личное',   '#1abc9c', 'user'),
  ('ivan',  'Финансы',  '#2c3e50', 'wallet'),
  ('maria', 'Семья',    '#e67e22', 'home'),
  ('maria', 'Проекты',  '#8e44ad', 'folder'),
  ('alex',  'Хобби',    '#34495e', 'star'),
  ('alex',  'Здоровье+', '#c0392b', 'pulse')
) AS x(username, name, color, icon)
ON u.username = x.username
ON CONFLICT (user_id, name) DO NOTHING;

-- Иван: Совещание (есть end_date)
INSERT INTO events (user_id, title, description, event_date, end_date, category_id, is_private, priority, location)
SELECT u.id,
       'Совещание',
       'Рабочая встреча по проекту',
       '2024-04-15 10:00:00+03',
       '2024-04-15 11:00:00+03',
       c.id,
       TRUE,
       2,
       'Офис, переговорная'
FROM users u
JOIN categories c ON c.name = 'Работа'
WHERE u.username = 'ivan'
ON CONFLICT DO NOTHING;

-- Иван: Врач
INSERT INTO events (user_id, title, description, event_date, category_id, is_private, priority, location)
SELECT u.id,
       'Врач',
       'Прием у терапевта',
       '2024-04-16 14:00:00+03',
       c.id,
       TRUE,
       3,
       'Поликлиника'
FROM users u
JOIN categories c ON c.name = 'Здоровье'
WHERE u.username = 'ivan'
ON CONFLICT DO NOTHING;

-- Мария: Учёба
INSERT INTO events (user_id, title, description, event_date, category_id, is_private, priority)
SELECT u.id,
       'Учёба',
       'Онлайн-курс, модуль 2',
       '2024-04-15 18:00:00+03',
       c.id,
       TRUE,
       1
FROM users u
JOIN categories c ON c.name = 'Учёба'
WHERE u.username = 'maria'
ON CONFLICT DO NOTHING;

-- Мария: День рождения (публичное)
INSERT INTO events (user_id, title, description, event_date, category_id, is_private, priority, location)
SELECT u.id,
       'День рождения',
       'Праздник с друзьями',
       '2024-04-18 19:00:00+03',
       c.id,
       FALSE,
       0,
       'Кафе'
FROM users u
JOIN categories c ON c.name = 'Праздники'
WHERE u.username = 'maria'
ON CONFLICT DO NOTHING;

-- Алекс: Футбол (публичное)
INSERT INTO events (user_id, title, description, event_date, category_id, is_private, priority, location)
SELECT u.id,
       'Футбол',
       'Игра с друзьями',
       '2024-04-19 20:00:00+03',
       c.id,
       FALSE,
       1,
       'Стадион'
FROM users u
JOIN categories c ON c.name = 'Спорт'
WHERE u.username = 'alex'
ON CONFLICT DO NOTHING;

-- Алекс: Тренировка (повторяющееся)
INSERT INTO events (user_id, title, description, event_date, category_id, is_private, is_recurring, recurrence_rule, priority)
SELECT u.id,
       'Тренировка',
       'Еженедельная тренировка',
       '2024-04-20 10:00:00+03',
       c.id,
       TRUE,
       TRUE,
       'FREQ=WEEKLY;BYDAY=SA;INTERVAL=1',
       2
FROM users u
JOIN categories c ON c.name = 'Спорт'
WHERE u.username = 'alex'
ON CONFLICT DO NOTHING;

-- Иван может смотреть день рождения Марии
INSERT INTO event_permissions (event_id, user_id, permission_level, granted_by)
SELECT e.id, u_ivan.id, 'view', u_maria.id
FROM users u_maria
JOIN users u_ivan ON u_ivan.username = 'ivan'
JOIN events e ON e.user_id = u_maria.id AND e.title = 'День рождения'
WHERE u_maria.username = 'maria'
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Иван может редактировать футбол Алекса (пример edit)
INSERT INTO event_permissions (event_id, user_id, permission_level, granted_by)
SELECT e.id, u_ivan.id, 'edit', u_alex.id
FROM users u_alex
JOIN users u_ivan ON u_ivan.username = 'ivan'
JOIN events e ON e.user_id = u_alex.id AND e.title = 'Футбол'
WHERE u_alex.username = 'alex'
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Мария может комментировать футбол Алекса
INSERT INTO event_permissions (event_id, user_id, permission_level, granted_by)
SELECT e.id, u_maria.id, 'comment', u_alex.id
FROM users u_alex
JOIN users u_maria ON u_maria.username = 'maria'
JOIN events e ON e.user_id = u_alex.id AND e.title = 'Футбол'
WHERE u_alex.username = 'alex'
ON CONFLICT (event_id, user_id) DO NOTHING;

-- Совещание Ивану (push)
INSERT INTO reminders (event_id, user_id, remind_at, notification_type)
SELECT e.id, u.id, '2024-04-15 09:30:00+03', 'push'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Совещание'
WHERE u.username = 'ivan'
ON CONFLICT DO NOTHING;

-- Врач Ивану (email)
INSERT INTO reminders (event_id, user_id, remind_at, notification_type)
SELECT e.id, u.id, '2024-04-16 13:00:00+03', 'email'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Врач'
WHERE u.username = 'ivan'
ON CONFLICT DO NOTHING;

-- Учёба Марии (push)
INSERT INTO reminders (event_id, user_id, remind_at, notification_type)
SELECT e.id, u.id, '2024-04-15 17:30:00+03', 'push'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Учёба'
WHERE u.username = 'maria'
ON CONFLICT DO NOTHING;

-- День рождения Марии (both)
INSERT INTO reminders (event_id, user_id, remind_at, notification_type)
SELECT e.id, u.id, '2024-04-18 18:00:00+03', 'both'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'День рождения'
WHERE u.username = 'maria'
ON CONFLICT DO NOTHING;

-- Футбол Алексу (уже отправлено)
INSERT INTO reminders (event_id, user_id, remind_at, notification_type, is_sent, sent_at)
SELECT e.id, u.id, '2024-04-19 19:00:00+03', 'push', TRUE, '2024-04-19 19:00:05+03'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Футбол'
WHERE u.username = 'alex'
ON CONFLICT DO NOTHING;

-- Картинка к совещанию (image)
INSERT INTO media_files (event_id, user_id, file_name, file_path, file_type, file_size, mime_type, thumbnail_path)
SELECT e.id, u.id,
       'agenda.png', '/uploads/agenda.png', 'image', 245678, 'image/png', '/uploads/thumbs/agenda_thumb.png'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Совещание'
WHERE u.username = 'ivan'
ON CONFLICT DO NOTHING;

-- Документ к учёбе (document)
INSERT INTO media_files (event_id, user_id, file_name, file_path, file_type, file_size, mime_type)
SELECT e.id, u.id,
       'lesson.pdf', '/uploads/lesson.pdf', 'document', 1048576, 'application/pdf'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Учёба'
WHERE u.username = 'maria'
ON CONFLICT DO NOTHING;

-- Видео к футболу (video)
INSERT INTO media_files (event_id, user_id, file_name, file_path, file_type, file_size, mime_type, thumbnail_path)
SELECT e.id, u.id,
       'match.mp4', '/uploads/match.mp4', 'video', 52428800, 'video/mp4', '/uploads/thumbs/match_thumb.jpg'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Футбол'
WHERE u.username = 'alex'
ON CONFLICT DO NOTHING;

-- Аудио заметка к врачу (audio)
INSERT INTO media_files (event_id, user_id, file_name, file_path, file_type, file_size, mime_type)
SELECT e.id, u.id,
       'note.m4a', '/uploads/note.m4a', 'audio', 2048000, 'audio/mp4'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Врач'
WHERE u.username = 'ivan'
ON CONFLICT DO NOTHING;

INSERT INTO user_devices (user_id, platform, fcm_token, device_name, app_version, is_active, last_seen_at)
SELECT u.id, x.platform, x.fcm_token, x.device_name, x.app_version, x.is_active, CURRENT_TIMESTAMP
FROM users u
JOIN (VALUES
  ('ivan',  'android', 'fcm_ivan_android_001',  'Pixel 7',       '1.0.0', TRUE),
  ('ivan',  'android', 'fcm_ivan_android_002',  'Xiaomi 13',     '1.0.1', FALSE),
  ('maria', 'ios',     'fcm_maria_ios_001',     'iPhone 13',     '1.0.1', TRUE),
  ('alex',  'android', 'fcm_alex_android_001',  'Samsung S23',   '1.0.0', TRUE)
) AS x(username, platform, fcm_token, device_name, app_version, is_active)
ON u.username = x.username
ON CONFLICT (fcm_token) DO NOTHING;

-- перенос: 2024-04-27 10:00 -> 12:00
INSERT INTO event_occurrence_exceptions (event_id, original_date, new_date, is_cancelled, note)
SELECT e.id,
       '2024-04-27 10:00:00+03',
       '2024-04-27 12:00:00+03',
       FALSE,
       'Перенос на более позднее время'
FROM events e
JOIN users u ON u.id = e.user_id
WHERE u.username = 'alex' AND e.title = 'Тренировка'
ON CONFLICT DO NOTHING;

-- отмена: 2024-05-04 10:00
INSERT INTO event_occurrence_exceptions (event_id, original_date, new_date, is_cancelled, note)
SELECT e.id,
       '2024-05-04 10:00:00+03',
       NULL,
       TRUE,
       'Отмена тренировки'
FROM events e
JOIN users u ON u.id = e.user_id
WHERE u.username = 'alex' AND e.title = 'Тренировка'
ON CONFLICT DO NOTHING;

-- Успешная отправка пуша на совещание
INSERT INTO notification_logs (reminder_id, event_id, user_id, channel, status, created_at, sent_at)
SELECT r.id, e.id, u.id,
       'push', 'sent',
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Совещание'
JOIN reminders r ON r.event_id = e.id AND r.user_id = u.id
WHERE u.username = 'ivan'
LIMIT 1;

-- Ошибка email на день рождения (пример failed)
INSERT INTO notification_logs (reminder_id, event_id, user_id, channel, status, error_text)
SELECT r.id, e.id, u.id,
       'email', 'failed',
       'SMTP timeout'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'День рождения'
JOIN reminders r ON r.event_id = e.id AND r.user_id = u.id
WHERE u.username = 'maria'
LIMIT 1;

-- queued (пример “в очереди”)
INSERT INTO notification_logs (event_id, user_id, channel, status)
SELECT e.id, u.id, 'push', 'queued'
FROM users u
JOIN events e ON e.user_id = u.id AND e.title = 'Тренировка'
WHERE u.username = 'alex'
LIMIT 1;