// js/project-list.js

function renderProjects(filteredData) {
  const grid = document.getElementById("project-grid");
  if (!grid) return;

  const countEl = document.getElementById("projects-count");

  if (!filteredData.length) {
    grid.innerHTML = `<p style="color:var(--sub);">該当するプロジェクトがありません。</p>`;
    if (countEl) countEl.textContent = "0 projects";
    return;
  }

  if (countEl) countEl.textContent = `${filteredData.length} projects`;

  grid.innerHTML = filteredData.map(p => {
    const categories = Array.isArray(p.categories) ? p.categories : [];
    const role = Array.isArray(p.roles) && p.roles.length ? p.roles[0] : "";
    const thumb = p.thumb || "";
    const title = p.title || "";
    const description = p.description || p.summary || "";
    const year = p.year || "";

    const categoryText = categories.join(" / ");
    const kicker = categoryText || "PROJECT";
    const mark = title.includes("Arc & Beyond") ? "A&B" : "PROJECT";
    const noThumbClass = thumb ? "" : "is-no-thumb";

    return `
      <a href="project-detail.html?id=${encodeURIComponent(p.id)}&from=list" class="project-card ${noThumbClass}">
        <div class="card-img" data-kicker="${kicker}" data-mark="${mark}">
          ${thumb ? `
            <img 
              src="${thumb}" 
              alt="${title}"
              onerror="this.closest('.project-card').classList.add('is-no-thumb'); this.remove();"
            >
          ` : ""}
        </div>

        <div class="card-content">
          <span class="card-tag">${categoryText}</span>
          <h3>${title}</h3>
          <p class="card-desc">${description}</p>
          <div class="card-footer">
            <span class="role">${role ? `Role: ${role}` : ""}</span>
            <span class="year">${year}</span>
          </div>
        </div>
      </a>
    `;
  }).join("");
}

let currentFilter = "all";
let currentSort = "newest";

function updateList() {
  const searchEl = document.getElementById("search");
  const searchVal = searchEl ? searchEl.value.toLowerCase() : "";

  let result = Array.isArray(window.projects) ? [...window.projects] : [];

  if (searchVal) {
    result = result.filter(p => {
      const title = (p.title || "").toLowerCase();
      const desc = (p.description || p.summary || "").toLowerCase();
      const categories = Array.isArray(p.categories) ? p.categories : [];

      return (
        title.includes(searchVal) ||
        desc.includes(searchVal) ||
        categories.some(c => String(c || "").toLowerCase().includes(searchVal))
      );
    });
  }

  if (currentFilter !== "all") {
    result = result.filter(p => {
      const categories = Array.isArray(p.categories) ? p.categories : [];
      return categories.includes(currentFilter);
    });
  }

  result.sort((a, b) => {
    const ay = Number(a.year || 0);
    const by = Number(b.year || 0);
    return currentSort === "newest" ? by - ay : ay - by;
  });

  renderProjects(result);
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof window.getProjects === "function") {
    window.projects = await window.getProjects();
  } else if (Array.isArray(window.projects)) {
    window.projects = window.projects.map(p =>
      typeof window.normalizeProject === "function" ? window.normalizeProject(p) : p
    );
  } else {
    window.projects = [];
  }

  const filterTrigger = document.getElementById("filter-trigger");
  const filterMenu = document.getElementById("filter-menu");
  const sortTrigger = document.getElementById("sort-trigger");
  const sortMenu = document.getElementById("sort-menu");
  const controls = document.querySelector(".projects-controls");

  if (filterMenu && filterTrigger) {
    const categories = Array.from(
      new Set(window.projects.flatMap(p => p.categories || []))
    );

    const options = ["all", ...categories];

    filterMenu.innerHTML = options.map((cat, i) => `
      <li class="select-option ${i === 0 ? "is-active" : ""}" data-value="${cat}">
        ${cat === "all" ? "All" : cat}
      </li>
    `).join("");
  }

  const closeMenus = () => {
    filterMenu?.classList.remove("is-open");
    sortMenu?.classList.remove("is-open");
    controls?.classList.remove("is-open");
  };

  filterTrigger?.addEventListener("click", () => {
    filterMenu?.classList.toggle("is-open");
    sortMenu?.classList.remove("is-open");
    controls?.classList.toggle("is-open", filterMenu?.classList.contains("is-open"));
  });

  sortTrigger?.addEventListener("click", () => {
    sortMenu?.classList.toggle("is-open");
    filterMenu?.classList.remove("is-open");
    controls?.classList.toggle("is-open", sortMenu?.classList.contains("is-open"));
  });

  filterMenu?.addEventListener("click", (e) => {
    const target = e.target.closest(".select-option");
    if (!target) return;

    currentFilter = target.dataset.value;
    filterTrigger.textContent = target.textContent.trim();

    filterMenu.querySelectorAll(".select-option").forEach(opt => {
      opt.classList.remove("is-active");
    });

    target.classList.add("is-active");
    closeMenus();
    updateList();
  });

  sortMenu?.addEventListener("click", (e) => {
    const target = e.target.closest(".select-option");
    if (!target) return;

    currentSort = target.dataset.value;
    sortTrigger.textContent = target.textContent.trim();

    sortMenu.querySelectorAll(".select-option").forEach(opt => {
      opt.classList.remove("is-active");
    });

    target.classList.add("is-active");
    closeMenus();
    updateList();
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest(".select-shell")) return;
    closeMenus();
  });

  const searchEl = document.getElementById("search");
  searchEl?.addEventListener("input", updateList);

  updateList();
});