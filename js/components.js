// js/components.js

export function injectComponents() {
    const mainView = document.getElementById('main-view');
    const overlayContainer = document.getElementById('overlay-container');

    overlayContainer.innerHTML = `
        <div id="loginScreen" class="fixed inset-0 bg-blue-900 z-[200] flex flex-col items-center justify-center p-4 hidden">
            <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
                <div class="text-center mb-6">
                    <i class="fas fa-shield-alt text-5xl text-blue-600 mb-2"></i>
                    <h1 class="text-2xl font-bold text-gray-800">Professional Portal</h1>
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

        <div id="paymentModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[300] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
                <h2 class="text-lg font-bold mb-4">Confirm Payment</h2>
                <input type="date" id="selectedPaymentDate" class="w-full border p-2.5 rounded-lg mb-4 outline-none text-sm">
                <div class="flex justify-end gap-2"><button id="cancelPaymentBtn" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700">Cancel</button><button id="confirmPaymentBtn" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold">Mark Paid</button></div>
            </div>
        </div>

        <div id="summaryModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[300] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                <div class="flex justify-between items-center mb-4 border-b pb-2"><h2 id="summaryModalTitle" class="font-bold text-lg sm:text-xl">Details</h2><button id="closeSummaryBtn" class="text-gray-400 text-xl hover:text-gray-600 transition"><i class="fas fa-times"></i></button></div>
                <div class="overflow-y-auto w-full flex-1"><table class="w-full min-w-full text-xs sm:text-sm border"><thead class="bg-gray-50 sticky top-0"><tr><th id="summaryCol1" class="p-3 text-left">Date</th><th id="summaryCol2" class="p-3 text-right">Value</th></tr></thead><tbody id="summaryTableBody" class="divide-y"></tbody></table></div>
            </div>
        </div>

        <div id="resourceModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[300] items-center justify-center p-4">
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
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Action Type</label>
                        <select id="resourceActionType" class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                            <option value="link">Just a Link</option>
                            <option value="create_doc">Create New Public Google Doc</option>
                            <option value="create_sheet">Create New Public Google Sheet</option>
                            <option value="create_slide">Create New Public Google Slide</option>
                            <option value="duplicate">Duplicate Existing Google File</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Title</label>
                        <input type="text" id="resourceTitle" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div id="urlContainer">
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1" id="urlLabel">URL Address</label>
                        <input type="url" id="resourceUrl" class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex justify-end gap-2 mt-5">
                        <button type="button" onclick="document.getElementById('resourceModal').classList.add('hidden'); document.getElementById('resourceModal').classList.remove('flex');" id="cancelResourceBtn" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">Save Link</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="deleteResourceModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[300] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-2xl">
                <h2 class="text-lg font-bold mb-4 text-gray-800"><i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>Delete Resource</h2>
                <p class="text-xs text-gray-600 mb-4">Are you sure you want to remove this link? Please confirm with your password.</p>
                <form id="deleteResourceForm" class="space-y-3">
                    <input type="hidden" id="deleteResourceId">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Confirm Password</label>
                        <input type="password" id="deleteResourcePassword" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-red-500">
                    </div>
                    <div class="flex justify-end gap-2 mt-5">
                        <button type="button" onclick="document.getElementById('deleteResourceModal').classList.add('hidden'); document.getElementById('deleteResourceModal').classList.remove('flex');" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                        <button type="submit" id="deleteResourceBtn" class="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow hover:bg-red-700 transition">Delete</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="detailsModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[300] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-2xl">
                <h2 class="text-lg font-bold mb-4 text-gray-800"><i class="fas fa-id-card text-blue-600 mr-2"></i>Update Details</h2>
                <form id="detailsForm" class="space-y-3">
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Display Name</label><input type="text" id="detailsName" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Username</label><input type="text" id="detailsUser" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Email Address</label><input type="email" id="detailsEmail" class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Contact Number</label><input type="text" id="detailsContact" class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"></div>
                    <div class="flex justify-end gap-2 mt-5">
                        <button type="button" onclick="window.closeProfileModals()" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                        <button type="submit" id="detailsBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">Save Details</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="avatarModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[300] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-2xl flex flex-col items-center">
                <h2 class="text-lg font-bold mb-4 text-gray-800 w-full text-left"><i class="fas fa-camera text-blue-600 mr-2"></i>Profile Picture</h2>
                <form id="avatarForm" class="space-y-4 w-full flex flex-col items-center">
                    <div class="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-100 shadow-md bg-gray-50 overflow-hidden flex items-center justify-center">
                        <img id="modalAvatarPreview" src="" class="w-full h-full object-cover">
                    </div>
                    <div class="w-full">
                        <label class="block text-center cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg text-xs transition">
                            <i class="fas fa-image mr-1"></i> Choose Photo
                            <input type="file" id="modalAvatarInput" accept="image/*" class="hidden">
                        </label>
                    </div>
                    <div class="w-full pt-2">
                        <label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Confirm Password to Update</label>
                        <input type="password" id="avatarPass" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div class="flex justify-end w-full gap-2 mt-2">
                        <button type="button" onclick="window.closeProfileModals()" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                        <button type="submit" id="avatarBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">Update Picture</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="passwordModal" class="fixed inset-0 bg-gray-900 bg-opacity-60 hidden z-[300] items-center justify-center p-4">
            <div class="bg-white rounded-xl p-5 sm:p-6 w-full max-w-sm shadow-2xl">
                <h2 class="text-lg font-bold mb-4 text-gray-800"><i class="fas fa-key text-blue-600 mr-2"></i>Change Password</h2>
                <form id="passwordForm" class="space-y-3">
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">Current Password</label><input type="password" id="passCurrent" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"></div>
                    <div><label class="block text-[10px] font-bold text-gray-600 uppercase mb-1">New Password</label><input type="password" id="passNew" required class="w-full border p-2 rounded-lg outline-none text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500"></div>
                    <div class="flex justify-end gap-2 mt-5">
                        <button type="button" onclick="window.closeProfileModals()" class="px-4 py-2 text-sm text-gray-500 font-bold hover:text-gray-700 transition">Cancel</button>
                        <button type="submit" id="passwordBtn" class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition">Change Password</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    mainView.innerHTML = `
        <div id="welcomePanel" class="app-view hidden h-full flex-col items-center justify-center text-gray-400 py-20 pb-24">
            <img id="welcomeAvatar" src="" class="w-24 h-24 rounded-full mb-4 shadow-md object-cover border-4 border-white bg-white">
            <h2 class="text-2xl font-bold text-gray-600 mb-2">Welcome back, <span id="welcomeName"></span>!</h2>
            <p class="text-lg text-center">Open the menu to get started.</p>
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

        <div id="viewPanel" class="app-view hidden max-w-6xl mx-auto flex-col space-y-3 sm:space-y-4 pb-24">
            <div class="grid grid-cols-3 gap-2 sm:gap-4 shrink-0">
                <div id="cardRendered" class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-blue-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
                    <p class="text-[9px] sm:text-xs font-bold text-gray-500 uppercase truncate">Rendered</p>
                    <p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryHours">0</p>
                </div>
                <div id="cardPaid" class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-green-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
                    <p class="text-[9px] sm:text-xs font-bold text-gray-500 uppercase truncate">Total Paid</p>
                    <p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryPaid">₱0.00</p>
                </div>
                <div id="cardUnpaid" class="bg-white p-3 sm:p-5 rounded-xl shadow-sm border border-l-4 border-l-amber-500 flex flex-col justify-center cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
                    <p class="text-[9px] sm:text-xs font-bold text-gray-500 uppercase truncate">Unpaid</p>
                    <p class="text-sm sm:text-2xl font-bold text-gray-800 truncate" id="summaryUnpaid">₱0.00</p>
                </div>
            </div>
            <div class="bg-white p-3 rounded-xl border flex flex-col gap-2 shrink-0 shadow-sm">
                <div class="flex justify-between items-center border-b">
                    <div class="flex gap-4">
                        <button class="record-tab px-4 py-2 text-sm font-bold border-b-2 border-blue-600 text-blue-600 outline-none" data-type="Rendered">Rendered</button>
                        <button class="record-tab px-4 py-2 text-sm font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-700 outline-none" data-type="Paid">Paid</button>
                        <input type="hidden" id="filterType" value="Rendered">
                    </div>
                    <button id="markPaidBtn" class="text-indigo-600 hover:text-indigo-800 p-2 mr-1 transition outline-none" title="Mark Selected as Paid">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>
                <div class="flex items-center gap-2 w-full pt-1">
                    <input type="date" id="filterStart" class="border p-1.5 rounded text-xs outline-none flex-1 bg-gray-50 text-gray-700">
                    <span class="text-xs font-bold text-gray-400">to</span>
                    <input type="date" id="filterEnd" class="border p-1.5 rounded text-xs outline-none flex-1 bg-gray-50 text-gray-700">
                    <button id="clearDatesBtn" class="text-gray-400 hover:text-red-500 px-2 py-1.5 transition outline-none" title="Clear Dates">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="bg-white border rounded-xl shadow-sm w-full overflow-x-auto">
                <table class="min-w-full text-left whitespace-nowrap">
                    <thead class="bg-gray-50 border-b uppercase text-[10px] font-bold text-gray-500">
                        <tr>
                            <th class="px-2 py-2 w-8 text-center"><input type="checkbox" id="selectAllRecords" class="w-3 h-3 rounded text-blue-600"></th>
                            <th class="px-2 py-2 text-center">Date</th>
                            <th class="px-2 py-2 text-center">Status</th>
                            <th class="px-2 py-2 text-center">Amount</th>
                        </tr>
                    </thead>
                    <tbody id="dataTableBody" class="divide-y divide-gray-100 text-[11px] sm:text-xs"><tr><td colspan="4" class="py-6 text-center text-gray-400">Select dates and fetch data.</td></tr></tbody>
                </table>
            </div>
        </div>

        <div id="resourcePanel" class="app-view hidden max-w-5xl mx-auto space-y-3 pb-24">
            <div class="bg-white p-3 rounded-xl border flex flex-col shadow-sm">
                <div id="resourceTabs" class="flex gap-4 border-b overflow-x-auto scrollbar-hide"></div>
            </div>
            <div id="resourceGrid" class="flex flex-col gap-2"></div>
        </div>
    `;

    const accountMenu = document.getElementById('accountMenu');
    if (accountMenu) {
        accountMenu.innerHTML = `
            <div class="bg-gray-50 p-5 flex flex-col items-center border-b border-gray-200 relative text-center">
                <button onclick="window.toggleAccountMenu()" class="absolute top-3 left-3 text-gray-400 hover:text-gray-700">
                    <i class="fas fa-times text-xl"></i>
                </button>
                <div class="relative group mb-2" onclick="window.openProfilePicModal(); window.closeAllMenus();">
                    <img id="menuAvatar" src="" class="w-20 h-20 rounded-full border-2 border-white shadow-sm object-cover bg-white cursor-pointer">
                    <div class="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                        <i class="fas fa-camera text-white"></i>
                    </div>
                </div>
                <h2 id="menuName" class="text-lg font-bold text-gray-900 mt-1"></h2>
                <p id="menuEmail" class="text-xs text-gray-500 mt-0.5 truncate w-full px-2"></p>
                <p id="menuContact" class="text-xs text-gray-500 truncate w-full px-2"></p>
            </div>
            <nav class="flex-1 overflow-y-auto py-3">
                <div class="px-5 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Settings</div>
                <ul class="space-y-1 px-2 text-sm font-semibold text-gray-700">
                    <li><button onclick="window.openUpdateDetailsModal(); window.closeAllMenus();" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left"><i class="fas fa-id-card w-5 text-center text-gray-500"></i> Update Details</button></li>
                    <li><button onclick="window.openProfilePicModal(); window.closeAllMenus();" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left"><i class="fas fa-camera w-5 text-center text-gray-500"></i> Upload Profile Picture</button></li>
                    <li><button onclick="window.openChangePasswordModal(); window.closeAllMenus();" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition text-left"><i class="fas fa-key w-5 text-center text-gray-500"></i> Change Password</button></li>
                </ul>
            </nav>
            <div class="p-3 border-t border-gray-100 bg-gray-50">
                <button id="logout-btn" class="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 rounded-lg transition border border-red-100 shadow-sm flex items-center justify-center gap-2 text-sm"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
            </div>
        `;
    }
}
