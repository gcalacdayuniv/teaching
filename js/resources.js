// resources.js
import { CONFIG } from './globals.js';

let resourcesData = [];
let activeCategory = 'All';

export const initResources = () => {
    const refreshBtn = document.getElementById('refreshResourcesBtn');
    const addBtn = document.getElementById('addResourceBtn');
    const cancelBtn = document.getElementById('cancelResourceBtn');
    const form = document.getElementById('resourceForm');
    
    // Bind events once
    if (refreshBtn && !refreshBtn.dataset.bound) {
        refreshBtn.addEventListener('click', fetchResources);
        addBtn.addEventListener('click', openAddModal);
        cancelBtn.addEventListener('click', closeResourceModal);
        form.addEventListener('submit', handleResourceSubmit);
        refreshBtn.dataset.bound = true;
    }

    fetchResources();
};

async function fetchResources() {
    const grid = document.getElementById('resourceGrid');
    const tabs = document.getElementById('resourceTabs');
    
    grid.innerHTML = '<div class="col-span-full text-center py-10 text-blue-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading resources...</div>';
    tabs.innerHTML = '';
    
    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}?path=resources`;
        const res = await fetch(url);
        resourcesData = await res.json();
        
        renderTabs();
        renderGrid();
        updateDatalist();
    } catch(e) { 
        grid.innerHTML = '<div class="col-span-full text-center text-red-500">Failed to load resources. Please try again.</div>'; 
    }
}

function renderTabs() {
    const tabsContainer = document.getElementById('resourceTabs');
    const categories = ['All', ...new Set(resourcesData.map(r => r.Category))].filter(Boolean).sort();
    
    // Reset to 'All' if current activeCategory was deleted or doesn't exist
    if (!categories.includes(activeCategory)) activeCategory = 'All';

    tabsContainer.innerHTML = categories.map(cat => `
        <button class="tab-btn whitespace-nowrap px-4 py-2 rounded-lg font-bold text-xs sm:text-sm transition-colors border ${cat === activeCategory ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}" data-category="${cat}">
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
        <div class="bg-white border p-4 sm:p-5 rounded-xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div>
                <div class="flex justify-between items-start mb-3">
                    <span class="text-[10px] font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">${r.Category}</span>
                    <div class="flex gap-2 text-gray-400">
                        <button class="edit-btn hover:text-blue-600 transition" data-id="${r.Resource_ID}" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="del-btn hover:text-red-500 transition" data-id="${r.Resource_ID}" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <h3 class="font-bold text-gray-800 text-base mb-4 leading-snug break-words">${r.Title}</h3>
            </div>
            <a href="${r.URL}" target="_blank" class="block text-center text-xs font-bold text-blue-700 bg-blue-50 py-2.5 rounded-lg hover:bg-blue-600 hover:text-white transition w-full shadow-sm">
                Open Link <i class="fas fa-external-link-alt ml-1"></i>
            </a>
        </div>
    `).join('') : '<div class="col-span-full text-center py-10 text-gray-400 text-sm">No resources available in this category.</div>';

    // Reattach listeners for dynamic buttons
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
    
    const payload = {
        action: id ? 'edit_resource' : 'add_resource',
        resourceId: id,
        category: document.getElementById('resourceCategory').value.trim(),
        title: document.getElementById('resourceTitle').value.trim(),
        url: document.getElementById('resourceUrl').value.trim(),
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;

    try {
        const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.ACTION}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            closeResourceModal();
            fetchResources();
        } else {
            alert('Failed to save the resource details.');
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
        const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.ACTION}`, {
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
