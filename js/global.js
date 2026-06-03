// globals.js

export const CONFIG = {
    // The URL of your new Cloudflare Worker API
    API_BASE: 'https://teachapi.plv.workers.dev',
    ENDPOINTS: {
        GET_DATA: '/api/data',
        POST_ACTION: '/api/action'
    }
};

export const State = {
    currentUser: null,
    teachingData: [],
    resourceData: []
};

// Shared Utility Functions
export const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        }).format(parseFloat(amount) || 0);
    },
    
    formatDateYYYYMMDD: (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr; 
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};