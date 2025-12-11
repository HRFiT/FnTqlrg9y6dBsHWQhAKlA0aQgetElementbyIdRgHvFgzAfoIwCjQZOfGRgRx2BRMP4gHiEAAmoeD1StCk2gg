
// ========================================
// CUSTOMER SEARCH MODAL FUNCTIONS
// ========================================
function openCustomerSearchModal() {
document.getElementById('customer-search-overlay').style.display = 'flex';
document.getElementById('customer-search-modal-input').value = '';
setTimeout(() => document.getElementById('customer-search-modal-input').focus(), 100);
filterCustomerInvoicesModal();
}

function closeCustomerSearchModal() {
document.getElementById('customer-search-overlay').style.display = 'none';
}

function clearSelectedCustomer() {
document.getElementById('selected-customer-display').style.display = 'none';
document.getElementById('selected-customer-name').textContent = '';
document.getElementById('filtered-invoice-container').innerHTML = '';
updatePendingInvoiceDropdown();
updatePendingQuotationDropdown();
}

function filterCustomerInvoicesModal() {
const v = document.getElementById('customer-search-modal-input').value.toLowerCase().trim();
const resultsContainer = document.getElementById('customer-search-modal-results');

if (v.length < 1) {
const allCustomers = customers.slice(0, 20);
if (allCustomers.length === 0) {
resultsContainer.innerHTML = '<p style="color:rgba(255,255,255,0.6);text-align:center;padding:20px">No customers found. Add customers first.</p>';
return;
}
resultsContainer.innerHTML = allCustomers.map(c => {
const ci = invoices.filter(i => i.toName.toLowerCase() === c.name.toLowerCase());
const cq = quotations.filter(q => q.toName.toLowerCase() === c.name.toLowerCase() && !getQuotationPaymentStatus(q.id).isPaid);
const unpaid = ci.filter(i => ['pending', 'partial'].includes(getInvoicePaymentStatus(i.id).status));
return '<div class="suggestion-item" onclick="selectCustomerFromModal(\'' + c.name.replace(/'/g, "\\'") + '\')">' +
'<div class="customer-name">' + c.name + '</div>' +
(c.phone ? '<div class="customer-phone">📱 ' + c.phone + '</div>' : '') +
'<div class="customer-badges">' +
'<span class="badge invoice-num">' + ci.length + ' inv</span>' +
'<span class="badge" style="background:#fef3c7;color:#d97706">' + cq.length + ' quo</span>' +
(unpaid.length > 0 ? '<span class="badge balance">' + unpaid.length + ' unpaid</span>' : '<span class="badge paid">Paid</span>') +
'</div></div>';
}).join('');
return;
}

const matches = customers.filter(c => c.name.toLowerCase().includes(v));

if (matches.length === 0) {
resultsContainer.innerHTML = '<p style="color:rgba(255,255,255,0.6);text-align:center;padding:20px">No customers found</p>';
return;
}

resultsContainer.innerHTML = matches.map(c => {
const ci = invoices.filter(i => i.toName.toLowerCase() === c.name.toLowerCase());
const cq = quotations.filter(q => q.toName.toLowerCase() === c.name.toLowerCase() && !getQuotationPaymentStatus(q.id).isPaid);
const unpaid = ci.filter(i => ['pending', 'partial'].includes(getInvoicePaymentStatus(i.id).status));
return '<div class="suggestion-item" onclick="selectCustomerFromModal(\'' + c.name.replace(/'/g, "\\'") + '\')">' +
'<div class="customer-name">' + c.name + '</div>' +
(c.phone ? '<div class="customer-phone">📱 ' + c.phone + '</div>' : '') +
'<div class="customer-badges">' +
'<span class="badge invoice-num">' + ci.length + ' inv</span>' +
'<span class="badge" style="background:#fef3c7;color:#d97706">' + cq.length + ' quo</span>' +
(unpaid.length > 0 ? '<span class="badge balance">' + unpaid.length + ' unpaid</span>' : '<span class="badge paid">Paid</span>') +
'</div></div>';
}).join('');
}

function selectCustomerFromModal(name) {
closeCustomerSearchModal();
document.getElementById('selected-customer-name').textContent = '✅ Selected: ' + name;
document.getElementById('selected-customer-display').style.display = 'block';
loadCustomerPendingDocuments(name);
}

function loadCustomerPendingDocuments(name) {
const ci = invoices.filter(i => i.toName.toLowerCase() === name.toLowerCase());
const cq = quotations.filter(q => q.toName.toLowerCase() === name.toLowerCase() && !getQuotationPaymentStatus(q.id).isPaid);
const container = document.getElementById('filtered-invoice-container');
const pending = ci.filter(i => ['pending', 'partial'].includes(getInvoicePaymentStatus(i.id).status));

if (pending.length === 0 && cq.length === 0) {
container.innerHTML = '<div class="alert-box success">✅ All paid! No pending invoices or quotations for ' + name + '</div>';
updatePendingInvoiceDropdown();
updatePendingQuotationDropdown();
return;
}

let html = '<div class="filtered-invoice-info"><h5>📄 Pending Documents for ' + name + '</h5>';

if (pending.length > 0) {
const total = pending.reduce((s, inv) => s + getInvoicePaymentStatus(inv.id).balance, 0);
html += '<div class="balance-summary" style="margin-top:10px"><h5 style="color:#667eea">📋 Pending Invoices (' + pending.length + ')</h5>';
html += pending.map(inv => {
const st = getInvoicePaymentStatus(inv.id);
return '<div class="balance-summary-item"><span>INV #' + inv.number + ' - ' + formatDate(inv.date) + '</span><span>R' + st.balance.toFixed(2) + '</span></div>';
}).join('');
html += '<div class="balance-summary-item"><span><strong>TOTAL PENDING</strong></span><span style="color:#dc2626"><strong>R' + total.toFixed(2) + '</strong></span></div></div>';
html += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
html += pending.map(inv => '<button class="btn btn-success btn-small" onclick="selectInvoiceForReceipt(' + inv.id + ')">💰 Pay INV #' + inv.number + '</button>').join('');
html += '</div>';
}

if (cq.length > 0) {
const total = cq.reduce((s, q) => s + q.total, 0);
html += '<div class="balance-summary" style="margin-top:15px;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);border-color:#f59e0b">';
html += '<h5 style="color:#92400e">📝 Unpaid Quotations (' + cq.length + ')</h5>';
html += cq.map(q => '<div class="balance-summary-item"><span>QUO #' + q.number + ' - ' + formatDate(q.date) + '</span><span>R' + q.total.toFixed(2) + '</span></div>').join('');
html += '<div class="balance-summary-item"><span><strong>TOTAL QUOTATIONS</strong></span><span style="color:#92400e"><strong>R' + total.toFixed(2) + '</strong></span></div></div>';
html += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
html += cq.map(q => '<button class="btn btn-small" style="background:#f59e0b;color:white" onclick="selectQuotationForReceipt(' + q.id + ')">💰 Pay QUO #' + q.number + '</button>').join('');
html += '</div>';
}

html += '</div>';
container.innerHTML = html;

updatePendingInvoiceDropdownForCustomer(name);
updatePendingQuotationDropdownForCustomer(name);
}

function updatePendingInvoiceDropdownForCustomer(customerName) {
const select = document.getElementById('rec-pending-invoice');
const ci = invoices.filter(i => i.toName.toLowerCase() === customerName.toLowerCase());
const unpaid = ci.filter(i => ['pending', 'partial'].includes(getInvoicePaymentStatus(i.id).status));

if (unpaid.length === 0) {
select.innerHTML = '<option value="">-- No Unpaid Invoices for ' + customerName + ' --</option>';
select.disabled = true;
} else {
select.disabled = false;
select.innerHTML = '<option value="">-- Select Invoice --</option>' + unpaid.map(inv => {
const s = getInvoicePaymentStatus(inv.id);
return '<option value="' + inv.id + '">#' + inv.number + ' - ' + formatDate(inv.date) + ' (R' + s.balance.toFixed(2) + ')</option>';
}).join('');
}
}

function updatePendingQuotationDropdownForCustomer(customerName) {
const select = document.getElementById('rec-pending-quotation');
const cq = quotations.filter(q => q.toName.toLowerCase() === customerName.toLowerCase() && !getQuotationPaymentStatus(q.id).isPaid);

if (cq.length === 0) {
select.innerHTML = '<option value="">-- No Unpaid Quotations for ' + customerName + ' --</option>';
select.disabled = true;
} else {
select.disabled = false;
select.innerHTML = '<option value="">-- Select Quotation --</option>' + cq.map(q => {
const s = getQuotationPaymentStatus(q.id);
return '<option value="' + q.id + '">#' + q.number + ' - ' + formatDate(q.date) + ' (R' + s.balance.toFixed(2) + ')</option>';
}).join('');
}
}

function selectInvoiceForReceipt(id) {
document.getElementById('rec-pending-invoice').value = id;
document.getElementById('rec-pending-quotation').value = '';
loadPendingInvoiceDetails();
currentQuotationForReceipt = null;
showToast('Invoice selected - Ready to create receipt');
document.getElementById('receiptForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectQuotationForReceipt(id) {
document.getElementById('rec-pending-quotation').value = id;
document.getElementById('rec-pending-invoice').value = '';
loadPendingQuotationDetails();
currentInvoiceForReceipt = null;
showToast('Quotation selected - Ready to create receipt');
document.getElementById('receiptForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}