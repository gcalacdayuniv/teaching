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
                <div class="flex justify-between items-end mb-3 ml-1 shrink-0">
                    <div>
                        <h3 class="font-bold text-gray-700">Ledgers & Categories</h3>
                        <div class="flex items-center gap-1.5 mt-2">
                            <input type="date" id="finFilterFrom" class="w-24 sm:w-32 text-[10px] sm:text-xs px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-gray-600 bg-white shadow-sm" onchange="FinanceManager.applyFilter()">
                            <span class="text-[10px] text-gray-400 font-medium">to</span>
                            <input type="date" id="finFilterTo" class="w-24 sm:w-32 text-[10px] sm:text-xs px-1.5 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-gray-600 bg-white shadow-sm" onchange="FinanceManager.applyFilter()">
                            <button onclick="FinanceManager.resetFilter()" class="text-[10px] bg-white border border-gray-300 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded transition shadow-sm"><i class="fas fa-undo"></i></button>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="FinanceManager.openNewProjectModal()" class="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 border border-indigo-200 shadow-sm">
                            <i class="fas fa-folder-plus"></i> <span class="hidden sm:inline">New Project</span>
                        </button>
                        <button onclick="FinanceManager.openRecordForm()" class="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 shadow-sm">
                            <i class="fas fa-plus"></i> <span class="hidden sm:inline">Log Txn</span>
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
