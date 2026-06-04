import { CONFIG, API, Utils } from './globals.js';

export const FinanceManager = {
    recordEntries: [],
    currentProjectId: null,

    injectComponent: () => {
        const mainView = document.getElementById('main-view');
        
        const financeHtml = `
        <div id="financePanel" class="app-view hidden flex-col w-full h-full max-w-4xl mx-auto space-y-4 pb-20">
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 shrink-0">
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

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 shrink-0">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700">Projects & Events</h3>
                    <button onclick="FinanceManager.openNewProjectModal()" class="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2">
                        <i class="fas fa-folder-plus"></i> New Project
                    </button>
                </div>
                <div id="financeProjectsContainer" class="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                    </div>
            </div>

            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex-1 overflow-hidden flex flex-col min-h-[300px]">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-gray-700">Recent Transactions</h3>
                    <button onclick="FinanceManager.openRecordForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
                <div class="overflow-y-auto flex-1 custom-scrollbar pr-2">
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th class="px-3 py-2">Date</th>
                                <th class="px-3 py-2">Groupings</th>
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
                    <h2 class="text-white font-bold text-lg"><i class="fas fa-wallet mr-2"></i>Log Transaction <span id="recordModalProjectBadge" class="text-xs bg-blue-600 px-2 py-1 rounded ml-2 hidden"></span></h2>
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

        <div id="newProjectModal" class="hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                <div class="bg-blue-800 p-4 flex justify-between items-center">
                    <h2 class="text-white font-bold text-lg"><i class="fas fa-folder-plus mr-2"></i>New Project</h2>
                    <button onclick="document.getElementById('newProjectModal').classList.add('hidden')" class="text-blue-200 hover:text-white"><i class="fas fa-times text-xl"></i></button>
                </div>
                <form id="newProjectForm" class="p-5 space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
                        <input type="text" id="newProjName" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" placeholder="e.g. Siargao Trip, Home Renovation" required>
                    </div>
                    <div class="pt-2 flex gap-3">
                        <button type="button" onclick="document.getElementById('newProjectModal').classList.add('hidden')" class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Create</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="projectLedgerModal" class="hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[105] flex items-center justify-center p-2 sm:p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[85vh]">
                <div class="bg-blue-800 p-4 flex justify-between items-center shrink-0">
                    <div>
                        <h2 class="text-white font-bold text-lg" id="plTitle">Project Ledger</h2>
                        <p class="text-blue-200 text-xs" id="plDate"></p>
                    </div>
                    <button onclick="FinanceManager.closeProjectLedger()" class="text-blue-200 hover:text-white"><i class="fas fa-times text-xl"></i></button>
                </div>
                
                <div class="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
                    <div class="flex gap-4">
                        <div>
                            <p class="text-xs text-gray-500 font-semibold uppercase">Total Sales/Income</p>
                            <p class="text-lg font-bold text-green-600" id="plTotalSales">₱0.00</p>
                        </div>
                        <div>
                            <p class="text-xs text-gray-500 font-semibold uppercase">Total Expenses</p>
                            <p class="text-lg font-bold text-red-600" id="plTotalExpense">₱0.00</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-500 font-semibold uppercase">Net Position</p>
                        <p class="text-xl font-bold text-blue-800" id="plNetProfit">₱0.00</p>
                    </div>
                </div>

                <div class="p-2 sm:p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <div class="flex justify-end mb-3">
                        <button id="plAddBtn" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                            <i class="fas fa-plus"></i> Add to Project
                        </button>
                    </div>
                    <table class="w-full text-sm text-left text-gray-500">
                        <thead class="text-xs text-gray-700 uppercase bg-gray-100">
                            <tr>
                                <th class="px-2 py-2">Date</th>
                                <th class="px-2 py-2">Type</th>
                                <th class="px-2 py-2 w-1/2">Description</th>
                                <th class="px-2 py-2 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody id="plLedgerBody"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <datalist id="dl_MainGroup"></datalist>
        <datalist id="dl_SubGroup1"></datalist>
        <datalist id="dl_SubGroup2"></datalist>
        <datalist id="dl_SubGroup3"></datalist>
        <datalist id="dl_SubGroup4"></datalist>
        <datalist id="dl_SubGroup5"></datalist>
        `;
        
        mainView.insertAdjacentHTML('beforeend', financeHtml);
        window.FinanceManager = FinanceManager; 
    },

    init: () => {
        document.getElementById('financeRecordForm')?.addEventListener('submit', FinanceManager.submitRecords);
        document.getElementById('newProjectForm')?.addEventListener('submit', FinanceManager.submitNewProject);
    },

    refreshLedger: async () => {
        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_finance_ledger' });
            if (data.status === 'success') {
                FinanceManager.renderLedger(data.transactions, data.teachingHours);
            }

            const projData = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_projects' });
            if (projData.status === 'success') {
                FinanceManager.renderProjects(projData.projects);
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
        }
    },

    renderProjects: (projects) => {
        const container = document.getElementById('financeProjectsContainer');
        if (projects.length === 0) {
            container.innerHTML = `<p class="text-sm text-gray-400 p-2 italic w-full text-center">No projects found. Create one to group transactions.</p>`;
            return;
        }

        let html = '';
        projects.forEach(p => {
            html += `
            <div onclick="FinanceManager.openProjectLedger('${p.Project_ID}', '${p.Name}')" class="min-w-[140px] max-w-[160px] bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-3 cursor-pointer transition flex flex-col justify-center items-center text-center shadow-sm shrink-0 gap-2">
                <div class="w-10 h-10 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center mb-1">
                    <i class="fas fa-folder-open text-lg"></i>
                </div>
                <h4 class="font-bold text-gray-800 text-sm leading-tight truncate w-full">${p.Name}</h4>
                <p class="text-[10px] text-gray-500">${p.Created_At.split(' ')[0]}</p>
            </div>
            `;
        });
        container.innerHTML = html;
    },

    openNewProjectModal: () => {
        document.getElementById('newProjName').value = '';
        document.getElementById('newProjectModal').classList.remove('hidden');
    },

    submitNewProject: async (e) => {
        e.preventDefault();
        const name = document.getElementById('newProjName').value;
        if (!name) return;

        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'create_project', name: name });
            if (data.status === 'success') {
                document.getElementById('newProjectModal').classList.add('hidden');
                FinanceManager.refreshLedger();
            } else {
                alert("Error: " + data.message);
            }
        } catch (error) {
            alert("Network error creating project.");
        }
    },

    openProjectLedger: async (projectId, projectName) => {
        FinanceManager.currentProjectId = projectId;
        document.getElementById('plTitle').innerText = projectName;
        document.getElementById('projectLedgerModal').classList.remove('hidden');
        
        document.getElementById('plAddBtn').onclick = () => {
            FinanceManager.openRecordForm(projectId, projectName);
        };

        await FinanceManager.refreshProjectLedgerView();
    },

    closeProjectLedger: () => {
        FinanceManager.currentProjectId = null;
        document.getElementById('projectLedgerModal').classList.add('hidden');
    },

    refreshProjectLedgerView: async () => {
        if (!FinanceManager.currentProjectId) return;
        
        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { 
                action: 'get_project_ledger', 
                projectId: FinanceManager.currentProjectId 
            });
            
            if (data.status === 'success') {
                const transactions = data.transactions;
                let rows = "";
                let totalSales = 0, totalExpenses = 0;

                transactions.forEach(t => {
                    const amt = parseFloat(t.Amount);
                    if (t.Type === 'Income') totalSales += amt;
                    else totalExpenses += amt;

                    const isIncome = t.Type === 'Income';
                    const colorClass = isIncome ? 'text-green-600' : 'text-red-600';

                    rows += `<tr class="border-b border-gray-100 hover:bg-white">
                        <td class="px-2 py-3 whitespace-nowrap">${t.Date}</td>
                        <td class="px-2 py-3 whitespace-nowrap"><span class="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-xs">${t.Type}</span></td>
                        <td class="px-2 py-3 text-gray-700">${t.Description}</td>
                        <td class="px-2 py-3 text-right font-bold ${colorClass}">${Utils.formatCurrency(amt)}</td>
                    </tr>`;
                });

                document.getElementById('plLedgerBody').innerHTML = rows;
                document.getElementById('plTotalSales').innerHTML = Utils.formatCurrency(totalSales);
                document.getElementById('plTotalExpense').innerHTML = Utils.formatCurrency(totalExpenses);
                document.getElementById('plNetProfit').innerHTML = Utils.formatCurrency(totalSales - totalExpenses);
            }
        } catch (err) {
            console.error("Error loading project ledger");
        }
    },

    renderLedger: (transactions, teachingHours) => {
        let totalIncome = 0;
        let totalExpense = 0;
        let rows = "";
        const allRecords = [];

        const lists = { MainGroup: new Set(), SubGroup1: new Set(), SubGroup2: new Set(), SubGroup3: new Set(), SubGroup4: new Set(), SubGroup5: new Set() };
        
        transactions.forEach(t => {
            if (t.Main_Group) lists.MainGroup.add(t.Main_Group);
            if (t.Sub_Group_1) lists.SubGroup1.add(t.Sub_Group_1);
            if (t.Sub_Group_2) lists.SubGroup2.add(t.Sub_Group_2);
            if (t.Sub_Group_3) lists.SubGroup3.add(t.Sub_Group_3);
            if (t.Sub_Group_4) lists.SubGroup4.add(t.Sub_Group_4);
            if (t.Sub_Group_5) lists.SubGroup5.add(t.Sub_Group_5);

            allRecords.push({
                date: t.Date,
                type: t.Type,
                group: t.Main_Group,
                subGroup1: t.Sub_Group_1,
                subGroup2: t.Sub_Group_2,
                subGroup3: t.Sub_Group_3,
                subGroup4: t.Sub_Group_4,
                subGroup5: t.Sub_Group_5,
                desc: t.Description,
                amount: parseFloat(t.Amount),
                projectId: t.Project_ID
            });
        });

        const groupedTeaching = {};
        teachingHours.forEach(th => {
            const date = th.Date_Paid || th.Date;
            if (!groupedTeaching[date]) {
                groupedTeaching[date] = {
                    date: date,
                    type: 'Income',
                    group: 'Earnings',
                    subGroup1: 'Teaching',
                    subGroup2: '', subGroup3: '', subGroup4: '', subGroup5: '',
                    desc: 'Teaching Earnings (Aggregated)',
                    amount: 0,
                    projectId: null
                };
            }
            groupedTeaching[date].amount += parseFloat(th.Total_Earnings);
        });
        
        Object.values(groupedTeaching).forEach(gt => allRecords.push(gt));

        Object.keys(lists).forEach(k => {
            const dl = document.getElementById(`dl_${k}`);
            if (dl) dl.innerHTML = Array.from(lists[k]).map(v => `<option value="${v}">`).join('');
        });

        allRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        allRecords.forEach(r => {
            if (r.type === 'Income') totalIncome += r.amount;
            if (r.type === 'Expense') totalExpense += r.amount;

            const isIncome = r.type === 'Income';
            const colorClass = isIncome ? 'text-green-600' : 'text-red-600';
            const sign = isIncome ? '+' : '-';

            const subGroupsArr = [r.subGroup1, r.subGroup2, r.subGroup3, r.subGroup4, r.subGroup5].filter(Boolean);
            const subGroupsHtml = subGroupsArr.length > 0 ? `<span class="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded mt-1 inline-block">${subGroupsArr.join(' / ')}</span>` : '';
            const projectBadge = r.projectId ? `<span class="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded mt-1 inline-block ml-1"><i class="fas fa-link"></i> Linked</span>` : '';

            rows += `
                <tr class="border-b border-gray-50 hover:bg-gray-50">
                    <td class="px-3 py-3 whitespace-nowrap">${r.date}</td>
                    <td class="px-3 py-3 whitespace-nowrap">
                        <span class="font-medium block">${r.group}</span>
                        ${subGroupsHtml} ${projectBadge}
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

    openRecordForm: (projectId = null, projectName = null) => {
        FinanceManager.recordEntries = [];
        FinanceManager.currentProjectId = projectId;
        
        const badge = document.getElementById('recordModalProjectBadge');
        if (projectId && projectName) {
            badge.textContent = projectName;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        document.getElementById('financeEntriesContainer').innerHTML = '';
        FinanceManager.addRecordEntry();
        document.getElementById('financeRecordModal').classList.remove('hidden');
    },

    closeRecordForm: () => {
        if (document.getElementById('projectLedgerModal').classList.contains('hidden')) {
            FinanceManager.currentProjectId = null;
        }
        document.getElementById('financeRecordModal').classList.add('hidden');
    },

    addRecordEntry: () => {
        const idx = FinanceManager.recordEntries.length;
        FinanceManager.recordEntries.push({ idx });

        const container = document.getElementById('financeEntriesContainer');
        const div = document.createElement('div');
        div.id = `fin-entry-${idx}`;
        div.className = 'fin-entry bg-gray-50 border border-gray-200 rounded-xl p-4 relative';

        const today = new Date().toISOString().split('T')[0];

        div.innerHTML = `
            ${idx > 0 ? `<button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>` : ''}
            
            <div class="grid grid-cols-2 gap-3">
                <input type="date" id="finDate_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" value="${today}" required>
                <select id="finType_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm" required>
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                </select>
            </div>
            
            <input type="text" id="finGroup_${idx}" list="dl_MainGroup" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mt-3" placeholder="Main Group (e.g., Personal, Earnings)" required>
            
            <div class="grid grid-cols-5 gap-2 mt-3">
                <input type="text" id="finSubGroup1_${idx}" list="dl_SubGroup1" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs" placeholder="Sub 1">
                <input type="text" id="finSubGroup2_${idx}" list="dl_SubGroup2" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs" placeholder="Sub 2">
                <input type="text" id="finSubGroup3_${idx}" list="dl_SubGroup3" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs" placeholder="Sub 3">
                <input type="text" id="finSubGroup4_${idx}" list="dl_SubGroup4" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs" placeholder="Sub 4">
                <input type="text" id="finSubGroup5_${idx}" list="dl_SubGroup5" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs" placeholder="Sub 5">
            </div>
            
            <input type="text" id="finDesc_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mt-3" placeholder="Description" required>
            
            <div class="relative mt-3">
                <span class="absolute left-3 top-2.5 text-gray-500 font-medium">₱</span>
                <input type="number" id="finAmt_${idx}" class="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm font-bold" placeholder="0.00" step="0.01" required>
            </div>
        `;
        container.appendChild(div);
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
            const subGroup1 = document.getElementById(`finSubGroup1_${idx}`)?.value;
            const subGroup2 = document.getElementById(`finSubGroup2_${idx}`)?.value;
            const subGroup3 = document.getElementById(`finSubGroup3_${idx}`)?.value;
            const subGroup4 = document.getElementById(`finSubGroup4_${idx}`)?.value;
            const subGroup5 = document.getElementById(`finSubGroup5_${idx}`)?.value;
            const desc = document.getElementById(`finDesc_${idx}`)?.value;
            const amt = document.getElementById(`finAmt_${idx}`)?.value;

            if (!date || !type || !desc || !amt) continue;

            records.push({ 
                date, type, group, 
                subGroup1, subGroup2, subGroup3, subGroup4, subGroup5, 
                description: desc, amount: amt,
                projectId: FinanceManager.currentProjectId 
            });
        }

        if (records.length === 0) return;

        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'add_finance_records', records });

            if (data.status === 'success') {
                FinanceManager.closeRecordForm();
                FinanceManager.refreshLedger();
                if (FinanceManager.currentProjectId) {
                    FinanceManager.refreshProjectLedgerView();
                }
            } else {
                alert("Error saving records: " + data.message);
            }
        } catch (error) {
            alert("Network error saving records.");
        }
    }
};
