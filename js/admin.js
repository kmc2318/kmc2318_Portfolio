// js/admin.js

const cfg = window.SUPABASE_CONFIG;
const loginStatus = document.getElementById("login-status");
const saveStatus = document.getElementById("save-status");

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

const roleInput = document.getElementById("p-roles");
const toolInput = document.getElementById("p-tools");
const rolesTags = document.getElementById("roles-tags");
const toolsTags = document.getElementById("tools-tags");

const state = {
  roles: new Set(),
  tools: new Set(),
  selectedRoles: new Set(),
  selectedTools: new Set(),
  isAdmin: false,
};

const $ = (id) => document.getElementById(id);
const ACCESS_STORAGE_KEY = "portfolio_cms_access_v1";
const EMBEDDED_PROJECT_DATA_KEY = "__projectData";
const PROCESS_IMAGE_FIELDS = [
  "p-process1-image",
  "p-process2-image",
  "p-process3-image",
];

const sha256 = async (text) => {
  const bytes = new TextEncoder().encode(text);
  const hash = await window.crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const hasAdminAccess = () => {
  return sessionStorage.getItem(ACCESS_STORAGE_KEY) === "1";
};

const verifyCredentials = async (email, password) => {
  if (!cfg?.adminCredentialHash || !window.crypto?.subtle) {
    return false;
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rawPassword = String(password || "");

  if (!normalizedEmail || !rawPassword) {
    return false;
  }

  return await sha256(`${normalizedEmail}:${rawPassword}`) === cfg.adminCredentialHash;
};

const unlockAdminAccess = () => {
  sessionStorage.setItem(ACCESS_STORAGE_KEY, "1");
  state.isAdmin = true;
};

const lockAdminAccess = () => {
  sessionStorage.removeItem(ACCESS_STORAGE_KEY);
  state.isAdmin = false;
};

const unique = (arr) => {
  return Array.from(new Set(arr.map(v => String(v || "").trim()).filter(Boolean)));
};

const parseComma = (val) => {
  return String(val || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
};

const parseLines = (val) => {
  return String(val || "")
    .split("\n")
    .map(v => v.trim())
    .filter(Boolean);
};

const arrayToLines = (items) => {
  return Array.isArray(items) ? items.join("\n") : "";
};

const parseYearFromDate = (date) => {
  const match = String(date || "").match(/\d{4}/);
  return match ? match[0] : "";
};

const parseSummaryCards = (val) => {
  return parseLines(val).map((line) => {
    const index = line.indexOf(":");

    if (index === -1) {
      return {
        label: "Item",
        text: line,
      };
    }

    return {
      label: line.slice(0, index).trim(),
      text: line.slice(index + 1).trim(),
    };
  }).filter(card => card.label && card.text);
};

const summaryCardsToText = (cards) => {
  if (!Array.isArray(cards)) return "";

  return cards
    .map(card => `${card.label || ""}:${card.text || ""}`)
    .join("\n");
};

const buildTags = (container, items, selectedSet) => {
  if (!container) return;

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
  const raw = $("p-links").value.trim();
  if (!raw) return {};

  const links = {};

  raw.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const index = trimmed.indexOf(":");
    if (index === -1) return;

    const label = trimmed.slice(0, index).trim();
    const url = trimmed.slice(index + 1).trim();

    if (label && url) {
      links[label] = url;
    }
  });

  return links;
};

const getEmbeddedProjectData = (links) => {
  const embedded = links?.[EMBEDDED_PROJECT_DATA_KEY];

  if (!embedded) return {};
  if (typeof embedded === "object") return embedded;

  if (typeof embedded === "string") {
    try {
      return JSON.parse(embedded);
    } catch (error) {
      console.warn("CMS埋め込みデータの読み込みに失敗しました", error);
    }
  }

  return {};
};

const visibleLinks = (links) => {
  if (!links || typeof links !== "object" || Array.isArray(links)) return links;

  return Object.fromEntries(
    Object.entries(links).filter(([label]) => !label.startsWith("__"))
  );
};

const linksToText = (links) => {
  if (!links) return "";

  if (Array.isArray(links)) {
    return links
      .map(l => `${l.label || ""}:${l.url || ""}`)
      .join("\n");
  }

  if (typeof links === "object") {
    return Object.entries(visibleLinks(links))
      .map(([label, url]) => `${label}:${url}`)
      .join("\n");
  }

  return "";
};

const setCurrentImageLabel = (inputId, url) => {
  const label = $(`${inputId}-current`);
  if (!label) return;

  if (url) {
    label.innerHTML = `現在の画像: <a href="${url}" target="_blank" rel="noopener noreferrer">表示する</a>`;
  } else {
    label.textContent = "現在の画像: なし";
  }
};

const collectProcess = async () => {
  const values = [
    $("p-process1").value.trim(),
    $("p-process2").value.trim(),
    $("p-process3").value.trim(),
  ];

  const processItems = [];

  for (const [index, val] of values.entries()) {
    const imageInput = $(PROCESS_IMAGE_FIELDS[index]);
    const file = imageInput?.files?.[0] || null;
    const existingImage = imageInput?.dataset.currentImage || "";
    const image = file ? await uploadImage(file) : existingImage;

    if (!val && !image) continue;

    const slashIndex = val.indexOf("/");
    let title = "";
    let detail = "";

    if (slashIndex === -1) {
      title = `Step ${String(index + 1).padStart(2, "0")}`;
      detail = val;
    } else {
      title = val.slice(0, slashIndex).trim();
      detail = val.slice(slashIndex + 1).trim();
    }

    processItems.push({
      step: title || `Step ${String(index + 1).padStart(2, "0")}`,
      detail,
      image,
    });
  }

  return processItems;
};

const processToLine = (process, index) => {
  const item = process?.[index];
  if (!item) return "";

  const title = item.step || item.title || "";
  const detail = item.detail || item.content || "";

  return `${title} / ${detail}`.trim();
};

const uploadImage = async (file) => {
  if (!file) return null;
  if (!supabaseClient) throw new Error("Supabaseが初期化されていません。");

  const safeName = file.name.replace(/[^\w.\-]/g, "_");
  const path = `projects/${Date.now()}_${safeName}`;

  const { data, error } = await supabaseClient.storage
    .from(cfg.bucket)
    .upload(path, file, {
      upsert: true,
      cacheControl: "3600",
    });

  if (error) throw error;

  return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${data.path}`;
};

const loadProjects = async () => {
  if (!supabaseClient) return [];

  const { data, error } = await supabaseClient
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    if (listEl) {
      listEl.innerHTML = `<p style="color:var(--sub);">読み込みエラー：${error.message}</p>`;
    }
    return [];
  }

  return data || [];
};

const refreshTagsFromProjects = (projects) => {
  state.roles = new Set();
  state.tools = new Set();

  projects.forEach((p) => {
    if (Array.isArray(p.roles)) {
      p.roles.forEach((r) => state.roles.add(r));
    }
    if (Array.isArray(p.tools)) {
      p.tools.forEach((t) => state.tools.add(t));
    }
  });

  buildTags(rolesTags, Array.from(state.roles), state.selectedRoles);
  buildTags(toolsTags, Array.from(state.tools), state.selectedTools);
};

const renderList = (projects) => {
  if (!listEl) return;

  if (!projects.length) {
    listEl.innerHTML = `<p style="color:var(--sub);">まだプロジェクトがありません。</p>`;
    return;
  }

  listEl.innerHTML = "";

  projects.forEach((p) => {
    const row = document.createElement("div");
    row.className = "admin-item";

    row.innerHTML = `
      <div>
        <div>${p.title || "Untitled"}</div>
        <small>${p.date || p.year || ""}</small>
      </div>
      ${state.isAdmin ? `
        <div>
          <button class="admin-btn" data-id="${p.id}" type="button">Edit</button>
        </div>
      ` : ""}
    `;

    if (state.isAdmin) {
      row.querySelector("button").addEventListener("click", () => fillForm(p));
    }

    listEl.appendChild(row);
  });
};

const fillForm = (p) => {
  const embedded = getEmbeddedProjectData(p.links);
  const project = { ...embedded, ...p };
  project.links = visibleLinks(p.links);

  $("p-date").value = project.date || project.year || "";
  $("p-year").value = project.year || parseYearFromDate(project.date) || "";
  $("p-categories").value = Array.isArray(project.categories) ? project.categories.join(", ") : "";
  $("p-title").value = project.title || "";
  $("p-summary").value = project.summary || project.description || "";
  $("p-one-line").value = project.oneLine || project.heroCopy || "";
  $("p-overview").value = project.overviewDetail || project.overview || "";
  $("p-summary-cards").value = summaryCardsToText(project.summaryCards);
  $("p-context").value = project.context || project.context_problem || "";
  $("p-problem").value = project.problem || "";
  $("p-result").value = project.result || "";
  $("p-result-highlight").value = project.resultHighlight || "";
  $("p-learning").value = project.learnings || project.learning || "";
  $("p-approach").value = project.approach || "";
  $("p-output").value = project.output || "";
  $("p-what-i-did").value = arrayToLines(project.whatIDid || project.whatIDidList || project.outputs);
  $("p-links").value = linksToText(project.links);

  state.selectedRoles = new Set(Array.isArray(project.roles) ? project.roles : []);
  state.selectedTools = new Set(Array.isArray(project.tools) ? project.tools : []);

  roleInput.value = "";
  toolInput.value = "";

  buildTags(rolesTags, Array.from(state.roles), state.selectedRoles);
  buildTags(toolsTags, Array.from(state.tools), state.selectedTools);

  const process = Array.isArray(project.process) ? project.process : [];

  $("p-process1").value = processToLine(process, 0);
  $("p-process2").value = processToLine(process, 1);
  $("p-process3").value = processToLine(process, 2);

  PROCESS_IMAGE_FIELDS.forEach((inputId, index) => {
    const input = $(inputId);
    if (!input) return;

    const image = process[index]?.image || process[index]?.img || "";
    input.value = "";
    input.dataset.currentImage = image;
    setCurrentImageLabel(inputId, image);
  });

  $("save-btn").dataset.editId = p.id;
  saveStatus.textContent = "編集モードです。内容を変更してSaveしてください。";

  window.scrollTo({
    top: panelSection.offsetTop - 80,
    behavior: "smooth",
  });
};

const clearForm = () => {
  [
    "p-date",
    "p-year",
    "p-categories",
    "p-title",
    "p-summary",
    "p-one-line",
    "p-overview",
    "p-summary-cards",
    "p-context",
    "p-problem",
    "p-result",
    "p-result-highlight",
    "p-learning",
    "p-approach",
    "p-output",
    "p-what-i-did",
    "p-links",
    "p-process1",
    "p-process2",
    "p-process3",
  ].forEach(id => {
    const el = $(id);
    if (el) el.value = "";
  });

  roleInput.value = "";
  toolInput.value = "";
  $("p-image").value = "";
  PROCESS_IMAGE_FIELDS.forEach((inputId) => {
    const input = $(inputId);
    if (!input) return;

    input.value = "";
    input.dataset.currentImage = "";
    setCurrentImageLabel(inputId, "");
  });

  state.selectedRoles = new Set();
  state.selectedTools = new Set();

  $("save-btn").dataset.editId = "";
};

const saveProject = async () => {
  if (!state.isAdmin) {
    saveStatus.textContent = "管理用URLで開いた時だけ保存できます。";
    return;
  }

  if (!supabaseClient) {
    saveStatus.textContent = "Supabaseが初期化できていません。";
    return;
  }

  saveStatus.textContent = "Saving...";

  try {
    const date = $("p-date").value.trim();
    const year = $("p-year").value.trim() || parseYearFromDate(date);
    const title = $("p-title").value.trim();
    const summary = $("p-summary").value.trim();
    const overviewDetail = $("p-overview").value.trim();
    const context = $("p-context").value.trim();
    const learnings = $("p-learning").value.trim();

    if (!title) {
      saveStatus.textContent = "タイトルを入力してください。";
      return;
    }

    const roles = unique([
      ...Array.from(state.selectedRoles),
      ...parseComma(roleInput.value),
    ]);

    const tools = unique([
      ...Array.from(state.selectedTools),
      ...parseComma(toolInput.value),
    ]);

    const projectData = {
      year,
      categories: parseComma($("p-categories").value),
      description: summary,
      oneLine: $("p-one-line").value.trim(),
      overviewDetail,
      summaryCards: parseSummaryCards($("p-summary-cards").value),
      context,
      problem: $("p-problem").value.trim(),
      resultHighlight: $("p-result-highlight").value.trim(),
      learnings,
      approach: $("p-approach").value.trim(),
      output: $("p-output").value.trim(),
      whatIDid: parseLines($("p-what-i-did").value),
    };

    const links = collectLinks();
    links[EMBEDDED_PROJECT_DATA_KEY] = projectData;

    const payload = {
      date,
      title,
      summary,
      overview: overviewDetail,
      context_problem: context,
      result: $("p-result").value.trim(),
      learning: learnings,
      roles,
      tools,
      links,
      process: await collectProcess(),
    };

    const file = $("p-image").files[0];
    if (file) {
      const imageUrl = await uploadImage(file);
      projectData.thumb = imageUrl;
      payload.thumbnail_url = imageUrl;
    }

    const editId = $("save-btn").dataset.editId;

    let response;

    if (editId) {
      response = await supabaseClient
        .from("projects")
        .update(payload)
        .eq("id", editId)
        .select();
    } else {
      response = await supabaseClient
        .from("projects")
        .insert(payload)
        .select();
    }

    if (response.error) {
      console.error(response.error);
      saveStatus.textContent = `Error: ${response.error.message}`;
      return;
    }

    saveStatus.textContent = "Saved";

    clearForm();

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

  const projects = await loadProjects();
  state.isAdmin = hasAdminAccess();

  if (state.isAdmin) {
    loginSection.style.display = "none";
    panelSection.style.display = "block";

    refreshTagsFromProjects(projects);
    renderList(projects);
  } else {
    loginSection.style.display = "block";
    panelSection.style.display = "none";
    loginStatus.textContent = "メールアドレスとパスワードを入力してください。";

    renderList(projects);
  }
};

$("login-btn")?.addEventListener("click", async () => {
  const email = $("login-email")?.value || "";
  const password = $("login-password")?.value || "";
  const isValid = await verifyCredentials(email, password);

  if (!isValid) {
    loginStatus.textContent = "メールアドレスまたはパスワードが違います。";
    return;
  }

  unlockAdminAccess();
  loginStatus.textContent = "";
  checkSession();
});

$("logout-btn").addEventListener("click", async () => {
  lockAdminAccess();
  checkSession();
});

$("save-btn").addEventListener("click", saveProject);

checkSession();
