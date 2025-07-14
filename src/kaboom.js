import kaboom from "kaboom";

export const k = kaboom({
  global: false,
  touchToMouse: true, // converts touch events to mouse events (mobile-friendly)
  canvas: document.getElementById("game"),
});
