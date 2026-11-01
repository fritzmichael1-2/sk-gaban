exports.attachLocals = (req, res, next) => {
  res.locals.currentAdmin = req.session.admin || null;
  res.locals.successMessages = req.flash("success");
  res.locals.errorMessages = req.flash("error");
  res.locals.currentPath = req.path;
  res.locals.siteName = "SK Barangay Gaban";
  next();
};
