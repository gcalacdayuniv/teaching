import { CONFIG, State } from './globals.js';

let resources = [];
let activeCategory = 'All';

export async function initResources() {
    const form = document.getElementById('resourceForm');
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', saveResource);
    }
    await fetchResources();
}

async function fetchResources() {
    if (!State.currentUser) return;
    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}?table=Resource_Links&condition=Is_Deleted=0`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.status === 'success' || data.success) {
            resources = data.data || data.records || [];
            renderTabs();
            renderResources();
        }
    } catch (error) {
        console.error("Resources Fetch Error:", error);
    }
}

function renderTabs() {
    const container = document.getElementById('resourceTabs');
    if (!container) return;

    const categories = [...new Set(resources.map(r => r.Category))].filter(Boolean).sort();
    const allCats = ['All', ...categories];
    
    const datalist = document.getElementById('existingCategories');
    if(datalist) datalist.innerHTML = categories.map(c => `<option value="${c}">`).join('');

    container.innerHTML = allCats.map(cat => {
        const isActive = activeCategory === cat;
        const btnClass = isActive 
            ? 'tab-btn active flex-1 min-w-[70px] py-1.5 px-3 text-xs font-bold rounded transition bg-white text-blue-600 shadow-sm' 
            : 'tab-btn flex-1 min-w-[70px] py-1.5 px-3 text-xs font-bold text-gray-500 rounded transition hover:bg-gray-300 cursor-pointer';
        
        return `<button data-cat="${cat}" class="resource-tab-btn ${btnClass}">${cat}</button>`;
    }).join('');

    // Safely attach event listeners to buttons
    document.querySelectorAll('.resource-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            activeCategory = e.target.getAttribute('data-cat');
            renderTabs();
            renderResources();
        });
    });
}

function renderResources() {
    const container = document.getElementById('resourceGrid');
    if(!container) return;

    let filtered = resources;
    if (activeCategory !== 'All') {
        filtered = filtered.filter(r => r.Category === activeCategory);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 py-8 font-bold">No resources found.</p>`;
        return;
    }

    // List view mapping
    container.innerHTML = filtered.map(r => `
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition overflow-hidden flex items-center gap-3 p-3">
            <div class="w-10 h-10 shrink-0 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-link text-lg"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-bold text-gray-800 truncate text-sm">
                    <a href="${r.URL}" target="_blank" class="hover:text-blue-600 hover:underline">${r.Title}</a>
                </h3>
                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">${r.Category}</p>
            </div>
            <div class="shrink-0 flex gap-2">
                <button class="edit-resource-btn p-1.5 text-gray-400 hover:text-blue-600 transition" data-id="${r.Resource_ID}"><i class="fas fa-edit"></i></button>
                <button class="delete-resource-btn p-1.5 text-gray-400 hover:text-red-500 transition" data-id="${r.Resource_ID}"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.edit-resource-btn').forEach(btn => {
        btn.addEventListener('click', (e) => editResource(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.delete-resource-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteResource(e.currentTarget.dataset.id));
    });
}

async function saveResource(e) {
    e.preventDefault();
    const payload = {
        action: 'saveResource',
        Resource_ID: document.getElementById('resourceId').value || crypto.randomUUID(),
        Category: document.getElementById('resourceCategory').value.trim(),
        Title: document.getElementById('resourceTitle').value.trim(),
        URL: document.getElementById('resourceUrl').value.trim()
    };

    const btn = e.target.querySelector('button[type="submit"]');
    const origText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;

    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION || CONFIG.ENDPOINTS.ACTION}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        
        if (result.success || result.status === 'success') {
            document.getElementById('resourceModal').classList.add('hidden');
            e.target.reset();
            await fetchResources();
        } else {
            alert(result.message || "Failed to save");
        }
    } catch (err) {
        alert("Connection error.");
    } finally {
        btn.innerHTML = origText;
        btn.disabled = false;
    }
}

function editResource(id) {
    const resource = resources.find(r => r.Resource_ID === id);
    if (!resource) return;

    document.getElementById('resourceId').value = resource.Resource_ID;
    document.getElementById('resourceCategory').value = resource.Category;
    document.getElementById('resourceTitle').value = resource.Title;
    document.getElementById('resourceUrl').value = resource.URL;
    
    document.getElementById('resourceModalTitle').textContent = 'Edit Link';
    const modal = document.getElementById('resourceModal');
    if(modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

async function deleteResource(id) {
    if (!confirm("Are you sure you want to remove this link?")) return;
    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION || CONFIG.ENDPOINTS.ACTION}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'deleteResource', Resource_ID: id })
        });
        const result = await res.json();
        if (result.success || result.status === 'success') {
            await fetchResources();
        } else {
            alert(result.message || "Failed to delete");
        }
    } catch (err) {
        alert("Error deleting resource.");
    }
}
