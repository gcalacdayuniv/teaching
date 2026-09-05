import { CONFIG, Utils, API } from './globals.js';

export const RecordsManager = {
    cachedData: [],

    init: () => {
        const startInput = document.getElementById('filterStart');
        const endInput = document.getElementById('filterEnd');
        const clearDatesBtn = document.getElementById('clearDatesBtn');

        // Automatically default filter strictly to the current month when the module initializes
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        if (startInput) startInput.value = Utils.formatDateYYYYMMDD(firstDay);
        if (endInput) endInput.value = Utils.formatDateYYYYMMDD(lastDay);

        if (startInput) startInput.addEventListener('change', RecordsManager.fetchData);
        if (endInput) endInput.addEventListener('change', RecordsManager.fetchData);
        
        if (clearDatesBtn) {
            clearDatesBtn.addEventListener('click', () => {
                if (startInput) startInput.value = '';
                if (endInput) endInput.value = '';
                RecordsManager.fetchData();
            });
        }

        // Previous and Next Month Toggle Buttons
        document.getElementById('prevMonthBtn')?.addEventListener('click', () => RecordsManager.shiftMonth(-1));
        document.getElementById('nextMonthBtn')?.addEventListener('click', () => RecordsManager.shiftMonth(1));

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

        // Action Buttons Events
        const markPaidBtn = document.getElementById('markPaidBtn');
        if (markPaidBtn) markPaidBtn.addEventListener('click', RecordsManager.openPaymentModal);

        const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');
        if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', () => RecordsManager.closeModal('paymentModal'));

        const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
        if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', RecordsManager.confirmMarkAsPaid);

        // Edit and Delete Events
        document.getElementById('editRecordsBtn')?.addEventListener('click', RecordsManager.openEditModal);
        document.getElementById('deleteRecordsBtn')?.addEventListener('click', RecordsManager.deleteSelectedRecords);
        document.getElementById('closeEditRecordsBtn')?.addEventListener('click', () => RecordsManager.closeModal('editRecordsModal'));
        document.getElementById('cancelEditRecordsBtn')?.addEventListener('click', () => RecordsManager.closeModal('editRecordsModal'));
        document.getElementById('editRecordsForm')?.addEventListener('submit', RecordsManager.submitEdits);

        // Duplicate Events
        document.getElementById('duplicateRecordsBtn')?.addEventListener('click', RecordsManager.openDuplicateModal);
        document.getElementById('closeDuplicateRecordsBtn')?.addEventListener('click', () => RecordsManager.closeModal('duplicateRecordsModal'));
        document.getElementById('cancelDuplicateRecordsBtn')?.addEventListener('click', () => RecordsManager.closeModal('duplicateRecordsModal'));
        document.getElementById('duplicateRecordsForm')?.addEventListener('submit', RecordsManager.submitDuplicates);

        // Summary Modals Events
        const closeSummaryBtn = document.getElementById('closeSummaryBtn');
        if (closeSummaryBtn) closeSummaryBtn.addEventListener('click', () => RecordsManager.closeModal('summaryModal'));

        const cardRendered = document.getElementById('cardRendered');
        if (cardRendered) cardRendered.addEventListener('click', () => RecordsManager.openSummaryModal('Rendered'));
        
        const cardPaid = document.getElementById('cardPaid');
        if (cardPaid) cardPaid.addEventListener('click', () => RecordsManager.openSummaryModal('Paid'));
        
        const cardUnpaid = document.getElementById('cardUnpaid');
        if (cardUnpaid) cardUnpaid.addEventListener('click', () => RecordsManager.openSummaryModal('Unpaid'));
    },

    shiftMonth: (offset) => {
        const startInput = document.getElementById('filterStart');
        const endInput = document.getElementById('filterEnd');
        
        let baseDate = new Date();
        if (startInput && startInput.value) {
            const parsed = new Date(startInput.value);
            if (!isNaN(parsed.getTime())) {
                baseDate = parsed;
            }
        }

        const newDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
        const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);

        if (startInput) startInput.value = Utils.formatDateYYYYMMDD(firstDay);
        if (endInput) endInput.value = Utils.formatDateYYYYMMDD(lastDay);
        
        RecordsManager.fetchData();
    },

    closeModal: (id) => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden'); 
            el.classList.remove('flex');
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
                RecordsManager.closeModal('paymentModal');
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

    openEditModal: () => {
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        if (checkedBoxes.length === 0) return alert("Select at least one record to edit.");

        const container = document.getElementById('editRecordsContainer');
        container.innerHTML = '';

        Array.from(checkedBoxes).forEach(cb => {
            const record = RecordsManager.cachedData.find(r => r.Entry_ID === cb.value);
            if(!record) return;

            // Recalculate original rate automatically
            const rate = (parseFloat(record.Total_Hours) > 0) ? (Utils.parseCurrency(record.Total_Earnings) / parseFloat(record.Total_Hours)).toFixed(2) : 0;

            const block = document.createElement('div');
            block.className = 'bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm relative edit-record-block';
            block.innerHTML = `
                <input type="hidden" name="edit_Entry_ID" value="${record.Entry_ID}">
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label><input type="date" name="edit_Date" value="${Utils.formatDateYYYYMMDD(record.Date)}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">University</label><input type="text" name="edit_University" value="${record.University || ''}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">College</label><input type="text" name="edit_College" value="${record.College || ''}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subject</label><input type="text" name="edit_Subject_Code" value="${record.Subject_Code || ''}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50"></div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Time</label><input type="time" name="edit_Start_Time" value="${record.Start_Time || ''}" class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 time-input bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Hours</label><input type="number" step="0.5" name="edit_Total_Hours" value="${record.Total_Hours || 0}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 hours-input bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hourly Rate</label><input type="number" step="0.01" name="edit_Rate" value="${rate}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-blue-500 rate-input bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Time</label><input type="time" name="edit_End_Time" value="${record.End_Time || ''}" class="w-full border-none bg-gray-100 p-2 rounded text-xs outline-none font-bold text-gray-500 pointer-events-none end-time-input" readonly></div>
                </div>
            `;
            container.appendChild(block);

            // Automatically recalculate end-time dynamically inside the modal form based on the updated edits
            block.addEventListener('input', (e) => {
                if(e.target.classList.contains('time-input') || e.target.classList.contains('hours-input')) {
                    const startStr = block.querySelector('.time-input').value;
                    const hrs = parseFloat(block.querySelector('.hours-input').value) || 0;
                    if(startStr && hrs) {
                        const [h, m] = startStr.split(':').map(Number);
                        const totalM = (h * 60) + m + (hrs * 60);
                        const endH = Math.floor(totalM / 60) % 24;
                        const endM = Math.round(totalM % 60);
                        block.querySelector('.end-time-input').value = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                    }
                }
            });
        });

        const modal = document.getElementById('editRecordsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    submitEdits: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveEditRecordsBtn');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
        btn.disabled = true;

        const container = document.getElementById('editRecordsContainer');
        const blocks = container.querySelectorAll('.edit-record-block');
        const recordsToUpdate = [];

        blocks.forEach(block => {
            const hrs = parseFloat(block.querySelector('input[name="edit_Total_Hours"]').value) || 0;
            const rate = parseFloat(block.querySelector('input[name="edit_Rate"]').value) || 0;
            recordsToUpdate.push({
                Entry_ID: block.querySelector('input[name="edit_Entry_ID"]').value,
                Date: block.querySelector('input[name="edit_Date"]').value,
                University: block.querySelector('input[name="edit_University"]').value,
                College: block.querySelector('input[name="edit_College"]').value,
                Subject_Code: block.querySelector('input[name="edit_Subject_Code"]').value,
                Start_Time: block.querySelector('input[name="edit_Start_Time"]').value,
                End_Time: block.querySelector('input[name="edit_End_Time"]').value,
                Total_Hours: hrs,
                Total_Earnings: hrs * rate
            });
        });

        try {
            const res = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                action: 'edit_hours_batch',
                records: recordsToUpdate
            });

            if(res.status === 'success') {
                RecordsManager.closeModal('editRecordsModal');
                RecordsManager.fetchData();
            } else {
                alert("Error updating records: " + (res.message || 'Unknown error'));
            }
        } catch(err) {
            alert("Failed to save changes. Please check network connection.");
        } finally {
            btn.innerHTML = origHTML;
            btn.disabled = false;
        }
    },

    openDuplicateModal: () => {
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        if (checkedBoxes.length === 0) return alert("Select at least one record to duplicate.");

        const container = document.getElementById('duplicateRecordsContainer');
        container.innerHTML = '';

        Array.from(checkedBoxes).forEach(cb => {
            const record = RecordsManager.cachedData.find(r => r.Entry_ID === cb.value);
            if(!record) return;

            const rate = (parseFloat(record.Total_Hours) > 0) ? (Utils.parseCurrency(record.Total_Earnings) / parseFloat(record.Total_Hours)).toFixed(2) : 0;

            const block = document.createElement('div');
            block.className = 'bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm relative duplicate-record-block';
            block.innerHTML = `
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">New Date</label><input type="date" name="dup_Date" value="${Utils.formatDateYYYYMMDD(new Date())}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">University</label><input type="text" name="dup_University" value="${record.University || ''}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">College</label><input type="text" name="dup_College" value="${record.College || ''}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subject</label><input type="text" name="dup_Subject_Code" value="${record.Subject_Code || ''}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-green-500 bg-gray-50"></div>
                </div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Start Time</label><input type="time" name="dup_Start_Time" value="${record.Start_Time || ''}" class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-green-500 time-input bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Total Hours</label><input type="number" step="0.5" name="dup_Total_Hours" value="${record.Total_Hours || 0}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-green-500 hours-input bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Hourly Rate</label><input type="number" step="0.01" name="dup_Rate" value="${rate}" required class="w-full border p-2 rounded text-xs outline-none focus:ring-1 focus:ring-green-500 rate-input bg-gray-50"></div>
                    <div><label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">End Time</label><input type="time" name="dup_End_Time" value="${record.End_Time || ''}" class="w-full border-none bg-gray-100 p-2 rounded text-xs outline-none font-bold text-gray-500 pointer-events-none end-time-input" readonly></div>
                </div>
            `;
            container.appendChild(block);

            block.addEventListener('input', (e) => {
                if(e.target.classList.contains('time-input') || e.target.classList.contains('hours-input')) {
                    const startStr = block.querySelector('.time-input').value;
                    const hrs = parseFloat(block.querySelector('.hours-input').value) || 0;
                    if(startStr && hrs) {
                        const [h, m] = startStr.split(':').map(Number);
                        const totalM = (h * 60) + m + (hrs * 60);
                        const endH = Math.floor(totalM / 60) % 24;
                        const endM = Math.round(totalM % 60);
                        block.querySelector('.end-time-input').value = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
                    }
                }
            });
        });

        const modal = document.getElementById('duplicateRecordsModal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    },

    submitDuplicates: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('saveDuplicateRecordsBtn');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
        btn.disabled = true;

        const container = document.getElementById('duplicateRecordsContainer');
        const blocks = container.querySelectorAll('.duplicate-record-block');
        const newRecords = [];

        blocks.forEach(block => {
            newRecords.push({
                Date: block.querySelector('input[name="dup_Date"]').value,
                University: block.querySelector('input[name="dup_University"]').value,
                College: block.querySelector('input[name="dup_College"]').value,
                Subject_Code: block.querySelector('input[name="dup_Subject_Code"]').value,
                Start_Time: block.querySelector('input[name="dup_Start_Time"]').value,
                End_Time: block.querySelector('input[name="dup_End_Time"]').value,
                Total_Hours: parseFloat(block.querySelector('input[name="dup_Total_Hours"]').value) || 0,
                Rate: parseFloat(block.querySelector('input[name="dup_Rate"]').value) || 0
            });
        });

        try {
            const res = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                action: 'add_hours_batch',
                records: newRecords
            });

            if(res.status === 'success') {
                RecordsManager.closeModal('duplicateRecordsModal');
                RecordsManager.fetchData();
            } else {
                alert("Error duplicating records: " + (res.message || 'Unknown error'));
            }
        } catch(err) {
            alert("Failed to duplicate records. Please check network connection.");
        } finally {
            btn.innerHTML = origHTML;
            btn.disabled = false;
        }
    },

    deleteSelectedRecords: async () => {
        const checkedBoxes = document.querySelectorAll('.record-checkbox:checked');
        if (checkedBoxes.length === 0) return alert("Select at least one record to delete.");

        if (!confirm(`Are you sure you want to delete ${checkedBoxes.length} record(s)? This action cannot be undone.`)) return;

        const entryIds = Array.from(checkedBoxes).map(cb => cb.value);
        const btn = document.getElementById('deleteRecordsBtn');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const res = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                action: 'delete_hours_batch',
                entryIds: entryIds
            });

            if(res.status === 'success') {
                RecordsManager.fetchData();
            } else {
                alert("Error deleting records: " + (res.message || 'Unknown error'));
            }
        } catch(err) {
            alert("Failed to delete records. Please check network connection.");
        } finally {
            btn.innerHTML = origHTML;
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
