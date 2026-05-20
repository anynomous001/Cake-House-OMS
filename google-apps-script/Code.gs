/**
 * Tota Cake House — Order Management System
 * Google Apps Script Web App
 *
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 */

var SHEET_NAME = 'Orders';

var HEADERS = [
  'Order ID', 'Order Date', 'Customer Name', 'Phone', 'Area',
  'Cake Category', 'Occasion', 'Flavour', 'Size', 'Tiers',
  'Cake Message', 'Design Notes', 'Delivery Date', 'Delivery Time',
  'Delivery Type', 'Delivery Address', 'Total Price', 'Advance Paid',
  'Balance Due', 'Payment Mode', 'Status', 'Referral Source', 'Notes', 'Saved At'
];

var FIELD_MAP = {
  // Standard names (created by getOrCreateSheet)
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
  // Aliases — handles sheets with ₹ suffix, alternate naming, etc.
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

    if (action === 'addOrder') {
      return addOrder(body.data);
    }

    if (action === 'updateStatus') {
      return updateStatus(body.orderId, body.status);
    }

    if (action === 'updateOrder') {
      return updateOrder(body.data);
    }

    return respond({ success: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

// ─── GET Handler ─────────────────────────────────────────────────────────────

function doGet(e) {
  try {
    var action = e.parameter.action;

    if (action === 'getOrders') {
      return getOrders();
    }

    // Health check / ping
    return respond({ success: true, message: 'Tota Cake House API is running' });
  } catch (err) {
    return respond({ success: false, error: err.toString() });
  }
}

// ─── addOrder ────────────────────────────────────────────────────────────────

function addOrder(data) {
  var sheet = getOrCreateSheet();

  var row = [
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
    data.savedAt       || new Date().toISOString()
  ];

  sheet.appendRow(row);

  return respond({ success: true, orderId: data.orderId });
}

// ─── getOrders ───────────────────────────────────────────────────────────────

// Build a normalised (lowercase + trimmed) lookup for flexible header matching
var FIELD_MAP_NORMALIZED = (function () {
  var map = {};
  for (var k in FIELD_MAP) {
    map[k.trim().toLowerCase()] = FIELD_MAP[k];
  }
  return map;
})();

// Positional fallback: maps column index → field key based on HEADERS order
var FIELD_MAP_BY_POSITION = (function () {
  var map = {};
  for (var i = 0; i < HEADERS.length; i++) {
    map[i] = FIELD_MAP[HEADERS[i]];
  }
  return map;
})();

function resolveKey(header, colIndex) {
  // 1. Exact match
  if (FIELD_MAP[header]) return FIELD_MAP[header];
  // 2. Normalised match (case-insensitive, trimmed)
  var norm = String(header || '').trim().toLowerCase();
  if (FIELD_MAP_NORMALIZED[norm]) return FIELD_MAP_NORMALIZED[norm];
  // 3. Positional fallback (same column order, different header text)
  if (FIELD_MAP_BY_POSITION[colIndex]) return FIELD_MAP_BY_POSITION[colIndex];
  return null;
}

function getOrders() {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return respond({ success: true, data: [] });
  }

  var headers = data[0];
  var orders = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // Skip truly blank rows (all cells empty)
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

      // Numeric fields
      if (key === 'totalPrice' || key === 'advancePaid' || key === 'balanceDue') {
        order[key] = Number(val) || 0;
        continue;
      }

      // Date objects from sheet → YYYY-MM-DD string
      if (val instanceof Date) {
        var y = val.getFullYear();
        var m = String(val.getMonth() + 1).padStart(2, '0');
        var d = String(val.getDate()).padStart(2, '0');
        order[key] = y + '-' + m + '-' + d;
        continue;
      }

      order[key] = val !== null && val !== undefined ? String(val) : '';
    }

    // Ensure every expected field exists (prevents undefined in the app)
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

// ─── updateStatus ────────────────────────────────────────────────────────────

function updateStatus(orderId, status) {
  var sheet = getOrCreateSheet();
  var data = sheet.getDataRange().getValues();

  var orderIdCol = -1;
  var statusCol = -1;

  for (var j = 0; j < data[0].length; j++) {
    var key = resolveKey(data[0][j], j);
    if (key === 'orderId') orderIdCol = j;
    if (key === 'status') statusCol = j;
  }

  if (orderIdCol === -1 || statusCol === -1) {
    return respond({ success: false, error: 'Required columns not found in sheet' });
  }

  for (var i = 1; i < data.length; i++) {
    if (data[i][orderIdCol] === orderId) {
      sheet.getRange(i + 1, statusCol + 1).setValue(status);
      return respond({ success: true, orderId: orderId, status: status });
    }
  }

  return respond({ success: false, error: 'Order not found: ' + orderId });
}

// ─── updateOrder ─────────────────────────────────────────────────────────────

function updateOrder(data) {
  var sheet = getOrCreateSheet();
  var sheetData = sheet.getDataRange().getValues();

  var orderIdCol = -1;
  for (var j = 0; j < sheetData[0].length; j++) {
    if (resolveKey(sheetData[0][j], j) === 'orderId') { orderIdCol = j; break; }
  }

  if (orderIdCol === -1) {
    return respond({ success: false, error: 'Order ID column not found' });
  }

  for (var i = 1; i < sheetData.length; i++) {
    if (String(sheetData[i][orderIdCol]) === String(data.orderId)) {
      var row = [
        data.orderId        || '',
        data.orderDate      || '',
        data.customerName   || '',
        data.phone          || '',
        data.area           || '',
        data.cakeCategory   || '',
        data.occasion       || '',
        data.flavour        || '',
        data.size           || '',
        data.tiers          || '',
        data.cakeMessage    || '',
        data.designNotes    || '',
        data.deliveryDate   || '',
        data.deliveryTime   || '',
        data.deliveryType   || '',
        data.deliveryAddress || '',
        Number(data.totalPrice)  || 0,
        Number(data.advancePaid) || 0,
        Number(data.balanceDue)  || 0,
        data.paymentMode    || '',
        data.status         || 'Pending',
        data.referralSource || '',
        data.notes          || '',
        data.savedAt        || ''
      ];
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return respond({ success: true, orderId: data.orderId });
    }
  }

  return respond({ success: false, error: 'Order not found: ' + data.orderId });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOrCreateSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);

    // Style the header row
    var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
    headerRange.setBackground('#534AB7');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
