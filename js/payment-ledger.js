// js/payment-ledger.js
import { CONFIG } from './globals.js';
import { RecordsManager } from './records-viewer.js';

export const LedgerManager = {
    init() {
        this.bindEvents();
    },
    
    bindEvents() {
        const markBtn = document.getElementById('markPaidBtn');
        if (markBtn) markBtn.addEventListener('click', this.openPaymentModal.bind(this));
        
        const cancelBtn = document.getElementById('cancelPaymentBtn');
        if (cancelBtn) cancelBtn.addEventListener('click', this.closePaymentModal.bind(this));
        
        const confirmBtn = document.getElementById('confirmPaymentBtn');
        if (confirmBtn) confirmBtn.addEventListener('click', this.processPayment.bind(this));
        
        // Use event delegation for checkboxes since they are generated dynamically
        document.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'selectAllRecords') {
                this.toggleSelectAll(e);
            }
        });
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
        
        const dateInput = document.getElementById('selectedPaymentDate');
        if(dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        
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
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        btn.disabled = true;
        
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_payment',
                    entry_ids: entryIds,
                    date_paid: datePaid
                })
            });
            
            const result = await res.json();
            
            if (result.success || result.status === 'success') {
                this.closePaymentModal();
                
                const selectAll = document.getElementById('selectAllRecords');
                if (selectAll) selectAll.checked = false;
                
                if (typeof RecordsManager !== 'undefined') {
                    RecordsManager.fetchRecords();
                }
            } else {
                alert(result.message || 'Error updating payment.');
            }
        } catch (error) {
            alert('Network error while processing payment.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }
};
