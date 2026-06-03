import { initResources } from './resources.js';

export const AppRouter = {
    init: () => {
        window.addEventListener('hashchange', AppRouter.handleRoute);
        if (!window.location.hash) {
            window.location.hash = '#/welcome';
        } else {
            AppRouter.handleRoute();
        }
    },

    handleRoute: () => {
        const path = window.location.hash || '#/welcome';
        
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('flex'); 
        });

        const routes = {
            '#/welcome': 'welcomePanel',
            '#/log': 'logPanel',
            '#/records': 'viewPanel',
            '#/resources': 'resourcePanel',
            '#/profile': 'profilePanel'
        };

        const targetId = routes[path] || 'welcomePanel';
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.classList.remove('hidden');
            if (targetId === 'viewPanel' || targetId === 'welcomePanel') {
                targetElement.classList.add('flex');
            }
        }

        if (targetId === 'resourcePanel') {
            initResources(); 
        }
    }
};