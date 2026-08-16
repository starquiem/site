// script.js - Unified Hub Logic (HTML-Driven Version)

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

    if (savedTheme !== 'dark') document.body.classList.add(savedTheme);

    if (themeSelect) {
        themeSelect.value = savedTheme;
        themeSelect.addEventListener('change', (e) => {
            const selected = e.target.value;
            document.body.classList.remove('light-mode', 'hacker-mode', 'sakura-mode', 'synthwave-mode');
            if (selected !== 'dark') document.body.classList.add(selected);
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
            initCanvas(); 
        });
    }
    initCanvas();

    // 4. Initialize Data & Subsystems
    updateStarUI(); // Updates the UI for any hardcoded HTML cards
    loadRecentlyPlayed();
    loadFavoritesGrid();
    initSearch();
    initGitHubAuth();

    // 5. Global Click Listener for dynamically handling HTML cards
    document.addEventListener('click', (e) => {
        // Handle Favorite Click
        if (e.target.classList.contains('fav-btn')) {
            e.preventDefault();
            const card = e.target.closest('.card');
            if (!card) return;
            
            const id = card.getAttribute('data-id');
            const title = card.getAttribute('data-title');
            const img = card.getAttribute('data-img');
            const src = card.getAttribute('data-src');
            
            toggleFavorite(id, title, img, src);
        }
        
        // Handle Play Link Click
        const playLink = e.target.closest('.play-link');
        if (playLink) {
            const card = playLink.closest('.card');
            if (card) {
                const id = card.getAttribute('data-id');
                const title = card.getAttribute('data-title');
                const img = card.getAttribute('data-img');
                const src = card.getAttribute('data-src');
                trackRecent(title, img, src, id);
            }
        }
    });
});

// --- UI Sync Function ---
// Scans HTML and highlights stars if they are saved in favorites
function updateStarUI() {
    const favorites = JSON.parse(localStorage.getItem('hub_favorites_v2')) || [];
    document.querySelectorAll('.card').forEach(card => {
        const id = card.getAttribute('data-id');
        const btn = card.querySelector('.fav-btn');
        if (btn && id) {
            const isFav = favorites.some(f => f.id === id);
            if (isFav) {
                btn.classList.add('active');
                btn.textContent = '★';
            } else {
                btn.classList.remove('active');
                btn.textContent = '☆';
            }
        }
    });
}

// --- Data Logic (Favorites & Recent) ---
function toggleFavorite(id, title, img, src) {
    let favorites = JSON.parse(localStorage.getItem('hub_favorites_v2')) || [];
    const index = favorites.findIndex(f => f.id === id);
    
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push({ id, title, img, src });
    }
    
    localStorage.setItem('hub_favorites_v2', JSON.stringify(favorites));
    updateStarUI();
    loadFavoritesGrid(); // Re-render if on favorites page
}

function trackRecent(title, img, src, id) {
    let recent = JSON.parse(localStorage.getItem('hub_recent')) || [];
    recent = recent.filter(item => item.id !== id);
    recent.unshift({ title, img, src, id });
    if (recent.length > 4) recent.pop();
    localStorage.setItem('hub_recent', JSON.stringify(recent));
}

// --- Grid Renderers for Dynamic Pages (Recent/Favorites) ---
function generateCardHTML(item) {
    return `
        <div class="card" data-id="${item.id}" data-title="${item.title}" data-img="${item.img}" data-src="${item.src}">
            <button class="fav-btn">☆</button>
            <a href="./play.html?src=${encodeURIComponent(item.src)}&title=${encodeURIComponent(item.title)}&id=${item.id}" class="play-link" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">
                <div class="card-img-container"><img src="${item.img}" alt="${item.title}"></div>
                <div class="card-title">${item.title}</div>
            </a>
        </div>
    `;
}

function loadFavoritesGrid() {
    const favGrid = document.getElementById('favorites-grid');
    if (!favGrid) return;

    const favorites = JSON.parse(localStorage.getItem('hub_favorites_v2')) || [];
    if (favorites.length === 0) {
        favGrid.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 10px 0;">No favorite items added yet. Click the star icon on any card to save it here!</div>`;
        return;
    }
    favGrid.innerHTML = favorites.map(item => generateCardHTML(item)).join('');
    updateStarUI();
}

function loadRecentlyPlayed() {
    const recentGrid = document.getElementById('recent-grid');
    if (!recentGrid) return;
    
    const recent = JSON.parse(localStorage.getItem('hub_recent')) || [];
    if (recent.length === 0) {
        recentGrid.innerHTML = `<div style="color: var(--text-muted); font-size: 0.9rem; padding: 10px 0;">No recently played items yet. Jump into one below!</div>`;
        return;
    }
    recentGrid.innerHTML = recent.map(item => generateCardHTML(item)).join('');
    updateStarUI();
}

// --- Search Bar Filter ---
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('#content-grid .card');

        cards.forEach(card => {
            const title = (card.getAttribute('data-title') || '').toLowerCase();
            card.style.display = title.includes(query) ? 'flex' : 'none';
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

// --- Background Particle Canvas Engine ---
function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const mode = localStorage.getItem('hub_particles') || 'default';
    if (mode === 'none') {
        ctx.clearRect(0, 0, width, height);
        return; 
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
        ctx.fillStyle = mode === 'snow' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)';

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

        animationFrameId = requestAnimationFrame(render);
    }
    render();
}
