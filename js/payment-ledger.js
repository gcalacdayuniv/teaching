// payment-ledger.js
import { CONFIG, Utils } from './globals.js';
import { RecordsManager } from './records-viewer.js';

let currentlySelectedIds = [];

export const LedgerManager = {
    init: () => {
        document.getElementById('openPaymentPromptBtn').addEventListener('click', LedgerManager.promptDate);
        document.getElementById('confirmPaymentBtn').addEventListener('click', LedgerManager.executePayment);
        document.getElementById('cancelPaymentBtn').addEventListener('click', () => LedgerManager.closeModal('paymentModal'));
        
        document.getElementById('openSummaryBtn').addEventListener('click', LedgerManager.showSummary);
        document.getElementById('closeSummaryBtn').addEventListener('click', () => LedgerManager.closeModal('summaryModal'));
    },

    closeModal: (id) => {
        const el = document.getElementById(id);
        el.classList.add('hidden'); el.classList.remove('flex');
    },

    promptDate: () => {
        currentlySelectedIds = Array.from(document.querySelectorAll('.record-checkbox:checked')).map(cb => cb.value);
        if(!currentlySelectedIds.length) return alert("Select unpaid records first via checkboxes.");
        
        const modal = document.getElementById('paymentModal');
        modal.classList.remove('hidden'); modal.classList.add('flex');
    },

    executePayment: async () => {
        const date = document.getElementById('selectedPaymentDate').value;
        if(!date) return alert("Select a date.");
        
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`;
            await fetch(url, { method: 'POST', body: JSON.stringify({ action: 'update_payment', entryIds: currentlySelectedIds, datePaid: date }) });
            LedgerManager.closeModal('paymentModal');
            RecordsManager.fetchData(); // Refresh table
        } catch(e) { alert("Error updating records."); }
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