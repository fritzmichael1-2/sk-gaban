const router = require("express").Router();
const { query } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const upload = require("../utils/upload");
const slugify = value => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 150);
const imagePath = req => req.file ? `/uploads/${req.file.filename}` : null;

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const [a,p,e,y,m,r] = await Promise.all([
      query("SELECT COUNT(*) AS n FROM announcements"),
      query("SELECT COUNT(*) AS n FROM projects"),
      query("SELECT COUNT(*) AS n FROM events"),
      query("SELECT COUNT(*) AS n FROM youth_requests WHERE status='pending'"),
      query("SELECT COUNT(*) AS n FROM messages WHERE status='unread'"),
      query("SELECT COUNT(*) AS n FROM transparency_reports")
    ]);
    const latestRequests = await query("SELECT * FROM youth_requests ORDER BY created_at DESC LIMIT 5");
    res.render("admin/dashboard", {
      title: "Dashboard",
      stats: { announcements:a[0].n, projects:p[0].n, events:e[0].n, pendingYouth:y[0].n, unreadMessages:m[0].n, reports:r[0].n },
      latestRequests
    });
  } catch (e) { next(e); }
});

const resources = {
  announcements: {
    table: "announcements",
    fields: ["title","category","excerpt","content","status"],
    extra: ["slug","image_url"],
    select: "SELECT * FROM announcements ORDER BY created_at DESC",
    view: "admin/announcements",
    label: "Announcements"
  },
  projects: {
    table: "projects",
    fields: ["title","category","description","status"],
    extra: ["image_url","start_date","end_date"],
    select: "SELECT * FROM projects ORDER BY created_at DESC",
    view: "admin/projects",
    label: "Projects"
  },
  events: {
    table: "events",
    fields: ["title","venue","description","status"],
    extra: ["event_date","start_time","end_time","image_url"],
    select: "SELECT * FROM events ORDER BY event_date DESC",
    view: "admin/events",
    label: "Events"
  },
  reports: {
    table: "transparency_reports",
    fields: ["title","report_type","report_year","description","status"],
    extra: ["file_url"],
    select: "SELECT * FROM transparency_reports ORDER BY report_year DESC, created_at DESC",
    view: "admin/reports",
    label: "Transparency reports"
  }
};

Object.entries(resources).forEach(([key, cfg]) => {
  router.get(`/${key}`, async (req,res,next) => {
    try {
      const items = await query(cfg.select);
      res.render(cfg.view, { title: cfg.label, items });
    } catch(e) { next(e); }
  });

  router.post(`/${key}`, upload.single("image"), async (req,res,next) => {
    try {
      const body = req.body;
      const values = cfg.fields.map(f => body[f] || null);
      let columns = [...cfg.fields];
      if (key === "announcements") {
        columns.push("slug","image_url","published_at");
        values.push(`${slugify(body.title || "announcement")}-${Date.now().toString().slice(-5)}`, imagePath(req), body.status === "published" ? new Date() : null);
      } else if (key === "projects") {
        columns.push("image_url","start_date","end_date");
        values.push(imagePath(req), body.start_date || null, body.end_date || null);
      } else if (key === "events") {
        columns.push("event_date","start_time","end_time","image_url");
        values.push(body.event_date || null, body.start_time || null, body.end_time || null, imagePath(req));
      } else {
        columns.push("file_url");
        values.push(body.file_url || null);
      }
      const placeholders = columns.map(() => "?").join(",");
      await query(`INSERT INTO ${cfg.table} (${columns.join(",")}) VALUES (${placeholders})`, values);
      req.flash("success", `${cfg.label.slice(0,-1)} created successfully.`);
      res.redirect(`/admin/${key}`);
    } catch(e) { next(e); }
  });

  router.post(`/${key}/:id/delete`, async (req,res,next) => {
    try {
      await query(`DELETE FROM ${cfg.table} WHERE id=?`, [Number(req.params.id)]);
      req.flash("success", "Record deleted.");
      res.redirect(`/admin/${key}`);
    } catch(e) { next(e); }
  });
});

router.get("/youth-requests", async (req,res,next) => {
  try {
    const items = await query("SELECT * FROM youth_requests ORDER BY created_at DESC");
    res.render("admin/youth-requests", { title: "Youth requests", items });
  } catch(e) { next(e); }
});
router.post("/youth-requests/:id/status", async (req,res,next) => {
  try {
    const allowed = ["pending","reviewing","approved","rejected","completed"];
    if (!allowed.includes(req.body.status)) return res.status(400).send("Invalid status");
    await query("UPDATE youth_requests SET status=? WHERE id=?", [req.body.status, Number(req.params.id)]);
    req.flash("success", "Request status updated.");
    res.redirect("/admin/youth-requests");
  } catch(e) { next(e); }
});

router.get("/messages", async (req,res,next) => {
  try {
    const items = await query("SELECT * FROM messages ORDER BY created_at DESC");
    res.render("admin/messages", { title: "Messages", items });
  } catch(e) { next(e); }
});
router.post("/messages/:id/read", async (req,res,next) => {
  try {
    await query("UPDATE messages SET status='read' WHERE id=?", [Number(req.params.id)]);
    req.flash("success", "Message marked as read.");
    res.redirect("/admin/messages");
  } catch(e) { next(e); }
});

router.get("/officials", async (req,res,next) => {
  try {
    const items = await query("SELECT * FROM officials ORDER BY sort_order, full_name");
    res.render("admin/officials", { title: "SK officials", items });
  } catch(e) { next(e); }
});
router.post("/officials", upload.single("image"), async (req,res,next) => {
  try {
    const { full_name, position, committee, sort_order } = req.body;
    await query("INSERT INTO officials (full_name,position,committee,sort_order,image_url) VALUES (?,?,?,?,?)",
      [full_name,position,committee || null,Number(sort_order || 0),imagePath(req)]);
    req.flash("success", "Official added.");
    res.redirect("/admin/officials");
  } catch(e) { next(e); }
});
router.post("/officials/:id/delete", async (req,res,next) => {
  try {
    await query("DELETE FROM officials WHERE id=?", [Number(req.params.id)]);
    req.flash("success", "Official removed.");
    res.redirect("/admin/officials");
  } catch(e) { next(e); }
});

module.exports = router;
