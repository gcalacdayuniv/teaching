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
            markPaidBtn.addEventListener('click', RecordsManager.markAsPaid);
        }
    },

    fetchData: async () => {
        const start = document.getElementById('filterStart').value; 
        const end = document.getElementById('filterEnd').value; 
        const type = document.getElementById('filterType').value; 
        const tbody = document.getElementById('dataTableBody');
        
        tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-blue-500"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>';
        
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
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 text-center">${r.Payment_Status !== 'Paid' ? `<input type="checkbox" value="${r.Entry_ID}" class="record-checkbox w-4 h-4 rounded text-blue-600">` : ''}</td>
                    <td class="px-4 py-3 font-bold whitespace-nowrap">${formatDisplayDate(r.Date)}</td>
                    <td class="px-4 py-3 text-[11px] sm:text-xs">${r.University}<br><span class="text-gray-400 font-normal">${r.Subject_Code}</span></td>
                    <td class="px-4 py-3">
                        <div class="font-bold">${Utils.formatCurrency(Utils.parseCurrency(r.Total_Earnings))}</div>
                        <span class="px-2 py-0.5 rounded text-[9px] font-bold inline-block mt-0.5 ${r.Payment_Status==='Paid'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}">${r.Payment_Status}</span>
                    </td>
                    <td class="px-4 py-3 text-[10px] text-gray-400 font-normal whitespace-nowrap">${r.Date_Paid ? formatDisplayDate(r.Date_Paid) : '-'}</td>
                </tr>
            `).join('') : '<tr><td colspan="5" class="text-center py-10 text-gray-400">No records found.</td></tr>';
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-red-500 font-bold">Failed to load data.</td></tr>';
        }
    },

    markAsPaid: async () => {
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            return alert("Select at least one record to mark as paid.");
        }

        const datePaid = prompt("Enter payment date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        if (!datePaid) return; 

        const entryIds = Array.from(checkedBoxes).map(cb => cb.value);
        const btn = document.getElementById('markPaidBtn');
        const originalBtnHTML = btn ? btn.innerHTML : '';

        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            btn.disabled = true;
        }

        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                action: 'update_payment',
                entryIds: entryIds,
                datePaid: datePaid
            });
            
            if (data.status === 'success') {
                alert(`Successfully marked ${entryIds.length} records as paid.`);
                RecordsManager.fetchData(); 
            } else {
                alert("Failed to update records: " + (data.message || 'Unknown error'));
            }
        } catch (error) {
            alert("An error occurred while updating the records.");
            console.error("Payment Update Error:", error);
        } finally {
            if (btn) {
                btn.innerHTML = originalBtnHTML; 
                btn.disabled = false;
            }
        }
    }
};
