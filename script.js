document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    const savedColor = localStorage.getItem('borderColor') || '#4CAF50';
    const savedPos = localStorage.getItem('sidebarPos') || 'sidebar-left';
    const savedBg = localStorage.getItem('bgMode') || 'particles';
    const savedVisibility = localStorage.getItem('sidebarVisibility') || 'always';

    document.documentElement.style.setProperty('--border-color', savedColor);
    
    const container = document.getElementById('app-container');
    if (container) {
        container.className = savedPos;
        // Apply auto-hide class if enabled
        if (savedVisibility === 'autohide') {
            container.classList.add('sidebar-autohide');
        }
    }

    // Initialize Canvas Background Effect
    initBackground(savedBg, savedColor);

    // Sync input states if on Settings page
    const colorPicker = document.getElementById('color-picker');
    const posSelect = document.getElementById('pos-select');
    const bgSelect = document.getElementById('bg-select');
    const visSelect = document.getElementById('visibility-select');

    if (colorPicker) colorPicker.value = savedColor;
    if (posSelect) posSelect.value = savedPos;
    if (bgSelect) bgSelect.value = savedBg;
    if (visSelect) visSelect.value = savedVisibility;

    // Setup Search Bar Listener
    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', filterCards);
    }

    // Load Favorites if on Favorites page
    loadFavorites();
});

// --- SETTINGS LOGIC ---
function updateBorderColor(color) {
    document.documentElement.style.setProperty('--border-color', color);
    localStorage.setItem('borderColor', color);
    
    // Refresh background to match new color
    const savedBg = localStorage.getItem('bgMode') || 'particles';
    initBackground(savedBg, color);
}

function updateSidebarPos(pos) {
    const container = document.getElementById('app-container');
    // Keep auto-hide class if it exists while changing position
    const isAutohide = container.classList.contains('sidebar-autohide');
    container.className = pos;
    if (isAutohide) container.classList.add('sidebar-autohide');
    
    localStorage.setItem('sidebarPos', pos);
}

function updateSidebarVisibility(mode) {
    const container = document.getElementById('app-container');
    if (mode === 'autohide') {
        container.classList.add('sidebar-autohide');
    } else {
        container.classList.remove('sidebar-autohide');
    }
    localStorage.setItem('sidebarVisibility', mode);
}

function updateBgMode(mode) {
    localStorage.setItem('bgMode', mode);
    const color = localStorage.getItem('borderColor') || '#4CAF50';
    initBackground(mode, color);
}

// --- SEARCH LOGIC ---
function filterCards() {
    const query = document.getElementById('search-bar').value.toLowerCase();
    const cards = document.querySelectorAll('.card');

    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        if (title.includes(query)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// --- FULLSCREEN LOGIC ---
function toggleFullscreen() {
    const gameFrame = document.getElementById('game-frame');
    if (!gameFrame) return;

    if (!document.fullscreenElement) {
        gameFrame.requestFullscreen().catch(err => {
            alert(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}

// --- FAVORITES LOGIC ---
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function toggleFavorite(id, title, imgSrc, buttonElement, event) {
    if(event) event.preventDefault(); // Stop the link from clicking through

    const index = favorites.findIndex(fav => fav.id === id);
    
    if (index === -1) {
        favorites.push({ id, title, imgSrc });
        buttonElement.classList.add('active');
        buttonElement.innerHTML = '★';
    } else {
        favorites.splice(index, 1);
        buttonElement.classList.remove('active');
        buttonElement.innerHTML = '☆';
    }
    
    localStorage.setItem('favorites', JSON.stringify(favorites));
    syncDataToCloud(); 
}

function loadFavorites() {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    if (favorites.length === 0) {
        grid.innerHTML = '<p style="margin-top: 15px;">No favorites saved yet. Go star some games!</p>';
        return;
    }

    favorites.forEach(fav => {
        grid.innerHTML += `
            <div class="card">
                <button class="fav-btn active" onclick="toggleFavorite('${fav.id}', '${fav.title}', '${fav.imgSrc}', this, event); setTimeout(loadFavorites, 200);">★</button>
                <a href="play.html" style="text-decoration: none; color: inherit; height: 100%; display: flex; flex-direction: column;">
                    <div class="card-title">${fav.title}</div>
                    <div class="card-img-container">
                        <img src="${fav.imgSrc}" alt="${fav.title}">
                    </div>
                </a>
            </div>
        `;
    });
}

// --- GITHUB CLOUD SYNC MOCK ---
let isLoggedIn = false;

function loginWithGitHub() {
    alert("To enable secure GitHub syncing on static sites, you will need to add a Firebase configuration here in the future. For now, all data saves safely to your local device!");
    
    isLoggedIn = true;
    const btn = document.getElementById('login-btn');
    if(btn) {
        btn.innerHTML = "✅ Synced to GitHub";
        btn.style.background = "#4CAF50";
    }
}

function syncDataToCloud() {
    if (isLoggedIn) {
        console.log("Mock syncing to cloud: ", favorites);
    }
}

// --- CANVAS BACKGROUND EFFECTS ---
let canvasAnimation;
function initBackground(mode, accentColor) {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    window.cancelAnimationFrame(canvasAnimation);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (mode === 'none') {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return;
    }

    if (mode === 'particles') {
        const particles = Array.from({ length: 50 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 3 + 1
        }));

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = accentColor;
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            canvasAnimation = requestAnimationFrame(drawParticles);
        }
        drawParticles();
    } else if (mode === 'matrix') {
        const chars = '0123456789ABCDEF';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array.from({ length: columns }).fill(1);

        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = accentColor;
            ctx.font = fontSize + 'px monospace';

            drops.forEach((y, i) => {
                const text = chars[Math.floor(Math.random() * chars.length)];
                ctx.fillText(text, i * fontSize, y * fontSize);
                if (y * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            });
            canvasAnimation = requestAnimationFrame(drawMatrix);
        }
        drawMatrix();
    }
}

window.addEventListener('resize', () => {
    const savedColor = localStorage.getItem('borderColor') || '#4CAF50';
    const savedBg = localStorage.getItem('bgMode') || 'particles';
    initBackground(savedBg, savedColor);
});
