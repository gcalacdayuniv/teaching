// js/app.js
import { injectComponents } from './components.js';
import { AppRouter } from './router.js';
import { AuthManager } from './auth.js';
import { LoggerManager } from './hours-logger.js';
import { RecordsManager } from './records-viewer.js';
import { LedgerManager } from './payment-ledger.js';
import { ProfileManager } from './profile.js';

initApp();

function initApp() {
    try {
        // 1. Inject HTML into the DOM first
        injectComponents();

        // 2. Setup Global UI Logic (FAB & Menus)
        setupUI();

        // 3. Initialize all modular domains
        AuthManager.init();
        AppRouter.init();
        LoggerManager.init();
        RecordsManager.init();
        LedgerManager.init();
        ProfileManager.init();
        
        console.log("Teaching Portal Modular Architecture Loaded Successfully");
    } catch (error) {
        console.error("Critical Failure during App Initialization:", error);
    }
}

function setupUI() {
    // ----------------------------------------------------
    // Global UI Functions (Attached to window for HTML events)
    // ----------------------------------------------------
    
    window.toggleFAB = function() {
        const fabMenu = document.getElementById('fabMenu');
        const fabIcon = document.getElementById('fabIcon');
        
        if (fabMenu.classList.contains('hidden')) {
            fabMenu.classList.remove('hidden');
            fabMenu.classList.add('flex');
            fabIcon.style.transform = 'rotate(45deg)'; // Turns '+' into 'X'
        } else {
            fabMenu.classList.add('hidden');
            fabMenu.classList.remove('flex');
            fabIcon.style.transform = 'rotate(0deg)';
        }
    };

    window.toggleAccountMenu = function() {
        const menu = document.getElementById('accountMenu');
        const backdrop = document.getElementById('menuBackdrop');
        
        if (menu.classList.contains('translate-x-full')) {
            menu.classList.remove('translate-x-full');
            backdrop.classList.remove('hidden');
            // Sync avatar in case AuthManager missed it
            if(window.ProfileManager && window.ProfileManager.syncUI) {
                window.ProfileManager.syncUI();
            }
        } else {
            menu.classList.add('translate-x-full');
            backdrop.classList.add('hidden');
        }
    };

    window.closeAllMenus = function() {
        const accountMenu = document.getElementById('accountMenu');
        const backdrop = document.getElementById('menuBackdrop');
        const fabMenu = document.getElementById('fabMenu');
        const fabIcon = document.getElementById('fabIcon');
        
        if (accountMenu && !accountMenu.classList.contains('translate-x-full')) {
            accountMenu.classList.add('translate-x-full');
        }
        if (backdrop) backdrop.classList.add('hidden');
        
        if (fabMenu && !fabMenu.classList.contains('hidden')) {
            fabMenu.classList.add('hidden');
            fabMenu.classList.remove('flex');
            if (fabIcon) fabIcon.style.transform = 'rotate(0deg)';
        }
        
        // Make sure all profile modals close when navigating away or closing menus
        if (window.closeProfileModals) {
            window.closeProfileModals();
        }
    };

    window.openResourceModal = function() {
        const modal = document.getElementById('resourceModal');
        if (modal) {
            document.getElementById('resourceForm').reset();
            document.getElementById('resourceId').value = '';
            document.getElementById('resourceModalTitle').textContent = 'Add Link';
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    };

    // Style active tab in bottom navigation dynamically
    window.addEventListener('hashchange', () => {
        const currentHash = window.location.hash;
        document.querySelectorAll('.menu-link').forEach(link => {
            if (link.getAttribute('href') === currentHash) {
                link.classList.add('bg-blue-100', 'text-blue-700');
                link.classList.remove('text-gray-500');
            } else {
                link.classList.remove('bg-blue-100', 'text-blue-700');
                link.classList.add('text-gray-500');
            }
        });
        
        // Ensure FAB and modals close when navigating
        window.closeAllMenus();
    });
}
