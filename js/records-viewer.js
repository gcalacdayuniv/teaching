import { CONFIG, State } from './globals.js';

let allRecords = [];
let currentFilterTab = 'Rendered'; // 'Rendered' or 'Paid'

export function initRecords() {
    setDefaultDates();

    // Auto-fetch on date change
    const filterStart = document.getElementById('filterStart');
    const filterEnd = document.getElementById('filterEnd');
    if (filterStart) filterStart.addEventListener('change', fetchRecords);
    if (filterEnd) filterEnd.addEventListener('change', fetchRecords);

    // Dashboard Tabs Binding
    const tabRendered = document.getElementById('tab-btn-Rendered');
    const tabPaid = document.getElementById('tab-btn-Paid');
    
    if (tabRendered) {
        tabRendered.addEventListener('click', () => {
            currentFilterTab = 'Rendered';
            updateTabStyles();
            fetchRecords();
        });
    }
    if (tabPaid) {
        tabPaid.addEventListener('click', () => {
            currentFilterTab = 'Paid';
            updateTabStyles();
            fetchRecords();
        });
    }

    // Summary Modal Triggers (Cards)
    document.getElementById('card-rendered')?.addEventListener('click', () => openSummaryModal('Rendered'));
    document.getElementById('card-paid')?.addEventListener('click', () => openSummaryModal('Paid'));
    document.getElementById('card-unpaid')?.addEventListener('click', () => openSummaryModal('Unpaid'));
}

function updateTabStyles() {
    const tabRendered = document.getElementById('tab-btn-Rendered');
    const tabPaid = document.getElementById('tab-btn-Paid');
    const activeClass = "flex-1 min-w-[100px] py-1.5 px-3 text-xs font-bold rounded transition bg-white text-blue-600 shadow-sm";
    const inactiveClass = "flex-1 min-w-[100px] py-1.5 px-3 text-xs font-bold text-gray-500 rounded transition hover:bg-gray-200";

    if (tabRendered) tabRendered.className = currentFilterTab === 'Rendered' ? activeClass : inactiveClass;
    if (tabPaid) tabPaid.className = currentFilterTab === 'Paid' ? activeClass : inactiveClass;
}

function setDefaultDates() {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    document.getElementById('filterStart').value = start.toISOString().split('T')[0];
    document.getElementById('filterEnd').value = end.toISOString().split('T')[0];
}

export async function fetchRecords() {
    if (!State.currentUser) return;

    const start = document.getElementById('filterStart').value;
    const end = document.getElementById('filterEnd').value;
    const tbody = document.getElementById('dataTableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>`;

    try {
        let condition = `Date >= '${start}' AND Date <= '${end}'`;
        if (currentFilterTab === 'Paid') {
            condition += ` AND Payment_Status = 'Paid'`;
        }

        const queryUrl = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}?table=Teaching_Hours&condition=${encodeURIComponent(condition)}&orderBy=Date ASC`;
        const response = await fetch(queryUrl);
        const result = await response.json();

        if (result.success || result.status === 'success') {
            allRecords = result.data || result.records || [];
            renderRecords(allRecords);
            updateSummaryCards(allRecords);
        } else {
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-red-500 font-bold">${result.message || 'Data error'}</td></tr>`;
        }
    } catch (error) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-red-500 font-bold">Network Error</td></tr>`;
    }
}

function renderRecords(data) {
    const tbody = document.getElementById('dataTableBody');
    if (!tbody) return;

    if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-gray-400 font-bold">No records found for this selection.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(row => {
        const dateStr = new Date(row.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isPaid = row.Payment_Status === 'Paid';
        const statusClass = isPaid ? 'text-green-500' : 'text-amber-500';
        const earnings = Number(row.Total_Earnings).toLocaleString(undefined, {minimumFractionDigits: 2});

        return `
        <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
            <td class="px-4 py-3 text-center w-10">
                ${!isPaid ? `<input type="checkbox" class="record-checkbox w-4 h-4 rounded text-blue-600 cursor-pointer" data-id="${row.Entry_ID}">` : ''}
            </td>
            <td class="px-4 py-3">
                <div class="font-semibold text-gray-800">${dateStr}</div>
                <div class="text-[10px] text-gray-400">${row.Start_Time} - ${row.End_Time}</div>
            </td>
            <td class="px-4 py-3 font-semibold text-gray-700">${row.Subject_Code}</td>
            <td class="px-4 py-3 text-right">
                <div class="font-black text-gray-900">₱${earnings}</div>
                <div class="text-[9px] font-bold uppercase tracking-widest ${statusClass} mt-0.5">${row.Payment_Status}</div>
            </td>
        </tr>
        `;
    }).join('');
}

function updateSummaryCards(data) {
    let renderedHrs = 0, totalPaid = 0, totalUnpaid = 0;

    data.forEach(row => {
        renderedHrs += Number(row.Total_Hours);
        const amt = Number(row.Total_Earnings);
        if (row.Payment_Status === 'Paid') totalPaid += amt;
        else totalUnpaid += amt;
    });

    const hrsEl = document.getElementById('summaryHours');
    const paidEl = document.getElementById('summaryPaid');
    const unpaidEl = document.getElementById('summaryUnpaid');
    
    if (hrsEl) hrsEl.innerText = renderedHrs.toFixed(1);
    if (paidEl) paidEl.innerText = '₱' + totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2});
    if (unpaidEl) unpaidEl.innerText = '₱' + totalUnpaid.toLocaleString(undefined, {minimumFractionDigits: 2});
}

function openSummaryModal(cardType) {
    const modal = document.getElementById('summaryModal');
    const titleEl = document.getElementById('summaryModalTitle');
    const tbody = document.getElementById('summaryTableBody');
    if (!modal || !titleEl || !tbody) return;
    
    let filtered = allRecords;
    
    if (cardType === 'Paid') {
        filtered = filtered.filter(r => r.Payment_Status === 'Paid');
        titleEl.textContent = "Paid Records";
    } else if (cardType === 'Unpaid') {
        filtered = filtered.filter(r => r.Payment_Status !== 'Paid');
        titleEl.textContent = "Unpaid Records";
    } else {
        titleEl.textContent = "All Rendered Records";
    }
    
    tbody.innerHTML = filtered.map(r => {
        const dateStr = new Date(r.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const earnings = Number(r.Total_Earnings).toLocaleString(undefined,{minimumFractionDigits:2});
        const statusClass = r.Payment_Status === 'Paid' ? 'text-green-500' : 'text-amber-500';
        
        return `
            <tr class="hover:bg-gray-50 transition">
                <td class="p-3">
                    <div class="font-bold text-gray-800">${dateStr}</div>
                    <div class="text-[10px] font-bold text-gray-500 uppercase tracking-wider">${r.Subject_Code}</div>
                </td>
                <td class="p-3 text-right">
                    <div class="font-black text-gray-900">₱${earnings}</div>
                    <div class="text-[9px] font-bold uppercase tracking-widest ${statusClass} mt-0.5">${r.Payment_Status}</div>
                </td>
            </tr>
        `;
    }).join('');
    
    if(filtered.length === 0) tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-400 font-bold">No records found.</td></tr>`;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}
