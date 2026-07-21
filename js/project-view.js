document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const from = params.get('from');

  const root = document.getElementById('detail-root');

  if (!root) {
    console.error('detail-root が見つからない');
    return;
  }

  if (typeof window.getProjects === "function") {
    window.projects = await window.getProjects();
  } else if (Array.isArray(window.projects)) {
    window.projects = window.projects.map(p =>
      typeof window.normalizeProject === "function" ? window.normalizeProject(p) : p
    );
  } else {
    window.projects = [];
  }

  const p = window.projects.find(item => String(item.id) === String(id));

  if (!p) {
    root.innerHTML = `
      <section class="detail-empty">
        <h1>Not Found</h1>
        <p>指定された作品（id=${id}）が見つかりませんでした。</p>
        <p><a href="projects.html">← 一覧に戻る</a></p>
      </section>
    `;
    return;
  }

  const breadcrumbHome = document.getElementById('breadcrumb-home');
  if (breadcrumbHome) {
    const target =
      from === 'about' ? 'index.html#about-values' :
      from === 'home' ? 'index.html' :
      'index.html#projects';

    breadcrumbHome.setAttribute('href', target);
  }

  const breadcrumbTitle = document.getElementById('breadcrumb-title');
  if (breadcrumbTitle) {
    breadcrumbTitle.textContent = p.title ?? 'Project';
  }

  const currentIndex = window.projects.findIndex(item => String(item.id) === String(id));
  const nextProject = window.projects[currentIndex + 1] || window.projects[0];

  const title = p.title ?? '';
  const year = p.year ?? (p.date ? String(p.date).slice(0, 4) : '');
  const categories = p.categories ?? (p.category ? [p.category] : []);
  const tagLine = [year, ...categories].filter(Boolean).join(' / ');

  const desc = p.description ?? p.summary ?? '';
  const heroCopy = p.oneLine ?? p.heroCopy ?? desc;
  const overviewText = p.overviewDetail ?? desc;

  const thumb = p.thumb ?? p.thumbnail ?? p.thumbnail_url ?? 'assets/images/hero.png';
  const isArcBeyond = title.includes('Arc & Beyond');
  const isMarugoto = title === 'まるごと祭2024 企画ディレクション';
  const heroColorClass = isArcBeyond ? 'is-blue' : '';
  const projectVariantClass = [
    isArcBeyond ? 'is-arc-beyond' : '',
    isMarugoto ? 'is-marugoto' : ''
  ].filter(Boolean).join(' ');

  const context = p.context ?? p.ontext ?? p.overview ?? '';
  const problem = p.problem ?? '';
  const process = Array.isArray(p.process) ? p.process : [];

  const roles = p.roles ?? p.tags ?? [];
  const tools = p.tools ?? [];
  const whatIDid = p.whatIDid ?? p.whatIDidList ?? p.outputs ?? [];

  const result = p.result ?? '';
  const resultHighlight = p.resultHighlight ?? '';
  const learnings = p.learnings ?? p.learning ?? '';

  const summaryCards = p.summaryCards ?? [
    {
      label: 'Challenge',
      text: problem || 'プロジェクトの背景にある課題を整理し、体験全体の方向性を決めること。'
    },
    {
      label: 'Approach',
      text: p.approach || '関係者との対話を重ねながら、実現可能な形へ設計・調整すること。'
    },
    {
      label: 'Output',
      text: p.output || '企画・体験・導線をつなぎ、プロジェクト全体として成立させること。'
    }
  ];

  const links = p.links && typeof p.links === 'object'
    ? Object.entries(p.links).filter(([, url]) => url && url !== '#')
    : [];
  const renderList = (items) => {
    if (Array.isArray(items)) {
      return items.map(item => `<li>${item}</li>`).join('');
    }
    if (items) {
      return `<li>${items}</li>`;
    }
    return '';
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const renderDetailTitle = (value) => {
    const text = String(value ?? '');

    if (text === 'Arc & Beyond コミュニケーション戦略') {
      return `
        <span class="detail-title-line detail-title-line--en">Arc &amp; Beyond</span>
        <span class="detail-title-line detail-title-line--jp">コミュニケーション<wbr>戦略</span>
      `;
    }

    if (text === 'まるごと祭2024 企画ディレクション') {
      return `
        <span class="detail-title-line detail-title-line--marugoto-main">まるごと祭2024</span>
        <span class="detail-title-line detail-title-line--marugoto-sub">企画ディレクション</span>
      `;
    }

    return escapeHtml(text);
  };

  document.title = `${title || 'Project'} | Kaworu Suzuki Portfolio`;

  root.innerHTML = `
    <article class="project-detail ${projectVariantClass}">

      <!-- ================= HERO ================= -->
      <section class="detail-hero-img ${heroColorClass}" style="background-image:url('${thumb}')">
        <div class="hero-overlay">
          <span class="detail-cat">${tagLine}</span>
          <h1 class="detail-title">${renderDetailTitle(title)}</h1>
          ${heroCopy ? `<p class="detail-lead">${heroCopy}</p>` : ''}

          <div class="hero-meta-row">
            ${year ? `
              <span>
                <small>Year</small>
                ${year}
              </span>
            ` : ''}
            ${categories.length ? `
              <span>
                <small>Field</small>
                ${categories.join(' / ')}
              </span>
            ` : ''}
            ${Array.isArray(roles) && roles.length ? `
              <span>
                <small>Role</small>
                ${roles[0]}
              </span>
            ` : ''}
          </div>
        </div>
      </section>

      <!-- ================= CONTENT ================= -->
      <div class="detail-content">

        <!-- 導入サマリー -->
        <section class="project-intro-panel glass-panel">
          <div class="project-intro-label">Project Summary</div>
          <p class="project-intro-text">
            ${desc}
          </p>
        </section>

        <!-- Overview + Role -->
        <div class="detail-grid detail-top-grid">
          <section class="glass-panel overview-panel">
            <h2 class="section-label">01. Overview</h2>
            <p class="large-text">${overviewText}</p>

            <div class="summary-card-grid">
              ${summaryCards.map(card => `
                <div class="summary-card">
                  <span>${card.label}</span>
                  <p>${card.text}</p>
                </div>
              `).join('')}
            </div>
          </section>

          <aside class="glass-panel detail-meta">
            <h2 class="section-label">My Role</h2>

            ${renderList(roles) ? `
              <div class="meta-block role-block">
                <h3 class="meta-title">Role</h3>
                <ul class="role-list">
                  ${renderList(roles)}
                </ul>
              </div>
            ` : ''}

            ${renderList(whatIDid) ? `
              <div class="meta-block">
                <h3 class="meta-title">What I did</h3>
                <ul class="role-list what-list">
                  ${renderList(whatIDid)}
                </ul>
              </div>
            ` : ''}

            ${Array.isArray(tools) && tools.length ? `
              <div class="meta-block">
                <h3 class="meta-title">Tools</h3>
                <p>${tools.join(' / ')}</p>
              </div>
            ` : ''}

            ${links.length ? `
              <div class="meta-block">
                <h3 class="meta-title">Links</h3>
                <div class="meta-links">
                  ${links.map(([label, url]) => `
                    <a class="cta-link" href="${url}" target="_blank" rel="noopener noreferrer">
                      <span class="cta-text">${label}</span>
                    </a>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </aside>
        </div>

        <!-- Context -->
        <section class="detail-section detail-readable">
          <h2 class="section-label">02. Context & Problem</h2>
          <div class="content-box">
            <p>${context}</p>
            ${problem ? `
              <div class="problem-card">
                <span class="problem-label">Main Challenge</span>
                <p><strong>課題：</strong>${problem}</p>
              </div>
            ` : ''}
          </div>
        </section>

        <!-- Process -->
        ${process.length ? `
          <section class="detail-section">
            <h2 class="section-label">03. Process</h2>
            <div class="process-grid">
              ${process.map((s, i) => {
                const step = s.step ?? `Step ${i + 1}`;
                const detail = s.detail ?? s.content ?? '';
                const image = s.image ?? s.img ?? '';

                return `
                  <div class="process-card glass-panel">
                    ${image ? `
                      <div class="process-card__media">
                        <img src="${image}" alt="${step}のイメージ">
                      </div>
                    ` : ''}
                    <span class="step-num">Step ${String(i + 1).padStart(2, '0')}</span>
                    <h3>${step}</h3>
                    <p>${detail}</p>
                  </div>
                `;
              }).join('')}
            </div>
          </section>
        ` : ''}

        <!-- Result / Learning -->
        <div class="detail-grid result-grid">
          <section class="glass-panel result-panel">
            <h2 class="section-label">04. Result</h2>

            ${resultHighlight ? `
              <p class="result-highlight">${resultHighlight}</p>
            ` : ''}

            <p>${result}</p>
          </section>

          <section class="glass-panel learning-panel">
            <h2 class="section-label">05. Learning</h2>
            <p>${learnings}</p>
          </section>
        </div>

        <!-- Next -->
        <section class="next-project-nav">
          <a href="projects.html" class="back-projects-link">
            All Projects
          </a>

          ${nextProject ? `
            <a href="project-detail.html?id=${nextProject.id}&from=detail" class="next-project-link">
              <span>Next Project</span>
              <strong>${nextProject.title}</strong>
            </a>
          ` : ''}
        </section>

      </div>
    </article>
  `;

  const subnav = document.querySelector('.page-subnav');
  const hero = root.querySelector('.detail-hero-img');

  if (subnav && hero) {
    const updateSubnavVisibility = () => {
      const heroBottom = hero.getBoundingClientRect().bottom;
      const subnavBottom = subnav.getBoundingClientRect().bottom;
      subnav.classList.toggle('is-visible', heroBottom <= subnavBottom + 1);
    };

    updateSubnavVisibility();
    window.addEventListener('scroll', updateSubnavVisibility, { passive: true });
    window.addEventListener('resize', updateSubnavVisibility);
  }
});
