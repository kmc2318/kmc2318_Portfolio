// js/project-api.js

(function () {
  const EMBEDDED_PROJECT_DATA_KEY = "__projectData";

  const parseYearFromDate = (date) => {
    const match = String(date || "").match(/\d{4}/);
    return match ? match[0] : "";
  };

  const parseCategoryFromDate = (date) => {
    const text = String(date || "");
    if (!text.includes("/")) return [];
    const parts = text.split("/").map(v => v.trim()).filter(Boolean);
    return parts.slice(1);
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

  const normalizeLinks = (links) => {
    if (!links) return {};

    if (Array.isArray(links)) {
      return links.reduce((acc, item) => {
        if (item?.label && item?.url) {
          acc[item.label] = item.url;
        }
        return acc;
      }, {});
    }

    if (typeof links === "object") {
      return Object.fromEntries(
        Object.entries(links).filter(([label]) => !label.startsWith("__"))
      );
    }

    return {};
  };

  const normalizeProcess = (process) => {
    if (!Array.isArray(process)) return [];

    return process.map((item, index) => ({
      step: item.step || item.title || `Step ${String(index + 1).padStart(2, "0")}`,
      detail: item.detail || item.content || "",
      image: item.image || item.img || "",
    }));
  };

  const isEmptyValue = (value) => {
    if (value == null || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  };

  const mergeProjectFallback = (localProject, remoteProject) => {
    if (!localProject) return remoteProject;

    const merged = { ...localProject, ...remoteProject };
    const fallbackKeys = [
      "year",
      "categories",
      "oneLine",
      "summaryCards",
      "whatIDid",
      "resultHighlight",
      "approach",
      "output",
      "overviewDetail",
      "context",
      "problem",
      "thumb",
    ];

    fallbackKeys.forEach((key) => {
      if (isEmptyValue(remoteProject[key]) && !isEmptyValue(localProject[key])) {
        merged[key] = localProject[key];
      }
    });

    if (
      !remoteProject.oneLine &&
      isEmptyValue(remoteProject.summaryCards) &&
      Array.isArray(localProject.categories) &&
      localProject.categories.length > (remoteProject.categories || []).length
    ) {
      merged.categories = localProject.categories;
    }

    return merged;
  };

  window.normalizeProject = function normalizeProject(p) {
    const embedded = getEmbeddedProjectData(p.links);
    const source = { ...embedded, ...p };

    const date = source.date || "";
    const year = source.year || parseYearFromDate(date);
    const categories =
      Array.isArray(source.categories) && source.categories.length
        ? source.categories
        : source.category
          ? [source.category]
          : parseCategoryFromDate(date);

    return {
      ...source,

      id: String(source.id),
      year,
      categories,

      title: source.title || "",
      description: source.description || source.summary || "",
      summary: source.summary || source.description || "",

      thumb:
        source.thumb ||
        source.thumbnail ||
        source.thumbnail_url ||
        "assets/images/hero.png",

      overviewDetail:
        source.overviewDetail ||
        source.overview ||
        source.summary ||
        source.description ||
        "",

      context:
        source.context ||
        source.context_problem ||
        source.ontext ||
        "",

      problem:
        source.problem ||
        "",

      result:
        source.result ||
        "",

      learnings:
        source.learnings ||
        source.learning ||
        "",

      heroCopy:
        source.heroCopy ||
        source.oneLine ||
        source.summary ||
        source.description ||
        "",

      roles:
        Array.isArray(source.roles) ? source.roles : [],

      tools:
        Array.isArray(source.tools) ? source.tools : [],

      links: normalizeLinks(source.links),
      process: normalizeProcess(source.process),
    };
  };

  window.fetchProjectsFromSupabase = async function fetchProjectsFromSupabase() {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg) return null;

    try {
      const res = await fetch(`${cfg.url}/rest/v1/projects?select=*&order=created_at.desc`, {
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
      });

      if (!res.ok) {
        console.warn("Supabase fetch failed", await res.text());
        return null;
      }

      const data = await res.json();
      return Array.isArray(data) ? data.map(window.normalizeProject) : null;
    } catch (error) {
      console.warn("Supabase取得に失敗しました", error);
      return null;
    }
  };

  window.getProjects = async function getProjects() {
    const local = Array.isArray(window.projects)
      ? window.projects.map(window.normalizeProject)
      : [];

    const remote = await window.fetchProjectsFromSupabase();

    if (Array.isArray(remote) && remote.length) {
      const localById = new Map(local.map(project => [String(project.id), project]));
      const merged = remote.map(project =>
        mergeProjectFallback(localById.get(String(project.id)), project)
      );
      const remoteIds = new Set(merged.map(project => String(project.id)));
      const localOnly = local.filter(project => !remoteIds.has(String(project.id)));

      window.projects = [...merged, ...localOnly];
      return window.projects;
    }

    window.projects = local;
    return local;
  };
})();
