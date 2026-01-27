// 一覧描画関数
function renderProjects(filteredData) {
    const grid = document.getElementById('project-grid');
    if (!grid) return;
    const countEl = document.getElementById('projects-count');

    if (!filteredData.length) {
        grid.innerHTML = `<p style="color:var(--sub);">該当するプロジェクトがありません。</p>`;
        if (countEl) countEl.textContent = '0 projects';
        return;
    }

    if (countEl) countEl.textContent = `${filteredData.length} projects`;

    grid.innerHTML = filteredData.map(p => {
        const categories = Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []);
        const role = Array.isArray(p.roles) && p.roles.length ? p.roles[0] : (p.role || '');
        const thumb = p.thumb || p.thumbnail_url || '';
        const title = p.title || '';
        const description = p.description || p.summary || '';

        return `
        <a href="project-detail.html?id=${p.id}&from=list" class="project-card">
            <div class="card-img"><img src="${thumb}" alt="${title}"></div>
            <div class="card-content">
                <span class="card-tag">${categories.join(' / ')}</span>
                <h3>${title}</h3>
                <p class="card-desc">${description}</p>
                <div class="card-footer">
                    <span class="role">${role ? `Role: ${role}` : ''}</span>
                    <span class="year">${p.year}</span>
                </div>
            </div>
        </a>
    `;
    }).join('');
}

// フィルタ・検索・ソートの統合処理
let currentFilter = 'all';
let currentSort = 'newest';

function updateList() {
    const searchEl = document.getElementById('search');
    const searchVal = searchEl ? searchEl.value.toLowerCase() : '';
    const filterVal = currentFilter;
    const sortVal = currentSort;

    let result = [...window.projects];

    // 検索
    if (searchVal) {
        result = result.filter(p => {
            const title = (p.title || '').toLowerCase();
            const categories = Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []);
            return title.includes(searchVal) || categories.some(c => (c || '').toLowerCase().includes(searchVal));
        });
    }
    // フィルタ
    if (filterVal !== 'all') {
        result = result.filter(p => {
            const categories = Array.isArray(p.categories) ? p.categories : (p.category ? [p.category] : []);
            return categories.includes(filterVal);
        });
    }
    // ソート
    result.sort((a, b) => sortVal === 'newest' ? b.year - a.year : a.year - b.year);

    renderProjects(result);
}

// 初期化
async function fetchProjectsFromSupabase() {
    const cfg = window.SUPABASE_CONFIG;
    if (!cfg) return null;
    try {
        const res = await fetch(`${cfg.url}/rest/v1/projects?select=*`, {
            headers: {
                apikey: cfg.anonKey,
                Authorization: `Bearer ${cfg.anonKey}`,
            },
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    if (!Array.isArray(window.projects)) return;

    const remote = await fetchProjectsFromSupabase();
    if (Array.isArray(remote) && remote.length) {
        window.projects = remote.map(p => ({
            ...p,
            categories: p.category ? [p.category] : (p.categories || []),
            thumb: p.thumbnail_url || p.thumb,
            description: p.summary || p.description,
        }));
    }

    const filterTrigger = document.getElementById('filter-trigger');
    const filterMenu = document.getElementById('filter-menu');
    const sortTrigger = document.getElementById('sort-trigger');
    const sortMenu = document.getElementById('sort-menu');
    const controls = document.querySelector('.projects-controls');

    if (filterMenu && filterTrigger) {
        const categories = Array.from(new Set(window.projects.flatMap(p => p.categories || [])));
        const options = ['all', ...categories];
        filterMenu.innerHTML = options.map((cat, i) => `
          <li class="select-option ${i === 0 ? 'is-active' : ''}" data-value="${cat}">
            ${cat === 'all' ? 'All' : cat}
          </li>
        `).join('');
    }

    const closeMenus = () => {
        filterMenu?.classList.remove('is-open');
        sortMenu?.classList.remove('is-open');
        controls?.classList.remove('is-open');
    };

    filterTrigger?.addEventListener('click', () => {
        filterMenu?.classList.toggle('is-open');
        sortMenu?.classList.remove('is-open');
        controls?.classList.toggle('is-open', filterMenu?.classList.contains('is-open'));
    });

    sortTrigger?.addEventListener('click', () => {
        sortMenu?.classList.toggle('is-open');
        filterMenu?.classList.remove('is-open');
        controls?.classList.toggle('is-open', sortMenu?.classList.contains('is-open'));
    });

    filterMenu?.addEventListener('click', (e) => {
        const target = e.target.closest('.select-option');
        if (!target) return;
        currentFilter = target.dataset.value;
        filterTrigger.textContent = target.textContent.trim();
        filterMenu.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('is-active'));
        target.classList.add('is-active');
        closeMenus();
        updateList();
    });

    sortMenu?.addEventListener('click', (e) => {
        const target = e.target.closest('.select-option');
        if (!target) return;
        currentSort = target.dataset.value;
        sortTrigger.textContent = target.textContent.trim();
        sortMenu.querySelectorAll('.select-option').forEach(opt => opt.classList.remove('is-active'));
        target.classList.add('is-active');
        closeMenus();
        updateList();
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.select-shell')) return;
        closeMenus();
    });

    const searchEl = document.getElementById('search');
    if (searchEl) {
        searchEl.addEventListener('input', updateList);
    }

    updateList();
});
