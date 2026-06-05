import { CONFIG, API } from './globals.js';

export const FinanceManager = {
    recordEntries: [],
    currentProjectId: null,
    currentPrefillGroup: null,
    rawData: {
        transactions: [],
        teachingHours: [],
        projects: []
    },

    formatMoney: (amount) => {
        return parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    compressImage: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 800;
                    const MAX_HEIGHT = 800;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); 
                };
                img.onerror = (e) => reject(e);
            };
            reader.onerror = (e) => reject(e);
        });
    },

    injectComponent: () => {
        const mainView = document.getElementById('main-view');
        
        const financeHtml = `
        <div id="financePanel" class="app-view hidden flex-col w-full h-full max-w-4xl mx-auto space-y-4 pb-24">
            
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 shrink-0">
                <h2 class="text-sm font-bold text-gray-800 mb-2">Financial Overview</h2>
                <div class="grid grid-cols-3 gap-2">
                    <div class="bg-green-50 p-2 rounded-xl border border-green-100 text-center">
                        <p class="text-[9px] text-green-600 font-bold uppercase tracking-wider">Total Income</p>
                        <p class="text-sm sm:text-base font-black text-green-700 mt-0.5 truncate" id="finTotalIncome">₱0.00</p>
                    </div>
                    <div class="bg-red-50 p-2 rounded-xl border border-red-100 text-center">
                        <p class="text-[9px] text-red-600 font-bold uppercase tracking-wider">Total Expense</p>
                        <p class="text-sm sm:text-base font-black text-red-700 mt-0.5 truncate" id="finTotalExpense">₱0.00</p>
                    </div>
                    <div class="bg-gray-50 p-2 rounded-xl border border-gray-200 text-center">
                        <p class="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Net Balance</p>
                        <p class="text-sm sm:text-base font-black text-gray-800 mt-0.5 truncate" id="finNetBalance">₱0.00</p>
                    </div>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col">
                
                <div class="mb-4 shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4">
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-bold text-gray-800 text-base sm:text-lg flex items-center gap-2">
                            <i class="fas fa-book text-blue-500"></i> Ledgers & Categories
                        </h3>
                        <div class="flex gap-2">
                            <button onclick="FinanceManager.openNewProjectModal()" class="group relative bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:bg-indigo-50 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center gap-1.5">
                                <i class="fas fa-folder-plus group-hover:scale-110 transition-transform"></i> <span class="hidden sm:inline">Project</span>
                            </button>
                            <button onclick="FinanceManager.openRecordForm()" class="group relative bg-blue-600 hover:bg-blue-700 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-1.5">
                                <i class="fas fa-receipt group-hover:scale-110 transition-transform"></i> <span class="hidden sm:inline">Record</span>
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100 w-full">
                        <div class="relative flex-1">
                            <input type="date" id="finFilterFrom" class="w-full text-xs sm:text-sm px-2 sm:px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white shadow-sm" onchange="FinanceManager.applyFilter()">
                        </div>
                        <span class="text-xs text-gray-400 font-semibold"><i class="fas fa-arrow-right"></i></span>
                        <div class="relative flex-1">
                            <input type="date" id="finFilterTo" class="w-full text-xs sm:text-sm px-2 sm:px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white shadow-sm" onchange="FinanceManager.applyFilter()">
                        </div>
                        <button onclick="FinanceManager.clearFilter()" class="bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-400 px-3 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center shrink-0" title="Clear Dates">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <div id="financeGroupsContainer" class="space-y-3 pb-4">
                </div>
            </div>
        </div>

        <div id="financeRecordModal" class="hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
                <div class="bg-blue-800 p-4 flex justify-between items-center shrink-0">
                    <h2 class="text-white font-bold text-lg flex items-center">
                        <i class="fas fa-wallet mr-2"></i>Log Transaction 
                        <span id="recordModalBadge" class="text-[10px] bg-blue-600 px-2 py-1 rounded ml-2 hidden font-semibold border border-blue-400"></span>
                    </h2>
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
                            <button type="submit" id="financeSubmitBtn" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Save Records</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div id="newProjectModal" class="hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                <div class="bg-blue-800 p-4 flex justify-between items-center">
                    <h2 class="text-white font-bold text-lg"><i class="fas fa-folder-plus mr-2"></i>New Project Tracker</h2>
                    <button onclick="document.getElementById('newProjectModal').classList.add('hidden')" class="text-blue-200 hover:text-white"><i class="fas fa-times text-xl"></i></button>
                </div>
                <form id="newProjectForm" class="p-5 space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-1">Project/Event Name</label>
                        <input type="text" id="newProjName" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Siargao Trip, Home Renovation" required>
                    </div>
                    <div class="pt-2 flex gap-3">
                        <button type="button" onclick="document.getElementById('newProjectModal').classList.add('hidden')" class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition">Cancel</button>
                        <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition">Create</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="imageViewerModal" class="hidden fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-4" onclick="this.classList.add('hidden')">
            <button class="absolute top-4 right-4 text-white hover:text-red-400 text-3xl"><i class="fas fa-times"></i></button>
            <img id="viewerImage" src="" class="max-w-full max-h-full object-contain rounded shadow-2xl">
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
            const [ledgerRes, projRes] = await Promise.all([
                API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_finance_ledger' }),
                API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_projects' })
            ]);

            if (ledgerRes.status === 'success' && projRes.status === 'success') {
                FinanceManager.rawData = {
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

                FinanceManager.applyFilter();
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
        }
    },

    clearFilter: () => {
        document.getElementById('finFilterFrom').value = '';
        document.getElementById('finFilterTo').value = '';
        FinanceManager.applyFilter();
    },

    applyFilter: () => {
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

        const filteredTx = FinanceManager.rawData.transactions.filter(t => dateFilter(t.Date));
        const filteredTh = FinanceManager.rawData.teachingHours.filter(th => dateFilter(th.Date_Paid || th.Date));

        FinanceManager.renderCards(filteredTx, filteredTh, FinanceManager.rawData.projects);
    },

    renderCards: (transactions, teachingHours, projects) => {
        let globalIncome = 0;
        let globalExpense = 0;
        const root = {}; 
        const lists = { MainGroup: new Set(), SubGroup1: new Set(), SubGroup2: new Set(), SubGroup3: new Set(), SubGroup4: new Set(), SubGroup5: new Set() };
        
        projects.forEach(p => {
            root[`proj_${p.Project_ID}`] = {
                key: `proj_${p.Project_ID}`, title: p.Name, type: 'project', id: p.Project_ID, fullId: `proj_${p.Project_ID}`,
                income: 0, expense: 0, latestDate: null, records: [], children: {}
            };
        });

        const aggregatedEarnings = {};
        teachingHours.forEach(th => {
            const date = th.Date_Paid || th.Date;
            const uni = th.University || 'Unknown';
            const col = th.College || th.Department || 'Unknown';
            const subj = th.Subject || 'Unknown';
            
            const key = `${date}_${uni}_${col}_${subj}`;

            if (!aggregatedEarnings[key]) {
                aggregatedEarnings[key] = {
                    date: date,
                    uni: uni,
                    col: col,
                    subj: subj,
                    amount: 0
                };
            }
            aggregatedEarnings[key].amount += parseFloat(th.Total_Earnings || 0);
        });

        Object.values(aggregatedEarnings).forEach(ag => {
            const record = {
                date: ag.date, type: 'Income', group: 'Teaching',
                subGroup1: ag.uni, subGroup2: ag.col, subGroup3: ag.subj, subGroup4: '', subGroup5: '',
                desc: `${ag.uni} - ${ag.subj}`, amount: ag.amount, projectId: null, attachment: null
            };
            lists.MainGroup.add('Teaching');
            if (ag.uni !== 'Unknown') lists.SubGroup1.add(ag.uni);
            if (ag.col !== 'Unknown') lists.SubGroup2.add(ag.col);
            if (ag.subj !== 'Unknown') lists.SubGroup3.add(ag.subj);
            FinanceManager.insertIntoTree(root, record, projects);
            globalIncome += record.amount;
        });

        transactions.forEach(t => {
            const amt = parseFloat(t.Amount);
            const record = {
                date: t.Date, type: t.Type, group: t.Main_Group,
                subGroup1: t.Sub_Group_1, subGroup2: t.Sub_Group_2, subGroup3: t.Sub_Group_3, subGroup4: t.Sub_Group_4, subGroup5: t.Sub_Group_5,
                desc: t.Description, amount: amt, projectId: t.Project_ID, attachment: t.Attachment
            };

            if (t.Main_Group) lists.MainGroup.add(t.Main_Group);
            if (t.Sub_Group_1) lists.SubGroup1.add(t.Sub_Group_1);
            if (t.Sub_Group_2) lists.SubGroup2.add(t.Sub_Group_2);
            if (t.Sub_Group_3) lists.SubGroup3.add(t.Sub_Group_3);
            if (t.Sub_Group_4) lists.SubGroup4.add(t.Sub_Group_4);
            if (t.Sub_Group_5) lists.SubGroup5.add(t.Sub_Group_5);

            if (t.Type === 'Income') globalIncome += amt;
            else globalExpense += amt;

            FinanceManager.insertIntoTree(root, record, projects);
        });

        document.getElementById('finTotalIncome').innerText = `₱${FinanceManager.formatMoney(globalIncome)}`;
        document.getElementById('finTotalExpense').innerText = `₱${FinanceManager.formatMoney(globalExpense)}`;
        document.getElementById('finNetBalance').innerText = `₱${FinanceManager.formatMoney(globalIncome - globalExpense)}`;

        Object.keys(lists).forEach(k => {
            const dl = document.getElementById(`dl_${k}`);
            if (dl) dl.innerHTML = Array.from(lists[k]).map(v => `<option value="${v}">`).join('');
        });

        let rootNodes = Object.values(root).filter(node => {
            if (node.type === 'project' && node.income === 0 && node.expense === 0) {
                return false;
            }
            return true;
        });

        rootNodes.sort((a, b) => {
            if (a.type !== 'project' && b.type === 'project') return -1;
            if (a.type === 'project' && b.type !== 'project') return 1;

            if (a.type === 'project' && b.type === 'project') {
                const dateA = a.latestDate ? new Date(a.latestDate).getTime() : 0;
                const dateB = b.latestDate ? new Date(b.latestDate).getTime() : 0;
                if (dateB !== dateA) return dateB - dateA; 
                return a.title.localeCompare(b.title);
            }

            if (a.title === 'Income' && b.title !== 'Income') return -1;
            if (b.title === 'Income' && a.title !== 'Income') return 1;

            return a.title.localeCompare(b.title);
        });

        let html = '';
        rootNodes.forEach(node => {
            html += FinanceManager.buildNodeHtml(node, 0);
        });

        document.getElementById('financeGroupsContainer').innerHTML = html || `<p class="text-center text-gray-400 text-sm italic mt-8">No records match this date range.</p>`;
    },

    insertIntoTree: (root, record, projects) => {
        let path = [];
        
        if (record.projectId) {
            const p = projects.find(x => x.Project_ID === record.projectId);
            path.push({ key: `proj_${record.projectId}`, title: p ? p.Name : 'Unknown Project', type: 'project', id: record.projectId });
            if (record.group) {
                path.push({ key: `group_${record.group.replace(/\s+/g, '_')}`, title: record.group, type: 'group', id: record.group });
            }
        } else {
            path.push({ key: `type_${record.type}`, title: record.type, type: 'type', id: record.type });
            if (record.group) {
                path.push({ key: `group_${record.group.replace(/\s+/g, '_')}`, title: record.group, type: 'group', id: record.group });
            }
        }

        const subs = [record.subGroup1, record.subGroup2, record.subGroup3, record.subGroup4, record.subGroup5];
        for (let sub of subs) {
            if (sub && sub.trim() !== '' && sub !== 'Unknown') {
                path.push({ key: `sub_${sub.replace(/\s+/g, '_')}`, title: sub, type: 'sub' });
            }
        }

        let currentLevel = root;
        path.forEach((pItem, index) => {
            if (!currentLevel[pItem.key]) {
                currentLevel[pItem.key] = {
                    key: pItem.key,
                    title: pItem.title,
                    type: pItem.type,
                    id: pItem.id || pItem.title,
                    fullId: path.slice(0, index+1).map(x => x.key).join('-').replace(/[^a-zA-Z0-9_-]/g, ''),
                    income: 0,
                    expense: 0,
                    latestDate: null,
                    records: [],
                    children: {}
                };
            }
            
            const node = currentLevel[pItem.key];
            if (record.type === 'Income') node.income += record.amount;
            else node.expense += record.amount;
            
            if (record.date) {
                if (!node.latestDate || new Date(record.date) > new Date(node.latestDate)) {
                    node.latestDate = record.date;
                }
            }

            if (index === path.length - 1) {
                node.records.push(record);
            }
            
            currentLevel = node.children;
        });
    },

    buildNodeHtml: (node, level) => {
        let html = '';
        const net = node.income - node.expense;
        const netColor = net >= 0 ? 'text-green-600' : 'text-red-600';
        
        let recordsHtml = '';
        if (node.records.length > 0) {
            node.records.sort((a, b) => new Date(a.date) - new Date(b.date));
            
            let rowsHtml = node.records.map(r => {
                const isIncome = r.type === 'Income';
                const sign = isIncome ? '+' : '-';
                const colorClass = isIncome ? 'text-green-600' : 'text-red-600';
                const attachBtn = r.attachment ? `<button onclick="FinanceManager.viewImage(this.dataset.img)" data-img="${r.attachment}" class="text-[9px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-1 transition cursor-pointer"><i class="fas fa-image"></i> Image</button>` : '';

                return `
                <tr class="border-b border-gray-50 hover:bg-blue-50/50 transition">
                    <td class="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500 align-top pt-3 w-20">${r.date}</td>
                    <td class="px-3 py-2 align-top pt-2.5">
                        <span class="font-semibold text-gray-700 block text-sm leading-tight">${r.desc}</span>
                        ${attachBtn}
                    </td>
                    <td class="px-3 py-2 text-right font-bold ${colorClass} whitespace-nowrap align-top pt-3 w-24">
                        ${sign}₱${FinanceManager.formatMoney(r.amount)}
                    </td>
                </tr>`;
            }).join('');
            
            recordsHtml = `
            <div class="overflow-x-auto ${level > 0 ? '' : 'px-1'}">
                <table class="w-full text-left text-gray-600">
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>`;
        }

        let childrenHtml = '';
        Object.keys(node.children).sort().forEach(childKey => {
            childrenHtml += FinanceManager.buildNodeHtml(node.children[childKey], level + 1);
        });

        if (level === 0) {
            const icon = node.type === 'project' ? '<i class="fas fa-folder-open"></i>' : '<i class="fas fa-layer-group"></i>';
            const badge = node.type === 'project' ? `<span class="bg-indigo-100 text-indigo-800 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ml-2 border border-indigo-200">Project</span>` : '';
            
            html += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-3">
                <div class="p-4 bg-gray-50/80 hover:bg-gray-100 transition flex justify-between items-center cursor-pointer select-none" onclick="FinanceManager.toggleElement('${node.fullId}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${node.type === 'project' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center shrink-0 shadow-sm border border-white">
                            ${icon}
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 leading-tight">${node.title} ${badge}</h3>
                        </div>
                    </div>
                    <div class="text-right flex items-center gap-3 sm:gap-4">
                        <div class="text-right mr-1">
                            <p class="text-[9px] text-gray-400 uppercase font-bold hidden sm:block">Net Position</p>
                            <p class="text-sm font-bold ${netColor}">₱${FinanceManager.formatMoney(net)}</p>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform duration-300" id="icon-${node.fullId}"></i>
                    </div>
                </div>
                
                <div class="hidden flex-col bg-white" id="body-${node.fullId}">
                    <div class="p-3 bg-gray-50 flex justify-between items-center border-t border-b border-gray-200 shadow-inner">
                        <div class="flex gap-4">
                            <div><span class="text-[9px] text-gray-500 uppercase font-bold block">Income</span><span class="text-sm font-bold text-green-600">₱${FinanceManager.formatMoney(node.income)}</span></div>
                            <div><span class="text-[9px] text-gray-500 uppercase font-bold block">Expense</span><span class="text-sm font-bold text-red-600">₱${FinanceManager.formatMoney(node.expense)}</span></div>
                        </div>
                        <button onclick="FinanceManager.openRecordForm('${node.type === 'project' ? node.id : ''}', '${node.title}', '${node.type === 'group' ? node.id : ''}')" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                            <i class="fas fa-plus"></i> <span class="hidden sm:inline">Add</span>
                        </button>
                    </div>
                    ${recordsHtml}
                    ${childrenHtml}
                </div>
            </div>`;
        } else {
            const paddingBase = 1; 
            const paddingIndent = level * 0.75; 
            const paddingLeft = paddingBase + paddingIndent;

            html += `
            <div class="border-t border-gray-100 bg-white">
                <div class="p-2 bg-gray-50/40 hover:bg-gray-100 transition flex justify-between items-center cursor-pointer select-none" style="padding-left: ${paddingLeft}rem;" onclick="FinanceManager.toggleElement('${node.fullId}')">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-level-up-alt rotate-90 text-gray-300 text-[10px]"></i>
                        <h4 class="font-bold text-gray-700 text-xs">${node.title}</h4>
                    </div>
                    <div class="flex items-center gap-3 pr-2">
                        <span class="text-[11px] font-bold ${netColor}">₱${FinanceManager.formatMoney(net)}</span>
                        <i class="fas fa-chevron-down text-gray-300 text-[10px] transition-transform duration-300" id="icon-${node.fullId}"></i>
                    </div>
                </div>
                <div class="hidden flex-col bg-white overflow-hidden border-t border-gray-50 shadow-inner" id="body-${node.fullId}">
                    ${recordsHtml}
                    ${childrenHtml}
                </div>
            </div>`;
        }
        return html;
    },

    toggleElement: (key) => {
        const body = document.getElementById(`body-${key}`);
        const icon = document.getElementById(`icon-${key}`);
        if (body.classList.contains('hidden')) {
            body.classList.remove('hidden');
            body.classList.add('flex');
            icon.style.transform = 'rotate(180deg)';
        } else {
            body.classList.add('hidden');
            body.classList.remove('flex');
            icon.style.transform = 'rotate(0deg)';
        }
    },

    viewImage: (base64Str) => {
        const modal = document.getElementById('imageViewerModal');
        const img = document.getElementById('viewerImage');
        img.src = base64Str;
        modal.classList.remove('hidden');
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

    openRecordForm: (projectId = null, projectName = null, prefillGroup = null) => {
        FinanceManager.recordEntries = [];
        FinanceManager.currentProjectId = projectId || null;
        FinanceManager.currentPrefillGroup = prefillGroup || null;
        
        const badge = document.getElementById('recordModalBadge');
        if (projectName) {
            badge.innerHTML = `<i class="fas ${projectId ? 'fa-folder-open' : 'fa-layer-group'} mr-1"></i> ${projectName}`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        document.getElementById('financeEntriesContainer').innerHTML = '';
        FinanceManager.addRecordEntry();
        document.getElementById('financeRecordModal').classList.remove('hidden');
    },

    closeRecordForm: () => {
        FinanceManager.currentProjectId = null;
        FinanceManager.currentPrefillGroup = null;
        document.getElementById('financeRecordModal').classList.add('hidden');
    },

    addRecordEntry: () => {
        const idx = FinanceManager.recordEntries.length;
        FinanceManager.recordEntries.push({ idx });

        const container = document.getElementById('financeEntriesContainer');
        const div = document.createElement('div');
        div.id = `fin-entry-${idx}`;
        div.className = 'fin-entry bg-gray-50 border border-gray-200 rounded-xl p-4 relative shadow-sm';

        const today = new Date().toISOString().split('T')[0];
        const groupValue = FinanceManager.currentPrefillGroup ? `value="${FinanceManager.currentPrefillGroup}"` : '';

        div.innerHTML = `
            ${idx > 0 ? `<button type="button" onclick="this.parentElement.remove()" class="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition p-1"><i class="fas fa-times text-lg"></i></button>` : ''}
            
            <div class="grid grid-cols-2 gap-3">
                <input type="date" id="finDate_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value="${today}" required>
                <select id="finType_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                </select>
            </div>
            
            <input type="text" id="finGroup_${idx}" list="dl_MainGroup" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mt-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Main Group (e.g., Personal, Earnings)" ${groupValue} required>
            
            <div class="grid grid-cols-5 gap-2 mt-3">
                <input type="text" id="finSubGroup1_${idx}" list="dl_SubGroup1" class="w-full px-1 sm:px-2 py-2 rounded-lg border border-gray-300 text-[10px] sm:text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 1">
                <input type="text" id="finSubGroup2_${idx}" list="dl_SubGroup2" class="w-full px-1 sm:px-2 py-2 rounded-lg border border-gray-300 text-[10px] sm:text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 2">
                <input type="text" id="finSubGroup3_${idx}" list="dl_SubGroup3" class="w-full px-1 sm:px-2 py-2 rounded-lg border border-gray-300 text-[10px] sm:text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 3">
                <input type="text" id="finSubGroup4_${idx}" list="dl_SubGroup4" class="w-full px-1 sm:px-2 py-2 rounded-lg border border-gray-300 text-[10px] sm:text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 4">
                <input type="text" id="finSubGroup5_${idx}" list="dl_SubGroup5" class="w-full px-1 sm:px-2 py-2 rounded-lg border border-gray-300 text-[10px] sm:text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 5">
            </div>
            
            <div class="mt-3 bg-white p-2 border border-gray-300 rounded-lg flex items-center justify-between overflow-hidden">
                <label for="finFile_${idx}" class="text-xs font-medium text-gray-600 cursor-pointer flex-1 whitespace-nowrap"><i class="fas fa-camera mr-2"></i> Attach Image</label>
                <input type="file" id="finFile_${idx}" accept="image/*" class="text-[10px] text-gray-500 w-full max-w-[140px]">
            </div>

            <input type="text" id="finDesc_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm mt-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Description" required>
            
            <div class="relative mt-3">
                <span class="absolute left-3 top-2.5 text-gray-400 font-bold">₱</span>
                <input type="number" id="finAmt_${idx}" class="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0.00" step="0.01" required>
            </div>
        `;
        container.appendChild(div);
    },

    submitRecords: async (e) => {
        e.preventDefault();
        const btn = document.getElementById('financeSubmitBtn');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i> Saving...';
        btn.disabled = true;

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
            
            const fileInput = document.getElementById(`finFile_${idx}`);
            let attachmentData = null;

            if (fileInput && fileInput.files.length > 0) {
                try {
                    attachmentData = await FinanceManager.compressImage(fileInput.files[0]);
                } catch(err) {
                    console.error("Failed to compress image", err);
                }
            }

            if (!date || !type || !desc || !amt) continue;

            records.push({ 
                date, type, group, 
                subGroup1, subGroup2, subGroup3, subGroup4, subGroup5, 
                description: desc, amount: amt,
                projectId: FinanceManager.currentProjectId,
                attachment: attachmentData
            });
        }

        if (records.length === 0) {
            btn.innerHTML = origText;
            btn.disabled = false;
            return;
        }

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
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    }
};
