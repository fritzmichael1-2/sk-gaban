const router = require("express").Router();
const { query } = require("../config/db");

router.get("/", async (req, res, next) => {
  try {
    const [announcements, projects, events] = await Promise.all([
      query("SELECT * FROM announcements WHERE status='published' ORDER BY published_at DESC, created_at DESC LIMIT 3"),
      query("SELECT * FROM projects WHERE status='published' ORDER BY created_at DESC LIMIT 3"),
      query("SELECT * FROM events WHERE status='published' AND event_date >= CURRENT_DATE ORDER BY event_date ASC LIMIT 3")
    ]);
    res.render("public/home", { title: "Welcome", announcements, projects, events });
  } catch (e) { next(e); }
});

router.get("/about", async (req, res, next) => {
  try {
    const officials = await query("SELECT * FROM officials WHERE is_active=TRUE ORDER BY sort_order, full_name");
    res.render("public/about", { title: "About SK Gaban", officials });
  } catch (e) { next(e); }
});

router.get("/announcements", async (req, res, next) => {
  try {
    const announcements = await query("SELECT * FROM announcements WHERE status='published' ORDER BY published_at DESC, created_at DESC");
    res.render("public/announcements", { title: "Announcements", announcements });
  } catch (e) { next(e); }
});

router.get("/announcements/:slug", async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM announcements WHERE slug=? AND status='published' LIMIT 1", [req.params.slug]);
    if (!rows.length) return res.status(404).render("errors/404", { title: "Announcement not found" });
    res.render("public/announcement-detail", { title: rows[0].title, item: rows[0] });
  } catch (e) { next(e); }
});

router.get("/projects", async (req, res, next) => {
  try {
    const projects = await query("SELECT * FROM projects WHERE status='published' ORDER BY created_at DESC");
    res.render("public/projects", { title: "Programs & Projects", projects });
  } catch (e) { next(e); }
});

router.get("/events", async (req, res, next) => {
  try {
    const events = await query("SELECT * FROM events WHERE status='published' ORDER BY event_date DESC");
    res.render("public/events", { title: "Events", events });
  } catch (e) { next(e); }
});

router.get("/transparency", async (req, res, next) => {
  try {
    const reports = await query("SELECT * FROM transparency_reports WHERE status='published' ORDER BY report_year DESC, created_at DESC");
    res.render("public/transparency", { title: "Transparency & Reports", reports });
  } catch (e) { next(e); }
});

router.get("/youth-services", (req, res) => res.render("public/youth-services", { title: "Youth Services", errors: [] }));

router.post("/youth-services", async (req, res, next) => {
  try {
    const { full_name, age, purok, contact_number, email, service_type, message } = req.body;
    if (!full_name || !age || !purok || !contact_number || !service_type) {
      req.flash("error", "Please complete all required fields.");
      return res.redirect("/youth-services");
    }
    await query(
      `INSERT INTO youth_requests (full_name, age, purok, contact_number, email, service_type, message)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [full_name.trim(), Number(age), purok.trim(), contact_number.trim(), email || null, service_type, message || null]
    );
    req.flash("success", "Your request has been submitted. The SK office will review it.");
    res.redirect("/youth-services");
  } catch (e) { next(e); }
});

router.get("/contact", (req, res) => res.render("public/contact", { title: "Contact Us" }));
router.post("/contact", async (req, res, next) => {
  try {
    const { full_name, email, subject, message } = req.body;
    if (!full_name || !email || !subject || !message) {
      req.flash("error", "Please complete all fields.");
      return res.redirect("/contact");
    }
    await query("INSERT INTO messages (full_name,email,subject,message) VALUES (?,?,?,?)",
      [full_name.trim(), email.trim(), subject.trim(), message.trim()]);
    req.flash("success", "Your message has been sent.");
    res.redirect("/contact");
  } catch (e) { next(e); }
});

module.exports = router;
