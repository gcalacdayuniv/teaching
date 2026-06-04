// js/resources.js

import { CONFIG } from './globals.js';

let resourcesData = [];
let activeCategory = 'All';

export const initResources = () => {
    const cancelBtn = document.getElementById('cancelResourceBtn');
    const form = document.getElementById('resourceForm');
    const actionType = document.getElementById('resourceActionType');
    
    if (form && !form.dataset.bound) {
        if (cancelBtn) cancelBtn.addEventListener('click', closeResourceModal);
        form.addEventListener('submit', handleResourceSubmit);
        
        if (actionType) {
            actionType.addEventListener('change', (e) => {
                const val = e.target.value;
                const urlContainer = document.getElementById('urlContainer');
                const urlLabel = document.getElementById('urlLabel');
                const urlInput = document.getElementById('resourceUrl');
                
                if (val.startsWith('create_')) {
                    urlContainer.classList.add('hidden');
                    urlInput.required = false;
                    urlInput.value = '';
                } else {
                    urlContainer.classList.remove('hidden');
                    urlLabel.textContent = val === 'duplicate' ? 'Original File URL to Duplicate' : 'URL Address';
                    urlInput.required = true;
                }
            });
        }
        
        form.dataset.bound = true;
    }

    // Ensure FAB can access the add modal directly
    window.openResourceModal = openAddModal;

    fetchResources();
};

async function fetchResources() {
    const grid = document.getElementById('resourceGrid');
    const tabs = document.getElementById('resourceTabs');
    
    grid.innerHTML = '<div class="w-full text-center py-10 text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading resources...</div>';
    tabs.innerHTML = '';
    
    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}?path=resources`;
        const res = await fetch(url);
        resourcesData = await res.json();
        
        renderTabs();
        renderGrid();
        updateDatalist();
    } catch(e) { 
        grid.innerHTML = '<div class="w-full text-center py-10 text-red-500">Failed to load resources. Please try again.</div>'; 
    }
}

function renderTabs() {
    const tabsContainer = document.getElementById('resourceTabs');
    const uniqueCategories = [...new Set(resourcesData.map(r => r.Category))].filter(Boolean).sort();
    const categories = ['All', ...uniqueCategories];
    
    if (!categories.includes(activeCategory)) activeCategory = 'All';

    tabsContainer.innerHTML = categories.map(cat => `
        <button class="tab-btn px-4 py-2 text-sm font-bold border-b-2 outline-none whitespace-nowrap transition-colors ${cat === activeCategory ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}" data-category="${cat}">
            ${cat}
        </button>
    `).join('');

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategory = e.target.dataset.category;
            renderTabs();
            renderGrid();
        });
    });
}

function renderGrid() {
    const grid = document.getElementById('resourceGrid');
    const filtered = activeCategory === 'All' ? resourcesData : resourcesData.filter(r => r.Category === activeCategory);
    
    grid.innerHTML = filtered.length ? filtered.map(r => `
        <div class="bg-white border p-3 rounded-xl shadow-sm hover:shadow-md transition flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
                <div class="mb-1">
                    <span class="text-[9px] font-bold uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">${r.Category}</span>
                </div>
                <h3 class="font-bold text-gray-800 text-sm truncate">${r.Title}</h3>
            </div>
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
                <a href="${r.URL}" target="_blank" class="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition" title="Open Link"><i class="fas fa-external-link-alt text-xs"></i></a>
                <button class="edit-btn w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 transition bg-gray-50 hover:bg-blue-50 rounded" data-id="${r.Resource_ID}" title="Edit"><i class="fas fa-edit text-xs"></i></button>
                <button class="del-btn w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition bg-gray-50 hover:bg-red-50 rounded" data-id="${r.Resource_ID}" title="Delete"><i class="fas fa-trash text-xs"></i></button>
            </div>
        </div>
    `).join('') : '<div class="w-full text-center py-10 text-gray-400 text-sm">No resources available in this category.</div>';

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openEditModal(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteResource(e.currentTarget.dataset.id));
    });
}

function updateDatalist() {
    const datalist = document.getElementById('existingCategories');
    const categories = [...new Set(resourcesData.map(r => r.Category))].filter(Boolean).sort();
    datalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');
}

function openAddModal() {
    document.getElementById('resourceId').value = '';
    document.getElementById('resourceForm').reset();
    
    const actionType = document.getElementById('resourceActionType');
    if (actionType) {
        actionType.value = 'link';
        actionType.disabled = false;
    }
    document.getElementById('urlContainer')?.classList.remove('hidden');
    const urlLabel = document.getElementById('urlLabel');
    if (urlLabel) urlLabel.textContent = 'URL Address';
    const urlInput = document.getElementById('resourceUrl');
    if (urlInput) urlInput.required = true;

    document.getElementById('resourceModalTitle').textContent = 'Add New Link';
    document.getElementById('resourceModal').classList.remove('hidden');
    document.getElementById('resourceModal').classList.add('flex');
}

function openEditModal(id) {
    const resource = resourcesData.find(r => r.Resource_ID === id);
    if (!resource) return;
    
    document.getElementById('resourceId').value = resource.Resource_ID;
    document.getElementById('resourceCategory').value = resource.Category;
    document.getElementById('resourceTitle').value = resource.Title;
    document.getElementById('resourceUrl').value = resource.URL;
    
    const actionType = document.getElementById('resourceActionType');
    if (actionType) {
        actionType.value = 'link';
        actionType.disabled = true; // Prevent changing type during edit
    }
    document.getElementById('urlContainer')?.classList.remove('hidden');
    const urlLabel = document.getElementById('urlLabel');
    if (urlLabel) urlLabel.textContent = 'URL Address';
    const urlInput = document.getElementById('resourceUrl');
    if (urlInput) urlInput.required = true;
    
    document.getElementById('resourceModalTitle').textContent = 'Edit Link';
    document.getElementById('resourceModal').classList.remove('hidden');
    document.getElementById('resourceModal').classList.add('flex');
}

function closeResourceModal() {
    document.getElementById('resourceModal').classList.add('hidden');
    document.getElementById('resourceModal').classList.remove('flex');
}

async function handleResourceSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('resourceId').value;
    const actionType = document.getElementById('resourceActionType');
    
    const payload = {
        action: id ? 'edit_resource' : 'add_resource',
        resourceId: id,
        category: document.getElementById('resourceCategory').value.trim(),
        title: document.getElementById('resourceTitle').value.trim(),
        url: document.getElementById('resourceUrl').value.trim(),
        resourceType: actionType ? actionType.value : 'link'
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    // Allow visual indication for time-consuming Google Drive operations
    submitBtn.textContent = (payload.resourceType !== 'link' && !id) ? 'Generating Document...' : 'Saving...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            closeResourceModal();
            fetchResources();
        } else {
            alert(data.message || 'Failed to save the resource details.');
        }
    } catch(err) {
        alert('A network error occurred while saving.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

async function deleteResource(id) {
    if (!confirm('Are you sure you want to remove this link? (It can still be recovered from the database).')) return;
    
    try {
        const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'delete_resource', resourceId: id })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            fetchResources();
        } else {
            alert('Failed to delete the resource.');
        }
    } catch(err) {
        alert('A network error occurred while deleting.');
    }
}
