const $$ = (sel, root = document) => root.querySelector(sel);
const $$$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const storageKey = "taskdo.tasks.v1";
const intro = $$("#intro");
const app = $$("#app");
const startBtn = $$("#startBtn");
const toggleAdd = $$("#toggleAdd");
const addRow = $$("#addRow");
const taskInput = $$("#taskInput");
const addBtn = $$("#addBtn");
const listEl = $$("#list");
const tpl = $$("#itemTpl");
const countEl = $$("#count");
const chips = $$$(".chip");

let tasks = load();
let filter = "all";

startBtn.addEventListener("click", () => {
  intro.style.display = "none";
  app.classList.add("active");
  taskInput.focus();
});

if (tasks.length) {
  intro.style.display = "none";
  app.classList.add("active");
}

toggleAdd.addEventListener("click", (e) => {
  e.preventDefault();
  addRow.classList.toggle("active");
  if (addRow.classList.contains("active")) taskInput.focus();
});

addBtn.addEventListener("click", addTaskFromInput);
taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTaskFromInput();
  if (e.key === "Escape") {
    taskInput.value = "";
    addRow.classList.remove("active");
  }
});

function addTaskFromInput() {
  const text = taskInput.value.trim();
  if (!text) return;
  tasks.push({ id: crypto.randomUUID(), text, done: false });
  taskInput.value = "";
  persist();
  render();
  taskInput.focus();
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(storageKey)) || [];
  } catch {
    return [];
  }
}
function persist() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

function setFilter(key) {
  filter = key;
  chips.forEach((c) => {
    const active = c.dataset.filter === key;
    c.classList.toggle("active", active);
    c.setAttribute("aria-selected", active);
  });
  render();
}

chips.forEach((c) =>
  c.addEventListener("click", () => setFilter(c.dataset.filter)),
);

function render() {
  listEl.innerHTML = "";
  const frag = document.createDocumentFragment();

  const visible = tasks.filter(
    (t) => filter === "all" || (filter === "done" ? t.done : !t.done),
  );

  if (!visible.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Список пуст — добавьте первую задачу";
    listEl.appendChild(empty);
  } else {
    visible.forEach((task) => frag.appendChild(renderItem(task)));
    listEl.appendChild(frag);
  }

  const left = tasks.filter((t) => !t.done).length;
  countEl.textContent = `${left} ${decl(left, ["задача", "задачи", "задач"])}`;
}

function renderItem(task) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  const check = $$(".check", node);
  const label = $$(".label", node);
  const del = $$(".del", node);
  const edit = $$(".edit", node);

  label.textContent = task.text;
  label.classList.toggle("done", task.done);
  check.checked = task.done;

  check.addEventListener("change", () => {
    task.done = check.checked;
    persist();
    label.classList.toggle("done", task.done);
    render();
  });

  del.addEventListener("click", () => {
    tasks = tasks.filter((t) => t.id !== task.id);
    persist();
    render();
  });

  edit.addEventListener("click", () => startEdit(label, task));
  label.addEventListener("dblclick", () => startEdit(label, task));

  return node;
}

function startEdit(label, task) {
  label.setAttribute("contenteditable", "true");
  label.focus();
  placeCaretAtEnd(label);

  const finish = (save) => {
    label.removeAttribute("contenteditable");
    if (save) {
      const text = label.textContent.trim();
      if (text) {
        task.text = text;
        persist();
      } else {
        tasks = tasks.filter((t) => t.id !== task.id);
        persist();
      }
    } else {
      label.textContent = task.text;
    }
    render();
  };

  const keyHandler = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      finish(true);
    }
    if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  };
  label.addEventListener("keydown", keyHandler, { once: false });
  label.addEventListener("blur", () => finish(true), {
    once: true,
  });
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

function decl(n, forms) {
  const n10 = n % 10,
    n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return forms[0];
  if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return forms[1];
  return forms[2];
}

render();
