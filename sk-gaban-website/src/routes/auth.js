const router = require("express").Router();
const bcrypt = require("bcryptjs");
const { query } = require("../config/db");
const { requireGuest } = require("../middleware/auth");

router.get("/login", requireGuest, (req, res) => res.render("auth/login", { title: "Admin Login" }));

router.post("/login", requireGuest, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      req.flash("error", "Enter your username and password.");
      return res.redirect("/auth/login");
    }
    const rows = await query("SELECT id, username, password_hash, full_name, role FROM admins WHERE username=? LIMIT 1", [username.trim()]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      req.flash("error", "Invalid username or password.");
      return res.redirect("/auth/login");
    }
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.admin = {
        id: rows[0].id, username: rows[0].username,
        fullName: rows[0].full_name, role: rows[0].role
      };
      req.flash("success", `Welcome back, ${rows[0].full_name}.`);
      res.redirect("/admin");
    });
  } catch (e) { next(e); }
});

router.post("/logout", (req, res, next) => {
  req.session.destroy(err => {
    if (err) return next(err);
    res.clearCookie("skgaban.sid");
    res.redirect("/");
  });
});

module.exports = router;
