(function () {
  "use strict";

  var KEY = "amd-hub-theme";
  var root = document.documentElement;
  var icon = document.createElement("link");
  icon.rel = "icon";
  icon.type = "image/svg+xml";
  icon.href = "assets/favicon.svg";
  document.head.appendChild(icon);

  function valid(value) {
    return value === "dark" || value === "light";
  }

  function read() {
    try {
      return localStorage.getItem(KEY) || "";
    } catch (error) {
      return "";
    }
  }

  function write(value) {
    try {
      localStorage.setItem(KEY, value);
    } catch (error) {}
  }

  function apply(value) {
    if (!valid(value)) return;
    root.setAttribute("data-theme", value);
    var button = document.getElementById("gnth");
    if (button) {
      button.setAttribute("aria-pressed", value === "dark" ? "true" : "false");
    }
  }

  apply(read());

  document.addEventListener("DOMContentLoaded", function () {
    var button = document.getElementById("gnth");
    if (!button) return;

    var current = root.getAttribute("data-theme");
    if (!valid(current)) {
      current = matchMedia("(prefers-color-scheme:dark)").matches
        ? "dark"
        : "light";
    }
    button.setAttribute("aria-pressed", current === "dark" ? "true" : "false");

    button.addEventListener("click", function () {
      var next = root.getAttribute("data-theme");
      if (!valid(next)) {
        next = matchMedia("(prefers-color-scheme:dark)").matches
          ? "dark"
          : "light";
      }
      write(next);
      button.setAttribute("aria-pressed", next === "dark" ? "true" : "false");
    });
  });

  window.addEventListener("storage", function (event) {
    if (event.key === KEY && valid(event.newValue)) {
      apply(event.newValue);
    }
  });
})();
