// js/payment-ledger.js
import { CONFIG } from './globals.js';
import { AuthManager } from './auth.js';
import { RecordsManager } from './records-viewer.js';

export const LedgerManager = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        // Safely bind to avoid "Cannot read properties of null" errors
        const markBtn = document.getElementById('markPaidBtn');
        if (markBtn) markBtn.addEventListener('click', this.openPaymentModal.bind(this));
        
        const cancelBtn = document.getElementById('cancelPaymentBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', this.closePaymentModal.bind(this));
        
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) confirmBtn.addEventListener('click', this.processPayment.bind(this));
        
        const selectAll = document.getElementById('selectAllRecords');
        if (selectAll) selectAll.addEventListener('change', this.toggleSelectAll.bind(this));
    },
    
    toggleSelectAll(e) {
        const isChecked = e.target.checked;
        document.querySelectorAll('.record-checkbox').forEach(cb => {
            cb.checked = isChecked;
        });
    },
    
    openPaymentModal() {
        const selected = document.querySelectorAll('.record-checkbox:checked');
        if (selected.length === 0) {
            alert('Please select at least one unpaid record to mark as paid.');
            return;
        }
        
        document.getElementById('selectedPaymentDate').value = new Date().toISOString().split('T')[0];
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    },
    
    closePaymentModal() {
        const modal = document.getElementById('paymentModal');
        if (modal) {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }
    },
    
    async processPayment() {
        const selected = document.querySelectorAll('.record-checkbox:checked');
        const entryIds = Array.from(selected).map(cb => cb.dataset.id);
        const datePaid = document.getElementById('selectedPaymentDate').value;
        
        if (entryIds.length === 0 || !datePaid) return;
        
        const btn = document.getElementById('confirmPaymentBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
        
        const token = AuthManager.getToken();
        
        try {
            const res = await fetch(`${CONFIG.API_BASE}${CONFIG.ENDPOINTS.ACTION}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    action: 'update_payment',
                    entry_ids: entryIds,
                    date_paid: datePaid
                })
            });
            
            const result = await res.json();
            
            if (result.success) {
                this.closePaymentModal();
                
                // Uncheck select all
                const selectAll = document.getElementById('selectAllRecords');
                if (selectAll) selectAll.checked = false;
                
                // Trigger a refresh of the records view to show updated data
                if (typeof RecordsManager !== 'undefined') {
                    RecordsManager.fetchRecords();
                }
            } else {
                alert(result.message || 'Error updating payment.');
            }
        } catch (error) {
            alert('Network error while processing payment.');
        } finally {
            btn.innerHTML = 'Mark Paid';
            btn.disabled = false;
        }
    }
};
