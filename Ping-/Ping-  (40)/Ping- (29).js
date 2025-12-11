
// ========================================
// TABLE RENDERING FUNCTIONS (PAYSLIP)
// ========================================

// 🆕 ADDED: Payslip table rendering function
function renderPayslipTable() {
const search = document.getElementById('payslip-search')?.value.toLowerCase() || '';
const filterFrom = document.getElementById('payslip-filter-from')?.value || '';
const filterTo = document.getElementById('payslip-filter-to')?.value || '';

let filtered = payslips.filter(p => {
const matchesSearch = p.employeeName.toLowerCase().includes(search) || 
p.number.toLowerCase().includes(search) ||
(p.position && p.position.toLowerCase().includes(search));

const matchesDate = (!filterFrom || p.date >= filterFrom) && 
(!filterTo || p.date <= filterTo);

return matchesSearch && matchesDate;
});

const tbody = document.getElementById('payslip-table-body');

if (filtered.length === 0) {
tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999">No payslips found</td></tr>';
return;
}

tbody.innerHTML = filtered.map(p => {
return `
<tr>
<td><strong>${p.number}</strong></td>
<td>${formatDate(p.date)}</td>
<td>${p.employeeName}</td>
<td>${p.position || 'N/A'}</td>
<td style="color:#10b981;font-weight:bold">R${(p.netPay || 0).toFixed(2)}</td>
<td>
<div class="action-buttons">
<button class="btn btn-primary btn-icon" onclick="previewPayslip(${p.id})" title="Preview">👁️</button>
<button class="btn btn-danger btn-icon" onclick="deletePayslip(${p.id})" title="Delete">🗑️</button>
</div>
</td>
</tr>
`;
}).join('');
}

// 🆕 ADDED: Customer table rendering function
function renderCustomerTable() {
const search = document.getElementById('customer-search')?.value.toLowerCase() || '';

let filtered = customers.filter(c => {
return c.name.toLowerCase().includes(search) || 
(c.phone && c.phone.includes(search)) ||
(c.address && c.address.toLowerCase().includes(search));
});

const tbody = document.getElementById('customer-table-body');

if (filtered.length === 0) {
tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:#999">No customers found</td></tr>';
return;
}

tbody.innerHTML = filtered.map(c => {
const ci = invoices.filter(i => i.toName.toLowerCase() === c.name.toLowerCase());
const balance = getCustomerBalance(c.name);

return `
<tr>
<td><strong>${c.name}</strong></td>
<td>${c.phone || 'N/A'}</td>
<td>${c.address || 'N/A'}</td>
<td>${ci.length}</td>
<td style="color:${balance > 0 ? '#f59e0b' : '#10b981'};font-weight:bold">R${balance.toFixed(2)}</td>
<td>
<div class="action-buttons">
<button class="btn btn-danger btn-icon" onclick="deleteCustomer(${c.id})" title="Delete">🗑️</button>
</div>
</td>
</tr>
`;
}).join('');
}

// 🆕 ADDED: Render all tables function
function renderAll() {
renderInvoiceTable();
renderQuotationTable();
renderReceiptTable();
renderPayslipTable();
renderCustomerTable();
}

// 🆕 ADDED: Filter clear functions
function clearInvoiceFilters() {
document.getElementById('invoice-filter-from').value = '';
document.getElementById('invoice-filter-to').value = '';
document.getElementById('invoice-filter-status').value = 'all';
document.getElementById('invoice-search').value = '';
renderInvoiceTable();
}

function clearQuotationFilters() {
document.getElementById('quotation-filter-from').value = '';
document.getElementById('quotation-filter-to').value = '';
document.getElementById('quotation-filter-status').value = 'all';
document.getElementById('quotation-search').value = '';
renderQuotationTable();
}

function clearReceiptFilters() {
document.getElementById('receipt-filter-from').value = '';
document.getElementById('receipt-filter-to').value = '';
document.getElementById('receipt-filter-method').value = 'all';
document.getElementById('receipt-search').value = '';
renderReceiptTable();
}

function clearPayslipFilters() {
document.getElementById('payslip-filter-from').value = '';
document.getElementById('payslip-filter-to').value = '';
document.getElementById('payslip-search').value = '';
renderPayslipTable();
}

// 🆕 ADDED: Receipt dropdown functions
function updatePendingInvoiceDropdown() {
const select = document.getElementById('rec-pending-invoice');
const unpaid = getUnpaidInvoices();

if (unpaid.length === 0) {
select.innerHTML = '<option value="">-- No Unpaid Invoices --</option>';
select.disabled = true;
document.getElementById('no-pending-alert').style.display = 'block';
} else {
select.disabled = false;
document.getElementById('no-pending-alert').style.display = 'none';
select.innerHTML = '<option value="">-- Select Invoice --</option>' + unpaid.map(inv => {
const s = getInvoicePaymentStatus(inv.id);
return '<option value="' + inv.id + '">#' + inv.number + ' - ' + inv.toName + ' (R' + s.balance.toFixed(2) + ')</option>';
}).join('');
}
}

function updatePendingQuotationDropdown() {
const select = document.getElementById('rec-pending-quotation');
const unpaid = getUnpaidQuotations();

if (unpaid.length === 0) {
select.innerHTML = '<option value="">-- No Unpaid Quotations --</option>';
select.disabled = true;
} else {
select.disabled = false;
select.innerHTML = '<option value="">-- Select Quotation --</option>' + unpaid.map(q => {
const s = getQuotationPaymentStatus(q.id);
return '<option value="' + q.id + '">#' + q.number + ' - ' + q.toName + ' (R' + s.balance.toFixed(2) + ')</option>';
}).join('');
}
}

function loadPendingInvoiceDetails() {
const invId = parseInt(document.getElementById('rec-pending-invoice').value);
if (!invId) {
document.getElementById('receipt-items').innerHTML = '<p style="color:#666;text-align:center">Select an invoice</p>';
document.getElementById('payment-amount-section').style.display = 'none';
document.getElementById('invoice-dates-display').style.display = 'none';
document.getElementById('generate-receipt-btn').disabled = true;
currentInvoiceForReceipt = null;
return;
}

const inv = invoices.find(i => i.id === invId);
if (!inv) return;

currentInvoiceForReceipt = inv;
document.getElementById('rec-pending-quotation').value = '';
document.getElementById('rec-to-name').value = inv.toName;
document.getElementById('rec-number').value = generateReceiptNumberFromInvoice(inv.number);

const status = getInvoicePaymentStatus(inv.id);

document.getElementById('receipt-items').innerHTML = inv.items.map(item => 
'<div class="item-display-row"><div>' + item.description + '</div><div>' + item.quantity + '</div><div>R' + item.rate.toFixed(2) + '</div><div>R' + item.amount.toFixed(2) + '</div></div>'
).join('');

document.getElementById('rec-invoice-total').value = 'R' + inv.total.toFixed(2);
document.getElementById('rec-previously-paid').value = 'R' + status.paid.toFixed(2);
document.getElementById('rec-balance-due').value = 'R' + status.balance.toFixed(2);
document.getElementById('rec-amount-paying').value = status.balance.toFixed(2);

document.getElementById('rec-inv-date-display').textContent = formatDate(inv.date);
document.getElementById('rec-inv-due-date-display').textContent = formatDate(inv.dueDate);
document.getElementById('rec-source-type').textContent = 'Invoice';

document.getElementById('payment-amount-section').style.display = 'block';
document.getElementById('invoice-dates-display').style.display = 'block';
document.getElementById('generate-receipt-btn').disabled = false;

calculateRemainingBalance();
}

function loadPendingQuotationDetails() {
const quoId = parseInt(document.getElementById('rec-pending-quotation').value);
if (!quoId) {
document.getElementById('receipt-items').innerHTML = '<p style="color:#666;text-align:center">Select a quotation</p>';
document.getElementById('payment-amount-section').style.display = 'none';
document.getElementById('invoice-dates-display').style.display = 'none';
document.getElementById('generate-receipt-btn').disabled = true;
currentQuotationForReceipt = null;
return;
}

const quo = quotations.find(q => q.id === quoId);
if (!quo) return;

currentQuotationForReceipt = quo;
document.getElementById('rec-pending-invoice').value = '';
document.getElementById('rec-to-name').value = quo.toName;
document.getElementById('rec-number').value = generateReceiptNumberFromInvoice(quo.number);

const status = getQuotationPaymentStatus(quo.id);

document.getElementById('receipt-items').innerHTML = quo.items.map(item => 
'<div class="item-display-row"><div>' + item.description + '</div><div>' + item.quantity + '</div><div>R' + item.rate.toFixed(2) + '</div><div>R' + item.amount.toFixed(2) + '</div></div>'
).join('');

document.getElementById('rec-invoice-total').value = 'R' + quo.total.toFixed(2);
document.getElementById('rec-previously-paid').value = 'R' + status.paid.toFixed(2);
document.getElementById('rec-balance-due').value = 'R' + status.balance.toFixed(2);
document.getElementById('rec-amount-paying').value = status.balance.toFixed(2);

document.getElementById('rec-inv-date-display').textContent = formatDate(quo.date);
document.getElementById('rec-inv-due-date-display').textContent = quo.validUntil ? formatDate(quo.validUntil) : 'N/A';
document.getElementById('rec-source-type').textContent = 'Quotation';

document.getElementById('payment-amount-section').style.display = 'block';
document.getElementById('invoice-dates-display').style.display = 'block';
document.getElementById('generate-receipt-btn').disabled = false;

calculateRemainingBalance();
}

function calculateRemainingBalance() {
const totalElem = document.getElementById('rec-invoice-total');
const paidElem = document.getElementById('rec-previously-paid');
const payingElem = document.getElementById('rec-amount-paying');
const remainingElem = document.getElementById('remaining-balance-amount');
const remainingContainer = document.getElementById('remaining-balance-info');

if (!totalElem || !payingElem) return;

const total = parseFloat(totalElem.value.replace('R', '')) || 0;
const previouslyPaid = parseFloat(paidElem.value.replace('R', '')) || 0;
const paying = parseFloat(payingElem.value) || 0;

const remaining = total - previouslyPaid - paying;

if (remaining > 0.01) {
remainingElem.textContent = 'R' + remaining.toFixed(2);
remainingContainer.style.display = 'block';
} else {
remainingContainer.style.display = 'none';
}
}

// 🆕 ADDED: WhatsApp sending functions
function sendInvoiceWhatsApp(id) {
const inv = invoices.find(i => i.id === id);
if (!inv) return;

const customer = customers.find(c => c.name.toLowerCase() === inv.toName.toLowerCase());
const phone = formatPhoneForWhatsApp(inv.toPhone || customer?.phone);

if (!phone) {
showToast('No phone number available', 'warning');
return;
}

const status = getInvoicePaymentStatus(inv.id);
const message = `Hi ${inv.toName},%0A%0AYour invoice #${inv.number} for R${inv.total.toFixed(2)} is ready.%0A%0ABalance due: R${status.balance.toFixed(2)}%0A%0AThank you!%0A${companySettings.name || 'DocGen Pro'}`;

window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

function sendQuotationWhatsApp(id) {
const quo = quotations.find(q => q.id === id);
if (!quo) return;

const customer = customers.find(c => c.name.toLowerCase() === quo.toName.toLowerCase());
const phone = formatPhoneForWhatsApp(quo.toPhone || customer?.phone);

if (!phone) {
showToast('No phone number available', 'warning');
return;
}

const message = `Hi ${quo.toName},%0A%0AYour quotation #${quo.number} for R${quo.total.toFixed(2)} is ready.%0A%0AThank you!%0A${companySettings.name || 'DocGen Pro'}`;

window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

function sendReceiptWhatsApp(id) {
const rec = receipts.find(r => r.id === id);
if (!rec) return;

const customer = customers.find(c => c.name.toLowerCase() === rec.toName.toLowerCase());
const phone = formatPhoneForWhatsApp(rec.toPhone || customer?.phone);

if (!phone) {
showToast('No phone number available', 'warning');
return;
}

const message = `Hi ${rec.toName},%0A%0AYour receipt #${rec.number} for R${(rec.amountPaid || rec.total).toFixed(2)} is ready.%0A%0AThank you!%0A${companySettings.name || 'DocGen Pro'}`;

window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

function sendViaWhatsApp() {
if (!currentPreviewData) return;

const phone = formatPhoneForWhatsApp(currentPreviewData.phone);
if (!phone) {
showToast('No phone number available', 'warning');
return;
}

const doc = currentPreviewData.data;
let message = '';

if (currentPreviewData.type === 'invoice') {
message = `Hi ${doc.toName},%0A%0AYour invoice #${doc.number} for R${doc.total.toFixed(2)} is ready.%0A%0AThank you!%0A${companySettings.name || 'DocGen Pro'}`;
} else if (currentPreviewData.type === 'quotation') {
message = `Hi ${doc.toName},%0A%0AYour quotation #${doc.number} for R${doc.total.toFixed(2)} is ready.%0A%0AThank you!%0A${companySettings.name || 'DocGen Pro'}`;
} else if (currentPreviewData.type === 'receipt') {
message = `Hi ${doc.toName},%0A%0AYour receipt #${doc.number} for R${(doc.amountPaid || doc.total).toFixed(2)} is ready.%0A%0AThank you!%0A${companySettings.name || 'DocGen Pro'}`;
}

window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
}

// 🆕 ADDED: PDF download function
async function downloadPDF() {
if (!currentPreviewData) return;

const doc = currentPreviewData.data;
let filename = '';

if (currentPreviewData.type === 'invoice') {
filename = `Invoice_${doc.number}_${doc.toName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
} else if (currentPreviewData.type === 'quotation') {
filename = `Quotation_${doc.number}_${doc.toName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
} else if (currentPreviewData.type === 'receipt') {
filename = `Receipt_${doc.number}_${doc.toName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
} else if (currentPreviewData.type === 'payslip') {
filename = `Payslip_${doc.number}_${doc.employeeName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
}

try {
const previewArea = document.getElementById('preview-area');
const canvas = await html2canvas(previewArea, {
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

showToast('PDF downloaded!');
} catch (error) {
console.error('Error generating PDF:', error);
showToast('Error generating PDF', 'error');
}
}

// 🆕 ADDED: Dashboard date filter function
function setCurrentMonthFilter() {
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
document.getElementById('chart-date-from').value = firstDay.toISOString().split('T')[0];
document.getElementById('chart-date-to').value = lastDay.toISOString().split('T')[0];
document.getElementById('current-month-display').textContent = now.toLocaleString('default', { month: 'long', year: 'numeric' });
}

// 🆕 ADDED: Placeholder for OCR (if needed in future)
function initOCREventListeners() {
// Placeholder for OCR functionality if needed
// Currently not implemented
}