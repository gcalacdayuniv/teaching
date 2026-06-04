import { CONFIG, API } from './globals.js';

export const FinanceManager = {
    recordEntries: [],
    currentProjectId: null,
    currentPrefillGroup: null,

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
                    resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% JPEG
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
            
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 shrink-0">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold text-gray-800">Financial Overview</h2>
                    <div class="flex gap-2">
                        <button onclick="FinanceManager.openNewProjectModal()" class="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-blue-200">
                            <i class="fas fa-folder-plus"></i> New Project
                        </button>
                        <button onclick="FinanceManager.openRecordForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm">
                            <i class="fas fa-plus"></i> Log Transaction
                        </button>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-4 mt-2">
                    <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                        <p class="text-xs text-green-600 font-bold uppercase tracking-wide">Total Income</p>
                        <p class="text-2xl font-black text-green-700 mt-1" id="finTotalIncome">₱0.00</p>
                    </div>
                    <div class="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                        <p class="text-xs text-red-600 font-bold uppercase tracking-wide">Total Expense</p>
                        <p class="text-2xl font-black text-red-700 mt-1" id="finTotalExpense">₱0.00</p>
                    </div>
                </div>
                <div class="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
                    <p class="text-xs text-gray-500 font-bold uppercase tracking-wide">Net Balance</p>
                    <p class="text-3xl font-black text-gray-800 mt-1" id="finNetBalance">₱0.00</p>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <h3 class="font-bold text-gray-700 mb-3 ml-1">Ledgers & Categories</h3>
                <div id="financeGroupsContainer" class="space-y-3">
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
                FinanceManager.renderCards(ledgerRes.transactions, ledgerRes.teachingHours, projRes.projects);
            }
        } catch (err) {
            console.error("Failed to load finance data:", err);
        }
    },

    renderCards: (transactions, teachingHours, projects) => {
        let globalIncome = 0;
        let globalExpense = 0;

        const groups = {}; 
        const lists = { MainGroup: new Set(), SubGroup1: new Set(), SubGroup2: new Set(), SubGroup3: new Set(), SubGroup4: new Set(), SubGroup5: new Set() };
        
        projects.forEach(p => {
            groups[`proj_${p.Project_ID}`] = {
                title: p.Name, type: 'project', id: p.Project_ID, income: 0, expense: 0, records: []
            };
        });

        const groupedTeaching = {};
        teachingHours.forEach(th => {
            const date = th.Date_Paid || th.Date;
            if (!groupedTeaching[date]) {
                groupedTeaching[date] = {
                    date: date, type: 'Income', group: 'Earnings',
                    subGroup1: 'Teaching', subGroup2: '', subGroup3: '', subGroup4: '', subGroup5: '',
                    desc: 'Teaching Earnings (Aggregated)', amount: 0, projectId: null, attachment: null
                };
            }
            groupedTeaching[date].amount += parseFloat(th.Total_Earnings);
        });

        if (Object.keys(groupedTeaching).length > 0 && !groups['group_Earnings']) {
            groups['group_Earnings'] = { title: 'Earnings', type: 'group', id: 'Earnings', income: 0, expense: 0, records: [] };
        }

        Object.values(groupedTeaching).forEach(gt => {
            groups['group_Earnings'].records.push(gt);
            groups['group_Earnings'].income += gt.amount;
            globalIncome += gt.amount;
            lists.MainGroup.add('Earnings');
            lists.SubGroup1.add('Teaching');
        });

        transactions.forEach(t => {
            const amt = parseFloat(t.Amount);
            const r = {
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

            let groupKey = t.Project_ID ? `proj_${t.Project_ID}` : `group_${t.Main_Group}`;
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    title: t.Project_ID ? 'Unknown Project' : t.Main_Group,
                    type: t.Project_ID ? 'project' : 'group', id: t.Project_ID || t.Main_Group,
                    income: 0, expense: 0, records: []
                };
            }

            groups[groupKey].records.push(r);
            if (t.Type === 'Income') groups[groupKey].income += amt;
            else groups[groupKey].expense += amt;
        });

        document.getElementById('finTotalIncome').innerText = `₱${FinanceManager.formatMoney(globalIncome)}`;
        document.getElementById('finTotalExpense').innerText = `₱${FinanceManager.formatMoney(globalExpense)}`;
        document.getElementById('finNetBalance').innerText = `₱${FinanceManager.formatMoney(globalIncome - globalExpense)}`;

        Object.keys(lists).forEach(k => {
            const dl = document.getElementById(`dl_${k}`);
            if (dl) dl.innerHTML = Array.from(lists[k]).map(v => `<option value="${v}">`).join('');
        });

        let cardsHtml = '';
        Object.keys(groups).sort().forEach(key => {
            const g = groups[key];
            g.records.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            const net = g.income - g.expense;
            const netColor = net >= 0 ? 'text-green-600' : 'text-red-600';
            const icon = g.type === 'project' ? '<i class="fas fa-folder-open"></i>' : '<i class="fas fa-layer-group"></i>';
            const badge = g.type === 'project' ? `<span class="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ml-2">Project</span>` : '';

            let rowsHtml = '';
            if (g.records.length === 0) {
                rowsHtml = `<tr><td colspan="4" class="px-3 py-4 text-center text-gray-400 italic text-sm">No transactions yet.</td></tr>`;
            } else {
                g.records.forEach((r, rIdx) => {
                    const isIncome = r.type === 'Income';
                    const colorClass = isIncome ? 'text-green-600' : 'text-red-600';
                    const sign = isIncome ? '+' : '-';
                    const subGroupsArr = [r.subGroup1, r.subGroup2, r.subGroup3, r.subGroup4, r.subGroup5].filter(Boolean);
                    const subGroupsHtml = subGroupsArr.length > 0 ? `<span class="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded mt-1 inline-block border border-gray-200 mr-1">${subGroupsArr.join(' / ')}</span>` : '';
                    
                    const attachBtn = r.attachment ? `<button onclick="FinanceManager.viewImage(this.dataset.img)" data-img="${r.attachment}" class="text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1 mt-1 transition cursor-pointer"><i class="fas fa-image"></i> View</button>` : '';

                    rowsHtml += `
                    <tr class="border-b border-gray-50 hover:bg-blue-50/30 transition">
                        <td class="px-3 py-3 whitespace-nowrap text-xs">${r.date}</td>
                        <td class="px-3 py-3">
                            <span class="font-bold text-gray-700 block text-sm">${r.desc}</span>
                            ${subGroupsHtml} ${attachBtn}
                        </td>
                        <td class="px-3 py-3 text-right font-bold ${colorClass} whitespace-nowrap">
                            ${sign}₱${FinanceManager.formatMoney(r.amount)}
                        </td>
                    </tr>`;
                });
            }

            cardsHtml += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div class="p-4 bg-gray-50/50 hover:bg-gray-100 transition flex justify-between items-center cursor-pointer select-none" onclick="FinanceManager.toggleGroup('${key}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${g.type === 'project' ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'} flex items-center justify-center shrink-0">
                            ${icon}
                        </div>
                        <div>
                            <h3 class="font-bold text-gray-800 leading-tight">${g.title} ${badge}</h3>
                            <p class="text-[11px] text-gray-500 font-medium mt-0.5">${g.records.length} Records</p>
                        </div>
                    </div>
                    <div class="text-right flex items-center gap-4">
                        <div class="hidden sm:block text-right mr-2">
                            <p class="text-[10px] text-gray-400 uppercase font-bold">Net Position</p>
                            <p class="text-sm font-bold ${netColor}">₱${FinanceManager.formatMoney(net)}</p>
                        </div>
                        <i class="fas fa-chevron-down text-gray-400 transition-transform duration-300" id="icon-${key}"></i>
                    </div>
                </div>
                
                <div class="hidden border-t border-gray-200 bg-white flex-col" id="body-${key}">
                    <div class="p-3 bg-gray-50 flex justify-between items-center border-b border-gray-100">
                        <div class="flex gap-4">
                            <div><span class="text-[10px] text-gray-500 uppercase font-bold block">In</span><span class="text-sm font-bold text-green-600">₱${FinanceManager.formatMoney(g.income)}</span></div>
                            <div><span class="text-[10px] text-gray-500 uppercase font-bold block">Out</span><span class="text-sm font-bold text-red-600">₱${FinanceManager.formatMoney(g.expense)}</span></div>
                        </div>
                        <button onclick="FinanceManager.openRecordForm('${g.type === 'project' ? g.id : ''}', '${g.title}', '${g.type === 'group' ? g.id : ''}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                            <i class="fas fa-plus"></i> Add
                        </button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-gray-600">
                            <tbody class="divide-y divide-gray-50">
                                ${rowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            `;
        });

        document.getElementById('financeGroupsContainer').innerHTML = cardsHtml;
    },

    toggleGroup: (key) => {
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
                <input type="text" id="finSubGroup1_${idx}" list="dl_SubGroup1" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 1">
                <input type="text" id="finSubGroup2_${idx}" list="dl_SubGroup2" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 2">
                <input type="text" id="finSubGroup3_${idx}" list="dl_SubGroup3" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 3">
                <input type="text" id="finSubGroup4_${idx}" list="dl_SubGroup4" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 4">
                <input type="text" id="finSubGroup5_${idx}" list="dl_SubGroup5" class="w-full px-2 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Sub 5">
            </div>
            
            <div class="mt-3 bg-white p-2 border border-gray-300 rounded-lg flex items-center justify-between">
                <label for="finFile_${idx}" class="text-sm font-medium text-gray-600 cursor-pointer flex-1"><i class="fas fa-camera mr-2"></i> Attach Receipt/Image</label>
                <input type="file" id="finFile_${idx}" accept="image/*" class="text-xs text-gray-500 w-full max-w-[180px]">
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
