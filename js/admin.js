const cfg = window.SUPABASE_CONFIG;
const loginStatus = document.getElementById("login-status");

if (!cfg) {
  console.error("Supabase config missing");
  if (loginStatus) loginStatus.textContent = "Supabase config が読み込めていません。";
}

if (!window.supabase) {
  console.error("Supabase SDK missing");
  if (loginStatus) loginStatus.textContent = "Supabase SDKが読み込めていません。";
}

const supabaseClient = (window.supabase && cfg)
  ? window.supabase.createClient(cfg.url, cfg.anonKey)
  : null;

const loginSection = document.getElementById("admin-login");
const panelSection = document.getElementById("admin-panel");
const listEl = document.getElementById("admin-list");
const saveStatus = document.getElementById("save-status");

const roleInput = document.getElementById("p-roles");
const toolInput = document.getElementById("p-tools");
const rolesTags = document.getElementById("roles-tags");
const toolsTags = document.getElementById("tools-tags");

let currentUser = null;

const state = {
  roles: new Set(),
  tools: new Set(),
  selectedRoles: new Set(),
  selectedTools: new Set(),
};

const parseComma = (val) =>
  val
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

const buildTags = (container, items, selectedSet) => {
  container.innerHTML = "";
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tag" + (selectedSet.has(item) ? " is-active" : "");
    btn.textContent = item;
    btn.addEventListener("click", () => {
      if (selectedSet.has(item)) {
        selectedSet.delete(item);
      } else {
        selectedSet.add(item);
      }
      buildTags(container, items, selectedSet);
    });
    container.appendChild(btn);
  });
};

const collectLinks = () => {
  const raw = document.getElementById("p-links").value.trim();
  if (!raw) return [];
  return raw.split("\n").map((line) => {
    const [label, url] = line.split(":");
    return { label: (label || "").trim(), url: (url || "").trim() };
  }).filter(l => l.label && l.url);
};

const collectProcess = () => {
  const step1 = document.getElementById("p-process1").value.trim();
  const step2 = document.getElementById("p-process2").value.trim();
  const step3 = document.getElementById("p-process3").value.trim();
  const toObj = (val, num) => {
    if (!val) return null;
    const [title, ...rest] = val.split("/");
    return {
      step: `Step 0${num}`,
      title: (title || "").trim(),
      detail: rest.join("/").trim(),
    };
  };
  return [toObj(step1, 1), toObj(step2, 2), toObj(step3, 3)].filter(Boolean);
};

const loadProjects = async () => {
  if (!supabaseClient) return [];
  const { data, error } = await supabaseClient.from("projects").select("*").order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    return [];
  }
  return data || [];
};

const refreshTagsFromProjects = (projects) => {
  state.roles = new Set();
  state.tools = new Set();
  projects.forEach((p) => {
    (p.roles || []).forEach((r) => state.roles.add(r));
    (p.tools || []).forEach((t) => state.tools.add(t));
  });
  buildTags(rolesTags, Array.from(state.roles), state.selectedRoles);
  buildTags(toolsTags, Array.from(state.tools), state.selectedTools);
};

const renderList = (projects) => {
  listEl.innerHTML = "";
  projects.forEach((p) => {
    const row = document.createElement("div");
    row.className = "admin-item";
    row.innerHTML = `
      <div>
        <div>${p.title || "Untitled"}</div>
        <small>${p.date || ""}</small>
      </div>
      <div>
        <button class="admin-btn" data-id="${p.id}">Edit</button>
      </div>
    `;
    row.querySelector("button").addEventListener("click", () => fillForm(p));
    listEl.appendChild(row);
  });
};

const fillForm = (p) => {
  document.getElementById("p-date").value = p.date || "";
  document.getElementById("p-title").value = p.title || "";
  document.getElementById("p-summary").value = p.summary || "";
  document.getElementById("p-overview").value = p.overview || "";
  document.getElementById("p-context").value = p.context_problem || "";
  document.getElementById("p-result").value = p.result || "";
  document.getElementById("p-learning").value = p.learning || "";
  document.getElementById("p-links").value = (p.links || []).map(l => `${l.label}:${l.url}`).join("\n");

  state.selectedRoles = new Set(p.roles || []);
  state.selectedTools = new Set(p.tools || []);
  buildTags(rolesTags, Array.from(state.roles), state.selectedRoles);
  buildTags(toolsTags, Array.from(state.tools), state.selectedTools);

  const process = p.process || [];
  const toLine = (i) => {
    const item = process[i];
    if (!item) return "";
    return `${item.title || ""} / ${item.detail || ""}`.trim();
  };
  document.getElementById("p-process1").value = toLine(0);
  document.getElementById("p-process2").value = toLine(1);
  document.getElementById("p-process3").value = toLine(2);
  document.getElementById("save-btn").dataset.editId = p.id;
};

const uploadImage = async (file) => {
  if (!file) return null;
  const path = `projects/${Date.now()}_${file.name}`;
  const { data, error } = await supabaseClient.storage.from(cfg.bucket).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
  });
  if (error) throw error;
  return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${data.path}`;
};

const saveProject = async () => {
  saveStatus.textContent = "Saving...";
  try {
    const payload = {
      date: document.getElementById("p-date").value.trim(),
      title: document.getElementById("p-title").value.trim(),
      summary: document.getElementById("p-summary").value.trim(),
      overview: document.getElementById("p-overview").value.trim(),
      context_problem: document.getElementById("p-context").value.trim(),
      result: document.getElementById("p-result").value.trim(),
      learning: document.getElementById("p-learning").value.trim(),
      roles: Array.from(state.selectedRoles).concat(parseComma(roleInput.value)),
      tools: Array.from(state.selectedTools).concat(parseComma(toolInput.value)),
      links: collectLinks(),
      process: collectProcess(),
    };

    const file = document.getElementById("p-image").files[0];
    if (file) {
      payload.thumbnail_url = await uploadImage(file);
    }

    const editId = document.getElementById("save-btn").dataset.editId;
    let result;
    if (editId) {
      result = await supabaseClient.from("projects").update(payload).eq("id", editId);
    } else {
      result = await supabaseClient.from("projects").insert(payload);
    }

    if (result.error) {
      saveStatus.textContent = `Error: ${result.error.message}`;
      return;
    }

    saveStatus.textContent = "Saved";
    document.getElementById("save-btn").dataset.editId = "";
    const projects = await loadProjects();
    refreshTagsFromProjects(projects);
    renderList(projects);
  } catch (err) {
    console.error(err);
    saveStatus.textContent = `Error: ${err?.message || "Unknown error"}`;
  }
};

const checkSession = async () => {
  if (!supabaseClient) return;
  const { data } = await supabaseClient.auth.getSession();
  if (data?.session?.user?.email === cfg.adminEmail) {
    currentUser = data.session.user;
    loginSection.style.display = "none";
    panelSection.style.display = "block";
    const projects = await loadProjects();
    refreshTagsFromProjects(projects);
    renderList(projects);
  } else {
    loginSection.style.display = "block";
    panelSection.style.display = "none";
  }
};

document.getElementById("login-btn").addEventListener("click", async () => {
  if (!supabaseClient) {
    if (loginStatus) loginStatus.textContent = "Supabaseが初期化できていません。";
    return;
  }
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    loginStatus.textContent = error.message;
    return;
  }
  loginStatus.textContent = "Logged in";
  checkSession();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  checkSession();
});

document.getElementById("save-btn").addEventListener("click", saveProject);

checkSession();
