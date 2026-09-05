import { CONFIG, API, Utils } from './globals.js';
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
        
        document.getElementById('finPrevMonthBtn')?.addEventListener('click', () => this.shiftMonth(-1));
        document.getElementById('finNextMonthBtn')?.addEventListener('click', () => this.shiftMonth(1));
    },

    shiftMonth(offset) {
        const fromInput = document.getElementById('finFilterFrom');
        const toInput = document.getElementById('finFilterTo');
        
        let baseDate = new Date();
        if (fromInput && fromInput.value) {
            const parsed = new Date(fromInput.value);
            if (!isNaN(parsed.getTime())) {
                baseDate = parsed;
            }
        }

        const newDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 1);
        const firstDay = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
        const lastDay = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0);

        if (fromInput) fromInput.value = Utils.formatDateYYYYMMDD(firstDay);
        if (toInput) toInput.value = Utils.formatDateYYYYMMDD(lastDay);
        
        this.applyFilter();
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
                const toInput = document.getElementById('finFilterTo');
                
                if (!fromInput.value) {
                    const now = new Date();
                    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
                    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                    
                    if (fromInput) fromInput.value = Utils.formatDateYYYYMMDD(firstDay);
                    if (toInput) toInput.value = Utils.formatDateYYYYMMDD(lastDay);
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
            
            const user = JSON.parse(localStorage.getItem('teachingPortalUser'));
            
            if (!user || (!user.id && !user.User_ID)) {
                console.warn("STEP 1.5: No User ID found in localStorage, cannot fetch imported databases.");
                return;
            }

            const importedRes = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { 
                action: 'get_imported_dbs',
                userId: user.id || user.User_ID 
            });

            console.log("STEP 2: Response from Local API regarding Imported DBs:", importedRes);

            const isSuccess = importedRes.status === 'success' || importedRes.success === true;
            
            if (isSuccess && importedRes.databases && importedRes.databases.length > 0) {
                console.log(`STEP 3: Found ${importedRes.databases.length} connected APIs. Beginning external fetch loop...`);
                let externalTransactions = [];

                for (const db of importedRes.databases) {
                    try {
                        const hasProjectName = db.Project_Name && db.Project_Name.trim() !== '';
                        const projectName = hasProjectName ? db.Project_Name.trim() : null;

                        console.log(`STEP 4 [${hasProjectName ? projectName : 'Ordinary Ledger'}]: Pinging URL -> ${db.API_URL}`);
                        
                        // Only inject a mock project if there is an actual project name
                        if (hasProjectName && !this.rawData.projects.find(p => p.Project_ID === db.ID)) {
                            this.rawData.projects.push({
                                Project_ID: db.ID,
                                Name: projectName,
                                Created_At: new Date().toISOString()
                            });
                        }

                        const extRes = await fetch(db.API_URL, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'ProfessionalFinanceDashboard' }) 
                        });
                        
                        const extData = await extRes.json();
                        console.log(`STEP 5 [${hasProjectName ? projectName : 'Ordinary Ledger'}]: Data received ->`, extData);

                        if (extData.success && extData.data && extData.data.transactions) {
                            const mapped = extData.data.transactions.map(t => ({
                                Transaction_ID: t.id,
                                Date: t.date,
                                Type: t.type === 'Income' ? 'Income' : 'Expense',
                                Main_Group: hasProjectName ? projectName : '',  
                                Sub_Group_1: t.project_name || 'Imported Data', 
                                Sub_Group_2: '', 
                                Sub_Group_3: '',
                                Sub_Group_4: '',
                                Sub_Group_5: '',
                                Description: t.description,
                                Amount: Number(t.amount),
                                Project_ID: hasProjectName ? db.ID : null, // Null integrates it as an ordinary income/expense
                                isExternal: true              
                            }));
                            externalTransactions.push(...mapped);
                            console.log(`STEP 6 [${hasProjectName ? projectName : 'Ordinary Ledger'}]: Successfully mapped ${mapped.length} records.`);
                        } else {
                            console.warn(`STEP 6 [${hasProjectName ? projectName : 'Ordinary Ledger'}]: API returned success false, or transactions array was missing.`);
                        }
                    } catch (e) {
                        console.error(`ERROR Pinging DB [${db.ID}]: Failed to fetch or parse.`, e);
                    }
                }

                if (externalTransactions.length > 0) {
                    console.log(`STEP 7: Merging ${externalTransactions.length} external records into the UI...`);
                    this.rawData.transactions = [...(this.rawData.transactions || []), ...externalTransactions];
                    this.applyFilter();
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
