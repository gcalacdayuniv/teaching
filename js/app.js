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
        injectComponents();
        setupSidebar();
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

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');

    if (!sidebar || !overlay || !toggleBtn) return;

    const toggle = () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    };

    toggleBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', toggle);
    });
}
