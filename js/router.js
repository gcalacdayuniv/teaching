// js/router.js
import { fetchRecords } from './records-viewer.js';

export const AppRouter = {
    init() {
        window.addEventListener('hashchange', this.handleRoute.bind(this));
        
        window.navigateTo = (hash) => {
            window.location.hash = hash;
        };

        // Boot router immediately
        this.handleRoute();
    },

    handleRoute() {
        const hash = window.location.hash || '#/records';
        
        // Safe check matching your original globals.js logic
        const isLoggedIn = !!localStorage.getItem('teachingPortalUser');

        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('flex', 'flex-col', 'block');
        });

        if (!isLoggedIn) {
            const loginScreen = document.getElementById('loginScreen');
            const appShell = document.getElementById('app-shell');
            if (loginScreen) {
                loginScreen.classList.remove('hidden');
                loginScreen.classList.add('flex');
            }
            if (appShell) {
                appShell.classList.add('hidden');
                appShell.classList.remove('flex');
            }
            return;
        }

        if (hash === '#/log') {
            document.getElementById('logPanel').classList.remove('hidden');
            document.getElementById('logPanel').classList.add('block');
            document.getElementById('appTitle').textContent = 'Log Session';
        } 
        else if (hash === '#/records') {
            const panel = document.getElementById('viewPanel');
            panel.classList.remove('hidden');
            panel.classList.add('flex');
            document.getElementById('appTitle').textContent = 'Records';
            
            // Auto-fetch data safely
            if (typeof fetchRecords === 'function') fetchRecords();
        } 
        else if (hash === '#/resources') {
            const panel = document.getElementById('resourcePanel');
            panel.classList.remove('hidden');
            panel.classList.add('block');
            document.getElementById('appTitle').textContent = 'Resources';
        } 
        else if (hash === '#/profile') {
            document.getElementById('profilePanel').classList.remove('hidden');
            document.getElementById('profilePanel').classList.add('block');
            document.getElementById('appTitle').textContent = 'Profile';
        } 
        else {
            document.getElementById('welcomePanel').classList.remove('hidden');
            document.getElementById('welcomePanel').classList.add('flex');
            document.getElementById('appTitle').textContent = 'Teaching Portal';
        }

        if (typeof window.closeAllMenus === 'function') window.closeAllMenus();
    }
};
