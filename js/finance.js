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

            // 1. Fetch & Render Local Data First (Instant Load)
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
                    const dateStrManila = new Intl.DateTimeFormat('en-CA', { 
                        timeZone: 'Asia/Manila', 
                        year: 'numeric', 
                        month: '2-digit', 
                        day: '2-digit' 
                    }).format(now);
                    const [year, month] = dateStrManila.split('-');
                    fromInput.value = `${year}-${month}-01`;
                }

                this.applyFilter();

                // 2. Fetch External Databases in Background
                this.loadExternalDatabases(user.User_ID);
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
        }
    },

    async loadExternalDatabases(userId) {
        try {
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

                        if (extData.success && extData.data) {
                            const projects = extData.data.projects || [];
                            const fixedCosts = extData.data.fixedCosts || [];

                            // Harmonize Etch Data: Map only Completed Projects to Net Income
                            projects.filter(p => p.status === 'Completed').forEach(p => {
                                let pSales = 0;
                                let pExp = 0;
                                
                                (p.transactions || []).forEach(t => {
                                    const amt = Number(t.amount);
                                    if (t.type === 'Sales') pSales += amt;
                                    else if (t.type === 'Expense') pExp += amt;
                                });

                                const isTaxable = (p.is_taxable !== 0);
                                const taxAmt = isTaxable ? (pSales * 0.08) : 0;
                                pExp += taxAmt;
                                
                                const netBeforeShares = pSales - pExp;
                                const hasCo = p.co_agent && p.co_agent.trim() !== "";
                                const shareRatio = hasCo ? (1 / 3) : 0.5;
                                const totalAgentGrossShares = netBeforeShares * shareRatio * (hasCo ? 2 : 1);
                                
                                // Exact replica of Dashboard logic
                                const pNetToCompany = netBeforeShares - totalAgentGrossShares;

                                if (pNetToCompany !== 0) {
                                    // Base date on the latest transaction so it maps to the month it was finished
                                    let pDate = p.created_at;
                                    if (p.transactions && p.transactions.length > 0) {
                                        const latestTx = p.transactions.reduce((latest, t) => new Date(t.created_at) > new Date(latest.created_at) ? t : latest, p.transactions[0]);
                                        pDate = latestTx.created_at;
                                    }

                                    externalTransactions.push({
                                        Transaction_ID: p.id + '_net',
                                        Date: pDate,
                                        Type: pNetToCompany > 0 ? 'Income' : 'Expense',
                                        Main_Group: db.Project_Name,
                                        Sub_Group_1: 'Project Net Income',
                                        Sub_Group_2: 'Completed Projects',
                                        Description: `${p.name} (Net to Co.)`,
                                        Amount: Math.abs(pNetToCompany),
                                        Project_ID: p.id,
                                        isExternal: true
                                    });
                                }
                            });

                            // Harmonize Etch Data: Map GLOBAL Fixed Costs to Expenses
                            fixedCosts.forEach(t => {
                                externalTransactions.push({
                                    Transaction_ID: t.id,
                                    Date: t.created_at,
                                    Type: 'Expense',
                                    Main_Group: db.Project_Name,
                                    Sub_Group_1: 'Global Fixed Costs',
                                    Sub_Group_2: t.type,
                                    Description: t.description + (t.agent_name ? ` (by ${t.agent_name})` : ''),
                                    Amount: Number(t.amount),
                                    Project_ID: 'GLOBAL',
                                    isExternal: true
                                });
                            });
                        }
                    } catch (e) {
                        console.warn(`Failed to fetch external ledger from ${db.Project_Name}:`, e);
                    }
                }

                // If external records were harmonized, add them and refresh the UI silently
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
