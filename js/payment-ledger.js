// payment-ledger.js
import { CONFIG, Utils } from './globals.js';

export const LedgerManager = {
    init: () => {
        // The Mark Paid logic is now managed by RecordsManager in records-viewer.js
        // We only initialize the Summary modal here.
        document.getElementById('openSummaryBtn').addEventListener('click', LedgerManager.showSummary);
        document.getElementById('closeSummaryBtn').addEventListener('click', () => LedgerManager.closeModal('summaryModal'));
    },

    closeModal: (id) => {
        const el = document.getElementById(id);
        el.classList.add('hidden'); el.classList.remove('flex');
    },

    showSummary: async () => {
        const modal = document.getElementById('summaryModal');
        const tbody = document.getElementById('summaryTableBody');
        modal.classList.remove('hidden'); modal.classList.add('flex');
        tbody.innerHTML = '<tr><td colspan="2" class="text-center py-10">Loading...</td></tr>';
        
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}`;
            const res = await fetch(url);
            const data = await res.json();
            
            const group = data.reduce((acc, r) => {
                if(r.Payment_Status === 'Paid' && r.Date_Paid) {
                    const cleanDate = Utils.formatDateYYYYMMDD(r.Date_Paid);
                    acc[cleanDate] = (acc[cleanDate] || 0) + parseFloat(String(r.Total_Earnings).replace(/[^0-9.-]+/g,"") || 0);
                }
                return acc;
            }, {});
            
            const sorted = Object.keys(group).sort((a,b) => new Date(a) - new Date(b));
            let grandTotal = 0;
            
            tbody.innerHTML = sorted.length ? sorted.map(d => {
                grandTotal += group[d];
                return `<tr><td class="p-3 border-b">${d}</td><td class="p-3 border-b text-right font-bold">${Utils.formatCurrency(group[d])}</td></tr>`;
            }).join('') + `<tr class="bg-gray-100 font-bold text-gray-900"><td class="p-3 border-b text-right uppercase text-xs">Grand Total</td><td class="p-3 border-b text-right text-emerald-700">${Utils.formatCurrency(grandTotal)}</td></tr>` : '<tr><td colspan="2" class="p-10 text-center">No history.</td></tr>';
        } catch(e) {
             tbody.innerHTML = '<tr><td colspan="2" class="p-10 text-center text-red-500">Error loading.</td></tr>';
        }
    }
};
