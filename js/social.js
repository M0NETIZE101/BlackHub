// ============================================
// MoviesAndSeriesHub - Social Functions (Simplified)
// ============================================

// ----- Setup Social Links (Thank You Popup) -----
function setupSocialLinks() {
    document.querySelectorAll('.social-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            showThankYouPopup();
        });
    });
}

// ----- Show Thank You Popup -----
function showThankYouPopup() {
    var existingPopup = document.querySelector('.social-popup');
    if (existingPopup) existingPopup.remove();

    var popup = document.createElement('div');
    popup.className = 'social-popup';
    popup.innerHTML = `
        <div class="social-popup-content">
            <button class="social-popup-close" onclick="this.closest('.social-popup').remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="social-popup-icon">❤️</div>
            <h2>Thank You!</h2>
            <p>Thank you for your generosity!</p>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 12px;">
                You've made our day! 🎉
            </p>
        </div>
    `;

    document.body.appendChild(popup);

    // Auto-close after 5 seconds
    setTimeout(function() {
        if (popup.parentNode) {
            popup.style.opacity = '0';
            popup.style.transform = 'scale(0.8)';
            popup.style.transition = 'all 0.3s ease';
            setTimeout(function() {
                if (popup.parentNode) popup.remove();
            }, 300);
        }
    }, 5000);

    // Close on click outside
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}