
// ========================================
// DOWNLOAD TOOL FUNCTIONS
// ========================================
function selectDocumentType(type) {
selectedDocumentType = type;
document.querySelectorAll('.filter-type-btn').forEach(btn => btn.classList.remove('active'));
event.target.classList.add('active');
updateDownloadCount();
}

function setDownloadThisMonth() {
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
document.getElementById('download-from-date').value = formatDateForInput(firstDay);
document.getElementById('download-to-date').value = formatDateForInput(lastDay);
updateDownloadCount();
}

function setDownloadLastMonth() {
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
document.getElementById('download-from-date').value = formatDateForInput(firstDay);
document.getElementById('download-to-date').value = formatDateForInput(lastDay);
updateDownloadCount();
}

function setDownloadThisYear() {
const now = new Date();
const firstDay = new Date(now.getFullYear(), 0, 1);
const lastDay = new Date(now.getFullYear(), 11, 31);
document.getElementById('download-from-date').value = formatDateForInput(firstDay);
document.getElementById('download-to-date').value = formatDateForInput(lastDay);
updateDownloadCount();
}

function setDownloadAll() {
document.getElementById('download-from-date').value = '2000-01-01';
document.getElementById('download-to-date').value = '2099-12-31';
updateDownloadCount();
}

function getFilteredDocuments() {
const fromDate = document.getElementById('download-from-date').value;
const toDate = document.getElementById('download-to-date').value;
const searchTerm = document.getElementById('download-search').value.toLowerCase();

let docs = [];

if (selectedDocumentType === 'invoice' || selectedDocumentType === 'both') {
docs = docs.concat(invoices.map(inv => ({...inv, type: 'invoice'})));
}

if (selectedDocumentType === 'receipt' || selectedDocumentType === 'both') {
docs = docs.concat(receipts.map(rec => ({...rec, type: 'receipt'})));
}

if (fromDate && toDate) {
docs = docs.filter(doc => {
const docDate = doc.date;
if (!docDate) return false;
return docDate >= fromDate && docDate <= toDate;
});
}

if (searchTerm) {
docs = docs.filter(doc => {
return doc.toName.toLowerCase().includes(searchTerm) ||
doc.number.toLowerCase().includes(searchTerm);
});
}

return docs;
}

function updateDownloadCount() {
const docs = getFilteredDocuments();
const countDisplay = document.getElementById('download-count-display');
countDisplay.textContent = `${docs.length} document${docs.length !== 1 ? 's' : ''} will be downloaded`;
}

async function downloadFilteredDocuments() {
const docs = getFilteredDocuments();

if (docs.length === 0) {
showToast('No documents to download', 'warning');
return;
}

const progressContainer = document.getElementById('download-progress-container');
const progressFill = document.getElementById('download-progress-fill');
const statusText = document.getElementById('download-status');
const downloadBtn = document.getElementById('bulk-download-btn');

progressContainer.style.display = 'block';
downloadBtn.disabled = true;

for (let i = 0; i < docs.length; i++) {
const doc = docs[i];
const progress = Math.round(((i + 1) / docs.length) * 100);

progressFill.style.width = progress + '%';
progressFill.textContent = progress + '%';
statusText.textContent = `Downloading ${i + 1} of ${docs.length}: ${doc.toName}...`;

try {
await downloadDocumentAsPDF(doc);
await new Promise(resolve => setTimeout(resolve, 500));
} catch (error) {
console.error('Error downloading document:', error);
statusText.textContent = `Error on ${doc.number}. Continuing...`;
await new Promise(resolve => setTimeout(resolve, 1000));
}
}

progressFill.style.width = '100%';
progressFill.textContent = '100%';
statusText.textContent = `✅ Complete! ${docs.length} document${docs.length !== 1 ? 's' : ''} downloaded.`;
downloadBtn.disabled = false;

showToast(`${docs.length} document${docs.length !== 1 ? 's' : ''} downloaded!`);

setTimeout(() => {
progressContainer.style.display = 'none';
progressFill.style.width = '0%';
}, 3000);
}

async function downloadDocumentAsPDF(doc) {
const tempContainer = document.createElement('div');
tempContainer.style.position = 'absolute';
tempContainer.style.left = '-9999px';
tempContainer.style.width = '800px';
tempContainer.style.background = 'white';
tempContainer.style.padding = '30px';
document.body.appendChild(tempContainer);

let htmlContent = '';
if (doc.type === 'invoice') {
htmlContent = generateInvoiceHTML(doc);
} else if (doc.type === 'receipt') {
htmlContent = generateReceiptHTML(doc);
}

tempContainer.innerHTML = htmlContent;

const safeName = doc.toName.replace(/[^a-zA-Z0-9]/g, '_');
const safeDate = doc.date.replace(/[^0-9]/g, '');
const filename = `${doc.number}_${safeName}_${safeDate}.pdf`;

try {
const canvas = await html2canvas(tempContainer, {
scale: 2,
useCORS: true,
logging: false,
backgroundColor: '#ffffff'
});

const imgData = canvas.toDataURL('image/png');
const pdf = new jspdf.jsPDF({
orientation: 'portrait',
unit: 'mm',
format: 'a4'
});

const imgWidth = 210;
const imgHeight = (canvas.height * imgWidth) / canvas.width;

pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
pdf.save(filename);

} finally {
document.body.removeChild(tempContainer);
}
}
