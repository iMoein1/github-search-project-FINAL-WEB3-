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
// دکمه Load More (ممکنه هنوز در HTML نباشه؛ در صورت نبودن، چک می‌کنیم قبل از استفاده)
const loadMoreBtn = document.getElementById("load-more-btn");

// ====================== متغیرهای بخش ریپو و صفحه‌بندی ======================
// توضیح: state محلی برای مدیریت صفحه‌بندی ریپوها
let currentUser = null;
let currentPage = 1;
let isLoadingMore = false;
const PER_PAGE = 10;

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
  if (!messageArea) return;
  messageArea.textContent = text;
  messageArea.className = `message-area ${type}`;
  messageArea.classList.remove("hidden");
}

function hideMessage() {
  if (!messageArea) return;
  messageArea.className = "message-area hidden";
  messageArea.textContent = "";
}

// ---------------- هندل فرم جستجو ----------------
// توضیح: با ارسال فرم، اطلاعات کاربر و ریپوها دریافت و نمایش داده می‌شوند.
if (form) {
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
}

// ---------------- پیشنهادهای خودکار با debounce ----------------
// توضیح: برای جلوگیری از درخواست‌های زیاد، با تاخیر کوتاه پس از تایپ، پیشنهادها دریافت می‌شود.
let debounceTimer;
if (input) {
  input.addEventListener("input", () => {
    const q = input.value.trim();
    clearTimeout(debounceTimer);
    if (q.length < 2) {
      hideSuggestions();
      return;
    }
    debounceTimer = setTimeout(() => fetchSuggestions(q), 250);
  });
}

// توضیح: کلیک خارج از لیست، پیشنهادها را مخفی می‌کند.
document.addEventListener("click", (e) => {
  if (suggestionsList && !suggestionsList.contains(e.target) && e.target !== input) {
    hideSuggestions();
  }
});

function hideSuggestions() {
  if (!suggestionsList) return;
  suggestionsList.innerHTML = "";
  suggestionsList.classList.add("hidden");
}

// توضیح: دریافت پیشنهاد نام‌کاربری از GitHub Search API
async function fetchSuggestions(query) {
  if (!suggestionsList) return;
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
        if (form) form.dispatchEvent(new Event("submit"));
      });
    });
  } catch (err) {
    // توضیح: در صورت خطا (مثل محدودیت درخواست‌ها)، پیشنهادها مخفی می‌شوند.
    hideSuggestions();
  }
}

// ==================== بخش ریپوها: گرفتن و رندر ====================

// توضیح: تابعی برای گرفتن ریپوها با صفحه‌بندی (per_page + page) و مرتب‌سازی بر اساس updated
async function fetchRepos(username, page = 1) {
  const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&direction=desc&per_page=${PER_PAGE}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) throw await handleApiError(res);
  return await res.json();
}

// ---------------- اسکلت بارگذاری ----------------
// توضیح: تا زمان دریافت اطلاعات، اسکلت بارگذاری نمایش داده می‌شود.
function renderSkeleton() {
  if (!profileContainer || !profileCard || !reposContainer) return;
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
  if (!profileCard) return;
  const name = user.name || user.login;
  const bio = user.bio || "No bio available.";
  const location = user.location ? `📍 ${user.location}` : "";
  const company = user.company ? `🏢 ${user.company}` : "";
  const blog = user.blog ? normalizeUrl(user.blog) : null;

  profileCard.innerHTML = `
    <img src="${user.avatar_url}" alt="${user.login}" />
    <div class="profile-meta">
      <h2>${name}</h2>
      <div class="badges">
        <span class="badge">👥 Followers: ${user.followers}</span>
        <span class="badge">🔗 Following: ${user.following}</span>
        <span class="badge">📦 Public repos: ${user.public_repos}</span>
      </div>
      <p>${bio}</p>
      <p>${[location, company].filter(Boolean).join(" | ")}</p>
      <p>
        <a href="${user.html_url}" target="_blank" rel="noopener">View on GitHub</a>
        ${blog ? ` | <a href="${blog}" target="_blank" rel="noopener">Website</a>` : ""}
      </p>
    </div>
  `;
}

// ---------------- قالب هر ریپو ----------------
// توضیح: نمایش اطلاعات تکمیلی هر ریپو (ستاره، فورک، زبان، لینک، تاریخ آپدیت)
function repoTemplate(r) {
  const lang = r.language ? `🧩 ${r.language}` : "No language";
  const desc = r.description ? r.description : "No description";
  const stars = `⭐ ${r.stargazers_count}`;
  const forks = `🍴 ${r.forks_count}`;
  const updated = new Date(r.updated_at).toLocaleDateString("en-US");

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
        <span style="font-size:12px; color:#6b7280;">Last updated: ${updated}</span>
      </div>
    </div>
  `;
}

// ---------------- رندر لیست ریپو (صفحه اول) ----------------
function renderRepos(repos) {
  if (!reposContainer) return;

  if (!Array.isArray(repos) || repos.length === 0) {
    reposContainer.innerHTML = `<div class="repos-title">No public repositories found.</div>`;
    if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
    return;
  }

  // قبلاً فقط 8 تاش رو نمایش می‌داد — حالا صفحه‌بندی وجود دارد؛ اما برای صفحه اول اگر خواستی می‌تونی محدودش کنی.
  const listHtml = `
    <div class="repos-title">Recent repositories</div>
    ${repos.map(repoTemplate).join("")}
  `;
  reposContainer.innerHTML = listHtml;
}

// ---------------- الحاق ریپوها (برای Load More) ----------------
function appendRepos(repos) {
  if (!reposContainer) return;
  if (!Array.isArray(repos) || repos.length === 0) {
    if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
    return;
  }
  reposContainer.insertAdjacentHTML("beforeend", repos.map(repoTemplate).join(""));
}

// ---------------- بارگذاری اطلاعات کاربر و ریپوها ----------------
// توضیح: به صورت همزمان پروفایل و ریپوهای اخیر کاربر دریافت می‌شود.
async function loadUser(username) {
  renderSkeleton();

  // ست کردن state صفحه‌بندی
  currentUser = username;
  currentPage = 1;
  if (loadMoreBtn) loadMoreBtn.classList.add("hidden");

  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}`),
      fetch(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=${PER_PAGE}&page=1`)
    ]);

    if (!userRes.ok) throw await handleApiError(userRes);
    if (!reposRes.ok) throw await handleApiError(reposRes);

    const user = await userRes.json();
    const repos = await reposRes.json();

    renderProfile(user);
    renderRepos(repos);

    // اگر تعداد برگشتی برابر PER_PAGE بود، احتمالاً صفحه‌ی بعدی وجود دارد -> نمایش دکمه
    if (Array.isArray(repos) && repos.length === PER_PAGE) {
      if (loadMoreBtn) loadMoreBtn.classList.remove("hidden");
    } else {
      if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
    }

    showMessage("Profile loaded successfully.", "success");
  } catch (err) {
    renderEmpty();
    showMessage(err.message || "An error occurred.", "error");
  }
}

// ---------------- بارگذاری صفحه بعدی ریپوها (Load More) ----------------
async function loadMoreRepos() {
  if (isLoadingMore) return;
  if (!currentUser) return;
  isLoadingMore = true;
  hideMessage();

  currentPage++;

  try {
    const data = await fetchRepos(currentUser, currentPage);

    // اگر کمتر از PER_PAGE برگشت، احتمالا دیگه صفحه بعدی نیست
    if (!Array.isArray(data) || data.length === 0) {
      if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
      return;
    }

    appendRepos(data);

    if (data.length < PER_PAGE) {
      if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
    }
  } catch (err) {
    showMessage(err.message || "Error loading more repositories.", "error");
  } finally {
    isLoadingMore = false;
  }
}

// وصل کردن رویداد به دکمه Load More (اگر وجود داشته باشد)
if (loadMoreBtn) {
  loadMoreBtn.addEventListener("click", loadMoreRepos);
}

// ---------------- پاک‌سازی هنگام خطا ----------------
// توضیح: در صورت خطا، کانتینر پروفایل خالی می‌شود اما نمایان می‌ماند.
function renderEmpty() {
  if (!profileContainer || !profileCard || !reposContainer) return;
  profileContainer.classList.remove("hidden");
  profileCard.innerHTML = "";
  reposContainer.innerHTML = "";
  if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
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

