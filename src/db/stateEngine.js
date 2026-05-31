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

  // Seed extended HR/Payroll fields for users if not present
  const users = JSON.parse(localStorage.getItem('salon_users') || '[]');
  let updatedUsers = false;
  const newUsers = users.map(user => {
    if (user.salary === undefined) {
      updatedUsers = true;
      let salary = 0;
      let comm = 0;
      let salesT = 15000;
      let srvT = 10000;
      if (user.role === 'owner') { salary = 35000; comm = 0; }
      else if (user.role === 'therapist') { salary = 12500; comm = 10; salesT = 20000; srvT = 15000; }
      else if (user.role === 'receptionist') { salary = 8500; comm = 5; salesT = 10000; srvT = 5000; }
      
      return {
        ...user,
        salary,
        bankName: 'FNB Pretoria',
        accountHolder: user.name,
        accountNumber: `102938${user.id.split('-')[1]}`,
        branchCode: '250655',
        contracts: [
          { id: `doc-1`, name: `${user.name} Active Employment Contract.pdf`, type: 'contract', uploadDate: '2025-01-10' }
        ],
        commissionRate: comm,
        salesTarget: salesT,
        servicesTarget: srvT,
        leaveBalance: 15,
        monthlyLeaveAccrual: 1.25,
        sickLeaveBalance: 10,
        sickLeaveRenewCycle: '1 year',
        familyLeaveBalance: 3,
        claims: [],
        loans: [],
        bonuses: [],
        payslips: [],
        leaveRequests: []
      };
    }
    return user;
  });
  if (updatedUsers && newUsers.length > 0) {
    localStorage.setItem('salon_users', JSON.stringify(newUsers));
  }
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

  // Auto-sync added products to inventory!
  const inventory = getTable('inventory');
  if (!inventory.some(item => item.name === newP.name)) {
    const newInvItem = {
      id: `inv-${Date.now()}`,
      name: newP.name,
      quantity: newP.stock,
      alertAt: 5,
      unit: 'items',
      cost: Number((newP.price * 0.6).toFixed(2)),
      sellPrice: newP.price,
      supplier: 'Atelier E-Commerce'
    };
    
    if (useSupabase()) {
      cloudFetch('inventory', {
        method: 'POST',
        body: {
          id: newInvItem.id,
          name: newInvItem.name,
          quantity: newInvItem.quantity,
          alert_at: newInvItem.alertAt,
          unit: newInvItem.unit,
          cost: newInvItem.cost,
          sell_price: newInvItem.sellPrice,
          supplier: newInvItem.supplier
        }
      }).catch(err => console.error('Cloud stock item creation failed:', err));
    }
    
    inventory.push(newInvItem);
    saveTable('inventory', inventory);
    logAction(username, 'Add Stock Item', `Registered e-commerce product "${newInvItem.name}" in inventory automatically`, '', newInvItem);
  }

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
  const idx = waitlist.findIndex(w => w.id === wtId);
  if (idx === -1) return false;
  const prev = waitlist[idx];
  
  if (useSupabase()) {
    cloudFetch('waitlist', {
      method: 'DELETE',
      query: `id=eq.${wtId}`
    }).catch(err => console.error('Cloud waitlist delete failed:', err));
  }

  const filtered = waitlist.filter(w => w.id !== wtId);
  saveTable('waitlist', filtered);
  
  // Archival logic
  const client = getTable('clients').find(c => c.id === prev.clientId);
  const clientName = client ? client.name : 'Unknown Client';
  archiveItem(username, 'Waitlist', `Waitlist: ${clientName}`, prev);

  logAction(username, 'Clear Waitlist Entry', `Removed waitlist entry ${wtId}`);
  return true;
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
  const idx = shifts.findIndex(s => s.id === shiftId);
  if (idx === -1) return false;
  const prev = shifts[idx];

  if (useSupabase()) {
    cloudFetch('staff_shifts', {
      method: 'DELETE',
      query: `id=eq.${shiftId}`
    }).catch(err => console.error('Cloud shift delete failed:', err));
  }

  const filtered = shifts.filter(s => s.id !== shiftId);
  saveTable('staffShifts', filtered);
  
  // Archival logic
  const staff = getTable('users').find(u => u.id === prev.staffId);
  const staffName = staff ? staff.name : 'Unknown Staff';
  archiveItem(username, 'Shift', `${staffName} - ${prev.date} (${prev.startTime}-${prev.endTime})`, prev);

  logAction(username, 'Cancel Schedule Slot', `Removed scheduling entry ${shiftId}`);
  return true;
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

// Services Config CRUD
export const addService = (username, service) => {
  const services = getTable('services');
  const newS = {
    id: `srv-${Date.now()}`,
    vat: 15.00,
    requiredStaffType: 'therapist',
    ...service
  };

  if (useSupabase()) {
    cloudFetch('services', {
      method: 'POST',
      body: {
        id: newS.id,
        name: newS.name,
        category: newS.category,
        price: newS.price,
        duration: newS.duration,
        description: newS.description,
        required_machine: newS.requiredMachine,
        required_staff_type: newS.requiredStaffType,
        consumables: newS.consumables
      }
    }).catch(err => console.error('Cloud service sync failed:', err));
  }

  services.push(newS);
  saveTable('services', services);
  logAction(username, 'Add Service', `Added service "${newS.name}" priced at R${newS.price}`, '', newS);
  return newS;
};

export const updateService = (username, service) => {
  const services = getTable('services');
  const idx = services.findIndex(s => s.id === service.id);
  if (idx === -1) return null;
  const prev = services[idx];
  const updated = { ...prev, ...service };

  if (useSupabase()) {
    cloudFetch('services', {
      method: 'PATCH',
      query: `id=eq.${service.id}`,
      body: {
        name: updated.name,
        category: updated.category,
        price: updated.price,
        duration: updated.duration,
        description: updated.description,
        required_machine: updated.requiredMachine,
        consumables: updated.consumables
      }
    }).catch(err => console.error('Cloud service update failed:', err));
  }

  services[idx] = updated;
  saveTable('services', services);
  logAction(username, 'Update Service', `Updated service "${service.name}"`, prev, service);
  return updated;
};

export const deleteService = (username, serviceId) => {
  const services = getTable('services');
  const idx = services.findIndex(s => s.id === serviceId);
  if (idx === -1) return false;
  const prev = services[idx];

  if (useSupabase()) {
    cloudFetch('services', {
      method: 'DELETE',
      query: `id=eq.${serviceId}`
    }).catch(err => console.error('Cloud service delete failed:', err));
  }

  const filtered = services.filter(s => s.id !== serviceId);
  saveTable('services', filtered);
  
  // Archival logic
  archiveItem(username, 'Service', prev.name, prev);

  logAction(username, 'Delete Service', `Deleted service "${prev.name}"`, prev, '');
  return true;
};

export const deleteProduct = (username, productId) => {
  const products = getTable('products');
  const idx = products.findIndex(p => p.id === productId);
  if (idx === -1) return false;
  const prev = products[idx];

  if (useSupabase()) {
    cloudFetch('products', {
      method: 'DELETE',
      query: `id=eq.${productId}`
    }).catch(err => console.error('Cloud product delete failed:', err));
  }

  const filtered = products.filter(p => p.id !== productId);
  saveTable('products', filtered);
  
  // Archival logic
  archiveItem(username, 'Product', prev.name, prev);

  logAction(username, 'Delete Product', `Deleted retail product "${prev.name}"`, prev, '');
  return true;
};

// Global Archiving & Recovery API Helpers
export const archiveItem = (username, itemType, name, originalData) => {
  const archive = JSON.parse(localStorage.getItem('salon_archive') || '[]');
  const newArchiveItem = {
    id: `arc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    itemType,
    name,
    deletedAt: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
    deletedBy: username,
    originalData
  };
  archive.push(newArchiveItem);
  localStorage.setItem('salon_archive', JSON.stringify(archive));
  logAction(username, 'Archive Deleted Item', `Moved deleted ${itemType} "${name}" to archive.`);
  return newArchiveItem;
};

export const restoreItem = (username, archiveId) => {
  const archive = JSON.parse(localStorage.getItem('salon_archive') || '[]');
  const idx = archive.findIndex(a => a.id === archiveId);
  if (idx === -1) return { success: false, error: 'Item not found in archive.' };
  
  const item = archive[idx];
  const data = item.originalData;
  let success = false;
  
  if (item.itemType === 'Service') {
    const services = getTable('services');
    services.push(data);
    saveTable('services', services);
    success = true;
  } else if (item.itemType === 'Product') {
    const products = getTable('products');
    products.push(data);
    saveTable('products', products);
    success = true;
  } else if (item.itemType === 'Inventory') {
    const inventory = getTable('inventory');
    inventory.push(data);
    saveTable('inventory', inventory);
    success = true;
  } else if (item.itemType === 'Expense') {
    const expenses = getTable('expenses');
    expenses.push(data);
    saveTable('expenses', expenses);
    success = true;
  } else if (item.itemType === 'Shift') {
    const shifts = getTable('staffShifts');
    shifts.push(data);
    saveTable('staffShifts', shifts);
    success = true;
  } else if (item.itemType === 'Waitlist') {
    const waitlist = getTable('waitlist');
    waitlist.push(data);
    saveTable('waitlist', waitlist);
    success = true;
  }
  
  if (success) {
    const filtered = archive.filter(a => a.id !== archiveId);
    localStorage.setItem('salon_archive', JSON.stringify(filtered));
    logAction(username, 'Restore Archived Item', `Restored ${item.itemType} "${item.name}" from archive.`);
    return { success: true };
  }
  
  return { success: false, error: 'Unsupported item type.' };
};

export const purgeItem = (username, archiveId) => {
  const archive = JSON.parse(localStorage.getItem('salon_archive') || '[]');
  const idx = archive.findIndex(a => a.id === archiveId);
  if (idx === -1) return false;
  
  const item = archive[idx];
  const filtered = archive.filter(a => a.id !== archiveId);
  localStorage.setItem('salon_archive', JSON.stringify(filtered));
  logAction(username, 'Permanent Purge Item', `Permanently purged ${item.itemType} "${item.name}" from archive.`);
  return true;
};

// Operating Expenses CRUD
export const updateExpense = (username, expense) => {
  const expenses = getTable('expenses');
  const idx = expenses.findIndex(e => e.id === expense.id);
  if (idx === -1) return null;
  const prev = expenses[idx];
  const updated = { ...prev, ...expense };

  if (useSupabase()) {
    cloudFetch('expenses', {
      method: 'PATCH',
      query: `id=eq.${expense.id}`,
      body: {
        category: updated.category,
        description: updated.description,
        amount: updated.amount,
        machineId: updated.machineId,
        frequency: updated.frequency,
        date: updated.date
      }
    }).catch(err => console.error('Cloud expense update failed:', err));
  }

  expenses[idx] = updated;
  saveTable('expenses', expenses);
  logAction(username, 'Update Operating Expense', `Updated expense "${expense.category}"`, prev, updated);
  return expenses[idx];
};

export const deleteExpense = (username, expenseId) => {
  const expenses = getTable('expenses');
  const idx = expenses.findIndex(e => e.id === expenseId);
  if (idx === -1) return false;
  const prev = expenses[idx];

  if (useSupabase()) {
    cloudFetch('expenses', {
      method: 'DELETE',
      query: `id=eq.${expenseId}`
    }).catch(err => console.error('Cloud expense delete failed:', err));
  }

  const filtered = expenses.filter(e => e.id !== expenseId);
  saveTable('expenses', filtered);
  archiveItem(username, 'Expense', prev.category, prev);
  logAction(username, 'Delete Operating Expense', `Deleted expense "${prev.category}" of R${prev.amount}`, prev, '');
  return true;
};

// Consumables Stock ledger CRUD
export const updateInventoryItem = (username, item) => {
  const inventory = getTable('inventory');
  const idx = inventory.findIndex(i => i.id === item.id);
  if (idx === -1) return null;
  const prev = inventory[idx];
  const updated = { ...prev, ...item };

  if (useSupabase()) {
    cloudFetch('inventory', {
      method: 'PATCH',
      query: `id=eq.${item.id}`,
      body: {
        name: updated.name,
        quantity: updated.quantity,
        alertAt: updated.alertAt,
        unit: updated.unit,
        cost: updated.cost,
        sellPrice: updated.sellPrice,
        supplier: updated.supplier
      }
    }).catch(err => console.error('Cloud stock update failed:', err));
  }

  inventory[idx] = updated;
  saveTable('inventory', inventory);
  logAction(username, 'Update Consumable Stock Item', `Updated stock parameters for "${item.name}"`, prev, updated);
  return inventory[idx];
};

export const deleteInventoryItem = (username, itemId) => {
  const inventory = getTable('inventory');
  const idx = inventory.findIndex(item => item.id === itemId);
  if (idx === -1) return false;
  const prev = inventory[idx];

  if (useSupabase()) {
    cloudFetch('inventory', {
      method: 'DELETE',
      query: `id=eq.${itemId}`
    }).catch(err => console.error('Cloud inventory delete failed:', err));
  }

  const filtered = inventory.filter(item => item.id !== itemId);
  saveTable('inventory', filtered);
  archiveItem(username, 'Inventory', prev.name, prev);
  logAction(username, 'Delete Inventory Item', `Deleted stock item "${prev.name}"`, prev, '');
  return true;
};

// HR & Payroll Ecosystem Functions
export const updateStaffProfile = (username, staffId, profileData) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return null;
  const prev = users[idx];
  const updated = { ...prev, ...profileData };
  users[idx] = updated;
  saveTable('users', users);
  logAction(username, 'Update Staff Profile', `Updated HR parameters and banking credentials for ${updated.name}`, prev, updated);
  return updated;
};

export const uploadStaffDocument = (username, staffId, docName, docType) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return null;
  const user = users[idx];
  const docs = user.contracts || [];
  const newDoc = {
    id: `doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: docName,
    type: docType,
    uploadDate: new Date().toISOString().split('T')[0]
  };
  users[idx] = { ...user, contracts: [...docs, newDoc] };
  saveTable('users', users);
  logAction(username, 'Upload Staff Document', `Attached new ${docType} "${docName}" to ${user.name}`);
  return users[idx];
};

export const submitLeaveRequest = (username, staffId, leaveReq) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return { success: false, error: 'Staff not found.' };
  
  const user = users[idx];
  const reqs = user.leaveRequests || [];
  const newReq = {
    id: `req-${Date.now()}`,
    type: leaveReq.type,
    startDate: leaveReq.startDate,
    endDate: leaveReq.endDate,
    days: Number(leaveReq.days),
    notes: leaveReq.notes,
    doctorNoteName: leaveReq.doctorNoteName || '',
    status: 'pending'
  };

  users[idx] = { ...user, leaveRequests: [...reqs, newReq] };
  saveTable('users', users);

  // Notification hook: Notify Owner of New Leave Request
  addNotification('owner', 'leave_request', 'New Leave Request', `${user.name} requested ${leaveReq.days} days of ${leaveReq.type} Leave (${leaveReq.startDate} to ${leaveReq.endDate}).`, newReq.id);

  let warning = '';
  let balance = user.leaveBalance;
  if (leaveReq.type === 'Sick') balance = user.sickLeaveBalance;
  else if (leaveReq.type === 'Family') balance = user.familyLeaveBalance;

  if (balance - Number(leaveReq.days) < 0) {
    warning = `Warning: This request will leave you with a negative ${leaveReq.type} leave balance of ${balance - Number(leaveReq.days)} days.`;
  }

  logAction(username, 'Submit Leave Request', `${user.name} requested ${leaveReq.days} days of ${leaveReq.type} Leave.`);
  return { success: true, warning };
};

export const approveLeaveRequest = (username, staffId, requestId, status) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return false;
  
  const user = users[idx];
  const reqs = user.leaveRequests || [];
  const reqIdx = reqs.findIndex(r => r.id === requestId);
  if (reqIdx === -1) return false;
  
  const req = reqs[reqIdx];
  req.status = status;
  
  if (status === 'approved') {
    if (req.type === 'Annual') {
      user.leaveBalance = Number((user.leaveBalance - req.days).toFixed(2));
    } else if (req.type === 'Sick') {
      user.sickLeaveBalance = Math.max(0, user.sickLeaveBalance - req.days);
    } else if (req.type === 'Family') {
      user.familyLeaveBalance = Math.max(0, user.familyLeaveBalance - req.days);
    }
    
    // Also auto-log as a shift leave conflict!
    const shifts = getTable('staffShifts');
    const start = new Date(req.startDate);
    const end = new Date(req.endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      shifts.push({
        id: `shf-lv-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        staffId,
        date: dateStr,
        startTime: '08:00',
        endTime: '17:00',
        type: `${req.type} Leave`,
        isLeave: true
      });
    }
    saveTable('staffShifts', shifts);
  }
  
  users[idx] = { ...user, leaveRequests: reqs };
  saveTable('users', users);
  
  // Notification hook: Clear Owner's notification & Notify Staff member
  clearNotification('owner', requestId);
  addNotification(staffId, `leave_${status}`, `Leave Request ${status === 'approved' ? 'Approved' : 'Declined'}`, `Your request for ${req.days} days of ${req.type} Leave has been ${status === 'approved' ? 'approved' : 'declined'}.`, requestId);
  
  logAction(username, status === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request', `${status.toUpperCase()}ED ${req.days} days ${req.type} Leave for ${user.name}`);
  return true;
};

export const submitStaffClaim = (username, staffId, claimData) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return null;
  
  const user = users[idx];
  const claims = user.claims || [];
  const newClaim = {
    id: `clm-${Date.now()}`,
    type: claimData.type,
    description: claimData.description,
    amount: Number(claimData.amount),
    km: Number(claimData.km || 0),
    date: new Date().toISOString().split('T')[0],
    status: 'pending'
  };
  
  users[idx] = { ...user, claims: [...claims, newClaim] };
  saveTable('users', users);

  // Notification hook: Notify Owner of New Claim Request
  addNotification('owner', 'claim_request', 'New Expense Claim', `${user.name} submitted a R${newClaim.amount} ${claimData.type} claim.`, newClaim.id);

  logAction(username, 'Submit Claim', `${user.name} submitted a ${claimData.type} claim of R${newClaim.amount}`);
  return users[idx];
};

export const approveStaffClaim = (username, staffId, claimId, status) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return false;
  
  const user = users[idx];
  const claims = user.claims || [];
  const cIdx = claims.findIndex(c => c.id === claimId);
  if (cIdx === -1) return false;
  
  claims[cIdx].status = status;
  users[idx] = { ...user, claims };
  saveTable('users', users);

  // Notification hook: Clear Owner's notification & Notify Staff member
  clearNotification('owner', claimId);
  addNotification(staffId, `claim_${status}`, `Expense Claim ${status === 'approved' ? 'Approved' : 'Declined'}`, `Your ${claims[cIdx].type} claim of R${claims[cIdx].amount} has been ${status === 'approved' ? 'approved' : 'declined'}.`, claimId);

  logAction(username, status === 'approved' ? 'Approve Claim' : 'Reject Claim', `${status.toUpperCase()}ED claim for ${user.name}: R${claims[cIdx].amount}`);
  return true;
};

export const submitLoanRequest = (username, staffId, loanData) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return null;
  
  const user = users[idx];
  const loans = user.loans || [];
  const newLoan = {
    id: `lon-${Date.now()}`,
    amount: Number(loanData.amount),
    months: Number(loanData.months),
    monthlyRepayment: Number((loanData.amount / loanData.months).toFixed(2)),
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    repaymentMonthsLeft: Number(loanData.months)
  };
  
  users[idx] = { ...user, loans: [...loans, newLoan] };
  saveTable('users', users);

  // Notification hook: Notify Owner of New Loan Request
  addNotification('owner', 'loan_request', 'New Emergency Loan Request', `${user.name} requested a R${newLoan.amount} loan to repay over ${newLoan.months} months.`, newLoan.id);

  logAction(username, 'Request Loan', `${user.name} requested R${loanData.amount} loan to repay over ${loanData.months} months.`);
  return users[idx];
};

export const approveLoanRequest = (username, staffId, loanId, status) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return false;
  
  const user = users[idx];
  const loans = user.loans || [];
  const lIdx = loans.findIndex(l => l.id === loanId);
  if (lIdx === -1) return false;
  
  loans[lIdx].status = status;
  users[idx] = { ...user, loans };
  saveTable('users', users);

  // Notification hook: Clear Owner's notification & Notify Staff member
  clearNotification('owner', loanId);
  addNotification(staffId, `loan_${status}`, `Loan Request ${status === 'approved' ? 'Approved' : 'Declined'}`, `Your emergency loan request for R${loans[lIdx].amount} has been ${status === 'approved' ? 'approved' : 'declined'}.`, loanId);

  logAction(username, status === 'approved' ? 'Approve Loan Request' : 'Reject Loan Request', `${status.toUpperCase()}ED R${loans[lIdx].amount} loan request for ${user.name}`);
  return true;
};

export const addSalaryAdjustment = (username, staffId, adjData) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return null;
  
  const user = users[idx];
  if (adjData.type === 'increase') {
    const prevSalary = user.salary;
    const newSalary = Number(prevSalary) + Number(adjData.amount);
    users[idx] = { ...user, salary: newSalary };
    saveTable('users', users);
    logAction(username, 'Apply Salary Increase', `Increased base salary for ${user.name} by R${adjData.amount}. New Salary: R${newSalary}`, prevSalary, newSalary);
  } else {
    const bonuses = user.bonuses || [];
    const newBonus = {
      id: `adj-${Date.now()}`,
      type: 'bonus',
      amount: Number(adjData.amount),
      date: new Date().toISOString().split('T')[0]
    };
    users[idx] = { ...user, bonuses: [...bonuses, newBonus] };
    saveTable('users', users);
    logAction(username, 'Award One-off Bonus', `Awarded R${adjData.amount} bonus to ${user.name}`);
  }
  return users[idx];
};

export const finalizeStaffPayslip = (username, staffId, monthName) => {
  const users = getTable('users');
  const idx = users.findIndex(u => u.id === staffId);
  if (idx === -1) return { success: false, error: 'Staff not found.' };
  
  const user = users[idx];
  
  // 1. Calculate Commissions
  const comm = getStaffCommissions(staffId);
  const commTotal = comm.total;
  
  // 2. Calculate Approved Claims
  const approvedClaims = (user.claims || []).filter(c => c.status === 'approved');
  const claimsAmt = approvedClaims.reduce((acc, c) => acc + Number(c.amount), 0);
  
  // 3. Calculate Approved Bonuses
  const bonusesAmt = (user.bonuses || []).reduce((acc, b) => acc + Number(b.amount), 0);
  
  // 4. Calculate Loan Deductions
  const activeLoans = (user.loans || []).filter(l => l.status === 'approved' && l.repaymentMonthsLeft > 0);
  const loansAmt = activeLoans.reduce((acc, l) => acc + l.monthlyRepayment, 0);
  
  // 5. Total Pay
  const netSalary = Number((user.salary + commTotal + claimsAmt + bonusesAmt - loansAmt).toFixed(2));
  
  // 6. Archive Payslip
  const archived = user.payslips || [];
  const payslipItem = {
    id: `pay-${Date.now()}`,
    month: monthName,
    baseSalary: user.salary,
    commissionEarned: commTotal,
    claimsApproved: claimsAmt,
    loanDeduction: loansAmt,
    bonusApproved: bonusesAmt,
    finalSalary: netSalary,
    generatedAt: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString(),
    emailedAt: new Date().toISOString().split('T')[0]
  };
  
  // 7. Update Loan Terms
  const updatedLoans = (user.loans || []).map(l => {
    if (l.status === 'approved' && l.repaymentMonthsLeft > 0) {
      return { ...l, repaymentMonthsLeft: l.repaymentMonthsLeft - 1 };
    }
    return l;
  });
  
  // 8. Accumulate Leave
  const newLeaveBal = Number((user.leaveBalance + user.monthlyLeaveAccrual).toFixed(2));
  
  // 9. Reset Claims & Bonuses
  const remainingClaims = (user.claims || []).filter(c => c.status !== 'approved'); // clears processed ones
  
  // Update user object
  users[idx] = {
    ...user,
    leaveBalance: newLeaveBal,
    claims: remainingClaims,
    loans: updatedLoans,
    bonuses: [], // clear one-off bonuses
    payslips: [...archived, payslipItem]
  };
  
  saveTable('users', users);
  
  // 10. Write Salaries expense entry inside Finance Ledger automatically!
  addExpense('System', {
    category: 'Salaries',
    description: `Net Salary, commissions and claims paid for ${user.name} (${monthName})`,
    amount: netSalary
  });
  
  logAction(username, 'Finalize Payroll Payslip', `Processed monthly payroll for ${user.name} (${monthName}). Total Paid: R${netSalary}`);
  
  // Notification hook:
  addNotification(staffId, 'payslip_available', 'New Payslip Available', `Your payslip for ${monthName} is now available in your Vault!`, payslipItem.id);
  
  return { success: true, payslip: payslipItem };
};

// Persistent Notifications System
export const addNotification = (recipientId, type, title, message, relatedId) => {
  const notifs = getTable('notifications') || [];
  const newNotif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    recipientId,
    type,
    title,
    message,
    relatedId,
    read: false,
    createdAt: new Date().toISOString()
  };
  notifs.unshift(newNotif);
  saveTable('notifications', notifs);
  window.dispatchEvent(new CustomEvent('salon_notification_update'));
  return newNotif;
};

export const clearNotification = (recipientId, relatedId) => {
  const notifs = getTable('notifications') || [];
  const filtered = notifs.filter(n => !(n.recipientId === recipientId && n.relatedId === relatedId));
  if (filtered.length !== notifs.length) {
    saveTable('notifications', filtered);
    window.dispatchEvent(new CustomEvent('salon_notification_update'));
    return true;
  }
  return false;
};

export const markNotificationAsRead = (recipientId, notifId) => {
  const notifs = getTable('notifications') || [];
  const idx = notifs.findIndex(n => n.id === notifId && n.recipientId === recipientId);
  if (idx !== -1) {
    notifs.splice(idx, 1);
    saveTable('notifications', notifs);
    window.dispatchEvent(new CustomEvent('salon_notification_update'));
    return true;
  }
  return false;
};

// ========================================================
//   PHASE 6: SYSTEM ADMINISTRATION DATABASE HELPERS
// ========================================================

export const saveRoomMachineMapping = (roomName, machineIds) => {
  const mappings = getTable('roomMachines') || [];
  const idx = mappings.findIndex(m => m.roomName === roomName);
  if (idx !== -1) {
    mappings[idx].machineIds = machineIds;
  } else {
    mappings.push({ roomName, machineIds });
  }
  saveTable('roomMachines', mappings);
  logAction('System', 'Update Room Machines', `Updated machines list for room "${roomName}" to: ${machineIds.join(', ')}`);
  return true;
};

export const getMachinesForRoom = (roomName) => {
  const mappings = getTable('roomMachines') || [];
  const match = mappings.find(m => m.roomName === roomName);
  return match ? match.machineIds : [];
};

export const addMachine = (username, machData) => {
  const machines = getTable('machines') || [];
  const newMach = {
    id: `mac-${Date.now()}`,
    name: machData.name,
    serialNumber: machData.serialNumber || `SN-${Math.floor(Math.random()*1000000)}`,
    purchaseDate: machData.purchaseDate || new Date().toISOString().split('T')[0],
    serviceInterval: Number(machData.serviceInterval || 50),
    totalUsageHours: 0,
    hourlyRate: Number(machData.hourlyRate || 100),
    totalSessionsUsed: 0
  };
  machines.push(newMach);
  saveTable('machines', machines);
  logAction(username, 'Add New Equipment', `Registered clinical hardware device: ${newMach.name} (${newMach.serialNumber})`);
  return newMach;
};

export const registerSystemUser = (username, userData) => {
  const users = getTable('users') || [];
  if (users.some(u => u.username === userData.username)) {
    return { success: false, error: 'A staff member with this username already exists.' };
  }
  const newUser = {
    id: `usr-${Date.now()}`,
    name: userData.name,
    username: userData.username,
    email: userData.email,
    role: userData.role,
    pin: userData.pin || '1234',
    blocked: false,
    salary: Number(userData.salary || 10000),
    bankName: userData.bankName || 'FNB Pretoria',
    accountHolder: userData.name,
    accountNumber: userData.accountNumber || `102938${Date.now().toString().substr(8)}`,
    branchCode: userData.branchCode || '250655',
    contracts: [],
    commissionRate: userData.role === 'therapist' ? 10 : userData.role === 'receptionist' ? 5 : 0,
    salesTarget: userData.role === 'receptionist' ? 10000 : 15000,
    servicesTarget: userData.role === 'therapist' ? 15000 : 10000,
    leaveBalance: 15,
    monthlyLeaveAccrual: 1.25,
    sickLeaveBalance: 10,
    sickLeaveRenewCycle: '1 year',
    familyLeaveBalance: 3,
    claims: [],
    loans: [],
    bonuses: [],
    payslips: [],
    leaveRequests: []
  };
  users.push(newUser);
  saveTable('users', users);
  logAction(username, 'Create User Account', `Registered new member: ${newUser.name} with role "${newUser.role}"`);
  return { success: true, user: newUser };
};

export const blockSystemUser = (username, userId, blockState) => {
  const users = getTable('users') || [];
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  
  users[idx].blocked = blockState;
  saveTable('users', users);
  logAction(username, blockState ? 'Block User Account' : 'Unblock User Account', `${blockState ? 'BLOCKED' : 'UNBLOCKED'} access for ${users[idx].name}`);
  return true;
};

export const resetUserPassword = (username, userId, newPin) => {
  const users = getTable('users') || [];
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return false;
  
  users[idx].pin = newPin;
  saveTable('users', users);
  logAction(username, 'Reset User PIN', `Reset access PIN for ${users[idx].name}`);
  return true;
};

export const saveCustomRole = (username, roleName, allowedTabs) => {
  const roles = getTable('customRoles') || [];
  const idx = roles.findIndex(r => r.name.toLowerCase() === roleName.toLowerCase());
  if (idx !== -1) {
    roles[idx].allowedTabs = allowedTabs;
  } else {
    roles.push({
      id: `rol-${Date.now()}`,
      name: roleName,
      allowedTabs
    });
  }
  saveTable('customRoles', roles);
  logAction(username, 'Configure Custom Role', `Saved permission criteria for custom role: "${roleName}" (${allowedTabs.length} tabs allowed)`);
  return true;
};

export const developerBypassResetClientEmail = (developerName, clientId, newEmail) => {
  const clients = getTable('clients') || [];
  const idx = clients.findIndex(c => c.id === clientId);
  if (idx === -1) return false;
  
  const prevEmail = clients[idx].email;
  clients[idx].email = newEmail;
  saveTable('clients', clients);
  logAction('System', 'SaaS Developer Bypass Action', `Bypassed standard client email check to overwrite ${clients[idx].name}'s email from "${prevEmail}" to "${newEmail}"`);
  return true;
};
