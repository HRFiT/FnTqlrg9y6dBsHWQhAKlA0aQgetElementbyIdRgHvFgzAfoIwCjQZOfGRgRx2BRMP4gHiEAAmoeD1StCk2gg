
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
renderInvoiceBankPreview();
showToast('Bank added!');
}

async function deleteBankAccount(id) {
showDeletePopup('Delete this bank account?', async () => {
bankAccounts = bankAccounts.filter(b => b.id !== id);
await saveToIndexedDB('bankAccounts', bankAccounts);
renderBankAccounts();
renderInvoiceBankPreview();
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

function renderInvoiceBankPreview() {
const c = document.getElementById('invoice-bank-list');
if (bankAccounts.length === 0) {
c.innerHTML = '<p style="color:#999">No bank accounts. Add in Settings.</p>';
return;
}
c.innerHTML = bankAccounts.map(a => '<div class="bank-detail-card"><h5>' + a.bankName + '</h5>' + (a.accountName ? '<p><strong>Account:</strong> ' + a.accountName + '</p>' : '') + '<p><strong>Number:</strong> ' + a.accountNumber + '</p>' + (a.branchCode ? '<p><strong>Branch:</strong> ' + a.branchCode + '</p>' : '') + '</div>').join('');
}

// ========================================
// CUSTOMER MANAGEMENT FUNCTIONS
// ========================================
async function addNewCustomer() {
const name = document.getElementById('new-customer-name').value.trim();
const phone = document.getElementById('new-customer-phone').value.trim();
const address = document.getElementById('new-customer-address').value.trim();
if (!name) {
showToast('Customer name required', 'warning');
return;
}
const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
if (existing) {
existing.phone = phone || existing.phone;
existing.address = address || existing.address;
showToast('Customer updated!');
} else {
customers.push({
id: Date.now(),
name,
phone,
address,
createdDate: new Date().toISOString()
});
showToast('Customer added!');
}
await saveToIndexedDB('customers', customers);
document.getElementById('new-customer-name').value = '';
document.getElementById('new-customer-phone').value = '';
document.getElementById('new-customer-address').value = '';
renderCustomerTable();
hideCustomerForm();
}

async function saveCustomer(name, phone, address) {
if (!name) return;
const existing = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
if (existing) {
existing.phone = phone || existing.phone;
existing.address = address || existing.address;
} else {
customers.push({
id: Date.now(),
name,
phone,
address,
createdDate: new Date().toISOString()
});
}
await saveToIndexedDB('customers', customers);
}

async function deleteCustomer(id) {
showDeletePopup('Delete this customer?', async () => {
customers = customers.filter(c => c.id !== id);
await saveToIndexedDB('customers', customers);
renderCustomerTable();
showToast('Customer deleted');
});
}

function getCustomerPendingSummary(name) {
const n = name.toLowerCase().trim();
const pending = invoices.filter(i => i.toName.toLowerCase().trim() === n && ['pending', 'partial'].includes(getInvoicePaymentStatus(i.id).status));
if (pending.length === 0) return null;
const summary = pending.map(inv => {
const s = getInvoicePaymentStatus(inv.id);
return {
number: inv.number,
date: inv.date,
dueDate: inv.dueDate,
total: inv.total,
balance: s.balance
};
});
return {
invoices: summary,
totalBalance: summary.reduce((s, i) => s + i.balance, 0)
};
}

function showCustomerPendingSummary(name) {
const c = document.getElementById('customer-pending-summary');
const s = getCustomerPendingSummary(name);
if (!s) {
c.style.display = 'none';
return;
}
c.innerHTML = '<div class="balance-summary"><h4>⚠️ Pending for ' + name + '</h4>' + s.invoices.map(i => '<div class="balance-summary-item"><span>INV #' + i.number + ' (' + formatDate(i.date) + ')</span><span>R' + i.balance.toFixed(2) + '</span></div>').join('') + '<div class="balance-summary-item"><span>TOTAL DUE</span><span style="color:#dc2626">R' + s.totalBalance.toFixed(2) + '</span></div></div>';
c.style.display = 'block';
}

function generateInvoiceNumberForNewCustomer() {
const name = document.getElementById('inv-to-name').value.trim();
if (!name) return;
const existingCustomer = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
const existingInvoices = invoices.filter(i => i.toName.toLowerCase() === name.toLowerCase());
if (!existingCustomer && existingInvoices.length === 0) {
const nextNum = getNextGlobalInvoiceNumber();
document.getElementById('inv-number').value = nextNum;
document.getElementById('customer-invoice-info-text').textContent = 'New customer - Auto-generated invoice #' + nextNum;
document.getElementById('customer-invoice-info').style.display = 'flex';
}
}

async function autoFillCustomerData(name, prefix) {
const customer = customers.find(c => c.name.toLowerCase() === name.toLowerCase());
const ci = invoices.filter(i => i.toName.toLowerCase() === name.toLowerCase());

if (customer) {
if (customer.address) document.getElementById(prefix + '-to-address').value = customer.address;
if (customer.phone) document.getElementById(prefix + '-to-phone').value = customer.phone;
} else if (ci.length > 0) {
if (ci[0].toAddress) document.getElementById(prefix + '-to-address').value = ci[0].toAddress;
if (ci[0].toPhone) document.getElementById(prefix + '-to-phone').value = ci[0].toPhone;
}

if (prefix === 'inv') {
showCustomerPendingSummary(name);

const savedData = await getSingleFromIndexedDB('settings', 'savedInvoiceFormData');

if (ci.length > 0) {
const next = getNextInvoiceNumberForCustomer(name);
if (next) document.getElementById('inv-number').value = next;

if (!savedData || !savedData.value) {
const last = ci[0];
const container = document.getElementById('invoice-items');
container.innerHTML = '';
last.items.forEach(item => {
const row = createItemRowWithData(item);
container.appendChild(row);
setupItemCalculation(row);
});
document.getElementById('customer-invoice-info-text').textContent = 'Existing customer - Next #' + (next || 'NEW') + ' with ' + last.items.length + ' item(s)';
} else {
document.getElementById('customer-invoice-info-text').textContent = 'Existing customer - Next #' + (next || 'NEW');
}
document.getElementById('customer-invoice-info').style.display = 'flex';
showToast('Customer data loaded');
} else {
const nextNum = getNextGlobalInvoiceNumber();
document.getElementById('inv-number').value = nextNum;
document.getElementById('customer-invoice-info-text').textContent = 'New customer - Auto-generated invoice #' + nextNum;
document.getElementById('customer-invoice-info').style.display = 'flex';
}
}
}

function showCustomerSuggestions(input, prefix) {
const v = input.value.toLowerCase().trim();
const sug = document.getElementById(prefix + '-suggestions');
if (v.length < 1) {
sug.style.display = 'none';
if (prefix === 'inv') document.getElementById('customer-pending-summary').style.display = 'none';
return;
}
const matches = customers.filter(c => c.name.toLowerCase().includes(v));
if (matches.length === 0) {
sug.style.display = 'none';
return;
}
sug.innerHTML = matches.map(c => {
const bal = getCustomerBalance(c.name);
const next = getNextInvoiceNumberForCustomer(c.name);
let badges = '';
if (c.phone) badges += '<span class="badge phone">📱</span>';
if (next) badges += '<span class="badge invoice-num">Next: #' + next + '</span>';
if (bal > 0) badges += '<span class="badge balance">R' + bal.toFixed(2) + ' due</span>';
return '<div class="suggestion-item" onclick="selectCustomerAndFill(\'' + c.name.replace(/'/g, "\\'") + '\',\'' + prefix + '\')">' + '<div class="customer-name">' + c.name + '</div>' + (c.phone ? '<div class="customer-phone">📱 ' + c.phone + '</div>' : '') + '<div class="customer-badges">' + badges + '</div></div>';
}).join('');
sug.style.display = 'block';
}

function selectCustomerAndFill(name, prefix) {
document.getElementById(prefix + '-to-name').value = name;
document.getElementById(prefix + '-suggestions').style.display = 'none';
autoFillCustomerData(name, prefix);
}
