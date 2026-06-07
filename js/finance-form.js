import { CONFIG, API } from './globals.js';

export const FinanceForm = {
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
        document.getElementById('financeRecordModal').classList.remove('hidden');
    },

    closeRecordForm() {
        this.currentProjectId = null;
        this.currentProjectName = null;
        this.currentPrefillGroup = null;
        document.getElementById('financeRecordModal').classList.add('hidden');
    },

    editRecord(id) {
        const tx = this.rawData.transactions.find(t => (t.ID || t.id || t.Entry_ID) == id);
        if (!tx) return;
        
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
        
        const idx = 0;
        document.getElementById(`finId_${idx}`).value = tx.ID || tx.id || tx.Entry_ID;
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

        document.getElementById('financeRecordModal').classList.remove('hidden');
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
            ${idx > 0 ? `<button type="button" onclick="this.parentElement.remove()" class="absolute -top-2 -right-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-full w-5 h-5 flex items-center justify-center transition shadow-sm border border-white z-10"><i class="fas fa-times text-[10px]"></i></button>` : ''}
            
            <div class="flex gap-1.5 mb-1.5 items-center">
                <input type="text" id="finProject_${idx}" list="dl_Projects" class="flex-1 px-1.5 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Project (New or Existing)" ${projectValue}>
                <select id="finType_${idx}" class="w-[75px] px-1 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" required>
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                </select>
                <input type="date" id="finDate_${idx}" class="w-[90px] px-1 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" value="${today}" required>
            </div>
            
            <div class="flex gap-1.5 mb-1.5 items-center">
                <div class="relative flex-1">
                    <span class="absolute left-1.5 top-[3px] text-gray-400 font-bold text-[11px]">₱</span>
                    <input type="number" id="finAmt_${idx}" class="w-full pl-4 pr-1.5 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] font-bold text-gray-800 outline-none focus:ring-1 focus:ring-blue-500" placeholder="0.00" step="0.01" required>
                </div>
                <div class="flex items-center justify-center px-1">
                    <label for="finFile_${idx}" title="Add Image" class="cursor-pointer text-gray-400 hover:text-blue-500 transition relative">
                        <i class="fas fa-image text-[14px]"></i>
                        <span id="finFileBadge_${idx}" class="hidden absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 border border-white rounded-full"></span>
                    </label>
                    <input type="file" id="finFile_${idx}" accept="image/*" class="hidden" onchange="document.getElementById('finFileBadge_${idx}').classList.remove('hidden')">
                </div>
            </div>

            <div class="mb-1.5">
                <input type="text" id="finGroup_${idx}" list="dl_MainGroup" class="w-full px-1.5 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Main Group" ${groupValue} required>
            </div>

            <div id="subgroups-container-${idx}" class="flex flex-col gap-1 mt-1.5 bg-gray-50/50 p-1.5 rounded border border-dashed border-gray-200">
                <div class="flex items-center gap-1" id="sg-row-1-${idx}">
                    <i class="fas fa-level-up-alt rotate-90 text-gray-300 text-[10px] ml-1"></i>
                    <input type="text" id="finSubGroup1_${idx}" list="dl_SubGroup1" class="flex-1 px-1.5 py-1 bg-white border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Sub Group 1">
                    <button type="button" id="sg-btn-1-${idx}" onclick="FinanceManager.showNextSubgroup(${idx}, 2)" class="text-blue-500 hover:bg-blue-100 p-0.5 rounded transition"><i class="fas fa-plus text-[10px]"></i></button>
                </div>
                <div class="hidden items-center gap-1" id="sg-row-2-${idx}">
                    <i class="fas fa-level-up-alt rotate-90 text-gray-300 text-[10px] ml-3"></i>
                    <input type="text" id="finSubGroup2_${idx}" list="dl_SubGroup2" class="flex-1 px-1.5 py-1 bg-white border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Sub Group 2">
                    <button type="button" onclick="FinanceManager.hideSubgroup(${idx}, 2)" class="text-red-400 hover:bg-red-50 p-0.5 rounded transition"><i class="fas fa-times text-[10px]"></i></button>
                    <button type="button" id="sg-btn-2-${idx}" onclick="FinanceManager.showNextSubgroup(${idx}, 3)" class="text-blue-500 hover:bg-blue-100 p-0.5 rounded transition"><i class="fas fa-plus text-[10px]"></i></button>
                </div>
                <div class="hidden items-center gap-1" id="sg-row-3-${idx}">
                    <i class="fas fa-level-up-alt rotate-90 text-gray-300 text-[10px] ml-5"></i>
                    <input type="text" id="finSubGroup3_${idx}" list="dl_SubGroup3" class="flex-1 px-1.5 py-1 bg-white border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Sub Group 3">
                    <button type="button" onclick="FinanceManager.hideSubgroup(${idx}, 3)" class="text-red-400 hover:bg-red-50 p-0.5 rounded transition"><i class="fas fa-times text-[10px]"></i></button>
                    <button type="button" id="sg-btn-3-${idx}" onclick="FinanceManager.showNextSubgroup(${idx}, 4)" class="text-blue-500 hover:bg-blue-100 p-0.5 rounded transition"><i class="fas fa-plus text-[10px]"></i></button>
                </div>
                <div class="hidden items-center gap-1" id="sg-row-4-${idx}">
                    <i class="fas fa-level-up-alt rotate-90 text-gray-300 text-[10px] ml-7"></i>
                    <input type="text" id="finSubGroup4_${idx}" list="dl_SubGroup4" class="flex-1 px-1.5 py-1 bg-white border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Sub Group 4">
                    <button type="button" onclick="FinanceManager.hideSubgroup(${idx}, 4)" class="text-red-400 hover:bg-red-50 p-0.5 rounded transition"><i class="fas fa-times text-[10px]"></i></button>
                    <button type="button" id="sg-btn-4-${idx}" onclick="FinanceManager.showNextSubgroup(${idx}, 5)" class="text-blue-500 hover:bg-blue-100 p-0.5 rounded transition"><i class="fas fa-plus text-[10px]"></i></button>
                </div>
                <div class="hidden items-center gap-1" id="sg-row-5-${idx}">
                    <i class="fas fa-level-up-alt rotate-90 text-gray-300 text-[10px] ml-9"></i>
                    <input type="text" id="finSubGroup5_${idx}" list="dl_SubGroup5" class="flex-1 px-1.5 py-1 bg-white border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Sub Group 5">
                    <button type="button" onclick="FinanceManager.hideSubgroup(${idx}, 5)" class="text-red-400 hover:bg-red-50 p-0.5 rounded transition"><i class="fas fa-times text-[10px]"></i></button>
                </div>
            </div>

            <div class="mt-1.5">
                <input type="text" id="finDesc_${idx}" class="w-full px-1.5 py-1 bg-gray-50 border border-gray-200 rounded text-[11px] outline-none focus:ring-1 focus:ring-blue-500" placeholder="Description" required>
            </div>
            <input type="hidden" id="finId_${idx}">
        `;
        container.appendChild(div);
    },

    async submitRecords(e) {
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

            const recordId = document.getElementById(`finId_${idx}`)?.value;
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
            const projName = document.getElementById(`finProject_${idx}`)?.value;
            
            const fileInput = document.getElementById(`finFile_${idx}`);
            let attachmentData = null;

            if (fileInput && fileInput.files.length > 0) {
                try {
                    attachmentData = await this.compressImage(fileInput.files[0]);
                } catch(err) {
                    console.error("Failed to compress image", err);
                }
            }

            if (!date || !type || !desc || !amt) continue;

            let finalProjectId = null;
            if (projName) {
                let existingProj = this.rawData.projects.find(p => p.Name.toLowerCase() === projName.trim().toLowerCase());
                if (!existingProj) {
                    try {
                        await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'create_project', name: projName.trim() });
                        const projRes = await API.post(CONFIG.ENDPOINTS.POST_ACTION, { action: 'get_projects' });
                        if (projRes.status === 'success') {
                            this.rawData.projects = projRes.projects;
                            existingProj = this.rawData.projects.find(p => p.Name.toLowerCase() === projName.trim().toLowerCase());
                        }
                    } catch (err) {
                        console.error("Error creating project inline:", err);
                    }
                }
                if (existingProj) {
                    finalProjectId = existingProj.Project_ID;
                }
            }

            records.push({ 
                id: recordId || null,
                date, type, group, 
                subGroup1, subGroup2, subGroup3, subGroup4, subGroup5, 
                description: desc, amount: amt,
                projectId: finalProjectId,
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
                this.closeRecordForm();
                this.refreshLedger();
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
