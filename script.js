document.addEventListener("DOMContentLoaded", () => {
    // Search filter logic for games.html
    const searchBar = document.getElementById("searchBar");
    if (searchBar) {
        searchBar.addEventListener("input", (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll("#gamesGrid .card");
            cards.forEach(card => {
                const title = card.querySelector(".card-title").textContent.toLowerCase();
                card.style.display = title.includes(term) ? "block" : "none";
            });
        });
    }

    // Dynamic game loader for play.html
    const gameFrame = document.getElementById("gameFrame");
    const gameTitle = document.getElementById("gameTitle");
    if (gameFrame && gameTitle) {
        const params = new URLSearchParams(window.location.search);
        const gameId = params.get("game");
        
        const gameData = {
            "retro-bowl": { title: "Retro Bowl", url: "https://retrobowl.me" },
            "slope": { title: "Slope", url: "https://slope-game.github.io" },
            "cookie-clicker": { title: "Cookie Clicker", url: "https://orteil.dashnet.org/cookieclicker/" },
            "1v1-lol": { title: "1v1.lol", url: "https://1v1.lol" },
            "core-ball": { title: "Core Ball", url: "https://html5.gamedistribution.com/" },
            "paper-io-2": { title: "Paper.io 2", url: "https://paper-io.com/" }
        };

        if (gameId && gameData[gameId]) {
            gameTitle.textContent = gameData[gameId].title;
            gameFrame.src = gameData[gameId].url;
        } else {
            gameTitle.textContent = "Game Not Found";
        }
    }

    // Fullscreen toggle handler
    const fullscreenBtn = document.getElementById("fullscreenBtn");
    if (fullscreenBtn && gameFrame) {
        fullscreenBtn.addEventListener("click", () => {
            if (gameFrame.requestFullscreen) {
                gameFrame.requestFullscreen();
            } else if (gameFrame.webkitRequestFullscreen) {
                gameFrame.webkitRequestFullscreen();
            }
        });
    }

    // About:Blank tab cloaker
    const cloakBtn = document.getElementById("cloakBtn");
    if (cloakBtn) {
        cloakBtn.addEventListener("click", () => {
            const win = window.open();
            win.document.write(`
                <!DOCTYPE html>
                <html>
                <head><title>Classes</title></head>
                <body style="margin:0;padding:0;overflow:hidden;">
                    <iframe src="${window.location.origin}/index.html" style="width:100vw;height:100vh;border:none;"></iframe>
                </body>
                </html>
            `);
        });
    }
});
