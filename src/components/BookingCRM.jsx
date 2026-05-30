import React, { useState, useEffect } from 'react';
import {
  Users, Calendar as CalendarIcon, CreditCard, Layers, Shield, Settings,
  TrendingUp, Award, FileText, BarChart2, Trash2, Plus, Check, ArrowRight,
  UserCheck, AlertTriangle, RefreshCw, Printer, Search, Mail, Bell,
  User, CheckCircle, Clock, Send, ShieldAlert, DollarSign, Briefcase, Wrench, Package, Lock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend
} from 'recharts';

import {
  getTable,
  logAction,
  addAppointment,
  updateAppointmentStatus,
  addClient,
  addInvoice,
  addPaymentToInvoice,
  refundInvoice,
  addQuote,
  convertQuoteToInvoice,
  updateInventoryItemStock,
  addInventoryItem,
  updateMachineDetails,
  logMachineMaintenance,
  addExpense,
  addToWaitlist,
  deleteFromWaitlist,
  addShiftOrLeave,
  updateProduct,
  addProduct,
  checkScheduleConflict,
  getStaffCommissions
} from '../db/stateEngine';

export default function BookingCRM() {
  // SAAS remote suspension check
  const [isSuspended, setIsSuspended] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('owner'); // owner, receptionist, therapist
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared database tables
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [machines, setMachines] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [products, setProducts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [shifts, setShifts] = useState([]);

  // Modals & form state bindings
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);
  const [activePrintInvoice, setActivePrintInvoice] = useState(null);
  const [activeRefundInvoice, setActiveRefundInvoice] = useState(null);

  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Form states
  const [bookingForm, setBookingForm] = useState({
    clientId: 'cli-101', serviceId: 'srv-1', staffId: 'usr-3', room: 'Treatment Room 1',
    machineId: 'vacutherm-alpha', date: '2026-05-30', time: '09:00', duration: 30, notes: ''
  });
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', dob: '1990-01-01', gender: 'Female', allergies: '', medical: '', preferredStaff: '', notes: '' });
  const [productForm, setProductForm] = useState({ name: '', price: 250, stock: 10, category: 'Facial Products', description: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'Card' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Utilities', description: '', amount: 0 });
  const [refundForm, setRefundForm] = useState({ reason: '' });

  const syncDatabase = () => {
    // Check SaaS rent lock status
    const isLocked = localStorage.getItem('saas_lock') === 'true';
    setIsSuspended(isLocked);

    setClients(getTable('clients'));
    setAppointments(getTable('appointments'));
    setServices(getTable('services'));
    setMachines(getTable('machines'));
    setInventory(getTable('inventory'));
    setInvoices(getTable('invoices'));
    setQuotes(getTable('quotes'));
    setProducts(getTable('products'));
    setExpenses(getTable('expenses'));
    setWaitlist(getTable('waitlist'));
    setAuditLogs(getTable('auditLogs'));
    setSettings(getTable('settings'));
    setShifts(getTable('staffShifts'));
  };

  useEffect(() => {
    syncDatabase();
    const handleSync = () => syncDatabase();
    window.addEventListener('salon_db_sync', handleSync);
    return () => window.removeEventListener('salon_db_sync', handleSync);
  }, []);

  useEffect(() => {
    if (currentUserRole === 'therapist' && ['inventory', 'settings', 'audit'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
    if (currentUserRole === 'receptionist' && ['settings', 'audit'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUserRole]);

  const currentUserName = () => {
    if (currentUserRole === 'owner') return 'Victoria Owner';
    if (currentUserRole === 'receptionist') return 'Sarah Desk';
    return 'Jessica Laser';
  };

  return (
    <div className="salon-container" style={{ minHeight: '100vh', backgroundColor: 'hsl(var(--brand-black))' }}>
      
      {/* 1. REMOTE SUSPENSION SHIELD PADLOCK */}
      {isSuspended && (
        <div className="rent-suspend-overlay" style={{ zIndex: 100000 }}>
          <Lock className="rent-lock-shield" style={{ width: '64px', height: '64px' }} />
          <h2 style={{ color: '#ef4444', fontFamily: 'Outfit', fontWeight: 800 }}>STUDIO SUITE SUSPENDED</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', maxWidth: '400px', lineHeight: '1.5', marginTop: '10px' }}>
            Access to **{settings.salonName}** internal receptionist grids and billing ledgers has been remotely suspended.
          </p>
          <div style={{ margin: '20px 0', padding: '12px', border: '1px dashed #ef4444', borderRadius: '10px', fontSize: '0.78rem', color: '#fca5a5' }}>
            Settle outstanding monthly license rent of **R 2,800** with the platform provider to unlock your dashboard.
          </div>
          <button
            onClick={() => {
              localStorage.setItem('saas_lock', 'false');
              logAction('SaaS Provider Tech', 'Settle Rental Invoice', 'Rental fee processed. Unlocking reception grids.');
              setIsSuspended(false);
            }}
            className="btn-brand-gold"
          >
            Mock Settle R 2,800 Rent
          </button>
        </div>
      )}

      {/* LEFT NAVIGATION MENU */}
      <aside style={{ backgroundColor: 'hsl(var(--brand-charcoal))', borderRight: '1px solid rgba(107, 44, 145, 0.2)', padding: '24px 16px', display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
            <img src="/logo.jpg" style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="S&G" />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit', margin: 0 }}>SCULPT CRM</h2>
              <span style={{ fontSize: '0.62rem', tracking: '0.1em', color: '#D4AF37', fontWeight: 700 }}>Management Suite</span>
            </div>
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { id: 'dashboard', label: 'Calendar Grid', icon: CalendarIcon, roles: ['owner', 'receptionist', 'therapist'] },
              { id: 'analytics', label: 'Financial ROI', icon: BarChart2, roles: ['owner'] },
              { id: 'crm', label: 'Clients CRM', icon: Users, roles: ['owner', 'receptionist', 'therapist'] },
              { id: 'billing', label: 'Billing Invoices', icon: CreditCard, roles: ['owner', 'receptionist'] },
              { id: 'products', label: 'Products & Shop Sync', icon: Package, roles: ['owner', 'receptionist'] },
              { id: 'inventory', label: 'Consumables Stock', icon: Wrench, roles: ['owner', 'receptionist'] },
              { id: 'therapist', label: 'Therapist Shifts', icon: Briefcase, roles: ['owner', 'receptionist', 'therapist'] },
              { id: 'settings', label: 'Salon Settings', icon: Settings, roles: ['owner'] },
              { id: 'audit', label: 'Security Audits', icon: Shield, roles: ['owner'] }
            ].map(tab => {
              if (!tab.roles.includes(currentUserRole)) return null;
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%', border: 'none',
                    padding: '12px 16px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 500,
                    backgroundColor: isActive ? 'hsl(var(--brand-purple))' : 'transparent',
                    color: isActive ? 'white' : '#BFA6D8',
                    cursor: 'pointer', textAlign: 'left', transition: 'var(--transition-smooth)'
                  }}
                >
                  <Icon style={{ width: '16px', height: '16px' }} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div>
          <div style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '12px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.2)', fontSize: '0.78rem' }}>
            <span style={{ color: '#A89684', display: 'block', marginBottom: '4px' }}>Roster Session:</span>
            <strong style={{ display: 'block', color: '#D4AF37' }}>{currentUserName()}</strong>
            <span style={{ fontSize: '0.68rem', color: '#BFA6D8', textTransform: 'capitalize' }}>Role: {currentUserRole}</span>
          </div>
        </div>
      </aside>

      {/* MAIN CANVAS */}
      <main style={{ padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
        
        {/* ROLE SIMULATOR HEADER */}
        <header style={{ display: 'flex', justify: 'space-between', alignItems: 'center', backgroundColor: 'hsl(var(--brand-charcoal))', border: '1px solid rgba(107, 44, 145, 0.2)', padding: '12px 24px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, uppercase: true, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldAlert style={{ width: '14px', height: '14px' }} /> Role SandBox:</span>
            <div style={{ display: 'flex', backgroundColor: 'hsl(var(--brand-black))', padding: '3px', borderRadius: '8px', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
              {[
                { id: 'owner', label: 'Owner/Manager' },
                { id: 'receptionist', label: 'Receptionist' },
                { id: 'therapist', label: 'Therapist' }
              ].map(roleOpt => (
                <button
                  key={roleOpt.id}
                  onClick={() => {
                    setCurrentUserRole(roleOpt.id);
                    logAction(currentUserName(), 'Switch Role', `Swapped active simulator workspace role to ${roleOpt.id}`);
                  }}
                  style={{
                    backgroundColor: currentUserRole === roleOpt.id ? 'hsl(var(--brand-purple))' : 'transparent',
                    border: 'none', color: currentUserRole === roleOpt.id ? 'white' : '#BFA6D8',
                    padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer'
                  }}
                >
                  {roleOpt.label}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className="btn-brand-purple"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            ← SaaS Hub
          </button>
        </header>

        {/* ======================================================= */}
        {/* TABS INTERNAL VIEWS                                     */}
        {/* ======================================================= */}

        {/* TABS: CALENDAR schedule */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Studio Scheduling</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Reception calendar grids with smart double-booking checkers.</p>
              </div>
              {currentUserRole !== 'therapist' && (
                <button className="btn-brand-gold" onClick={() => setShowBookingModal(true)}>
                  <Plus style={{ width: '16px', height: '16px' }} /> Manual Booking
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
              
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px' }}>Upcoming Appointments (Today & Tomorrow)</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {appointments.map(apt => {
                    const client = clients.find(c => c.id === apt.clientId);
                    const service = services.find(s => s.id === apt.serviceId);
                    
                    if (currentUserRole === 'therapist' && apt.staffId !== 'usr-3') return null;

                    return (
                      <div key={apt.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', borderLeft: `4px solid hsl(var(--status-${apt.status.toLowerCase()}))`, borderRight: '1px solid rgba(107, 44, 145, 0.15)', borderTop: '1px solid rgba(107, 44, 145, 0.15)', borderBottom: '1px solid rgba(107, 44, 145, 0.15)' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.9rem' }}>{apt.time}</span>
                            <strong style={{ fontSize: '0.9rem', color: 'white' }}>{client?.name}</strong>
                            <span className={`badge-brand ${apt.status.toLowerCase()}`} style={{ fontSize: '0.55rem' }}>{apt.status}</span>
                          </div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#BFA6D8', marginTop: '4px' }}>
                            {service?.name} ({apt.room})
                          </span>
                        </div>

                        <select
                          value={apt.status}
                          onChange={(e) => {
                            updateAppointmentStatus(currentUserName(), apt.id, e.target.value);
                            syncDatabase();
                          }}
                          style={{ backgroundColor: 'hsl(var(--brand-charcoal))', color: 'white', border: '1px solid rgba(107, 44, 145, 0.3)', borderRadius: '6px', fontSize: '0.72rem', padding: '4px' }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Checked-in">Checked-in</option>
                          <option value="In-progress">In-progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Renders Waitlist & Ratios lists */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card-premium">
                  <h4 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 12px 0', fontSize: '0.92rem' }}>Roster Waitlist</h4>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {waitlist.length === 0 ? (
                      <span style={{ fontSize: '#0.78rem', color: '#A89684' }}>No clients waiting.</span>
                    ) : (
                      waitlist.map(wt => {
                        const cli = clients.find(c => c.id === wt.clientId);
                        const srv = services.find(s => s.id === wt.serviceId);
                        return (
                          <div key={wt.id} style={{ padding: '8px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '6px', fontSize: '0.72rem', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                            <strong>{cli?.name}</strong>
                            <span style={{ display: 'block', color: '#BFA6D8', marginTop: '2px' }}>Needs: {srv?.name}</span>
                            <button
                              onClick={() => {
                                deleteFromWaitlist(currentUserName(), wt.id);
                                syncDatabase();
                              }}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', display: 'block', marginTop: '4px', fontSize: '0.65rem' }}
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TABS: FINANCIAL ROI OVERVIEWS (OWNER ONLY) */}
        {activeTab === 'analytics' && currentUserRole === 'owner' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Financial Analysis</h1>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Revenue trends, monthly margins, and machinery ROI calculations.</p>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div className="card-premium card-stat">
                <span>Daily Sales</span>
                <h2 style={{ color: '#D4AF37', margin: '6px 0 0 0' }}>
                  R {invoices.filter(i => i.date === '2026-05-30').reduce((acc, i) => acc + i.total, 0).toFixed(2)}
                </h2>
              </div>
              <div className="card-premium card-stat">
                <span>Monthly Income</span>
                <h2 style={{ color: '#34d399', margin: '6px 0 0 0' }}>
                  R {invoices.reduce((acc, i) => acc + i.total, 0).toFixed(2)}
                </h2>
              </div>
              <div className="card-premium card-stat">
                <span>Operating Expenses</span>
                <h2 style={{ color: '#ef4444', margin: '6px 0 0 0' }}>
                  R {expenses.reduce((acc, e) => acc + e.amount, 0).toFixed(2)}
                </h2>
              </div>
            </div>

            {/* Recharts Area */}
            <div className="card-premium" style={{ height: '320px' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', marginBottom: '16px' }}>Income vs Expenses Trend</h3>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart
                  data={[
                    { month: 'Jan', Sales: 8000, Expenses: 3200 },
                    { month: 'Feb', Sales: 11000, Expenses: 4100 },
                    { month: 'Mar', Sales: 14500, Expenses: 4300 },
                    { month: 'Apr', Sales: 18000, Expenses: 5800 },
                    { month: 'May', Sales: invoices.reduce((acc, i) => acc + i.total, 0), Expenses: expenses.reduce((acc, e) => acc + e.amount, 0) }
                  ]}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="month" stroke="#A89684" />
                  <YAxis stroke="#A89684" />
                  <Tooltip contentStyle={{ backgroundColor: '#1A1A1A', borderColor: '#444' }} />
                  <Area type="monotone" dataKey="Sales" stroke="#D4AF37" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                  <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fill="none" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Machinery ROI logs */}
            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', marginBottom: '16px' }}>Equipment Yield & ROI calculations</h3>
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Hardware Name</th>
                    <th>Purchase Cost</th>
                    <th>Revenue Yield</th>
                    <th>Est. ROI %</th>
                    <th>Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {machines.map(m => {
                    const roi = ((m.revenueGenerated / m.purchaseCost) * 100).toFixed(1);
                    return (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>R {m.purchaseCost.toFixed(2)}</td>
                        <td style={{ color: '#34d399', fontWeight: 700 }}>R {m.revenueGenerated.toFixed(2)}</td>
                        <td><strong>{roi}%</strong></td>
                        <td>{m.totalUsageHours} hrs</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* TABS: CLIENTS CRM */}
        {activeTab === 'crm' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            
            {/* CRM Directory */}
            <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto' }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', color: '#A89684' }} />
                <input
                  type="text"
                  placeholder="Search CRM roster..."
                  className="brand-input"
                  style={{ paddingLeft: '34px' }}
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {clients
                  .filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
                  .map(cli => (
                    <button
                      key={cli.id}
                      onClick={() => setSelectedClient(cli)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: 'none',
                        backgroundColor: selectedClient?.id === cli.id ? 'hsl(var(--brand-purple))' : 'hsl(var(--brand-black))',
                        borderRadius: '10px', borderLeft: selectedClient?.id === cli.id ? '4px solid #D4AF37' : '1px solid rgba(107, 44, 145, 0.15)',
                        color: 'white', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition-smooth)'
                      }}
                    >
                      <img src={cli.profilePhoto} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} alt={cli.name} />
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem' }}>{cli.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: '#BFA6D8' }}>VIP: {cli.vipTier} • {cli.loyaltyPoints} Pts</span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Selected CRM sheet */}
            <div className="card-premium">
              {selectedClient ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(107, 44, 145, 0.2)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <img src={selectedClient.profilePhoto} style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover' }} alt={selectedClient.name} />
                      <div>
                        <h2 style={{ fontFamily: 'Outfit', fontSize: '1.35rem', margin: 0 }}>{selectedClient.name}</h2>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                          <span className="badge-brand gold" style={{ fontSize: '0.55rem' }}>VIP: {selectedClient.vipTier}</span>
                          <span className="badge-brand purple" style={{ fontSize: '0.55rem' }}>⚡ {selectedClient.loyaltyPoints} Glow Points</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '14px', borderRadius: '10px', border: '1px solid rgba(225,29,72,0.3)' }}>
                      <h4 style={{ color: '#ef4444', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}><AlertTriangle style={{ width: '14px', height: '14px' }} /> Allergy warnings</h4>
                      <p style={{ fontSize: '0.8rem', margin: 0, color: 'white' }}>{selectedClient.allergies || 'None recorded.'}</p>
                    </div>
                    <div style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '14px', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.3)' }}>
                      <h4 style={{ color: '#34d399', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}><Shield style={{ width: '14px', height: '14px' }} /> Medical History</h4>
                      <p style={{ fontSize: '0.8rem', margin: 0, color: 'white' }}>{selectedClient.medical || 'None noted.'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontFamily: 'Outfit', fontSize: '0.9rem', marginBottom: '6px' }}>CRM Consultant Notes</h4>
                    <p style={{ fontSize: '#0.85rem', color: '#BFA6D8', lineHeight: '1.4' }}>{selectedClient.notes}</p>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px', color: '#A89684' }}>
                  <Users style={{ width: '40px', height: '40px', marginBottom: '12px' }} />
                  <h4>Select CRM Profile</h4>
                  <span style={{ fontSize: '0.78rem' }}>Choose a client folder from the list on the left to review.</span>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TABS: BILLING LEDGER */}
        {activeTab === 'billing' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Invoices & Quotes ledger</h1>
            
            <div className="card-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Client Name</th>
                    <th>Total Slip</th>
                    <th>Status</th>
                    <th>Payments / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => {
                    const cli = clients.find(c => c.id === inv.clientId);
                    return (
                      <tr key={inv.id}>
                        <td><strong>{inv.invoiceNumber}</strong><br/><span style={{ fontSize: '0.7rem', color: '#A89684' }}>{inv.date}</span></td>
                        <td>{cli ? cli.name : 'Walk-in Guest'}</td>
                        <td><strong>R {inv.total.toFixed(2)}</strong></td>
                        <td><span className={`badge-brand ${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {inv.status === 'Unpaid' && (
                              <button
                                onClick={() => {
                                  setActivePaymentInvoice(inv);
                                  setPaymentForm({ amount: inv.total, method: 'Card' });
                                  setShowPaymentModal(true);
                                }}
                                style={{ border: 'none', backgroundColor: '#34d39933', color: '#34d399', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                              >
                                Pay
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setActivePrintInvoice(inv);
                                setShowPrintModal(true);
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: 'hsl(var(--brand-black))', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}
                            >
                              <Printer style={{ width: '12px', height: '12px' }} /> Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS: PRODUCTS CATALOG SYNC */}
        {activeTab === 'products' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>E-Commerce Storefront Sync</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Manage products catalog here. Changes instantly update the consumer-facing Website storefront and App!</p>
              </div>
              <button className="btn-brand-gold" onClick={() => setShowProductModal(true)}>+ Add Product</button>
            </div>

            <div className="card-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Product Descr</th>
                    <th>Price</th>
                    <th>Current Stock</th>
                    <th>E-Commerce Visibility</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.id}>
                      <td><strong>{prod.name}</strong><br/><span style={{ fontSize: '0.7rem', color: '#BFA6D8' }}>{prod.category}</span></td>
                      <td><strong>R {prod.price}</strong></td>
                      <td>
                        <strong style={{ color: prod.stock <= 0 ? '#ef4444' : '#34d399' }}>{prod.stock} items</strong>
                      </td>
                      <td>
                        <span className={`badge-brand ${prod.stock <= 0 ? 'cancelled' : 'gold'}`} style={{ fontSize: '0.55rem' }}>
                          {prod.stock <= 0 ? 'Marked Out-Stock' : 'Live on Shop'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              const newPrice = prompt(`Enter new price for ${prod.name}:`, prod.price);
                              if (newPrice) {
                                updateProduct('Dashboard Admin', { id: prod.id, name: prod.name, price: Number(newPrice) });
                                syncDatabase();
                              }
                            }}
                            style={{ border: 'none', backgroundColor: 'hsl(var(--brand-black))', color: 'white', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}
                          >
                            Edit Price
                          </button>
                          <button
                            onClick={() => {
                              updateProduct('Dashboard Admin', { id: prod.id, name: prod.name, stock: prod.stock === 0 ? 15 : 0 });
                              syncDatabase();
                            }}
                            style={{
                              border: 'none',
                              backgroundColor: prod.stock === 0 ? '#34d39933' : '#ef444433',
                              color: prod.stock === 0 ? '#34d399' : '#ef4444',
                              padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem'
                            }}
                          >
                            {prod.stock === 0 ? 'Set In-Stock' : 'Set Out-Stock'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS: STOCK CONSUMABLES */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Clinical Consumables ledgers</h1>
            
            <div className="card-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Quantity Level</th>
                    <th>Alert Threshold</th>
                    <th>Supplier</th>
                    <th>Adjust Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.alert_at;
                    return (
                      <tr key={item.id} style={{ backgroundColor: isLow ? '#ef444410' : 'transparent' }}>
                        <td><strong>{item.name}</strong></td>
                        <td><strong style={{ color: isLow ? '#ef4444' : '#34d399' }}>{item.quantity} {item.unit}</strong></td>
                        <td>{item.alert_at} {item.unit}</td>
                        <td>{item.supplier}</td>
                        <td>
                          <button
                            onClick={() => {
                              updateInventoryItemStock('Dashboard Admin', item.id, 50);
                              syncDatabase();
                            }}
                            className="btn-brand-purple"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          >
                            +50 Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS: THERAPIST HUB */}
        {activeTab === 'therapist' && (
          <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px' }}>Shift schedules (Today)</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {shifts.map(shf => {
                  const staff = getTable('users').find(u => u.id === shf.staffId);
                  return (
                    <div key={shf.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                      <div>
                        <strong>{staff?.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#BFA6D8', marginTop: '2px' }}>Role: {staff?.role}</span>
                      </div>
                      <strong>{shf.startTime} - {shf.endTime}</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Commissions report */}
            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: '#D4AF37', marginBottom: '16px' }}>Staff Commissions Splits</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {getTable('users').filter(u => u.role !== 'owner').map(staff => {
                  const comm = getStaffCommissions(staff.id);
                  return (
                    <div key={staff.id} style={{ padding: '14px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', border: '1px solid rgba(107, 44, 145, 0.15)', fontSize: '0.8rem' }}>
                      <strong style={{ display: 'block', fontSize: '0.9rem', color: 'white', marginBottom: '6px' }}>{staff.name}</strong>
                      <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8', marginBottom: '4px' }}>
                        <span>Service split (10%):</span>
                        <span>R {comm.serviceComm.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8', borderBottom: '1px solid rgba(107, 44, 145, 0.15)', paddingBottom: '6px', marginBottom: '6px' }}>
                        <span>Product split (5%):</span>
                        <span>R {comm.productComm.toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', fontWeight: 700, color: '#34d399' }}>
                        <span>Total Payout:</span>
                        <span>R {comm.total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TABS: SECURITY AUDITS (OWNER ONLY) */}
        {activeTab === 'audit' && currentUserRole === 'owner' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Security audit logs</h1>
            
            <div className="card-premium">
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', color: '#A89684' }} />
                <input
                  type="text"
                  placeholder="Search logs by action or user..."
                  className="brand-input"
                  style={{ paddingLeft: '34px' }}
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>

              <table className="table-premium">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs
                    .filter(log => log.username.toLowerCase().includes(auditSearch.toLowerCase()) || log.action.toLowerCase().includes(auditSearch.toLowerCase()))
                    .map(log => (
                      <tr key={log.id}>
                        <td><strong>{log.username}</strong></td>
                        <td><span className="badge-brand purple" style={{ fontSize: '0.55rem' }}>{log.action}</span></td>
                        <td style={{ fontSize: '0.8rem' }}>{log.details}</td>
                        <td style={{ fontSize: '0.72rem', color: '#A89684' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABS: SETTINGS */}
        {activeTab === 'settings' && currentUserRole === 'owner' && (
          <div className="card-premium animate-fade-in">
            <h3 style={{ fontFamily: 'Outfit', color: 'white', marginBottom: '16px' }}>Salon Configurations</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>Salon Name:</label>
                  <input type="text" className="brand-input" defaultValue={settings.salonName} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>VAT rate (%):</label>
                  <input type="number" className="brand-input" defaultValue={settings.vatRate} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>Phone:</label>
                  <input type="text" className="brand-input" defaultValue={settings.phone} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>Email:</label>
                  <input type="text" className="brand-input" defaultValue={settings.email} />
                </div>
              </div>
              <button onClick={() => alert('Settings synced!')} className="btn-brand-gold" style={{ alignSelf: 'flex-start' }}>Save Parameters</button>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================= */}
      {/*   DASHBOARD DIALOGUES POPUPS                            */}
      {/* ======================================================= */}

      {/* MODAL: MANUAL BOOKINGS FORM */}
      {showBookingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Settle Manual Appointment</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Client:</label>
                <select className="brand-input" onChange={(e) => setBookingForm(prev => ({ ...prev, clientId: e.target.value }))}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Service:</label>
                <select className="brand-input" onChange={(e) => {
                  const srv = services.find(s => s.id === e.target.value);
                  setBookingForm(prev => ({ ...prev, serviceId: e.target.value, duration: srv ? srv.duration : 30, machineId: srv ? srv.requiredMachine || '' : '' }));
                }}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} (R {s.price})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Date:</label>
                  <input type="date" className="brand-input" value={bookingForm.date} onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Time:</label>
                  <input type="time" className="brand-input" value={bookingForm.time} onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    const res = addAppointment('Reception Desk', bookingForm);
                    if (!res.success) {
                      alert(`Smart Scheduler Block:\n\n${res.error}`);
                    } else {
                      setShowBookingModal(false);
                      syncDatabase();
                    }
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Settle Roster
                </button>
                <button onClick={() => setShowBookingModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOCK PRINT THERMAL INVOICE RECEIPT */}
      {showPrintModal && activePrintInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '420px', backgroundColor: 'white', color: '#1e293b', border: 'none', padding: '32px' }}>
            <div style={{ fontFamily: 'Courier New, monospace', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #94a3b8', paddingBottom: '12px' }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, margin: 0, color: '#0f172a' }}>SCULPT & GLOW</h3>
                <span style={{ fontSize: '0.78rem' }}>Pretoria East Galleria, South Africa</span>
              </div>
              <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.8rem' }}>
                <span>ID: {activePrintInvoice.invoiceNumber}</span>
                <span>Date: {activePrintInvoice.date}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #94a3b8', paddingBottom: '10px' }}>
                <table style={{ width: '100%', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ textAlign: 'left' }}>Item</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePrintInvoice.items?.map((item, i) => (
                      <tr key={i}>
                        <td style={{ paddingTop: '4px' }}>{item.name}</td>
                        <td style={{ textAlign: 'center', paddingTop: '4px' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', paddingTop: '4px' }}>R {item.price.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem', alignSelf: 'flex-end', width: '160px' }}>
                <div style={{ display: 'flex', justify: 'space-between' }}>
                  <span>VAT (15%):</span>
                  <span>R {activePrintInvoice.tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justify: 'space-between', fontWeight: 700, fontSize: '0.92rem', borderTop: '1px solid #94a3b8', paddingTop: '4px', color: '#0f172a' }}>
                  <span>Total:</span>
                  <span>R {activePrintInvoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
              <button onClick={() => window.print()} className="btn-brand-gold" style={{ width: '100%', justifyContent: 'center' }}>Print</button>
              <button onClick={() => setShowPrintModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center', color: '#0f172a', border: '1px solid #cbd5e1' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT TO SYNC */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Sync E-Commerce Product</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Product Name:</label>
                <input type="text" className="brand-input" onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Price (R):</label>
                  <input type="number" className="brand-input" defaultValue={productForm.price} onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Stock:</label>
                  <input type="number" className="brand-input" defaultValue={productForm.stock} onChange={(e) => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Category:</label>
                <select className="brand-input" onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}>
                  <option value="Facial Products">Facial Products</option>
                  <option value="Weight Loss Products">Weight Loss Products</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Image URL:</label>
                <input type="text" className="brand-input" defaultValue="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300" onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    addProduct('Dashboard Admin', { ...productForm, image: productForm.image || 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300' });
                    setShowProductModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Create & Sync
                </button>
                <button onClick={() => setShowProductModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CAPTURE PAYMENT FORM */}
      {showPaymentModal && activePaymentInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '380px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Capture Sales Invoice Payment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Method:</label>
                <select className="brand-input" value={paymentForm.method} onChange={(e) => setPaymentForm(prev => ({ ...prev, method: e.target.value }))}>
                  <option value="Card">Visa/Mastercard</option>
                  <option value="Cash">Cash Drawer</option>
                  <option value="EFT">EFT Bank Transfer</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Amount to Pay (R):</label>
                <input type="number" className="brand-input" value={paymentForm.amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    addPaymentToInvoice(currentUserName(), activePaymentInvoice.id, paymentForm);
                    setShowPaymentModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Capture Deposit
                </button>
                <button onClick={() => setShowPaymentModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
