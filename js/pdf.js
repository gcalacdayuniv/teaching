// js/pdf.js
export const PdfCompiler = {
    init: () => {
        const mainView = document.getElementById('main-view');
        if (mainView) {
            const pdfPanel = document.createElement('div');
            pdfPanel.id = 'pdfPanel';
            pdfPanel.className = 'app-view hidden flex-col h-full bg-white relative overflow-y-auto w-full';
            
            pdfPanel.innerHTML = `
                <div class="p-4 sm:p-6 pb-24 w-full max-w-4xl mx-auto flex flex-col gap-6">
                    <div class="flex flex-col gap-2 bg-gradient-to-r from-blue-600 to-blue-800 p-6 rounded-2xl text-white shadow-lg">
                        <h2 class="text-2xl font-bold">PDF Compiler</h2>
                        <p class="text-blue-100 text-sm">Merge Google Drive Images to PDF</p>
                    </div>
                    
                    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 w-full">
                        <form id="pdfForm" class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Google Drive Folder ID or URL</label>
                                <input type="text" id="folderInput" placeholder="e.g. https://drive.google.com/drive/folders/..." required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Output File Name</label>
                                <input type="text" id="outputFileName" value="Merged_Document" required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Compression Quality</label>
                                <select id="compressionQuality" class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                    <option value="original">Original (No Compression)</option>
                                    <option value="medium" selected>Medium (Balances Quality and Size)</option>
                                    <option value="low">Low (Smallest File Size)</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Paper Size</label>
                                <select id="paperSize" onchange="window.toggleCustomSize()" class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                    <option value="letter">Letter (8.5 x 11 in)</option>
                                    <option value="legal">Legal (8.5 x 14 in)</option>
                                    <option value="custom">Custom</option>
                                </select>
                            </div>
                            <div id="customDimensions" style="display: none;" class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Width (in)</label>
                                    <input type="number" step="0.01" id="customWidth" value="8.5" class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Length (in)</label>
                                    <input type="number" step="0.01" id="customLength" value="11" class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Top Margin (in)</label>
                                    <input type="number" step="0.01" id="marginTop" value="1" required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Bottom Margin (in)</label>
                                    <input type="number" step="0.01" id="marginBottom" value="1" required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Left Margin (in)</label>
                                    <input type="number" step="0.01" id="marginLeft" value="1" required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                </div>
                                <div>
                                    <label class="block text-xs font-bold text-gray-600 uppercase mb-1">Right Margin (in)</label>
                                    <input type="number" step="0.01" id="marginRight" value="1" required class="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm">
                                </div>
                            </div>
                            <button type="submit" id="submitPdfBtn" class="w-full bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition shadow mt-4">Generate PDF</button>
                        </form>
                        <div id="pdfStatus" class="mt-4 font-bold text-center text-sm text-gray-700"></div>
                    </div>
                </div>
            `;
            mainView.appendChild(pdfPanel);

            const script = document.createElement('script');
            script.src = "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js";
            document.head.appendChild(script);

            window.toggleCustomSize = function() {
                const size = document.getElementById('paperSize').value;
                const customDiv = document.getElementById('customDimensions');
                customDiv.style.display = size === 'custom' ? 'grid' : 'none';
            };
        }
    }
};
