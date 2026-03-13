const { ok, failSoft, fail } = require("../services/response");
const logger = require("../services/logger");
const q = require("../DB/queries/notesQueries");

function mapNoteRow(row) {
  const note = {
    id: row.id,
    title: row.title,
    description: row.description,
    color: row.color,
    is_important: row.is_important,
    event_date: row.event_date,
    end_date: row.end_date,
    category_id: row.category_id,
    location: row.location,
    is_private: row.is_private,
    is_recurring: row.is_recurring,
    recurrence_rule: row.recurrence_rule,
    is_completed: row.is_completed,
    priority: row.priority,
    created_at: row.created_at,
    updated_at: row.updated_at,
    notification: null,
  };

  if (row.reminder_id) {
    note.notification = {
      id: row.reminder_id,
      remind_at: row.remind_at,
      notification_type: row.notification_type,
    };
  }

  return note;
}



exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteIdRaw = req.body?.note_id ?? req.body?.id;

    if (noteIdRaw !== undefined) {
      const noteId = Number(noteIdRaw);
      if (!Number.isFinite(noteId)) return failSoft(res, "Invalid note_id");

      const one = await q.getNoteById(userId, noteId);
      if (one.rowCount === 0) return failSoft(res, "Note not found");

      const note = mapNoteRow(one.rows[0]);

      logger.info("notes.getByBodyId", { requestId: req.requestId, userId, noteId });

      return ok(res, "Note loaded", { note });
    }

    const result = await q.listNotes(userId);
    const notes = result.rows.map(mapNoteRow);

    logger.info("notes.list", { requestId: req.requestId, userId });

    return ok(res, "Notes loaded", { notes });
  } catch (e) {
    logger.error("notes.list failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.getById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return failSoft(res, "Invalid id");

    const result = await q.getNoteById(userId, id);
    if (result.rowCount === 0) return failSoft(res, "Note not found");

    const note = mapNoteRow(result.rows[0]);

    logger.info("notes.getById", { requestId: req.requestId, userId, noteId: id });

    return ok(res, "Note loaded", { note });
  } catch (e) {
    logger.error("notes.getById failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.add = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note, notification } = req.body || {};

    if (!note?.header) return failSoft(res, "note.header is required");

    const createdEvent = await q.createNote(userId, note);
    const eventId = createdEvent.rows[0].id;

    let createdNotification = null;
    if (notification?.date) {
      const r = await q.createReminder(userId, eventId, notification);
      createdNotification = {
        id: r.rows[0].id,
        remind_at: r.rows[0].remind_at,
        notification_type: r.rows[0].notification_type,
      };
    }

    logger.info("notes.add", { requestId: req.requestId, userId, eventId });

    return ok(res, "Note created", { event_id: eventId, notification: createdNotification });
  } catch (e) {
    logger.error("notes.add failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.edit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note } = req.body || {};

    if (!note?.note_id) return failSoft(res, "note.note_id is required");

    const updated = await q.updateNote(userId, note);
    if (updated.rowCount === 0) return failSoft(res, "Note not found");

    logger.info("notes.edit", { requestId: req.requestId, userId, noteId: note.note_id });

    return ok(res, "Note updated");
  } catch (e) {
    logger.error("notes.edit failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note_id } = req.body || {};

    if (!note_id) return failSoft(res, "note_id is required");

    const deleted = await q.deleteNote(userId, note_id);
    if (deleted.rowCount === 0) return failSoft(res, "Note not found");

    logger.info("notes.delete", { requestId: req.requestId, userId, noteId: note_id });

    return ok(res, "Note deleted", { id: deleted.rows[0].id });
  } catch (e) {
    logger.error("notes.delete failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.notifyList = async (req, res) => {
  try {
    const userId = req.user.userId;
    const noteId = req.query.note_id ? Number(req.query.note_id) : null;
    if (req.query.note_id && !Number.isFinite(noteId)) return failSoft(res, "Invalid note_id");

    const result = await q.listReminders(userId, noteId);

    logger.info("notify.list", { requestId: req.requestId, userId, noteId: noteId || undefined });

    return ok(res, "Notifications loaded", { notifications: result.rows });
  } catch (e) {
    logger.error("notify.list failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.notifyAdd = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { note_id, notification } = req.body || {};

    if (!note_id || !notification?.date) {
      return failSoft(res, "note_id and notification.date are required");
    }

    const r = await q.createReminder(userId, note_id, notification);

    logger.info("notify.add", {
      requestId: req.requestId,
      userId,
      noteId: note_id,
      notificationId: r.rows[0].id,
    });

    return ok(res, "Notification added", {
      notification: {
        id: r.rows[0].id,
        remind_at: r.rows[0].remind_at,
        notification_type: r.rows[0].notification_type,
      },
    });
  } catch (e) {
    logger.error("notify.add failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.notifyEdit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notification } = req.body || {};

    if (!notification?.notification_id) {
      return failSoft(res, "notification.notification_id is required");
    }

    const updated = await q.updateReminder(userId, notification);
    if (updated.rowCount === 0) return failSoft(res, "Notification not found");

    logger.info("notify.edit", { requestId: req.requestId, userId, notificationId: notification.notification_id });

    return ok(res, "Notification updated");
  } catch (e) {
    logger.error("notify.edit failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};


exports.notifyDelete = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notification_id = (req.body && req.body.notification_id) ?? req.query.notification_id;

    if (!notification_id) return failSoft(res, "notification_id is required");

    const deleted = await q.deleteReminder(userId, notification_id);
    if (deleted.rowCount === 0) return failSoft(res, "Notification not found");

    logger.info("notify.delete", { requestId: req.requestId, userId, notificationId: notification_id });

    return ok(res, "Notification deleted", { id: deleted.rows[0].id });
  } catch (e) {
    logger.error("notify.delete failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};