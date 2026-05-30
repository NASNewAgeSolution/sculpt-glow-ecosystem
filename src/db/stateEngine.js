// Dual-Mode Database State & Synchronisation Engine
// Mode A: Seeded Simulator (Local Storage fallback for instant out-of-the-box showcases)
// Mode B: Supabase PostgreSQL Cloud Connector (Instantly activated via VITE_SUPABASE_URL environment keys)

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

// Fetch Supabase cloud credentials from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase keys are active
export const useSupabase = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

// Generic HTTP PostgREST client for Supabase (dependency-free cloud driver!)
const cloudFetch = async (table, options = {}) => {
  const method = options.method || 'GET';
  const headers = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };
  
  let url = `${SUPABASE_URL}/rest/v1/${table}`;
  if (options.query) {
    url += `?${options.query}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw new Error(`Supabase postgREST error on ${table}: ${response.statusText}`);
  }
  return await response.json();
};

// Local storage init helper
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

// Unified state sync triggers
export const getTable = (tableName) => {
  initializeDatabase();
  const data = localStorage.getItem(`salon_${tableName}`);
  return data ? JSON.parse(data) : [];
};

export const saveTable = (tableName, data) => {
  localStorage.setItem(`salon_${tableName}`, JSON.stringify(data));
  // Notify workspace portals
  window.dispatchEvent(new Event('salon_db_sync'));
};

// Logging System
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
  
  if (useSupabase()) {
    cloudFetch('audit_logs', {
      method: 'POST',
      body: {
        id: newLog.id,
        username: newLog.username,
        action: newLog.action,
        details: newLog.details,
        prev_value: newLog.prevValue,
        new_value: newLog.newValue
      }
    }).catch(err => console.error('Cloud audit log failed:', err));
  }

  logs.unshift(newLog);
  saveTable('auditLogs', logs);
  
  window.dispatchEvent(new CustomEvent('salon_notification', { 
    detail: { title: action, message: details, type: action.toLowerCase().includes('alert') ? 'warning' : 'info' } 
  }));
};

// Conflict checks
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
    return { conflict: true, reason: `Equipment "${machine.name}" is marked as "${machine.currentStatus}" and is currently unavailable.` };
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

// Core Schedulers
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

  if (useSupabase()) {
    cloudFetch('appointments', {
      method: 'POST',
      body: {
        id: newApt.id,
        client_id: newApt.clientId,
        service_id: newApt.serviceId,
        staff_id: newApt.staffId,
        room: newApt.room,
        machine_id: newApt.machineId,
        date: newApt.date,
        time: newApt.time,
        duration: newApt.duration,
        status: newApt.status,
        notes: newApt.notes
      }
    }).catch(err => console.error('Cloud appointment creation failed:', err));
  }

  appointments.push(newApt);
  saveTable('appointments', appointments);
  logAction(username, 'Create Booking', `Created booking for Client ID ${apt.clientId} on ${apt.date} at ${apt.time}`, '', newApt);
  
  setTimeout(() => {
    logAction('System', 'Reminder Sent', `Auto-sent SMS confirmation to Client ID ${apt.clientId} for appointment on ${apt.date}.`);
  }, 1500);

  return { success: true, appointment: newApt };
};

export const updateAppointmentStatus = (username, aptId, newStatus) => {
  const appointments = getTable('appointments');
  const index = appointments.findIndex(a => a.id === aptId);
  if (index === -1) return { success: false, error: 'Appointment not found.' };
  
  const prev = appointments[index];
  const updated = { ...prev, status: newStatus };

  if (useSupabase()) {
    cloudFetch('appointments', {
      method: 'PATCH',
      query: `id=eq.${aptId}`,
      body: { status: newStatus }
    }).catch(err => console.error('Cloud status sync failed:', err));
  }

  appointments[index] = updated;
  saveTable('appointments', appointments);
  logAction(username, 'Update Appointment Status', `Changed booking status for ${aptId} to ${newStatus}`, prev.status, newStatus);
  
  if (newStatus === 'Completed' && prev.status !== 'Completed') {
    deductConsumablesForAppointment(username, updated);
  }
  
  return { success: true, appointment: updated };
};

// Consumables deduction & Glow Points CRM awarder
const deductConsumablesForAppointment = (username, apt) => {
  const services = getTable('services');
  const inventory = getTable('inventory');
  const service = services.find(s => s.id === apt.serviceId);
  
  if (!service) return;
  
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
        
        if (useSupabase()) {
          cloudFetch('inventory', {
            method: 'PATCH',
            query: `id=eq.${item.id}`,
            body: { quantity: newQty }
          }).catch(err => console.error('Cloud stock sync failed:', err));
        }

        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveTable('inventory', updatedInventory);
    logAction('System', 'Inventory Auto-Deduct', `Completed "${service.name}": Deducted ${deductions.join(', ')}`);
  }

  // Tally machine hours
  if (apt.machineId) {
    const machines = getTable('machines');
    const mIdx = machines.findIndex(m => m.id === apt.machineId);
    if (mIdx !== -1) {
      const mach = machines[mIdx];
      const hours = Number((apt.duration / 60).toFixed(2));
      const newHrs = Number((mach.totalUsageHours + hours).toFixed(2));
      const newRev = mach.revenueGenerated + service.price;
      
      if (useSupabase()) {
        cloudFetch('machines', {
          method: 'PATCH',
          query: `id=eq.${mach.id}`,
          body: { total_usage_hours: newHrs, revenue_generated: newRev }
        }).catch(err => console.error('Cloud machine ROI update failed:', err));
      }

      machines[mIdx] = { ...mach, totalUsageHours: newHrs, revenueGenerated: newRev };
      saveTable('machines', machines);
      logAction('System', 'Machine ROI Tally', `Logged ${hours} hrs usage on "${mach.name}". Yield: R${newRev}.`);
    }
  }

  // Loyalty Glow Points
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

    if (useSupabase()) {
      cloudFetch('clients', {
        method: 'PATCH',
        query: `id=eq.${client.id}`,
        body: { loyalty_points: newPoints, vip_tier: vip }
      }).catch(err => console.error('Cloud Glow Points sync failed:', err));
    }

    clients[cIdx] = { ...client, loyaltyPoints: newPoints, vipTier: vip };
    saveTable('clients', clients);
    logAction('System', 'Award Glow Points', `Client "${client.name}" earned +${points} Glow Points (Total: ${newPoints}). VIP Level: ${vip}.`);
  }
};

// CRM Profiles CRUD
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

  if (useSupabase()) {
    cloudFetch('clients', {
      method: 'POST',
      body: {
        id: newClient.id,
        name: newClient.name,
        email: newClient.email,
        phone: newClient.phone,
        dob: newClient.dob,
        gender: newClient.gender,
        allergies: newClient.allergies,
        medical: newClient.medical,
        loyalty_points: newClient.loyaltyPoints,
        vip_tier: newClient.vipTier,
        notes: newClient.notes,
        profile_photo: newClient.profilePhoto
      }
    }).catch(err => console.error('Cloud client creation failed:', err));
  }

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

  if (useSupabase()) {
    cloudFetch('weight_logs', {
      method: 'POST',
      body: {
        id: `wl-${Date.now()}`,
        client_id: clientId,
        date: newLog.date,
        weight: newLog.weight,
        waist: newLog.waist,
        hips: newLog.hips,
        photo: newLog.photo
      }
    }).catch(err => console.error('Cloud scale log failed:', err));
  }

  clients[idx] = { ...client, weightLogs: [newLog, ...logs] };
  saveTable('clients', clients);
  logAction(username, 'Log Body Measurements', `Updated before/after tracking for ${client.name}: ${log.weight}kg, Waist: ${log.waist}cm`, '', newLog);
  return clients[idx];
};

export const redeemGlowPoints = (username, clientId, rewardPoints, rewardName) => {
  const clients = getTable('clients');
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) return { success: false, error: 'Client not found' };
  
  const client = clients[idx];
  if (client.loyaltyPoints < rewardPoints) {
    return { success: false, error: 'Insufficient Glow Points balance' };
  }
  
  const updatedPoints = client.loyaltyPoints - rewardPoints;

  if (useSupabase()) {
    cloudFetch('clients', {
      method: 'PATCH',
      query: `id=eq.${clientId}`,
      body: { loyalty_points: updatedPoints }
    }).catch(err => console.error('Cloud Glow Points redeem failed:', err));
  }

  clients[idx] = { ...client, loyaltyPoints: updatedPoints };
  saveTable('clients', clients);
  logAction(username, 'Redeem Glow Points', `Redeemed ${rewardPoints} points for reward: "${rewardName}" for Client ${client.name}`);
  return { success: true, client: clients[idx] };
};

// Checkout & Products Catalog Sync
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

  if (useSupabase()) {
    cloudFetch('invoices', {
      method: 'POST',
      body: {
        id: newInv.id,
        invoice_number: newInv.invoiceNumber,
        appointment_id: newInv.appointmentId || null,
        client_id: newInv.clientId || null,
        date: newInv.date,
        due_date: newInv.dueDate || newInv.date,
        items: newInv.items,
        subtotal: newInv.subtotal,
        tax: newInv.tax,
        discount: newInv.discount,
        total: newInv.total,
        status: newInv.status
      }
    }).catch(err => console.error('Cloud invoice addition failed:', err));
  }

  invoices.push(newInv);
  saveTable('invoices', invoices);
  logAction(username, 'Generate Invoice', `Generated invoice ${newInv.invoiceNumber}. Total: R${newInv.total}`, '', newInv);
  
  // Deduct retail catalog product stock automatically
  invoice.items.forEach(item => {
    if (item.name.includes('[Product]')) {
      const products = getTable('products');
      const cleanName = item.name.split(' [')[0];
      const pIdx = products.findIndex(p => p.name === cleanName);
      if (pIdx !== -1) {
        const prod = products[pIdx];
        const newStock = Math.max(0, prod.stock - item.quantity);
        
        if (useSupabase()) {
          cloudFetch('products', {
            method: 'PATCH',
            query: `id=eq.${prod.id}`,
            body: { stock: newStock }
          }).catch(err => console.error('Cloud product stock sync failed:', err));
        }

        products[pIdx] = { ...prod, stock: newStock };
        saveTable('products', products);
        logAction('System', 'Retail Product Stock Deduct', `E-commerce checkout: Sold product "${prod.name}". Stock remains: ${newStock}.`);
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
  
  if (useSupabase()) {
    cloudFetch('invoices', {
      method: 'PATCH',
      query: `id=eq.${invoiceId}`,
      body: { payments, status }
    }).catch(err => console.error('Cloud invoice payment capture failed:', err));
  }

  invoices[idx] = { ...inv, payments, status };
  saveTable('invoices', invoices);
  logAction(username, 'Capture Payment', `Received R${payment.amount} via ${payment.method} for Invoice ${inv.invoiceNumber}.`, inv.status, status);
  return invoices[idx];
};

export const refundInvoice = (username, invoiceId, reason) => {
  const invoices = getTable('invoices');
  const idx = invoices.findIndex(i => i.id === invoiceId);
  if (idx === -1) return null;
  
  const inv = invoices[idx];
  const updated = { ...inv, status: 'Refunded', refundReason: reason };

  if (useSupabase()) {
    cloudFetch('invoices', {
      method: 'PATCH',
      query: `id=eq.${invoiceId}`,
      body: { status: 'Refunded', refund_reason: reason }
    }).catch(err => console.error('Cloud invoice refund sync failed:', err));
  }

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

  if (useSupabase()) {
    cloudFetch('quotes', {
      method: 'POST',
      body: {
        id: newQ.id,
        quote_number: newQ.quoteNumber,
        client_id: newQ.clientId,
        date: newQ.date,
        expiry_date: newQ.expiryDate,
        items: newQ.items,
        discount: newQ.discount,
        total: newQ.total,
        status: newQ.status
      }
    }).catch(err => console.error('Cloud quote sync failed:', err));
  }

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

  if (useSupabase()) {
    cloudFetch('quotes', {
      method: 'PATCH',
      query: `id=eq.${quoteId}`,
      body: { status: 'Converted' }
    }).catch(err => console.error('Cloud quote conversion failed:', err));
  }

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

// E-Commerce sync products admin controls
export const addProduct = (username, product) => {
  const products = getTable('products');
  const newP = {
    id: `prd-${Date.now()}`,
    stock: 10,
    ...product
  };

  if (useSupabase()) {
    cloudFetch('products', {
      method: 'POST',
      body: {
        id: newP.id,
        name: newP.name,
        category: newP.category,
        price: newP.price,
        stock: newP.stock,
        image: newP.image,
        description: newP.description
      }
    }).catch(err => console.error('Cloud product sync failed:', err));
  }

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
  const updated = { ...prev, ...product };

  if (useSupabase()) {
    cloudFetch('products', {
      method: 'PATCH',
      query: `id=eq.${product.id}`,
      body: {
        price: updated.price,
        stock: updated.stock
      }
    }).catch(err => console.error('Cloud product update failed:', err));
  }

  products[idx] = updated;
  saveTable('products', products);
  logAction(username, 'Update Retail Product', `Updated price or stock for "${product.name}"`, prev, product);
  return products[idx];
};

// Stock Adjustments CRUD
export const updateInventoryItemStock = (username, itemId, qtyChange) => {
  const inventory = getTable('inventory');
  const idx = inventory.findIndex(item => item.id === itemId);
  if (idx === -1) return null;
  
  const prev = inventory[idx];
  const newQty = Math.max(0, prev.quantity + qtyChange);

  if (useSupabase()) {
    cloudFetch('inventory', {
      method: 'PATCH',
      query: `id=eq.${itemId}`,
      body: { quantity: newQty }
    }).catch(err => console.error('Cloud stock change failed:', err));
  }

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

  if (useSupabase()) {
    cloudFetch('inventory', {
      method: 'POST',
      body: {
        id: newItem.id,
        name: newItem.name,
        quantity: newItem.quantity,
        alert_at: newItem.alertAt,
        unit: newItem.unit,
        cost: newItem.cost,
        sell_price: newItem.sellPrice,
        supplier: newItem.supplier
      }
    }).catch(err => console.error('Cloud stock item creation failed:', err));
  }

  inventory.push(newItem);
  saveTable('inventory', inventory);
  logAction(username, 'Add Stock Item', `Registered new stock item "${newItem.name}"`, '', newItem);
  return newItem;
};

// Machinery CRUD
export const updateMachineDetails = (username, machine) => {
  const machines = getTable('machines');
  const idx = machines.findIndex(m => m.id === machine.id);
  if (idx === -1) return null;
  const prev = machines[idx];
  const updated = { ...prev, ...machine };

  if (useSupabase()) {
    cloudFetch('machines', {
      method: 'PATCH',
      query: `id=eq.${machine.id}`,
      body: { current_status: updated.currentStatus }
    }).catch(err => console.error('Cloud machine change failed:', err));
  }

  machines[idx] = updated;
  saveTable('machines', machines);
  logAction(username, 'Update Machine Profile', `Updated machine "${machine.name}" status.`, prev, machine);
  return machines[idx];
};

export const logMachineMaintenance = (username, machineId, logText) => {
  const machines = getTable('machines');
  const idx = machines.findIndex(m => m.id === machineId);
  if (idx === -1) return;
  const mach = machines[idx];

  if (useSupabase()) {
    cloudFetch('machines', {
      method: 'PATCH',
      query: `id=eq.${machineId}`,
      body: { current_status: 'Available', total_usage_hours: 0 }
    }).catch(err => console.error('Cloud maintenance sync failed:', err));
  }

  machines[idx] = {
    ...mach,
    currentStatus: 'Available',
    totalUsageHours: 0
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

  if (useSupabase()) {
    cloudFetch('expenses', {
      method: 'POST',
      body: {
        id: newExp.id,
        category: newExp.category,
        description: newExp.description,
        amount: newExp.amount,
        date: newExp.date
      }
    }).catch(err => console.error('Cloud expense sync failed:', err));
  }

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

  if (useSupabase()) {
    cloudFetch('waitlist', {
      method: 'POST',
      body: {
        id: newWt.id,
        client_id: newWt.clientId,
        service_id: newWt.serviceId,
        preferred_staff_id: newWt.preferredStaffId || null,
        date: newWt.date,
        notes: newWt.notes
      }
    }).catch(err => console.error('Cloud waitlist sync failed:', err));
  }

  waitlist.push(newWt);
  saveTable('waitlist', waitlist);
  logAction(username, 'Add to Waitlist', `Added Client ID ${wt.clientId} to waitlist for service ${wt.serviceId}`);
  return newWt;
};

export const deleteFromWaitlist = (username, wtId) => {
  const waitlist = getTable('waitlist');
  
  if (useSupabase()) {
    cloudFetch('waitlist', {
      method: 'DELETE',
      query: `id=eq.${wtId}`
    }).catch(err => console.error('Cloud waitlist delete failed:', err));
  }

  const filtered = waitlist.filter(w => w.id !== wtId);
  saveTable('waitlist', filtered);
  logAction(username, 'Clear Waitlist Entry', `Removed waitlist entry ${wtId}`);
};

// Shift rosters CRUD
export const addShiftOrLeave = (username, shift) => {
  const shifts = getTable('staffShifts');
  const newShift = {
    id: `shf-${Date.now()}`,
    ...shift
  };

  if (useSupabase()) {
    cloudFetch('staff_shifts', {
      method: 'POST',
      body: {
        id: newShift.id,
        staff_id: newShift.staffId,
        date: newShift.date,
        start_time: newShift.startTime,
        end_time: newShift.endTime,
        type: newShift.type,
        is_leave: newShift.isLeave
      }
    }).catch(err => console.error('Cloud shift roster failed:', err));
  }

  shifts.push(newShift);
  saveTable('staffShifts', shifts);
  logAction(username, shift.isLeave ? 'Submit Leave Request' : 'Schedule Staff Shift', `Logged scheduling entry for Staff ID ${shift.staffId} on ${shift.date}`, '', newShift);
  return newShift;
};

export const deleteShiftOrLeave = (username, shiftId) => {
  const shifts = getTable('staffShifts');

  if (useSupabase()) {
    cloudFetch('staff_shifts', {
      method: 'DELETE',
      query: `id=eq.${shiftId}`
    }).catch(err => console.error('Cloud shift delete failed:', err));
  }

  const filtered = shifts.filter(s => s.id !== shiftId);
  saveTable('staffShifts', filtered);
  logAction(username, 'Cancel Schedule Slot', `Removed scheduling entry ${shiftId}`);
};

// Global settings configurations
export const updateSettings = (username, settings) => {
  const prev = getTable('settings');

  if (useSupabase()) {
    cloudFetch('settings', {
      method: 'PATCH',
      query: `id=eq.set-1`,
      body: {
        salon_name: settings.salonName,
        phone: settings.phone,
        email: settings.email,
        address: settings.address,
        vat_rate: settings.vatRate
      }
    }).catch(err => console.error('Cloud settings sync failed:', err));
  }

  saveTable('settings', settings);
  logAction(username, 'Update Salon Settings', `Saved global preferences.`, prev, settings);
  return settings;
};

// Staff live commissions splits
export const getStaffCommissions = (staffId) => {
  const invoices = getTable('invoices').filter(i => i.status === 'Paid');
  const appointments = getTable('appointments');
  const staffProfile = getTable('users').find(u => u.id === staffId);
  
  if (!staffProfile) return { serviceComm: 0, productComm: 0, total: 0 };
  
  const svcCommRate = staffProfile.commissionRate || 10;
  const prdCommRate = 5;
  
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
