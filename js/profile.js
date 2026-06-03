// js/profile.js
import { CONFIG, State } from './globals.js';
import { updateUI } from './auth.js';

export function initProfile() {
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        // Clone and replace to prevent duplicate listeners if re-initialized
        const newForm = profileForm.cloneNode(true);
        profileForm.parentNode.replaceChild(newForm, profileForm);
        newForm.addEventListener('submit', handleProfileUpdate);
    }

    const avatarInput = document.getElementById('profAvatarInput');
    if (avatarInput) {
        avatarInput.addEventListener('change', handleAvatarPreview);
    }
}

function handleAvatarPreview(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const preview = document.getElementById('profAvatarPreview');
        if (preview) {
            preview.src = event.target.result;
            preview.classList.remove('hidden');
        }
    };
    reader.readAsDataURL(file);
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    if (!State.currentUser) return;

    const btn = document.getElementById('profBtn');
    const status = document.getElementById('profStatus');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
    if (status) status.classList.add('hidden');

    const newName = document.getElementById('profName').value.trim();
    const newPass = document.getElementById('profPass').value.trim();
    const avatarInput = document.getElementById('profAvatarInput');
    
    let avatarBase64 = State.currentUser.avatar || '';

    // Process new avatar if uploaded
    if (avatarInput && avatarInput.files.length > 0) {
        try {
            avatarBase64 = await compressImage(avatarInput.files[0]);
        } catch (err) {
            showStatus('Error processing image. Try a smaller file.', 'error');
            btn.innerHTML = originalText;
            btn.disabled = false;
            return;
        }
    }

    const payload = {
        action: 'update_profile',
        user_id: State.currentUser.User_ID,
        name: newName,
        avatar: avatarBase64
    };
    
    // Only send password if user typed a new one
    if (newPass) {
        payload.password = newPass;
    }

    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION || CONFIG.ENDPOINTS.ACTION}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success || result.status === 'success') {
            // Update local state
            State.currentUser.name = newName;
            State.currentUser.avatar = avatarBase64;
            localStorage.setItem('teachingPortalUser', JSON.stringify(State.currentUser));
            
            // Sync all names/avatars across the UI
            if (typeof updateUI === 'function') updateUI(); 
            
            document.getElementById('profPass').value = ''; // Clear password field
            showStatus('Profile updated successfully!', 'success');
        } else {
            showStatus(result.message || 'Failed to update profile.', 'error');
        }
    } catch (error) {
        showStatus('Network error. Please try again.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function showStatus(msg, type) {
    const status = document.getElementById('profStatus');
    if (!status) return;
    status.textContent = msg;
    status.className = `text-center text-sm mt-3 block font-bold ${type === 'error' ? 'text-red-500' : 'text-emerald-500'}`;
}

// Helper: HTML5 Canvas Image Compression to keep D1 Database small
function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = event => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 150;
                const MAX_HEIGHT = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                // Compress to 70% quality JPEG
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
            img.onerror = error => reject(error);
        };
        reader.onerror = error => reject(error);
    });
}
