// js/hours-logger.js
import { CONFIG, State } from './globals.js';

let scheduleCount = 0;

export function initHoursLogger() {
    const form = document.getElementById('logForm');
    const addBtn = document.getElementById('addScheduleBtn');
    
    // Clean and rebind the form submit listener
    if (form) {
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        newForm.addEventListener('submit', handleLogSubmit);
    }
    
    // Clean and rebind the add schedule button
    if (addBtn) {
        const newAddBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newAddBtn, addBtn);
        newAddBtn.addEventListener('click', addScheduleRow);
    }

    // Initialize with one schedule row if empty
    const container = document.getElementById('schedule-container');
    if (container && container.children.length === 0) {
        scheduleCount = 0;
        addScheduleRow();
    }
}

function addScheduleRow() {
    scheduleCount++;
    const container = document.getElementById('schedule-container');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'schedule-row bg-white p-4 rounded-lg border border-gray-200 shadow-sm relative';
    row.id = `schedule-${scheduleCount}`;
    
    // Add remove button if it's not the first row
    const removeBtnHTML = scheduleCount > 1 
        ? `<button type="button" onclick="this.closest('.schedule-row').remove()" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"><i class="fas fa-times"></i></button>`
        : '';

    row.innerHTML = `
        ${removeBtnHTML}
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label class="block text-xs font-semibold text-gray-700">Subject Code</label><input type="text" class="subj-code w-full border p-2 rounded-lg mt-1 outline-none" required></div>
            <div><label class="block text-xs font-semibold text-gray-700">Start Date</label><input type="date" class="start-date w-full border p-2 rounded-lg mt-1 outline-none" required></div>
            <div><label class="block text-xs font-semibold text-gray-700">End Date</label><input type="date" class="end-date w-full border p-2 rounded-lg mt-1 outline-none" required></div>
            <div><label class="block text-xs font-semibold text-gray-700">Start Time</label><input type="time" class="start-time w-full border p-2 rounded-lg mt-1 outline-none" required></div>
            <div><label class="block text-xs font-semibold text-gray-700">Hours per Session</label><input type="number" step="0.5" class="hours-session w-full border p-2 rounded-lg mt-1 outline-none" required></div>
        </div>
    `;
    container.appendChild(row);
}

// Utility to add hours to a start time to get the end time
function calculateEndTime(startTime, hours) {
    const [h, m] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, 0);
    date.setMinutes(date.getMinutes() + (hours * 60));
    return date.toTimeString().substring(0, 5);
}

async function handleLogSubmit(e) {
    e.preventDefault();
    
    if (!State.currentUser) return;

    const btn = document.getElementById('logSubmitBtn');
    const msg = document.getElementById('logStatusMsg');
    const originalText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    if (msg) msg.classList.add('hidden');

    const university = document.getElementById('commonUniversity').value;
    const college = document.getElementById('commonCollege').value;

    const rows = document.querySelectorAll('.schedule-row');
    const payloadRecords = [];
    
    // Batch Generation Logic: Loop through 7-day intervals
    rows.forEach(row => {
        const subjectCode = row.querySelector('.subj-code').value;
        const startDate = new Date(row.querySelector('.start-date').value);
        const endDate = new Date(row.querySelector('.end-date').value);
        const startTime = row.querySelector('.start-time').value;
        const hours = parseFloat(row.querySelector('.hours-session').value);
        const endTime = calculateEndTime(startTime, hours);

        let currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            payloadRecords.push({
                Entry_ID: crypto.randomUUID(), // Edge-native UUID generation
                Date: currentDate.toISOString().split('T')[0],
                Start_Time: startTime,
                End_Time: endTime,
                Total_Hours: hours,
                University: university,
                College: college,
                Subject_Code: subjectCode,
                Payment_Status: 'Unpaid',
                Date_Paid: null
            });
            // Increment by 7 days for weekly classes
            currentDate.setDate(currentDate.getDate() + 7);
        }
    });

    if (payloadRecords.length === 0) {
        if (msg) {
            msg.textContent = "No valid dates to log.";
            msg.className = "text-center text-sm mt-3 block font-bold text-red-500";
        }
        btn.innerHTML = originalText;
        btn.disabled = false;
        return;
    }

    try {
        const url = `${CONFIG.API_BASE}${CONFIG.ENDPOINTS.POST_ACTION || CONFIG.ENDPOINTS.ACTION}`;
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'add_hours_batch',
                user_id: State.currentUser.User_ID,
                records: payloadRecords
            })
        });
        
        const result = await res.json();

        if (result.success || result.status === 'success') {
            if (msg) {
                msg.textContent = `Successfully logged ${payloadRecords.length} sessions!`;
                msg.className = "text-center text-sm mt-3 block font-bold text-emerald-500";
            }
            e.target.reset();
            
            // Reset schedule container back to 1 row
            const container = document.getElementById('schedule-container');
            if (container) container.innerHTML = '';
            scheduleCount = 0;
            addScheduleRow();

        } else {
            if (msg) {
                msg.textContent = result.message || 'Failed to log sessions.';
                msg.className = "text-center text-sm mt-3 block font-bold text-red-500";
            }
        }
    } catch (error) {
        if (msg) {
            msg.textContent = "Network error. Please try again.";
            msg.className = "text-center text-sm mt-3 block font-bold text-red-500";
        }
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}
