import { CONFIG, API } from './globals.js';
import { FinanceUtils } from './finance-utils.js';
import { FinanceUI } from './finance-ui.js';
import { FinanceForm } from './finance-form.js';

export const FinanceManager = {
    recordEntries: [],
    currentProjectId: null,
    currentProjectName: null,
    currentPrefillGroup: null,
    rawData: {
        transactions: [],
        teachingHours: [],
        projects: []
    },

    ...FinanceUtils,
    ...FinanceUI,
    ...FinanceForm,

    init() {
        document.getElementById('financeRecordForm')?.addEventListener('submit', this.submitRecords.bind(this));
        document.getElementById('newProjectForm')?.addEventListener('submit', this.submitNewProject.bind(this));
    },

    async refreshLedger() {
        try {
            const user = JSON.parse(localStorage.getItem('professionalPortalUser'));
            if (!user) return;

            // 1. ALWAYS FETCH LOCAL DATA FIRST
            const [ledgerRes, projRes] = await Promise.all([
                API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_finance_ledger' }),
                API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_projects' })
            ]);

            if (ledgerRes.status === 'success' && projRes.status === 'success') {
                this.rawData = {
                    transactions: ledgerRes.transactions || [],
                    teachingHours: ledgerRes.teachingHours || [],
                    projects: projRes.projects || []
                };

                const fromInput = document.getElementById('finFilterFrom');
                if (!fromInput.value) {
                    const now = new Date();
                    // Setup GMT+8 default filtering
                    const dateStrManila = new Intl.DateTimeFormat('en-CA', { 
                        timeZone: 'Asia/Manila', 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                    }).format(now);
                    const [year, month] = dateStrManila.split('-');
                    fromInput.value = `${year}-${month}-01`;
                }

                // 2. RENDER LOCAL DATA IMMEDIATELY
                this.applyFilter();

                // 3. FETCH EXTERNAL DATA IN THE BACKGROUND
                // Notice there is no 'await' here. It runs without blocking the UI.
                this.loadExternalDatabases(user.User_ID);
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
        }
    },

    async loadExternalDatabases(userId) {
        try {
            // Ask the local database for the user's saved API links
            const response = await fetch(window.APP_CONFIG?.API_URL || CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_imported_databases', User_ID: userId })
            });
            const importedRes = await response.json();

            if (importedRes.success && importedRes.databases && importedRes.databases.length > 0) {
                let externalTransactions = [];

                for (const db of importedRes.databases) {
                    try {
                        // Call the external API expecting the Standard Contract
                        const extRes = await fetch(db.API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'ProfessionalFinanceDashboard' }) 
                        });
                        
                        const extData = await extRes.json();

                        // If standard data is found, map it to our UI format
                        if (extData.success && extData.data && extData.data.transactions) {
                            const mapped = extData.data.transactions.map(t => ({
                                Transaction_ID: t.id,
                                Date: t.date,
                                Type: t.type,
                                Main_Group: db.Project_Name,  // e.g. "Etch Data"
                                Sub_Group_1: t.project_name,  // The specific project passed by the API
                                Description: t.description,
                                Amount: Number(t.amount),
                                isExternal: true              // Prevents editing in the local UI
                            }));
                            externalTransactions.push(...mapped);
                        }
                    } catch (e) {
                        // If one external API is offline or fails, it just logs it and moves to the next one
                        console.warn(`Failed to fetch from ${db.Project_Name}:`, e);
                    }
                }

                // If any external data was successfully fetched, merge it and update the screen
                if (externalTransactions.length > 0) {
                    this.rawData.transactions = [...this.rawData.transactions, ...externalTransactions];
                    this.applyFilter();
                }
            }
        } catch (error) {
            console.error("Error processing external databases:", error);
        }
    },

    clearFilter() {
        document.getElementById('finFilterFrom').value = '';
        document.getElementById('finFilterTo').value = '';
        this.applyFilter();
    },

    applyFilter() {
        const fromStr = document.getElementById('finFilterFrom').value;
        const toStr = document.getElementById('finFilterTo').value;
        const fromDate = fromStr ? new Date(fromStr) : null;
        const toDate = toStr ? new Date(toStr) : null;

        const dateFilter = (dateString) => {
            if (!fromDate && !toDate) return true;
            
            let d;
            try {
                const manilaStr = new Intl.DateTimeFormat('en-US', { 
                    timeZone: 'Asia/Manila', 
                    year: 'numeric', 
                    month: 'numeric', 
                    day: 'numeric' 
                }).format(new Date(dateString));
                d = new Date(manilaStr);
            } catch (e) {
                d = new Date(dateString);
            }

            d.setHours(0,0,0,0);
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        };

        const filteredTx = this.rawData.transactions.filter(t => dateFilter(t.Date));
        const filteredTh = this.rawData.teachingHours.filter(th => dateFilter(th.Date_Paid || th.Date));

        this.renderCards(filteredTx, filteredTh, this.rawData.projects);
    }
};

window.FinanceManager = FinanceManager;
