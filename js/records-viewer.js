// js/records-viewer.js

import { CONFIG, Utils, API } from './globals.js';

export const RecordsManager = {
    init: () => {
        const startInput = document.getElementById('filterStart');
        const endInput = document.getElementById('filterEnd');

        if (startInput) startInput.addEventListener('change', RecordsManager.fetchData);
        if (endInput) endInput.addEventListener('change', RecordsManager.fetchData);

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
        const originalBtnText = btn.innerText;

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
            btn.innerText = originalBtnText; 
            btn.disabled = false;
        }
    },

    fetchData: async () => {
        const start = document.getElementById('filterStart').value; 
        const end = document.getElementById('filterEnd').value; 
        const type = document.getElementById('filterType').value; 
        const tbody = document.getElementById('dataTableBody');
        
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-blue-500"><i class="fas fa-spinner fa-spin text-xl"></i></td></tr>';
        
        try {
            const data = await API.get(CONFIG.ENDPOINTS.GET_DATA);
            
            let h = 0, p = 0, u = 0;
            const filtered = data.filter(r => {
                const d = type === 'Paid' ? r.Date_Paid : r.Date;
                
                let match = true;
                if (start && d < start) match = false;
                if (end && d > end) match = false;

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
                    <td class="px-2 py-2 whitespace-nowrap">
                        <div class="font-bold text-[11px] sm:text-xs text-gray-800">${formatDisplayDate(r.Date)}</div>
                        <div class="text-[9px] text-gray-500 mt-0.5">${r.University} - ${r.Subject_Code}</div>
                    </td>
                    <td class="px-2 py-2 whitespace-nowrap align-top">
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
