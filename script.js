const GITHUB_USER = "djpark0603";

const currentYear = document.querySelector("#current-year");
const repoCount = document.querySelector("#repo-count");
const followerCount = document.querySelector("#follower-count");
const joinYear = document.querySelector("#join-year");
const syncDate = document.querySelector("#sync-date");
const repoGrid = document.querySelector("#repo-grid");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const revealObserver = prefersReducedMotion
  ? null
  : new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

function observeRevealElements() {
  document.querySelectorAll(".reveal").forEach((element) => {
    if (element.dataset.revealBound === "true") {
      return;
    }

    element.dataset.revealBound = "true";

    if (!revealObserver) {
      element.classList.add("is-visible");
      return;
    }

    revealObserver.observe(element);
  });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] ?? character;
  });
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(dateString));
}

function buildRepoCard(repo) {
  const description = repo.description
    ? escapeHtml(repo.description)
    : "설명이 아직 등록되지 않은 저장소입니다.";
  const language = escapeHtml(repo.language || "Unknown");

  return `
    <article class="repo-card">
      <div class="repo-header">
        <div>
          <h3>${escapeHtml(repo.name)}</h3>
          <p class="repo-description">${description}</p>
        </div>
        <span class="repo-language">${language}</span>
      </div>
      <div class="repo-meta">
        <p class="repo-updated">Updated ${formatDate(repo.updated_at)}</p>
        <div class="repo-links">
          <a href="${repo.html_url}" target="_blank" rel="noreferrer">Repository</a>
          ${
            repo.homepage
              ? `<a href="${repo.homepage}" target="_blank" rel="noreferrer">Website</a>`
              : ""
          }
        </div>
      </div>
    </article>
  `;
}

function renderRepoFallback() {
  if (!repoGrid) {
    return;
  }

  repoGrid.innerHTML = `
    <article class="repo-card">
      <div class="repo-header">
        <div>
          <h3>저장소 목록을 불러오지 못했습니다.</h3>
          <p class="repo-description">
            잠시 후 다시 시도하거나 GitHub 프로필에서 직접 확인해 주세요.
          </p>
        </div>
        <span class="repo-language">Fallback</span>
      </div>
      <div class="repo-meta">
        <p class="repo-updated">GitHub profile remains available.</p>
        <div class="repo-links">
          <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </article>
  `;
  repoGrid.setAttribute("aria-busy", "false");
}

async function loadGitHubData() {
  if (!repoGrid) {
    return;
  }

  try {
    const [profileResponse, reposResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${GITHUB_USER}`),
      fetch(
        `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=6&type=owner`
      ),
    ]);

    if (!profileResponse.ok || !reposResponse.ok) {
      throw new Error("GitHub API request failed.");
    }

    const profile = await profileResponse.json();
    const repos = await reposResponse.json();
    const visibleRepos = repos.filter((repo) => !repo.fork).slice(0, 4);

    if (repoCount) {
      repoCount.textContent = String(profile.public_repos ?? "-");
    }

    if (followerCount) {
      followerCount.textContent = String(profile.followers ?? "-");
    }

    if (joinYear) {
      joinYear.textContent = new Date(profile.created_at).getFullYear();
    }

    if (syncDate) {
      syncDate.textContent = new Intl.DateTimeFormat("ko-KR", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());
    }

    if (visibleRepos.length === 0) {
      renderRepoFallback();
      return;
    }

    repoGrid.innerHTML = visibleRepos.map(buildRepoCard).join("");
    repoGrid.setAttribute("aria-busy", "false");
  } catch (error) {
    renderRepoFallback();
    console.error(error);
  }
}

observeRevealElements();
loadGitHubData();
