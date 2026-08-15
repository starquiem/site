document.addEventListener('DOMContentLoaded', () => {
    // 1. Load saved settings
    const savedColor = localStorage.getItem('borderColor') || '#4CAF50';
    const savedPos = localStorage.getItem('sidebarPos') || 'sidebar-left';
    const savedBg = localStorage.getItem('bgMode') || 'particles';
    const savedVisibility = localStorage.getItem('sidebarVisibility') || 'always';
    const savedTheme = localStorage.getItem('themeMode') || 'dark';

    document.documentElement.style.setProperty('--border-color', savedColor);
    if (savedTheme === 'light') document.body.classList.add('light-mode');

    const container = document.getElementById('app-container');
    if (container) {
        container.className = savedPos;
        if (savedVisibility === 'autohide') container.classList.add('sidebar-autohide');
    }

    initBackground(savedBg, savedColor);

    // Sync Settings form values
    const colorPicker = document.getElementById('color-picker');
    const posSelect = document.getElementById('pos-select');
    const bgSelect = document.getElementById('bg-select');
    const visSelect = document.getElementById('visibility-select');
    const themeSelect = document.getElementById('theme-select');
    
    if (colorPicker) colorPicker.value = savedColor;
    if (posSelect) posSelect.value = savedPos;
    if (bgSelect) bgSelect.value = savedBg;
    if (visSelect) visSelect.value = savedVisibility;
    if (themeSelect) themeSelect.value = savedTheme;

    // Event listeners for settings changes
    if (colorPicker) colorPicker.addEventListener('input', (e) => updateBorderColor(e.target.value));
    if (posSelect) posSelect.addEventListener('change', (e) => updateSidebarPos(e.target.value));
    if (bgSelect) bgSelect.addEventListener('change', (e) => updateBgMode(e.target.value));
    if (visSelect) visSelect.addEventListener('change', (e) => updateSidebarVisibility(e.target.value));
    if (themeSelect) themeSelect.addEventListener('change', (e) => updateTheme(e.target.value));

    // Search bar functionality
    const searchBar = document.getElementById('search-bar');
    if (searchBar) searchBar.addEventListener('input', filterCards);

    // Auto-load iframe content on play.html if src parameter is supplied
    const urlParams = new URLSearchParams(window.location.search);
    const gameSrc = urlParams.get('src');
    const gameId = urlParams.get('id') || 'current-game';
    const gameFrame = document.getElementById('game-frame');
    if (gameSrc && gameFrame) {
        gameFrame.src = decodeURIComponent(gameSrc);
        const playRating = document.getElementById('play-rating');
        if (playRating) playRating.setAttribute('data-game-id', gameId);
    }

    loadFavorites();
    sortAndRenderCatalog();
    initAllRatings();
    setupGlobalEventListeners();
    
    if (localStorage.getItem('gh_logged_in') === 'true') updateLoginUI(true);
});

// --- Settings Functions ---
function updateTheme(theme) {
    theme === 'light' ? document.body.classList.add('light-mode') : document.body.classList.remove('light-mode');
    localStorage.setItem('themeMode', theme);
}

function updateBorderColor(color) {
    document.documentElement.style.setProperty('--border-color', color);
    localStorage.setItem('borderColor', color);
    initBackground(localStorage.getItem('bgMode') || 'particles', color);
}

function updateSidebarPos(pos) {
    const container = document.getElementById('app-container');
    if (!container) return;
    const isAutohide = container.classList.contains('sidebar-autohide');
    container.className = pos;
    if (isAutohide) container.classList.add('sidebar-autohide');
    localStorage.setItem('sidebarPos', pos);
}

function updateSidebarVisibility(mode) {
    const container = document.getElementById('app-container');
    if (!container) return;
    mode === 'autohide' ? container.classList.add('sidebar-autohide') : container.classList.remove('sidebar-autohide');
    localStorage.setItem('sidebarVisibility', mode);
}

function updateBgMode(mode) {
    localStorage.setItem('bgMode', mode);
    initBackground(mode, localStorage.getItem('borderColor') || '#4CAF50');
}

// --- Data Export / Import ---
export function exportSaveData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localStorage));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "minimalist_hub_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

export function importSaveData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            Object.keys(importedData).forEach(key => localStorage.setItem(key, importedData[key]));
            alert("Save data imported successfully! Reloading page...");
            location.reload();
        } catch (err) {
            alert("Invalid backup file format.");
        }
    };
    reader.readAsText(file);
}

// --- GitHub Sign In ---
export function loginWithGitHub() {
    localStorage.setItem('gh_logged_in', 'true');
    updateLoginUI(true);
}

function updateLoginUI(isLoggedIn) {
    const btn = document.getElementById('login-btn');
    if (!btn) return;
    if (isLoggedIn) {
        btn.innerHTML = "✅ Signed in with GitHub";
        btn.style.background = "#2ea44f";
        btn.style.cursor = "default";
        btn.onclick = null;
    }
}

// --- Robust Event Delegation (Fixes all click/button issues) ---
function setupGlobalEventListeners() {
    document.body.addEventListener('click', (e) => {
        // Handle Like / Dislike clicks
        const rateBtn = e.target.closest('.rate-btn');
        if (rateBtn) {
            e.preventDefault();
            const actionsContainer = rateBtn.closest('[data-game-id]');
            if (actionsContainer) {
                const gameId = actionsContainer.getAttribute('data-game-id');
                const type = rateBtn.classList.contains('rate-like') ? 'like' : 'dislike';
                handleRating(gameId, type, actionsContainer);
            }
            return;
        }

        // Handle Favorite clicks
        const favBtn = e.target.closest('.fav-btn');
        if (favBtn) {
            e.preventDefault();
            const card = favBtn.closest('.card');
            const gameId = card.getAttribute('data-game-id') || card.querySelector('a')?.href;
            const title = card.querySelector('.card-title')?.textContent || 'Item';
            const imgSrc = card.querySelector('img')?.src || '';
            toggleFavorite(gameId, title, imgSrc, favBtn);
            return;
        }

        // Handle Fullscreen button
        if (e.target.closest('#fullscreen-btn')) {
            e.preventDefault();
            toggleFullscreen();
            return;
        }
    });
}

// --- Like / Dislike System Logic ---
function handleRating(gameId, type, containerElement) {
    let ratings = JSON.parse(localStorage.getItem('gameRatings')) || {};
    if (!ratings[gameId]) ratings[gameId] = { likes: 0, dislikes: 0, userVote: null };

    const gameData = ratings[gameId];
    
    if (type === 'like') {
        if (gameData.userVote === 'like') {
            gameData.likes--; gameData.userVote = null;
        } else {
            gameData.likes++;
            if (gameData.userVote === 'dislike') gameData.dislikes--;
            gameData.userVote = 'like';
        }
    } else if (type === 'dislike') {
        if (gameData.userVote === 'dislike') {
            gameData.dislikes--; gameData.userVote = null;
        } else {
            gameData.dislikes++;
            if (gameData.userVote === 'like') gameData.likes--;
            gameData.userVote = 'dislike';
        }
    }

    localStorage.setItem('gameRatings', JSON.stringify(ratings));
    updateRatingUI(gameId, containerElement);
}

function updateRatingUI(gameId, containerElement) {
    if (!containerElement) return;
    
    let ratings = JSON.parse(localStorage.getItem('gameRatings')) || {};
    const data = ratings[gameId] || { likes: 0, dislikes: 0, userVote: null };

    const likeBtn = containerElement.querySelector('.rate-like');
    const dislikeBtn = containerElement.querySelector('.rate-dislike');

    if (likeBtn && dislikeBtn) {
        likeBtn.innerHTML = `👍 ${data.likes}`;
        dislikeBtn.innerHTML = `👎 ${data.dislikes}`;
        likeBtn.className = `rate-btn rate-like ${data.userVote === 'like' ? 'active-like' : ''}`;
        dislikeBtn.className = `rate-btn rate-dislike ${data.userVote === 'dislike' ? 'active-dislike' : ''}`;
    }
}

function initAllRatings() {
    document.querySelectorAll('[data-game-id]').forEach(container => {
        const gameId = container.getAttribute('data-game-id');
        if (gameId) updateRatingUI(gameId, container);
    });
}

// --- Sorting, Filtering & Favorites ---
export function sortAndRenderCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.card'));
    if (cards.length === 0) return;

    const letterGroups = {};
    for (let i = 65; i <= 90; i++) letterGroups[String.fromCharCode(i)] = [];
    const symbolGroup = [];

    cards.forEach(card => {
        const titleElem = card.querySelector('.card-title');
        if (!titleElem) return;
        const firstChar = titleElem.textContent.trim().charAt(0).toUpperCase();
        if (firstChar >= 'A' && firstChar <= 'Z') letterGroups[firstChar].push(card);
        else symbolGroup.push(card);
    });

    grid.innerHTML = '';

    Object.keys(letterGroups).forEach(letter => {
        if (letterGroups[letter].length > 0) {
            const header = document.createElement('div');
            header.className = 'section-header';
            header.textContent = letter;
            grid.appendChild(header);
            letterGroups[letter].forEach(card => grid.appendChild(card));
        }
    });

    if (symbolGroup.length > 0) {
        const header = document.createElement('div');
        header.className = 'section-header';
        header.textContent = '1-9 / Symbols';
        grid.appendChild(header);
        symbolGroup.forEach(card => grid.appendChild(card));
    }
}

function filterCards() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const cards = document.querySelectorAll('.card');
    const headers = document.querySelectorAll('.section-header');

    cards.forEach(card => {
        const titleElem = card.querySelector('.card-title');
        const title = titleElem ? titleElem.textContent.toLowerCase() : '';
        card.style.display = title.includes(query) ? 'flex' : 'none';
    });

    headers.forEach(header => {
        let nextElem = header.nextElementSibling;
        let hasVisibleCard = false;
        while (nextElem && !nextElem.classList.contains('section-header')) {
            if (nextElem.style.display !== 'none') {
                hasVisibleCard = true; break;
            }
            nextElem = nextElem.nextElementSibling;
        }
        header.style.display = hasVisibleCard ? 'block' : 'none';
    });
}

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function toggleFavorite(id, title, imgSrc, buttonElement) {
    const index = favorites.findIndex(fav => fav.id === id);
    let itemLink = buttonElement.closest('.card')?.querySelector('a')?.href || "play.html";
    
    if (index === -1) {
        favorites.push({ id, title, imgSrc, link: itemLink });
        buttonElement.classList.add('active');
        buttonElement.innerHTML = '★';
    } else {
        favorites.splice(index, 1);
        buttonElement.classList.remove('active');
        buttonElement.innerHTML = '☆';
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    loadFavorites();
}

function loadFavorites() {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (favorites.length === 0) {
        grid.innerHTML = `<div style="width: 100%; text-align: center; padding: 40px; color: #888;">
            <h3>You don't have any favorites yet!</h3></div>`;
        return;
    }

    favorites.forEach(fav => {
        grid.innerHTML += `
            <div class="card" data-game-id="${fav.id}">
                <button class="fav-btn active">★</button>
                <a href="${fav.link}" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">
                    <div class="card-img-container"><img src="${fav.imgSrc}" alt="${fav.title}"></div>
                    <div class="card-title">${fav.title}</div>
                </a>
            </div>`;
    });
}

function toggleFullscreen() {
    const wrapper = document.querySelector('.iframe-wrapper') || document.getElementById('game-frame');
    if (!wrapper) return;
    !document.fullscreenElement ? wrapper.requestFullscreen() : document.exitFullscreen();
}

// --- Canvas Background Animations ---
let canvasAnimation;
function initBackground(mode, accentColor) {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    window.cancelAnimationFrame(canvasAnimation);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (mode === 'none') {
        ctx.clearRect(0, 0, canvas.width, canvas.height); return;
    }

    if (mode === 'particles') {
        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5, size: Math.random() * 3 + 1
        }));
        function drawP() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = accentColor;
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
            });
            canvasAnimation = requestAnimationFrame(drawP);
        }
        drawP();
    }
}

window.addEventListener('resize', () => initBackground(localStorage.getItem('bgMode') || 'particles', localStorage.getItem('borderColor') || '#4CAF50'));

// Expose necessary functions for settings page file inputs
window.exportSaveData = exportSaveData;
window.importSaveData = importSaveData;
window.loginWithGitHub = loginWithGitHub;
