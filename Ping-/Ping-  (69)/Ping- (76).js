// ========================================
// 23. INITIALIZATION & EVENT LISTENERS
// ========================================
async function init() {
await initDB();
await loadAllData();

document.getElementById('inv-date').valueAsDate = new Date(); 
document.getElementById('inv-due-date').value = getEndOfMonth(new Date().toISOString().split('T')[0]); 
document.getElementById('quo-date').valueAsDate = new Date(); 
document.getElementById('rec-date').valueAsDate = new Date(); 
document.getElementById('pay-date').valueAsDate = new Date(); 
document.getElementById('inv-number').value = getNextGlobalInvoiceNumber();
document.getElementById('quo-number').value = getNextGlobalQuotationNumber();
setCurrentMonthFilter(); 
loadCompanySettings(); 
renderBankAccounts(); 
renderInvoiceBankPreview(); 

const savedDataLoaded = await loadSavedInvoiceFormData();
if (!savedDataLoaded) {
addInvoiceItem(); 
}

addQuotationItem(); 
updatePendingInvoiceDropdown(); 
updatePendingQuotationDropdown(); 
renderAll(); 
updateDashboard(); 
}

document.getElementById('logo-upload-input').addEventListener('change', async function(e) { 
const file = e.target.files[0]; 
if (file) { 
const reader = new FileReader(); 
reader.onload = async function(ev) { 
companySettings.logo = ev.target.result; 
await saveToIndexedDB('settings', { key: 'companySettings', value: companySettings });
document.getElementById('logo-preview-content').innerHTML = '<img src="' + companySettings.logo + '" alt="Logo">'; 
}; 
reader.readAsDataURL(file); 
} 
});

document.addEventListener('click', function(e) { 
if (!e.target.closest('.form-group')) { 
document.querySelectorAll('.suggestions').forEach(function(s) { 
s.style.display = 'none'; 
}); 
} 
});

document.getElementById('customer-search-overlay').addEventListener('click', function(e) { 
if (e.target === this) { 
closeCustomerSearchModal(); 
} 
});

window.addEventListener('load', async function() { 
document.getElementById('app-container').style.display = 'flex'; 
await init();
initOCREventListeners();
});