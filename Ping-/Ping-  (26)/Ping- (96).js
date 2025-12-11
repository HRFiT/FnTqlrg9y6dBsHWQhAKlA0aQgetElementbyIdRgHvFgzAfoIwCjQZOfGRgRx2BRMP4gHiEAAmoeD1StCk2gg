
// ========================================
// DOCUMENT HTML GENERATION FUNCTIONS
// ========================================
function generateInvoiceHTML(inv) {
const s = getInvoicePaymentStatus(inv.id);
const recs = receipts.filter(r => r.linkedInvoiceId === inv.id);
const banks = inv.bankAccounts || bankAccounts;
const customer = customers.find(c => c.name.toLowerCase() === inv.toName.toLowerCase());
const phone = inv.toPhone || customer?.phone;
return '<div class="document-preview"><div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title">INVOICE</h1><p>#' + inv.number + ' | ' + formatDate(inv.date) + '</p>' + (inv.dueDate ? '<p>Due: ' + formatDate(inv.dueDate) + '</p>' : '') + '<p style="color:' + (s.status === 'paid' ? '#10b981' : '#f59e0b') + ';font-weight:bold">' + s.status.toUpperCase() + '</p></div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (inv.fromName || companySettings.name) + '</strong><br>' + (inv.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>To:</h4><p>' + inv.toName + '<br>' + inv.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + inv.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total:</td><td>R' + inv.total.toFixed(2) + '</td></tr>' + (s.paid > 0 ? '<tr style="color:#10b981"><td colspan="3" style="text-align:right">Paid:</td><td>R' + s.paid.toFixed(2) + '</td></tr>' : '') + (s.balance > 0 ? '<tr style="color:#dc2626"><td colspan="3" style="text-align:right"><strong>Balance:</strong></td><td><strong>R' + s.balance.toFixed(2) + '</strong></td></tr>' : '') + '</tfoot></table>' + (recs.length > 0 ? '<div class="payment-history"><h4>Payment History</h4>' + recs.map(r => '<div class="payment-history-item"><span>Receipt #' + r.number + ' - ' + formatDate(r.date) + '</span><span style="color:#10b981">R' + (r.amountPaid || r.total).toFixed(2) + '</span></div>').join('') + '</div>' : '') + (inv.notes ? '<p><strong>Notes:</strong> ' + inv.notes + '</p>' : '') + (banks.length > 0 ? '<div style="margin-top:20px;border-top:2px solid #667eea;padding-top:15px"><h4 style="color:#667eea;margin-bottom:15px">Banking Details</h4>' + banks.map(a => '<p><strong>' + a.bankName + ':</strong> ' + a.accountNumber + (a.branchCode ? ' | Branch: ' + a.branchCode : '') + '</p>').join('') + '</div>' : '') + '</div>';
}

function generateQuotationHTML(q) {
const customer = customers.find(c => c.name.toLowerCase() === q.toName.toLowerCase());
const phone = q.toPhone || customer?.phone;
return '<div class="document-preview"><div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title" style="color:#f59e0b">QUOTATION</h1><p>#' + q.number + ' | ' + formatDate(q.date) + '</p>' + (q.validUntil ? '<p>Valid until: ' + formatDate(q.validUntil) + '</p>' : '') + '</div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (q.fromName || companySettings.name) + '</strong><br>' + (q.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>To:</h4><p>' + q.toName + '<br>' + q.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + q.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right"><strong>Total:</strong></td><td><strong>R' + q.total.toFixed(2) + '</strong></td></tr></tfoot></table>' + (q.terms ? '<p><strong>Terms:</strong> ' + q.terms + '</p>' : '') + '</div>';
}

function generateReceiptHTML(r) {
const customer = customers.find(c => c.name.toLowerCase() === r.toName.toLowerCase());
const phone = r.toPhone || customer?.phone;
const sourceDoc = r.linkedInvoiceNumber ? 'Invoice #' + r.linkedInvoiceNumber : (r.linkedQuotationNumber ? 'Quotation #' + r.linkedQuotationNumber : 'Direct Payment');
return '<div class="document-preview"><div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title" style="color:#10b981">RECEIPT</h1><p>#' + r.number + ' | ' + formatDate(r.date) + '</p></div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (r.fromName || companySettings.name) + '</strong><br>' + (r.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>Received From:</h4><p>' + r.toName + '<br>' + r.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><div class="invoice-dates-box"><p><strong>Source:</strong> ' + sourceDoc + '</p><p><strong>Payment Method:</strong> ' + (r.paymentMethod || 'Cash') + '</p></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + r.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total:</td><td>R' + r.total.toFixed(2) + '</td></tr><tr style="color:#10b981;font-size:1.1rem"><td colspan="3" style="text-align:right"><strong>Amount Paid:</strong></td><td><strong>R' + (r.amountPaid || r.total).toFixed(2) + '</strong></td></tr>' + (r.remainingBalance > 0 ? '<tr style="color:#dc2626"><td colspan="3" style="text-align:right"><strong>Balance:</strong></td><td><strong>R' + r.remainingBalance.toFixed(2) + '</strong></td></tr>' : '') + '</tfoot></table></div>';
}

function generatePayslipHTML(p) {
return '<div class="document-preview"><div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title" style="color:#ec4899">PAYSLIP</h1><p>#' + p.number + ' | ' + formatDate(p.date) + '</p>' + (p.period ? '<p>Period: ' + p.period + '</p>' : '') + '</div></div>' + '<div class="info-grid"><div class="info-box"><h4>Employer:</h4><p><strong>' + (p.fromName || companySettings.name || 'Company') + '</strong><br>' + (p.fromAddress || companySettings.address || '') + '</p></div>' + '<div class="info-box"><h4>Employee:</h4><p><strong>' + p.employeeName + '</strong><br>ID: ' + (p.employeeId || 'N/A') + '<br>Position: ' + (p.position || 'N/A') + '</p></div></div>' + '<div class="earnings-deductions-grid">' + '<div class="earnings-section"><h4>Earnings</h4>' + '<p>Basic Salary: R' + (p.earnings?.basic || 0).toFixed(2) + '</p>' + '<p>Overtime: R' + (p.earnings?.overtime || 0).toFixed(2) + '</p>' + '<p>Bonus: R' + (p.earnings?.bonus || 0).toFixed(2) + '</p>' + '<p>Allowances: R' + (p.earnings?.allowances || 0).toFixed(2) + '</p>' + '<p><strong>Gross Pay: R' + (p.gross || 0).toFixed(2) + '</strong></p></div>' + '<div class="deductions-section"><h4>Deductions</h4>' + '<p>Tax (PAYE): R' + (p.deductions?.tax || 0).toFixed(2) + '</p>' + '<p>UIF: R' + (p.deductions?.uif || 0).toFixed(2) + '</p>' + '<p>Pension: R' + (p.deductions?.pension || 0).toFixed(2) + '</p>' + '<p>Other: R' + (p.deductions?.other || 0).toFixed(2) + '</p>' + '<p><strong>Total Deductions: R' + (p.totalDeductions || 0).toFixed(2) + '</strong></p></div></div>' + '<div style="text-align:center;padding:20px;background:#f0fdf4;border-radius:8px;margin-top:20px;border:2px solid #10b981">' + '<h2 style="color:#10b981;margin:0">NET PAY: R' + (p.netPay || 0).toFixed(2) + '</h2></div></div>';
}



// ========================================
// 20. PREVIEW FUNCTIONS
// ========================================
function previewInvoice(id) { 
const inv = invoices.find(i => i.id === id); 
if (!inv) return; 
const s = getInvoicePaymentStatus(inv.id); 
const recs = receipts.filter(r => r.linkedInvoiceId === inv.id); 
const banks = inv.bankAccounts || bankAccounts; 
const customer = customers.find(c => c.name.toLowerCase() === inv.toName.toLowerCase()); 
const phone = inv.toPhone || customer?.phone; 
currentPreviewData = { type: 'invoice', data: inv, phone }; 
document.getElementById('whatsapp-send-btn').style.display = phone ? 'inline-block' : 'none'; 
document.getElementById('preview-area').innerHTML = '<div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title">INVOICE</h1><p>#' + inv.number + ' | ' + formatDate(inv.date) + '</p>' + (inv.dueDate ? '<p>Due: ' + formatDate(inv.dueDate) + '</p>' : '') + '<p style="color:' + (s.status === 'paid' ? '#10b981' : '#f59e0b') + ';font-weight:bold">' + s.status.toUpperCase() + '</p></div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (inv.fromName || companySettings.name) + '</strong><br>' + (inv.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>To:</h4><p>' + inv.toName + '<br>' + inv.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + inv.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total:</td><td>R' + inv.total.toFixed(2) + '</td></tr>' + (s.paid > 0 ? '<tr style="color:#10b981"><td colspan="3" style="text-align:right">Paid:</td><td>R' + s.paid.toFixed(2) + '</td></tr>' : '') + (s.balance > 0 ? '<tr style="color:#dc2626"><td colspan="3" style="text-align:right"><strong>Balance:</strong></td><td><strong>R' + s.balance.toFixed(2) + '</strong></td></tr>' : '') + '</tfoot></table>' + (recs.length > 0 ? '<div class="payment-history"><h4>Payment History</h4>' + recs.map(r => '<div class="payment-history-item"><span>Receipt #' + r.number + ' - ' + formatDate(r.date) + '</span><span style="color:#10b981">R' + (r.amountPaid || r.total).toFixed(2) + '</span></div>').join('') + '</div>' : '') + (inv.notes ? '<p><strong>Notes:</strong> ' + inv.notes + '</p>' : '') + (banks.length > 0 ? '<div style="margin-top:20px;border-top:2px solid #667eea;padding-top:15px"><h4 style="color:#667eea;margin-bottom:15px">Banking Details</h4>' + banks.map(a => '<p><strong>' + a.bankName + ':</strong> ' + a.accountNumber + (a.branchCode ? ' | Branch: ' + a.branchCode : '') + '</p>').join('') + '</div>' : ''); 
document.getElementById('preview-modal').style.display = 'block'; 
}

function previewQuotation(id) { 
const q = quotations.find(x => x.id === id); 
if (!q) return; 
const customer = customers.find(c => c.name.toLowerCase() === q.toName.toLowerCase()); 
const phone = q.toPhone || customer?.phone; 
const status = getQuotationPaymentStatus(q.id); 
currentPreviewData = { type: 'quotation', data: q, phone }; 
document.getElementById('whatsapp-send-btn').style.display = phone ? 'inline-block' : 'none'; 
document.getElementById('preview-area').innerHTML = '<div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title" style="color:#f59e0b">QUOTATION</h1><p>#' + q.number + ' | ' + formatDate(q.date) + '</p>' + (q.validUntil ? '<p>Valid until: ' + formatDate(q.validUntil) + '</p>' : '') + '<p style="color:' + (status.isPaid ? '#10b981' : '#f59e0b') + ';font-weight:bold">' + (status.isPaid ? 'PAID' : (status.paid > 0 ? 'PARTIAL' : 'UNPAID')) + '</p></div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (q.fromName || companySettings.name) + '</strong><br>' + (q.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>To:</h4><p>' + q.toName + '<br>' + q.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + q.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right"><strong>Total:</strong></td><td><strong>R' + q.total.toFixed(2) + '</strong></td></tr>' + (status.paid > 0 ? '<tr style="color:#10b981"><td colspan="3" style="text-align:right">Paid:</td><td>R' + status.paid.toFixed(2) + '</td></tr>' : '') + (status.balance > 0 ? '<tr style="color:#dc2626"><td colspan="3" style="text-align:right"><strong>Balance:</strong></td><td><strong>R' + status.balance.toFixed(2) + '</strong></td></tr>' : '') + '</tfoot></table>' + (q.terms ? '<p><strong>Terms:</strong> ' + q.terms + '</p>' : ''); 
document.getElementById('preview-modal').style.display = 'block'; 
}

function previewReceipt(id) { 
const r = receipts.find(x => x.id === id); 
if (!r) return; 
const bal = getCustomerBalance(r.toName); 
const customer = customers.find(c => c.name.toLowerCase() === r.toName.toLowerCase()); 
const phone = r.toPhone || customer?.phone; 
const sourceDoc = r.linkedInvoiceNumber ? 'Invoice #' + r.linkedInvoiceNumber : (r.linkedQuotationNumber ? 'Quotation #' + r.linkedQuotationNumber : 'Direct Payment'); 
currentPreviewData = { type: 'receipt', data: r, phone }; 
document.getElementById('whatsapp-send-btn').style.display = phone ? 'inline-block' : 'none'; 
document.getElementById('preview-area').innerHTML = '<div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title" style="color:#10b981">RECEIPT</h1><p>#' + r.number + ' | ' + formatDate(r.date) + '</p></div></div><div class="info-grid"><div class="info-box"><h4>From:</h4><p><strong>' + (r.fromName || companySettings.name) + '</strong><br>' + (r.fromAddress || companySettings.address) + '</p>' + getCompanyContactHTML() + '</div><div class="info-box"><h4>Received From:</h4><p>' + r.toName + '<br>' + r.toAddress + (phone ? '<br>📱 ' + phone : '') + '</p></div></div><div class="invoice-dates-box"><p><strong>Source:</strong> ' + sourceDoc + '</p><p><strong>Payment Method:</strong> ' + (r.paymentMethod || 'Cash') + '</p></div><table class="doc-table"><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead><tbody>' + r.items.map(i => '<tr><td>' + i.description + '</td><td>' + i.quantity + '</td><td>R' + i.rate.toFixed(2) + '</td><td>R' + i.amount.toFixed(2) + '</td></tr>').join('') + '</tbody><tfoot><tr><td colspan="3" style="text-align:right">Total:</td><td>R' + r.total.toFixed(2) + '</td></tr><tr style="color:#10b981;font-size:1.1rem"><td colspan="3" style="text-align:right"><strong>Amount Paid:</strong></td><td><strong>R' + (r.amountPaid || r.total).toFixed(2) + '</strong></td></tr>' + (r.remainingBalance > 0 ? '<tr style="color:#dc2626"><td colspan="3" style="text-align:right"><strong>Balance:</strong></td><td><strong>R' + r.remainingBalance.toFixed(2) + '</strong></td></tr>' : '') + '</tfoot></table>' + (bal > 0 ? '<div style="background:#fef3c7;padding:15px;border-radius:8px;margin:15px 0;border:2px solid #f59e0b"><h4 style="color:#92400e">Total Outstanding: R' + bal.toFixed(2) + '</h4></div>' : '<div style="background:#d1fae5;padding:15px;border-radius:8px;margin:15px 0;border:2px solid #10b981;text-align:center"><h4 style="color:#065f46">All Paid - No Balance Due</h4></div>'); 
document.getElementById('preview-modal').style.display = 'block'; 
}

function previewPayslip(id) { 
const p = payslips.find(x => x.id === id); 
if (!p) return; 
currentPreviewData = { type: 'payslip', data: p, phone: null }; 
document.getElementById('whatsapp-send-btn').style.display = 'none'; 
document.getElementById('preview-area').innerHTML = '<div class="doc-header">' + (companySettings.logo ? '<img src="' + companySettings.logo + '" class="doc-logo">' : '<div></div>') + '<div class="doc-title-area"><h1 class="doc-title" style="color:#ec4899">PAYSLIP</h1><p>#' + p.number + ' | ' + formatDate(p.date) + '</p></div></div><div class="info-grid"><div class="info-box"><h4>Employer:</h4><p>' + p.fromName + '<br>' + p.fromAddress + '</p></div><div class="info-box"><h4>Employee:</h4><p><strong>' + p.employeeName + '</strong><br>ID: ' + (p.employeeId || 'N/A') + '<br>Position: ' + (p.position || 'N/A') + '</p></div></div><div class="earnings-deductions-grid"><div class="earnings-section"><h4>Earnings</h4><p>Basic: R' + p.earnings.basic.toFixed(2) + '</p><p>Overtime: R' + p.earnings.overtime.toFixed(2) + '</p><p>Bonus: R' + p.earnings.bonus.toFixed(2) + '</p><p>Allowances: R' + p.earnings.allowances.toFixed(2) + '</p><p><strong>Gross: R' + p.gross.toFixed(2) + '</strong></p></div><div class="deductions-section"><h4>Deductions</h4><p>Tax: R' + p.deductions.tax.toFixed(2) + '</p><p>UIF: R' + p.deductions.uif.toFixed(2) + '</p><p>Pension: R' + p.deductions.pension.toFixed(2) + '</p><p>Other: R' + p.deductions.other.toFixed(2) + '</p><p><strong>Total: R' + p.totalDeductions.toFixed(2) + '</strong></p></div></div><div style="text-align:center;padding:20px;background:#f0fdf4;border-radius:8px;margin-top:20px"><h2 style="color:#10b981">NET PAY: R' + p.netPay.toFixed(2) + '</h2></div>'; 
document.getElementById('preview-modal').style.display = 'block'; 
}

function closePreview() { 
document.getElementById('preview-modal').style.display = 'none'; 
currentPreviewData = null; 
}

function printDocument() { 
window.print(); 
}

// ========================================
// 21. DELETE FUNCTIONS
// ========================================
async function deleteInvoice(id) { 
if (receipts.some(r => r.linkedInvoiceId === id)) { 
showToast('Has receipts attached', 'warning'); 
return; 
} 
showDeletePopup('Delete this invoice?', async () => { 
invoices = invoices.filter(i => i.id !== id); 
await saveToIndexedDB('invoices', invoices);
renderAll(); 
updateDashboard(); 
showToast('Deleted'); 
}); 
}

async function deleteQuotation(id) { 
if (receipts.some(r => r.linkedQuotationId === id)) { 
showToast('Has receipts attached', 'warning'); 
return; 
} 
showDeletePopup('Delete this quotation?', async () => { 
quotations = quotations.filter(q => q.id !== id); 
await saveToIndexedDB('quotations', quotations);
renderAll(); 
updateDashboard(); 
showToast('Deleted'); 
}); 
}

async function deleteReceipt(id) { 
showDeletePopup('Delete this receipt?', async () => { 
receipts = receipts.filter(r => r.id !== id); 
await saveToIndexedDB('receipts', receipts);
renderAll(); 
updateDashboard(); 
showToast('Deleted'); 
}); 
}

async function deletePayslip(id) { 
showDeletePopup('Delete this payslip?', async () => { 
payslips = payslips.filter(p => p.id !== id); 
await saveToIndexedDB('payslips', payslips);
renderAll(); 
updateDashboard(); 
showToast('Deleted'); 
}); 
}

// ========================================
// 22. FORM SUBMIT HANDLERS
// ========================================
document.getElementById('invoiceForm').addEventListener('submit', async function(e) { 
e.preventDefault(); 
const items = getItemsFromContainer('invoice-items'); 
const total = items.reduce((s, i) => s + i.amount, 0); 
const name = document.getElementById('inv-to-name').value; 
const phone = document.getElementById('inv-to-phone').value; 
const num = document.getElementById('inv-number').value; 

await saveInvoiceFormData();

invoices.unshift({ 
id: Date.now(), 
number: num, 
date: document.getElementById('inv-date').value, 
dueDate: document.getElementById('inv-due-date').value, 
fromName: companySettings.name || 'Your Company', 
fromAddress: companySettings.address || '', 
fromEmail: companySettings.email || '', 
fromPhone: companySettings.phone || '', 
toName: name, 
toPhone: phone, 
toAddress: document.getElementById('inv-to-address').value, 
items, 
total, 
bankAccounts: [...bankAccounts], 
notes: document.getElementById('inv-notes').value 
}); 
await saveToIndexedDB('invoices', invoices);
await saveCustomer(name, phone, document.getElementById('inv-to-address').value); 
showToast('Invoice created!'); 

document.getElementById('inv-to-name').value = '';
document.getElementById('inv-to-phone').value = '';
document.getElementById('inv-to-address').value = '';
document.getElementById('inv-date').valueAsDate = new Date(); 
document.getElementById('inv-due-date').value = getEndOfMonth(new Date().toISOString().split('T')[0]); 
document.getElementById('customer-invoice-info').style.display = 'none'; 
document.getElementById('customer-pending-summary').style.display = 'none'; 
document.getElementById('inv-number').value = getNextGlobalInvoiceNumber(); 

await loadSavedInvoiceFormData();

renderAll(); 
updateDashboard(); 
});

document.getElementById('quotationForm').addEventListener('submit', async function(e) { 
e.preventDefault(); 
const items = getItemsFromContainer('quotation-items'); 
const total = items.reduce((s, i) => s + i.amount, 0); 
const name = document.getElementById('quo-to-name').value; 
const phone = document.getElementById('quo-to-phone').value; 
quotations.unshift({ 
id: Date.now(), 
number: document.getElementById('quo-number').value, 
date: document.getElementById('quo-date').value, 
validUntil: document.getElementById('quo-valid-until').value, 
fromName: companySettings.name || 'Your Company', 
fromAddress: companySettings.address || '', 
fromEmail: companySettings.email || '', 
fromPhone: companySettings.phone || '', 
toName: name, 
toPhone: phone, 
toAddress: document.getElementById('quo-to-address').value, 
items, 
total, 
terms: document.getElementById('quo-terms').value 
}); 
await saveToIndexedDB('quotations', quotations);
await saveCustomer(name, phone, document.getElementById('quo-to-address').value); 
showToast('Quotation created!'); 
document.getElementById('quotationForm').reset(); 
document.getElementById('quo-date').valueAsDate = new Date(); 
document.getElementById('quo-number').value = getNextGlobalQuotationNumber();
document.getElementById('quotation-items').innerHTML = ''; 
addQuotationItem(); 
renderAll(); 
updateDashboard(); 
});

document.getElementById('receiptForm').addEventListener('submit', async function(e) { 
e.preventDefault(); 
let sourceDoc = null, isInvoice = false, isQuotation = false; 
if (currentInvoiceForReceipt) { 
sourceDoc = currentInvoiceForReceipt; 
isInvoice = true; 
const status = getInvoicePaymentStatus(currentInvoiceForReceipt.id); 
const paying = parseFloat(document.getElementById('rec-amount-paying').value) || 0; 
if (paying <= 0 || paying > status.balance + 0.01) { 
showToast('Invalid amount', 'warning'); 
return; 
} 
} else if (currentQuotationForReceipt) { 
sourceDoc = currentQuotationForReceipt; 
isQuotation = true; 
const status = getQuotationPaymentStatus(currentQuotationForReceipt.id); 
const paying = parseFloat(document.getElementById('rec-amount-paying').value) || 0; 
if (paying <= 0 || paying > status.balance + 0.01) { 
showToast('Invalid amount', 'warning'); 
return; 
} 
} else { 
showToast('Select an invoice or quotation', 'warning'); 
return; 
} 
const paying = parseFloat(document.getElementById('rec-amount-paying').value) || 0; 
const status = isInvoice ? getInvoicePaymentStatus(sourceDoc.id) : getQuotationPaymentStatus(sourceDoc.id); 
const remaining = status.balance - paying; 
const receiptData = { 
id: Date.now(), 
number: document.getElementById('rec-number').value, 
date: document.getElementById('rec-date').value, 
paymentMethod: document.getElementById('rec-payment-method').value, 
fromName: companySettings.name || 'Your Company', 
fromAddress: companySettings.address || '', 
fromEmail: companySettings.email || '', 
fromPhone: companySettings.phone || '', 
toName: sourceDoc.toName, 
toPhone: sourceDoc.toPhone, 
toAddress: sourceDoc.toAddress || '', 
items: sourceDoc.items, 
total: sourceDoc.total, 
amountPaid: paying, 
remainingBalance: remaining > 0.01 ? remaining : 0, 
notes: document.getElementById('rec-notes').value, 
isPartialPayment: remaining > 0.01 
}; 
if (isInvoice) { 
receiptData.linkedInvoiceId = sourceDoc.id; 
receiptData.linkedInvoiceNumber = sourceDoc.number; 
receiptData.linkedInvoiceDate = sourceDoc.date; 
receiptData.linkedInvoiceDueDate = sourceDoc.dueDate; 
} else { 
receiptData.linkedQuotationId = sourceDoc.id; 
receiptData.linkedQuotationNumber = sourceDoc.number; 
receiptData.linkedQuotationDate = sourceDoc.date; 
} 
receipts.unshift(receiptData); 
await saveToIndexedDB('receipts', receipts);
showToast(remaining <= 0.01 ? 'Fully paid!' : 'Receipt created!'); 
document.getElementById('receiptForm').reset(); 
document.getElementById('rec-date').valueAsDate = new Date(); 
document.getElementById('rec-to-name').value = ''; 
document.getElementById('rec-number').value = ''; 
document.getElementById('receipt-items').innerHTML = '<p style="color:#666;text-align:center">Select an invoice or quotation</p>'; 
document.getElementById('payment-amount-section').style.display = 'none'; 
document.getElementById('invoice-dates-display').style.display = 'none'; 
document.getElementById('generate-receipt-btn').disabled = true; 
document.getElementById('selected-customer-display').style.display = 'none'; 
document.getElementById('filtered-invoice-container').innerHTML = ''; 
currentInvoiceForReceipt = null; 
currentQuotationForReceipt = null; 
renderAll(); 
updateDashboard(); 
});

document.getElementById('payslipForm').addEventListener('submit', async function(e) { 
e.preventDefault(); 
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
payslips.unshift({ 
id: Date.now(), 
number: document.getElementById('pay-number').value, 
date: document.getElementById('pay-date').value, 
period: document.getElementById('pay-period').value, 
employeeName: document.getElementById('pay-employee-name').value, 
employeeId: document.getElementById('pay-employee-id').value, 
position: document.getElementById('pay-position').value, 
earnings: { basic, overtime, bonus, allowances }, 
deductions: { tax, uif, pension, other }, 
gross, 
totalDeductions: totalDed, 
netPay: gross - totalDed, 
fromName: companySettings.name || 'Your Company', 
fromAddress: companySettings.address || '' 
}); 
await saveToIndexedDB('payslips', payslips);
showToast('Payslip created!'); 
document.getElementById('payslipForm').reset(); 
document.getElementById('pay-date').valueAsDate = new Date(); 
['pay-gross', 'pay-total-deductions', 'pay-net'].forEach(id => document.getElementById(id).value = ''); 
renderAll(); 
updateDashboard(); 
});
