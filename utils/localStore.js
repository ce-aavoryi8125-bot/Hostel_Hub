const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, '..', 'data', 'fallback_db.json');
const isProduction = process.env.NODE_ENV === 'production';

function allowFallback() {
  return !isProduction;
}

function getStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      return JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    }
  } catch (e) {
    console.warn('Fallback DB read warning:', e.message);
  }
  return {
    payments: [],
    bookings: [],
    payment_submissions: [],
    receipts: [],
    notifications: [],
    hostel_payment_methods: [
      {
        id: 'pm-momo-default',
        hostel_id: '0d5818fc-905f-4235-a7ed-c6dfc7db0aaa',
        payment_type: 'Mobile Money',
        account_name: 'Hostel Manager MoMo',
        account_number: '0241112222',
        bank_name: 'MTN Mobile Money',
        instructions: 'Send MoMo to 0241112222 with Reference: Rent Payment',
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'pm-bank-default',
        hostel_id: '0d5818fc-905f-4235-a7ed-c6dfc7db0aaa',
        payment_type: 'Bank Transfer',
        account_name: 'Hostel Manager Ventures',
        account_number: '1029384756',
        bank_name: 'GCB Bank Tarkwa',
        instructions: 'Deposit at GCB Tarkwa Branch or transfer to Account 1029384756',
        is_active: true,
        created_at: new Date().toISOString()
      }
    ]
  };
}

function updateStore(updater) {
  if (!allowFallback()) {
    console.warn('⚠️ localStore update blocked in PRODUCTION mode');
    return getStore();
  }
  const store = getStore();
  const updated = updater(store);
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated || store, null, 2), 'utf8');
  } catch (e) {
    console.warn('Fallback DB write warning:', e.message);
  }
  return updated || store;
}

module.exports = { getStore, updateStore, allowFallback, isProduction };
