const pool = require("../DB");
const { ok, fail } = require("../services/response");

// GET /apiv1/categories
exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;

    const system = await pool.query(
      `SELECT id, name, color, icon, description, is_system, created_at
       FROM categories
       WHERE is_system = TRUE
       ORDER BY name`
    );

    const user = await pool.query(
      `SELECT id, user_id, name, color, icon, created_at
       FROM user_categories
       WHERE user_id = $1
       ORDER BY name`,
      [userId]
    );

    return ok(res, "Categories loaded", {
      system_categories: system.rows,
      user_categories: user.rows,
    });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

// POST /apiv1/categories/add
exports.add = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, color, icon } = req.body;

    if (!name) return fail(res, 400, "name is required");

    const created = await pool.query(
      `INSERT INTO user_categories (user_id, name, color, icon)
       VALUES ($1, $2, COALESCE($3, '#3498db'), $4)
       RETURNING id, user_id, name, color, icon, created_at`,
      [userId, name, color, icon || null]
    );

    return ok(res, "User category created", { category: created.rows[0] });
  } catch (e) {
    // уникальность (user_id, name)
    if (e?.code === "23505") return fail(res, 409, "Category name already exists");
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

// POST /apiv1/categories/edit
exports.edit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, name, color, icon } = req.body;

    if (!id) return fail(res, 400, "id is required");

    const updated = await pool.query(
      `UPDATE user_categories
       SET name = COALESCE($1, name),
           color = COALESCE($2, color),
           icon = COALESCE($3, icon)
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, name, color, icon, created_at`,
      [name, color, icon, id, userId]
    );

    if (updated.rowCount === 0) return fail(res, 404, "Category not found");

    return ok(res, "User category updated", { category: updated.rows[0] });
  } catch (e) {
    if (e?.code === "23505") return fail(res, 409, "Category name already exists");
    console.error(e);
    return fail(res, 500, "Server error");
  }
};

// DELETE /apiv1/categories/delete
exports.remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const category_id = req.body.id ?? req.query.id;

    if (!category_id) return fail(res, 400, "id is required");

    const deleted = await pool.query(
      `DELETE FROM user_categories
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [category_id, userId]
    );

    if (deleted.rowCount === 0) return fail(res, 404, "Category not found");

    return ok(res, "User category deleted", { id: deleted.rows[0].id });
  } catch (e) {
    console.error(e);
    return fail(res, 500, "Server error");
  }
};