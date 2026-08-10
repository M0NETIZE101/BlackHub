// ============================================
// MoviesAndSeriesHub - Social Functions
// ============================================

// ----- Setup Social Links -----
function setupSocialLinks() {
    document.querySelectorAll('.social-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var platform = this.dataset.platform || 'social';
            showCreatorPopup(platform);
        });
    });
}

// ----- Show Creator Popup -----
function showCreatorPopup(platform) {
    var existingPopup = document.querySelector('.social-popup');
    if (existingPopup) existingPopup.remove();

    var creatorData = {
        'instagram': {
            name: 'Foodgasm Nepal',
            handle: '@foodgasm__nepal',
            url: 'https://www.instagram.com/foodgasm__nepal/',
            emoji: '📸',
            description: 'A passionate food explorer from Nepal, sharing the vibrant and diverse flavors of Nepali cuisine. From street-side momos to traditional Newari feasts, Foodgasm Nepal takes you on a delicious journey through the heart of the Himalayas.',
            extra: 'Follow for daily food inspiration and authentic taste of Nepal! 🍜'
        },
        'youtube': {
            name: 'Nischaya KC',
            handle: '@NischayaKC356',
            url: 'https://www.youtube.com/@NischayaKC356',
            emoji: '🎬',
            description: 'A rising content creator from Nepal, Nischaya KC brings engaging and entertaining videos to YouTube. With a passion for storytelling and connecting with audiences, the channel offers a mix of lifestyle, vlogs, and creative content that resonates with viewers.',
            extra: 'Subscribe for exciting content and a glimpse into Nepali creativity! 🇳🇵'
        },
        'facebook': {
            name: 'Creative Nepal',
            handle: '@creative.nepal',
            url: '#',
            emoji: '👍',
            description: 'A community celebrating Nepali art, culture, and creativity. Showcasing talented artists, musicians, and creators from all across Nepal.',
            extra: 'Join the community and support Nepali talent! 🎨'
        },
        'twitter': {
            name: 'Nepal Tech Hub',
            handle: '@nepaltechhub',
            url: '#',
            emoji: '🐦',
            description: 'A hub for tech enthusiasts and innovators in Nepal. Sharing news, updates, and insights about the growing tech scene in the Himalayas.',
            extra: 'Follow for tech updates and innovation! 💻'
        }
    };

    var data = creatorData[platform] || {
        name: 'Amazing Creator',
        handle: '@creator',
        url: '#',
        emoji: '❤️',
        description: 'A talented individual making the internet a more creative and inspiring place.',
        extra: 'Support and follow their journey!'
    };

    var popup = document.createElement('div');
    popup.className = 'social-popup';
    popup.innerHTML = `
        <div class="social-popup-content">
            <button class="social-popup-close" onclick="this.closest('.social-popup').remove()">
                <i class="fas fa-times"></i>
            </button>
            <div class="social-popup-icon">${data.emoji}</div>
            <h2>Support ${data.name}</h2>
            <p><strong>${data.handle}</strong></p>
            <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7; margin: 12px 0;">
                ${data.description}
            </p>
            <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                ${data.extra}
            </p>
            <a href="${data.url}" target="_blank" rel="noopener noreferrer" 
               style="display: inline-block; padding: 10px 28px; background: var(--primary); color: #fff; 
                      border-radius: 8px; text-decoration: none; font-weight: 600; transition: var(--transition);">
                <i class="fas fa-external-link-alt"></i> Follow ${data.name}
            </a>
        </div>
    `;

    document.body.appendChild(popup);

    setTimeout(function() {
        if (popup.parentNode) {
            popup.style.opacity = '0';
            popup.style.transform = 'scale(0.8)';
            popup.style.transition = 'all 0.3s ease';
            setTimeout(function() {
                if (popup.parentNode) popup.remove();
            }, 300);
        }
    }, 8000);

    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.remove();
        }
    });
}