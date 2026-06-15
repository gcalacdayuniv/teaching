export const PWA = {
    deferredPrompt: null,

    init() {
        this.injectManifest();
        this.registerServiceWorker();
        this.setupInstallPrompts();
    },

    injectManifest() {
        const manifestData = {
            "name": "Financial & Teaching Portal",
            "short_name": "Finance Portal",
            "description": "Professional financial and teaching management application.",
            "start_url": "/",
            "display": "standalone",
            "background_color": "#f8fafc",
            "theme_color": "#1e40af",
            "orientation": "portrait-primary",
            "icons": [
                {
                    "src": "https://cdn-icons-png.flaticon.com/512/3135/3135679.png", 
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any maskable"
                }
            ]
        };

        const stringManifest = JSON.stringify(manifestData);
        const encodedManifest = encodeURIComponent(stringManifest);
        const dataUri = `data:application/manifest+json;charset=utf-8,${encodedManifest}`;

        let manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) {
            manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            document.head.appendChild(manifestLink);
        }
        manifestLink.href = dataUri;
    },

    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful with scope:', registration.scope);
                }).catch(err => {
                    console.error('ServiceWorker registration failed:', err);
                });
            });
        }
    },

    setupInstallPrompts() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton();
        });

        const isIos = () => {
            const userAgent = window.navigator.userAgent.toLowerCase();
            return /iphone|ipad|ipod/.test(userAgent);
        };

        const isStandalone = () => {
            return ('standalone' in window.navigator) && (window.navigator.standalone);
        };

        if (isIos() && !isStandalone()) {
            this.showIosInstallInstruction();
        }
    },

    showInstallButton() {
        let btn = document.getElementById('pwaInstallBtn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'pwaInstallBtn';
            btn.innerHTML = '<i class="fas fa-download mr-2"></i> Install App';
            btn.className = 'fixed bottom-20 right-4 z-[100] bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm flex items-center transition transform hover:scale-105';
            document.body.appendChild(btn);
        }
        
        btn.classList.remove('hidden');
        btn.addEventListener('click', async () => {
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                const { outcome } = await this.deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    btn.classList.add('hidden');
                }
                this.deferredPrompt = null;
            }
        });
    },

    showIosInstallInstruction() {
        const instructionId = 'iosInstallPrompt';
        if (document.getElementById(instructionId)) return;

        const banner = document.createElement('div');
        banner.id = instructionId;
        banner.className = 'fixed top-4 left-4 right-4 z-[100] bg-white border border-gray-200 shadow-xl rounded-xl p-4 flex gap-4 items-start';
        banner.innerHTML = `
            <div class="text-blue-600 text-2xl mt-1"><i class="fas fa-arrow-up-from-bracket"></i></div>
            <div class="flex-1">
                <h4 class="font-bold text-gray-800 text-sm">Install on iOS</h4>
                <p class="text-xs text-gray-500 mt-1">Tap the <b>Share</b> button in Safari, then select <b>Add to Home Screen</b> to install this app.</p>
            </div>
            <button class="text-gray-400 hover:text-gray-600 p-1" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        document.body.appendChild(banner);
    }
};
