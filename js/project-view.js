document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const from = params.get('from');

  if (!Array.isArray(window.projects)) {
    console.error('projects が見つからない / 配列じゃない', window.projects);
    return;
  }

  const p = window.projects.find(item => String(item.id) === String(id));
  const root = document.getElementById('detail-root');

  if (!root) {
    console.error('detail-root が見つからない');
    return;
  }

  if (!p) {
    root.innerHTML = `
      <section class="detail-empty">
        <h1>Not Found</h1>
        <p>指定された作品（id=${id}）が見つかりませんでした。</p>
        <p><a href="index.html#projects">← 一覧に戻る</a></p>
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

  const title = p.title ?? '';
  const year = p.year ?? (p.date ? String(p.date).slice(0, 4) : '');
  const categories = p.categories ?? (p.category ? [p.category] : []);
  const tagLine = [year, ...categories].filter(Boolean).join(' / ');
  const desc = p.description ?? p.summary ?? '';
  const heroCopy = p.heroCopy ?? desc;
  const overviewText = p.overviewDetail ?? desc;
  const thumb = p.thumb ?? p.thumbnail ?? 'assets/images/hero.png';
  const context = p.context ?? p.ontext ?? p.overview ?? '';
  const problem = p.problem ?? '';
  const process = Array.isArray(p.process) ? p.process : [];
  const roles = p.roles ?? p.tags ?? [];
  const tools = p.tools ?? [];
  const result = p.result ?? '';
  const learnings = p.learnings ?? p.learning ?? '';

  document.title = `${title || 'Project'} | Thinking`;

  root.innerHTML = `
    <article class="project-detail">
      <div class="detail-hero-img" style="background-image:url('${thumb}')">
        <div class="hero-overlay">
          <span class="detail-cat">${tagLine}</span>
          <h1 class="detail-title">${title}</h1>
          ${heroCopy ? `<p class="detail-lead">${heroCopy}</p>` : ''}
        </div>
      </div>

      <div class="detail-content">
        <div class="detail-grid">
          <section class="glass-panel">
            <h2 class="section-label">01. Overview</h2>
            <p class="large-text">${overviewText}</p>
          </section>
          <aside class="glass-panel detail-meta">
            <h2 class="section-label">My Role</h2>
            <ul class="role-list">
              ${Array.isArray(roles) ? roles.map(r => `<li>${r}</li>`).join('') : `<li>${roles}</li>`}
            </ul>
            ${Array.isArray(tools) && tools.length ? `
              <div class="meta-block">
                <h3 class="meta-title">Tools</h3>
                <p>${tools.join(' / ')}</p>
              </div>
            ` : ''}
            ${(p.links && (p.links.demo || p.links.github)) ? `
              <div class="meta-block">
                <h3 class="meta-title">Links</h3>
                <div class="meta-links">
                  ${p.links.demo ? `<a class="cta-link" href="${p.links.demo}"><span class="cta-text">Visit Demo</span></a>` : ''}
                  ${p.links.github ? `<a class="cta-link" href="${p.links.github}"><span class="cta-text">View GitHub</span></a>` : ''}
                </div>
              </div>
            ` : ''}
          </aside>
        </div>

        <section class="detail-section">
          <h2 class="section-label">02. Context & Problem</h2>
          <div class="content-box">
            <p>${context}</p>
            ${problem ? `<div class="problem-card"><strong>課題：</strong>${problem}</div>` : ''}
          </div>
        </section>

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
                  <span class="step-num">Step 0${i + 1}</span>
                  <h3>${step}</h3>
                  <p>${detail}</p>
                </div>
              `;
            }).join('')}
          </div>
        </section>

        <div class="detail-grid">
          <section class="glass-panel">
            <h2 class="section-label">04. Result</h2>
            <p>${result}</p>
          </section>
          <section class="glass-panel">
            <h2 class="section-label">05. Learning</h2>
            <p>${learnings}</p>
          </section>
        </div>
      </div>
    </article>
  `;

  // IIFE for additional project details
  (function() {
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get('id');
    
    const project = window.projects.find(p => p.id === projectId);
    
    if (project) {
      // ヒーロー画像セクションに背景画像を設定
      const heroSection = document.getElementById('hero-detail');
      if (heroSection) {
        heroSection.style.backgroundImage = `url('${project.image}')`;
      }
      
      // タイトルと概要を表示
      document.getElementById('detail-title').textContent = project.title;
      document.getElementById('detail-summary').textContent = project.summary;
      document.getElementById('breadcrumb-title').textContent = project.title;
    }
  })();
});
