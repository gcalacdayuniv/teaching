// resources.js
import { CONFIG } from './globals.js';

let resourcesLoaded = false;

export const initResources = () => {
    // Attach listener to refresh button
    const refreshBtn = document.getElementById('refreshResourcesBtn');
    if(refreshBtn && !refreshBtn.dataset.bound) {
        refreshBtn.addEventListener('click', fetchResources);
        refreshBtn.dataset.bound = true;
    }

    if (!resourcesLoaded) fetchResources();
};

async function fetchResources() {
    const grid = document.getElementById('resourceGrid');
    grid.innerHTML = '<div class="col-span-full text-center py-10 text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading resources...</div>';
    
    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}?path=resources`;
        const res = await fetch(url);
        const data = await res.json();
        
        grid.innerHTML = data.length ? data.map(r => `
            <div class="bg-white border p-3 sm:p-4 rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-between">
                <div class="pr-3 truncate">
                    <span class="text-[10px] font-bold uppercase text-blue-500 bg-blue-50 px-2 py-0.5 rounded">${r.Category}</span>
                    <h3 class="font-bold text-gray-800 text-sm sm:text-base mt-1 truncate">${r.Title}</h3>
                </div>
                <a href="${r.URL}" target="_blank" class="flex-shrink-0 text-blue-600 bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm"><i class="fas fa-external-link-alt"></i></a>
            </div>
        `).join('') : '<div class="col-span-full text-center py-10 text-gray-400">No resources found.</div>';
        resourcesLoaded = true;
    } catch(e) { 
        grid.innerHTML = '<div class="col-span-full text-center text-red-500">Failed to load.</div>'; 
    }
}