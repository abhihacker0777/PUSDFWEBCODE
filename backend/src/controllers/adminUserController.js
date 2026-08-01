const {
  adminUserCreateBodySchema,
  adminUserUpdateBodySchema,
  adminUserDeleteBodySchema
} = require("../validators/authValidators");
const {
  listManagedAdminUsers,
  createManagedAdminUser,
  updateManagedAdminUser,
  deleteManagedAdminUser
} = require("../services/adminAuthService");

async function listAdminUsers(req, res) {
  try {
    res.json({ success: true, users: await listManagedAdminUsers() });
  } catch (err) {
    console.error("Admin users fetch failed:", err.message);
    res.status(500).json({ success: false, message: "Unable to load admin users." });
  }
}

async function createAdminUser(req, res) {
  try {
    const parsed = adminUserCreateBodySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid admin user details." });
    const user = await createManagedAdminUser(parsed.data);
    res.status(201).json({ success: true, user });
  } catch (err) {
    console.error("Admin user create failed:", err.message);
    res.status(400).json({ success: false, message: err.message || "Unable to create admin user." });
  }
}

async function updateAdminUser(req, res) {
  try {
    const parsed = adminUserUpdateBodySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid admin user details." });
    const user = await updateManagedAdminUser(parsed.data);
    res.json({ success: true, user });
  } catch (err) {
    console.error("Admin user update failed:", err.message);
    res.status(400).json({ success: false, message: err.message || "Unable to update admin user." });
  }
}

async function deleteAdminUser(req, res) {
  try {
    const parsed = adminUserDeleteBodySchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ success: false, message: "Invalid admin user." });
    await deleteManagedAdminUser(parsed.data.id);
    res.json({ success: true });
  } catch (err) {
    console.error("Admin user delete failed:", err.message);
    res.status(400).json({ success: false, message: err.message || "Unable to delete admin user." });
  }
}

module.exports = {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
};
