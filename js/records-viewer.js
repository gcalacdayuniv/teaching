import { CONFIG, Utils, API } from './globals.js';

export const RecordsManager = {
    cachedData: [],

    init: () => {
        const startInput = document.getElementById('filterStart');
        const endInput = document.getElementById('filterEnd');
        const clearDatesBtn = document.getElementById('clearDatesBtn');

        if (startInput) startInput.addEventListener('change', RecordsManager.fetchData);
        if (endInput) endInput.addEventListener('change', RecordsManager.fetchData);
        
        if (clearDatesBtn) {
            clearDatesBtn.addEventListener('click', () => {
                if (startInput) startInput.value = '';
                if (endInput) endInput.value = '';
                RecordsManager.fetchData();
            });
        }

        document.querySelectorAll('.record-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.record-tab').forEach(t => {
                    t.classList.remove('border-blue-600', 'text-blue-600');
                    t.classList.add('border-transparent', 'text-gray-500');
                });
                e.target.classList.remove('border-transparent', 'text-gray-500');
                e.target.classList.add('border-blue-600', 'text-blue-600');
                
                document.getElementById('filterType').value = e.target.dataset.type;
                RecordsManager.fetchData();
            });
        });

        const selectAll = document.getElementById('selectAllRecords');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                document.querySelectorAll('.record-checkbox').forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });
        }

        const markPaidBtn = document.getElementById('markPaidBtn');
        if (markPaidBtn) {
            markPaidBtn.addEventListener('click', RecordsManager.openPaymentModal);
        }

        const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
        if (cancelPaymentBtn) {
            cancelPaymentBtn.addEventListener('click', () => {
                const modal = document.getElementById('paymentModal');
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            });
        }

        const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', RecordsManager.confirmMarkAsPaid);
        }

        // Summary Modals Events
        const closeSummaryBtn = document.getElementById('closeSummaryBtn');
        if (closeSummaryBtn) {
            closeSummaryBtn.addEventListener('click', () => {
                const modal = document.getElementById('summaryModal');
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            });
        }

        const cardRendered = document.getElementById('cardRendered');
        if (cardRendered) cardRendered.addEventListener('click', () => RecordsManager.openSummaryModal('Rendered'));
        
        const cardPaid = document.getElementById('cardPaid');
        if (cardPaid) cardPaid.addEventListener('click', () => RecordsManager.openSummaryModal('Paid'));
        
        const cardUnpaid = document.getElementById('cardUnpaid');
        if (cardUnpaid) cardUnpaid.addEventListener('click', () => RecordsManager.openSummaryModal('Unpaid'));
    },

    openPaymentModal: () => {
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        if (checkedBoxes.length === 0) {
            return alert("Select at least one record to mark as paid.");
        }
        document.getElementById('selectedPaymentDate').value = new Date().toISOString().split('T')[0];
        const modal = document.getElementById('paymentModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    confirmMarkAsPaid: async () => {
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        const datePaid = document.getElementById('selectedPaymentDate').value;
        
        if (!datePaid) {
            return alert("Please select a date.");
        }

        const entryIds = Array.from(checkedBoxes).map(cb => cb.value);
        const btn = document.getElementById('confirmPaymentBtn');
        const originalBtnHTML = btn.innerHTML;

        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                action: 'update_payment',
                entryIds: entryIds,
                datePaid: datePaid
            });
            
            if (data.status === 'success') {
                const modal = document.getElementById('paymentModal');
                modal.classList.add('hidden');
                modal.classList.remove('flex');
                RecordsManager.fetchData(); 
            } else {
                alert("Failed to update records: " + (data.message || 'Unknown error'));
            }
        } catch (error) {
            alert("An error occurred while updating the records.");
            console.error("Payment Update Error:", error);
        } finally {
            btn.innerHTML = originalBtnHTML; 
            btn.disabled = false;
        }
    },

    openSummaryModal: (type) => {
        const start = document.getElementById('filterStart').value; 
        const end = document.getElementById('filterEnd').value; 
        const currentTab = document.getElementById('filterType').value; 

        // Filter the cached data exactly like the main view
        const filtered = RecordsManager.cachedData.filter(r => {
            if (currentTab === 'Paid' && r.Payment_Status !== 'Paid') return false;
            if (currentTab === 'Unpaid' && r.Payment_Status === 'Paid') return false;

            const d = currentTab === 'Paid' ? r.Date_Paid : r.Date;
            let match = true;
            if (start && (!d || d < start)) match = false;
            if (end && (!d || d > end)) match = false;
            return match;
        });

        const tbody = document.getElementById('summaryTableBody');
        const title = document.getElementById('summaryModalTitle');
        const col1 = document.getElementById('summaryCol1');
        const col2 = document.getElementById('summaryCol2');

        let map = {};
        let html = '';

        const formatDisplayDate = (dStr) => {
            if (!dStr) return '-';
            const date = new Date(dStr);
            return isNaN(date) ? dStr : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        };

        if (type === 'Paid') {
            title.innerText = 'Paid History';
            col1.innerText = 'Date Paid';
            col2.innerText = 'Amount';
            filtered.filter(r => r.Payment_Status === 'Paid').forEach(r => {
                const d = r.Date_Paid || 'Unknown';
                map[d] = (map[d] || 0) + Utils.parseCurrency(r.Total_Earnings);
            });
            Object.keys(map).sort((a, b) => b.localeCompare(a)).forEach(d => {
                html += `<tr class="hover:bg-gray-50"><td class="p-3 whitespace-nowrap">${d === 'Unknown' ? '-' : formatDisplayDate(d)}</td><td class="p-3 text-right font-bold text-gray-800">${Utils.formatCurrency(map[d])}</td></tr>`;
            });
        } else if (type === 'Unpaid') {
            title.innerText = 'Unpaid Records';
            col1.innerText = 'Record Date';
            col2.innerText = 'Amount';
            filtered.filter(r => r.Payment_Status !== 'Paid').forEach(r => {
                const d = r.Date;
                map[d] = (map[d] || 0) + Utils.parseCurrency(r.Total_Earnings);
            });
            Object.keys(map).sort((a, b) => b.localeCompare(a)).forEach(d => {
                html += `<tr class="hover:bg-gray-50"><td class="p-3 whitespace-nowrap">${formatDisplayDate(d)}</td><td class="p-3 text-right font-bold text-amber-600">${Utils.formatCurrency(map[d])}</td></tr>`;
            });
        } else if (type === 'Rendered') {
            title.innerText = 'Rendered Hours';
            col1.innerText = 'Record Date';
            col2.innerText = 'Hours';
            filtered.forEach(r => {
                const d = r.Date;
                map[d] = (map[d] || 0) + parseFloat(r.Total_Hours || 0);
            });
            Object.keys(map).sort((a, b) => b.localeCompare(a)).forEach(d => {
                html += `<tr class="hover:bg-gray-50"><td class="p-3 whitespace-nowrap">${formatDisplayDate(d)}</td><td class="p-3 text-right font-bold text-gray-800">${map[d]} hrs</td></tr>`;
            });
        }

        if (!html) html = `<tr><td colspan="2" class="p-6 text-center text-gray-400">No records found.</td></tr>`;
        tbody.innerHTML = html;

        const modal = document.getElementById('summaryModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    fetchData: async () => {
        const start = document.getElementById('filterStart').value; 
        const end = document.getElementById('filterEnd').value; 
        const type = document.getElementById('filterType').value; 
        const tbody = document.getElementById('dataTableBody');
        
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-blue-500"><i class="fas fa-spinner fa-spin text-xl"></i></td></tr>';
        
        try {
            const data = await API.get(CONFIG.ENDPOINTS.GET_DATA);
            RecordsManager.cachedData = data; 
            
            let h = 0, p = 0, u = 0;
            const filtered = data.filter(r => {
                // Ensure specific tabs explicitly omit the opposite status
                if (type === 'Paid' && r.Payment_Status !== 'Paid') return false;
                if (type === 'Unpaid' && r.Payment_Status === 'Paid') return false;

                const d = type === 'Paid' ? r.Date_Paid : r.Date;
                
                let match = true;
                if (start && (!d || d < start)) match = false;
                if (end && (!d || d > end)) match = false;

                if(match) {
                    h += parseFloat(r.Total_Hours || 0);
                    const earn = Utils.parseCurrency(r.Total_Earnings);
                    if(r.Payment_Status === 'Paid') p += earn; else u += earn;
                }
                return match;
            });

            document.getElementById('summaryHours').innerText = h;
            document.getElementById('summaryPaid').innerText = Utils.formatCurrency(p);
            document.getElementById('summaryUnpaid').innerText = Utils.formatCurrency(u);
            
            const selectAll = document.getElementById('selectAllRecords');
            if (selectAll) selectAll.checked = false;

            const formatDisplayDate = (dStr) => {
                if (!dStr) return '-';
                const date = new Date(dStr);
                return isNaN(date) ? dStr : date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
            };

            tbody.innerHTML = filtered.length ? filtered.map(r => `
                <tr class="hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                    <td class="px-2 py-2 text-center align-middle">${r.Payment_Status !== 'Paid' ? `<input type="checkbox" value="${r.Entry_ID}" class="record-checkbox w-3.5 h-3.5 rounded text-blue-600">` : ''}</td>
                    <td class="px-2 py-2 whitespace-nowrap text-left">
                        <div class="font-bold text-[11px] sm:text-xs text-gray-800">${formatDisplayDate(r.Date)}</div>
                        <div class="text-[9px] text-gray-500 mt-0.5">${r.University} - ${r.Subject_Code}</div>
                    </td>
                    <td class="px-2 py-2 whitespace-nowrap align-top text-center">
                        <span class="px-1.5 py-0.5 rounded text-[9px] font-bold inline-block ${r.Payment_Status==='Paid'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}">${r.Payment_Status}</span>
                        ${r.Date_Paid ? `<div class="text-[9px] text-gray-400 mt-1">${formatDisplayDate(r.Date_Paid)}</div>` : ''}
                    </td>
                    <td class="px-2 py-2 text-right align-middle">
                        <div class="font-bold text-[11px] sm:text-xs text-gray-700">${Utils.formatCurrency(Utils.parseCurrency(r.Total_Earnings))}</div>
                    </td>
                </tr>
            `).join('') : '<tr><td colspan="4" class="text-center py-6 text-gray-400">No records found.</td></tr>';
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-red-500 font-bold">Failed to load data.</td></tr>';
        }
    }
};
