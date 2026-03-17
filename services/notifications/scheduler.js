const cron = require("node-cron");
const logger = require("../logger.js");
const q_notes = require("../../DB/queries/notesQueries");
const q_auth = require("../../DB/queries/authQueries.js");

const NotificationService = require("./notification.js");

const schedule = {};

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

exports.deledeSchedule = async (note_id) => {
  if (schedule[note_id]){
    schedule[note_id].stop();
  }
}

exports.editSchedule = async (new_time, user_id, note_id) => {
  await this.addSchedule(new_time, user_id, note_id);
}

exports.addSchedule = async (when, user_id, note_id) =>{
    const date = new Date(when);
    const minutes = date.getMinutes();
    const hours = date.getHours();
    const dayOfMonth = date.getDate();
    const month = date.getMonth() + 1;

    const time = `${minutes} ${hours} ${dayOfMonth} ${month} *`;

    try {
      logger.info("adding new notification", {userid: user_id, when: when, note_id: note_id})

      if (schedule[note_id]){
        await schedule[note_id].stop();
      }

      schedule[note_id] = cron.schedule(time, async () => {
        const fcmToken = await q_auth.getFcmToken(user_id)
        if (!fcmToken || fcmToken == "") {
          logger.warn("Unable to send message. User is not logged in. FcmToken is not found")
          schedule[note_id].stop()
          return;
        }

        const one = await q_notes.getNoteById(user_id, note_id);
        const note = mapNoteRow(one.rows[0]);

        NotificationService.send(fcmToken.rows[0].fcm_token, note.title, note.description)
        logger.info("Sending message", {
          note: {
            title: note.title,
            description: note.description,
          },
          fcmToken: fcmToken.rows[0].fcm_token
        })
        await q_notes.deleteReminder(user_id, note.notification.id)
      });
    } catch (e) {
      logger.error("Cannot send message", e)
    }
}