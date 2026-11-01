require("dotenv").config();
const express = require("express");
const path = require("path");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const PgSessionStore = require("connect-pg-simple")(session);
const flash = require("connect-flash");
const methodOverride = require("method-override");
const { pool } = require("./src/config/db");
const { attachLocals } = require("./src/middleware/locals");

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Render terminates HTTPS at its proxy; trust the proxy so secure session cookies work.
if (isProduction) app.set("trust proxy", 1);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(isProduction ? "combined" : "dev"));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.json({ limit: "2mb" }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));

const sessionStore = new PgSessionStore({
  pool,
  tableName: "user_sessions",
  createTableIfMissing: true,
  pruneSessionInterval: 15 * 60
});
app.use(session({
  key: "skgaban.sid",
  secret: process.env.SESSION_SECRET || "development-only-change-me",
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    maxAge: 1000 * 60 * 60 * 8
  }
}));
app.use(flash());
app.use(attachLocals);

app.use("/", require("./src/routes/public"));
app.use("/admin", require("./src/routes/admin"));
app.use("/auth", require("./src/routes/auth"));

app.use((req, res) => res.status(404).render("errors/404", { title: "Page not found" }));
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).render("errors/500", {
    title: "Something went wrong",
    message: isProduction ? "Please try again later." : err.message
  });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, "0.0.0.0", () => console.log(`SK Gaban portal listening on port ${port}`));
