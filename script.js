document.addEventListener('DOMContentLoaded', () => {
    // Load saved settings
    const savedColor = localStorage.getItem('borderColor') || '#4CAF50';
    const savedPos = localStorage.getItem('sidebarPos') || 'sidebar-left';
    const savedBg = localStorage.getItem('bgMode') || 'particles';

    document.documentElement.style.setProperty('--border-color', savedColor);
    
    const container = document.getElementById('app-container');
    if (container) container.className = savedPos;

    // Initialize Canvas Background Effect
    initBackground(savedBg, savedColor);

    // Sync input states if on Settings page
    const colorPicker = document.getElementById('color-picker');
    const posSelect = document.getElementById('pos-select');
    const bgSelect = document.getElementById('bg-select');

    if (colorPicker) colorPicker.value = savedColor;
    if (posSelect) posSelect.value = savedPos;
    if (bgSelect) bgSelect.value = savedBg;
});

function updateBorderColor(color) {
    document.documentElement.style.setProperty('--border-color', color);
    localStorage.setItem('borderColor', color);
}

function updateSidebarPos(pos) {
    const container = document.getElementById('app-container');
    container.className = pos;
    localStorage.setItem('sidebarPos', pos);
}

function updateBgMode(mode) {
    localStorage.setItem('bgMode', mode);
    const color = localStorage.getItem('borderColor') || '#4CAF50';
    initBackground(mode, color);
}

/* Interactive Canvas Effects */
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
