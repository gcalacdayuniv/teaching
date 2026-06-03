// app.js
import { injectComponents } from './components.js';
import { AppRouter } from './router.js';
import { AuthManager } from './auth.js';
import { LoggerManager } from './hours-logger.js';
import { RecordsManager } from './records-viewer.js';
import { LedgerManager } from './payment-ledger.js';
import { ProfileManager } from './profile.js';

// Because <script type="module"> defers execution automatically,
// the DOM is already ready by the time this file runs. 
// We execute initialization immediately.
initApp();

function initApp() {
    try {
        // 1. Inject HTML into the DOM first
        injectComponents();

        // 2. Setup standard UI logic (Sidebar)
        setupSidebar();

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

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('toggle-sidebar-btn');

    // Safety check just in case the HTML didn't load
    if (!sidebar || !overlay || !toggleBtn) {
        console.error("Sidebar elements missing from the DOM.");
        return;
    }

    const toggle = () => {
        sidebar.classList.toggle('-translate-x-full');
        overlay.classList.toggle('hidden');
    };

    toggleBtn.addEventListener('click', toggle);
    overlay.addEventListener('click', toggle);

    // Close sidebar on navigation click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', toggle);
    });
}
