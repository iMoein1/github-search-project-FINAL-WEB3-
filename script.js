// ---------------- عناصر DOM ----------------
// توضیح: این بخش المان‌های مورد نیاز را از صفحه انتخاب می‌کند.
const body = document.body;
const themeToggle = document.getElementById("theme-toggle");
const form = document.getElementById("search-form");
const input = document.getElementById("username-input");
const messageArea = document.getElementById("message-area");
const suggestionsList = document.getElementById("suggestions-list");
const profileContainer = document.getElementById("profile-container");
const profileCard = document.getElementById("profile-card");
const reposContainer = document.getElementById("repos-container");
const fallbackAvatar = "assets/default-avatar.png"


// ---------------- مدیریت تم با ذخیره در localStorage ----------------
// توضیح: تم انتخابی کاربر ذخیره می‌شود تا در بازدیدهای بعدی حفظ گردد.
initTheme();
themeToggle.addEventListener("click", toggleTheme);

function initTheme() {
  const saved = localStorage.getItem("theme") || "light";
  body.classList.remove("light-theme", "dark-theme");
  body.classList.add(saved === "dark" ? "dark-theme" : "light-theme");
}

function toggleTheme() {
  const isDark = body.classList.contains("dark-theme");
  body.classList.toggle("dark-theme", !isDark);
  body.classList.toggle("light-theme", isDark);
  localStorage.setItem("theme", isDark ? "light" : "dark");
}

// ---------------- پیام‌رسان عمومی ----------------
// توضیح: پیام‌ها در ناحیه مشخص نمایش داده می‌شوند.
function showMessage(text, type = "info") {
  messageArea.textContent = text;
  messageArea.className = `message-area ${type}`;
  messageArea.classList.remove("hidden");
}

function hideMessage() {
  messageArea.className = "message-area hidden";
  messageArea.textContent = "";
}

// ---------------- هندل فرم جستجو ----------------
// توضیح: با ارسال فرم، اطلاعات کاربر و ریپوها دریافت و نمایش داده می‌شوند.
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessage();
  const username = input.value.trim();

  if (!username) {
    showMessage("Please enter a username.", "error");
    return;
  }

  await loadUser(username);
});

// ---------------- پیشنهادهای خودکار با debounce ----------------
// توضیح: برای جلوگیری از درخواست‌های زیاد، با تاخیر کوتاه پس از تایپ، پیشنهادها دریافت می‌شود.
let debounceTimer;
input.addEventListener("input", () => {
  const q = input.value.trim();
  clearTimeout(debounceTimer);
  if (q.length < 2) {
    hideSuggestions();
    return;
  }
  debounceTimer = setTimeout(() => fetchSuggestions(q), 250);
});

// توضیح: کلیک خارج از لیست، پیشنهادها را مخفی می‌کند.
document.addEventListener("click", (e) => {
  if (!suggestionsList.contains(e.target) && e.target !== input) {
    hideSuggestions();
  }
});

function hideSuggestions() {
  suggestionsList.innerHTML = "";
  suggestionsList.classList.add("hidden");
}

// توضیح: دریافت پیشنهاد نام‌کاربری از GitHub Search API
async function fetchSuggestions(query) {
  try {
    const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(query)}+in:login&per_page=8`);
    if (!res.ok) throw await handleApiError(res);
    const data = await res.json();

    if (!data.items || data.items.length === 0) {
      hideSuggestions();
      return;
    }

    suggestionsList.innerHTML = data.items
      .map(
        (u) => `
        <div class="suggestion-item" role="option" data-login="${u.login}">
          <img src="${u.avatar_url}" alt="${u.login}" />
          <span>${u.login}</span>
        </div>`
      )
      .join("");

    suggestionsList.classList.remove("hidden");

    // توضیح: روی آیتم پیشنهاد کلیک شود، مقدار ورودی ست و جستجو انجام می‌شود.
    suggestionsList.querySelectorAll(".suggestion-item").forEach((el) => {
      el.addEventListener("click", () => {
        const login = el.getAttribute("data-login");
        input.value = login;
        hideSuggestions();
        form.dispatchEvent(new Event("submit"));
      });
    });
  } catch (err) {
    // توضیح: در صورت خطا (مثل محدودیت درخواست‌ها)، پیشنهادها مخفی می‌شوند.
    hideSuggestions();
  }
}

// ---------------- بارگذاری اطلاعات کاربر و ریپوها ----------------
// توضیح: به صورت همزمان پروفایل و ریپوهای اخیر کاربر دریافت می‌شود.
async function loadUser(username) {
  renderSkeleton();

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=10`)
    ]);

    if (!userRes.ok) throw await handleApiError(userRes);
    if (!reposRes.ok) throw await handleApiError(reposRes);

    const user = await userRes.json();
    const repos = await reposRes.json();

    renderProfile(user);
    renderRepos(repos);
    showMessage("Profile loaded successfully.", "success");
  } catch (err) {
    renderEmpty();
    showMessage(err.message || "An error occurred.", "error");
  }
}

// ---------------- اسکلت بارگذاری ----------------
// توضیح: تا زمان دریافت اطلاعات، اسکلت بارگذاری نمایش داده می‌شود.
function renderSkeleton() {
  profileContainer.classList.remove("hidden");
  profileCard.innerHTML = `
    <div class="skeleton skeleton-avatar"></div>
    <div class="profile-meta">
      <div class="skeleton skeleton-line" style="width: 50%"></div>
      <div class="skeleton skeleton-line" style="width: 80%"></div>
      <div class="skeleton skeleton-line" style="width: 60%"></div>
      <div class="skeleton skeleton-line" style="width: 40%"></div>
    </div>
  `;
  reposContainer.innerHTML = `
    <div class="repos-title">Loading repositories...</div>
    <div class="skeleton skeleton-line" style="width: 100%; height: 18px;"></div>
    <div class="skeleton skeleton-line" style="width: 95%; height: 18px;"></div>
    <div class="skeleton skeleton-line" style="width: 90%; height: 18px;"></div>
  `;
}

// ---------------- رندر پروفایل ----------------
// توضیح: اطلاعات کاربر با جزئیات مناسب و لینک‌ها نمایش داده می‌شود.
function renderProfile(user) {
  const name = user.name || user.login;
  const bio = user.bio || "No bio available.";
  const email = user.email || "No public email";
  const location = user.location ? `📍 ${user.location}` : "";
  const company = user.company ? `🏢 ${user.company}` : "";
  const blog = user.blog ? normalizeUrl(user.blog) : null;

  profileCard.innerHTML = `
    <img src="${user.avatar_url}"
     alt="${user.login}"
    onerror="this.onerror=null; this.src+`${fallbackAvatar}`;"
    />
    <div class="profile-meta">
      <h2>${name}</h2>
      <div class="badges">
        <span class="badge">👥 Followers: ${user.followers}</span>
        <span class="badge">🔗 Following: ${user.following}</span>
        <span class="badge">📦 Public repos: ${user.public_repos}</span>
      </div>
      <p>${bio}</p>
      <p>${[location, company].filter(Boolean).join(" | ")}</p>
      <p><strong>Email:</strong>${email}</p>
      <p>
        <a href="${user.html_url}" target="_blank" rel="noopener">View on GitHub</a>
        ${blog ? ` | <a href="${blog}" target="_blank" rel="noopener">Website</a>` : ""}
      </p>
    </div>
  `;
}

// ---------------- رندر ریپوزیتوری‌ها ----------------
// توضیح: چند ریپوی برتر بر اساس آپدیت اخیر نمایش داده می‌شود.
function renderRepos(repos) {
  if (!Array.isArray(repos) || repos.length === 0) {
    reposContainer.innerHTML = `<div class="repos-title">No public repositories found.</div>`;
    return;
  }

  const topRepos = repos
    .slice(0, 8)
    .map((r) => {
      const lang = r.language ? `🧩 ${r.language}` : "No language";
      const desc = r.description ? r.description : "No description";
      const stars = `⭐ ${r.stargazers_count}`;
      const forks = `🍴 ${r.forks_count}`;
      return `
        <div class="repo-item">
          <div>
            <a href="${r.html_url}" target="_blank" rel="noopener">${r.name}</a>
            <div class="repo-stats">
              <span>${lang}</span>
              <span>${stars}</span>
              <span>${forks}</span>
            </div>
            <div style="color:#6b7280; margin-top:4px;">${desc}</div>
          </div>
          <div style="text-align:end;">
            <span style="font-size:12px; color:#6b7280;">Last updated: ${new Date(r.updated_at).toLocaleDateString("en-US")}</span>
          </div>
        </div>
      `;
    })
    .join("");

  reposContainer.innerHTML = `
    <div class="repos-title">Recent repositories</div>
    ${topRepos}
  `;
}

// ---------------- پاک‌سازی هنگام خطا ----------------
// توضیح: در صورت خطا، کانتینر پروفایل خالی می‌شود اما نمایان می‌ماند.
function renderEmpty() {
  profileContainer.classList.remove("hidden");
  profileCard.innerHTML = "";
  reposContainer.innerHTML = "";
}

// ---------------- هندل ارور API ----------------
// توضیح: پیام‌های خطا از پاسخ API خوانده شده و قابل فهم نمایش داده می‌شوند.
async function handleApiError(response) {
  let message = `Network error (${response.status})`;
  try {
    const data = await response.json();
    if (data && data.message) {
      message = data.message;
      // توضیح: هندل محدودیت نرخ درخواست‌ها
      if (message.toLowerCase().includes("rate limit")) {
        message = "You have reached the API rate limit. Please try again later.";
      }
      // توضیح: تبدیل پیام کاربر پیدا نشد به ساده‌تر
      if (response.status === 404) {
        message = "User not found. Please check the username.";
      }
    }
  } catch {
    // توضیح: اگر JSON پارس نشود، پیام عمومی نمایش داده می‌شود.
  }
  return new Error(message);
}

// ---------------- ابزارهای کمکی ----------------
// توضیح: اگر وب‌سایت بدون پروتکل باشد، https اضافه می‌شود.
function normalizeUrl(url) {
  if (!url) return null;
  const hasProtocol = /^https?:\/\//i.test(url);
  return hasProtocol ? url : `https://${url}`;
}
