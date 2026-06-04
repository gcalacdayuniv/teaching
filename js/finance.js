// js/finance.js
import { CONFIG, API, Utils } from './globals.js';

export const FinanceManager = {
    recordEntries: [],

    injectComponent: () => {
        const mainView = document.getElementById('main-view');
        
        const financeHtml = `
        <div id="financePanel" class="app-view hidden flex-col w-full h-full max-w-4xl mx-auto space-y-4">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 class="text-xl font-bold text-gray-800 mb-1">Financial Overview</h2>
                <div class="grid grid-cols-2 gap-4 mt-4">
                    <div class="bg-green-50 p-4 rounded-xl border border-green-100">
                        <p class="text-sm text-green-600 font-semibold">Total Income</p>
                        <p class="text-2xl font-bold text-green-700" id="finTotalIncome">₱0.00</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-xl border border-red-100">
                        <p class="text-sm text-red-600 font-semibold">Total Expense</p>
                        <p class="text-2xl font-bold text-red-700" id="finTotalExpense">₱0.00</p>
                    </div>
                </div>
                <div class="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <p class="text-sm text-blue-600 font-semibold">Net Balance</p>
                    <p class="text-3xl font-bold text-blue-800" id="finNetBalance">₱0.00</p>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-1 overflow-hidden flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700">Recent Transactions</h3>
                    <button onclick="FinanceManager.openRecordForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <div class="overflow-y-auto flex-1 custom-scrollbar pr-2">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th class="px-3 py-2">Date</th>
                                <th class="px-3 py-2">Category</th>
                                <th class="px-3 py-2">Desc</th>
                                <th class="px-3 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody id="financeLedgerBody"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="financeRecordModal" class="hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div class="bg-blue-800 p-4 flex justify-between items-center shrink-0">
                    <h2 class="text-white font-bold text-lg"><i class="fas fa-wallet mr-2"></i>Log Transaction</h2>
                    <button onclick="FinanceManager.closeRecordForm()" class="text-blue-200 hover:text-white"><i class="fas fa-times text-xl"></i></button>
                </div>
                <div class="p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <form id="financeRecordForm" class="space-y-4">
                        <div id="financeEntriesContainer" class="space-y-4"></div>
                        <button type="button" onclick="FinanceManager.addRecordEntry()" class="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-500 hover:text-blue-600 transition text-sm font-medium">
                            <i class="fas fa-plus mr-1"></i> Add Another Item
                        </button>
                        <div class="pt-4 border-t border-gray-100 flex gap-3">
                            <button type="button" onclick="FinanceManager.closeRecordForm()" class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
                            <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Save Records</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
        `;
        
        mainView.insertAdjacentHTML('beforeend', financeHtml);
        window.FinanceManager = FinanceManager; 
    },

    init: () => {
        document.getElementById('financeRecordForm')?.addEventListener('submit', FinanceManager.submitRecords);
    },

    refreshLedger: async () => {
        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_finance_ledger' });
            if (data.status === 'success') {
                FinanceManager.renderLedger(data.transactions, data.teachingHours);
            }
        } catch (err) {
            console.error("Failed to load ledger:", err);
        }
    },

    renderLedger: (transactions, teachingHours) => {
        let totalIncome = 0;
        let totalExpense = 0;
        let rows = "";

        const allRecords = [];
        
        transactions.forEach(t => {
            allRecords.push({
                date: t.Date,
                type: t.Type,
                group: t.Main_Group,
                subGroup: t.Sub_Group,
                desc: t.Description,
                amount: parseFloat(t.Amount)
            });
        });

        teachingHours.forEach(th => {
            allRecords.push({
                date: th.Date_Paid || th.Date,
                type: 'Income',
                group: 'Earnings',
                subGroup: 'Teaching',
                desc: `${th.University} - ${th.Subject_Code}`,
                amount: parseFloat(th.Total_Earnings)
            });
        });

        allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        allRecords.forEach(r => {
            if (r.type === 'Income') totalIncome += r.amount;
            if (r.type === 'Expense') totalExpense += r.amount;

            const isIncome = r.type === 'Income';
            const colorClass = isIncome ? 'text-green-600' : 'text-red-600';
            const sign = isIncome ? '+' : '-';

            rows += `
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                    <td class="px-3 py-3 whitespace-nowrap">${r.date}</td>
                    <td class="px-3 py-3 whitespace-nowrap">
                        <span class="font-medium block">${r.group}</span>
                        <span class="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">${r.subGroup}</span>
                    </td>
                    <td class="px-3 py-3 text-gray-700">${r.desc}</td>
                    <td class="px-3 py-3 text-right font-bold ${colorClass}">
                        ${sign}${Utils.formatCurrency(r.amount)}
                    </td>
                </tr>
            `;
        });

        document.getElementById('financeLedgerBody').innerHTML = rows;
        document.getElementById('finTotalIncome').innerText = Utils.formatCurrency(totalIncome);
        document.getElementById('finTotalExpense').innerText = Utils.formatCurrency(totalExpense);
        
        const net = totalIncome - totalExpense;
        document.getElementById('finNetBalance').innerText = Utils.formatCurrency(net);
    },

    openRecordForm: () => {
        FinanceManager.recordEntries = [];
        document.getElementById('financeEntriesContainer').innerHTML = '';
        FinanceManager.addRecordEntry();
        document.getElementById('financeRecordModal').classList.remove('hidden');
    },

    closeRecordForm: () => {
        document.getElementById('financeRecordModal').classList.add('hidden');
    },

    addRecordEntry: () => {
        const idx = FinanceManager.recordEntries.length;
        FinanceManager.recordEntries.push({ idx });

        const container = document.getElementById('financeEntriesContainer');
        const div = document.createElement('div');
        div.id = `fin-entry-${idx}`;
        div.className = 'fin-entry bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 relative';

        const today = new Date().toISOString().split('T')[0];

        div.innerHTML = `
            ${idx > 0 ? `<button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>` : ''}
            
            <div class="grid grid-cols-2 gap-3">
                <input type="date" id="finDate_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" value="${today}" required>
                <select id="finType_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" onchange="FinanceManager.updateGroups(${idx})" required>
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                </select>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
                <select id="finGroup_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" required></select>
                <select id="finSubGroup_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" required></select>
            </div>
            
            <input type="text" id="finDesc_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" placeholder="Description" required>
            
            <div class="relative">
                <span class="absolute left-3 top-2.5 text-gray-500 font-medium">₱</span>
                <input type="number" id="finAmt_${idx}" class="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm font-bold" placeholder="0.00" step="0.01" required>
            </div>
        `;
        container.appendChild(div);
        FinanceManager.updateGroups(idx);
    },

    updateGroups: (idx) => {
        const type = document.getElementById(`finType_${idx}`).value;
        const groupSel = document.getElementById(`finGroup_${idx}`);
        const subGroupSel = document.getElementById(`finSubGroup_${idx}`);
        
        if (type === 'Expense') {
            groupSel.innerHTML = `
                <option value="Personal">Personal</option>
                <option value="Home">Home</option>
            `;
            subGroupSel.innerHTML = `
                <option value="Food">Food</option>
                <option value="Things">Things</option>
                <option value="Travel">Travel</option>
                <option value="Medicine">Medicine</option>
                <option value="Others">Others</option>
            `;
        } else {
            groupSel.innerHTML = `
                <option value="Earnings">Earnings</option>
                <option value="Other">Other</option>
            `;
            subGroupSel.innerHTML = `
                <option value="Teaching">Teaching</option>
                <option value="Freelance">Freelance</option>
                <option value="Business">Business</option>
                <option value="Allowance">Allowance</option>
                <option value="Others">Others</option>
            `;
        }
    },

    submitRecords: async (e) => {
        e.preventDefault();
        const entryEls = document.querySelectorAll('.fin-entry');
        const records = [];

        for (const entryEl of entryEls) {
            const idxMatch = entryEl.id.match(/fin-entry-(\d+)/);
            if (!idxMatch) continue;
            const idx = idxMatch[1];

            const date = document.getElementById(`finDate_${idx}`)?.value;
            const type = document.getElementById(`finType_${idx}`)?.value;
            const group = document.getElementById(`finGroup_${idx}`)?.value;
            const subGroup = document.getElementById(`finSubGroup_${idx}`)?.value;
            const desc = document.getElementById(`finDesc_${idx}`)?.value;
            const amt = document.getElementById(`finAmt_${idx}`)?.value;

            if (!date || !type || !desc || !amt) continue;

            records.push({ date, type, group, subGroup, description: desc, amount: amt });
        }

        if (records.length === 0) return;

        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'add_finance_records', records });

            if (data.status === 'success') {
                FinanceManager.closeRecordForm();
                FinanceManager.refreshLedger();
            } else {
                alert("Error saving records: " + data.message);
            }
        } catch (error) {
            alert("Network error saving records.");
        }
    }
};
