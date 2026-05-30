import React, { useState, useEffect } from 'react';
import {
  Users, Calendar as CalendarIcon, CreditCard, Layers, Shield, Settings,
  TrendingUp, Award, FileText, BarChart2, Trash2, Plus, Check, ArrowRight,
  UserCheck, AlertTriangle, RefreshCw, Printer, Search, Mail, Bell,
  User, CheckCircle, Clock, Send, ShieldAlert, DollarSign, Briefcase, Wrench,
  Package, Lock, ChevronDown, ChevronRight, Image as ImageIcon, Heart,
  Sliders, Star, Percent, MessageSquare, PhoneCall, Volume2, ShieldCheck, Download
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
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
  deleteShiftOrLeave,
  updateProduct,
  addProduct,
  checkScheduleConflict,
  getStaffCommissions,
  updateSettings
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

  // Sidebar Accordion Folding State
  const [expandedFolders, setExpandedFolders] = useState({
    core: true,
    clients: true,
    billing: false,
    catalog: false,
    hr: false,
    admin: false
  });

  // Sidebar Search State
  const [sidebarSearch, setSidebarSearch] = useState('');

  // Modals & form state bindings
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  // Active items for detail overlays
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);
  const [activePrintInvoice, setActivePrintInvoice] = useState(null);
  const [activeRefundInvoice, setActiveRefundInvoice] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  // Dynamic filter lists
  const [clientSearch, setClientSearch] = useState('');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');

  // Form states
  const [bookingForm, setBookingForm] = useState({
    clientId: '', serviceId: '', staffId: 'usr-3', room: 'Treatment Room 1',
    machineId: '', date: new Date().toISOString().split('T')[0], time: '09:00', duration: 30, notes: ''
  });
  const [clientForm, setClientForm] = useState({
    name: '', email: '', phone: '', dob: '1995-01-01', gender: 'Female',
    allergies: '', medical: '', preferredStaff: 'Jessica Laser', notes: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', price: 250, stock: 10, category: 'Facial Products', description: '', image: ''
  });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'Card' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Utilities', description: '', amount: 0 });
  const [refundForm, setRefundForm] = useState({ reason: '' });
  const [waitlistForm, setWaitlistForm] = useState({ clientId: '', serviceId: '', notes: '' });
  const [shiftForm, setShiftForm] = useState({ staffId: 'usr-3', date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '17:00', type: 'Shift', isLeave: false });
  const [campaignForm, setCampaignForm] = useState({ type: 'WhatsApp', message: 'Winter Glow Special! Get 20% off Cryo Fat Freezing this weekend. Book now!' });

  const [activeClientNotes, setActiveClientNotes] = useState('');
  const [consentForms, setConsentForms] = useState({
    consentPeel: false,
    consentCryo: false,
    consentGDPR: false
  });

  // Client progress tracking uploader
  const [progressForm, setProgressForm] = useState({ weight: 65, waist: 72, hips: 94 });

  // Custom quotes dynamic item builder
  const [quoteItems, setQuoteItems] = useState([{ name: '', quantity: 1, price: 0 }]);
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteClient, setQuoteClient] = useState('');

  // Bulk WhatsApp Blaster simulation states
  const [blastingActive, setBlastingActive] = useState(false);
  const [blastingProgress, setBlastingProgress] = useState(0);

  const syncDatabase = () => {
    // Check SaaS rent lock status
    const isLocked = localStorage.getItem('saas_lock') === 'true';
    setIsSuspended(isLocked);

    const activeClients = getTable('clients');
    setClients(activeClients);
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

    // Automatically set default items inside dropdown modals
    if (activeClients.length > 0 && !bookingForm.clientId) {
      setBookingForm(prev => ({ ...prev, clientId: activeClients[0].id }));
      setWaitlistForm(prev => ({ ...prev, clientId: activeClients[0].id }));
    }
    const activeServices = getTable('services');
    if (activeServices.length > 0 && !bookingForm.serviceId) {
      setBookingForm(prev => ({ ...prev, serviceId: activeServices[0].id, duration: activeServices[0].duration }));
      setWaitlistForm(prev => ({ ...prev, serviceId: activeServices[0].id }));
    }
  };

  useEffect(() => {
    syncDatabase();
    const handleSync = () => syncDatabase();
    window.addEventListener('salon_db_sync', handleSync);
    return () => window.removeEventListener('salon_db_sync', handleSync);
  }, []);

  // Update notes if selected client changes
  useEffect(() => {
    if (selectedClient) {
      setActiveClientNotes(selectedClient.notes || '');
    }
  }, [selectedClient]);

  // Restrict access depending on simulated role boundaries
  useEffect(() => {
    const safeTabsByRole = {
      owner: ['dashboard', 'waitlist', 'rooms', 'crm', 'loyalty', 'gallery', 'billing', 'quotes', 'expenses', 'payments', 'services', 'products', 'inventory', 'therapist', 'commissions', 'settings', 'audit', 'campaigns'],
      receptionist: ['dashboard', 'waitlist', 'rooms', 'crm', 'loyalty', 'gallery', 'billing', 'quotes', 'payments', 'services', 'products', 'inventory', 'therapist', 'commissions'],
      therapist: ['dashboard', 'crm', 'gallery', 'therapist', 'commissions']
    };

    const allowed = safeTabsByRole[currentUserRole] || [];
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || 'dashboard');
    }
  }, [currentUserRole, activeTab]);

  const currentUserName = () => {
    if (currentUserRole === 'owner') return 'Victoria Owner';
    if (currentUserRole === 'receptionist') return 'Sarah Desk';
    return 'Jessica Laser';
  };

  const getRoleBadgeColor = (role) => {
    if (role === 'owner') return '#D4AF37'; // gold
    if (role === 'receptionist') return '#6B2C91'; // purple
    return '#34d399'; // green/teal
  };

  const toggleFolder = (folderName) => {
    setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  // Directory Folders configurations mapped with permissions and labels
  const sidebarNavigation = {
    core: {
      label: 'Operations & Booking',
      icon: CalendarIcon,
      items: [
        { id: 'dashboard', label: 'Calendar Grid', roles: ['owner', 'receptionist', 'therapist'] },
        { id: 'waitlist', label: 'Roster Waitlist', roles: ['owner', 'receptionist'] },
        { id: 'rooms', label: 'Room & Machine Booking', roles: ['owner', 'receptionist'] }
      ]
    },
    clients: {
      label: 'Client Relations (CRM)',
      icon: Users,
      items: [
        { id: 'crm', label: 'CRM Client Folders', roles: ['owner', 'receptionist', 'therapist'] },
        { id: 'loyalty', label: 'VIP & Glow Points', roles: ['owner', 'receptionist'] },
        { id: 'gallery', label: 'Before/After Progress', roles: ['owner', 'receptionist', 'therapist'] }
      ]
    },
    billing: {
      label: 'Finances & Accounting',
      icon: CreditCard,
      items: [
        { id: 'billing', label: 'Invoices Ledger', roles: ['owner', 'receptionist'] },
        { id: 'quotes', label: 'Quotes Generator', roles: ['owner', 'receptionist'] },
        { id: 'expenses', label: 'Operating Expenses', roles: ['owner'] },
        { id: 'payments', label: 'Refunds & Payments Log', roles: ['owner', 'receptionist'] }
      ]
    },
    catalog: {
      label: 'Storefront & Catalog',
      icon: Package,
      items: [
        { id: 'services', label: 'Services Config', roles: ['owner', 'receptionist'] },
        { id: 'products', label: 'Atelier Shop Sync', roles: ['owner', 'receptionist'] },
        { id: 'inventory', label: 'Consumables Stock', roles: ['owner', 'receptionist'] }
      ]
    },
    hr: {
      label: 'Staffing & HR',
      icon: Briefcase,
      items: [
        { id: 'therapist', label: 'Shift Roster Timeline', roles: ['owner', 'receptionist', 'therapist'] },
        { id: 'commissions', label: 'Commission Splits', roles: ['owner', 'receptionist', 'therapist'] }
      ]
    },
    admin: {
      label: 'System Administration',
      icon: Settings,
      items: [
        { id: 'settings', label: 'Salon Settings', roles: ['owner'] },
        { id: 'audit', label: 'Security Audits', roles: ['owner'] },
        { id: 'campaigns', label: 'Notification Campaigns', roles: ['owner'] }
      ]
    }
  };

  return (
    <div className="salon-container" style={{
      minHeight: '100vh',
      backgroundColor: 'hsl(var(--brand-black))',
      display: 'flex',
      flexDirection: 'row',
      fontFamily: 'Inter, sans-serif'
    }}>

      {/* 1. REMOTE SUSPENSION SHIELD OVERLAY */}
      {isSuspended && (
        <div className="rent-suspend-overlay" style={{ zIndex: 100000 }}>
          <Lock className="rent-lock-shield" style={{ width: '64px', height: '64px' }} />
          <h2 style={{ color: '#ef4444', fontFamily: 'Outfit', fontWeight: 800 }}>STUDIO SUITE SUSPENDED</h2>
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', maxWidth: '400px', lineHeight: '1.5', marginTop: '10px' }}>
            Access to **{settings.salonName || 'Sculpt & Glow'}** internal receptionist grids and billing ledgers has been remotely suspended by the platform provider.
          </p>
          <div style={{ margin: '20px 0', padding: '12px', border: '1px dashed #ef4444', borderRadius: '10px', fontSize: '0.78rem', color: '#fca5a5' }}>
            Settle outstanding monthly license rent of **R 2,800** to restore your database parameters.
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

      {/* ======================================================= */}
      {/*   2. STICKY COLLAPSIBLE DIRECTORY SIDEBAR               */}
      {/* ======================================================= */}
      <aside style={{
        width: '320px',
        minWidth: '320px',
        backgroundColor: 'hsl(var(--brand-charcoal))',
        borderRight: '1px solid rgba(107, 44, 145, 0.2)',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: 'auto'
      }}>
        <div>
          {/* Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', paddingLeft: '4px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundImage: 'url(/logo.jpg)', backgroundSize: 'cover',
              border: '1px solid hsl(var(--brand-gold))', boxShadow: '0 0 10px rgba(212,175,55,0.2)'
            }} />
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit', margin: 0, letterSpacing: '-0.02em' }}>SCULPT CRM</h2>
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>Reception Grid Suite</span>
            </div>
          </div>

          {/* Quick-Search Filter inside the sidebar menu */}
          <div style={{ position: 'relative', marginBottom: '20px' }}>
            <Search style={{ position: 'absolute', top: '9px', left: '10px', width: '14px', height: '14px', color: '#A89684' }} />
            <input
              type="text"
              placeholder="Search CRM operations..."
              className="brand-input"
              style={{ paddingLeft: '32px', fontSize: '0.78rem', height: '32px' }}
              value={sidebarSearch}
              onChange={(e) => setsidebarSearch(e.target.value)}
            />
          </div>

          {/* Accordion folders layout */}
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.keys(sidebarNavigation).map(folderKey => {
              const folder = sidebarNavigation[folderKey];
              const FolderIcon = folder.icon;

              // Filter sub-items by role and search query
              const filteredItems = folder.items.filter(item => {
                const matchesRole = item.roles.includes(currentUserRole);
                const matchesSearch = item.label.toLowerCase().includes(sidebarSearch.toLowerCase());
                return matchesRole && matchesSearch;
              });

              // Hide folder if it contains no relevant items for this role/search
              if (filteredItems.length === 0) return null;

              const isExpanded = expandedFolders[folderKey] || sidebarSearch.length > 0;

              return (
                <div key={folderKey} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {/* Folder Toggle Header */}
                  <button
                    onClick={() => toggleFolder(folderKey)}
                    style={{
                      display: 'flex', alignItems: 'center', justify: 'space-between', width: '100%',
                      background: 'none', border: 'none', padding: '8px 10px', color: '#BFA6D8',
                      fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
                      textTransform: 'uppercase', letterSpacing: '0.05em'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FolderIcon style={{ width: '14px', height: '14px', color: '#D4AF37' }} />
                      <span>{folder.label}</span>
                    </div>
                    {isExpanded ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                  </button>

                  {/* Folder contents list */}
                  {isExpanded && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '3px',
                      paddingLeft: '16px', borderLeft: '1px solid rgba(175, 150, 216, 0.15)', marginLeft: '16px'
                    }}>
                      {filteredItems.map(item => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '10px', width: '100%', border: 'none',
                              padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500,
                              backgroundColor: isActive ? 'hsl(var(--brand-purple))' : 'transparent',
                              borderLeft: isActive ? '3px solid #D4AF37' : '3px solid transparent',
                              color: isActive ? 'white' : '#A89684',
                              cursor: 'pointer', textAlign: 'left', transition: 'var(--transition-smooth)'
                            }}
                          >
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* User Card info inside sidebar */}
        <div style={{ borderTop: '1px solid rgba(107, 44, 145, 0.2)', paddingTop: '16px' }}>
          <div style={{
            backgroundColor: 'hsl(var(--brand-black))', padding: '12px',
            borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.2)', fontSize: '0.78rem'
          }}>
            <span style={{ color: '#A89684', display: 'block', marginBottom: '2px', fontSize: '0.7rem' }}>Reception Session:</span>
            <strong style={{ display: 'block', color: 'white', fontSize: '0.82rem' }}>{currentUserName()}</strong>
            <span style={{
              fontSize: '0.65rem', color: getRoleBadgeColor(currentUserRole),
              fontWeight: 700, textTransform: 'uppercase', tracking: '0.05em'
            }}>
              Role: {currentUserRole}
            </span>
          </div>
        </div>
      </aside>

      {/* ======================================================= */}
      {/*   3. MAIN WORKSPACE CANVAS                              */}
      {/* ======================================================= */}
      <main style={{
        padding: '32px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        flex: 1,
        height: '100vh',
        boxSizing: 'border-box'
      }}>

        {/* ROLE SIMULATOR HEADER */}
        <header style={{
          display: 'flex', justify: 'space-between', alignItems: 'center',
          backgroundColor: 'hsl(var(--brand-charcoal))', border: '1px solid rgba(107, 44, 145, 0.2)',
          padding: '12px 24px', borderRadius: '16px', boxShadow: 'var(--shadow-premium)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
              color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <ShieldAlert style={{ width: '14px', height: '14px' }} /> Sandbox Roles:
            </span>
            <div style={{
              display: 'flex', backgroundColor: 'hsl(var(--brand-black))',
              padding: '3px', borderRadius: '10px', border: '1px solid rgba(107, 44, 145, 0.15)'
            }}>
              {[
                { id: 'owner', label: 'Owner / Manager' },
                { id: 'receptionist', label: 'Receptionist' },
                { id: 'therapist', label: 'Therapist / Staff' }
              ].map(roleOpt => (
                <button
                  key={roleOpt.id}
                  onClick={() => {
                    setCurrentUserRole(roleOpt.id);
                    logAction(currentUserName(), 'Switch Role', `Swapped active simulator workspace role to ${roleOpt.label}`);
                  }}
                  style={{
                    backgroundColor: currentUserRole === roleOpt.id ? 'hsl(var(--brand-purple))' : 'transparent',
                    border: 'none', color: currentUserRole === roleOpt.id ? 'white' : '#BFA6D8',
                    padding: '6px 12px', fontSize: '0.72rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer'
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
            ← Elysium SaaS Hub
          </button>
        </header>

        {/* ======================================================= */}
        {/*   4. DETAILED SUB-VIEW WORKSPACE CONTENT                */}
        {/* ======================================================= */}

        {/* WORKSPACE A: CALENDAR SCHEDULER */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Calendar & Booking Grid</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Receptionist calendar grids with smart double-booking validation controls.</p>
              </div>
              {currentUserRole !== 'therapist' && (
                <button className="btn-brand-gold" onClick={() => setShowBookingModal(true)}>
                  <Plus style={{ width: '16px', height: '16px' }} /> Manual Appointment
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
              {/* Upcoming Appointments Table */}
              <div className="card-premium" style={{ height: 'fit-content' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Active Booking Schedule</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {appointments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#A89684', fontSize: '0.85rem' }}>No bookings recorded for today.</div>
                  ) : (
                    appointments.map(apt => {
                      const client = clients.find(c => c.id === apt.clientId);
                      const service = services.find(s => s.id === apt.serviceId);

                      // Therapist restriction: only see own appointments
                      if (currentUserRole === 'therapist' && apt.staffId !== 'usr-3') return null;

                      return (
                        <div key={apt.id} style={{
                          display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px',
                          backgroundColor: 'hsl(var(--brand-black))', borderRadius: '10px',
                          borderLeft: `4px solid hsl(var(--status-${apt.status.toLowerCase()}))`,
                          borderRight: '1px solid rgba(107, 44, 145, 0.15)',
                          borderTop: '1px solid rgba(107, 44, 145, 0.15)',
                          borderBottom: '1px solid rgba(107, 44, 145, 0.15)'
                        }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.9rem' }}>{apt.time}</span>
                              <strong style={{ fontSize: '0.9rem', color: 'white' }}>{client?.name || 'Walk-in'}</strong>
                              <span className={`badge-brand ${apt.status.toLowerCase()}`} style={{ fontSize: '0.55rem' }}>{apt.status}</span>
                            </div>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#BFA6D8', marginTop: '4px' }}>
                              {service?.name} ({apt.room}) {apt.machineId ? `• [${apt.machineId}]` : ''}
                            </span>
                            {apt.notes && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', fontStyle: 'italic', marginTop: '4px' }}>
                                Notes: {apt.notes}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <select
                              value={apt.status}
                              onChange={(e) => {
                                updateAppointmentStatus(currentUserName(), apt.id, e.target.value);
                                syncDatabase();
                              }}
                              style={{
                                backgroundColor: 'hsl(var(--brand-charcoal))', color: 'white',
                                border: '1px solid rgba(107, 44, 145, 0.3)', borderRadius: '6px',
                                fontSize: '0.72rem', padding: '4px'
                              }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Checked-in">Checked-in</option>
                              <option value="In-progress">In-progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Quick statistics sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card-premium">
                  <h4 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 12px 0', fontSize: '0.9rem' }}>Today's Overview</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justify: 'space-between' }}>
                      <span>Total Booked:</span>
                      <strong>{appointments.length} appointments</strong>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between' }}>
                      <span>Checked-in/In-Progress:</span>
                      <strong style={{ color: '#34d399' }}>
                        {appointments.filter(a => ['Checked-in', 'In-progress'].includes(a.status)).length}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justify: 'space-between' }}>
                      <span>Pending Confirmation:</span>
                      <strong style={{ color: 'orange' }}>
                        {appointments.filter(a => a.status === 'Pending').length}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="card-premium">
                  <h4 style={{ fontFamily: 'Outfit', color: '#BFA6D8', margin: '0 0 12px 0', fontSize: '0.9rem' }}>Quick Actions</h4>
                  <button onClick={() => setActiveTab('waitlist')} className="btn-brand-purple" style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'center', marginBottom: '8px' }}>
                    Open Waitlist Roster
                  </button>
                  <button onClick={() => setActiveTab('rooms')} className="btn-brand-purple" style={{ width: '100%', fontSize: '0.75rem', justifyContent: 'center' }}>
                    Inspect Room Slots
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE B: ROSTER WAITLIST */}
        {activeTab === 'waitlist' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Roster Waitlist System</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Auto-release and manual queues if clients cancel active slots.</p>
              </div>
              <button onClick={() => setShowWaitlistModal(true)} className="btn-brand-gold">
                <Plus style={{ width: '16px', height: '16px' }} /> Join Waitlist
              </button>
            </div>

            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Waitlisted Clients Queue</h3>
              {waitlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#A89684', fontSize: '0.85rem' }}>
                  The waitlist is currently empty.
                </div>
              ) : (
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client Name</th>
                      <th>Service Needed</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitlist.map(wt => {
                      const client = clients.find(c => c.id === wt.clientId);
                      const service = services.find(s => s.id === wt.serviceId);
                      return (
                        <tr key={wt.id}>
                          <td>{wt.date}</td>
                          <td><strong>{client?.name || 'Walk-in'}</strong></td>
                          <td>{service?.name}</td>
                          <td><span style={{ fontSize: '0.78rem', color: '#A89684' }}>{wt.notes || 'None'}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                onClick={() => {
                                  // Clear waitlist and add slot
                                  const confirmAssign = window.confirm(`Release waitlist for ${client?.name || 'Client'} and convert to active appointment?`);
                                  if (confirmAssign) {
                                    const res = addAppointment(currentUserName(), {
                                      clientId: wt.clientId,
                                      serviceId: wt.serviceId,
                                      staffId: wt.preferredStaffId || 'usr-3',
                                      room: 'Treatment Room 1',
                                      machineId: service?.requiredMachine || '',
                                      date: new Date().toISOString().split('T')[0],
                                      time: '12:00',
                                      duration: service?.duration || 30,
                                      notes: 'Released from waitlist queue'
                                    });
                                    if (res.success) {
                                      deleteFromWaitlist(currentUserName(), wt.id);
                                      syncDatabase();
                                      alert('Success! Waitlisted client allocated to active schedule.');
                                    } else {
                                      alert(`Allocation conflict! ${res.error}`);
                                    }
                                  }
                                }}
                                style={{ border: 'none', backgroundColor: '#34d39933', color: '#34d399', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                              >
                                Release Slot
                              </button>
                              <button
                                onClick={() => {
                                  deleteFromWaitlist(currentUserName(), wt.id);
                                  syncDatabase();
                                }}
                                style={{ border: 'none', backgroundColor: '#ef444433', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700 }}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* WORKSPACE C: ROOMS & MACHINES ALLOCATION */}
        {activeTab === 'rooms' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Room & Equipment Allocator</h1>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Track room layout occupancies and prevent overlapping machine demands.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Rooms Section */}
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Clinical Treatment Rooms</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {['Treatment Room 1', 'Treatment Room 2', 'Atelier Face Room'].map(room => {
                    const activeApts = appointments.filter(a => a.room === room && a.status !== 'Cancelled');
                    return (
                      <div key={room} style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '14px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: '#D4AF37' }}>{room}</strong>
                          <span className={`badge-brand ${activeApts.length > 0 ? 'cancelled' : 'completed'}`} style={{ fontSize: '0.6rem' }}>
                            {activeApts.length > 0 ? 'OCCUPIED' : 'VACANT'}
                          </span>
                        </div>
                        {activeApts.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: '#A89684' }}>Available for treatments.</span>
                        ) : (
                          activeApts.map(apt => {
                            const cli = clients.find(c => c.id === apt.clientId);
                            return (
                              <div key={apt.id} style={{ fontSize: '0.75rem', color: '#BFA6D8', marginTop: '4px' }}>
                                ⏰ {apt.time} - <strong>{cli?.name}</strong> ({apt.duration} mins)
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Machinery Conflicts checks */}
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Clinical Hardware Allocations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {machines.map(mach => {
                    const activeApts = appointments.filter(a => a.machineId === mach.id && a.status !== 'Cancelled');
                    return (
                      <div key={mach.id} style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '14px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: 'white' }}>{mach.name}</strong>
                          <span className="badge-brand gold" style={{ fontSize: '0.6rem' }}>{mach.currentStatus}</span>
                        </div>
                        {activeApts.length === 0 ? (
                          <span style={{ fontSize: '0.75rem', color: '#A89684' }}>No bookings utilizing this unit today.</span>
                        ) : (
                          activeApts.map(apt => {
                            const cli = clients.find(c => c.id === apt.clientId);
                            return (
                              <div key={apt.id} style={{ fontSize: '0.75rem', color: '#BFA6D8', marginTop: '4px' }}>
                                ⚡ {apt.time} - <strong>{cli?.name}</strong> using Cryo/Treadmill
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE D: CRM CLIENT DIRECTORY & NOTE EDITS */}
        {activeTab === 'crm' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>CRM Client Dossiers</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Detailed customer profile card folders with allergies, records, and consult logs.</p>
              </div>
              <button onClick={() => setShowClientModal(true)} className="btn-brand-gold">
                <Plus style={{ width: '16px', height: '16px' }} /> Register Client
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              {/* Directory listings */}
              <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '550px', overflowY: 'auto' }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', color: '#A89684' }} />
                  <input
                    type="text"
                    placeholder="Search folders..."
                    className="brand-input"
                    style={{ paddingLeft: '34px' }}
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                          <span style={{ fontSize: '0.7rem', color: '#BFA6D8' }}>VIP: {cli.vipTier} • {cli.loyaltyPoints} Glow Pts</span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>

              {/* Selected Dossier */}
              <div className="card-premium" style={{ minHeight: '400px' }}>
                {selectedClient ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(107, 44, 145, 0.2)', paddingBottom: '16px' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <img src={selectedClient.profilePhoto} style={{ width: '64px', height: '64px', borderRadius: '12px', objectFit: 'cover', border: '1px solid rgba(107,44,145,0.3)' }} alt={selectedClient.name} />
                        <div>
                          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', margin: 0, color: 'white' }}>{selectedClient.name}</h2>
                          <span style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>ID: {selectedClient.id} • Contact: {selectedClient.phone}</span>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                            <span className="badge-brand gold" style={{ fontSize: '0.55rem' }}>VIP: {selectedClient.vipTier}</span>
                            <span className="badge-brand purple" style={{ fontSize: '0.55rem' }}>⚡ {selectedClient.loyaltyPoints} Glow Points</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sensitive medical data warning panels */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                        <h4 style={{ color: '#ef4444', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <AlertTriangle style={{ width: '14px', height: '14px' }} /> Allergy Warnings
                        </h4>
                        <p style={{ fontSize: '0.78rem', margin: 0, color: '#fca5a5' }}>{selectedClient.allergies || 'No known allergies.'}</p>
                      </div>
                      <div style={{ backgroundColor: 'rgba(52, 211, 153, 0.08)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                        <h4 style={{ color: '#34d399', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                          <ShieldCheck style={{ width: '14px', height: '14px' }} /> Medical Considerations
                        </h4>
                        <p style={{ fontSize: '0.78rem', margin: 0, color: '#a7f3d0' }}>{selectedClient.medical || 'None noted.'}</p>
                      </div>
                    </div>

                    {/* Consultants private logs */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#BFA6D8', marginBottom: '8px' }}>
                        Private Consultants Treatment Notes:
                      </label>
                      <textarea
                        className="brand-input"
                        rows={5}
                        style={{ fontFamily: 'Inter', fontSize: '0.85rem', lineHeight: '1.4' }}
                        value={activeClientNotes}
                        onChange={(e) => setActiveClientNotes(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          const allClients = getTable('clients');
                          const idx = allClients.findIndex(c => c.id === selectedClient.id);
                          if (idx !== -1) {
                            allClients[idx].notes = activeClientNotes;
                            localStorage.setItem('salon_clients', JSON.stringify(allClients));
                            logAction(currentUserName(), 'Update CRM Notes', `Saved medical recommendations for client ${selectedClient.name}`);
                            syncDatabase();
                            alert('Consultant dossier notes updated successfully!');
                          }
                        }}
                        className="btn-brand-gold"
                        style={{ marginTop: '10px', fontSize: '0.75rem', padding: '8px 16px' }}
                      >
                        Save Dossier Note
                      </button>
                    </div>

                    {/* History panel */}
                    <div style={{ borderTop: '1px solid rgba(107, 44, 145, 0.2)', paddingTop: '16px' }}>
                      <h4 style={{ color: 'white', fontFamily: 'Outfit', fontSize: '0.9rem', marginBottom: '10px' }}>Historical Treatments Log</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {appointments
                          .filter(a => a.clientId === selectedClient.id && a.status === 'Completed')
                          .map(apt => {
                            const srv = services.find(s => s.id === apt.serviceId);
                            return (
                              <div key={apt.id} style={{ display: 'flex', justify: 'space-between', padding: '8px 12px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', fontSize: '0.78rem' }}>
                                <span>{apt.date} — {srv?.name}</span>
                                <strong style={{ color: '#34d399' }}>COMPLETED</strong>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '80px', color: '#A89684' }}>
                    <Users style={{ width: '48px', height: '48px', marginBottom: '12px', color: 'hsl(var(--brand-purple))' }} />
                    <h3 style={{ color: 'white' }}>Select Client Folder</h3>
                    <span style={{ fontSize: '0.78rem' }}>Choose a profile from the left directory to open their records, medical details, and consultants notes.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE E: VIP TIERS & GLOW POINTS */}
        {activeTab === 'loyalty' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>VIP Tiers & Loyalty Glow Points</h1>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Auto-calculate client point balance payouts and simulate rewards redemptions.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>VIP Loyalty Standings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {clients.map(cli => {
                    const progress = Math.min(100, (cli.loyaltyPoints / 100) * 100);
                    return (
                      <div key={cli.id} style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '16px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div>
                            <strong style={{ color: 'white' }}>{cli.name}</strong>
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#A89684' }}>Account: {cli.email}</span>
                          </div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <span className="badge-brand gold" style={{ fontSize: '0.55rem' }}>VIP: {cli.vipTier}</span>
                            <span className="badge-brand purple" style={{ fontSize: '0.55rem' }}>⚡ {cli.loyaltyPoints} Pts</span>
                          </div>
                        </div>

                        {/* Progress slider bar */}
                        <div>
                          <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.68rem', color: '#BFA6D8', marginBottom: '4px' }}>
                            <span>Progress to Platinum Level (100 Pts):</span>
                            <span>{cli.loyaltyPoints} / 100</span>
                          </div>
                          <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--brand-charcoal))', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'hsl(var(--brand-gold))', borderRadius: '3px' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Redemption simulator block */}
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: '#D4AF37' }}>Redemption Panel</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Client:</label>
                    <select className="brand-input" id="redeemClientSelect">
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name} ({c.loyaltyPoints} Pts)</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Reward Item:</label>
                    <select className="brand-input" id="redeemRewardSelect">
                      <option value="Treadmill Session|10">Free Treadmill Session (10 Pts)</option>
                      <option value="Body Roll Session|15">Free Body Roll Session (15 Pts)</option>
                      <option value="Korean Corrective Facial|25">Korean Corrective Facial (25 Pts)</option>
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const cliId = document.getElementById('redeemClientSelect').value;
                      const rewardVal = document.getElementById('redeemRewardSelect').value;
                      const [rewardName, cost] = rewardVal.split('|');

                      const client = clients.find(c => c.id === cliId);
                      if (client) {
                        if (client.loyaltyPoints < Number(cost)) {
                          alert(`Redemption Fail: Client has insufficient balance. Needs ${cost} points, has ${client.loyaltyPoints}.`);
                        } else {
                          const confirmRedeem = window.confirm(`Redeem "${rewardName}" for ${client.name} using ${cost} Glow Points?`);
                          if (confirmRedeem) {
                            const res = redeemGlowPoints(currentUserName(), cliId, Number(cost), rewardName);
                            if (res.success) {
                              syncDatabase();
                              alert(`Points Redeemed successfully! New balance: ${client.loyaltyPoints - Number(cost)} Pts.`);
                            }
                          }
                        }
                      }
                    }}
                    className="btn-brand-gold"
                    style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                  >
                    Confirm Point Redemption
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE F: BEFORE/AFTER GALLERY & CONSENT */}
        {activeTab === 'gallery' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Progress Tracker & Digital Consent</h1>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Upload client weight loss charts and manage signed clinical treatment consent sheets.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
              {/* Progress Gallery card */}
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Active Progress Gallery Dossiers</h3>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Client Folder:</label>
                  <select
                    className="brand-input"
                    onChange={(e) => {
                      const cli = clients.find(c => c.id === e.target.value);
                      setSelectedClient(cli);
                    }}
                    value={selectedClient?.id || ''}
                  >
                    <option value="">-- Choose Profile --</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                {selectedClient ? (
                  <div>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
                      <img src={selectedClient.profilePhoto} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} alt="Active" />
                      <div>
                        <strong style={{ color: 'white', fontSize: '0.95rem' }}>{selectedClient.name} dossier photos</strong>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: '#BFA6D8' }}>Active Progress Weight Logs: {selectedClient.weightLogs?.length || 0} entries</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      {selectedClient.weightLogs?.map((log, i) => (
                        <div key={i} style={{ backgroundColor: 'hsl(var(--brand-black))', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                          <img src={log.photo || '/cover.jpg'} style={{ width: '100%', height: '140px', objectFit: 'cover' }} alt="Dossier" />
                          <div style={{ padding: '12px', fontSize: '0.78rem' }}>
                            <strong style={{ color: '#D4AF37' }}>Date: {log.date}</strong>
                            <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8', marginTop: '6px' }}>
                              <span>Weight: {log.weight} kg</span>
                              <span>Waist: {log.waist} cm</span>
                            </div>
                            <div style={{ color: '#BFA6D8', marginTop: '2px' }}>Hips: {log.hips} cm</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progress mock form */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid rgba(107, 44, 145, 0.2)', paddingTop: '16px' }}>
                      <h4 style={{ color: 'white', fontSize: '0.9rem', marginBottom: '12px' }}>Capture Body Scale Progress Logs</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Weight (kg):</label>
                          <input type="number" className="brand-input" value={progressForm.weight} onChange={(e) => setProgressForm(prev => ({ ...prev, weight: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Waist (cm):</label>
                          <input type="number" className="brand-input" value={progressForm.waist} onChange={(e) => setProgressForm(prev => ({ ...prev, waist: Number(e.target.value) }))} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Hips (cm):</label>
                          <input type="number" className="brand-input" value={progressForm.hips} onChange={(e) => setProgressForm(prev => ({ ...prev, hips: Number(e.target.value) }))} />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const allClients = getTable('clients');
                          const cIdx = allClients.findIndex(c => c.id === selectedClient.id);
                          if (cIdx !== -1) {
                            const newLog = {
                              date: new Date().toISOString().split('T')[0],
                              weight: progressForm.weight,
                              waist: progressForm.waist,
                              hips: progressForm.hips,
                              photo: '/logo.jpg'
                            };
                            allClients[cIdx].weightLogs = [newLog, ...(allClients[cIdx].weightLogs || [])];
                            localStorage.setItem('salon_clients', JSON.stringify(allClients));
                            logAction(currentUserName(), 'Log Body Scale', `Recorded progress weight for ${selectedClient.name}: ${progressForm.weight}kg`);
                            syncDatabase();
                            alert('Success! Progress photo and scale metrics logged to dossier.');
                          }
                        }}
                        className="btn-brand-gold"
                        style={{ fontSize: '0.75rem', padding: '8px 16px' }}
                      >
                        Capture Measurements
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#A89684', textAlign: 'center', padding: '40px' }}>Select client profile above to load progress history.</div>
                )}
              </div>

              {/* Consent form list */}
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: '#D4AF37' }}>Clinical Consent Tracker</h3>
                <p style={{ fontSize: '0.78rem', color: '#BFA6D8', marginBottom: '16px' }}>Digital signatures are required before launching infrared or cryo devices.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    display: 'flex', justify: 'space-between', alignItems: 'center',
                    padding: '12px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '10px',
                    border: '1px solid rgba(107, 44, 145, 0.15)'
                  }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'white' }}>Chemical Peel Consent Sheet</strong>
                      <span style={{ fontSize: '0.7rem', color: '#A89684' }}>Korean face corrective peel</span>
                    </div>
                    <button
                      onClick={() => setConsentForms(prev => ({ ...prev, consentPeel: !prev.consentPeel }))}
                      style={{
                        backgroundColor: consentForms.consentPeel ? '#34d399' : 'hsl(var(--brand-charcoal))',
                        border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer'
                      }}
                    >
                      {consentForms.consentPeel ? 'Signed ✓' : 'Tap to Sign'}
                    </button>
                  </div>

                  <div style={{
                    display: 'flex', justify: 'space-between', alignItems: 'center',
                    padding: '12px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '10px',
                    border: '1px solid rgba(107, 44, 145, 0.15)'
                  }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'white' }}>Cryo 360 Fat Freeze Waiver</strong>
                      <span style={{ fontSize: '0.7rem', color: '#A89684' }}>Thermal crystallization authorization</span>
                    </div>
                    <button
                      onClick={() => setConsentForms(prev => ({ ...prev, consentCryo: !prev.consentCryo }))}
                      style={{
                        backgroundColor: consentForms.consentCryo ? '#34d399' : 'hsl(var(--brand-charcoal))',
                        border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer'
                      }}
                    >
                      {consentForms.consentCryo ? 'Signed ✓' : 'Tap to Sign'}
                    </button>
                  </div>

                  <div style={{
                    display: 'flex', justify: 'space-between', alignItems: 'center',
                    padding: '12px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '10px',
                    border: '1px solid rgba(107, 44, 145, 0.15)'
                  }}>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.82rem', color: 'white' }}>GDPR Protection Consent</strong>
                      <span style={{ fontSize: '0.7rem', color: '#A89684' }}>Data storage & weight logs waiver</span>
                    </div>
                    <button
                      onClick={() => setConsentForms(prev => ({ ...prev, consentGDPR: !prev.consentGDPR }))}
                      style={{
                        backgroundColor: consentForms.consentGDPR ? '#34d399' : 'hsl(var(--brand-charcoal))',
                        border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem', cursor: 'pointer'
                      }}
                    >
                      {consentForms.consentGDPR ? 'Signed ✓' : 'Tap to Sign'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE G: SERVICES MANAGEMENT */}
        {activeTab === 'services' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Clinical Services Catalog</h1>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Configure professional treatments list, discount bundles, and equipment targets.</p>
            </div>

            <div className="card-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Service details</th>
                    <th>Required hardware</th>
                    <th>VAT & Cost</th>
                    <th>Standard Price</th>
                    <th>Consumables</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map(srv => (
                    <tr key={srv.id}>
                      <td>
                        <strong>{srv.name}</strong>
                        <br /><span style={{ fontSize: '0.7rem', color: '#BFA6D8' }}>{srv.category} • {srv.duration} mins</span>
                      </td>
                      <td>
                        <span className="badge-brand purple" style={{ fontSize: '0.58rem' }}>
                          {srv.requiredMachine || 'Manual Therapy'}
                        </span>
                      </td>
                      <td>15% VAT</td>
                      <td><strong>R {srv.price}</strong></td>
                      <td>
                        {srv.consumables?.map((c, i) => (
                          <span key={i} className="badge-brand gold" style={{ fontSize: '0.55rem', marginRight: '4px' }}>
                            {c.quantity} items
                          </span>
                        )) || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WORKSPACE H: ATELIER SHOP SYNC */}
        {activeTab === 'products' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Atelier E-Commerce Product Sync</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Synchronize product pricing parameters. Instantly updates client storefront website `/website`.</p>
              </div>
              <button onClick={() => setShowProductModal(true)} className="btn-brand-gold">
                + Create Product
              </button>
            </div>

            <div className="card-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Product description</th>
                    <th>Price</th>
                    <th>Current Stock</th>
                    <th>Visibility status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(prod => (
                    <tr key={prod.id}>
                      <td>
                        <strong style={{ color: 'white' }}>{prod.name}</strong>
                        <br /><span style={{ fontSize: '0.7rem', color: '#BFA6D8' }}>{prod.category}</span>
                      </td>
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

        {/* WORKSPACE I: CONSUMABLES STOCK LEDGER */}
        {activeTab === 'inventory' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Consumables Stock Ledger</h1>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Track salon treatment consumables. Highlighted in RED if alert threshold hit.</p>
            </div>

            <div className="card-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Item Name</th>
                    <th>Current Quantity</th>
                    <th>Threshold Limit</th>
                    <th>Supplier Details</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.alertAt;
                    return (
                      <tr key={item.id} style={{ backgroundColor: isLow ? 'rgba(239, 68, 68, 0.08)' : 'transparent' }}>
                        <td><strong>{item.name}</strong></td>
                        <td><strong style={{ color: isLow ? '#ef4444' : '#34d399' }}>{item.quantity} {item.unit}</strong></td>
                        <td>{item.alertAt} {item.unit}</td>
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

        {/* WORKSPACE J: STAFF ROSTER TIMELINE */}
        {activeTab === 'therapist' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Staff Scheduling & Leave Timeline</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Schedule receptionist shifts, clock-in rosters, or submit leave waivers.</p>
              </div>
              {currentUserRole !== 'therapist' && (
                <button onClick={() => setShowShiftModal(true)} className="btn-brand-gold">
                  + Schedule Roster
                </button>
              )}
            </div>

            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Roster timeline entries</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {shifts.map(shf => {
                  const staff = getTable('users').find(u => u.id === shf.staffId);
                  return (
                    <div key={shf.id} style={{
                      display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px',
                      backgroundColor: 'hsl(var(--brand-black))', borderRadius: '10px',
                      borderLeft: `4px solid ${shf.isLeave ? '#ef4444' : '#6B2C91'}`,
                      borderRight: '1px solid rgba(107, 44, 145, 0.15)',
                      borderTop: '1px solid rgba(107, 44, 145, 0.15)',
                      borderBottom: '1px solid rgba(107, 44, 145, 0.15)'
                    }}>
                      <div>
                        <strong style={{ color: 'white' }}>{staff?.name || 'Jessica Laser'}</strong>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: '#BFA6D8', marginTop: '2px' }}>
                          Role: {staff?.role || 'Staff'} • {shf.date}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <strong style={{ color: '#D4AF37' }}>{shf.startTime} - {shf.endTime} ({shf.type})</strong>
                        {currentUserRole !== 'therapist' && (
                          <button
                            onClick={() => {
                              deleteShiftOrLeave(currentUserName(), shf.id);
                              syncDatabase();
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                          >
                            <Trash2 style={{ width: '14px', height: '14px' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* WORKSPACE K: INVOICES LEDGER */}
        {activeTab === 'billing' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Invoices Ledger</h1>
            <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Capture invoice payments, settle partial deposits, and print custom receipts.</p>

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
                        <td>
                          <strong>{inv.invoiceNumber}</strong>
                          <br /><span style={{ fontSize: '0.7rem', color: '#A89684' }}>{inv.date}</span>
                        </td>
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
                            {inv.status !== 'Refunded' && (
                              <button
                                onClick={() => {
                                  const reason = prompt('Please enter refund reason:');
                                  if (reason) {
                                    refundInvoice(currentUserName(), inv.id, reason);
                                    syncDatabase();
                                  }
                                }}
                                style={{ border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.72rem' }}
                              >
                                Refund
                              </button>
                            )}
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

        {/* WORKSPACE L: QUOTES GENERATOR */}
        {activeTab === 'quotes' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Quotes Creator</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Create luxury package quotations. Convert quote to invoice instantly with one click!</p>
              </div>
              <button onClick={() => setShowQuoteModal(true)} className="btn-brand-gold">
                + Create Quote
              </button>
            </div>

            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Quotations Ledger</h3>
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Quote ID</th>
                    <th>Client</th>
                    <th>Discount</th>
                    <th>Total Cost</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quotes.map(qte => {
                    const cli = clients.find(c => c.id === qte.clientId);
                    return (
                      <tr key={qte.id}>
                        <td><strong>{qte.quoteNumber}</strong><br /><span style={{ fontSize: '0.7rem', color: '#A89684' }}>{qte.date}</span></td>
                        <td>{cli?.name || 'Walk-in'}</td>
                        <td>{qte.discount}%</td>
                        <td><strong>R {qte.total.toFixed(2)}</strong></td>
                        <td><span className={`badge-brand ${qte.status === 'Converted' ? 'completed' : 'gold'}`}>{qte.status}</span></td>
                        <td>
                          {qte.status === 'Active' && (
                            <button
                              onClick={() => {
                                convertQuoteToInvoice(currentUserName(), qte.id);
                                syncDatabase();
                                alert('Success! Quote converted to Unpaid Invoice in billing ledger.');
                              }}
                              className="btn-brand-purple"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            >
                              Convert to Invoice
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WORKSPACE M: ANALYTICS & P&L CHARTS */}
        {activeTab === 'expenses' && currentUserRole === 'owner' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Financial Operating Expenses</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>P&L analysis, rent logs, utility bills, and hardware amortization.</p>
              </div>
              <button onClick={() => setShowExpenseModal(true)} className="btn-brand-gold">
                + Log Expense
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Expenses Tally</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {expenses.map(exp => (
                    <div key={exp.id} style={{ display: 'flex', justify: 'space-between', padding: '10px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', fontSize: '0.8rem' }}>
                      <div>
                        <strong>{exp.category}</strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#A89684' }}>{exp.description}</span>
                      </div>
                      <strong style={{ color: '#ef4444' }}>- R {exp.amount}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Area chart */}
              <div className="card-premium" style={{ height: '320px' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', marginBottom: '16px' }}>Operating Revenue vs Expenses</h3>
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
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
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
            </div>
          </div>
        )}

        {/* WORKSPACE N: REFUNDS & PAYMENTS LOG */}
        {activeTab === 'payments' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Payment Transactions & Refunds Log</h1>
            <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Review card transactions, cash deposits, and logged refund justifications.</p>

            <div className="card-premium">
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Payment Method</th>
                    <th>Transaction Reference</th>
                    <th>Date</th>
                    <th>Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.flatMap(inv => (inv.payments || []).map((pay, i) => (
                    <tr key={`${inv.id}-${i}`}>
                      <td><strong>{inv.invoiceNumber}</strong></td>
                      <td><span className="badge-brand purple" style={{ fontSize: '0.55rem' }}>{pay.method}</span></td>
                      <td><code>{pay.txnId || 'TXN-0000'}</code></td>
                      <td>{pay.date}</td>
                      <td><strong style={{ color: '#34d399' }}>R {pay.amount.toFixed(2)}</strong></td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>

            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: '#ef4444' }}>Refund Logs</h3>
              <table className="table-premium">
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Client Name</th>
                    <th>Refund Reason</th>
                    <th>Refund Value</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.filter(i => i.status === 'Refunded').map(inv => {
                    const cli = clients.find(c => c.id === inv.clientId);
                    return (
                      <tr key={inv.id}>
                        <td><strong>{inv.invoiceNumber}</strong></td>
                        <td>{cli?.name || 'Walk-in'}</td>
                        <td><span style={{ fontSize: '0.8rem', color: '#fca5a5' }}>{inv.refundReason || 'No reason recorded'}</span></td>
                        <td><strong style={{ color: '#ef4444' }}>R {inv.total.toFixed(2)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WORKSPACE O: STAFF COMMISSION SPLITS */}
        {activeTab === 'commissions' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Staff Commissions & Payroll Splits</h1>
            <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Service commission calculations (10% split) and product commissions (5% split).</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Commission Cards */}
              {getTable('users').filter(u => u.role !== 'owner').map(staff => {
                const comm = getStaffCommissions(staff.id);
                return (
                  <div key={staff.id} className="card-premium" style={{ border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', color: 'white', marginBottom: '16px' }}>{staff.name}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                        <span>Role:</span>
                        <strong style={{ color: 'white' }}>{staff.role}</strong>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                        <span>Service splits (10%):</span>
                        <strong>R {comm.serviceComm.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8', borderBottom: '1px solid rgba(107, 44, 145, 0.15)', paddingBottom: '8px' }}>
                        <span>Product retail splits (5%):</span>
                        <strong>R {comm.productComm.toFixed(2)}</strong>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', fontWeight: 700, color: '#34d399', fontSize: '1rem', paddingTop: '8px' }}>
                        <span>Total Payout Due:</span>
                        <span>R {comm.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKSPACE P: GLOBAL SALON SETTINGS */}
        {activeTab === 'settings' && currentUserRole === 'owner' && (
          <div className="card-premium animate-fade-in">
            <h3 style={{ fontFamily: 'Outfit', color: 'white', marginBottom: '16px' }}>Global Salon Settings</h3>
            <p style={{ fontSize: '0.8rem', color: '#BFA6D8', marginBottom: '20px' }}>Setup business details, VAT rates, and reception parameters.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>Salon Name:</label>
                  <input type="text" className="brand-input" id="cfgSalonName" defaultValue={settings.salonName} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>VAT Rate (%):</label>
                  <input type="number" className="brand-input" id="cfgVat" defaultValue={settings.vatRate} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>Telephone:</label>
                  <input type="text" className="brand-input" id="cfgPhone" defaultValue={settings.phone} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>Email Address:</label>
                  <input type="text" className="brand-input" id="cfgEmail" defaultValue={settings.email} />
                </div>
              </div>
              <button
                onClick={() => {
                  const sName = document.getElementById('cfgSalonName').value;
                  const vat = document.getElementById('cfgVat').value;
                  const phone = document.getElementById('cfgPhone').value;
                  const email = document.getElementById('cfgEmail').value;

                  const newSettings = {
                    salonName: sName,
                    vatRate: Number(vat),
                    phone,
                    email,
                    address: settings.address
                  };
                  updateSettings(currentUserName(), newSettings);
                  syncDatabase();
                  alert('Parameters saved successfully!');
                }}
                className="btn-brand-gold"
                style={{ alignSelf: 'flex-start', marginTop: '10px' }}
              >
                Save parameters
              </button>
            </div>
          </div>
        )}

        {/* WORKSPACE Q: SECURITY AUDITS */}
        {activeTab === 'audit' && currentUserRole === 'owner' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Security Audit Trails</h1>
            <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Track all system updates, role switches, and stock levels alterations.</p>

            <div className="card-premium">
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', color: '#A89684' }} />
                <input
                  type="text"
                  placeholder="Search audit trail logs..."
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
                    <th>Previous Val</th>
                    <th>New Val</th>
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
                        <td style={{ fontSize: '0.78rem' }}>{log.details}</td>
                        <td style={{ fontSize: '0.72rem', color: '#A89684' }}><code>{log.prevValue || '—'}</code></td>
                        <td style={{ fontSize: '0.72rem', color: '#a7f3d0' }}><code>{log.newValue || '—'}</code></td>
                        <td style={{ fontSize: '0.72rem', color: '#A89684' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* WORKSPACE R: NOTIFICATION SMS/WHATSAPP CAMPAIGNS */}
        {activeTab === 'campaigns' && currentUserRole === 'owner' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Marketing Campaign Suite</h1>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Bulk WhatsApp promotion campaigns and feedback requests.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>WhatsApp Promotion Blaster</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Campaign Template text:</label>
                    <textarea
                      className="brand-input"
                      rows={5}
                      value={campaignForm.message}
                      onChange={(e) => setCampaignForm(prev => ({ ...prev, message: e.target.value }))}
                    />
                  </div>

                  {blastingActive && (
                    <div style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '14px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.78rem', color: '#BFA6D8', marginBottom: '6px' }}>
                        <span>Blasting campaign to client directory...</span>
                        <strong>{blastingProgress}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'hsl(var(--brand-charcoal))', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${blastingProgress}%`, height: '100%', backgroundColor: '#34d399', borderRadius: '3px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (blastingActive) return;
                      setBlastingActive(true);
                      setBlastingProgress(0);

                      const timer = setInterval(() => {
                        setBlastingProgress(prev => {
                          if (prev >= 100) {
                            clearInterval(timer);
                            setBlastingActive(false);
                            logAction(currentUserName(), 'Marketing Blast', `Sent bulk marketing text: "${campaignForm.message}"`);
                            alert('Success! WhatsApp Bulk Promotion campaign finished sending.');
                            return 100;
                          }
                          return prev + 20;
                        });
                      }, 400);
                    }}
                    className="btn-brand-gold"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Blast Bulk Campaign
                  </button>
                </div>
              </div>

              {/* Feedback requests */}
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: '#D4AF37' }}>Google Review Requests</h3>
                <p style={{ fontSize: '0.78rem', color: '#BFA6D8', marginBottom: '16px' }}>Automatically request Google reviews from completed appointments.</p>
                <button
                  onClick={() => {
                    logAction('System', 'Google Review Campaign', 'Sent bulk Google Review request forms to all VIP clients.');
                    alert('Feedback links blasted successfully!');
                  }}
                  className="btn-brand-purple"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Send Bulk Review Invites
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================= */}
      {/*   5. MODAL DIALOGS / POPUPS                             */}
      {/* ======================================================= */}

      {/* MODAL: MANUAL BOOKINGS FORM */}
      {showBookingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Manual Booking</h3>

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
                  setBookingForm(prev => ({
                    ...prev,
                    serviceId: e.target.value,
                    duration: srv ? srv.duration : 30,
                    machineId: srv ? srv.requiredMachine || '' : ''
                  }));
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
                    const res = addAppointment(currentUserName(), bookingForm);
                    if (!res.success) {
                      alert(`Allocation Overlap:\n\n${res.error}`);
                    } else {
                      setShowBookingModal(false);
                      syncDatabase();
                    }
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Settle Schedule
                </button>
                <button onClick={() => setShowBookingModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER CLIENT */}
      {showClientModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '420px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Register CRM Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Full Name:</label>
                <input type="text" className="brand-input" value={clientForm.name} onChange={(e) => setClientForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Email:</label>
                <input type="text" className="brand-input" value={clientForm.email} onChange={(e) => setClientForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Telephone:</label>
                <input type="text" className="brand-input" value={clientForm.phone} onChange={(e) => setClientForm(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>DOB:</label>
                  <input type="date" className="brand-input" value={clientForm.dob} onChange={(e) => setClientForm(prev => ({ ...prev, dob: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Gender:</label>
                  <select className="brand-input" value={clientForm.gender} onChange={(e) => setClientForm(prev => ({ ...prev, gender: e.target.value }))}>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Allergy Warnings:</label>
                <input type="text" className="brand-input" placeholder="e.g. Lavender, Peanuts" value={clientForm.allergies} onChange={(e) => setClientForm(prev => ({ ...prev, allergies: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Medical Considerations:</label>
                <input type="text" className="brand-input" placeholder="e.g. Sensitive skin" value={clientForm.medical} onChange={(e) => setClientForm(prev => ({ ...prev, medical: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    if (!clientForm.name) return alert('Name is required');
                    addClient(currentUserName(), clientForm);
                    setShowClientModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Create Profile
                </button>
                <button onClick={() => setShowClientModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: MOCK PRINT THERMAL RECEIPT */}
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
                  <span>R {activePrintInvoice.tax?.toFixed(2) || '0.00'}</span>
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

      {/* MODAL: ADD PRODUCT */}
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
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Capture Sales Payment</h3>
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

      {/* MODAL: LOG EXPENSE */}
      {showExpenseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Log Operating Expense</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Category:</label>
                <select className="brand-input" value={expenseForm.category} onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}>
                  <option value="Rent">Rent</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Stock Purchases">Stock Purchases</option>
                  <option value="Repairs">Repairs & Amortization</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Description:</label>
                <input type="text" className="brand-input" placeholder="e.g. Pretoria East rental fee" value={expenseForm.description} onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Amount (R):</label>
                <input type="number" className="brand-input" value={expenseForm.amount} onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    addExpense(currentUserName(), expenseForm);
                    setShowExpenseModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Save Expense
                </button>
                <button onClick={() => setShowExpenseModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: JOIN WAITLIST */}
      {showWaitlistModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Join Waitlist Queue</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Client:</label>
                <select className="brand-input" onChange={(e) => setWaitlistForm(prev => ({ ...prev, clientId: e.target.value }))}>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Treatment:</label>
                <select className="brand-input" onChange={(e) => setWaitlistForm(prev => ({ ...prev, serviceId: e.target.value }))}>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Private Request Notes:</label>
                <input type="text" className="brand-input" placeholder="e.g. Prefers morning slots" value={waitlistForm.notes} onChange={(e) => setWaitlistForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    addToWaitlist(currentUserName(), waitlistForm);
                    setShowWaitlistModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Join Waitlist Queue
                </button>
                <button onClick={() => setShowWaitlistModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SCHEDULE ROSTER TIMELINE SHIFT */}
      {showShiftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Roster timeline shift</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Staff:</label>
                <select className="brand-input" value={shiftForm.staffId} onChange={(e) => setShiftForm(prev => ({ ...prev, staffId: e.target.value }))}>
                  {getTable('users').filter(u => u.role !== 'owner').map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Shift Date:</label>
                  <input type="date" className="brand-input" value={shiftForm.date} onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Shift Type:</label>
                  <select className="brand-input" value={shiftForm.type} onChange={(e) => setShiftForm(prev => ({ ...prev, type: e.target.value, isLeave: e.target.value.includes('Leave') }))}>
                    <option value="Shift">Active Shift</option>
                    <option value="Leave">Sick Leave</option>
                    <option value="Holiday">Annual Holiday</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Start Time:</label>
                  <input type="time" className="brand-input" value={shiftForm.startTime} onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>End Time:</label>
                  <input type="time" className="brand-input" value={shiftForm.endTime} onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    addShiftOrLeave(currentUserName(), shiftForm);
                    setShowShiftModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Create timeline shift
                </button>
                <button onClick={() => setShowShiftModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE QUOTE */}
      {showQuoteModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Generate Treatment Quote</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Client:</label>
                <select className="brand-input" onChange={(e) => setQuoteClient(e.target.value)} value={quoteClient}>
                  <option value="">-- Select Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {/* Dynamic items selection */}
              <div>
                <label style={{ display: 'flex', justify: 'space-between', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>
                  <span>Quote Line Items:</span>
                  <button
                    onClick={() => setQuoteItems(prev => [...prev, { name: '', quantity: 1, price: 0 }])}
                    style={{ border: 'none', background: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    + Add Item
                  </button>
                </label>

                {quoteItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                    <select
                      className="brand-input"
                      style={{ flex: 2 }}
                      onChange={(e) => {
                        const srv = services.find(s => s.name === e.target.value);
                        const newItems = [...quoteItems];
                        newItems[idx].name = e.target.value;
                        newItems[idx].price = srv ? srv.price : 0;
                        setQuoteItems(newItems);
                      }}
                    >
                      <option value="">-- Choose Treatment --</option>
                      {services.map(s => <option key={s.id} value={srv => srv.name}>{s.name}</option>)}
                    </select>
                    <input
                      type="number"
                      className="brand-input"
                      placeholder="Qty"
                      style={{ flex: 0.6 }}
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...quoteItems];
                        newItems[idx].quantity = Number(e.target.value);
                        setQuoteItems(newItems);
                      }}
                    />
                    <strong style={{ minWidth: '70px', fontSize: '0.85rem' }}>R {item.price * item.quantity}</strong>
                    {quoteItems.length > 1 && (
                      <button
                        onClick={() => setQuoteItems(prev => prev.filter((_, i) => i !== idx))}
                        style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Apply Discount (%):</label>
                <input type="number" className="brand-input" value={quoteDiscount} onChange={(e) => setQuoteDiscount(Number(e.target.value))} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    if (!quoteClient) return alert('Please select a client');
                    const total = quoteItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
                    const discountedTotal = total - (total * (quoteDiscount / 100));

                    addQuote(currentUserName(), {
                      clientId: quoteClient,
                      items: quoteItems.map(it => ({ name: `${it.name} [Service]`, quantity: it.quantity, price: it.price })),
                      discount: quoteDiscount,
                      total: discountedTotal,
                      expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    });

                    setShowQuoteModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Create quotation
                </button>
                <button onClick={() => setShowQuoteModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
