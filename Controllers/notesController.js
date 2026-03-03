const pool = require("../DB");
const { ok, fail } = require("../utils/response");

// GET /apiv1/notes
exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;

    const q = `
      SELECT e.id, e.title, e.description, e.event_date, e.is_private, e.priority,
             r.id AS reminder_id, r.remind_at, r.notification_type
      FROM events e
      LEFT JOIN reminders r ON r.event_id = e.id AND r.user_id = e.user_id
      WHERE e.user_id = $1
      ORDER BY e.event_date DESC
    `;
          
    const result = await pool.query(q, [userId]);
    return ok(res, "Notes loaded", { notes: result.rows });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

// POST /apiv1/notes/add
exports.add = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note, notification } = req.body;

    if (!note?.header) return fail(res, 400, "note.header is required");

    const createdEvent = await pool.query(
      `INSERT INTO events (user_id, title, description, event_date, is_private, priority)
       VALUES ($1, $2, $3, COALESCE($4::timestamptz, NOW()), COALESCE($5, TRUE), COALESCE($6, 0))
       RETURNING id`,
      [
        userId,
        note.header,
        note.text || null,
        note.date || null,                // если у тебя будет поле даты на клиенте
        note.is_private ?? true,
        note.priority ?? 0,
      ]
    );

    const eventId = createdEvent.rows[0].id;

    // опционально: создать reminder
    let reminder = null;
    if (notification?.date) {
      const r = await pool.query(
        `INSERT INTO reminders (event_id, user_id, remind_at, notification_type)
         VALUES ($1, $2, $3::timestamptz, COALESCE($4, 'push'))
         RETURNING id, remind_at, notification_type`,
        [eventId, userId, notification.date, notification.type]
      );
      reminder = r.rows[0];
    }

    return ok(res, "Note created", { event_id: eventId, reminder });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

// POST /apiv1/notes/edit
exports.edit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note } = req.body;

    if (!note?.note_id) return fail(res, 400, "note.note_id is required");

    await pool.query(
      `UPDATE events
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           is_private = COALESCE($3, is_private),
           priority = COALESCE($4, priority)
       WHERE id = $5 AND user_id = $6`,
      [note.header, note.text, note.is_private, note.priority, note.note_id, userId]
    );

    return ok(res, "Note updated");
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

// DELETE /apiv1/notes/delete
exports.remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note_id } = req.body;

    if (!note_id) return fail(res, 400, "note_id is required");

    await pool.query(`DELETE FROM events WHERE id = $1 AND user_id = $2`, [note_id, userId]);
    return ok(res, "Note deleted");
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

// Notify endpoints: reminders
exports.notifyAdd = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note_id, notification } = req.body;
    if (!note_id || !notification?.date) return fail(res, 400, "note_id and notification.date are required");

    const r = await pool.query(
      `INSERT INTO reminders (event_id, user_id, remind_at, notification_type)
       VALUES ($1, $2, $3::timestamptz, COALESCE($4, 'push'))
       RETURNING id, remind_at, notification_type`,
      [note_id, userId, notification.date, notification.type]
    );

    return ok(res, "Notification added", { notification: r.rows[0] });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

exports.notifyEdit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notification } = req.body;
    if (!notification?.notificatin_id) return fail(res, 400, "notification.notificatin_id is required");

    await pool.query(
      `UPDATE reminders
       SET remind_at = COALESCE($1::timestamptz, remind_at),
           notification_type = COALESCE($2, notification_type)
       WHERE id = $3 AND user_id = $4`,
      [notification.date, notification.type, notification.notificatin_id, userId]
    );

    return ok(res, "Notification updated");
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

exports.notifyDelete = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notification_id } = req.body;
    if (!notification_id) return fail(res, 400, "notification_id is required");

    await pool.query(`DELETE FROM reminders WHERE id = $1 AND user_id = $2`, [notification_id, userId]);
    return ok(res, "Notification deleted");
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};