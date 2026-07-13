export const CONFIG = {
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

export const Utils = {
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        }).format(parseFloat(amount) || 0);
    },
    
    parseCurrency: (amountStr) => {
        if (!amountStr) return 0;
        return parseFloat(String(amountStr).replace(/[^0-9.-]+/g, "")) || 0;
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

export const API = {
    get: async (endpoint, params = {}) => {
        const url = new URL(`${CONFIG.API_BASE}${endpoint}`);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    },
    
    post: async (endpoint, body) => {
        const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }
};
