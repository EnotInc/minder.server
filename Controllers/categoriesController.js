const { ok, fail } = require("../services/response");
const logger = require("../services/logger");
const q = require("../DB/queries/categoriesQueries");

// GET /apiv1/categories
exports.list = async (req, res) => {
  try {
    const userId = req.user.userId;

    const system = await q.listSystemCategories();
    const user = await q.listUserCategories(userId);

    logger.info("categories.list", { requestId: req.requestId, userId });

    return ok(res, "Categories loaded", {
      system_categories: system.rows,
      user_categories: user.rows,
    });
  } catch (e) {
    logger.error("categories.list failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};

// POST /apiv1/categories/add
exports.add = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, color, icon } = req.body || {};

    if (!name) return fail(res, 400, "name is required");

    const created = await q.createUserCategory(userId, { name, color, icon });

    logger.info("categories.add", { requestId: req.requestId, userId, categoryId: created.rows[0].id });

    return ok(res, "User category created", { category: created.rows[0] });
  } catch (e) {
    if (e?.code === "23505") return fail(res, 409, "Category name already exists");
    logger.error("categories.add failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};

// POST /apiv1/categories/edit
exports.edit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id, name, color, icon } = req.body || {};

    if (!id) return fail(res, 400, "id is required");

    const updated = await q.updateUserCategory(userId, { id, name, color, icon });
    if (updated.rowCount === 0) return fail(res, 404, "Category not found");

    logger.info("categories.edit", { requestId: req.requestId, userId, categoryId: id });

    return ok(res, "User category updated", { category: updated.rows[0] });
  } catch (e) {
    if (e?.code === "23505") return fail(res, 409, "Category name already exists");
    logger.error("categories.edit failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};

// DELETE /apiv1/categories/delete
exports.remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const category_id = (req.body && req.body.id) ?? req.query.id;

    if (!category_id) return fail(res, 400, "id is required");

    const deleted = await q.deleteUserCategory(userId, category_id);
    if (deleted.rowCount === 0) return fail(res, 404, "Category not found");

    logger.info("categories.delete", { requestId: req.requestId, userId, categoryId: category_id });

    return ok(res, "User category deleted", { id: deleted.rows[0].id });
  } catch (e) {
    logger.error("categories.delete failed", e, { requestId: req.requestId, userId: req.user?.userId });
    return fail(res, 500, "Server error");
  }
};