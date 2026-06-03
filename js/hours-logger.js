// js/hours-logger.js
import { CONFIG } from './globals.js';

export const LoggerManager = {
    init: () => {
        document.getElementById('logForm').addEventListener('submit', LoggerManager.submitForm);
        document.getElementById('addScheduleBtn').addEventListener('click', LoggerManager.addScheduleBlock);
        
        // Listen for input changes inside the container to auto-calculate time
        document.getElementById('schedule-container').addEventListener('input', LoggerManager.handleInputEvent);
        
        // Load autocompletes and set initial block
        LoggerManager.loadAutocomplete();
        LoggerManager.addScheduleBlock(); // Mounts the first empty schedule block
    },

    // --- DOM Injection & Event Delegation ---
    addScheduleBlock: () => {
        const container = document.getElementById('schedule-container');
        const id = Date.now(); // Unique ID for this block

        const block = document.createElement('div');
        block.className = 'schedule-block relative border rounded-lg p-4 bg-white shadow-sm';
        block.innerHTML = `
            <button type="button" class="remove-block-btn absolute top-2 right-2 text-red-400 hover:text-red-600 transition p-2">
                <i class="fas fa-times"></i>
            </button>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div><label class="block text-xs font-semibold text-gray-700">Subject Code</label><input type="text" name="subject" list="subList" required class="w-full border p-2 rounded-lg mt-1 outline-none focus:ring-1 focus:ring-blue-500"></div>
                <div><label class="block text-xs font-semibold text-gray-700">Hours per Session</label><input type="number" name="hours" step="0.5" required class="w-full border p-2 rounded-lg mt-1 outline-none focus:ring-1 focus:ring-blue-500"></div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div><label class="block text-xs font-semibold text-gray-700">Start Date</label><input type="date" name="startDate" required class="w-full border p-2 rounded-lg mt-1 outline-none text-xs sm:text-sm"></div>
                <div><label class="block text-xs font-semibold text-gray-700">End Date</label><input type="date" name="endDate" required class="w-full border p-2 rounded-lg mt-1 outline-none text-xs sm:text-sm"></div>
                <div><label class="block text-xs font-semibold text-gray-700">Start Time</label><input type="time" name="startTime" required class="w-full border p-2 rounded-lg mt-1 outline-none text-xs sm:text-sm"></div>
                <div><label class="block text-xs font-semibold text-gray-700">End Time (Auto)</label><input type="time" name="endTime" readonly class="w-full border-none bg-gray-100 p-2 rounded-lg mt-1 outline-none text-xs sm:text-sm font-bold text-gray-500 pointer-events-none"></div>
            </div>
        `;
        container.appendChild(block);

        // Bind delete button
        block.querySelector('.remove-block-btn').addEventListener('click', () => {
            if (container.children.length > 1) {
                block.remove();
            } else {
                alert("You must have at least one schedule item.");
            }
        });
    },

    handleInputEvent: (e) => {
        // If the user changes 'startTime' or 'hours', recalculate the 'endTime' for that specific block
        if (e.target.name === 'startTime' || e.target.name === 'hours') {
            const block = e.target.closest('.schedule-block');
            const startTimeStr = block.querySelector('input[name="startTime"]').value;
            const hoursVal = block.querySelector('input[name="hours"]').value;
            const endTimeInput = block.querySelector('input[name="endTime"]');

            if (startTimeStr && hoursVal) {
                // Time Math
                const [h, m] = startTimeStr.split(':').map(Number);
                const totalMinutes = (h * 60) + m + (parseFloat(hoursVal) * 60);
                const endH = Math.floor(totalMinutes / 60) % 24;
                const endM = Math.round(totalMinutes % 60);
                
                endTimeInput.value = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
            } else {
                endTimeInput.value = "";
            }
        }
    },

    loadAutocomplete: async () => {
        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.GET_DATA}`;
            const res = await fetch(url);
            const data = await res.json();
            
            document.getElementById('uniList').innerHTML = [...new Set(data.map(d => d.University).filter(Boolean))].map(u => `<option value="${u}">`).join('');
            document.getElementById('colList').innerHTML = [...new Set(data.map(d => d.College).filter(Boolean))].map(c => `<option value="${c}">`).join('');
            document.getElementById('subList').innerHTML = [...new Set(data.map(d => d.Subject_Code).filter(Boolean))].map(s => `<option value="${s}">`).join('');
        } catch(e) {}
    },

    // --- Submitting & Processing ---
    submitForm: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('logSubmitBtn');
        const msg = document.getElementById('logStatusMsg');
        btn.disabled = true; msg.textContent = "Processing batch... Please wait."; msg.className = "text-center text-sm text-blue-600 block mt-3 font-bold";
        
        const commonUniversity = document.getElementById('commonUniversity').value;
        const commonCollege = document.getElementById('commonCollege').value;

        // Collect all blocks and generate records
        const allGeneratedRecords = [];
        const blocks = document.querySelectorAll('.schedule-block');

        for (let block of blocks) {
            const subject = block.querySelector('input[name="subject"]').value;
            const hours = block.querySelector('input[name="hours"]').value;
            const startDateStr = block.querySelector('input[name="startDate"]').value;
            const endDateStr = block.querySelector('input[name="endDate"]').value;
            const startTime = block.querySelector('input[name="startTime"]').value;
            const endTime = block.querySelector('input[name="endTime"]').value;

            // Generate dates looping by 7 days
            let currentDate = new Date(startDateStr);
            const limitDate = new Date(endDateStr);

            // Safety check
            if (currentDate > limitDate) {
                alert(`Error: Start Date for ${subject} is after the End Date.`);
                btn.disabled = false;
                msg.classList.add('hidden');
                return;
            }

            while (currentDate <= limitDate) {
                // Ensure date format YYYY-MM-DD
                const yyyy = currentDate.getFullYear();
                const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
                const dd = String(currentDate.getDate()).padStart(2, '0');
                
                allGeneratedRecords.push({
                    University: commonUniversity,
                    College: commonCollege,
                    Subject_Code: subject,
                    Total_Hours: hours,
                    Start_Time: startTime,
                    End_Time: endTime,
                    Date: `${yyyy}-${mm}-${dd}`
                });

                // Add 7 days
                currentDate.setDate(currentDate.getDate() + 7);
            }
        }

        const payload = {
            action: 'add_hours_batch',
            records: allGeneratedRecords
        };

        try {
            const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION}`;
            const res = await fetch(url, { method: 'POST', body: JSON.stringify(payload) });
            const data = await res.json();
            
            if (data.status === 'success') {
                msg.textContent = `Successfully generated and saved ${data.count} sessions!`; 
                msg.className = "text-center text-sm text-green-600 block font-bold mt-3";
                
                // Reset form completely, then re-mount one empty schedule block
                document.getElementById('logForm').reset();
                document.getElementById('schedule-container').innerHTML = '';
                LoggerManager.addScheduleBlock();
            } else {
                throw new Error("Server rejected batch.");
            }
        } catch(e) { 
            msg.textContent = "Error saving records. Check connection."; 
            msg.className = "text-center text-sm text-red-600 block font-bold mt-3"; 
        }
        btn.disabled = false;
    }
};
