// js/components.js
export function injectComponents() {
    const mainView = document.getElementById('main-view');
    const overlayContainer = document.getElementById('overlay-container');

    // 1. Inject Overlays (Login & Modals)
    overlayContainer.innerHTML = `
        <div id="loginScreen" class="fixed inset-0 bg-blue-900 z-[200] flex flex-col items-center justify-center p-4 hidden">
            <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
                <div class="text-center mb-6">
                    <i class="fas fa-shield-alt text-5xl text-blue-600 mb-2"></i>
                    <h1 class="text-2xl font-bold text-gray-800">Secure Portal</h1>
                    <p class="text-sm text-gray-500">Sign in to your account</p>
                </div>
                <form id="loginForm" class="space-y-4">
                    <div><label class="block text-xs font-bold text-gray-600 uppercase mb-1">Username</label><input type="text" id="loginUser" required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"></div>
                    <div><label class="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label><input type="password" id="loginPass" required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"></div>
                    <button type="submit" id="loginBtn" class="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition shadow mt-2">Sign In</button>
                    <p id="loginError" class="text-red-500 text-sm text-center font-semibold hidden"></p>
                </form>
            </div>
        </div>

        <div id="paymentModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[100] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h2 class="text-lg font-bold mb-4">Confirm Payment</h2>
                <input type="date" id="selectedPaymentDate" class="w-full border p-2.5 rounded-lg mb-4 outline-none">
                <div class="flex justify-end gap-2"><button id="cancelPaymentBtn" class="px-4 py-2 text-gray-500 font-bold">Cancel</button><button id="confirmPaymentBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Mark Paid</button></div>
            </div>
        </div>

        <div id="summaryModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[100] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 id="summaryModalTitle" class="font-bold text-lg sm:text-xl">Record Details</h2>
                    <button onclick="document.getElementById('summaryModal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600 transition text-xl"><i class="fas fa-times"></i></button>
                </div>
                <div class="overflow-y-auto w-full custom-scrollbar flex-1">
                    <table class="w-full min-w-full text-xs sm:text-sm border">
                        <thead class="bg-gray-50 sticky top-0">
                            <tr><th class="p-3 text-left">Date / Subject</th><th class="p-3 text-right">Amount</th></tr>
                        </thead>
                        <tbody id="summaryTableBody" class="divide-y divide-gray-100"></tbody>
                    </table>
                </div>
            </div>
        </div>

        <div id="resourceModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[100] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-2xl">
                <h2 id="resourceModalTitle" class="text-lg font-bold mb-4 text-gray-800">Add Link</h2>
                <form id="resourceForm" class="space-y-3">
                    <input type="hidden" id="resourceId">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Category</label>
                        <input type="text" id="resourceCategory" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500" list="existingCategories">
                        <datalist id="existingCategories"></datalist>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Title</label>
                        <input type="text" id="resourceTitle" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">URL Address</label>
                        <input type="url" id="resourceUrl" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex justify-end gap-2 mt-5">
                        <button type="button" onclick="document.getElementById('resourceModal').classList.add('hidden')" id="cancelResourceBtn" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">Save Link</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // 2. Inject Main Views (Panels)
    mainView.innerHTML = `
        <div id="welcomePanel" class="app-view hidden h-full flex-col items-center justify-center text-gray-400 py-20 pb-24">
            <img id="welcomeAvatar" src="" class="w-24 h-24 rounded-full mb-4 shadow-md object-cover border-4 border-white bg-white">
            <h2 class="text-2xl font-bold text-gray-600 mb-2">Welcome back, <span id="welcomeName"></span>!</h2>
            <p class="text-lg text-center">Select an option from the menu.</p>
        </div>

        <div id="logPanel" class="app-view hidden max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-4 sm:p-6 pb-24">
            <div class="flex justify-between items-center mb-6 border-b pb-3">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800"><i class="fas fa-calendar-plus text-blue-600 mr-2"></i>Batch Session Generator</h2>
            </div>
            <form id="logForm" class="space-y-6">
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h3 class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Common Institution Data</h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label class="block text-xs font-semibold text-gray-700">University</label><input type="text" id="commonUniversity" list="uniList" required class="w-full border p-2 rounded-lg mt-1 outline-none"></div>
                        <div><label class="block text-xs font-semibold text-gray-700">Department / College</label><input type="text" id="commonCollege" list="colList" required class="w-full border p-2 rounded-lg mt-1 outline-none"></div>
                    </div>
                </div>
                <div id="schedule-container" class="space-y-4"></div>
                <div class="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                    <button type="button" id="addScheduleBtn" class="flex-1 bg-gray-100 text-gray-700 font-bold p-3 rounded-lg hover:bg-gray-200 transition border"><i class="fas fa-plus mr-2"></i> Add Another Subject</button>
                    <button type="submit" id="logSubmitBtn" class="flex-1 bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition shadow"><i class="fas fa-save mr-2"></i> Generate & Save All</button>
                </div>
                <p id="logStatusMsg" class="text-center text-sm hidden mt-3"></p>
            </form>
        </div>

        <div id="viewPanel" class="app-view hidden max-w-6xl mx-auto flex-col space-y-4 pb-24 pt-2">
            <div class="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
                <div onclick="window.showSummaryModal('Rendered')" class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-blue-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition group">
                    <p class="text-[9px] sm:text-xs font-bold text-gray-400 uppercase truncate group-hover:text-blue-500 transition">Rendered Hrs</p>
                    <p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryHours">0</p>
                </div>
                <div onclick="window.showSummaryModal('Paid')" class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-green-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition group">
                    <p class="text-[9px] sm:text-xs font-bold text-gray-400 uppercase truncate group-hover:text-green-500 transition">Total Paid</p>
                    <p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryPaid">₱0.00</p>
                </div>
                <div onclick="window.showSummaryModal('Unpaid')" class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-amber-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition group">
                    <p class="text-[9px] sm:text-xs font-bold text-gray-400 uppercase truncate group-hover:text-amber-500 transition">Unpaid</p>
                    <p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryUnpaid">₱0.00</p>
                </div>
            </div>
            
            <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-2.5 rounded-xl shadow-sm border border-gray-200">
                
                <div class="flex bg-gray-100 p-1.5 rounded-lg w-full xl:w-auto overflow-x-auto">
                    <button id="tab-btn-Rendered" class="records-tab-btn active flex-1 min-w-[100px] py-1.5 px-3 text-xs font-bold rounded transition bg-white text-blue-600 shadow-sm" onclick="window.switchRecordsTab('Rendered')">Rendered (All)</button>
                    <button id="tab-btn-Paid" class="records-tab-btn flex-1 min-w-[100px] py-1.5 px-3 text-xs font-bold text-gray-500 rounded transition hover:bg-gray-200" onclick="window.switchRecordsTab('Paid')">Paid Only</button>
                </div>
                
                <div class="flex items-center gap-3 w-full xl:w-auto flex-wrap sm:flex-nowrap">
                    <div class="flex items-center gap-1.5 flex-1 min-w-0 bg-gray-50 border p-1 rounded-lg">
                        <input type="date" id="filterStart" class="flex-1 min-w-0 px-2 py-1 bg-transparent text-xs font-semibold outline-none cursor-pointer text-gray-600" onchange="window.triggerFetchRecords()">
                        <span class="text-xs font-bold text-gray-400 shrink-0">to</span>
                        <input type="date" id="filterEnd" class="flex-1 min-w-0 px-2 py-1 bg-transparent text-xs font-semibold outline-none cursor-pointer text-gray-600" onchange="window.triggerFetchRecords()">
                    </div>
                    <button id="markPaidBtn" class="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition shadow-sm h-full flex items-center gap-1"><i class="fas fa-check"></i> Mark Paid</button>
                </div>
            </div>
            
            <div class="bg-white border rounded-xl shadow-sm w-full overflow-x-auto">
                <table class="min-w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-gray-50 border-b uppercase text-[10px] sm:text-xs font-bold text-gray-500">
                        <tr>
                            <th class="px-4 py-3 w-10 text-center"><input type="checkbox" id="selectAllRecords" class="w-4 h-4 rounded text-blue-600 cursor-pointer"></th>
                            <th class="px-4 py-3">Date</th>
                            <th class="px-4 py-3">Subject Code</th>
                            <th class="px-4 py-3 text-right">Earnings / Status</th>
                        </tr>
                    </thead>
                    <tbody id="dataTableBody" class="divide-y divide-gray-100 text-xs sm:text-sm">
                        <tr><td colspan="4" class="py-10 text-center text-gray-400 font-bold">Select dates to load records.</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div id="resourcePanel" class="app-view hidden max-w-3xl mx-auto space-y-4 pb-24 pt-2">
            <div id="resourceTabs" class="flex bg-gray-200 p-1 rounded-lg w-full overflow-x-auto whitespace-nowrap shadow-inner max-w-sm mx-auto"></div>
            
            <div id="resourceList" class="flex flex-col gap-2 pt-2"></div>
        </div>

        <div id="profilePanel" class="app-view hidden max-w-md mx-auto bg-white rounded-xl shadow-sm border p-4 sm:p-6 pb-24">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 mb-6 border-b pb-3"><i class="fas fa-user-cog text-gray-500 mr-2"></i>Profile Settings</h2>
            <form id="profileForm" class="space-y-4">
                <div><label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Display Name</label><input type="text" id="profName" required class="w-full border p-2 rounded-lg outline-none bg-gray-50"></div>
                <div><label class="block text-xs font-semibold text-gray-700 uppercase mb-1">New Password</label><input type="password" id="profPass" placeholder="Leave blank to keep current" class="w-full border p-2 rounded-lg outline-none bg-gray-50"></div>
                <div>
                    <label class="block text-xs font-semibold text-gray-700 uppercase mb-1">Profile Picture</label>
                    <div class="flex items-center space-x-3 mt-2 mb-1">
                        <img id="profAvatarPreview" src="" class="w-14 h-14 rounded-full object-cover border bg-gray-100 shadow-sm hidden">
                        <input type="file" id="profAvatarInput" accept="image/*" capture="user" class="w-full border p-2 rounded-lg outline-none bg-white text-xs text-gray-600 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                    </div>
                </div>
                <button type="submit" id="profBtn" class="w-full bg-gray-800 text-white font-bold p-3 rounded-lg hover:bg-gray-900 transition mt-6">Save Changes</button>
                <p id="profStatus" class="text-center text-sm hidden mt-3"></p>
            </form>
        </div>
    `;
}
