const pool = require("../index");

async function listSystemCategories() {
  return pool.query(
    `SELECT id, name, color, icon, description, is_system, created_at
     FROM categories
     WHERE is_system = TRUE
     ORDER BY name`
  );
}

async function listUserCategories(userId) {
  return pool.query(
    `SELECT id, user_id, name, color, icon, created_at
     FROM user_categories
     WHERE user_id = $1
     ORDER BY name`,
    [userId]
  );
}

async function createUserCategory(userId, { name, color, icon }) {
  return pool.query(
    `INSERT INTO user_categories (user_id, name, color, icon)
     VALUES ($1, $2, COALESCE($3, '#3498db'), $4)
     RETURNING id, user_id, name, color, icon, created_at`,
    [userId, name, color, icon || null]
  );
}

async function updateUserCategory(userId, { id, name, color, icon }) {
  return pool.query(
    `UPDATE user_categories
     SET name = COALESCE($1, name),
         color = COALESCE($2, color),
         icon = COALESCE($3, icon)
     WHERE id = $4 AND user_id = $5
     RETURNING id, user_id, name, color, icon, created_at`,
    [name ?? null, color ?? null, icon ?? null, id, userId]
  );
}

async function deleteUserCategory(userId, id) {
  return pool.query(
    `DELETE FROM user_categories WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
}

async function getSystemCategoryById(id) {
  return pool.query(
    `SELECT id, name, color, icon, description, is_system, created_at
     FROM categories
     WHERE is_system = TRUE AND id = $1
     LIMIT 1`,
    [id]
  );
}

module.exports = {
  listSystemCategories,
  listUserCategories,
  createUserCategory,
  updateUserCategory,
  deleteUserCategory,
  getSystemCategoryById,
};