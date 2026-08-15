// --- Like / Dislike System ---
export function handleRating(gameId, type, buttonElement) {
    // Stop link navigation if clicking inside a card
    if(event) event.preventDefault();

    let ratings = JSON.parse(localStorage.getItem('gameRatings')) || {};
    
    // Initialize if this game doesn't exist yet
    if (!ratings[gameId]) {
        ratings[gameId] = { likes: 0, dislikes: 0, userVote: null };
    }

    const gameData = ratings[gameId];
    
    // Toggle logic
    if (type === 'like') {
        if (gameData.userVote === 'like') {
            gameData.likes--;
            gameData.userVote = null;
        } else {
            gameData.likes++;
            if (gameData.userVote === 'dislike') gameData.dislikes--;
            gameData.userVote = 'like';
        }
    } else if (type === 'dislike') {
        if (gameData.userVote === 'dislike') {
            gameData.dislikes--;
            gameData.userVote = null;
        } else {
            gameData.dislikes++;
            if (gameData.userVote === 'like') gameData.likes--;
            gameData.userVote = 'dislike';
        }
    }

    // Save back to storage
    localStorage.setItem('gameRatings', JSON.stringify(ratings));

    // Update the UI for this specific card
    updateRatingUI(gameId, buttonElement.closest('.card-actions'));
}

export function updateRatingUI(gameId, containerElement) {
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

// Function to initialize all ratings on page load
export function initAllRatings() {
    document.querySelectorAll('.card-actions').forEach(container => {
        const gameId = container.getAttribute('data-game-id');
        if (gameId) {
            updateRatingUI(gameId, container);
        }
    });
}

// Add this to your DOMContentLoaded event listener at the top of script.js:
// initAllRatings();

// Add to your window bindings at the bottom of script.js:
window.handleRating = handleRating;
