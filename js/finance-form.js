export function initFinanceForms() {
    const logForm = document.getElementById('logForm');
    const batchForm = document.getElementById('batchForm');

    if (logForm) {
        logForm.addEventListener('submit', handleLogTeachingLoad);
    }
    if (batchForm) {
        batchForm.addEventListener('submit', handleBatchTeachingLoad);
    }
}

function handleLogTeachingLoad(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const date = formData.get('date');
    const hours = parseFloat(formData.get('hours'));
    const rate = parseFloat(formData.get('rate'));

    if (!date || isNaN(hours) || isNaN(rate)) {
        console.error('Invalid input values for teaching load.');
        return;
    }

    const totalAmount = hours * rate;

    const teachingLoadRecord = {
        type: 'Teaching Load',
        date: date,
        hours: hours,
        rate: rate,
        total: totalAmount,
        loggedAt: new Date().toISOString()
    };

    saveTeachingLoad(teachingLoadRecord);
    event.target.reset();
}

function handleBatchTeachingLoad(event) {
    event.preventDefault();

    const fileInput = document.getElementById('batchData');
    if (!fileInput.files.length) {
        console.error('No file selected for batch teaching load.');
        return;
    }

    const file = fileInput.files[0];
    
    // Logic for parsing the CSV and processing the batch teaching load
    console.log(`Processing batch teaching load from file: ${file.name}`);
    
    event.target.reset();
}

function saveTeachingLoad(record) {
    try {
        const existingLoads = JSON.parse(localStorage.getItem('teachingLoads') || '[]');
        existingLoads.push(record);
        localStorage.setItem('teachingLoads', JSON.stringify(existingLoads));
        
        // Dispatch custom event for modular UI updates
        window.dispatchEvent(new CustomEvent('teachingLoadAdded', { detail: record }));
    } catch (error) {
        console.error('Failed to save teaching load:', error);
    }
}

// Initialize if script is loaded directly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFinanceForms);
} else {
    initFinanceForms();
}
