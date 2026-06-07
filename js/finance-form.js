import { CONFIG, API } from './globals.js';

export const FinanceForm = {
    editingRecordId: null,

    openNewProjectModal() {
        document.getElementById('newProjName').value = '';
        document.getElementById('newProjectModal').classList.remove('hidden');
    },

    async submitNewProject(e) {
        e.preventDefault();
        const name = document.getElementById('newProjName').value;
        if (!name) return;

        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'create_project', name: name });
            if (data.status === 'success') {
                document.getElementById('newProjectModal').classList.add('hidden');
                this.refreshLedger();
            } else {
                alert("Error: " + data.message);
            }
        } catch (error) {
            alert("Network error creating project.");
        }
    },

    openRecordForm(projectId = null, projectName = null, prefillGroup = null) {
        this.editingRecordId = null;
        this.recordEntries = [];
        this.currentProjectId = projectId || null;
        this.currentProjectName = projectName || null;
        this.currentPrefillGroup = prefillGroup || null;
        
        const badge = document.getElementById('recordModalBadge');
        if (projectName) {
            badge.innerHTML = `<i class="fas ${projectId ? 'fa-folder-open' : 'fa-layer-group'} mr-1"></i> ${projectName}`;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }

        document.getElementById('financeEntriesContainer').innerHTML = '';
        this.addRecordEntry();
        
        const addBtn = document.querySelector('button[onclick="FinanceManager.addRecordEntry()"]');
        if (addBtn) addBtn.classList.remove('hidden');
        
        const deleteBtn = document.getElementById('financeDeleteBtn');
        if (deleteBtn) deleteBtn.classList.add('hidden');

        document.getElementById('financeRecordModal').classList.remove('hidden');
    },

    closeRecordForm() {
        this.editingRecordId = null;
        this.currentProjectId = null;
        this.currentProjectName = null;
        this.currentPrefillGroup = null;
        document.getElementById('financeRecordModal').classList.add('hidden');
    },

    editRecord(id) {
        const tx = this.rawData.transactions.find(t => (t.ID || t.id || t.Entry_ID || t.Transaction_ID) == id);
        if (!tx) return;
        
        this.editingRecordId = id;
        this.recordEntries = [];
        this.currentProjectId = tx.Project_ID;
        const p = this.rawData.projects.find(x => x.Project_ID == tx.Project_ID);
        this.currentProjectName = p ? p.Name : '';
        this.currentPrefillGroup = tx.Main_Group;
        
        const badge = document.getElementById('recordModalBadge');
        badge.innerHTML = `<i class="fas fa-edit mr-1"></i> Edit Record`;
        badge.classList.remove('hidden');

        document.getElementById('financeEntriesContainer').innerHTML = '';
        this.addRecordEntry();
        
        const addBtn = document.querySelector('button[onclick="FinanceManager.addRecordEntry()"]');
        if (addBtn) addBtn.classList.add('hidden');
        
        const idx = 0;
        document.getElementById(`finId_${idx}`).value = id;
        document.getElementById(`finDate_${idx}`).value = tx.Date || '';
        document.getElementById(`finType_${idx}`).value = tx.Type || 'Expense';
        document.getElementById(`finAmt_${idx}`).value = tx.Amount || '';
        document.getElementById(`finDesc_${idx}`).value = tx.Description || '';
        document.getElementById(`finGroup_${idx}`).value = tx.Main_Group || '';
        document.getElementById(`finProject_${idx}`).value = this.currentProjectName;
        
        if (tx.Sub_Group_1) { document.getElementById(`finSubGroup1_${idx}`).value = tx.Sub_Group_1; }
        if (tx.Sub_Group_2) { this.showNextSubgroup(idx, 2); document.getElementById(`finSubGroup2_${idx}`).value = tx.Sub_Group_2; }
        if (tx.Sub_Group_3) { this.showNextSubgroup(idx, 3); document.getElementById(`finSubGroup3_${idx}`).value = tx.Sub_Group_3; }
        if (tx.Sub_Group_4) { this.showNextSubgroup(idx, 4); document.getElementById(`finSubGroup4_${idx}`).value = tx.Sub_Group_4; }
        if (tx.Sub_Group_5) { this.showNextSubgroup(idx, 5); document.getElementById(`finSubGroup5_${idx}`).value = tx.Sub_Group_5; }

        if (tx.Attachment) {
            const badgeEl = document.getElementById(`finFileBadge_${idx}`);
            if (badgeEl) {
                badgeEl.classList.remove('hidden');
                badgeEl.innerHTML = `<i class="fas fa-check"></i> Has Image`;
                badgeEl.classList.add('bg-indigo-500');
            }
        }

        let deleteBtn = document.getElementById('financeDeleteBtn');
        if (!deleteBtn) {
            const btnContainer = document.querySelector('#financeRecordForm .pt-4');
            btnContainer.insertAdjacentHTML('afterbegin', `
                <button type="button" id="financeDeleteBtn" onclick="FinanceManager.deleteRecord()" class="px-4 py-2 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition shadow-sm mr-auto">
                    <i class="fas fa-trash"></i>
                </button>
            `);
        } else {
            deleteBtn.classList.remove('hidden');
        }

        document.getElementById('financeRecordModal').classList.remove('hidden');
    },

    async deleteRecord() {
        if (!this.editingRecordId) return;
        if (!confirm('Are you sure you want to delete this transaction?')) return;

        const btn = document.getElementById('financeDeleteBtn');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;

        try {
            const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                action: 'delete_finance_record',
                transactionId: this.editingRecordId
            });

            if (data.status === 'success') {
                this.closeRecordForm();
                this.refreshLedger();
            } else {
                alert("Error: " + data.message);
            }
        } catch (error) {
            alert("Failed to delete record.");
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    },

    showNextSubgroup(idx, level) {
        const row = document.getElementById(`sg-row-${level}-${idx}`);
        if (row) {
            row.classList.remove('hidden');
            row.classList.add('flex');
        }
        const prevBtn = document.getElementById(`sg-btn-${level-1}-${idx}`);
        if (prevBtn) {
            prevBtn.classList.add('hidden');
        }
    },

    hideSubgroup(idx, level) {
        const row = document.getElementById(`sg-row-${level}-${idx}`);
        if (row) {
            row.classList.add('hidden');
            row.classList.remove('flex');
            const input = document.getElementById(`finSubGroup${level}_${idx}`);
            if (input) input.value = '';
        }
        const prevBtn = document.getElementById(`sg-btn-${level-1}-${idx}`);
        if (prevBtn) {
            prevBtn.classList.remove('hidden');
        }
    },

    updateSubgroupDatalist(idx, level) {
        if (!this.rawData) return;
        
        const group = document.getElementById(`finGroup_${idx}`)?.value;
        const s1 = document.getElementById(`finSubGroup1_${idx}`)?.value;
        const s2 = document.getElementById(`finSubGroup2_${idx}`)?.value;
        const s3 = document.getElementById(`finSubGroup3_${idx}`)?.value;
        const s4 = document.getElementById(`finSubGroup4_${idx}`)?.value;

        const validValues = new Set();
        
        if (group === 'Teaching' && this.rawData.teachingHours) {
            this.rawData.teachingHours.forEach(th => {
                if (level === 1 && th.University) validValues.add(th.University);
                if (level === 2 && s1 && th.University === s1 && (th.College || th.Department)) validValues.add(th.College || th.Department);
                if (level === 3 && s1 && th.University === s1 && s2 && (th.College || th.Department) === s2 && th.Subject) validValues.add(th.Subject);
            });
        }

        if (this.rawData.transactions) {
            this.rawData.transactions.forEach(t => {
                if (group && t.Main_Group !== group) return;
                if (level > 1 && s1 && t.Sub_Group_1 !== s1) return;
                if (level > 2 && s2 && t.Sub_Group_2 !== s2) return;
                if (level > 3 && s3 && t.Sub_Group_3 !== s3) return;
                if (level > 4 && s4 && t.Sub_Group_4 !== s4) return;
                
                let val = t[`Sub_Group_${level}`];
                if (val) validValues.add(val);
            });
        }

        const dl = document.getElementById(`dl_SubGroup${level}`);
        if (dl) {
            dl.innerHTML = Array.from(validValues).map(v => `<option value="${v}">`).join('');
        }
    },

    addRecordEntry() {
        const idx = this.recordEntries.length;
        this.recordEntries.push({ idx });

        const container = document.getElementById('financeEntriesContainer');
        const div = document.createElement('div');
        div.id = `fin-entry-${idx}`;
        div.className = 'fin-entry bg-white border border-gray-200 rounded-xl p-3 relative shadow-sm transition-all duration-300';

        const today = new Date().toISOString().split('T')[0];
        const groupValue = this.currentPrefillGroup ? `value="${this.currentPrefillGroup}"` : '';
        const projectValue = this.currentProjectName ? `value="${this.currentProjectName}"` : '';

        div.innerHTML = `
            ${idx > 0 && !this.editingRecordId ? `<button type="button" onclick="this.parentElement.remove()" class="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-full w-6 h-6 flex items-center justify-center transition shadow-sm z-10"><i class="fas fa-times text-xs"></i></button>` : ''}
            <input type="hidden" id="finId_${idx}">
            
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Date</label>
                    <input type="date" id="finDate_${idx}" value="${today}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" required>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Type</label>
                    <select id="finType_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-semibold text-gray-700">
                        <option value="Expense">Expense</option>
                        <option value="Income">Income</option>
                    </select>
                </div>
            </div>

            <div class="mb-3 relative">
                <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Project Tracker (Optional)</label>
                <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i class="fas fa-folder"></i></span>
                    <input type="text" id="finProject_${idx}" list="dl_Projects" ${projectValue} class="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Link to project...">
                </div>
            </div>

            <div class="bg-gray-50 p-3 rounded-xl border border-gray-100 mb-3 space-y-2">
                <div class="flex gap-2">
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Main Group</label>
                        <input type="text" id="finGroup_${idx}" list="dl_MainGroup" ${groupValue} onchange="FinanceManager.updateSubgroupDatalist(${idx}, 1)" class="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-gray-700" placeholder="e.g. Home, Auto" required>
                    </div>
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Subgroup 1</label>
                        <div class="flex gap-1">
                            <input type="text" id="finSubGroup1_${idx}" list="dl_SubGroup1" onchange="FinanceManager.updateSubgroupDatalist(${idx}, 2)" class="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Utilities">
                            <button type="button" id="sg-btn-1-${idx}" onclick="FinanceManager.showNextSubgroup(${idx}, 2)" class="px-2 bg-white border border-gray-300 rounded-lg text-gray-500 hover:text-blue-500 hover:border-blue-300"><i class="fas fa-plus text-[10px]"></i></button>
                        </div>
                    </div>
                </div>

                ${[2,3,4,5].map(level => `
                <div id="sg-row-${level}-${idx}" class="hidden gap-2 pt-1 border-t border-gray-200/60 mt-2">
                    <div class="flex-1">
                        <label class="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Subgroup ${level}</label>
                        <div class="flex gap-1">
                            <input type="text" id="finSubGroup${level}_${idx}" list="dl_SubGroup${level}" onchange="FinanceManager.updateSubgroupDatalist(${idx}, ${level+1})" class="w-full px-3 py-1 rounded-md border border-gray-300 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                            ${level < 5 ? `<button type="button" id="sg-btn-${level}-${idx}" onclick="FinanceManager.showNextSubgroup(${idx}, ${level+1})" class="px-2 bg-white border border-gray-300 rounded-md text-gray-500 hover:text-blue-500 hover:border-blue-300"><i class="fas fa-plus text-[10px]"></i></button>` : ''}
                            <button type="button" onclick="FinanceManager.hideSubgroup(${idx}, ${level})" class="px-2 bg-white border border-gray-300 rounded-md text-red-400 hover:bg-red-50 hover:border-red-200"><i class="fas fa-times text-[10px]"></i></button>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>

            <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Description</label>
                    <input type="text" id="finDesc_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="What was this for?" required>
                </div>
                <div>
                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-1">Amount (₱)</label>
                    <input type="number" step="0.01" id="finAmt_${idx}" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800" placeholder="0.00" required>
                </div>
            </div>
            
            <div class="mt-3 flex items-center justify-between bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                <label class="flex items-center gap-2 cursor-pointer group">
                    <div class="w-7 h-7 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-200 group-hover:text-indigo-600 transition">
                        <i class="fas fa-camera"></i>
                    </div>
                    <span class="text-xs font-semibold text-indigo-700">Attach Receipt</span>
                    <span id="finFileBadge_${idx}" class="hidden text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded-full"><i class="fas fa-check"></i></span>
                </label>
                <input type="file" id="finFile_${idx}" accept="image/*" class="hidden" onchange="document.getElementById('finFileBadge_${idx}').classList.remove('hidden')">
            </div>
        `;

        container.appendChild(div);
    },

    async submitRecords(e) {
        e.preventDefault();
        const btn = document.getElementById('financeSubmitBtn');
        const origText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        btn.disabled = true;

        try {
            const entryEls = document.querySelectorAll('.fin-entry');
            const records = [];

            for (const entryEl of entryEls) {
                const idx = entryEl.id.split('-')[2];
                const fileInput = document.getElementById(`finFile_${idx}`);
                let attachmentData = null;

                if (fileInput.files.length > 0) {
                    attachmentData = await this.compressImage(fileInput.files[0]);
                }

                const projectName = document.getElementById(`finProject_${idx}`).value;
                let projectId = null;
                if (projectName) {
                    const existingProject = this.rawData.projects.find(p => p.Name.toLowerCase() === projectName.toLowerCase());
                    projectId = existingProject ? existingProject.Project_ID : null;
                }

                records.push({
                    id: document.getElementById(`finId_${idx}`).value || null,
                    date: document.getElementById(`finDate_${idx}`).value,
                    type: document.getElementById(`finType_${idx}`).value,
                    group: document.getElementById(`finGroup_${idx}`).value,
                    subGroup1: document.getElementById(`finSubGroup1_${idx}`).value,
                    subGroup2: document.getElementById(`finSubGroup2_${idx}`)?.value || '',
                    subGroup3: document.getElementById(`finSubGroup3_${idx}`)?.value || '',
                    subGroup4: document.getElementById(`finSubGroup4_${idx}`)?.value || '',
                    subGroup5: document.getElementById(`finSubGroup5_${idx}`)?.value || '',
                    description: document.getElementById(`finDesc_${idx}`).value,
                    amount: document.getElementById(`finAmt_${idx}`).value,
                    projectId: projectId,
                    attachment: attachmentData
                });
            }

            if (this.editingRecordId) {
                const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                    action: 'edit_finance_record',
                    record: records[0]
                });

                if (data.status === 'success') {
                    this.closeRecordForm();
                    this.refreshLedger();
                } else {
                    alert("Error updating: " + data.message);
                }
            } else {
                const data = await API.post(CONFIG.ENDPOINTS.POST_ACTION, {
                    action: 'add_finance_records',
                    records: records
                });

                if (data.status === 'success') {
                    this.closeRecordForm();
                    this.refreshLedger();
                } else {
                    alert("Error saving: " + data.message);
                }
            }

        } catch (err) {
            console.error(err);
            alert("Network error.");
        } finally {
            btn.innerHTML = origText;
            btn.disabled = false;
        }
    }
};
