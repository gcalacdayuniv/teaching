// js/records-viewer.js
import { CONFIG } from './globals.js';
import { AuthManager } from './auth.js';

export const RecordsManager = {
    state: {
        allRecords: [],
        filterType: 'Rendered' // 'Rendered' or 'Paid'
    },

    init() {
        this.setDefaultDates();
        
        // Export global functions used by HTML inline events
        window.switchRecordsTab = this.switchTab.bind(this);
        window.triggerFetchRecords = this.fetchRecords.bind(this);
        window.showSummaryModal = this.showSummaryModal.bind(this);
        window.RecordsManager = this; // For external access if needed
    },

    setDefaultDates() {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        document.getElementById('filterStart').value = start.toISOString().split('T')[0];
        document.getElementById('filterEnd').value = end.toISOString().split('T')[0];
    },

    switchTab(tabName) {
        this.state.filterType = tabName;
        
        // Update styling of dashboard-style tabs
        document.querySelectorAll('.records-tab-btn').forEach(btn => {
            btn.className = "records-tab-btn flex-1 min-w-[100px] py-1.5 px-3 text-xs font-bold text-gray-500 rounded transition hover:bg-gray-200";
        });
        
        const activeBtn = document.getElementById(`tab-btn-${tabName}`);
        if(activeBtn) {
            activeBtn.className = "records-tab-btn active flex-1 min-w-[100px] py-1.5 px-3 text-xs font-bold rounded transition bg-white text-blue-600 shadow-sm";
        }
        
        // Immediately fetch records based on the new tab selection
        this.fetchRecords();
    },

    async fetchRecords() {
        const token = AuthManager.getToken();
        if (!token) return;

        const start = document.getElementById('filterStart').value;
        const end = document.getElementById('filterEnd').value;
        const type = this.state.filterType; 

        const tbody = document.getElementById('dataTableBody');
        tbody.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-gray-500"><i class="fas fa-spinner fa-spin mr-2"></i>Loading...</td></tr>`;

        try {
            // Build the conditional query based on tab type
            let condition = `Date >= '${start}' AND Date <= '${end}'`;
            if (type === 'Paid') {
                condition += ` AND Payment_Status = 'Paid'`;
            }

            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}?table=Teaching_Hours&condition=${encodeURIComponent(condition)}&orderBy=Date ASC`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                this.state.allRecords = result.data;
                this.renderRecords(this.state.allRecords);
                this.updateSummaryCards(this.state.allRecords);
            } else {
                tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-red-500 font-bold">${result.message}</td></tr>`;
            }
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-6 text-center text-red-500 font-bold">Network Error</td></tr>`;
        }
    },

    renderRecords(data) {
        const tbody = document.getElementById('dataTableBody');
        
        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="py-10 text-center text-gray-400 font-bold">No records found for this selection.</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(row => {
            const dateStr = new Date(row.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const isPaid = row.Payment_Status === 'Paid';
            const statusClass = isPaid ? 'text-green-500' : 'text-amber-500';
            const earnings = Number(row.Total_Earnings).toLocaleString(undefined, {minimumFractionDigits: 2});

            // Streamlined columns: Checkbox | Date (with time) | Subject | Earnings (with status below)
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
    },

    updateSummaryCards(data) {
        let renderedHrs = 0;
        let totalPaid = 0;
        let totalUnpaid = 0;

        data.forEach(row => {
            renderedHrs += Number(row.Total_Hours);
            const amt = Number(row.Total_Earnings);
            if (row.Payment_Status === 'Paid') {
                totalPaid += amt;
            } else {
                totalUnpaid += amt;
            }
        });

        document.getElementById('summaryHours').innerText = renderedHrs.toFixed(1);
        document.getElementById('summaryPaid').innerText = '₱' + totalPaid.toLocaleString(undefined, {minimumFractionDigits: 2});
        document.getElementById('summaryUnpaid').innerText = '₱' + totalUnpaid.toLocaleString(undefined, {minimumFractionDigits: 2});
    },

    showSummaryModal(cardType) {
        // cardType: 'Rendered', 'Paid', 'Unpaid'
        const modal = document.getElementById('summaryModal');
        const titleEl = document.getElementById('summaryModalTitle');
        const tbody = document.getElementById('summaryTableBody');
        
        let filtered = this.state.allRecords;
        
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
        
        if(filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" class="p-8 text-center text-gray-400 font-bold">No records found in this category.</td></tr>`;
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};
