export const PWA = {
    init() {
        this.injectManifest();
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
                    "src": "/assets/icon-192x192.png",
                    "sizes": "192x192",
                    "type": "image/png",
                    "purpose": "any maskable"
                },
                {
                    "src": "/assets/icon-512x512.png",
                    "sizes": "512x512",
                    "type": "image/png",
                    "purpose": "any maskable"
                }
            ]
        };

        const blob = new Blob([JSON.stringify(manifestData)], { type: 'application/json' });
        const manifestURL = URL.createObjectURL(blob);

        let manifestLink = document.querySelector('link[rel="manifest"]');
        if (!manifestLink) {
            manifestLink = document.createElement('link');
            manifestLink.rel = 'manifest';
            document.head.appendChild(manifestLink);
        }
        manifestLink.href = manifestURL;
    }
};
