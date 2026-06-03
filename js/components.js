export function injectComponents() {
    const mainView = document.getElementById('main-view');
    const overlayContainer = document.getElementById('overlay-container');

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
                <div class="flex justify-end gap-2"><button id="cancelPaymentBtn" class="px-4 py-2 text-gray-500">Cancel</button><button id="confirmPaymentBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Mark Paid</button></div>
            </div>
        </div>

        <div id="summaryModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[100] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                <div class="flex justify-between items-center mb-4 border-b pb-2"><h2 class="font-bold text-lg sm:text-xl">Payment History</h2><button id="closeSummaryBtn" class="text-gray-400 text-xl"><i class="fas fa-times"></i></button></div>
                <div class="overflow-x-auto w-full"><table class="w-full min-w-full text-xs sm:text-sm border"><thead class="bg-gray-50"><tr><th class="p-3 text-left">Date Paid</th><th class="p-3 text-right">Total</th></tr></thead><tbody id="summaryTableBody" class="divide-y"></tbody></table></div>
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
                        <button type="button" id="cancelResourceBtn" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">Save Link</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    mainView.innerHTML = `
        <div id="welcomePanel" class="app-view hidden h-full flex-col items-center justify-center text-gray-400 py-20">
            <img id="welcomeAvatar" src="" class="w-24 h-24 rounded-full mb-4 shadow-md object-cover border-4 border-white bg-white">
            <h2 class="text-2xl font-bold text-gray-600 mb-2">Welcome back, <span id="welcomeName"></span>!</h2>
            <p class="text-lg text-center">Open the menu to get started.</p>
        </div>

        <div id="logPanel" class="app-view hidden max-w-3xl mx-auto bg-white rounded-xl shadow-sm border p-4 sm:p-6">
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

        <div id="viewPanel" class="app-view hidden max-w-6xl mx-auto flex-col space-y-3 sm:space-y-4 pb-10">
            <div class="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
                <div class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-blue-500 flex flex-col justify-center"><p class="text-[9px] sm:text-xs font-bold text-gray-500 uppercase truncate">Rendered</p><p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryHours">0</p></div>
                <div class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-green-500 flex flex-col justify-center"><p class="text-[9px] sm:text-xs font-bold text-gray-500 uppercase truncate">Total Paid</p><p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryPaid">₱0.00</p></div>
                <div class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-amber-500 flex flex-col justify-center"><p class="text-[9px] sm:text-xs font-bold text-gray-500 uppercase truncate">Unpaid</p><p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryUnpaid">₱0.00</p></div>
            </div>
            <div class="bg-white p-3 rounded-xl border flex flex-col sm:flex-row gap-3 justify-between items-end shrink-0 shadow-sm">
                <div class="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto items-end">
                    <div class="col-span-2 sm:col-span-1"><label class="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Filter Type</label><select id="filterType" class="w-full border p-1.5 rounded text-xs bg-gray-50 outline-none"><option value="Rendered">Rendered</option><option value="Paid">Paid</option></select></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Start</label><input type="date" id="filterStart" class="w-full border p-1.5 rounded text-xs outline-none"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">End</label><input type="date" id="filterEnd" class="w-full border p-1.5 rounded text-xs outline-none"></div>
                    <button id="fetchRecordsBtn" class="col-span-2 sm:col-span-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold mt-1"><i class="fas fa-sync-alt mr-1"></i> Fetch</button>
                </div>
                <div class="grid grid-cols-2 gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                    <button id="openSummaryBtn" class="w-full bg-emerald-600 text-white px-3 py-1.5 rounded text-[11px] sm:text-xs font-bold"><i class="fas fa-list-alt mr-1"></i> Summary</button>
                    <button id="markPaidBtn" class="w-full bg-indigo-600 text-white px-3 py-1.5 rounded text-[11px] sm:text-xs font-bold"><i class="fas fa-check mr-1"></i> Mark Paid</button>
                </div>
            </div>
            <div class="bg-white border rounded-xl shadow-sm w-full overflow-x-auto">
                <table class="min-w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-gray-50 border-b uppercase text-[10px] sm:text-xs font-bold text-gray-500">
                        <tr>
                            <th class="px-4 py-3 w-10 text-center"><input type="checkbox" id="selectAllRecords" class="w-4 h-4 rounded text-blue-600"></th>
                            <th class="px-4 py-3">Date</th>
                            <th class="px-4 py-3">Location</th>
                            <th class="px-4 py-3">Subject</th>
                            <th class="px-4 py-3">Hrs</th>
                            <th class="px-4 py-3">Earnings</th>
                            <th class="px-4 py-3">Status</th>
                            <th class="px-4 py-3">Paid</th>
                        </tr>
                    </thead>
                    <tbody id="dataTableBody" class="divide-y divide-gray-100 text-xs sm:text-sm"><tr><td colspan="8" class="py-10 text-center text-gray-400">Select dates and fetch data.</td></tr></tbody>
                </table>
            </div>
        </div>

        <div id="resourcePanel" class="app-view hidden max-w-5xl mx-auto space-y-4 pb-10">
            <div class="flex justify-between items-center border-b pb-4">
                <h2 class="text-xl sm:text-2xl font-bold text-gray-800"><i class="fas fa-link text-blue-600 mr-2"></i>Resource Links</h2>
                <div class="flex gap-2 sm:gap-3">
                    <button id="addResourceBtn" class="bg-blue-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm font-bold shadow-sm hover:bg-blue-700 transition"><i class="fas fa-plus sm:mr-1"></i> <span class="hidden sm:inline">Add Link</span></button>
                    <button id="refreshResourcesBtn" class="bg-gray-100 text-gray-600 px-3 py-1.5 rounded text-xs sm:text-sm font-bold shadow-sm hover:bg-gray-200 transition"><i class="fas fa-redo"></i></button>
                </div>
            </div>
            <div id="resourceTabs" class="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide border-b border-gray-200"></div>
            <div id="resourceGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2"></div>
        </div>

        <div id="profilePanel" class="app-view hidden max-w-md mx-auto bg-white rounded-xl shadow-sm border p-4 sm:p-6 pb-10">
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
