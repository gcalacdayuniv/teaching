// records-viewer.js
import { CONFIG, Utils } from './globals.js';

export const RecordsManager = {
    init: () => {
        const fetchBtn = document.getElementById('fetchRecordsBtn');
        if (fetchBtn) fetchBtn.addEventListener('click', RecordsManager.fetchData);

        // Check All listener
        const selectAll = document.getElementById('selectAllRecords');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => {
                document.querySelectorAll('.record-checkbox').forEach(cb => {
                    cb.checked = e.target.checked;
                });
            });
        }

        // Mark Paid listener
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
        
        tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-blue-500"><i class="fas fa-spinner fa-spin text-2xl"></i></td></tr>';
        
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}`;
            const res = await fetch(url);
            const data = await res.json();
            
            let h = 0, p = 0, u = 0;
            const filtered = data.filter(r => {
                const d = type === 'Paid' ? r.Date_Paid : r.Date;
                
                // Flexible Filtering Logic
                let match = true;
                if (start && d < start) match = false;
                if (end && d > end) match = false;

                if(match) {
                    h += parseFloat(r.Total_Hours || 0);
                    const earn = parseFloat(String(r.Total_Earnings).replace(/[^0-9.-]+/g,"") || 0);
                    if(r.Payment_Status === 'Paid') p += earn; else u += earn;
                }
                return match;
            });

            document.getElementById('summaryHours').innerText = h;
            document.getElementById('summaryPaid').innerText = Utils.formatCurrency(p);
            document.getElementById('summaryUnpaid').innerText = Utils.formatCurrency(u);
            
            // Reset select all checkbox if it exists
            const selectAll = document.getElementById('selectAllRecords');
            if (selectAll) selectAll.checked = false;

            tbody.innerHTML = filtered.length ? filtered.map(r => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 text-center">${r.Payment_Status !== 'Paid' ? `<input type="checkbox" value="${r.Entry_ID}" class="record-checkbox w-4 h-4 rounded text-blue-600">` : ''}</td>
                    <td class="px-4 py-3 font-bold">${Utils.formatDateYYYYMMDD(r.Date)}</td>
                    <td class="px-4 py-3 text-[11px] sm:text-xs">${r.University}<br><span class="text-gray-400 font-normal">${r.College}</span></td>
                    <td class="px-4 py-3 text-[11px] sm:text-xs">${r.Subject_Code}</td>
                    <td class="px-4 py-3 font-bold">${r.Total_Hours}</td>
                    <td class="px-4 py-3">${Utils.formatCurrency(String(r.Total_Earnings).replace(/[^0-9.-]+/g,""))}</td>
                    <td class="px-4 py-3"><span class="px-2 py-1 rounded text-[10px] font-bold ${r.Payment_Status==='Paid'?'bg-green-100 text-green-700':'bg-amber-100 text-amber-700'}">${r.Payment_Status}</span></td>
                    <td class="px-4 py-3 text-[10px] text-gray-400 font-normal">${r.Date_Paid ? Utils.formatDateYYYYMMDD(r.Date_Paid) : '-'}</td>
                </tr>
            `).join('') : '<tr><td colspan="8" class="text-center py-10 text-gray-400">No records found.</td></tr>';
        } catch(e) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center py-10 text-red-500 font-bold">Failed to load data.</td></tr>';
        }
    },

    markAsPaid: async () => {
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        
        if (checkedBoxes.length === 0) {
            return alert("Select at least one record to mark as paid.");
        }

        const datePaid = prompt("Enter payment date (YYYY-MM-DD):", new Date().toISOString().split('T')[0]);
        if (!datePaid) return; // Action cancelled by the user

        const entryIds = Array.from(checkedBoxes).map(cb => cb.value);
        const btn = document.getElementById('markPaidBtn');
        const originalBtnHTML = btn ? btn.innerHTML : '';

        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            btn.disabled = true;
        }

        try {
            const response = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.ACTION}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_payment',
                    entryIds: entryIds,
                    datePaid: datePaid
                })
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                alert(`Successfully marked ${entryIds.length} records as paid.`);
                RecordsManager.fetchData(); // Refresh the table automatically
            } else {
                alert("Failed to update records: " + (data.message || 'Unknown error'));
            }
        } catch (error) {
            alert("An error occurred while updating the records.");
            console.error("Payment Update Error:", error);
        } finally {
            if (btn) {
                btn.innerHTML = originalBtnHTML; // Restore button state
                btn.disabled = false;
            }
        }
    }
};
