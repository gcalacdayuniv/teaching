// hours-logger.js
import { CONFIG } from './globals.js';

export const LoggerManager = {
    init: () => {
        document.getElementById('logForm').addEventListener('submit', LoggerManager.submitForm);
        LoggerManager.loadAutocomplete();
    },

    loadAutocomplete: async () => {
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}`;
            const res = await fetch(url);
            const data = await res.json();
            
            document.getElementById('uniList').innerHTML = [...new Set(data.map(d => d.University).filter(Boolean))].map(u => `<option value="${u}">`).join('');
            document.getElementById('colList').innerHTML = [...new Set(data.map(d => d.College).filter(Boolean))].map(c => `<option value="${c}">`).join('');
            document.getElementById('subList').innerHTML = [...new Set(data.map(d => d.Subject_Code).filter(Boolean))].map(s => `<option value="${s}">`).join('');
        } catch(e) {
            console.error("Autocomplete load failed", e);
        }
    },

    submitForm: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('logSubmitBtn');
        const msg = document.getElementById('logStatusMsg');
        btn.disabled = true; msg.textContent = "Saving..."; msg.className = "text-center text-sm text-blue-600 block mt-3";
        
        const payload = {
            action: 'add_hours',
            Date: document.getElementById('date').value,
            Start_Time: document.getElementById('startTime').value,
            End_Time: document.getElementById('endTime').value,
            Total_Hours: document.getElementById('hours').value,
            University: document.getElementById('university').value,
            College: document.getElementById('college').value,
            Subject_Code: document.getElementById('subject').value
        };

        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`;
            await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
            msg.textContent = "Saved Successfully!"; msg.className = "text-center text-sm text-green-600 block font-bold mt-3";
            document.getElementById('logForm').reset();
        } catch(e) { 
            msg.textContent = "Error saving record."; msg.className = "text-center text-sm text-red-600 block mt-3"; 
        }
        btn.disabled = false;
    }
};