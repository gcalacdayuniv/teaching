// js/app.js
import { injectComponents } from './components.js';
import { AppRouter } from './router.js';
import { AuthManager } from './auth.js';
import { LoggerManager } from './hours-logger.js';
import { RecordsManager } from './records-viewer.js';
import { ProfileManager } from './profile.js';
import { FinanceManager } from './finance.js';
import { PWA } from './pwa.js';
import { PdfCompiler } from './pdf.js';

initApp();

function initApp() {
    try {
        injectComponents();
        FinanceManager.injectComponent();
        PdfCompiler.init();
        
        setupUI();

        PWA.init();
        AuthManager.init();
        AppRouter.init();
        LoggerManager.init();
        RecordsManager.init();
        ProfileManager.init();
        FinanceManager.init();
        
        console.log("Teaching Portal Modular Architecture Loaded Successfully");
    } catch (error) {
        console.error("Critical Failure during App Initialization:", error);
    }
}

function setupUI() {
    const profileBtn = document.getElementById('menu-profile');
    if (profileBtn) {
        profileBtn.id = 'menu-pdf';
        profileBtn.onclick = null;
        profileBtn.className = 'menu-link flex-1 min-w-0 flex justify-center items-center gap-1 sm:gap-1.5 px-1 sm:px-2 rounded-full text-[10px] sm:text-xs font-semibold transition-all duration-300 text-gray-500 hover:bg-red-50 hover:text-red-700 h-9 focus:outline-none';
        profileBtn.innerHTML = `
            <i class="fas fa-file-pdf shrink-0 text-red-600"></i>
            <span class="truncate">PDF</span>
        `;
        profileBtn.addEventListener('click', () => { window.location.hash = '#/pdf'; });
        profileBtn.setAttribute('href', '#/pdf');
    }

    window.toggleFAB = function() {
        const fabMenu = document.getElementById('fabMenu');
        const fabIcon = document.getElementById('fabIcon');
        
        if (fabMenu.classList.contains('hidden')) {
            fabMenu.classList.remove('hidden');
            fabMenu.classList.add('flex');
            fabIcon.style.transform = 'rotate(45deg)'; 
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
        
        window.closeAllMenus();
        
        if (window.closeProfileModals) {
            window.closeProfileModals();
        }
    });
}
