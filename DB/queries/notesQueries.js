const pool = require("../index");

async function listNotes(userId) {
  const q = `
    SELECT e.id, e.title, e.description, e.color, e.is_important,
           e.event_date, e.end_date, e.category_id,
           e.location, e.is_private, e.is_recurring, e.recurrence_rule,
           e.is_completed, e.priority, e.created_at, e.updated_at,
           r.id AS reminder_id, r.remind_at, r.notification_type, r.is_sent
    FROM events e
    LEFT JOIN reminders r ON r.event_id = e.id AND r.user_id = e.user_id
    WHERE e.user_id = $1
    ORDER BY e.event_date DESC
  `;
  return pool.query(q, [userId]);
}

async function getNoteById(userId, noteId) {
  const q = `
    SELECT e.id, e.title, e.description, e.color, e.is_important,
           e.event_date, e.end_date, e.category_id,
           e.location, e.is_private, e.is_recurring, e.recurrence_rule,
           e.is_completed, e.priority, e.created_at, e.updated_at,
           r.id AS reminder_id, r.remind_at, r.notification_type, r.is_sent
    FROM events e
    LEFT JOIN reminders r ON r.event_id = e.id AND r.user_id = e.user_id
    WHERE e.user_id = $1 AND e.id = $2
    LIMIT 1
  `;
  return pool.query(q, [userId, noteId]);
}

async function createNote(userId, note) {
  const q = `
    INSERT INTO events (
      user_id, title, description, color, is_important,
      event_date, is_private, priority, category_id
    )
    VALUES (
      $1,
      $2,
      $3,
      COALESCE($4, '#3498db'),
      COALESCE($5, FALSE),
      COALESCE($6::timestamptz, NOW()),
      COALESCE($7, TRUE),
      COALESCE($8, 0),
      $9
    )
    RETURNING id
  `;

  const params = [
    userId,
    note.header,
    note.text || null,
    note.color ?? null,
    note.is_important ?? null,
    note.date || null,
    note.is_private ?? true,
    note.priority ?? 0,
    note.category_id ?? null,
  ];

  return pool.query(q, params);
}

async function updateNote(userId, note) {
  const q = `
    UPDATE events
    SET title = COALESCE($1, title),
        description = COALESCE($2, description),
        color = COALESCE($3, color),
        is_important = COALESCE($4, is_important),
        event_date = COALESCE($5::timestamptz, event_date),
        is_private = COALESCE($6, is_private),
        priority = COALESCE($7, priority),
        category_id = COALESCE($8, category_id)
    WHERE id = $9 AND user_id = $10
    RETURNING id
  `;

  const params = [
    note.header ?? null,
    note.text ?? null,
    note.color ?? null,
    note.is_important ?? null,
    note.date ?? null,
    note.is_private ?? null,
    note.priority ?? null,
    note.category_id ?? null,
    note.note_id,
    userId,
  ];

  return pool.query(q, params);
}

async function deleteNote(userId, noteId) {
  return pool.query(
    `DELETE FROM events WHERE id = $1 AND user_id = $2 RETURNING id`,
    [noteId, userId]
  );
}

async function createReminder(userId, noteId, notification) {
  const q = `
    INSERT INTO reminders (event_id, user_id, remind_at, notification_type)
    VALUES ($1, $2, $3::timestamptz, COALESCE($4, 'push'))
    RETURNING id, remind_at, notification_type
  `;
  return pool.query(q, [noteId, userId, notification.date, notification.type]);
}

async function updateReminder(userId, notification) {
  const q = `
    UPDATE reminders
    SET remind_at = COALESCE($1::timestamptz, remind_at),
        notification_type = COALESCE($2, notification_type),
        is_sent = false, sent_at = NULL
    WHERE id = $3 AND user_id = $4
    RETURNING id, event_id
  `;
  return pool.query(q, [notification.date, notification.type, notification.notification_id, userId]);
}

async function deleteReminder(userId, notificationId) {
  return pool.query(
    `DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id, event_id`,
    [notificationId, userId]
  );
}

async function listReminders(userId, noteIdNullable) {
  if (noteIdNullable) {
    return pool.query(
      `SELECT id, event_id, user_id, remind_at, notification_type, is_sent, created_at
       FROM reminders
       WHERE user_id=$1 AND event_id=$2
       ORDER BY remind_at DESC`,
      [userId, noteIdNullable]
    );
  }

  return pool.query(
    `SELECT id, event_id, user_id, remind_at, notification_type, is_sent, created_at
     FROM reminders
     WHERE user_id=$1
     ORDER BY remind_at DESC`,
    [userId]
  );
}

async function listAllReminders() {
  return pool.query(
    `SELECT id, event_id, user_id, remind_at, notification_type, is_sent, created_at
     FROM reminders
     WHERE remind_at > CURRENT_TIMESTAMP
     ORDER BY remind_at DESC`,
  );
}

async function markAsSend(id) {
  return pool.query(
    ` UPDATE reminders
      SET is_sent = true, sent_at = current_timestamp
      WHERE id = $1`,
    [id]
  );
}

module.exports = {
  listNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  createReminder,
  updateReminder,
  deleteReminder,
  listReminders,
  listAllReminders,
  markAsSend,
};