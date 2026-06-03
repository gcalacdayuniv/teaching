// js/auth.js
import { CONFIG, State } from './globals.js';

export const AuthManager = {
    init: () => {
        AuthManager.checkSession();
        
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.addEventListener('submit', AuthManager.handleLogin);
        
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', AuthManager.logout);
    },

    // Used by router.js to guard views
    isLoggedIn: () => {
        return !!localStorage.getItem('teachingPortalUser');
    },

    checkSession: () => {
        const storedUser = localStorage.getItem('teachingPortalUser');
        const loginScreen = document.getElementById('loginScreen');
        const appShell = document.getElementById('app-shell');

        if (storedUser) {
            State.currentUser = JSON.parse(storedUser);
            if (loginScreen) {
                loginScreen.classList.add('hidden');
                loginScreen.classList.remove('flex');
            }
            if (appShell) {
                appShell.classList.remove('hidden');
                appShell.classList.add('flex');
            }
            AuthManager.updateUI();
        } else {
            if (loginScreen) {
                loginScreen.classList.remove('hidden');
                loginScreen.classList.add('flex');
            }
            if (appShell) {
                appShell.classList.add('hidden');
                appShell.classList.remove('flex');
            }
        }
    },

    updateUI: () => {
        if (!State.currentUser) return;
        const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(State.currentUser.name)}&background=1e3a8a&color=fff`;
        const avatarUrl = State.currentUser.avatar || fallback;
        
        const applyText = (id, text) => { const el = document.getElementById(id); if (el) el.innerText = text; };
        const applySrc = (id, src) => { const el = document.getElementById(id); if (el) el.src = src; };

        applyText('navUserName', State.currentUser.name);
        applyText('welcomeName', State.currentUser.name);
        applySrc('navAvatar', avatarUrl);
        applySrc('welcomeAvatar', avatarUrl);
        
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
        
        btn.disabled = true; 
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...'; 
        if (err) err.classList.add('hidden');
        
        try {
            // Fix applied: explicitly use POST_ACTION as defined in globals.js
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`;
            
            const res = await fetch(url, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'login', 
                    username: document.getElementById('loginUser').value, 
                    password: document.getElementById('loginPass').value 
                }) 
            });
            const data = await res.json();
            
            if (data.status === 'success' || data.success) {
                localStorage.setItem('teachingPortalUser', JSON.stringify(data.user));
                
                const form = document.getElementById('loginForm');
                if (form) form.reset();
                
                AuthManager.checkSession();
                window.dispatchEvent(new Event('hashchange')); // Inform router
            } else {
                if (err) {
                    err.innerText = "Invalid Username or Password"; 
                    err.classList.remove('hidden');
                    err.classList.add('block');
                }
            }
        } catch (error) {
            if (err) {
                err.innerText = "Connection error. Ensure backend is running."; 
                err.classList.remove('hidden');
                err.classList.add('block');
            }
        } finally {
            btn.disabled = false; 
            btn.innerText = "Sign In";
        }
    },

    logout: () => {
        localStorage.removeItem('teachingPortalUser');
        State.currentUser = null;
        
        const form = document.getElementById('loginForm');
        if (form) form.reset();
        
        if (typeof window.closeAllMenus === 'function') window.closeAllMenus();
        
        window.location.hash = '#/records'; 
        AuthManager.checkSession();
        window.dispatchEvent(new Event('hashchange'));
    }
};
