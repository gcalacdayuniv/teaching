import { CONFIG, State } from './globals.js';

export const AuthManager = {
    init: () => {
        AuthManager.checkSession();
        document.getElementById('loginForm').addEventListener('submit', AuthManager.handleLogin);
        document.getElementById('logout-btn').addEventListener('click', AuthManager.logout);
    },

    checkSession: () => {
        const storedUser = localStorage.getItem('teachingPortalUser');
        if (storedUser) {
            State.currentUser = JSON.parse(storedUser);
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('hidden');
            document.getElementById('app-shell').classList.add('flex');
            AuthManager.updateUI();
        } else {
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('app-shell').classList.add('hidden');
        }
    },

    updateUI: () => {
        if (!State.currentUser) return;
        const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(State.currentUser.name)}&background=1e3a8a&color=fff`;
        const avatarUrl = State.currentUser.avatar || fallback;
        
        document.getElementById('navUserName').innerText = State.currentUser.name;
        document.getElementById('navAvatar').src = avatarUrl;
        
        const welcomeName = document.getElementById('welcomeName');
        const welcomeAvatar = document.getElementById('welcomeAvatar');
        if (welcomeName) welcomeName.innerText = State.currentUser.name;
        if (welcomeAvatar) welcomeAvatar.src = avatarUrl;
        
        const profName = document.getElementById('profName');
        const profPreview = document.getElementById('profAvatarPreview');
        if (profName) profName.value = State.currentUser.name;
        if (profPreview) {
            profPreview.src = avatarUrl;
            profPreview.classList.remove('hidden');
        }
    },

    handleLogin: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginBtn');
        const err = document.getElementById('loginError');
        btn.disabled = true; btn.innerText = "Verifying..."; err.classList.add('hidden');
        
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`;
            const res = await fetch(url, { 
                method: 'POST', 
                body: JSON.stringify({ 
                    action: 'login', 
                    username: document.getElementById('loginUser').value, 
                    password: document.getElementById('loginPass').value 
                }) 
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                localStorage.setItem('teachingPortalUser', JSON.stringify(data.user));
                AuthManager.checkSession();
            } else {
                err.innerText = "Invalid Username or Password"; err.classList.remove('hidden');
            }
        } catch (error) {
            err.innerText = "Connection error. Ensure Cloudflare Worker is running."; err.classList.remove('hidden');
        }
        btn.disabled = false; btn.innerText = "Sign In";
    },

    logout: () => {
        localStorage.removeItem('teachingPortalUser');
        State.currentUser = null;
        document.getElementById('loginForm').reset();
        window.location.hash = '#/welcome';
        AuthManager.checkSession();
    }
};