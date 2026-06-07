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
                    const year = now.getFullYear();
                    const month = String(now.getMonth() + 1).padStart(2, '0');
                    fromInput.value = `${year}-${month}-01`;
                }

                this.applyFilter();
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
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
            const d = new Date(dateString);
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
