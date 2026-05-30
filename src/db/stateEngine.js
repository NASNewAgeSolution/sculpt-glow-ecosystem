// Database simulation engine for Sculpt & Glow.
// Synchs state between Client Website, Smartphone App, and Owner Dashboard in real-time.

import {
  initialUsers,
  initialClients,
  initialServices,
  initialMachines,
  initialInventory,
  initialAppointments,
  initialInvoices,
  initialQuotes,
  initialExpenses,
  initialStaffShifts,
  initialAuditLogs,
  initialSettings,
  initialProducts
} from './initialData';

const initTable = (key, defaultData) => {
  if (!localStorage.getItem(`salon_${key}`)) {
    localStorage.setItem(`salon_${key}`, JSON.stringify(defaultData));
  }
};

export const initializeDatabase = () => {
  initTable('users', initialUsers);
  initTable('clients', initialClients);
  initTable('services', initialServices);
  initTable('machines', initialMachines);
  initTable('inventory', initialInventory);
  initTable('appointments', initialAppointments);
  initTable('invoices', initialInvoices);
  initTable('quotes', initialQuotes);
  initTable('expenses', initialExpenses);
  initTable('staffShifts', initialStaffShifts);
  initTable('auditLogs', initialAuditLogs);
  initTable('settings', initialSettings);
  initTable('products', initialProducts);
  initTable('waitlist', []);
};

// Read / Write Utilities
export const getTable = (tableName) => {
  initializeDatabase();
  const data = localStorage.getItem(`salon_${tableName}`);
  return data ? JSON.parse(data) : [];
};

export const saveTable = (tableName, data) => {
  localStorage.setItem(`salon_${tableName}`, JSON.stringify(data));
  // Fire window sync event for immediate re-rendering
  window.dispatchEvent(new Event('salon_db_sync'));
};

// Auditing Engine
export const logAction = (username, action, details, prevValue = '', newValue = '') => {
  const logs = getTable('auditLogs');
  const newLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    username: username || 'System',
    timestamp: new Date().toISOString(),
    action,
    details,
    prevValue: typeof prevValue === 'object' ? JSON.stringify(prevValue) : String(prevValue),
    newValue: typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)
  };
  logs.unshift(newLog);
  saveTable('auditLogs', logs);
  
  // Fire popup Toast triggers
  window.dispatchEvent(new CustomEvent('salon_notification', { 
    detail: { title: action, message: details, type: action.toLowerCase().includes('alert') || action.toLowerCase().includes('suspend') ? 'warning' : 'info' } 
  }));
};

// Smart Booking Conflict Detector
const timeToMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const checkScheduleConflict = (apt) => {
  const { id, date, time, duration, staffId, machineId, room } = apt;
  const appointments = getTable('appointments');
  const start = timeToMinutes(time);
  const end = start + Number(duration);
  
  const staff = getTable('users').find(u => u.id === staffId);
  const machine = getTable('machines').find(m => m.id === machineId);
  
  if (machineId && machine && machine.currentStatus !== 'Available') {
    return {
      conflict: true,
      reason: `Equipment "${machine.name}" is marked as "${machine.currentStatus}" and is currently unavailable.`
    };
  }
  
  for (const existing of appointments) {
    if (existing.status === 'Cancelled' || existing.status === 'No-show' || existing.id === id) continue;
    if (existing.date !== date) continue;
    
    const existStart = timeToMinutes(existing.time);
    const existEnd = existStart + Number(existing.duration);
    
    const overlap = Math.max(start, existStart) < Math.min(end, existEnd);
    
    if (overlap) {
      if (staffId && existing.staffId === staffId) {
        return { conflict: true, reason: `Therapist "${staff ? staff.name : 'Staff'}" is already scheduled for an appointment at this time (${existing.time} - ${existing.duration}m).` };
      }
      if (machineId && existing.machineId === machineId) {
        return { conflict: true, reason: `Machine "${machine ? machine.name : 'Machine'}" is already booked for another client at this time.` };
      }
      if (room && existing.room === room) {
        return { conflict: true, reason: `Room "${room}" is already allocated for another treatment at this time.` };
      }
    }
  }
  return { conflict: false, reason: '' };
};

// Booking CRM Triggers
export const addAppointment = (username, apt) => {
  const conflictCheck = checkScheduleConflict(apt);
  if (conflictCheck.conflict) {
    return { success: false, error: conflictCheck.reason };
  }
  
  const appointments = getTable('appointments');
  const newApt = {
    id: `apt-${Date.now()}`,
    status: apt.status || 'Pending',
    ...apt
  };
  appointments.push(newApt);
  saveTable('appointments', appointments);
  
  logAction(username, 'Create Booking', `Created booking for Client ID ${apt.clientId} on ${apt.date} at ${apt.time}`, '', newApt);
  
  // Trigger email/SMS simulated reminder toast
  setTimeout(() => {
    logAction('System', 'Reminder Sent', `SMS sent to Client: "Your Sculpt & Glow booking for ${newApt.date} at ${newApt.time} is Confirmed."`);
  }, 1000);

  return { success: true, appointment: newApt };
};

export const updateAppointmentStatus = (username, aptId, newStatus) => {
  const appointments = getTable('appointments');
  const index = appointments.findIndex(a => a.id === aptId);
  if (index === -1) return { success: false, error: 'Appointment not found.' };
  
  const prev = appointments[index];
  const updated = { ...prev, status: newStatus };
  appointments[index] = updated;
  saveTable('appointments', appointments);
  
  logAction(username, 'Update Appointment Status', `Changed booking status for ${aptId} to ${newStatus}`, prev.status, newStatus);
  
  if (newStatus === 'Completed' && prev.status !== 'Completed') {
    deductConsumablesForAppointment(username, updated);
  }
  
  return { success: true, appointment: updated };
};

// Stock deductions + Glow Points + Machine usage ROI trackers
const deductConsumablesForAppointment = (username, apt) => {
  const services = getTable('services');
  const inventory = getTable('inventory');
  const service = services.find(s => s.id === apt.serviceId);
  
  if (!service) return;
  
  // Auto deduct inventory stock
  if (service.consumables && service.consumables.length > 0) {
    let deductions = [];
    const updatedInventory = inventory.map(item => {
      const required = service.consumables.find(c => c.itemId === item.id);
      if (required) {
        const newQty = Math.max(0, item.quantity - required.quantity);
        deductions.push(`${required.quantity}${item.unit} of ${item.name}`);
        if (newQty <= item.alertAt) {
          setTimeout(() => {
            logAction('System', 'Low Stock Alert', `Stock level for "${item.name}" dropped to ${newQty} ${item.unit}. Please replenish!`, item.quantity, newQty);
          }, 1500);
        }
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveTable('inventory', updatedInventory);
    logAction('System', 'Inventory Auto-Deduct', `Completed "${service.name}": Deducted ${deductions.join(', ')}`);
  }

  // Tally machine hours & ROI
  if (apt.machineId) {
    const machines = getTable('machines');
    const mIdx = machines.findIndex(m => m.id === apt.machineId);
    if (mIdx !== -1) {
      const mach = machines[mIdx];
      const hours = Number((apt.duration / 60).toFixed(2));
      const newHrs = Number((mach.totalUsageHours + hours).toFixed(2));
      const newRev = mach.revenueGenerated + service.price;
      
      machines[mIdx] = {
        ...mach,
        totalUsageHours: newHrs,
        revenueGenerated: newRev
      };
      saveTable('machines', machines);
      logAction('System', 'Machine Usage ROI Tally', `Logged ${hours} hrs usage on "${mach.name}". Total yield generated: R${newRev}.`);
    }
  }

  // Award Glow Points: R100 spent = 1 Point
  const clients = getTable('clients');
  const cIdx = clients.findIndex(c => c.id === apt.clientId);
  if (cIdx !== -1) {
    const client = clients[cIdx];
    const points = Math.floor(service.price / 100);
    const newPoints = client.loyaltyPoints + points;
    
    let vip = client.vipTier;
    if (newPoints >= 100) vip = 'Platinum';
    else if (newPoints >= 50) vip = 'Gold';
    else if (newPoints >= 20) vip = 'Silver';

    clients[cIdx] = {
      ...client,
      loyaltyPoints: newPoints,
      vipTier: vip
    };
    saveTable('clients', clients);
    logAction('System', 'Award Glow Points', `Client "${client.name}" earned +${points} Glow Points (Total: ${newPoints}). VIP Level: ${vip}.`);
  }
};

// Client CRM CRUD
export const addClient = (username, client) => {
  const clients = getTable('clients');
  const newClient = {
    id: `cli-${Date.now()}`,
    loyaltyPoints: 0,
    vipTier: 'Bronze',
    weightLogs: [],
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    ...client
  };
  clients.push(newClient);
  saveTable('clients', clients);
  logAction(username, 'Add Client Profile', `Added CRM profile for "${client.name}"`, '', newClient);
  return newClient;
};

export const addClientWeightLog = (username, clientId, log) => {
  const clients = getTable('clients');
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) return null;
  const client = clients[idx];
  const logs = client.weightLogs || [];
  const newLog = {
    date: new Date().toISOString().split('T')[0],
    photo: '/cover.jpg',
    ...log
  };
  clients[idx] = {
    ...client,
    weightLogs: [newLog, ...logs]
  };
  saveTable('clients', clients);
  logAction(username, 'Log Body Measurements', `Updated before/after tracking for ${client.name}: ${log.weight}kg, Waist: ${log.waist}cm`, '', newLog);
  return clients[idx];
};

// Glow Points Redemption Tally
export const redeemGlowPoints = (username, clientId, rewardPoints, rewardName) => {
  const clients = getTable('clients');
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) return { success: false, error: 'Client not found' };
  
  const client = clients[idx];
  if (client.loyaltyPoints < rewardPoints) {
    return { success: false, error: 'Insufficient Glow Points balance' };
  }
  
  const updatedPoints = client.loyaltyPoints - rewardPoints;
  clients[idx] = { ...client, loyaltyPoints: updatedPoints };
  saveTable('clients', clients);
  
  logAction(username, 'Redeem Glow Points', `Redeemed ${rewardPoints} points for reward: "${rewardName}" for Client ${client.name}`);
  return { success: true, client: clients[idx] };
};

// Invoicing & Checkout loop
export const addInvoice = (username, invoice) => {
  const invoices = getTable('invoices');
  const newInv = {
    id: `inv-${Date.now()}`,
    invoiceNumber: `INV-2026-${String(invoices.length + 5001).padStart(4, '0')}`,
    date: new Date().toISOString().split('T')[0],
    payments: [],
    refundReason: '',
    ...invoice
  };
  invoices.push(newInv);
  saveTable('invoices', invoices);
  
  logAction(username, 'Generate Invoice', `Generated invoice ${newInv.invoiceNumber} for client. Total: R${newInv.total}`, '', newInv);
  
  // Deduct inventory product counts immediately upon checkout sale of product item!
  invoice.items.forEach(item => {
    if (item.name.includes('[Product]')) {
      const products = getTable('products');
      // Extract clean product name
      const cleanName = item.name.split(' [')[0];
      const pIdx = products.findIndex(p => p.name === cleanName);
      if (pIdx !== -1) {
        const prod = products[pIdx];
        const newStock = Math.max(0, prod.stock - item.quantity);
        products[pIdx] = { ...prod, stock: newStock };
        saveTable('products', products);
        logAction('System', 'Retail Product Stock Deduct', `E-commerce checkout: Sold product "${prod.name}". Deducted -${item.quantity} stock (Remains: ${newStock}).`);
      }
    }
  });

  return newInv;
};

export const addPaymentToInvoice = (username, invoiceId, payment) => {
  const invoices = getTable('invoices');
  const idx = invoices.findIndex(i => i.id === invoiceId);
  if (idx === -1) return null;
  
  const inv = invoices[idx];
  const newPayment = {
    date: new Date().toISOString().split('T')[0],
    txnId: `TXN-${Math.floor(Math.random() * 89999 + 10000)}`,
    ...payment
  };
  
  const payments = [...(inv.payments || []), newPayment];
  const paidTotal = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const status = paidTotal >= inv.total ? 'Paid' : 'Partial';
  
  invoices[idx] = {
    ...inv,
    payments,
    status
  };
  saveTable('invoices', invoices);
  logAction(username, 'Capture Payment', `Received R${payment.amount} via ${payment.method} for Invoice ${inv.invoiceNumber}.`, inv.status, status);
  return invoices[idx];
};

export const refundInvoice = (username, invoiceId, reason) => {
  const invoices = getTable('invoices');
  const idx = invoices.findIndex(i => i.id === invoiceId);
  if (idx === -1) return null;
  
  const inv = invoices[idx];
  const updated = {
    ...inv,
    status: 'Refunded',
    refundReason: reason
  };
  invoices[idx] = updated;
  saveTable('invoices', invoices);
  logAction(username, 'Process Refund', `Refunded Invoice ${inv.invoiceNumber}. Reason: ${reason}`, inv.status, 'Refunded');
  return updated;
};

// Quote Operations
export const addQuote = (username, quote) => {
  const quotes = getTable('quotes');
  const newQ = {
    id: `qte-${Date.now()}`,
    quoteNumber: `QTE-2026-${String(quotes.length + 801).padStart(4, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'Active',
    ...quote
  };
  quotes.push(newQ);
  saveTable('quotes', quotes);
  logAction(username, 'Create Quote', `Created Quote ${newQ.quoteNumber}`, '', newQ);
  return newQ;
};

export const convertQuoteToInvoice = (username, quoteId) => {
  const quotes = getTable('quotes');
  const qIdx = quotes.findIndex(q => q.id === quoteId);
  if (qIdx === -1) return null;
  
  const quote = quotes[qIdx];
  quote.status = 'Converted';
  saveTable('quotes', quotes);
  
  const subtotal = Number((quote.total / 1.15).toFixed(2));
  const tax = Number((quote.total - subtotal).toFixed(2));
  
  const newInvoice = addInvoice(username, {
    clientId: quote.clientId,
    items: quote.items,
    subtotal,
    tax,
    discount: quote.discount || 0,
    total: quote.total,
    status: 'Unpaid'
  });
  
  logAction(username, 'Convert Quote', `Converted Quote ${quote.quoteNumber} to Invoice ${newInvoice.invoiceNumber}`);
  return newInvoice;
};

// Products Admin Controls (Dashboard -> storefront syncs)
export const addProduct = (username, product) => {
  const products = getTable('products');
  const newP = {
    id: `prd-${Date.now()}`,
    stock: 10,
    ...product
  };
  products.push(newP);
  saveTable('products', products);
  logAction(username, 'Add Retail Product', `Added retail catalog product "${newP.name}" priced at R${newP.price}`, '', newP);
  return newP;
};

export const updateProduct = (username, product) => {
  const products = getTable('products');
  const idx = products.findIndex(p => p.id === product.id);
  if (idx === -1) return null;
  const prev = products[idx];
  products[idx] = { ...prev, ...product };
  saveTable('products', products);
  logAction(username, 'Update Retail Product', `Updated price or details for "${product.name}"`, prev, product);
  return products[idx];
};

// Inventory CRUD
export const updateInventoryItemStock = (username, itemId, qtyChange) => {
  const inventory = getTable('inventory');
  const idx = inventory.findIndex(item => item.id === itemId);
  if (idx === -1) return null;
  
  const prev = inventory[idx];
  const newQty = Math.max(0, prev.quantity + qtyChange);
  inventory[idx] = { ...prev, quantity: newQty };
  saveTable('inventory', inventory);
  logAction(username, qtyChange > 0 ? 'Receive Goods' : 'Deduct Inventory', `Stock of "${prev.name}" changed by ${qtyChange}. New level: ${newQty}`, prev.quantity, newQty);
  return inventory[idx];
};

export const addInventoryItem = (username, item) => {
  const inventory = getTable('inventory');
  const newItem = {
    id: `inv-${Date.now()}`,
    ...item
  };
  inventory.push(newItem);
  saveTable('inventory', inventory);
  logAction(username, 'Add Stock Item', `Registered new stock item "${newItem.name}"`, '', newItem);
  return newItem;
};

// Machines CRUD
export const updateMachineDetails = (username, machine) => {
  const machines = getTable('machines');
  const idx = machines.findIndex(m => m.id === machine.id);
  if (idx === -1) return null;
  const prev = machines[idx];
  machines[idx] = { ...prev, ...machine };
  saveTable('machines', machines);
  logAction(username, 'Update Machine Profile', `Updated machine "${machine.name}" status or info.`, prev, machine);
  return machines[idx];
};

export const logMachineMaintenance = (username, machineId, logText) => {
  const machines = getTable('machines');
  const idx = machines.findIndex(m => m.id === machineId);
  if (idx === -1) return;
  const mach = machines[idx];
  
  machines[idx] = {
    ...mach,
    currentStatus: 'Available',
    totalUsageHours: 0 // Reset usage counter post-service
  };
  
  saveTable('machines', machines);
  logAction(username, 'Log Maintenance Repair', `Recorded maintenance check for "${mach.name}": ${logText}. Resetting usage hours.`, mach.currentStatus, 'Available');
};

// Expenses CRUD
export const addExpense = (username, exp) => {
  const expenses = getTable('expenses');
  const newExp = {
    id: `exp-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    ...exp
  };
  expenses.push(newExp);
  saveTable('expenses', expenses);
  logAction(username, 'Log Expense', `Recorded expense "${exp.category}" of R${exp.amount}: ${exp.description}`, '', newExp);
  return newExp;
};

// Waitlist CRUD
export const addToWaitlist = (username, wt) => {
  const waitlist = getTable('waitlist');
  const newWt = {
    id: `wt-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    ...wt
  };
  waitlist.push(newWt);
  saveTable('waitlist', waitlist);
  logAction(username, 'Add to Waitlist', `Added Client ID ${wt.clientId} to waitlist for service ${wt.serviceId}`);
  return newWt;
};

export const deleteFromWaitlist = (username, wtId) => {
  const waitlist = getTable('waitlist');
  const filtered = waitlist.filter(w => w.id !== wtId);
  saveTable('waitlist', filtered);
  logAction(username, 'Clear Waitlist Entry', `Removed waitlist entry ${wtId}`);
};

// Shifts & Leave schedules
export const addShiftOrLeave = (username, shift) => {
  const shifts = getTable('staffShifts');
  const newShift = {
    id: `shf-${Date.now()}`,
    ...shift
  };
  shifts.push(newShift);
  saveTable('staffShifts', shifts);
  logAction(username, shift.isLeave ? 'Submit Leave Request' : 'Schedule Staff Shift', `Logged scheduling entry for Staff ID ${shift.staffId} on ${shift.date}`, '', newShift);
  return newShift;
};

export const deleteShiftOrLeave = (username, shiftId) => {
  const shifts = getTable('staffShifts');
  const filtered = shifts.filter(s => s.id !== shiftId);
  saveTable('staffShifts', filtered);
  logAction(username, 'Cancel Schedule Slot', `Removed scheduling entry ${shiftId}`);
};

// Settings CRUD
export const updateSettings = (username, settings) => {
  const prev = getTable('settings');
  saveTable('settings', settings);
  logAction(username, 'Update Salon Settings', `Saved global preferences & pricing parameters.`, prev, settings);
  return settings;
};

// Commission calculations on Rands
export const getStaffCommissions = (staffId) => {
  const invoices = getTable('invoices').filter(i => i.status === 'Paid');
  const appointments = getTable('appointments');
  const staffProfile = getTable('users').find(u => u.id === staffId);
  
  if (!staffProfile) return { serviceComm: 0, productComm: 0, total: 0 };
  
  const svcCommRate = 10; // 10%
  const prdCommRate = 5;  // 5% standard
  
  let serviceComm = 0;
  let productComm = 0;
  
  invoices.forEach(inv => {
    const apt = appointments.find(a => a.id === inv.appointmentId);
    inv.items.forEach(item => {
      if (item.name.includes('[Service]') && apt && apt.staffId === staffId) {
        serviceComm += Number((item.price * item.quantity * (svcCommRate / 100)).toFixed(2));
      } else if (item.name.includes('[Product]')) {
        if (apt && apt.staffId === staffId) {
          productComm += Number((item.price * item.quantity * (prdCommRate / 100)).toFixed(2));
        }
      }
    });
  });
  
  return {
    serviceComm,
    productComm,
    total: Number((serviceComm + productComm).toFixed(2))
  };
};
