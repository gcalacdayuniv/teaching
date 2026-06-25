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

            // STEP 1: FETCH LOCAL TEACHING DATA FIRST
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

                // Setup Default Filtering for Current Month
                const fromInput = document.getElementById('finFilterFrom');
                if (!fromInput.value) {
                    const now = new Date();
                    const dateStrManila = new Intl.DateTimeFormat('en-CA', { 
                        timeZone: 'Asia/Manila', 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                    }).format(now);
                    const [year, month] = dateStrManila.split('-');
                    fromInput.value = `${year}-${month}-01`;
                }

                // Render Local Data Immediately
                this.applyFilter();

                // STEP 2: FETCH IMPORTED DATABASES IN THE BACKGROUND
                this.loadExternalDatabases(user.User_ID);
            }
        } catch (err) {
            console.error("Failed to load local finance data:", err);
        }
    },

    async loadExternalDatabases(userId) {
        try {
            // Get the list of saved external APIs
            const importedRes = await fetch(window.APP_CONFIG?.API_URL || CONFIG.API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'get_imported_databases', User_ID: userId })
            }).then(res => res.json()).catch(() => ({ databases: [] }));

            if (importedRes.success && importedRes.databases && importedRes.databases.length > 0) {
                let externalTransactions = [];

                for (const db of importedRes.databases) {
                    try {
                        const extRes = await fetch(db.API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'getDashboardData', data: { role: 'Superuser' } })
                        });
                        
                        const extData = await extRes.json();

                        // STEP 3: THE TRANSLATOR LAYER
                        // This maps Etch's different structure into the Teaching app's structure
                        if (extData.success && extData.data) {
                            const projects = extData.data.projects || [];
                            const fixedCosts = extData.data.fixedCosts || [];

                            projects.forEach(p => {
                                (p.transactions || []).forEach(t => {
                                    externalTransactions.push({
                                        Transaction_ID: t.id,
                                        Date: t.created_at, // Translating Etch 'created_at' to Teaching 'Date'
                                        Type: t.type === 'Income' ? 'Income' : 'Expense',
                                        Main_Group: db.Project_Name, // Forces Etch records into its own folder
                                        Sub_Group_1: p.name,
                                        Sub_Group_2: t.type,
                                        Description: t.description + (t.agent_name ? ` (by ${t.agent_name})` : ''),
                                        Amount: t.amount,
                                        Project_ID: p.id,
                                        isExternal: true // Prevents local edits
                                    });
                                });
                            });

                            fixedCosts.forEach(t => {
                                externalTransactions.push({
                                    Transaction_ID: t.id,
                                    Date: t.created_at,
                                    Type: 'Expense',
                                    Main_Group: db.Project_Name,
                                    Sub_Group_1: 'Global Fixed Costs',
                                    Sub_Group_2: t.type,
                                    Description: t.description + (t.agent_name ? ` (by ${t.agent_name})` : ''),
                                    Amount: t.amount,
                                    Project_ID: 'GLOBAL',
                                    isExternal: true
                                });
                            });
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch external ledger from ${db.Project_Name}:`, e);
                    }
                }

                // If we found external data, add it to our raw data and re-render the screen
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
