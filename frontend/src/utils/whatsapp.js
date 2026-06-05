import toast from 'react-hot-toast';

const defaultCountry = process.env.REACT_APP_DEFAULT_COUNTRY_CODE || '+91';

function cleanPhone(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  // remove non-digits
  s = s.replace(/[^0-9]/g, '');
  if (s.length === 10) {
    // assume local number without country
    return (defaultCountry.replace(/[^0-9]/g, '') + s);
  }
  // if starts with country without plus
  if (s.length > 10) return s;
  return null;
}

function formatDate(d) {
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch (e) {
    return String(d || '');
  }
}

export function sendWhatsAppReminder(customer = {}, type = 'dueToday') {
  const phone = cleanPhone(customer.phone || customer.phoneNumber || customer.mobile);
  if (!phone) {
    toast.error('Customer has no valid phone number');
    return false;
  }

  const name = customer.name || customer.customerName || 'Customer';
  const next = customer.nextPayment || {};
  const emi = next.emiAmount || customer.emiAmount || 0;
  const dueDate = next.dueDate || customer.dueDate;
  const remaining = (customer.remainingBalance ?? (customer.totalDue - customer.totalCollected)) || 0;
  const overdueDays = customer.overdueDays || (next.dueDate ? Math.floor((Date.now() - new Date(next.dueDate)) / (1000 * 60 * 60 * 24)) : 0);

  let message = '';
  if (type === 'overdue') {
    message = `Dear ${name},\nYour EMI payment of ₹${emi} due on ${formatDate(dueDate)} is overdue.\nPending Amount: ₹${remaining}\nPlease make payment as soon as possible.`;
  } else if (type === 'partial') {
    message = `Dear ${name},\nYou still have ₹${remaining} pending from this week's EMI.\nPlease complete the payment soon.`;
  } else {
    // dueToday
    message = `Dear ${name},\nYour EMI payment of ₹${emi} is due today.\nPlease make payment on time.`;
  }

  const encoded = encodeURIComponent(message);
  const waLink = `https://wa.me/${phone}?text=${encoded}`;

  try {
    window.open(waLink, '_blank');
    return true;
  } catch (e) {
    toast.error('Failed to open WhatsApp');
    return false;
  }
}

export default { sendWhatsAppReminder };