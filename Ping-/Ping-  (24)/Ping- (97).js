
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

// Filter by date
if (fromDate && toDate) {
docs = docs.filter(doc => {
const docDate = doc.date;
if (!docDate) return false;
return docDate >= fromDate && docDate <= toDate;
});
}

// Filter by search term
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
await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
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
// Create a temporary container
const tempContainer = document.createElement('div');
tempContainer.style.position = 'absolute';
tempContainer.style.left = '-9999px';
tempContainer.style.width = '800px';
tempContainer.style.background = 'white';
tempContainer.style.padding = '30px';
document.body.appendChild(tempContainer);

// Generate HTML content
let htmlContent = '';
if (doc.type === 'invoice') {
htmlContent = generateInvoiceHTML(doc);
} else if (doc.type === 'receipt') {
htmlContent = generateReceiptHTML(doc);
}

tempContainer.innerHTML = htmlContent;

// Generate filename
const safeName = doc.toName.replace(/[^a-zA-Z0-9]/g, '_');
const safeDate = doc.date.replace(/[^0-9]/g, '');
const filename = `${doc.number}_${safeName}_${safeDate}.pdf`;

try {
// Use html2canvas and jsPDF
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

// ========================================
// INDEXEDDB FUNCTIONS
// ========================================
function initDB() {
return new Promise((resolve, reject) => {
const request = indexedDB.open('DocGenProDB', 1);

request.onerror = () => reject(request.error);
request.onsuccess = () => {
db = request.result;
resolve(db);
};

request.onupgradeneeded = (event) => {
const database = event.target.result;

if (!database.objectStoreNames.contains('invoices')) {
database.createObjectStore('invoices', { keyPath: 'id' });
}
if (!database.objectStoreNames.contains('quotations')) {
database.createObjectStore('quotations', { keyPath: 'id' });
}
if (!database.objectStoreNames.contains('receipts')) {
database.createObjectStore('receipts', { keyPath: 'id' });
}
if (!database.objectStoreNames.contains('payslips')) {
database.createObjectStore('payslips', { keyPath: 'id' });
}
if (!database.objectStoreNames.contains('customers')) {
database.createObjectStore('customers', { keyPath: 'id' });
}
if (!database.objectStoreNames.contains('bankAccounts')) {
database.createObjectStore('bankAccounts', { keyPath: 'id' });
}
if (!database.objectStoreNames.contains('settings')) {
database.createObjectStore('settings', { keyPath: 'key' });
}
};
});
}

async function saveToIndexedDB(storeName, data) {
return new Promise((resolve, reject) => {
const transaction = db.transaction([storeName], 'readwrite');
const store = transaction.objectStore(storeName);

if (Array.isArray(data)) {
store.clear();
data.forEach(item => store.add(item));
} else {
store.put(data);
}

transaction.oncomplete = () => resolve();
transaction.onerror = () => reject(transaction.error);
});
}

async function getFromIndexedDB(storeName) {
return new Promise((resolve, reject) => {
const transaction = db.transaction([storeName], 'readonly');
const store = transaction.objectStore(storeName);
const request = store.getAll();

request.onsuccess = () => resolve(request.result);
request.onerror = () => reject(request.error);
});
}

async function getSingleFromIndexedDB(storeName, key) {
return new Promise((resolve, reject) => {
const transaction = db.transaction([storeName], 'readonly');
const store = transaction.objectStore(storeName);
const request = store.get(key);

request.onsuccess = () => resolve(request.result);
request.onerror = () => reject(request.error);
});
}

async function deleteFromIndexedDB(storeName, id) {
return new Promise((resolve, reject) => {
const transaction = db.transaction([storeName], 'readwrite');
const store = transaction.objectStore(storeName);
const request = store.delete(id);

request.onsuccess = () => resolve();
request.onerror = () => reject(request.error);
});
}

async function loadAllData() {
invoices = await getFromIndexedDB('invoices');
quotations = await getFromIndexedDB('quotations');
receipts = await getFromIndexedDB('receipts');
payslips = await getFromIndexedDB('payslips');
customers = await getFromIndexedDB('customers');
bankAccounts = await getFromIndexedDB('bankAccounts');

const settingsData = await getSingleFromIndexedDB('settings', 'companySettings');
if (settingsData) {
companySettings = settingsData.value;
}
}

// ========================================
// UTILITY FUNCTIONS
// ========================================
function sanitizeFilename(str) { 
return str.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_').substring(0, 50); 
}

function showDeletePopup(msg, cb) { 
document.getElementById('delete-popup-message').textContent = msg; 
document.getElementById('delete-popup-overlay').style.display = 'flex'; 
pendingDeleteCallback = cb; 
}

function closeDeletePopup() { 
document.getElementById('delete-popup-overlay').style.display = 'none'; 
pendingDeleteCallback = null; 
}

function confirmDelete() { 
if (pendingDeleteCallback) pendingDeleteCallback(); 
closeDeletePopup(); 
}

function toggleSidebar() { 
document.getElementById('sidebar').classList.toggle('open'); 
}

function showToast(msg, type = 'success') { 
const t = document.createElement('div'); 
t.className = 'toast ' + type; 
t.textContent = msg; 
document.body.appendChild(t); 
setTimeout(() => t.remove(), 3000); 
}

function formatDate(d) { 
return d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'; 
}

function formatDateForFilename(d) { 
return d ? d.replace(/-/g, '') : ''; 
}

function formatDateForInput(dateObj) { 
const year = dateObj.getFullYear(); 
const month = String(dateObj.getMonth() + 1).padStart(2, "0"); 
const day = String(dateObj.getDate()).padStart(2, "0"); 
return `${year}-${month}-${day}`; 
}

function getEndOfMonth(dateStr) { 
if (!dateStr) return ''; 
const d = new Date(dateStr); 
const last = new Date(d.getFullYear(), d.getMonth() + 1, 0); 
return formatDateForInput(last); 
}

function getCompanyContactHTML() { 
let html = ''; 
if (companySettings.phone) html += '<p>📞 ' + companySettings.phone + '</p>'; 
if (companySettings.email) html += '<p>📧 ' + companySettings.email + '</p>'; 
if (companySettings.website) html += '<p>🌐 ' + companySettings.website + '</p>'; 
if (companySettings.registration) html += '<p>🔢 ' + companySettings.registration + '</p>'; 
return html; 
}

function getCompanyAbbreviation() {
const name = companySettings.name || 'Company';
const words = name.trim().split(/\s+/);

if (words.length === 1) {
return words[0].substring(0, 3).toUpperCase();
}

let abbr = '';
for (let i = 0; i < Math.min(words.length, 3); i++) {
if (words[i].length > 0) {
abbr += words[i][0].toUpperCase();
}
}

return abbr || 'DOC';
}

// ========================================
// PAYMENT & STATUS FUNCTIONS
// ========================================
function getInvoicePaymentStatus(id) { 
const recs = receipts.filter(r => r.linkedInvoiceId === id); 
const paid = recs.reduce((s, r) => s + (r.amountPaid || r.total || 0), 0); 
const inv = invoices.find(i => i.id === id); 
if (!inv) return { status: 'unknown', paid: 0, balance: 0 }; 
const bal = inv.total - paid; 
if (bal <= 0.01) return { status: 'paid', paid, balance: 0 }; 
if (paid > 0) return { status: 'partial', paid, balance: bal }; 
return { status: 'pending', paid: 0, balance: inv.total }; 
}

// ========================================
// DOCUMENT HTML GENERATION FUNCTIONS
// ========================================
function generateInvoiceHTML(inv) { 
const s = getInvoicePaymentStatus(inv.id); 
const recs = receipts.filter(r => r.linkedInvoiceId === inv.id); 
const banks = inv.bankAccounts || bankAccounts; 
const customer = customers.find(c => c.name.toLowerCase() === inv.toName.toLowerCase()); 
const phone = inv.toPhone || customer?.phone; 
return '<div class="document-preview" style="color:#000"><div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title">INVOICE</h1><p>#' + inv.number + ' | ' + formatDate(inv.date) + '</p>' + (inv.dueDate ? '<p>Due: ' + formatDate(inv.dueDate) + '</p>' : '') + '<p style="color:' + (s.status === 'paid' ? '#10b981' : '#f59e0b') + ';font-weight:bold">' + s.status.toUpperCase() + '</p></div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (inv.fromName || companySettings.name) + '</strong><br>' + (inv.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>To:</h4><p>' + inv.toName + '<br>' + inv.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + inv.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total:</td><td>R' + inv.total.toFixed(2) + '</td></tr>' + (s.paid > 0 ? '<tr style="color:#10b981"><td colspan="3" style="text-align:right">Paid:</td><td>R' + s.paid.toFixed(2) + '</td></tr>' : '') + (s.balance > 0 ? '<tr style="color:#dc2626"><td colspan="3" style="text-align:right"><strong>Balance:</strong></td><td><strong>R' + s.balance.toFixed(2) + '</strong></td></tr>' : '') + '</tfoot></table>' + (recs.length > 0 ? '<div class="payment-history"><h4>Payment History</h4>' + recs.map(r => '<div class="payment-history-item"><span>Receipt #' + r.number + ' - ' + formatDate(r.date) + '</span><span style="color:#10b981">R' + (r.amountPaid || r.total).toFixed(2) + '</span></div>').join('') + '</div>' : '') + (inv.notes ? '<p><strong>Notes:</strong> ' + inv.notes + '</p>' : '') + (banks.length > 0 ? '<div style="margin-top:20px;border-top:2px solid #667eea;padding-top:15px"><h4 style="color:#667eea;margin-bottom:15px">Banking Details</h4>' + banks.map(a => '<p><strong>' + a.bankName + ':</strong> ' + a.accountNumber + (a.branchCode ? ' | Branch: ' + a.branchCode : '') + '</p>').join('') + '</div>' : '') + '</div>'; 
}

function generateReceiptHTML(r) { 
const customer = customers.find(c => c.name.toLowerCase() === r.toName.toLowerCase()); 
const phone = r.toPhone || customer?.phone; 
const sourceDoc = r.linkedInvoiceNumber ? 'Invoice #' + r.linkedInvoiceNumber : (r.linkedQuotationNumber ? 'Quotation #' + r.linkedQuotationNumber : 'Direct Payment'); 
return '<div class="document-preview" style="color:#000"><div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title" style="color:#10b981">RECEIPT</h1><p>#' + r.number + ' | ' + formatDate(r.date) + '</p></div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (r.fromName || companySettings.name) + '</strong><br>' + (r.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>Received From:</h4><p>' + r.toName + '<br>' + r.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><div class="invoice-dates-box"><p><strong>Source:</strong> ' + sourceDoc + '</p><p><strong>Payment Method:</strong> ' + (r.paymentMethod || 'Cash') + '</p></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + r.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total:</td><td>R' + r.total.toFixed(2) + '</td></tr><tr style="color:#10b981;font-size:1.1rem"><td colspan="3" style="text-align:right"><strong>Amount Paid:</strong></td><td><strong>R' + (r.amountPaid || r.total).toFixed(2) + '</strong></td></tr>' + (r.remainingBalance > 0 ? '<tr style="color:#dc2626"><td colspan="3" style="text-align:right"><strong>Balance:</strong></td><td><strong>R' + r.remainingBalance.toFixed(2) + '</strong></td></tr>' : '') + '</tfoot></table></div>'; 
}

// ========================================
// DASHBOARD FUNCTIONS
// ========================================
function setCurrentMonthFilter() { 
const now = new Date(); 
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1); 
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0); 
document.getElementById('chart-date-from').value = firstDay.toISOString().split('T')[0]; 
document.getElementById('chart-date-to').value = lastDay.toISOString().split('T')[0]; 
document.getElementById('current-month-display').textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' }); 
}

function resetDateFilter() { 
setCurrentMonthFilter(); 
updateDashboard(); 
}

function updateDashboard() {
const from = document.getElementById('chart-date-from').value;
const to = document.getElementById('chart-date-to').value;
const filter = (arr, field) => arr.filter(i => i[field] >= from && i[field] <= to);
const fi = filter(invoices, 'date');
const fq = filter(quotations, 'date');
const fr = filter(receipts, 'date');
const fp = filter(payslips, 'date');
const pending = fi.filter(inv => ['pending', 'partial'].includes(getInvoicePaymentStatus(inv.id).status));
const paid = fi.filter(inv => getInvoicePaymentStatus(inv.id).status === 'paid');
document.getElementById('dash-invoice-count').textContent = fi.length;
document.getElementById('dash-invoice-amount').textContent = 'R' + fi.reduce((s, i) => s + i.total, 0).toFixed(2);
document.getElementById('dash-quotation-count').textContent = fq.length;
document.getElementById('dash-quotation-amount').textContent = 'R' + fq.reduce((s, q) => s + q.total, 0).toFixed(2);
document.getElementById('dash-receipt-count').textContent = fr.length;
document.getElementById('dash-receipt-amount').textContent = 'R' + fr.reduce((s, r) => s + (r.amountPaid || r.total), 0).toFixed(2);
document.getElementById('dash-payslip-count').textContent = fp.length;
document.getElementById('dash-payslip-amount').textContent = 'R' + fp.reduce((s, p) => s + p.netPay, 0).toFixed(2);
document.getElementById('dash-pending').textContent = pending.length;
document.getElementById('dash-pending-amount').textContent = 'R' + pending.reduce((s, i) => s + getInvoicePaymentStatus(i.id).balance, 0).toFixed(2);
document.getElementById('dash-paid').textContent = paid.length;
document.getElementById('dash-paid-amount').textContent = 'R' + paid.reduce((s, i) => s + i.total, 0).toFixed(2);
createMainChart();
}

function createMainChart() {
const from = document.getElementById('chart-date-from').value;
const to = document.getElementById('chart-date-to').value;
const start = new Date(from);
const end = new Date(to);
const dates = [];
const labels = [];
const diff = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24));
const byMonth = diff > 60;
if (byMonth) {
let c = new Date(start.getFullYear(), start.getMonth(), 1);
while (c <= end) {
dates.push(c.toISOString().substring(0, 7));
labels.push(c.toLocaleString('default', { month: 'short', year: '2-digit' }));
c.setMonth(c.getMonth() + 1);
}
} else {
let c = new Date(start);
while (c <= end) {
dates.push(c.toISOString().split('T')[0]);
labels.push(c.toLocaleDateString('default', { day: 'numeric', month: 'short' }));
c.setDate(c.getDate() + 1);
}
}
const getData = (arr, field) => {
const data = {};
dates.forEach(d => data[d] = 0);
arr.forEach(i => {
if (i[field]) {
const d = byMonth ? i[field].substring(0, 7) : i[field];
if (data[d] !== undefined) data[d]++;
}
});
return dates.map(d => data[d]);
};
if (mainChart) mainChart.destroy();
mainChart = new Chart(document.getElementById('main-chart'), {
type: 'line',
data: {
labels,
datasets: [
{ label: 'Invoices', data: getData(invoices, 'date'), borderColor: '#667eea', borderWidth: 1, tension: 0.4, fill: false, pointRadius: 3 },
{ label: 'Quotations', data: getData(quotations, 'date'), borderColor: '#f59e0b', borderWidth: 1, tension: 0.4, fill: false, pointRadius: 3 },
{ label: 'Receipts', data: getData(receipts, 'date'), borderColor: '#10b981', borderWidth: 1, tension: 0.4, fill: false, pointRadius: 3 },
{ label: 'Payslips', data: getData(payslips, 'date'), borderColor: '#ec4899', borderWidth: 1, tension: 0.4, fill: false, pointRadius: 3 }
]
},
options: {
responsive: true,
maintainAspectRatio: false,
plugins: {
legend: { display: true, position: 'bottom', labels: { boxWidth: 12, padding: 15, color: '#fff' } }
},
scales: {
y: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
x: { grid: { display: false }, ticks: { color: '#fff' } }
}
}
});
}

function downloadDashboardCSV() {
const from = document.getElementById('chart-date-from').value;
const to = document.getElementById('chart-date-to').value;
const filter = (arr, field) => arr.filter(i => i[field] >= from && i[field] <= to);
const fi = filter(invoices, 'date');
const fq = filter(quotations, 'date');
const fr = filter(receipts, 'date');
const fp = filter(payslips, 'date');
let csv = 'DocGen Pro Dashboard Report\nPeriod: ' + formatDate(from) + ' to ' + formatDate(to) + '\n\nSUMMARY\nCategory,Count,Amount\n';
csv += 'Invoices,' + fi.length + ',R' + fi.reduce((s, i) => s + i.total, 0).toFixed(2) + '\n';
csv += 'Quotations,' + fq.length + ',R' + fq.reduce((s, q) => s + q.total, 0).toFixed(2) + '\n';
csv += 'Receipts,' + fr.length + ',R' + fr.reduce((s, r) => s + (r.amountPaid || r.total), 0).toFixed(2) + '\n';
csv += 'Payslips,' + fp.length + ',R' + fp.reduce((s, p) => s + p.netPay, 0).toFixed(2) + '\n\nINVOICES\nNumber,Date,Customer,Phone,Total,Status,Balance\n';
fi.forEach(inv => {
const s = getInvoicePaymentStatus(inv.id);
csv += inv.number + ',' + inv.date + ',' + inv.toName + ',' + (inv.toPhone || '') + ',R' + inv.total.toFixed(2) + ',' + s.status + ',R' + s.balance.toFixed(2) + '\n';
});
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'Dashboard_Report_' + formatDateForFilename(from) + '_to_' + formatDateForFilename(to) + '.csv';
document.body.appendChild(a);
a.click();
setTimeout(() => {
document.body.removeChild(a);
URL.revokeObjectURL(url);
}, 100);
showToast('CSV Downloaded!');
}

function downloadDashboardPDF() {
const from = document.getElementById('chart-date-from').value;
const to = document.getElementById('chart-date-to').value;
const filter = (arr, field) => arr.filter(i => i[field] >= from && i[field] <= to);
const fi = filter(invoices, 'date');
const fq = filter(quotations, 'date');
const fr = filter(receipts, 'date');
const content = '<html><head><title>Dashboard Report</title><style>body{font-family:Arial;padding:40px}h1{color:#667eea}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border:1px solid #ddd;padding:10px;text-align:left}th{background:#667eea;color:white}</style></head><body><h1>' + (companySettings.name || 'DocGen Pro') + ' - Report</h1><p><strong>Period:</strong> ' + formatDate(from) + ' to ' + formatDate(to) + '</p><h2>Invoices</h2><table><tr><th>#</th><th>Date</th><th>Customer</th><th>Total</th><th>Status</th></tr>' + fi.map(inv => {
const s = getInvoicePaymentStatus(inv.id);
return '<tr><td>' + inv.number + '</td><td>' + formatDate(inv.date) + '</td><td>' + inv.toName + '</td><td>R' + inv.total.toFixed(2) + '</td><td>' + s.status + '</td></tr>';
}).join('') + '</table><h2>Quotations</h2><table><tr><th>#</th><th>Date</th><th>Customer</th><th>Total</th></tr>' + fq.map(q => '<tr><td>' + q.number + '</td><td>' + formatDate(q.date) + '</td><td>' + q.toName + '</td><td>R' + q.total.toFixed(2) + '</td></tr>').join('') + '</table><h2>Receipts</h2><table><tr><th>#</th><th>Date</th><th>Customer</th><th>Amount</th></tr>' + fr.map(r => '<tr><td>' + r.number + '</td><td>' + formatDate(r.date) + '</td><td>' + r.toName + '</td><td>R' + (r.amountPaid || r.total).toFixed(2) + '</td></tr>').join('') + '</table></body></html>';
const win = window.open('', '_blank');
win.document.write(content);
win.document.close();
win.print();
}

// ========================================
// TAB & RENDERING FUNCTIONS
// ========================================
function switchTab(tab) {
document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
document.querySelector('[onclick="switchTab(\'' + tab + '\')"]').classList.add('active');
document.getElementById(tab + '-tab').classList.add('active');
document.getElementById('sidebar').classList.remove('open');
if (tab === 'dashboard') updateDashboard();
else if (tab === 'download') {
setDownloadThisMonth();
updateDownloadCount();
}
}

function closePreview() {
document.getElementById('preview-modal').style.display = 'none';
currentPreviewData = null;
}

function printDocument() {
window.print();
}

// ========================================
// COMPANY SETTINGS FUNCTIONS
// ========================================
function loadCompanySettings() {
document.getElementById('settings-company-name').value = companySettings.name || '';
document.getElementById('settings-company-address').value = companySettings.address || '';
document.getElementById('settings-company-email').value = companySettings.email || '';
document.getElementById('settings-company-phone').value = companySettings.phone || '';
document.getElementById('settings-company-whatsapp').value = companySettings.whatsapp || '';
document.getElementById('settings-company-website').value = companySettings.website || '';
document.getElementById('settings-company-registration').value = companySettings.registration || '';
if (companySettings.logo) document.getElementById('logo-preview-content').innerHTML = '<img src="' + companySettings.logo + '" alt="Logo">';
updateCompanyInfoPreview();
}

async function saveCompanySettings() {
companySettings.name = document.getElementById('settings-company-name').value;
companySettings.address = document.getElementById('settings-company-address').value;
companySettings.email = document.getElementById('settings-company-email').value;
companySettings.phone = document.getElementById('settings-company-phone').value;
companySettings.whatsapp = document.getElementById('settings-company-whatsapp').value;
companySettings.website = document.getElementById('settings-company-website').value;
companySettings.registration = document.getElementById('settings-company-registration').value;
await saveToIndexedDB('settings', { key: 'companySettings', value: companySettings });
updateCompanyInfoPreview();
showToast('Settings saved!');
}

function updateCompanyInfoPreview() {
const container = document.getElementById('company-info-preview');
const content = document.getElementById('company-info-content');
const hasInfo = companySettings.name || companySettings.address || companySettings.email || companySettings.phone || companySettings.website;
if (!hasInfo) {
container.style.display = 'none';
return;
}
let html = '';
if (companySettings.name) html += '<div class="contact-info-item"><span class="icon">🏪</span><div class="info"><div class="info-label">Company Name</div><div class="info-value">' + companySettings.name + '</div></div></div>';
if (companySettings.address) html += '<div class="contact-info-item"><span class="icon">📍</span><div class="info"><div class="info-label">Address</div><div class="info-value">' + companySettings.address + '</div></div></div>';
if (companySettings.email) html += '<div class="contact-info-item"><span class="icon">📧</span><div class="info"><div class="info-label">Email</div><div class="info-value">' + companySettings.email + '</div></div></div>';
if (companySettings.phone) html += '<div class="contact-info-item"><span class="icon">📞</span><div class="info"><div class="info-label">Phone</div><div class="info-value">' + companySettings.phone + '</div></div></div>';
if (companySettings.whatsapp) html += '<div class="contact-info-item"><span class="icon">💬</span><div class="info"><div class="info-label">WhatsApp</div><div class="info-value">' + companySettings.whatsapp + '</div></div></div>';
if (companySettings.website) html += '<div class="contact-info-item"><span class="icon">🌐</span><div class="info"><div class="info-label">Website</div><div class="info-value">' + companySettings.website + '</div></div></div>';
if (companySettings.registration) html += '<div class="contact-info-item"><span class="icon">🔢</span><div class="info"><div class="info-label">Reg/VAT Number</div><div class="info-value">' + companySettings.registration + '</div></div></div>';
content.innerHTML = html;
container.style.display = 'block';
}

async function clearLogo() {
companySettings.logo = null;
await saveToIndexedDB('settings', { key: 'companySettings', value: companySettings });
document.getElementById('logo-preview-content').innerHTML = '<div class="logo-preview-text">📷 Upload Logo</div>';
showToast('Logo removed');
}

// ========================================
// BANK ACCOUNT FUNCTIONS
// ========================================
async function addBankAccount() {
const bn = document.getElementById('bank-name').value.trim();
const an = document.getElementById('bank-account-number').value.trim();
if (!bn || !an) {
showToast('Required fields missing', 'warning');
return;
}
bankAccounts.push({
id: Date.now(),
bankName: bn,
accountName: document.getElementById('bank-account-name').value.trim(),
accountNumber: an,
branchCode: document.getElementById('bank-branch-code').value.trim()
});
await saveToIndexedDB('bankAccounts', bankAccounts);
['bank-name', 'bank-account-name', 'bank-account-number', 'bank-branch-code'].forEach(id => document.getElementById(id).value = '');
renderBankAccounts();
showToast('Bank added!');
}

async function deleteBankAccount(id) {
showDeletePopup('Delete this bank account?', async () => {
bankAccounts = bankAccounts.filter(b => b.id !== id);
await saveToIndexedDB('bankAccounts', bankAccounts);
renderBankAccounts();
showToast('Deleted');
});
}

function renderBankAccounts() {
const list = document.getElementById('bank-accounts-list');
if (bankAccounts.length === 0) {
list.innerHTML = '<p style="color:#666;text-align:center">No bank accounts.</p>';
return;
}
list.innerHTML = bankAccounts.map(a => '<div class="bank-account-item"><div class="bank-account-info"><h5>' + a.bankName + '</h5><p>' + a.accountNumber + '</p></div><button class="btn btn-danger btn-small" onclick="deleteBankAccount(' + a.id + ')">🗑️</button></div>').join('');
}

// ========================================
// BACKUP & RESTORE FUNCTIONS
// ========================================
function downloadBackup() {
const backupData = {
version: '1.0',
exportDate: new Date().toISOString(),
data: { invoices, quotations, receipts, payslips, customers, bankAccounts, companySettings }
};
const dataStr = JSON.stringify(backupData, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'DocGenPro_Backup_' + new Date().toISOString().split('T')[0] + '.json';
document.body.appendChild(a);
a.click();
setTimeout(() => {
document.body.removeChild(a);
URL.revokeObjectURL(url);
}, 100);
showToast('Backup downloaded successfully!');
}

function triggerRestoreUpload() {
document.getElementById('restore-file-input').click();
}

async function restoreBackup(event) {
const file = event.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = async function(e) {
try {
const backupData = JSON.parse(e.target.result);
if (!backupData.data) {
showToast('Invalid backup file', 'error');
return;
}
showDeletePopup('This will replace ALL current data. Continue?', async () => {
invoices = backupData.data.invoices || [];
quotations = backupData.data.quotations || [];
receipts = backupData.data.receipts || [];
payslips = backupData.data.payslips || [];
customers = backupData.data.customers || [];
bankAccounts = backupData.data.bankAccounts || [];
companySettings = backupData.data.companySettings || {};

await saveToIndexedDB('invoices', invoices);
await saveToIndexedDB('quotations', quotations);
await saveToIndexedDB('receipts', receipts);
await saveToIndexedDB('payslips', payslips);
await saveToIndexedDB('customers', customers);
await saveToIndexedDB('bankAccounts', bankAccounts);
await saveToIndexedDB('settings', { key: 'companySettings', value: companySettings });

loadCompanySettings();
renderBankAccounts();
updateDashboard();
showToast('Data restored successfully!');
});
} catch (err) {
showToast('Error reading backup file', 'error');
console.error(err);
}
};
reader.readAsText(file);
event.target.value = '';
}






// ========================================
// BACKUP & RESTORE FUNCTIONS
// ========================================
function downloadBackup() {
const backupData = {
version: '1.0',
exportDate: new Date().toISOString(),
data: { invoices, quotations, receipts, payslips, customers, bankAccounts, companySettings }
};
const dataStr = JSON.stringify(backupData, null, 2);
const blob = new Blob([dataStr], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'DocGenPro_Backup_' + new Date().toISOString().split('T')[0] + '.json';
document.body.appendChild(a);
a.click();
setTimeout(() => {
document.body.removeChild(a);
URL.revokeObjectURL(url);
}, 100);
showToast('Backup downloaded successfully!');
}

function triggerRestoreUpload() {
document.getElementById('restore-file-input').click();
}

async function restoreBackup(event) {
const file = event.target.files[0];
if (!file) return;
const reader = new FileReader();
reader.onload = async function(e) {
try {
const backupData = JSON.parse(e.target.result);
if (!backupData.data) {
showToast('Invalid backup file', 'error');
return;
}
showDeletePopup('This will replace ALL current data. Continue?', async () => {
invoices = backupData.data.invoices || [];
quotations = backupData.data.quotations || [];
receipts = backupData.data.receipts || [];
payslips = backupData.data.payslips || [];
customers = backupData.data.customers || [];
bankAccounts = backupData.data.bankAccounts || [];
companySettings = backupData.data.companySettings || {};

await saveToIndexedDB('invoices', invoices);
await saveToIndexedDB('quotations', quotations);
await saveToIndexedDB('receipts', receipts);
await saveToIndexedDB('payslips', payslips);
await saveToIndexedDB('customers', customers);
await saveToIndexedDB('bankAccounts', bankAccounts);
await saveToIndexedDB('settings', { key: 'companySettings', value: companySettings });

loadCompanySettings();
renderBankAccounts();
renderInvoiceBankPreview();
renderAll();
updateDashboard();
showToast('Data restored successfully!');
});
} catch (err) {
showToast('Error reading backup file', 'error');
console.error(err);
}
};
reader.readAsText(file);
event.target.value = '';
}

// ========================================
// COMPANY SETTINGS FUNCTIONS
// ========================================
function loadCompanySettings() {
document.getElementById('settings-company-name').value = companySettings.name || '';
document.getElementById('settings-company-address').value = companySettings.address || '';
document.getElementById('settings-company-email').value = companySettings.email || '';
document.getElementById('settings-company-phone').value = companySettings.phone || '';
document.getElementById('settings-company-whatsapp').value = companySettings.whatsapp || '';
document.getElementById('settings-company-website').value = companySettings.website || '';
document.getElementById('settings-company-registration').value = companySettings.registration || '';
if (companySettings.logo) document.getElementById('logo-preview-content').innerHTML = '<img src="' + companySettings.logo + '" alt="Logo">';
updateCompanyInfoPreview();
}

async function saveCompanySettings() {
companySettings.name = document.getElementById('settings-company-name').value;
companySettings.address = document.getElementById('settings-company-address').value;
companySettings.email = document.getElementById('settings-company-email').value;
companySettings.phone = document.getElementById('settings-company-phone').value;
companySettings.whatsapp = document.getElementById('settings-company-whatsapp').value;
companySettings.website = document.getElementById('settings-company-website').value;
companySettings.registration = document.getElementById('settings-company-registration').value;
await saveToIndexedDB('settings', { key: 'companySettings', value: companySettings });
updateCompanyInfoPreview();

document.getElementById('inv-number').value = getNextGlobalInvoiceNumber();
document.getElementById('quo-number').value = getNextGlobalQuotationNumber();

showToast('Settings saved! Invoice numbering updated.');
}

function updateCompanyInfoPreview() {
const container = document.getElementById('company-info-preview');
const content = document.getElementById('company-info-content');
const hasInfo = companySettings.name || companySettings.address || companySettings.email || companySettings.phone || companySettings.website;
if (!hasInfo) {
container.style.display = 'none';
return;
}
let html = '';
if (companySettings.name) html += '<div class="contact-info-item"><span class="icon">🏪</span><div class="info"><div class="info-label">Company Name</div><div class="info-value">' + companySettings.name + '</div></div></div>';
if (companySettings.address) html += '<div class="contact-info-item"><span class="icon">📍</span><div class="info"><div class="info-label">Address</div><div class="info-value">' + companySettings.address + '</div></div></div>';
if (companySettings.email) html += '<div class="contact-info-item"><span class="icon">📧</span><div class="info"><div class="info-label">Email</div><div class="info-value">' + companySettings.email + '</div></div></div>';
if (companySettings.phone) html += '<div class="contact-info-item"><span class="icon">📞</span><div class="info"><div class="info-label">Phone</div><div class="info-value">' + companySettings.phone + '</div></div></div>';
if (companySettings.whatsapp) html += '<div class="contact-info-item"><span class="icon">💬</span><div class="info"><div class="info-label">WhatsApp</div><div class="info-value">' + companySettings.whatsapp + '</div></div></div>';
if (companySettings.website) html += '<div class="contact-info-item"><span class="icon">🌐</span><div class="info"><div class="info-label">Website</div><div class="info-value">' + companySettings.website + '</div></div></div>';
if (companySettings.registration) html += '<div class="contact-info-item"><span class="icon">🔢</span><div class="info"><div class="info-label">Reg/VAT Number</div><div class="info-value">' + companySettings.registration + '</div></div></div>';
content.innerHTML = html;
container.style.display = 'block';
}

async function clearLogo() {
companySettings.logo = null;
await saveToIndexedDB('settings', { key: 'companySettings', value: companySettings });
document.getElementById('logo-preview-content').innerHTML = '<div class="logo-preview-text">📷 Upload Logo</div>';
showToast('Logo removed');
}