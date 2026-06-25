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
            // EXACT RESTORATION OF YOUR WORKING LOCAL FETCH
            const [ledgerRes, projRes] = await Promise.all([
                API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_finance_ledger' }),
                API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_projects' })
            ]);

            if (ledgerRes.status === 'success' && projRes.status === 'success') {
                this.rawData = {
                    transactions: ledgerRes.transactions,
                    teachingHours: ledgerRes.teachingHours,
                    projects: projRes.projects
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

                // Render local data instantly
                this.applyFilter();

                // Fire the external fetch in the background without halting the UI
                // We rely on your API wrapper to handle the user context
                this.loadExternalDatabases();
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
        }
    },

    async loadExternalDatabases() {
        try {
            // Safely use your native wrapper to get the database list
            const importedRes = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { 
                action: 'get_imported_databases' 
            });

            // Account for varying success keys ('status' or 'success') returned by your wrapper
            if ((importedRes.status === 'success' || importedRes.success) && importedRes.databases && importedRes.databases.length > 0) {
                let externalTransactions = [];

                for (const db of importedRes.databases) {
                    try {
                        const extRes = await fetch(db.API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'ProfessionalFinanceDashboard' }) 
                        });
                        
                        const extData = await extRes.json();

                        // Strict adherence to the Standard Contract
                        if (extData.success && extData.data && extData.data.transactions) {
                            const mapped = extData.data.transactions.map(t => ({
                                Transaction_ID: t.id,
                                Date: t.date,
                                Type: t.type,
                                Main_Group: db.Project_Name,  
                                Sub_Group_1: t.project_name, 
                                Description: t.description,
                                Amount: Number(t.amount),
                                isExternal: true              
                            }));
                            externalTransactions.push(...mapped);
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch from external API (${db.Project_Name}):`, e);
                    }
                }

                // Safely merge arrays to prevent iterable crashes if local transactions were empty
                if (externalTransactions.length > 0) {
                    this.rawData.transactions = [...(this.rawData.transactions || []), ...externalTransactions];
                    this.applyFilter(); // Refresh DOM with new combined data
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

        // Safety fallback array initialization for .filter()
        const currentTx = this.rawData.transactions || [];
        const currentTh = this.rawData.teachingHours || [];

        const filteredTx = currentTx.filter(t => dateFilter(t.Date));
        const filteredTh = currentTh.filter(th => dateFilter(th.Date_Paid || th.Date));

        this.renderCards(filteredTx, filteredTh, this.rawData.projects || []);
    }
};

window.FinanceManager = FinanceManager;
