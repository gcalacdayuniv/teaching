// js/router.js
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
            '#/finance': 'financePanel',
            '#/resources': 'resourcePanel',
            '#/pdf': 'pdfPanel',
            '#/profile': 'profilePanel'
        };

        const targetId = routes[path] || 'welcomePanel';
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.classList.remove('hidden');
            if (targetId === 'viewPanel' || targetId === 'welcomePanel' || targetId === 'financePanel' || targetId === 'pdfPanel') {
                targetElement.classList.add('flex');
            }
        }

        if (targetId === 'resourcePanel') {
            initResources(); 
        }
        
        if (targetId === 'financePanel' && window.FinanceManager) {
            window.FinanceManager.refreshLedger();
        }
    }
};
