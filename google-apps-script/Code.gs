/**
 * Tota Cake House — Order Management System
 * Google Apps Script Web App
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 */

var SHEET_NAME = 'Orders';
var INVESTMENT_SHEET_NAME = 'Investment';
var PROFIT_BANK_SHEET_NAME = 'ProfitBank';

var HEADERS = [
  'Order ID', 'Order Date', 'Customer Name', 'Phone', 'Area',
  'Cake Category', 'Occasion', 'Flavour', 'Size', 'Tiers',
  'Cake Message', 'Design Notes', 'Delivery Date', 'Delivery Time',
  'Delivery Type', 'Delivery Address', 'Total Price', 'Advance Paid',
  'Balance Due', 'Payment Mode', 'Status', 'Referral Source', 'Notes', 'Saved At',
  'Cake Photo'
];

var INVESTMENT_HEADERS = ['ID', 'Date', 'Material Name', 'Unit', 'Price Per Unit', 'Quantity'];
var PROFIT_BANK_HEADERS = ['ID', 'Date', 'Amount', 'Type', 'Mode', 'Note'];

var FIELD_MAP = {
  'Order ID': 'orderId',
  'Order Date': 'orderDate',
  'Customer Name': 'customerName',
  'Phone': 'phone',
  'Area': 'area',
  'Cake Category': 'cakeCategory',
  'Occasion': 'occasion',
  'Flavour': 'flavour',
  'Size': 'size',
  'Tiers': 'tiers',
  'Cake Message': 'cakeMessage',
  'Design Notes': 'designNotes',
  'Delivery Date': 'deliveryDate',
  'Delivery Time': 'deliveryTime',
  'Delivery Type': 'deliveryType',
  'Delivery Address': 'deliveryAddress',
  'Total Price': 'totalPrice',
  'Advance Paid': 'advancePaid',
  'Balance Due': 'balanceDue',
  'Payment Mode': 'paymentMode',
  'Status': 'status',
  'Referral Source': 'referralSource',
  'Notes': 'notes',
  'Saved At': 'savedAt',
  'Cake Photo': 'cakePhoto',
  'Area / Locality': 'area',
  'Total Price (₹)': 'totalPrice',
  'Advance Paid (₹)': 'advancePaid',
  'Balance Due (₹)': 'balanceDue',
  'Order Status': 'status',
  'Category': 'cakeCategory',
  'Cake Type': 'cakeCategory',
  'Flavor': 'flavour',
};

// ─── POST Handler ────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;

    if (action === 'addOrder')               return addOrder(body.data);
    if (action === 'updateStatus')           return updateStatus(body.orderId, body.status);
    if (action === 'updateOrder')            return updateOrder(body.data);
    if (action === 'addInvestmentEntry')     return addInvestmentEntry(body.data);
    if (action === 'deleteInvestmentEntry')  return deleteInvestmentEntry(body.id);
    if (action === 'addProfitBankEntry')     return addProfitBankEntry(body.data);
    if (action === 'deleteProfitBankEntry')  return deleteProfitBankEntry(body.id);

    return respond({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var action = e.parameter.action;

    if (action === 'getOrders')              return getOrders();
    if (action === 'getInvestmentEntries')   return getInvestmentEntries();
    if (action === 'getProfitBankEntries')   return getProfitBankEntries();

    return respond({ success: true, message: 'Tota Cake House API is running' });
  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

function addOrder(data) {
  var sheet = getOrCreateSheet();
  sheet.appendRow([
    data.orderId       || '',
    data.orderDate     || '',
    data.customerName  || '',
    data.phone         || '',
    data.area          || '',
    data.cakeCategory  || '',
    data.occasion      || '',
    data.flavour       || '',
    data.size          || '',
    data.tiers         || '',
    data.cakeMessage   || '',
    data.designNotes   || '',
    data.deliveryDate  || '',
    data.deliveryTime  || '',
    data.deliveryType  || '',
    data.deliveryAddress || '',
    Number(data.totalPrice)   || 0,
    Number(data.advancePaid)  || 0,
    Number(data.balanceDue)   || 0,
    data.paymentMode   || '',
    data.status        || 'Pending',
    data.referralSource || '',
    data.notes         || '',
    data.savedAt       || new Date().toISOString(),
    data.cakePhoto     || ''
  ]);
  return respond({ success: true, orderId: data.orderId });
}

var FIELD_MAP_NORMALIZED = (function () {
  var map = {};
  for (var k in FIELD_MAP) { map[k.trim().toLowerCase()] = FIELD_MAP[k]; }
  return map;
})();

var FIELD_MAP_BY_POSITION = (function () {
  var map = {};
  for (var i = 0; i < HEADERS.length; i++) { map[i] = FIELD_MAP[HEADERS[i]]; }
  return map;
})();

function resolveKey(header, colIndex) {
  if (FIELD_MAP[header]) return FIELD_MAP[header];
  var norm = String(header || '').trim().toLowerCase();
  if (FIELD_MAP_NORMALIZED[norm]) return FIELD_MAP_NORMALIZED[norm];
  if (FIELD_MAP_BY_POSITION[colIndex]) return FIELD_MAP_BY_POSITION[colIndex];
  return null;
}

function getOrders() {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return respond({ success: true, data: [] });

  var headers = data[0];
  var orders = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var hasAnyValue = false;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== '' && row[c] !== null && row[c] !== undefined) { hasAnyValue = true; break; }
    }
    if (!hasAnyValue) continue;

    var order = {};
    for (var j = 0; j < headers.length; j++) {
      var key = resolveKey(headers[j], j);
      if (!key) continue;
      var val = row[j];
      if (key === 'totalPrice' || key === 'advancePaid' || key === 'balanceDue') {
        order[key] = Number(val) || 0;
        continue;
      }
      if (val instanceof Date || (val && Object.prototype.toString.call(val) === '[object Date]')) {
        var y = val.getFullYear();
        var m = String(val.getMonth() + 1).padStart(2, '0');
        var d = String(val.getDate()).padStart(2, '0');
        order[key] = y + '-' + m + '-' + d;
        continue;
      }
      order[key] = val !== null && val !== undefined ? String(val) : '';
    }
    for (var fk in FIELD_MAP) {
      var fv = FIELD_MAP[fk];
      if (order[fv] === undefined) {
        order[fv] = (fv === 'totalPrice' || fv === 'advancePaid' || fv === 'balanceDue') ? 0 : '';
      }
    }
    orders.push(order);
  }

  return respond({ success: true, data: orders });
}

function updateStatus(orderId, status) {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();
  var orderIdCol = -1, statusCol = -1;
  for (var j = 0; j < data[0].length; j++) {
    var key = resolveKey(data[0][j], j);
    if (key === 'orderId') orderIdCol = j;
    if (key === 'status') statusCol = j;
  }
  if (orderIdCol === -1 || statusCol === -1)
    return respond({ success: false, error: 'Required columns not found' });
  for (var i = 1; i < data.length; i++) {
    if (data[i][orderIdCol] === orderId) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: 'Order not found: ' + orderId });
}

function updateOrder(data) {
  var sheet = getOrCreateSheet();
  var sheetData = sheet.getDataRange().getValues();
  var orderIdCol = -1;
  for (var j = 0; j < sheetData[0].length; j++) {
    if (resolveKey(sheetData[0][j], j) === 'orderId') { orderIdCol = j; break; }
  }
  if (orderIdCol === -1) return respond({ success: false, error: 'Order ID column not found' });
  for (var i = 1; i < sheetData.length; i++) {
    if (String(sheetData[i][orderIdCol]) === String(data.orderId)) {
      sheet.getRange(i + 1, 1, 1, HEADERS.length).setValues([[
        data.orderId || '', data.orderDate || '', data.customerName || '',
        data.phone || '', data.area || '', data.cakeCategory || '',
        data.occasion || '', data.flavour || '', data.size || '',
        data.tiers || '', data.cakeMessage || '', data.designNotes || '',
        data.deliveryDate || '', data.deliveryTime || '', data.deliveryType || '',
        data.deliveryAddress || '', Number(data.totalPrice) || 0,
        Number(data.advancePaid) || 0, Number(data.balanceDue) || 0,
        data.paymentMode || '', data.status || 'Pending',
        data.referralSource || '', data.notes || '', data.savedAt || '',
        data.cakePhoto || ''
      ]]);
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: 'Order not found: ' + data.orderId });
}

// ─── Investment Entries ───────────────────────────────────────────────────────

function addInvestmentEntry(data) {
  var sheet = getOrCreateInvestmentSheet();
  sheet.appendRow([
    data.id            || '',
    data.date          || '',
    data.materialName  || '',
    data.unit          || '',
    Number(data.pricePerUnit) || 0,
    Number(data.quantity)     || 0
  ]);
  return respond({ success: true, id: data.id });
}

function deleteInvestmentEntry(id) {
  var sheet = getOrCreateInvestmentSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: 'Entry not found: ' + id });
}

function getInvestmentEntries() {
  var sheet = getOrCreateInvestmentSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return respond({ success: true, data: [] });

  var entries = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    entries.push({
      id:           String(row[0]),
      date:         String(row[1]),
      materialName: String(row[2]),
      unit:         String(row[3]),
      pricePerUnit: Number(row[4]) || 0,
      quantity:     Number(row[5]) || 0
    });
  }
  return respond({ success: true, data: entries });
}

// ─── Profit Bank Entries ─────────────────────────────────────────────────────

function addProfitBankEntry(data) {
  var sheet = getOrCreateProfitBankSheet();
  sheet.appendRow([
    data.id     || '',
    data.date   || '',
    Number(data.amount) || 0,
    data.type   || '',
    data.mode   || '',
    data.note   || ''
  ]);
  return respond({ success: true, id: data.id });
}

function deleteProfitBankEntry(id) {
  var sheet = getOrCreateProfitBankSheet();
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return respond({ success: true });
    }
  }
  return respond({ success: false, error: 'Entry not found: ' + id });
}

function getProfitBankEntries() {
  var sheet = getOrCreateProfitBankSheet();
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return respond({ success: true, data: [] });

  var entries = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0]) continue;
    entries.push({
      id:     String(row[0]),
      date:   String(row[1]),
      amount: Number(row[2]) || 0,
      type:   String(row[3]),
      mode:   String(row[4]),
      note:   String(row[5])
    });
  }
  return respond({ success: true, data: entries });
}

// ─── Manual init (run this once from the Apps Script editor) ─────────────────

function initAllSheets() {
  getOrCreateSheet();
  getOrCreateInvestmentSheet();
  getOrCreateProfitBankSheet();
  Logger.log('All sheets initialised successfully.');
}

// ─── Sheet helpers ────────────────────────────────────────────────────────────

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    var r = sheet.getRange(1, 1, 1, HEADERS.length);
    r.setBackground('#534AB7');
    r.setFontColor('#FFFFFF');
    r.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateInvestmentSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(INVESTMENT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(INVESTMENT_SHEET_NAME);
    sheet.appendRow(INVESTMENT_HEADERS);
    var r = sheet.getRange(1, 1, 1, INVESTMENT_HEADERS.length);
    r.setBackground('#2C6E49');
    r.setFontColor('#FFFFFF');
    r.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getOrCreateProfitBankSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PROFIT_BANK_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PROFIT_BANK_SHEET_NAME);
    sheet.appendRow(PROFIT_BANK_HEADERS);
    var r = sheet.getRange(1, 1, 1, PROFIT_BANK_HEADERS.length);
    r.setBackground('#1B4F72');
    r.setFontColor('#FFFFFF');
    r.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
