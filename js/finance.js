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
            console.log("STEP 1: Fetching imported database list...");
            
            // Explicitly grab the user to guarantee User_ID is passed
            const user = JSON.parse(localStorage.getItem('professionalPortalUser'));
            if (!user || !user.User_ID) {
                console.warn("STEP 1.5: No User_ID found in localStorage, cannot fetch imported databases.");
                return;
            }

            const importedRes = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { 
                action: 'get_imported_databases',
                User_ID: user.User_ID // FORCED INJECTION
            });

            console.log("STEP 2: Response from Local API regarding Imported DBs:", importedRes);

            // Check if successful and if there are actually databases returned
            const isSuccess = importedRes.status === 'success' || importedRes.success === true;
            
            if (isSuccess && importedRes.databases && importedRes.databases.length > 0) {
                console.log(`STEP 3: Found ${importedRes.databases.length} connected APIs. Beginning external fetch loop...`);
                let externalTransactions = [];

                for (const db of importedRes.databases) {
                    try {
                        console.log(`STEP 4 [${db.Project_Name}]: Pinging URL -> ${db.API_URL}`);
                        
                        // Inject a mock project so the UI grouping logic doesn't ignore these transactions
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
                        console.log(`STEP 5 [${db.Project_Name}]: Data received ->`, extData);

                        if (extData.success && extData.data && extData.data.transactions) {
                            const mapped = extData.data.transactions.map(t => ({
                                Transaction_ID: t.id,
                                Date: t.date,
                                Type: t.type === 'Income' ? 'Income' : 'Expense',
                                Main_Group: db.Project_Name,  
                                Sub_Group_1: t.project_name || 'Imported Data', 
                                Sub_Group_2: '', 
                                Sub_Group_3: '',
                                Sub_Group_4: '',
                                Sub_Group_5: '',
                                Description: t.description,
                                Amount: Number(t.amount),
                                Project_ID: db.ID, 
                                isExternal: true              
                            }));
                            externalTransactions.push(...mapped);
                            console.log(`STEP 6 [${db.Project_Name}]: Successfully mapped ${mapped.length} records.`);
                        } else {
                            console.warn(`STEP 6 [${db.Project_Name}]: API returned success false, or transactions array was missing.`);
                        }
                    } catch (e) {
                        console.error(`ERROR [${db.Project_Name}]: Failed to fetch or parse.`, e);
                    }
                }

                if (externalTransactions.length > 0) {
                    console.log(`STEP 7: Merging ${externalTransactions.length} external records into the UI...`);
                    this.rawData.transactions = [...(this.rawData.transactions || []), ...externalTransactions];
                    this.applyFilter(); // Refresh DOM
                    console.log("STEP 8: UI successfully refreshed with combined data.");
                } else {
                    console.log("STEP 7: Loop finished, but no valid transactions were gathered from the external APIs.");
                }
            } else {
                console.log("STEP 3: Process stopped. Reason: API returned false OR databases array is empty.", importedRes);
            }
        } catch (error) {
            console.error("CRITICAL ERROR in loadExternalDatabases:", error);
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

            if (isNaN(d.getTime())) return false; 
            d.setHours(0,0,0,0);
            
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
        };

        const currentTx = this.rawData.transactions || [];
        const currentTh = this.rawData.teachingHours || [];

        const filteredTx = currentTx.filter(t => dateFilter(t.Date));
        const filteredTh = currentTh.filter(th => dateFilter(th.Date_Paid || th.Date));

        this.renderCards(filteredTx, filteredTh, this.rawData.projects || []);
    }
};

window.FinanceManager = FinanceManager;
