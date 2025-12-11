
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
const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.textContent = msg;
toast.style.cssText = `
position: fixed;
top: 20px;
right: 20px;
padding: 15px 25px;
background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
color: white;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(0,0,0,0.15);
z-index: 10000;
animation: slideIn 0.3s ease;
`;
document.body.appendChild(toast);
setTimeout(() => {
toast.style.animation = 'slideOut 0.3s ease';
setTimeout(() => toast.remove(), 300);
}, 2700);
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

function onInvoiceDateChange() {
const invDate = document.getElementById('inv-date').value;
if (invDate) {
const date = new Date(invDate);
const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
document.getElementById('inv-due-date').value = formatDateForInput(lastDay);
}
}

function formatPhoneForWhatsApp(phone) {
if (!phone) return null;
let cleaned = phone.replace(/\D/g, '');
if (cleaned.startsWith('0')) cleaned = '27' + cleaned.substring(1);
if (!cleaned.startsWith('27') && cleaned.length === 9) cleaned = '27' + cleaned;
return cleaned;
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
