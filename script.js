document.addEventListener('DOMContentLoaded', () => {
    const savedColor = localStorage.getItem('borderColor') || '#4CAF50';
    const savedPos = localStorage.getItem('sidebarPos') || 'sidebar-left';
    const savedBg = localStorage.getItem('bgMode') || 'particles';
    const savedVisibility = localStorage.getItem('sidebarVisibility') || 'always';
    const savedTheme = localStorage.getItem('themeMode') || 'dark';

    document.documentElement.style.setProperty('--border-color', savedColor);
    
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }

    const container = document.getElementById('app-container');
    if (container) {
        container.className = savedPos;
        if (savedVisibility === 'autohide') {
            container.classList.add('sidebar-autohide');
        }
    }

    initBackground(savedBg, savedColor);

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

    const searchBar = document.getElementById('search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', filterCards);
    }

    loadFavorites();
    sortAndRenderCatalog();
});

export function updateTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
    localStorage.setItem('themeMode', theme);
}

export function updateBorderColor(color) {
    document.documentElement.style.setProperty('--border-color', color);
    localStorage.setItem('borderColor', color);
    const savedBg = localStorage.getItem('bgMode') || 'particles';
    initBackground(savedBg, color);
}

export function updateSidebarPos(pos) {
    const container = document.getElementById('app-container');
    const isAutohide = container.classList.contains('sidebar-autohide');
    container.className = pos;
    if (isAutohide) container.classList.add('sidebar-autohide');
    localStorage.setItem('sidebarPos', pos);
}

export function updateSidebarVisibility(mode) {
    const container = document.getElementById('app-container');
    if (mode === 'autohide') {
        container.classList.add('sidebar-autohide');
    } else {
        container.classList.remove('sidebar-autohide');
    }
    localStorage.setItem('sidebarVisibility', mode);
}

export function updateBgMode(mode) {
    localStorage.setItem('bgMode', mode);
    const color = localStorage.getItem('borderColor') || '#4CAF50';
    initBackground(mode, color);
}

export function sortAndRenderCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.card'));
    if (cards.length === 0) return;

    const letterGroups = {};
    for (let i = 65; i <= 90; i++) {
        letterGroups[String.fromCharCode(i)] = [];
    }
    const symbolGroup = [];

    cards.forEach(card => {
        const title = card.querySelector('.card-title').textContent.trim();
        const firstChar = title.charAt(0).toUpperCase();

        if (firstChar >= 'A' && firstChar <= 'Z') {
            letterGroups[firstChar].push(card);
        } else {
            symbolGroup.push(card);
        }
    });

    grid.innerHTML = '';

    Object.keys(letterGroups).forEach(letter => {
        const groupCards = letterGroups[letter];
        if (groupCards.length > 0) {
            const header = document.createElement('div');
            header.className = 'section-header';
            header.textContent = letter;
            grid.appendChild(header);
            groupCards.forEach(card => grid.appendChild(card));
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
        const title = card.querySelector('.card-title').textContent.toLowerCase();
        if (title.includes(query)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

    headers.forEach(header => {
        let nextElem = header.nextElementSibling;
        let hasVisibleCard = false;
        while (nextElem && !nextElem.classList.contains('section-header')) {
            if (nextElem.style.display !== 'none') {
                hasVisibleCard = true;
                break;
            }
            nextElem = nextElem.nextElementSibling;
        }
        header.style.display = hasVisibleCard ? 'block' : 'none';
    });
}

export function toggleFullscreen() {
    const wrapper = document.querySelector('.iframe-wrapper') || document.getElementById('game-frame');
    if (!wrapper) return;

    if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(err => {
            alert(`Fullscreen blocked: Make sure the content has loaded.`);
        });
    } else {
        document.exitFullscreen();
    }
}

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

export function toggleFavorite(id, title, imgSrc, buttonElement, event) {
    if(event) event.preventDefault();

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
}

function loadFavorites() {
    const grid = document.getElementById('favorites-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    if (favorites.length === 0) {
        grid.innerHTML = `
            <div style="width: 100%; text-align: center; padding: 40px; color: #888;">
                <h3>You don't have any favorites yet!</h3>
                <p style="margin-top: 8px; font-size: 14px;">Browse catalogs and click the star icon to save items here.</p>
            </div>
        `;
        return;
    }

    favorites.forEach(fav => {
        grid.innerHTML += `
            <div class="card">
                <button class="fav-btn active" onclick="window.toggleFavorite('${fav.id}', '${fav.title}', '${fav.imgSrc}', this, event); setTimeout(loadFavorites, 200);">★</button>
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
            Object.keys(importedData).forEach(key => {
                localStorage.setItem(key, importedData[key]);
            });
            alert("Save data imported successfully! Reloading page...");
            location.reload();
        } catch (err) {
            alert("Invalid backup file format.");
        }
    };
    reader.readAsText(file);
}

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

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('gh_logged_in') === 'true') {
        updateLoginUI(true);
    }
});

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

        function draw() {
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
            canvasAnimation = requestAnimationFrame(draw);
        }
        draw();
    } else if (mode === 'matrix') {
        const chars = '0123456789ABCDEF';
        const fontSize = 14;
        const columns = canvas.width / fontSize;
        const drops = Array.from({ length: columns }).fill(1);

        function draw() {
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
            canvasAnimation = requestAnimationFrame(draw);
        }
        draw();
    } else if (mode === 'snow') {
        const snowflakes = Array.from({ length: 70 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vy: Math.random() * 1.5 + 0.5,
            radius: Math.random() * 3 + 1
        }));

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = accentColor;
            snowflakes.forEach(flake => {
                flake.y += flake.vy;
                if (flake.y > canvas.height) flake.y = 0;
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            canvasAnimation = requestAnimationFrame(draw);
        }
        draw();
    } else if (mode === 'fireflies') {
        const fireflies = Array.from({ length: 30 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            alpha: Math.random(),
            fadeSpeed: Math.random() * 0.02 + 0.005
        }));

        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            fireflies.forEach(f => {
                f.x += f.vx;
                f.y += f.vy;
                f.alpha += f.fadeSpeed;
                if (f.alpha <= 0 || f.alpha >= 1) f.fadeSpeed *= -1;

                if (f.x < 0 || f.x > canvas.width) f.vx *= -1;
                if (f.y < 0 || f.y > canvas.height) f.vy *= -1;

                ctx.fillStyle = accentColor;
                ctx.globalAlpha = Math.abs(f.alpha);
                ctx.beginPath();
                ctx.arc(f.x, f.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1.0;
            canvasAnimation = requestAnimationFrame(draw);
        }
        draw();
    }
}

window.addEventListener('resize', () => {
    const savedColor = localStorage.getItem('borderColor') || '#4CAF50';
    const savedBg = localStorage.getItem('bgMode') || 'particles';
    initBackground(savedBg, savedColor);
});

window.updateTheme = updateTheme;
window.updateBorderColor = updateBorderColor;
window.updateSidebarPos = updateSidebarPos;
window.updateSidebarVisibility = updateSidebarVisibility;
window.updateBgMode = updateBgMode;
window.sortAndRenderCatalog = sortAndRenderCatalog;
window.toggleFullscreen = toggleFullscreen;
window.toggleFavorite = toggleFavorite;
window.exportSaveData = exportSaveData;
window.importSaveData = importSaveData;
window.loginWithGitHub = loginWithGitHub;
import confetti from 'https://esm.sh/canvas-confetti';

confetti();
