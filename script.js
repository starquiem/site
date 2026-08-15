// script.js - Unified Hub Logic

// Master Catalog (Empty - add your actual games and media links here)
const masterCatalog = {
    games: [],
    media: []
};

// Global canvas animation frame tracker
let animationFrameId;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Safe Loader Overlay
    const loaderOverlay = document.getElementById('loader-overlay');
    const loaderBar = document.getElementById('loader-bar');
    
    if (loaderOverlay) {
        let width = 0;
        const interval = setInterval(() => {
            width += 33;
            if (loaderBar) loaderBar.style.width = Math.min(width, 100) + '%';
            if (width >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    loaderOverlay.classList.add('fade-out');
                    setTimeout(() => loaderOverlay.remove(), 400);
                }, 200);
            }
        }, 30);

        setTimeout(() => {
            clearInterval(interval);
            if (loaderOverlay && loaderOverlay.parentNode) {
                loaderOverlay.classList.add('fade-out');
                setTimeout(() => loaderOverlay.remove(), 400);
            }
        }, 1000);
    }

    // 2. Theme Management via Select Dropdown
    const themeSelect = document.getElementById('theme-select');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    if (savedTheme !== 'dark') {
        document.body.classList.add(savedTheme);
    }

    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            const selected = e.target.value;
            document.body.classList.remove('light-mode', 'hacker-mode', 'sakura-mode', 'synthwave-mode');
            if (selected !== 'dark') {
                document.body.classList.add(selected);
            }
            localStorage.setItem('theme', selected);
        });
    }

    // 3. Particle Settings & Initialization
    const particleSelect = document.getElementById('particle-select');
    const savedParticles = localStorage.getItem('hub_particles') || 'default';
    
    if (particleSelect) {
        particleSelect.value = savedParticles;
        particleSelect.addEventListener('change', (e) => {
            localStorage.setItem('hub_particles', e.target.value);
            initCanvas(); // Restart canvas with new settings
        });
    }

    // Start background effect
    initCanvas();

    // 4. Load Grids
    loadContentGrid();
    loadRecentlyPlayed();
    loadFavoritesGrid();
    initSearch();
    initGitHubAuth();
});

// --- Background Particle Canvas Engine ---
function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Cancel old animation loop if user changes settings
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const mode = localStorage.getItem('hub_particles') || 'default';

    if (mode === 'none') {
        ctx.clearRect(0, 0, width, height);
        return; // Halt engine
    }

    let particles = [];
    let count = mode === 'snow' ? 100 : (mode === 'fast' ? 70 : 40);

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: mode === 'fast' ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 0.5,
            vy: mode === 'snow' ? Math.random() * 2 + 1 : (mode === 'fast' ? (Math.random() - 0.5) * 8 : (Math.random() - 0.5) * 0.5),
            radius: mode === 'snow' ? Math.random() * 2 + 1 : Math.random() * 1.5 + 0.5
        });
    }

    function render() {
        ctx.clearRect(0, 0, width, height);
        
        // Snow mode looks better fully solid, otherwise transparent
        ctx.fillStyle = mode === 'snow' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)';

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Wrapping boundaries
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        animationFrameId = requestAnimationFrame(render);
    }
    render();
}

// --- Dynamic Content Grids ---
function loadContentGrid() {
    const grid = document.getElementById('content-grid');
    if (!grid) return;

    const path = window.location.pathname;
    let items = [];

    if (path.includes('games.html')) {
        items = masterCatalog.games;
    } else if (path.includes('media.html')) {
        items = masterCatalog.media;
    } else {
        items = [...masterCatalog.games, ...masterCatalog.media];
    }

    renderCards(grid, items);
}

function renderCards(container, items) {
    const favorites = JSON.parse(localStorage.getItem('hub_favorites')) || [];

    if (items.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 0.95rem; padding: 20px 0; grid-column: 1 / -1;">No items available yet. Add items to your catalog in script.js!</div>`;
        return;
    }

    container.innerHTML = items.map(item => {
        const isFav = favorites.includes(item.id);
        return `
            <div class="card" data-title="${item.title.toLowerCase()}">
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${item.id}')">${isFav ? '★' : '☆'}</button>
                <a href="./play.html?src=${encodeURIComponent(item.src)}&title=${encodeURIComponent(item.title)}&id=${item.id}" onclick="trackRecent('${item.title}', '${item.img}', '${item.src}', '${item.id}')" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">
                    <div class="card-img-container"><img src="${item.img}" alt="${item.title}"></div>
                    <div class="card-title">${item.title}</div>
                </a>
            </div>
        `;
    }).join('');
}

// --- Search Bar Filter ---
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('#content-grid .card');

        cards.forEach(card => {
            const title = card.getAttribute('data-title') || '';
            if (title.includes(query)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// --- GitHub Auth System ---
function initGitHubAuth() {
    const githubBtn = document.getElementById('github-login-btn');
    if (!githubBtn) return;

    const session = JSON.parse(localStorage.getItem('hub_user_session'));
    if (session) {
        githubBtn.textContent = `Logged in as ${session.username} (Logout)`;
        githubBtn.style.background = 'var(--accent-success, #2ea043)';
        githubBtn.style.borderColor = 'var(--accent-success, #2ea043)';
        githubBtn.style.color = '#fff';
    }

    githubBtn.addEventListener('click', () => {
        const currentSession = JSON.parse(localStorage.getItem('hub_user_session'));
        
        if (currentSession) {
            localStorage.removeItem('hub_user_session');
            githubBtn.textContent = 'Sign in with GitHub';
            githubBtn.style.background = 'rgba(255,255,255,0.08)';
            githubBtn.style.borderColor = 'var(--border-color)';
            alert('Successfully logged out!');
        } else {
            const username = prompt('Enter your GitHub username to sign in:');
            if (username && username.trim() !== '') {
                const newSession = { username: username.trim(), avatar: `https://github.com/${username.trim()}.png` };
                localStorage.setItem('hub_user_session', JSON.stringify(newSession));
                githubBtn.textContent = `Logged in as ${newSession.username} (Logout)`;
                githubBtn.style.background = 'var(--accent-success, #2ea043)';
                githubBtn.style.borderColor = 'var(--accent-success, #2ea043)';
                githubBtn.style.color = '#fff';
                alert(`Welcome, ${newSession.username}! You are now signed in.`);
            }
        }
    });
}

// --- Favorites System ---
window.toggleFavorite = function(event, gameId) {
    event.stopPropagation();
    event.preventDefault();
    
    let favorites = JSON.parse(localStorage.getItem('hub_favorites')) || [];
    const index = favorites.indexOf(gameId);
    
    const btn = event.currentTarget;
    if (index > -1) {
        favorites.splice(index, 1);
        btn.classList.remove('active');
        btn.textContent = '☆';
    } else {
        favorites.push(gameId);
        btn.classList.add('active');
        btn.textContent = '★';
    }
    
    localStorage.setItem('hub_favorites', JSON.stringify(favorites));
    loadFavoritesGrid();
};

function loadFavoritesGrid() {
    const favGrid = document.getElementById('favorites-grid');
    if (!favGrid) return;

    const favorites = JSON.parse(localStorage.getItem('hub_favorites')) || [];
    
    if (favorites.length === 0) {
        favGrid.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 10px 0;">No favorite items added yet. Click the star icon on any card to save it here!</div>`;
        return;
    }

    const allItems = [...masterCatalog.games, ...masterCatalog.media];
    const favoriteItems = allItems.filter(item => favorites.includes(item.id));

    favGrid.innerHTML = favoriteItems.map(item => `
        <div class="card" data-game-id="${item.id}">
            <button class="fav-btn active" onclick="toggleFavorite(event, '${item.id}')">★</button>
            <a href="./play.html?src=${encodeURIComponent(item.src)}&title=${encodeURIComponent(item.title)}&id=${item.id}" onclick="trackRecent('${item.title}', '${item.img}', '${item.src}', '${item.id}')" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">
                <div class="card-img-container"><img src="${item.img}" alt="${item.title}"></div>
                <div class="card-title">${item.title}</div>
            </a>
        </div>
    `).join('');
}

// --- Recently Played Tracking ---
window.trackRecent = function(title, img, src, id) {
    let recent = JSON.parse(localStorage.getItem('hub_recent')) || [];
    recent = recent.filter(item => item.id !== id);
    recent.unshift({ title, img, src, id });
    if (recent.length > 4) recent.pop();
    localStorage.setItem('hub_recent', JSON.stringify(recent));
};

function loadRecentlyPlayed() {
    const recentGrid = document.getElementById('recent-grid');
    if (!recentGrid) return;
    const recent = JSON.parse(localStorage.getItem('hub_recent')) || [];
    
    if (recent.length === 0) {
        recentGrid.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 10px 0;">No recently played items yet. Jump into one below!</div>`;
        return;
    }

    const favorites = JSON.parse(localStorage.getItem('hub_favorites')) || [];

    recentGrid.innerHTML = recent.map(game => {
        const isFav = favorites.includes(game.id);
        return `
            <div class="card" data-game-id="${game.id}">
                <button class="fav-btn ${isFav ? 'active' : ''}" onclick="toggleFavorite(event, '${game.id}')">${isFav ? '★' : '☆'}</button>
                <a href="./play.html?src=${encodeURIComponent(game.src)}&title=${encodeURIComponent(game.title)}&id=${game.id}" onclick="trackRecent('${game.title}', '${game.img}', '${game.src}', '${game.id}')" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">
                    <div class="card-img-container"><img src="${game.img}" alt="${game.title}"></div>
                    <div class="card-title">${game.title}</div>
                </a>
            </div>
        `;
    }).join('');
}
