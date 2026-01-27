/**
 * main.js
 * 1. ヘッダーのスクロール制御 (Sticky / Glassmorphism)
 * 2. ナビゲーションのカレント表示
 * 3. トップページのプロジェクトリスト描画
 */



document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('main-header');
    const isHome = document.body.classList.contains('home-page');

    // --- 1. ヘッダーのスクロール制御 ---
    const handleScroll = () => {
        const scrollY = window.scrollY;

        if (scrollY > 50) {
            // スクロールされた時、またはHome以外のページ
            header.classList.remove('header-top');
            header.classList.add('header-scrolled');
        } else {
            // 最上部にいる時
            if (isHome) {
                // Homeなら透明に戻す
                header.classList.add('header-top');
                header.classList.remove('header-scrolled');
            } else {
                // Home以外は白背景を維持
                header.classList.add('header-scrolled');
            }
        }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
});

// ===== Intro Overlay: show only once per tab (Home first visit only) =====
(() => {
  const intro = document.getElementById("intro");
  const projects = document.getElementById("projects");
  const hint = document.getElementById("scrollHint");
  const isHome = document.body.classList.contains("home-page");

  // Home以外では何もしない
  if (!isHome || !intro) return;

  const KEY = "intro_seen_v1"; // バージョン変えたい時は v2 に
  const alreadySeen = sessionStorage.getItem(KEY) === "1";

  // 2回目以降：introを完全に無効化（表示もしない・スクロールも奪わない）
  if (alreadySeen) {
    intro.style.display = "none";
    intro.classList.remove("is-show", "is-hide");
    return;
  }

  let triggered = false;

  const KEEP_MS = 2200;
  const FADE_MS = 900;

  const runIntro = () => {
    if (triggered) return;
    triggered = true;

    // ここで「見た」扱いにする（＝このタブではもう二度と出ない）
    sessionStorage.setItem(KEY, "1");

    // scroll hint は即消す（あれば）
    if (hint) {
      hint.classList.add("is-hide");
      setTimeout(() => (hint.style.display = "none"), 600);
    }

    // 1回目のスクロールを止める（intro中だけ）
    document.documentElement.classList.add("intro-lock");
    document.body.classList.add("intro-lock");

    // Intro表示
    intro.classList.add("is-show");

    // KEEP後にフェードアウト
    setTimeout(() => {
      intro.classList.remove("is-show");
      intro.classList.add("is-hide");

      setTimeout(() => {
        intro.style.display = "none";

        // スクロール解放
        document.documentElement.classList.remove("intro-lock");
        document.body.classList.remove("intro-lock");

        // 「勝手にscrollされる」が嫌なら ↓この1行を消す（超重要）
        // projects?.scrollIntoView({ behavior: "smooth" });

      }, FADE_MS);
    }, KEEP_MS);

    // もうスクロール奪わない
    cleanup();
  };

  const onWheel = (e) => {
    if (triggered) return;
    e.preventDefault();
    runIntro();
  };

  const onKeyDown = (e) => {
    if (triggered) return;
    if (["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key)) {
      e.preventDefault();
      runIntro();
    }
  };

  let startY = null;
  const onTouchStart = (e) => {
    if (triggered) return;
    startY = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (triggered || startY == null) return;
    const dy = startY - e.touches[0].clientY;
    if (dy > 10) runIntro();
  };

  const cleanup = () => {
    window.removeEventListener("wheel", onWheel, { passive: false });
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("touchstart", onTouchStart, { passive: true });
    window.removeEventListener("touchmove", onTouchMove, { passive: true });
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
})();


// ===== Intro Glass (show first, hide on first scroll) =====
(() => {
  const intro = document.getElementById("intro");
  if (!intro) return;

  // もしURLが #projects みたいになってたら、初回表示で勝手に飛ぶので消す
  if (location.hash) {
    history.replaceState(null, "", location.pathname + location.search);
  }

  // 最初は必ずintroを見せる + スクロールロック
  intro.classList.add("is-show");
  document.documentElement.classList.add("intro-lock");
  document.body.classList.add("intro-lock");

  let dismissed = false;

  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;

    intro.classList.remove("is-show");
    intro.classList.add("is-hide");

    // フェードが終わったら消す & スクロール解放
    setTimeout(() => {
      intro.style.display = "none";
      document.documentElement.classList.remove("intro-lock");
      document.body.classList.remove("intro-lock");
    }, 900); // CSSのtransitionと合わせる
  };

  // 「本当にスクロールした」ときだけ反応させる（誤発火防止）
  const onWheel = (e) => {
    if (dismissed) return;
    if (Math.abs(e.deltaY) < 8) return; // ちょい動いただけは無視
    e.preventDefault(); // ここでページの実スクロールを止める
    dismiss();
  };

  const onKeyDown = (e) => {
    if (dismissed) return;
    if (["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key)) {
      e.preventDefault();
      dismiss();
    }
  };

  let startY = null;
  const onTouchStart = (e) => {
    if (dismissed) return;
    startY = e.touches[0].clientY;
  };
  const onTouchMove = (e) => {
    if (dismissed || startY == null) return;
    const dy = startY - e.touches[0].clientY;
    if (dy > 12) dismiss();
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
})();



    



    // --- 2. 現在のページのナビゲーションを強調 (currentクラス付与) ---
    const currentPath = window.location.pathname;
    const navLinks = {
        'home': document.getElementById('nav-home'),
        'project': document.getElementById('nav-project'),
        'about': document.getElementById('nav-about')
    };

    // パス名に基づいてカレントを判定
    if (currentPath.endsWith('index.html') || currentPath.endsWith('/')) {
        navLinks.home?.classList.add('current');
    } else if (currentPath.includes('projects.html') || currentPath.includes('project-detail.html')) {
        navLinks.project?.classList.add('current');
    } else if (currentPath.includes('about.html')) {
        navLinks.about?.classList.add('current');
    }


    // --- 3. トップページ専用：プロジェクトリストの描画 ---
    const projectListContainer = document.getElementById('projects-list');
    // index.htmlのときだけ実行
    if (projectListContainer) {
        const data = (typeof projects !== 'undefined') ? projects
                    : (window.PROJECTS || []); // どっちでも動く保険
        renderTopProjects(projectListContainer, data);
    }

/**
 * index.html用の描画関数
 * おすすめ順（priority）の上位3件を表示
 */
function renderTopProjects(container, data) {
  const list = Array.isArray(data) ? data : [];

  // priorityが無いデータでも動くように保険
  const topProjects = [...list]
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999))
    .slice(0, 3);

  container.innerHTML = topProjects.map(p => {
    // data.jsの形がまだ統一されてない前提で「両対応」にしてある
    const id = p.id ?? p.slug ?? "00";
    const title = p.title ?? "";
    const desc = p.description ?? p.summary ?? "";
    const year = p.year ?? (p.date ? String(p.date).slice(0,4) : "");
    const categories = p.categories ?? (p.category ? [p.category] : []);
    const roles = p.roles ?? p.tags ?? [];

    const tagLine = [year, ...categories].filter(Boolean).join(" / ");
    const metaLine = Array.isArray(roles) ? roles.join(" / ") : String(roles || "");

    // 画像パスも両対応
    const thumb = p.thumb ?? p.thumbnail ?? "assets/images/hero.png";
    const alt = p.alt ?? `${title}のサムネイル`;

    const detailUrl = `project-detail.html?id=${encodeURIComponent(id)}&from=home`;

    return `
      <article class="project-row">
        <a class="project-link" href="${detailUrl}" aria-label="${title}の詳細を見る"></a>

        <div class="project-row__media">
          <img src="${thumb}" alt="${alt}">
        </div>

        <div class="project-row__content">
          <p class="project-row__tag">${tagLine}</p>
          <h3 class="project-row__title">${title}</h3>

          <p class="project-row__desc">${desc}</p>

          <p class="project-row__meta">${metaLine}</p>

          <div class="project-row__ctaWrap">
            <a class="project-row__ctaLine" href="${detailUrl}">
              <span class="cta-text">View more</span>
              <span class="cta-arrow" aria-hidden="true"></span>
            </a>
          </div>
        </div>
      </article>
    `;
  }).join('');
}


/**
 * ユーティリティ：iOS Safari等でのスムーズスクロール用（Contactリンクなど）
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

(function () {
  const nav = document.getElementById("main-nav");
  if (!nav) return;

  const indicator = nav.querySelector(".nav-indicator");
  const links = Array.from(nav.querySelectorAll("a"));

  const moveIndicator = (el) => {
    if (!el) return;
    const navRect = nav.getBoundingClientRect();
    const rect = el.getBoundingClientRect();

    const left = rect.left - navRect.left;
    const width = rect.width;

    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
  };

  // 初期位置：current があればそこ、なければ最初のリンク
  const current = nav.querySelector("a.current") || links[0];
  moveIndicator(current);

  // hoverで移動
  links.forEach((a) => {
    a.addEventListener("mouseenter", () => moveIndicator(a));
  });

  // nav から出たら current に戻す
  nav.addEventListener("mouseleave", () => {
    const cur = nav.querySelector("a.current") || links[0];
    moveIndicator(cur);
  });

  // クリックで current を更新（同一ページ内でも見た目が揃う）
  links.forEach((a) => {
    a.addEventListener("click", () => {
      links.forEach((x) => x.classList.remove("current"));
      a.classList.add("current");
      moveIndicator(a);
    });
  });

  // リサイズ時も位置を再計算
  window.addEventListener("resize", () => {
    const cur = nav.querySelector("a.current") || links[0];
    moveIndicator(cur);
  });
})();


// ===== ABOUT values interactive =====
const valueButtons = document.querySelectorAll(".about-values-list li");
const descriptions = document.querySelectorAll(".about-values-desc p");

valueButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.value;

    valueButtons.forEach(b => b.classList.remove("active"));
    descriptions.forEach(d => d.classList.remove("active"));

    btn.classList.add("active");
    const targetDesc = document.querySelector(`[data-desc="${target}"]`);
    if (targetDesc) targetDesc.classList.add("active");
  });
});

if ("scrollRestoration" in history) {
  history.scrollRestoration = "auto";
}

// ===== About values tabs =====
(() => {
  const root = document.querySelector(".about-values-interactive");
  if (!root) return;

  const tabs = root.querySelectorAll(".about-values-list li");
  const descs = root.querySelectorAll(".about-values-desc [data-desc]");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const key = tab.dataset.value;

      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");

      descs.forEach(p => {
        p.classList.toggle("active", p.dataset.desc === key);
      });
    });
  });
})();

// ===== Contact form (Formspree AJAX) =====
(() => {
  const form = document.getElementById("contact-form");
  if (!form) return;

  const button = document.getElementById("contact-submit");
  const status = document.getElementById("contact-status");
  if (!button || !status) return;

  let isSending = false;
  const originalLabel = button.textContent;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isSending) return;

    isSending = true;
    button.disabled = true;
    button.textContent = "送信中…";
    status.textContent = "";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        button.textContent = "送信しました";
        button.classList.add("is-sent");
        status.textContent = "ありがとうございます。内容を確認のうえご連絡します。";
        form.reset();
        return;
      }

      const data = await response.json().catch(() => null);
      const message =
        data?.errors?.[0]?.message ??
        "送信に失敗しました。時間をおいて再度お試しください。";
      status.textContent = message;
    } catch (error) {
      status.textContent = "送信に失敗しました。ネットワークをご確認ください。";
    } finally {
      if (button.textContent !== "送信しました") {
        button.textContent = originalLabel;
        button.disabled = false;
      }
      isSending = false;
    }
  });
})();
