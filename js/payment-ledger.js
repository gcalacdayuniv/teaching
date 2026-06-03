import { CONFIG } from './globals.js';
import { fetchRecords } from './records-viewer.js';

export function initLedger() {
    const markPaidBtn = document.getElementById('markPaidBtn');
    const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
    const cancelPaymentBtn = document.getElementById('cancelPaymentBtn');

    if (markPaidBtn) markPaidBtn.addEventListener('click', openPaymentModal);
    if (cancelPaymentBtn) cancelPaymentBtn.addEventListener('click', closePaymentModal);
    if (confirmPaymentBtn) confirmPaymentBtn.addEventListener('click', processPayment);

    // Use event delegation for dynamically created checkboxes
    document.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'selectAllRecords') {
            const isChecked = e.target.checked;
            document.querySelectorAll('.record-checkbox').forEach(cb => {
                cb.checked = isChecked;
            });
        }
    });
}

function openPaymentModal() {
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
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
    }
}

async function processPayment() {
    const selected = document.querySelectorAll('.record-checkbox:checked');
    const entryIds = Array.from(selected).map(cb => cb.dataset.id);
    const datePaid = document.getElementById('selectedPaymentDate').value;
    
    if (entryIds.length === 0 || !datePaid) return;
    
    const btn = document.getElementById('confirmPaymentBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    
    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION || CONFIG.ENDPOINTS.ACTION}`;
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
            closePaymentModal();
            
            const selectAll = document.getElementById('selectAllRecords');
            if (selectAll) selectAll.checked = false;
            
            await fetchRecords();
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
