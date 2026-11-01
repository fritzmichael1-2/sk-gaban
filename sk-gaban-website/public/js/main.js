document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("sidebarToggle");
  const sidebar = document.querySelector(".admin-sidebar");
  if (toggle && sidebar) toggle.addEventListener("click", () => sidebar.classList.toggle("show"));
});
