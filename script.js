// Initialization and loader animation
window.addEventListener('DOMContentLoaded', () => {
    const loaderBar = document.getElementById('loader-bar');
    const loaderOverlay = document.getElementById('loader-overlay');
    if (loaderBar && loaderOverlay) {
        let width = 0;
        const interval = setInterval(() => {
            width += 20;
            loaderBar.style.width = width + '%';
            if (width >= 100) {
                clearInterval(interval);
                loaderOverlay.classList.add('fade-out');
                setTimeout(() => loaderOverlay.remove(), 400);
            }
        }, 50);
    }
    loadSettings();
    initCanvas();
    loadRecentlyPlayed();
});

// Settings Management
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('hub_settings')) || {
        accent: '#4CAF50',
        theme: 'dark',
        position: 'sidebar-left',
        visibility: 'always',
        bgEffect: 'particles'
    };

    applySettings(settings);

    const colorPicker = document.getElementById('color-picker');
    const themeSelect = document.getElementById('theme-select');
    const posSelect = document.getElementById('pos-select');
    const visibilitySelect = document.getElementById('visibility-select');
    const bgSelect = document.getElementById('bg-select');

    if (colorPicker) colorPicker.value = settings.accent;
    if (themeSelect) themeSelect.value = settings.theme;
    if (posSelect) posSelect.value = settings.position;
    if (visibilitySelect) visibilitySelect.value = settings.visibility;
    if (bgSelect) bgSelect.value = settings.bgEffect;

    [colorPicker, themeSelect, posSelect, visibilitySelect, bgSelect].forEach(element => {
        if (element) {
            element.addEventListener('change', () => {
                const updated = {
                    accent: colorPicker.value,
                    theme: themeSelect.value,
                    position: posSelect.value,
                    visibility: visibilitySelect.value,
                    bgEffect: bgSelect.value
                };
                localStorage.setItem('hub_settings', JSON.stringify(updated));
                applySettings(updated);
            });
        }
    });
}

function applySettings(settings) {
    document.documentElement.style.setProperty('--border-color', settings.accent);
    
    const body = document.body;
    body.className = '';
    if (settings.theme === 'light') body.classList.add('light-mode');
    if (settings.theme === 'hacker') body.classList.add('hacker-mode');
    if (settings.theme === 'sakura') body.classList.add('sakura-mode');

    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.className = `${settings.position} ${settings.visibility === 'autohide' ? 'sidebar-autohide' : ''}`;
    }

    if (window.updateCanvasMode) {
        window.updateCanvasMode(settings.bgEffect);
    }
}

// Background Canvas Particle Engine (Particles, Sakura, Hacker Rain)
let canvasAnimationId = null;
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

    let currentMode = JSON.parse(localStorage.getItem('hub_settings'))?.bgEffect || 'particles';

    window.updateCanvasMode = (mode) => {
        currentMode = mode;
    };

    // Standard Particles
    let particles = Array.from({ length: 50 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1,
        vy: (Math.random() - 0.5) * 1,
        radius: Math.random() * 2 + 1
    }));

    // Sakura Petals
    let sakura = Array.from({ length: 40 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.random() * 1.5 + 0.5,
        vy: Math.random() * 1.5 + 1,
        size: Math.random() * 6 + 4,
        angle: Math.random() * 360,
        spin: Math.random() * 0.05 - 0.025
    }));

    // Hacker Digital Rain
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    let drops = Array.from({ length: columns }, () => Math.floor(Math.random() * height));
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*';

    function render() {
        ctx.clearRect(0, 0, width, height);

        if (currentMode === 'particles') {
            ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#4CAF50';
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
        } else if (currentMode === 'sakura') {
            ctx.fillStyle = '#ffb7c5';
            sakura.forEach(s => {
                s.x += s.vx + Math.sin(s.angle);
                s.y += s.vy;
                s.angle += s.spin;
                if (s.y > height + 10) {
                    s.y = -10;
                    s.x = Math.random() * width;
                }
                if (s.x > width + 10) s.x = -10;

                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.angle);
                ctx.beginPath();
                ctx.ellipse(0, 0, s.size, s.size / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        } else if (currentMode === 'hacker') {
            ctx.fillStyle = 'rgba(0, 255, 102, 0.85)';
            ctx.font = fontSize + 'px monospace';
            drops.forEach((y, i) => {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, y * fontSize);
                if (y * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            });
        }

        canvasAnimationId = requestAnimationFrame(render);
    }

    render();
}

// Slideshow Controller
let slideIndex = 0;
window.plusSlides = function(n) {
    showSlides(slideIndex += n);
}

function showSlides(n) {
    const slides = document.getElementsByClassName("slide");
    if (!slides.length) return;
    if (n >= slides.length) { slideIndex = 0; }
    if (n < 0) { slideIndex = slides.length - 1; }
    for (let i = 0; i < slides.length; i++) {
        slides[i].classList.remove("active");
    }
    slides[slideIndex].classList.add("active");
}

// Auto-advance slideshow every 5 seconds
setInterval(() => {
    slideIndex++;
    showSlides(slideIndex);
}, 5000);

// Recently Played Tracking & Rendering
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

    recentGrid.innerHTML = recent.map(game => `
        <div class="card" data-game-id="${game.id}">
            <button class="fav-btn" onclick="toggleFavorite(event, '${game.id}')">☆</button>
            <a href="./play.html?src=${encodeURIComponent(game.src)}&id=${game.id}" onclick="trackRecent('${game.title}', '${game.img}', '${game.src}', '${game.id}')" style="text-decoration: none; color: inherit; display: flex; flex-direction: column; flex: 1;">
                <div class="card-img-container"><img src="${game.img}" alt="${game.title}"></div>
                <div class="card-title">${game.title}</div>
            </a>
        </div>
    `).join('');
}

// Data Backup & Restore
window.exportSaveData = function() {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hub-backup.json';
    a.click();
};

window.importSaveData = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            for (const key in data) {
                localStorage.setItem(key, data[key]);
            }
            alert('Save data restored successfully!');
            location.reload();
        } catch (err) {
            alert('Invalid backup file.');
        }
    };
    reader.readAsText(file);
};
