
// ========================================
// PAYMENT & STATUS FUNCTIONS
// ========================================
function getQuotationPaymentStatus(id) {
const recs = receipts.filter(r => r.linkedQuotationId === id);
const paid = recs.reduce((s, r) => s + (r.amountPaid || r.total || 0), 0);
const quo = quotations.find(q => q.id === id);
if (!quo) return { isPaid: true, paid: 0, balance: 0 };
const bal = quo.total - paid;
return { isPaid: bal <= 0.01, paid, balance: Math.max(0, bal) };
}

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

function getUnpaidInvoices() {
return invoices.filter(inv => ['pending', 'partial'].includes(getInvoicePaymentStatus(inv.id).status));
}

function getUnpaidQuotations() {
return quotations.filter(q => !getQuotationPaymentStatus(q.id).isPaid);
}

function getFullyPaidInvoices() {
return invoices.filter(inv => getInvoicePaymentStatus(inv.id).status === 'paid');
}

// ========================================
// INVOICE/DOCUMENT NUMBERING FUNCTIONS
// ========================================
function getNextGlobalInvoiceNumber() {
const prefix = getCompanyAbbreviation();
if (!invoices || invoices.length === 0) return prefix + '-0001';

let maxNum = 0;
invoices.forEach(inv => {
const m = inv.number.match(/(\d+)$/);
if (m) {
const num = parseInt(m[1]);
if (num > maxNum) maxNum = num;
}
});
return prefix + '-' + String(maxNum + 1).padStart(4, '0');
}

function getNextGlobalQuotationNumber() {
const prefix = getCompanyAbbreviation();
if (!quotations || quotations.length === 0) return prefix + '-QUO-0001';

let maxNum = 0;
quotations.forEach(quo => {
const m = quo.number.match(/(\d+)$/);
if (m) {
const num = parseInt(m[1]);
if (num > maxNum) maxNum = num;
}
});
return prefix + '-QUO-' + String(maxNum + 1).padStart(4, '0');
}

function generateReceiptNumberFromInvoice(invoiceNumber) {
const prefix = getCompanyAbbreviation();
const numMatch = invoiceNumber.match(/(\d+)$/);
if (numMatch) {
return prefix + '-REC-' + numMatch[1];
}
return prefix + '-REC-0001';
}

function getNextInvoiceNumberForCustomer(name) {
const n = name.toLowerCase().trim();
const ci = invoices.filter(i => i.toName.toLowerCase().trim() === n);
if (ci.length === 0) return null;
const last = ci[0].number;
const m = last.match(/(\d+)$/);
if (m) {
const num = parseInt(m[1]) + 1;
return last.replace(/\d+$/, String(num).padStart(m[1].length, '0'));
}
return last;
}

function getCustomerBalance(name) {
return invoices.filter(i => i.toName.toLowerCase() === name.toLowerCase())
.reduce((s, inv) => s + getInvoicePaymentStatus(inv.id).balance, 0);
}

// ========================================
// FORM & ITEM MANAGEMENT FUNCTIONS
// ========================================
function createItemRow() {
const div = document.createElement('div');
div.className = 'item-row';
div.innerHTML = `
<div class="form-group">
<input type="text" class="item-desc" placeholder="Description">
</div>
<div class="form-group">
<input type="number" class="item-qty" value="1" min="1">
</div>
<div class="form-group">
<input type="number" class="item-rate" value="0" step="0.01" min="0">
</div>
<div class="form-group">
<input type="number" class="item-amount" value="0" readonly>
</div>
<div class="form-group">
<button type="button" class="btn btn-danger btn-icon" onclick="this.closest('.item-row').remove()">×</button>
</div>
`;
return div;
}

function createItemRowWithData(item) {
const div = document.createElement('div');
div.className = 'item-row';
div.innerHTML = `
<div class="form-group">
<input type="text" class="item-desc" value="${item.description || ''}">
</div>
<div class="form-group">
<input type="number" class="item-qty" value="${item.quantity || 1}" min="1">
</div>
<div class="form-group">
<input type="number" class="item-rate" value="${item.rate || 0}" step="0.01" min="0">
</div>
<div class="form-group">
<input type="number" class="item-amount" value="${item.amount || 0}" readonly>
</div>
<div class="form-group">
<button type="button" class="btn btn-danger btn-icon" onclick="this.closest('.item-row').remove()">×</button>
</div>
`;
return div;
}

function setupItemCalculation(row) {
const qty = row.querySelector('.item-qty');
const rate = row.querySelector('.item-rate');
const amount = row.querySelector('.item-amount');
const calc = () => amount.value = ((parseFloat(qty.value) || 0) * (parseFloat(rate.value) || 0)).toFixed(2);
qty.addEventListener('input', calc);
rate.addEventListener('input', calc);
}

function addInvoiceItem() {
const row = createItemRow();
document.getElementById('invoice-items').appendChild(row);
setupItemCalculation(row);
}

function addQuotationItem() {
const row = createItemRow();
document.getElementById('quotation-items').appendChild(row);
setupItemCalculation(row);
}

function getItemsFromContainer(containerId) {
return Array.from(document.querySelectorAll('#' + containerId + ' .item-row')).map(row => ({
description: row.querySelector('.item-desc')?.value || '',
quantity: parseFloat(row.querySelector('.item-qty')?.value) || 0,
rate: parseFloat(row.querySelector('.item-rate')?.value) || 0,
amount: parseFloat(row.querySelector('.item-amount')?.value) || 0
}));
}

function calculatePayslip() {
const basic = parseFloat(document.getElementById('pay-basic').value) || 0;
const overtime = parseFloat(document.getElementById('pay-overtime').value) || 0;
const bonus = parseFloat(document.getElementById('pay-bonus').value) || 0;
const allowances = parseFloat(document.getElementById('pay-allowances').value) || 0;
const gross = basic + overtime + bonus + allowances;
const tax = parseFloat(document.getElementById('pay-tax').value) || 0;
const uif = parseFloat(document.getElementById('pay-uif').value) || 0;
const pension = parseFloat(document.getElementById('pay-pension').value) || 0;
const other = parseFloat(document.getElementById('pay-other-deductions').value) || 0;
const totalDed = tax + uif + pension + other;
document.getElementById('pay-gross').value = 'R' + gross.toFixed(2);
document.getElementById('pay-total-deductions').value = 'R' + totalDed.toFixed(2);
document.getElementById('pay-net').value = 'R' + (gross - totalDed).toFixed(2);
}

// ========================================
// INVOICE FORM MEMORY FUNCTIONS
// ========================================
async function saveInvoiceFormData() {
const formData = {
items: getItemsFromContainer('invoice-items'),
notes: document.getElementById('inv-notes').value
};
await saveToIndexedDB('settings', { key: 'savedInvoiceFormData', value: formData });
}

async function loadSavedInvoiceFormData() {
try {
const savedData = await getSingleFromIndexedDB('settings', 'savedInvoiceFormData');
if (!savedData || !savedData.value) return false;

const formData = savedData.value;

if (formData.items && formData.items.length > 0) {
const container = document.getElementById('invoice-items');
container.innerHTML = '';
formData.items.forEach(item => {
const row = createItemRowWithData(item);
container.appendChild(row);
setupItemCalculation(row);
});
}

if (formData.notes) {
document.getElementById('inv-notes').value = formData.notes;
}

return true;
} catch (e) {
console.error('Error loading saved invoice data:', e);
return false;
}
}

async function clearInvoiceFormData() {
await deleteFromIndexedDB('settings', 'savedInvoiceFormData');
}
