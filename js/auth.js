// js/auth.js
import { CONFIG } from './globals.js';

export const AuthManager = {
    init() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
        
        // Expose globally for HTML inline buttons (e.g., the Sign Out button in the slide menu)
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.logout.bind(this));
        }
        
        this.updateUI();
    },
    
    isLoggedIn() {
        return !!localStorage.getItem('teaching_token');
    },
    
    getToken() {
        return localStorage.getItem('teaching_token');
    },
    
    async handleLogin(e) {
        e.preventDefault();
        const user = document.getElementById('loginUser').value;
        const pass = document.getElementById('loginPass').value;
        const btn = document.getElementById('loginBtn');
        const err = document.getElementById('loginError');
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
        btn.disabled = true;
        err.classList.add('hidden');
        
        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.ACTION}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'login', username: user, password: pass })
            });
            
            const result = await res.json();
            
            if (result.success) {
                localStorage.setItem('teaching_token', result.token);
                localStorage.setItem('teaching_user_id', result.user.User_ID);
                localStorage.setItem('teaching_user_name', result.user.Name);
                
                // Store avatar, or empty string if null
                localStorage.setItem('teaching_user_avatar', result.user.Avatar || '');
                
                const form = document.getElementById('loginForm');
                if (form) form.reset();
                
                this.updateUI();
                
                // Trigger route re-check to hide login screen and show app shell
                window.dispatchEvent(new Event('hashchange'));
            } else {
                err.textContent = result.message || "Invalid credentials.";
                err.classList.remove('hidden');
                err.classList.add('block');
            }
        } catch (error) {
            console.error("Login Auth Error:", error);
            err.textContent = "Connection error. Please check your network.";
            err.classList.remove('hidden');
            err.classList.add('block');
        } finally {
            btn.innerHTML = 'Sign In';
            btn.disabled = false;
        }
    },
    
    logout() {
        localStorage.removeItem('teaching_token');
        localStorage.removeItem('teaching_user_id');
        localStorage.removeItem('teaching_user_name');
        localStorage.removeItem('teaching_user_avatar');
        
        if (typeof window.closeAllMenus === 'function') window.closeAllMenus();
        
        // Push user back to default view and trigger router to show login screen
        window.location.hash = '#/records';
        window.dispatchEvent(new Event('hashchange'));
    },
    
    updateUI() {
        if (!this.isLoggedIn()) return;
        
        const name = localStorage.getItem('teaching_user_name') || 'User';
        const avatar = localStorage.getItem('teaching_user_avatar');
        
        // Apply names to HTML elements
        const nameElements = ['welcomeName', 'menuName', 'navUserName'];
        nameElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = name;
        });
        
        // Default transparent/grey user icon if no avatar base64 exists
        const fallbackAvatar = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23ccc"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>';
        const avatarSrc = (avatar && avatar.length > 50) ? avatar : fallbackAvatar;
        
        const avatarElements = ['welcomeAvatar', 'menuAvatar', 'navAvatar'];
        avatarElements.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.src = avatarSrc;
        });
    }
};
