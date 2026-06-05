import { CONFIG, State } from './globals.js';
import { AuthManager } from './auth.js';

export const ProfileManager = {
    pendingAvatar: "",

    init: () => {
        window.openUpdateDetailsModal = ProfileManager.openDetailsModal;
        window.openProfilePicModal = ProfileManager.openAvatarModal;
        window.openChangePasswordModal = ProfileManager.openPasswordModal;
        window.closeProfileModals = ProfileManager.closeAllModals;

        document.getElementById('detailsForm')?.addEventListener('submit', ProfileManager.saveDetails);
        document.getElementById('passwordForm')?.addEventListener('submit', ProfileManager.savePassword);
        document.getElementById('avatarForm')?.addEventListener('submit', ProfileManager.saveAvatar);
        
        document.getElementById('modalAvatarInput')?.addEventListener('change', ProfileManager.handleImageSelection);

        ProfileManager.syncUI();
    },

    syncUI: () => {
        if (State.currentUser) {
            const mAvatar = document.getElementById('menuAvatar');
            const mName = document.getElementById('menuName');
            const mEmail = document.getElementById('menuEmail');
            const mContact = document.getElementById('menuContact');
            
            if(mAvatar) mAvatar.src = State.currentUser.avatar || '';
            if(mName) mName.innerText = State.currentUser.name || State.currentUser.username || 'User';
            if(mEmail) mEmail.innerText = State.currentUser.email || 'No email provided';
            if(mContact) mContact.innerText = State.currentUser.contact || 'No contact provided';
        }
    },

    openDetailsModal: () => {
        document.getElementById('detailsName').value = State.currentUser?.name || '';
        document.getElementById('detailsUser').value = State.currentUser?.username || '';
        document.getElementById('detailsEmail').value = State.currentUser?.email || '';
        document.getElementById('detailsContact').value = State.currentUser?.contact || '';
        
        const modal = document.getElementById('detailsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    openAvatarModal: () => {
        document.getElementById('modalAvatarPreview').src = State.currentUser?.avatar || '';
        document.getElementById('modalAvatarInput').value = '';
        document.getElementById('avatarPass').value = '';
        ProfileManager.pendingAvatar = '';
        
        const modal = document.getElementById('avatarModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    openPasswordModal: () => {
        document.getElementById('passwordForm').reset();
        
        const modal = document.getElementById('passwordModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    closeAllModals: () => {
        ['detailsModal', 'avatarModal', 'passwordModal'].forEach(id => {
            const el = document.getElementById(id);
            if(el) {
                el.classList.add('hidden');
                el.classList.remove('flex');
            }
        });
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
                document.getElementById('modalAvatarPreview').src = ProfileManager.pendingAvatar;
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    },

    saveDetails: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('detailsBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        const payload = {
            action: 'update_details',
            id: State.currentUser.id,
            name: document.getElementById('detailsName').value,
            username: document.getElementById('detailsUser').value,
            email: document.getElementById('detailsEmail').value,
            contact: document.getElementById('detailsContact').value
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, { method: 'POST', body: JSON.stringify(payload) });
            const data = await res.json();
            
            if (data.status === 'success') {
                State.currentUser.name = payload.name;
                State.currentUser.username = payload.username;
                State.currentUser.email = payload.email;
                State.currentUser.contact = payload.contact;
                
                localStorage.setItem('teachingPortalUser', JSON.stringify(State.currentUser));
                if (AuthManager.updateUI) AuthManager.updateUI();
                ProfileManager.syncUI();
                
                ProfileManager.closeAllModals();
                alert("Profile details updated successfully!");
            } else { 
                alert("Error updating details: " + (data.message || 'Unknown error')); 
            }
        } catch (error) { 
            alert("Connection error while updating details.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    savePassword: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('passwordBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        const payload = {
            action: 'update_password',
            id: State.currentUser.id,
            currentPassword: document.getElementById('passCurrent').value,
            newPassword: document.getElementById('passNew').value
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, { method: 'POST', body: JSON.stringify(payload) });
            const data = await res.json();
            
            if (data.status === 'success') {
                ProfileManager.closeAllModals();
                alert("Password changed successfully!");
            } else { 
                alert("Error: " + (data.message || 'Incorrect current password')); 
            }
        } catch (error) { 
            alert("Connection error while updating password.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    saveAvatar: async (e) => {
        e.preventDefault();
        if (!ProfileManager.pendingAvatar) {
            return alert("Please choose a photo to upload.");
        }

        const pass = document.getElementById('avatarPass').value;
        const btn = document.getElementById('avatarBtn');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        btn.disabled = true;

        const payload = {
            action: 'update_avatar',
            id: State.currentUser.id,
            avatar: ProfileManager.pendingAvatar,
            password: pass
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, { method: 'POST', body: JSON.stringify(payload) });
            const data = await res.json();
            
            if (data.status === 'success') {
                State.currentUser.avatar = data.newAvatar || ProfileManager.pendingAvatar;
                
                localStorage.setItem('teachingPortalUser', JSON.stringify(State.currentUser));
                
                if (AuthManager.updateUI) AuthManager.updateUI();
                ProfileManager.syncUI();
                
                ProfileManager.closeAllModals();
                alert("Profile picture uploaded successfully!");
            } else { 
                alert("Error: " + (data.message || 'Incorrect password')); 
            }
        } catch (error) { 
            alert("Connection error while uploading avatar.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
