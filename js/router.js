// js/router.js
import { AuthManager } from './auth.js';
import { ResourcesManager } from './resources.js';
import { RecordsManager } from './records-viewer.js';

export const AppRouter = {
    init() {
        // Listen for navigation changes
        window.addEventListener('hashchange', this.handleRoute.bind(this));
        window.addEventListener('load', this.handleRoute.bind(this));
        
        // Expose a global navigation helper for the HTML onclick events
        window.navigateTo = (hash) => {
            window.location.hash = hash;
        };
    },

    handleRoute() {
        const hash = window.location.hash || '#/records';
        const isLoggedIn = AuthManager.isLoggedIn();

        // 1. Hide all views first
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('flex', 'flex-col'); // Remove display classes
        });

        // 2. Authentication Route Guard
        if (!isLoggedIn) {
            document.getElementById('loginScreen').classList.remove('hidden');
            document.getElementById('loginScreen').classList.add('flex');
            document.getElementById('app-shell').classList.add('hidden');
            document.getElementById('app-shell').classList.remove('flex');
            return;
        } else {
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('loginScreen').classList.remove('flex');
            document.getElementById('app-shell').classList.remove('hidden');
            document.getElementById('app-shell').classList.add('flex');
        }

        // 3. Route matching & View Toggling
        if (hash === '#/log') {
            document.getElementById('logPanel').classList.remove('hidden');
            document.getElementById('logPanel').classList.add('block'); // or flex based on your layout
            document.getElementById('appTitle').textContent = 'Log Session';
        } 
        else if (hash === '#/records') {
            const panel = document.getElementById('viewPanel');
            panel.classList.remove('hidden');
            panel.classList.add('flex'); // Uses flex-col in components.js
            document.getElementById('appTitle').textContent = 'Records';
            
            // Auto-fetch fresh data when opening tab
            if (typeof RecordsManager !== 'undefined') {
                RecordsManager.fetchRecords();
            }
        } 
        else if (hash === '#/resources') {
            const panel = document.getElementById('resourcePanel');
            panel.classList.remove('hidden');
            panel.classList.add('block');
            document.getElementById('appTitle').textContent = 'Resources';
            
            // Auto-fetch fresh data when opening tab
            if (typeof ResourcesManager !== 'undefined') {
                ResourcesManager.fetchResources();
            }
        } 
        else if (hash === '#/profile') {
            document.getElementById('profilePanel').classList.remove('hidden');
            document.getElementById('profilePanel').classList.add('block');
            document.getElementById('appTitle').textContent = 'Profile';
        } 
        else {
            // Default fallback / welcome
            document.getElementById('welcomePanel').classList.remove('hidden');
            document.getElementById('welcomePanel').classList.add('flex');
            document.getElementById('appTitle').textContent = 'Teaching Portal';
        }

        // Ensure slide-out menus close on navigation
        if (typeof window.closeAllMenus === 'function') {
            window.closeAllMenus();
        }
    }
};
