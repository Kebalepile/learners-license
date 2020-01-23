
import questions from "./components/questions.js"
import db from "./components/db.js";
import about from "./components/about.js";

const info = document.querySelector("#about"),
  darkMode = document.querySelector("#dark-mode"),
  container = document.querySelector("#container"),
  categories = document.querySelector("#categories"),
  installBtn = document.querySelector("#installBtn"),
  pageControl = document.querySelector("#page-control"),
  form = document.querySelector("form"),
  potso = document.querySelector("#question"),
  img = document.querySelector("#img"),
  answers = document.querySelector("#answers");

let deferredPrompt;

window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  deferredPrompt = e;
});

installBtn.onclick = e => {
  deferredPrompt.prompt();
}
info.onclick = e => {
  about();
  e.target.disabled = true;
}

darkMode.onchange = e => {
  document.body.classList.toggle('c1');
  [...container.children].forEach(x => x.classList.toggle('c2')); 
}
window.onload = e => {
  db([potso, img, answers], questions(), form, categories, pageControl);
}