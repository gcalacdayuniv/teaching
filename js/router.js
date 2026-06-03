// router.js
import { initResources } from './resources.js';

export const AppRouter = {
    init: () => {
        window.addEventListener('hashchange', AppRouter.handleRoute);
        // Default route
        if (!window.location.hash) {
            window.location.hash = '#/welcome';
        } else {
            AppRouter.handleRoute();
        }
    },

    handleRoute: () => {
        const path = window.location.hash || '#/welcome';
        
        // Hide all views
        document.querySelectorAll('.app-view').forEach(view => {
            view.classList.add('hidden');
            view.classList.remove('flex'); // Remove flex if it exists
        });

        // Map routes to DOM IDs
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
            // View Panel and Welcome panel require flexbox for layout
            if (targetId === 'viewPanel' || targetId === 'welcomePanel') {
                targetElement.classList.add('flex');
            }
        }

        // Trigger specific logic based on route
        if (targetId === 'resourcePanel') {
            initResources(); // Fetch resources only when panel is opened
        }
    }
};