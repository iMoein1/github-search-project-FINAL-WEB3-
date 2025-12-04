// script.js
const usernameInput = document.getElementById("username-input");
const searchForm = document.getElementById("search-form");
const messageArea = document.getElementById("message-area");
const suggestionsList = document.getElementById("suggestions-list");
const profileContainer = document.getElementById("profile-container");
const profileCard = document.getElementById("profile-card");
const reposContainer = document.getElementById("repos-container");
const loadMoreBtn = document.getElementById("load-more-btn");

let currentPage = 1;
let currentUser = "";
let debounceTimeout;

// ======= تابع debounce برای جلوگیری از ارسال درخواست زیاد =======
function debounce(func, delay) {
    return function(...args) {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => func.apply(this, args), delay);
    };
}

// ======= گرفتن اطلاعات کاربر از GitHub API =======
async function fetchUser(username) {
    try {
        const res = await fetch(`https://api.github.com/users/${username}`);
        if (res.status === 404) throw new Error("کاربر پیدا نشد");
        if (res.status === 403) throw new Error("محدودیت API اعمال شد");
        const data = await res.json();
        return data;
    } catch (err) {
        throw err;
    }
}

// ======= گرفتن پیشنهادهای کاربری بر اساس ورودی =======
async function fetchSuggestions(query) {
    try {
        const res = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
        if (res.status === 403) throw new Error("محدودیت API اعمال شد");
        const data = await res.json();
        return data.items || [];
    } catch (err) {
        console.error(err);
        return [];
    }
}

// ======= گرفتن ریپوهای کاربر =======
async function fetchRepos(username, page = 1, perPage = 5) {
    const res = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=${perPage}&page=${page}`);
    if (res.status === 403) throw new Error("محدودیت API اعمال شد");
    const data = await res.json();
    return data;
}

// ======= رندر کردن پیشنهادهای کاربری =======
function renderSuggestions(users) {
    suggestionsList.innerHTML = "";
    if (!users.length) {
        suggestionsList.classList.add("hidden");
        return;
    }
    users.forEach(user => {
        const item = document.createElement("div");
        item.classList.add("suggestion-item");
        item.innerHTML = `
            <img src="${user.avatar_url}" alt="avatar">
            <a href="#" data-username="${user.login}">${user.login}</a>
        `;
        suggestionsList.appendChild(item);
    });
    suggestionsList.classList.remove("hidden");

    // اضافه کردن کلیک به هر پیشنهاد
    document.querySelectorAll(".suggestion-item a").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const username = link.dataset.username;
            usernameInput.value = username;
            suggestionsList.classList.add("hidden");
            searchUser(username);
        });
    });
}

// ======= رندر کردن پروفایل کاربر =======
function renderProfile(user) {
    profileCard.innerHTML = `
        <img src="${user.avatar_url}" alt="avatar">
        <div class="profile-meta">
            <h2>${user.name || user.login}</h2>
            <p>Username: ${user.login}</p>
            ${user.email ? `<p>Email: ${user.email}</p>` : ""}
            ${user.bio ? `<p>Bio: ${user.bio}</p>` : ""}
            <p><a href="${user.html_url}" target="_blank">GitHub Profile</a></p>
            <div class="badges">
                <span>Followers: ${user.followers}</span>
                <span>Following: ${user.following}</span>
                <span>Public Repos: ${user.public_repos}</span>
            </div>
        </div>
    `;
    profileContainer.classList.remove("hidden");
}

// ======= رندر کردن ریپوها =======
function renderRepos(repos, append = false) {
    if (!append) reposContainer.innerHTML = "";
    repos.forEach(repo => {
        const repoEl = document.createElement("div");
        repoEl.classList.add("repo-item");
        repoEl.innerHTML = `
            <a href="${repo.html_url}" target="_blank">${repo.name}</a>
            <div class="repo-stats">
                <span>⭐ ${repo.stargazers_count}</span>
                <span>🍴 ${repo.forks_count}</span>
                ${repo.language ? `<span>💻 ${repo.language}</span>` : ""}
            </div>
        `;
        reposContainer.appendChild(repoEl);
    });
    loadMoreBtn.classList.toggle("hidden", repos.length < 5);
}

// ======= هندل کردن جستجوی کاربر =======
async function searchUser(username) {
    messageArea.classList.add("hidden");
    profileContainer.classList.add("hidden");
    try {
        currentUser = username;
        currentPage = 1;
        const user = await fetchUser(username);
        renderProfile(user);
        const repos = await fetchRepos(username, currentPage);
        renderRepos(repos);
    } catch (err) {
        messageArea.textContent = err.message;
        messageArea.classList.remove("hidden");
    }
}

// ======= دکمه "Load More" برای صفحه‌بندی ریپوها =======
loadMoreBtn.addEventListener("click", async () => {
    try {
        currentPage++;
        const repos = await fetchRepos(currentUser, currentPage);
        renderRepos(repos, true);
    } catch (err) {
        alert(err.message);
    }
});

// ======= دریافت پیشنهادها هنگام تایپ کاربر با debounce =======
usernameInput.addEventListener("input", debounce(async (e) => {
    const query = e.target.value.trim();
    if (!query) {
        suggestionsList.classList.add("hidden");
        return;
    }
    const users = await fetchSuggestions(query);
    renderSuggestions(users);
}, 400));

// ======= ارسال فرم جستجو =======
searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) return;
    searchUser(username);
});
// script.js

// ===== کامنت‌ها به فارسی و دابل کوتیشن =====

// المنت‌ها
const searchInput = document.getElementById("username-input");
const suggestionsList = document.getElementById("suggestions-list");
const searchForm = document.getElementById("search-form");

// متغیر debounce
let debounceTimeout;

// تابع debounce برای جلوگیری از ارسال درخواست‌های پشت سر هم
function debounce(func, delay) {
  return (...args) => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => func(...args), delay);
  };
}

// تابع نمایش پیشنهادها
async function fetchSuggestions(query) {
  if (!query) {
    suggestionsList.style.display = "none";
    suggestionsList.innerHTML = "";
    return;
  }

  try {
    // درخواست به API GitHub برای جستجوی کاربران
    const response = await fetch(`https://api.github.com/search/users?q=${query}&per_page=5`);
    if (response.status === 403) {
      // محدودیت API
      suggestionsList.innerHTML = "<div style='padding:10px;'>محدودیت درخواست API رسیده است.</div>";
      suggestionsList.style.display = "block";
      return;
    }

    const data = await response.json();
    const users = data.items;

    // اگر کاربری پیدا نشد
    if (!users || users.length === 0) {
      suggestionsList.innerHTML = "<div style='padding:10px;'>کاربری پیدا نشد.</div>";
      suggestionsList.style.display = "block";
      return;
    }

    // نمایش پیشنهادها
    suggestionsList.innerHTML = users.map(user => `
      <div class="suggestion-item" data-username="${user.login}">
        <img src="${user.avatar_url}" alt="avatar">
        <a href="profile.html?username=${user.login}">${user.login}</a>
      </div>
    `).join("");

    suggestionsList.style.display = "flex";

    // اضافه کردن رویداد کلیک برای رفتن به صفحه پروفایل
    document.querySelectorAll(".suggestion-item").forEach(item => {
      item.addEventListener("click", () => {
        const username = item.getAttribute("data-username");
        window.location.href = `profile.html?username=${username}`;
      });
    });

  } catch (error) {
    console.error("خطا در گرفتن پیشنهادها:", error);
  }
}

// استفاده از debounce روی تایپ کاربر
searchInput.addEventListener("input", debounce((e) => {
  fetchSuggestions(e.target.value.trim());
}, 400));

// مدیریت submit فرم
searchForm.addEventListener("submit", e => {
  e.preventDefault();
  const username = searchInput.value.trim();
  if (username) {
    window.location.href = `profile.html?username=${username}`;
  }
});

