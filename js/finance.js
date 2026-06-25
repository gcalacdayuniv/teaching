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
            // ALWAYS FETCH LOCAL DATA FIRST
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

                // Render local data instantly
                this.applyFilter();

                // Fire the external fetch in the background
                this.loadExternalDatabases();
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
        }
    },

    async loadExternalDatabases() {
        try {
            console.log("Fetching imported database list...");
            const importedRes = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { 
                action: 'get_imported_databases' 
            });

            if ((importedRes.status === 'success' || importedRes.success) && importedRes.databases && importedRes.databases.length > 0) {
                let externalTransactions = [];

                for (const db of importedRes.databases) {
                    try {
                        console.log(`Pinging external API: ${db.Project_Name} at ${db.API_URL}`);
                        
                        // We must inject a mock project so the UI grouping logic doesn't ignore these transactions
                        if (!this.rawData.projects.find(p => p.Project_ID === db.ID)) {
                            this.rawData.projects.push({
                                Project_ID: db.ID,
                                Name: db.Project_Name,
                                Created_At: new Date().toISOString()
                            });
                        }

                        const extRes = await fetch(db.API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'ProfessionalFinanceDashboard' }) 
                        });
                        
                        const extData = await extRes.json();
                        console.log(`Response from ${db.Project_Name}:`, extData);

                        if (extData.success && extData.data && extData.data.transactions) {
                            const mapped = extData.data.transactions.map(t => ({
                                Transaction_ID: t.id,
                                Date: t.date,
                                Type: t.type === 'Income' ? 'Income' : 'Expense', // Strict coercion
                                Main_Group: db.Project_Name,  
                                Sub_Group_1: t.project_name || 'Imported Data', 
                                Sub_Group_2: '', // Filled to prevent UI rendering crashes
                                Sub_Group_3: '',
                                Sub_Group_4: '',
                                Sub_Group_5: '',
                                Description: t.description,
                                Amount: Number(t.amount),
                                Project_ID: db.ID, // Links to the mock project we just injected
                                isExternal: true              
                            }));
                            externalTransactions.push(...mapped);
                            console.log(`Successfully mapped ${mapped.length} records from ${db.Project_Name}`);
                        }
                    } catch (e) {
                        console.error(`Failed to fetch from external API (${db.Project_Name}):`, e);
                    }
                }

                if (externalTransactions.length > 0) {
                    this.rawData.transactions = [...(this.rawData.transactions || []), ...externalTransactions];
                    this.applyFilter(); // Refresh DOM with new combined data
                } else {
                    console.log("No valid external transactions were found to merge.");
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
            if (!dateString) return false;
            
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

            if (isNaN(d.getTime())) return false; // Fail-safe for invalid dates
            d.setHours(0,0,0,0);
            
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        };

        const currentTx = this.rawData.transactions || [];
        const currentTh = this.rawData.teachingHours || [];

        const filteredTx = currentTx.filter(t => dateFilter(t.Date));
        const filteredTh = currentTh.filter(th => dateFilter(th.Date_Paid || th.Date));

        // Note: this.rawData.projects now contains the mock projects for the external APIs
        this.renderCards(filteredTx, filteredTh, this.rawData.projects || []);
    }
};

window.FinanceManager = FinanceManager;
