exports.requireAuth = (req, res, next) => {
  if (!req.session.admin) {
    req.flash("error", "Please sign in to access the administration area.");
    return res.redirect("/auth/login");
  }
  next();
};

exports.requireGuest = (req, res, next) => {
  if (req.session.admin) return res.redirect("/admin");
  next();
};
