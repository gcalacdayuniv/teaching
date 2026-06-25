import { CONFIG, State } from './globals.js';
import { AuthManager } from './auth.js';

export const ProfileManager = {
    pendingAvatar: "",

    init: () => {
        window.openUpdateDetailsModal = ProfileManager.openDetailsModal;
        window.openProfilePicModal = ProfileManager.openAvatarModal;
        window.openChangePasswordModal = ProfileManager.openPasswordModal;
        
        // ADDED: Global bindings for Import DB
        window.openImportDbModal = ProfileManager.openImportDbModal;
        window.deleteImportedDb = ProfileManager.deleteImportedDb;
        window.closeProfileModals = ProfileManager.closeAllModals;

        document.getElementById('detailsForm')?.addEventListener('submit', ProfileManager.saveDetails);
        document.getElementById('passwordForm')?.addEventListener('submit', ProfileManager.savePassword);
        document.getElementById('avatarForm')?.addEventListener('submit', ProfileManager.saveAvatar);
        
        // ADDED: Listener for the Import DB Form
        document.getElementById('addImportDbForm')?.addEventListener('submit', ProfileManager.addImportedDb);
        
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
        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    openAvatarModal: () => {
        document.getElementById('modalAvatarPreview').src = State.currentUser?.avatar || '';
        document.getElementById('modalAvatarInput').value = '';
        document.getElementById('avatarPass').value = '';
        ProfileManager.pendingAvatar = '';
        
        const modal = document.getElementById('avatarModal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    openPasswordModal: () => {
        document.getElementById('passwordForm')?.reset();
        
        const modal = document.getElementById('passwordModal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    // ADDED: Function to open DB Modal and load the list
    openImportDbModal: () => {
        ProfileManager.loadImportedDbs();
        const modal = document.getElementById('importDbModal');
        if(modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },

    closeAllModals: () => {
        // ADDED: 'importDbModal' to the array of modals to close
        ['detailsModal', 'avatarModal', 'passwordModal', 'importDbModal'].forEach(id => {
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
    },

    // ADDED: Function to fetch existing DBs from worker
    loadImportedDbs: async () => {
        const listContainer = document.getElementById('importedDbList');
        if (!listContainer) return;
        
        listContainer.innerHTML = '<div class="text-center text-sm text-gray-500 py-4"><i class="fas fa-spinner fa-spin"></i> Loading databases...</div>';
        
        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'get_imported_dbs', userId: State.currentUser.id }) 
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                if (data.databases.length === 0) {
                    listContainer.innerHTML = '<div class="text-center text-xs text-gray-400 py-3">No imported databases yet.</div>';
                    return;
                }
                
                listContainer.innerHTML = data.databases.map(db => `
                    <div class="flex justify-between items-center p-3 border border-gray-100 rounded-lg bg-gray-50">
                        <div class="flex-1 min-w-0 pr-3">
                            <p class="text-sm font-bold text-gray-800 truncate">${db.Project_Name}</p>
                            <p class="text-xs text-gray-500 truncate">${db.API_URL}</p>
                        </div>
                        <button onclick="window.deleteImportedDb('${db.ID}')" class="text-red-500 hover:bg-red-50 rounded p-2 shrink-0 transition">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `).join('');
            } else {
                listContainer.innerHTML = '<div class="text-center text-xs text-red-400 py-3">Failed to load databases.</div>';
            }
        } catch (error) {
            listContainer.innerHTML = '<div class="text-center text-xs text-red-400 py-3">Connection error.</div>';
        }
    },

    // ADDED: Function to submit the new DB
    addImportedDb: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('addImportDbBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        btn.disabled = true;

        const payload = {
            action: 'add_imported_db',
            userId: State.currentUser.id, // Fixed parameter name
            projectName: document.getElementById('importDbName').value,
            apiUrl: document.getElementById('importDbUrl').value
        };

        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, { 
                method: 'POST', 
                body: JSON.stringify(payload) 
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                document.getElementById('addImportDbForm').reset();
                ProfileManager.loadImportedDbs();
            } else { 
                alert("Error adding database: " + (data.message || 'Unknown error')); 
            }
        } catch (error) { 
            alert("Connection error while adding database.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    // ADDED: Function to delete a database
    deleteImportedDb: async (dbId) => {
        if (!confirm("Are you sure you want to remove this imported database?")) return;
        
        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, { 
                method: 'POST', 
                body: JSON.stringify({ action: 'remove_imported_db', userId: State.currentUser.id, dbId: dbId }) 
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                ProfileManager.loadImportedDbs();
            } else { 
                alert("Error removing database: " + (data.message || 'Unknown error')); 
            }
        } catch (error) { 
            alert("Connection error while removing database.");
        }
    }
};
