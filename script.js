const GITHUB_USER = "djpark0603";
const currentYear = document.querySelector("#current-year");
const repoGrid = document.querySelector("#repo-grid");
const profileAvatar = document.querySelector("#profile-avatar");
const profileName = document.querySelector("#profile-name");
const profileBio = document.querySelector("#profile-bio");
const repoCount = document.querySelector("#repo-count");
const followerCount = document.querySelector("#follower-count");
const joinYear = document.querySelector("#join-year");
const profileLink = document.querySelector("#profile-link");

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
      { threshold: 0.18 }
    );

function observeRevealElements(scope = document) {
  scope.querySelectorAll(".reveal").forEach((element) => {
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
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function buildRepoCard(repo) {
  const description = repo.description
    ? escapeHtml(repo.description)
    : "설명을 아직 추가하지 않은 저장소입니다.";
  const language = escapeHtml(repo.language || "미정");

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
          <a href="${repo.html_url}" target="_blank" rel="noreferrer">Repo</a>
          ${
            repo.homepage
              ? `<a href="${repo.homepage}" target="_blank" rel="noreferrer">Live</a>`
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
          <h3>저장소 정보를 불러오지 못했습니다.</h3>
          <p class="repo-description">
            잠시 후 다시 새로고침하거나 GitHub 프로필에서 직접 확인해 주세요.
          </p>
        </div>
        <span class="repo-language">Fallback</span>
      </div>
      <div class="repo-meta">
        <p class="repo-updated">GitHub profile is still available.</p>
        <div class="repo-links">
          <a href="https://github.com/${GITHUB_USER}" target="_blank" rel="noreferrer">Profile</a>
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

    if (profileAvatar) {
      profileAvatar.src = profile.avatar_url;
      profileAvatar.alt = `${profile.login} GitHub avatar`;
    }

    if (profileName) {
      profileName.textContent = profile.name || profile.login;
    }

    if (profileBio) {
      profileBio.textContent =
        profile.bio || "GitHub 활동과 최근 저장소를 자동으로 보여주는 포트폴리오 홈입니다.";
    }

    if (repoCount) {
      repoCount.textContent = String(profile.public_repos ?? "-");
    }

    if (followerCount) {
      followerCount.textContent = String(profile.followers ?? "-");
    }

    if (joinYear) {
      joinYear.textContent = new Date(profile.created_at).getFullYear();
    }

    if (profileLink) {
      profileLink.href = profile.html_url;
      profileLink.textContent = profile.html_url.replace(/^https?:\/\//, "");
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
