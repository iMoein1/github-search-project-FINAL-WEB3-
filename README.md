# 🔍 GitHub Profile Searcher

A professional web application for searching and displaying GitHub user profiles.  
This project is being developed with **HTML, CSS, and JavaScript (ES Modules)** and aims to provide:

- Light/Dark theme toggle with persistence  
- Debounced search input with live suggestions  
- Detailed user profile information (bio, followers, following, repositories)  
- Repository list with stars, forks, and last update date  
- Error handling for API rate limits and invalid usernames  

---

## ⚠️ Project Status

🚧 **This project is still under development and not yet ready for production use.**  
Some features are implemented, but others are incomplete or subject to change.  
Expect bugs, missing functionality, and ongoing refactoring.

---

## 📂 Current Structure

project-root/ │ ├── index.html # Main HTML structure ├── style.css # Styling with light/dark themes ├── script.js # Main logic (profile rendering, suggestions, etc.) ├── utils/ │ ├── api.js # GitHub API fetch utilities (with token authentication) │ └── helpers.js # Debounce and themeManager utilities └── README.md # Project documentation

Code

---

## 🚀 Planned Features

- Responsive design for mobile devices  
- Improved error messages and loading states  
- Secure handling of GitHub API tokens  
- Caching of recent searches  
- Optional backend proxy for safer authentication  

---

## 📝 Notes

- This project currently uses a **hardcoded GitHub Personal Access Token (PAT)** in `utils/api.js`.  
  ⚠️ **Do not use this approach in production.** Tokens should be stored securely (e.g., environment variables or backend).  
- The UI is functional but not fully polished.  
- Contributions and suggestions are welcome.

---

## 📌 Disclaimer

This project is **not finished yet**.  
Please do not rely on it for production or critical use cases until further development and testing are completed.
