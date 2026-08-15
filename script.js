// script.js - Unified Hub Logic

document.addEventListener('DOMContentLoaded', () => {
    // 1. Safe Loader Overlay Handler (with robust failsafe)
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

        // Absolute failsafe: removes loader after 1 second guaranteed so you never get stuck
        setTimeout(() => {
            clearInterval(interval);
            if (loaderOverlay && loaderOverlay.parentNode) {
                loaderOverlay.classList.add('fade-out');
                setTimeout(() => loaderOverlay.remove(), 400);
            }
        }, 1000);
    }

    // 2. Theme Management across all pages
    const themeSelect = document.getElementById('theme-select');
    const savedTheme = localStorage.getItem('theme') || 'dark';

    if (savedTheme !== 'dark') {
        document.body.classList.add(savedTheme);
    }

    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            const selected = e.target.value;
            document.body.classList.remove('light-mode', 'hacker-mode', 'sakura-mode');
            if (selected !== 'dark') {
                document.body.classList.add(selected);
            }
            localStorage.setItem('theme', selected);
        });
    }

    // 3. Background Canvas Animation
    initCanvas();

    // 4. Dynamic Content (Recent & Favorites)
    loadRecentlyPlayed();
    loadFavoritesGrid();

    // 5. Functional GitHub Sign-In System
    initGitHubAuth();
});

// --- GitHub Auth System ---
function initGitHubAuth() {
    const githubBtn = document.getElementById('github-login-btn');
    if (!githubBtn) return;

    // Check if user is already logged in
    const session = JSON.parse(localStorage.getItem('hub_user_session'));
    if (session) {
        githubBtn.textContent = `Logged in as ${session.username} (Logout)`;
        githubBtn.style.background = 'var(--accent-success, #2ea043)';
    }

    githubBtn.addEventListener('click', () => {
        const currentSession = JSON.parse(localStorage.getItem('hub_user_session'));
        
        if (currentSession) {
            // Log out action
            localStorage.removeItem('hub_user_session');
            githubBtn.textContent = 'Sign in with GitHub';
            githubBtn.style.background = '';
            alert('Successfully logged out!');
        } else {
            // Log in simulation / OAuth redirect
            // For a static site without a backend, this simulates a successful GitHub login session
            const username = prompt('Enter your GitHub username to sign in:');
            if (username && username.trim() !== '') {
                const newSession = { username: username.trim(), avatar: `https://github.com/${username.trim()}.png` };
                localStorage.setItem('hub_user_session', JSON.stringify(newSession));
                githubBtn.textContent = `Logged in as ${newSession.username} (Logout)`;
                githubBtn.style.background = 'var(--accent-success, #2ea043)';
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
        favGrid.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 10px 0;">No favorite games or shows added yet. Click the star icon on any card to save it here!</div>`;
        return;
    }

    const catalog = {
        'game-1v1lol': { title: '1v1.lol', img: 'https://via.placeholder.com/300x200', src: 'https://example.com' },
        'game-sample2': { title: 'Sample Game 2', img: 'https://via.placeholder.com/300x200', src: 'https://example.com' }
    };

    favGrid.innerHTML = favorites.map(id => {
        const item = catalog[id] || { title: id, img: 'https://via.placeholder.com/300x200', src: '#' };
        return `
            <div class="card" data-game-id="${id}">
                <button class="fav-btn active" onclick="toggleFavorite(event, '${id}')">★</button>
                <a href="./play.html?src=${encodeURIComponent(item.src)}&title=${encodeURIComponent(item.title)}&id=${id}" onclick="trackRecent('${item.title}', '${item.img}', '${item.src}', '${id}')" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">
                    <div class="card-img-container"><img src="${item.img}" alt="${item.title}"></div>
                    <div class="card-title">${item.title}</div>
                </a>
            </div>
        `;
    }).join('');
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
        recentGrid.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 10px 0;">No recently played games yet. Jump into one below!</div>`;
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

// --- Background Particle Canvas Engine ---
function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 40 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 0.5
    }));

    function render() {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
        });

        requestAnimationFrame(render);
    }
    render();
}
