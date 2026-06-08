export const FinanceUI = {
    injectComponent() {
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

                    <div class="flex items-center gap-1 sm:gap-2 bg-gray-50 p-1.5 sm:p-2 rounded-xl border border-gray-100 w-full min-w-0">
                        <div class="relative flex-1 min-w-0">
                            <input type="date" id="finFilterFrom" class="w-full text-[10px] sm:text-sm px-1 sm:px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white shadow-sm min-w-0" onchange="FinanceManager.applyFilter()">
                        </div>
                        <span class="text-[10px] sm:text-xs text-gray-400 font-semibold shrink-0"><i class="fas fa-arrow-right"></i></span>
                        <div class="relative flex-1 min-w-0">
                            <input type="date" id="finFilterTo" class="w-full text-[10px] sm:text-sm px-1 sm:px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white shadow-sm min-w-0" onchange="FinanceManager.applyFilter()">
                        </div>
                        <button onclick="FinanceManager.clearFilter()" class="bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-400 px-2 sm:px-3 py-2 rounded-lg transition-all shadow-sm flex items-center justify-center shrink-0" title="Clear Dates">
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
                <div class="bg-blue-800 p-2 flex justify-between items-center shrink-0">
                    <h2 class="text-white font-bold text-base flex items-center ml-2">
                        <i class="fas fa-wallet mr-2"></i><span id="recordModalTitleText">Log Transaction</span>
                        <span id="recordModalBadge" class="text-[9px] bg-blue-600 px-1.5 py-0.5 rounded ml-2 hidden font-semibold border border-blue-400 truncate max-w-[120px]"></span>
                    </h2>
                    <button type="button" onclick="FinanceManager.closeRecordForm()" class="text-blue-200 hover:text-white shrink-0 mr-1"><i class="fas fa-times text-lg"></i></button>
                </div>
                <div class="p-4 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/50">
                    <form id="financeRecordForm" class="space-y-4">
                        <div id="financeEntriesContainer" class="space-y-3"></div>
                        <button type="button" id="financeAddAnotherBtn" onclick="FinanceManager.addRecordEntry()" class="w-full py-2 border-2 border-dashed border-blue-300 text-blue-500 bg-blue-50/50 rounded-xl hover:border-blue-500 hover:text-blue-600 transition text-sm font-medium">
                            <i class="fas fa-plus mr-1"></i> Add Another Item
                        </button>
                        <div class="pt-4 flex gap-3">
                            <button type="button" id="financeDeleteBtn" class="hidden px-4 py-2 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition shadow-sm" title="Delete Transaction"><i class="fas fa-trash"></i></button>
                            <button type="button" onclick="FinanceManager.closeRecordForm()" class="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition shadow-sm">Cancel</button>
                            <button type="submit" id="financeSubmitBtn" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition shadow-sm">Save Records</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div id="newProjectModal" class="hidden fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
                <div class="bg-blue-800 p-4 flex justify-between items-center">
                    <h2 class="text-white font-bold text-lg"><i class="fas fa-folder-plus mr-2"></i>New Project Tracker</h2>
                    <button type="button" onclick="document.getElementById('newProjectModal').classList.add('hidden')" class="text-blue-200 hover:text-white shrink-0"><i class="fas fa-times text-xl"></i></button>
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
            <button type="button" class="absolute top-4 right-4 text-white hover:text-red-400 text-3xl"><i class="fas fa-times"></i></button>
            <img id="viewerImage" src="" class="max-w-full max-h-full object-contain rounded shadow-2xl">
        </div>

        <datalist id="dl_Projects"></datalist>
        <datalist id="dl_MainGroup"></datalist>
        <datalist id="dl_SubGroup1"></datalist>
        <datalist id="dl_SubGroup2"></datalist>
        <datalist id="dl_SubGroup3"></datalist>
        <datalist id="dl_SubGroup4"></datalist>
        <datalist id="dl_SubGroup5"></datalist>
        `;
        
        mainView.insertAdjacentHTML('beforeend', financeHtml);
    },

    renderCards(transactions, teachingHours, projects) {
        let globalIncome = 0;
        let globalExpense = 0;
        const root = {}; 
        const lists = { Projects: new Set(), MainGroup: new Set(), SubGroup1: new Set(), SubGroup2: new Set(), SubGroup3: new Set(), SubGroup4: new Set(), SubGroup5: new Set() };
        
        projects.forEach(p => {
            lists.Projects.add(p.Name);
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
            this.insertIntoTree(root, record, projects);
            globalIncome += record.amount;
        });

        transactions.forEach(t => {
            const amt = parseFloat(t.Amount);
            const record = {
                rawId: t.ID || t.id || t.Entry_ID || null,
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

            this.insertIntoTree(root, record, projects);
        });

        document.getElementById('finTotalIncome').innerText = `₱${this.formatMoney(globalIncome)}`;
        document.getElementById('finTotalExpense').innerText = `₱${this.formatMoney(globalExpense)}`;
        document.getElementById('finNetBalance').innerText = `₱${this.formatMoney(globalIncome - globalExpense)}`;

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
            html += this.buildNodeHtml(node, 0);
        });

        document.getElementById('financeGroupsContainer').innerHTML = html || `<p class="text-center text-gray-400 text-sm italic mt-8">No records match this date range.</p>`;
    },

    insertIntoTree(root, record, projects) {
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

    buildNodeHtml(node, level) {
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
                const attachBtn = r.attachment ? `<button type="button" onclick="FinanceManager.viewImage(this.dataset.img)" data-img="${r.attachment}" class="text-[9px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-1 transition cursor-pointer"><i class="fas fa-image"></i> Image</button>` : '';
                
                const actionMenu = r.rawId ? `
                <td class="px-1 py-2 align-top pt-2.5 w-6 text-center">
                    <button type="button" onclick="FinanceManager.editRecord('${r.rawId}')" class="text-blue-500 hover:text-blue-700 px-1 py-0.5 rounded transition-colors focus:outline-none" title="Edit Transaction">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>` : `<td class="w-6"></td>`;

                const longPressEvents = r.rawId ? `
                    oncontextmenu="event.preventDefault(); FinanceManager.editRecord('${r.rawId}');"
                    ontouchstart="this.pressTimer = window.setTimeout(() => { FinanceManager.editRecord('${r.rawId}'); }, 600);"
                    ontouchend="clearTimeout(this.pressTimer);"
                    ontouchmove="clearTimeout(this.pressTimer);"
                ` : '';

                return `
                <tr class="border-b border-gray-50 hover:bg-blue-50/50 transition relative select-none" ${longPressEvents}>
                    <td class="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500 align-top pt-3 w-20">${r.date}</td>
                    <td class="px-3 py-2 align-top pt-2.5">
                        <span class="font-semibold text-gray-700 block text-sm leading-tight">${r.desc}</span>
                        <div>${attachBtn}</div>
                    </td>
                    <td class="px-3 py-2 text-right font-bold ${colorClass} whitespace-nowrap align-top pt-3 w-24">
                        ${sign}₱${this.formatMoney(r.amount)}
                    </td>
                    ${actionMenu}
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
            childrenHtml += this.buildNodeHtml(node.children[childKey], level + 1);
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
                            <p class="text-sm font-bold ${netColor}">₱${this.formatMoney(net)}</p>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform duration-300" id="icon-${node.fullId}"></i>
                    </div>
                </div>
                
                <div class="hidden flex-col bg-white" id="body-${node.fullId}">
                    <div class="p-3 bg-gray-50 flex justify-between items-center border-t border-b border-gray-200 shadow-inner">
                        <div class="flex gap-4">
                            <div><span class="text-[9px] text-gray-500 uppercase font-bold block">Income</span><span class="text-sm font-bold text-green-600">₱${this.formatMoney(node.income)}</span></div>
                            <div><span class="text-[9px] text-gray-500 uppercase font-bold block">Expense</span><span class="text-sm font-bold text-red-600">₱${this.formatMoney(node.expense)}</span></div>
                        </div>
                        <button type="button" onclick="FinanceManager.openRecordForm('${node.type === 'project' ? node.id : ''}', '${node.type === 'project' ? node.title.replace(/'/g, "\\'") : ''}', '${node.type === 'group' ? node.id.replace(/'/g, "\\'") : ''}')" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
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
                        <span class="text-[11px] font-bold ${netColor}">₱${this.formatMoney(net)}</span>
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

    toggleElement(key) {
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

    viewImage(base64Str) {
        const modal = document.getElementById('imageViewerModal');
        const img = document.getElementById('viewerImage');
        img.src = base64Str;
        modal.classList.remove('hidden');
    }
};
