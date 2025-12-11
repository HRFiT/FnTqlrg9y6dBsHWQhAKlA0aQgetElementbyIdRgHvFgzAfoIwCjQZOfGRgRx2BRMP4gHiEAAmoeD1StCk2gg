// ========================================
// GLOBAL VARIABLES & CONFIGURATION
// ========================================
let invoices = [];
let quotations = [];
let receipts = [];
let payslips = [];
let customers = [];
let bankAccounts = [];
let companySettings = { name: '', address: '', email: '', phone: '', whatsapp: '', website: '', registration: '', logo: null };
let currentInvoiceForReceipt = null;
let currentQuotationForReceipt = null;
let currentPreviewData = null;
let mainChart = null;
let pendingDeleteCallback = null;
let db = null;
let selectedDocumentType = 'invoice';
let currentFilterType = '';
let currentFilterAction = '';
let savedFromDate = '';
let savedToDate = '';

// ========================================
// TABLE VIEW / FORM VIEW TOGGLE FUNCTIONS
// ========================================
function showInvoiceForm() {
document.getElementById('invoice-table-view').style.display = 'none';
document.getElementById('invoice-form-view').style.display = 'block';
document.getElementById('inv-number').value = getNextGlobalInvoiceNumber();
}

function hideInvoiceForm() {
document.getElementById('invoice-table-view').style.display = 'block';
document.getElementById('invoice-form-view').style.display = 'none';
document.getElementById('invoiceForm').reset();
document.getElementById('inv-date').valueAsDate = new Date();
document.getElementById('inv-due-date').value = getEndOfMonth(new Date().toISOString().split('T')[0]);
document.getElementById('customer-invoice-info').style.display = 'none';
document.getElementById('customer-pending-summary').style.display = 'none';
}

function showQuotationForm() {
document.getElementById('quotation-table-view').style.display = 'none';
document.getElementById('quotation-form-view').style.display = 'block';
document.getElementById('quo-number').value = getNextGlobalQuotationNumber();
}

function hideQuotationForm() {
document.getElementById('quotation-table-view').style.display = 'block';
document.getElementById('quotation-form-view').style.display = 'none';
document.getElementById('quotationForm').reset();
document.getElementById('quo-date').valueAsDate = new Date();
document.getElementById('quotation-items').innerHTML = '';
addQuotationItem();
}

function showReceiptForm() {
document.getElementById('receipt-table-view').style.display = 'none';
document.getElementById('receipt-form-view').style.display = 'block';
}

function hideReceiptForm() {
document.getElementById('receipt-table-view').style.display = 'block';
document.getElementById('receipt-form-view').style.display = 'none';
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
}

function showPayslipForm() {
document.getElementById('payslip-table-view').style.display = 'none';
document.getElementById('payslip-form-view').style.display = 'block';
}

function hidePayslipForm() {
document.getElementById('payslip-table-view').style.display = 'block';
document.getElementById('payslip-form-view').style.display = 'none';
document.getElementById('payslipForm').reset();
document.getElementById('pay-date').valueAsDate = new Date();
['pay-gross', 'pay-total-deductions', 'pay-net'].forEach(id => document.getElementById(id).value = '');
}

function showCustomerForm() {
document.getElementById('customer-table-view').style.display = 'none';
document.getElementById('customer-form-view').style.display = 'block';
}

function hideCustomerForm() {
document.getElementById('customer-table-view').style.display = 'block';
document.getElementById('customer-form-view').style.display = 'none';
document.getElementById('new-customer-name').value = '';
document.getElementById('new-customer-phone').value = '';
document.getElementById('new-customer-address').value = '';
}