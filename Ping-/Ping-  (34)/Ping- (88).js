
// ========================================
// TABLE RENDERING FUNCTIONS
// ========================================
function renderInvoiceTable() {
const search = document.getElementById('invoice-search')?.value.toLowerCase() || '';
const filterFrom = document.getElementById('invoice-filter-from')?.value || '';
const filterTo = document.getElementById('invoice-filter-to')?.value || '';
const filterStatus = document.getElementById('invoice-filter-status')?.value || 'all';

let filtered = invoices.filter(i => {
const matchesSearch = i.toName.toLowerCase().includes(search) || 
i.number.toLowerCase().includes(search);

const matchesDate = (!filterFrom || i.date >= filterFrom) && 
(!filterTo || i.date <= filterTo);

const status = getInvoicePaymentStatus(i.id).status;
const matchesStatus = filterStatus === 'all' || status === filterStatus;

return matchesSearch && matchesDate && matchesStatus;
});

const tbody = document.getElementById('invoice-table-body');

if (filtered.length === 0) {
tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999">No invoices found</td></tr>';
return;
}

tbody.innerHTML = filtered.map(inv => {
const status = getInvoicePaymentStatus(inv.id);
const statusBadge = status.status === 'paid' ? 
'<span class="status-badge paid">PAID</span>' : 
status.status === 'partial' ? 
'<span class="status-badge partial">PARTIAL</span>' : 
'<span class="status-badge pending">PENDING</span>';

const hasPhone = inv.toPhone || customers.find(c => c.name.toLowerCase() === inv.toName.toLowerCase())?.phone;

return `
<tr>
<td><strong>${inv.number}</strong></td>
<td>${formatDate(inv.date)}</td>
<td>${inv.toName}</td>
<td>R${inv.total.toFixed(2)}</td>
<td>${statusBadge}</td>
<td>
<div class="action-buttons">
<button class="btn btn-primary btn-icon" onclick="previewInvoice(${inv.id})" title="Preview">👁️</button>
<button class="btn btn-success btn-icon" onclick="duplicateInvoice(${inv.id})" title="Duplicate">📋</button>
${hasPhone ? `<button class="btn btn-whatsapp btn-icon" onclick="sendInvoiceWhatsApp(${inv.id})" title="WhatsApp">📱</button>` : ''}
<button class="btn btn-danger btn-icon" onclick="deleteInvoice(${inv.id})" title="Delete">🗑️</button>
</div>
</td>
</tr>
`;
}).join('');
}

function renderQuotationTable() {
const search = document.getElementById('quotation-search')?.value.toLowerCase() || '';
const filterFrom = document.getElementById('quotation-filter-from')?.value || '';
const filterTo = document.getElementById('quotation-filter-to')?.value || '';
const filterStatus = document.getElementById('quotation-filter-status')?.value || 'all';

let filtered = quotations.filter(q => {
const matchesSearch = q.toName.toLowerCase().includes(search) || 
q.number.toLowerCase().includes(search);

const matchesDate = (!filterFrom || q.date >= filterFrom) && 
(!filterTo || q.date <= filterTo);

const paymentStatus = getQuotationPaymentStatus(q.id);
let statusType = 'unpaid';
if (paymentStatus.isPaid) statusType = 'paid';
else if (paymentStatus.paid > 0) statusType = 'partial';

const matchesStatus = filterStatus === 'all' || statusType === filterStatus;

return matchesSearch && matchesDate && matchesStatus;
});

const tbody = document.getElementById('quotation-table-body');

if (filtered.length === 0) {
tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#999">No quotations found</td></tr>';
return;
}

tbody.innerHTML = filtered.map(q => {
const hasPhone = q.toPhone || customers.find(c => c.name.toLowerCase() === q.toName.toLowerCase())?.phone;
const status = getQuotationPaymentStatus(q.id);
const statusBadge = status.isPaid ? '<span class="status-badge paid">PAID</span>' : 
status.paid > 0 ? '<span class="status-badge partial">PARTIAL</span>' : 
'<span class="status-badge pending">UNPAID</span>';

return `
<tr>
<td><strong>${q.number}</strong></td>
<td>${formatDate(q.date)}</td>
<td>${q.toName}</td>
<td>R${q.total.toFixed(2)}</td>
<td>${q.validUntil ? formatDate(q.validUntil) : 'N/A'}</td>
<td>${statusBadge}</td>
<td>
<div class="action-buttons">
<button class="btn btn-primary btn-icon" onclick="previewQuotation(${q.id})" title="Preview">👁️</button>
<button class="btn btn-success btn-icon" onclick="duplicateQuotation(${q.id})" title="Duplicate">📋</button>
${hasPhone ? `<button class="btn btn-whatsapp btn-icon" onclick="sendQuotationWhatsApp(${q.id})" title="WhatsApp">📱</button>` : ''}
<button class="btn btn-danger btn-icon" onclick="deleteQuotation(${q.id})" title="Delete">🗑️</button>
</div>
</td>
</tr>
`;
}).join('');
}

function renderReceiptTable() {
const search = document.getElementById('receipt-search')?.value.toLowerCase() || '';
const filterFrom = document.getElementById('receipt-filter-from')?.value || '';
const filterTo = document.getElementById('receipt-filter-to')?.value || '';
const filterMethod = document.getElementById('receipt-filter-method')?.value || 'all';

let filtered = receipts.filter(r => {
const matchesSearch = r.toName.toLowerCase().includes(search) || 
r.number.toLowerCase().includes(search);

const matchesDate = (!filterFrom || r.date >= filterFrom) && 
(!filterTo || r.date <= filterTo);

const matchesMethod = filterMethod === 'all' || r.paymentMethod === filterMethod;

return matchesSearch && matchesDate && matchesMethod;
});

const tbody = document.getElementById('receipt-table-body');

if (filtered.length === 0) {
tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999">No receipts found</td></tr>';
return;
}

tbody.innerHTML = filtered.map(r => {
const hasPhone = r.toPhone || customers.find(c => c.name.toLowerCase() === r.toName.toLowerCase())?.phone;

// Check if linked invoice/quotation is fully paid
let showClearButton = false;
if (r.linkedInvoiceId) {
const invStatus = getInvoicePaymentStatus(r.linkedInvoiceId);
showClearButton = invStatus.status === 'paid';
} else if (r.linkedQuotationId) {
const quoStatus = getQuotationPaymentStatus(r.linkedQuotationId);
showClearButton = quoStatus.isPaid;
}

return `
<tr>
<td><strong>${r.number}</strong></td>
<td>${formatDate(r.date)}</td>
<td>${r.toName}</td>
<td style="color:#10b981;font-weight:bold">R${(r.amountPaid || r.total).toFixed(2)}</td>
<td>${r.paymentMethod || 'Cash'}</td>
<td>
<div class="action-buttons">
<button class="btn btn-primary btn-icon" onclick="previewReceipt(${r.id})" title="Preview">👁️</button>
${hasPhone ? `<button class="btn btn-whatsapp btn-icon" onclick="sendReceiptWhatsApp(${r.id})" title="WhatsApp">📱</button>` : ''}

<button class="btn btn-danger btn-icon" onclick="deleteReceipt(${r.id})" title="Delete">🗑️</button>
</div>
</td>
</tr>
`;
}).join('');
}

// Updated duplicate functions for all document types
function duplicateInvoice(id) {
const inv = invoices.find(i => i.id === id);
if (!inv) return;

showInvoiceForm();

document.getElementById('inv-to-name').value = inv.toName;
document.getElementById('inv-to-phone').value = inv.toPhone || '';
document.getElementById('inv-to-address').value = inv.toAddress || '';
document.getElementById('inv-date').valueAsDate = new Date();
document.getElementById('inv-due-date').value = getEndOfMonth(new Date().toISOString().split('T')[0]);
document.getElementById('inv-notes').value = inv.notes || '';

const nextNum = getNextInvoiceNumberForCustomer(inv.toName) || getNextGlobalInvoiceNumber();
document.getElementById('inv-number').value = nextNum;

const container = document.getElementById('invoice-items');
container.innerHTML = '';
inv.items.forEach(item => {
const row = createItemRowWithData(item);
container.appendChild(row);
setupItemCalculation(row);
});

document.getElementById('customer-invoice-info-text').textContent = '📋 Duplicated from INV #' + inv.number + ' - Update and save';
document.getElementById('customer-invoice-info').style.display = 'flex';

showToast('Invoice duplicated - Edit and save');
window.scrollTo({ top: 0, behavior: 'smooth' });
}

function duplicateQuotation(id) {
const quo = quotations.find(q => q.id === id);
if (!quo) return;

showQuotationForm();

document.getElementById('quo-to-name').value = quo.toName;
document.getElementById('quo-to-phone').value = quo.toPhone || '';
document.getElementById('quo-to-address').value = quo.toAddress || '';
document.getElementById('quo-date').valueAsDate = new Date();
document.getElementById('quo-valid-until').value = '';
document.getElementById('quo-terms').value = quo.terms || '';

document.getElementById('quo-number').value = getNextGlobalQuotationNumber();

const container = document.getElementById('quotation-items');
container.innerHTML = '';
quo.items.forEach(item => {
const row = createItemRowWithData(item);
container.appendChild(row);
setupItemCalculation(row);
});

showToast('Quotation duplicated - Edit and save');
window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function clearReceipt(id) {
const receipt = receipts.find(r => r.id === id);
if (!receipt) return;

let isFullyPaid = false;
if (receipt.linkedInvoiceId) {
const invStatus = getInvoicePaymentStatus(receipt.linkedInvoiceId);
isFullyPaid = invStatus.status === 'paid';
} else if (receipt.linkedQuotationId) {
const quoStatus = getQuotationPaymentStatus(receipt.linkedQuotationId);
isFullyPaid = quoStatus.isPaid;
}

if (!isFullyPaid) {
showToast('Can only clear receipts for fully paid invoices', 'warning');
return;
}

showDeletePopup('Clear this receipt? The linked invoice is fully paid.', async () => {
receipts = receipts.filter(r => r.id !== id);
await saveToIndexedDB('receipts', receipts);
renderReceiptTable();
renderInvoiceTable();
updateDashboard();
showToast('Receipt cleared successfully');
});
}

// Updated switchTab to work with removed tabs
function switchTab(tab) {
document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

const navLink = document.querySelector('[onclick="switchTab(\'' + tab + '\')"]');
if (navLink) navLink.classList.add('active');

const tabContent = document.getElementById(tab + '-tab');
if (tabContent) tabContent.classList.add('active');

document.getElementById('sidebar').classList.remove('open');

if (tab === 'dashboard') {
updateDashboard();
} else if (tab === 'receipt') {
updatePendingInvoiceDropdown();
updatePendingQuotationDropdown();
renderReceiptTable();
} else if (tab === 'invoice') {
renderInvoiceTable();
} else if (tab === 'quotation') {
renderQuotationTable();
} else if (tab === 'payslip') {
renderPayslipTable();
} else if (tab === 'customers') {
renderCustomerTable();
} else if (tab === 'settings') {
updateCompanyInfoPreview();
}
}
