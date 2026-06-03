import { CONFIG, State } from './globals.js';
import { AuthManager } from './auth.js';

export const ProfileManager = {
    pendingAvatar: "",

    init: () => {
        document.getElementById('profAvatarInput').addEventListener('change', ProfileManager.handleImageSelection);
        document.getElementById('profileForm').addEventListener('submit', ProfileManager.saveProfile);
    },

    handleImageSelection: (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_SIZE = 200; 
                let width = img.width; let height = img.height;
                if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } } 
                else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
                
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                ProfileManager.pendingAvatar = canvas.toDataURL('image/jpeg', 0.6);
                document.getElementById('profAvatarPreview').src = ProfileManager.pendingAvatar;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    },

    saveProfile: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('profBtn');
        const msg = document.getElementById('profStatus');
        btn.disabled = true; msg.innerText = "Saving changes..."; msg.className = "text-center text-sm text-blue-600 block mt-3";
        
        const payload = { 
            action: 'update_profile', 
            id: State.currentUser.id,
            name: document.getElementById('profName').value, 
            newPassword: document.getElementById('profPass').value, 
            avatar: ProfileManager.pendingAvatar 
        };

        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`;
            const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
            const data = await res.json();
            
            if (data.status === 'success') {
                State.currentUser.name = payload.name;
                if (data.newAvatar) State.currentUser.avatar = data.newAvatar;
                localStorage.setItem('teachingPortalUser', JSON.stringify(State.currentUser));
                
                AuthManager.updateUI(); 
                document.getElementById('profPass').value = ''; 
                document.getElementById('profAvatarInput').value = ''; 
                ProfileManager.pendingAvatar = '';

                msg.innerHTML = '<i class="fas fa-check"></i> Profile Updated!'; 
                msg.className = "text-center text-sm text-green-600 block font-bold mt-3";
                setTimeout(() => { msg.classList.add('hidden') }, 3000);
            } else { 
                msg.innerText = "Error updating profile."; msg.className = "text-center text-sm text-red-600 block font-bold mt-3"; 
            }
        } catch (error) { 
            msg.innerText = "Connection error."; msg.className = "text-center text-sm text-red-600 block font-bold mt-3"; 
        }
        btn.disabled = false;
    }
};