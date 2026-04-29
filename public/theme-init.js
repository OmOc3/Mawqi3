(() => {
  const storageKey = "ecopest-theme";
  const root = document.documentElement;
  const savedTheme = window.localStorage.getItem(storageKey);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : prefersDark ? "dark" : "light";

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
})();
