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
  updateSettings,
  addService,
  updateService,
  deleteService,
  deleteProduct,
  updateExpense,
  deleteExpense,
  updateInventoryItem,
  deleteInventoryItem,
  restoreItem,
  purgeItem,
  updateStaffProfile,
  uploadStaffDocument,
  submitLeaveRequest,
  approveLeaveRequest,
  submitStaffClaim,
  approveStaffClaim,
  submitLoanRequest,
  approveLoanRequest,
  addSalaryAdjustment,
  finalizeStaffPayslip
} from '../db/stateEngine';

export default function BookingCRM() {
  // SAAS remote suspension check
  const [isSuspended, setIsSuspended] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState('owner'); // owner, receptionist, therapist
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeCalendarView, setActiveCalendarView] = useState('active'); // active, completed

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
  const [users, setUsers] = useState([]);

  // Dynamic Rooms State configuration
  const [rooms, setRooms] = useState(() => {
    const data = localStorage.getItem('salon_rooms');
    return data ? JSON.parse(data) : ['Treatment Room 1', 'Treatment Room 2', 'Atelier Face Room'];
  });

  // Calendar click filter state
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

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
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  // Phase 4 operating expenses filters & edit states
  const [expensesFilterType, setExpensesFilterType] = useState('all');
  const [expensesStartDate, setExpensesStartDate] = useState('');
  const [expensesEndDate, setExpensesEndDate] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingInventoryItem, setEditingInventoryItem] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Google Reviews Feed State
  const [googleReviews, setGoogleReviews] = useState(() => {
    const data = localStorage.getItem('salon_google_reviews');
    if (data) return JSON.parse(data);
    const mock = [
      {
        id: 'rev-1',
        reviewerName: 'Sarah Jenkins',
        reviewerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100',
        rating: 5,
        timeAgo: '2 hours ago',
        comment: 'Absolutely loved my Thermo Treadmill session today! Burning 850 kcal in 30 minutes felt effortless with the entertainment screen. The place is super clean and the staff is extremely helpful. Highly recommend Sculpt & Glow!',
        service: 'Thermo Treadmill Workout',
        status: 'Unanswered',
        reply: ''
      },
      {
        id: 'rev-2',
        reviewerName: 'Clarissa Vance',
        reviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
        rating: 5,
        timeAgo: '1 day ago',
        comment: 'The fat freezing treatment really works. I was skeptical but after 4 weeks I can definitely see a difference in my waistline. The receptionist was so sweet and set me up with a cup of collagen tea. Will be back next week!',
        service: 'Cryo Fat Freezing',
        status: 'Replied',
        reply: 'Thank you Clarissa! We are so glad to hear you are enjoying your Cryo Fat Freezing results. Our reception desk works hard to make every visit feel like a VIP retreat. See you soon!'
      },
      {
        id: 'rev-3',
        reviewerName: 'Amanda DeVore',
        reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
        rating: 4,
        timeAgo: '3 days ago',
        comment: 'Great service and premium ambience. The skin peptide treatment was very relaxing, though booking on the weekend was a bit crowded. But the treatment itself made my skin glow instantly.',
        service: 'Premium Peptide Serum Infusion',
        status: 'Unanswered',
        reply: ''
      },
      {
        id: 'rev-4',
        reviewerName: 'Michael K.',
        reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
        rating: 5,
        timeAgo: '5 days ago',
        comment: 'Jessica is the absolute best therapist in town. She explained the entire laser process clearly and made sure I was comfortable throughout the session. Real professional clinical standards.',
        service: 'Laser Hair Removal',
        status: 'Replied',
        reply: "Thank you Michael! Jessica is indeed a gem, and we're so proud to have her on our clinical team. We appreciate you taking the time to share your experience!"
      }
    ];
    localStorage.setItem('salon_google_reviews', JSON.stringify(mock));
    return mock;
  });

  const [activeReplyReview, setActiveReplyReview] = useState(null);
  const [reviewReplyText, setReviewReplyText] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [isSyncingReviews, setIsSyncingReviews] = useState(false);

  // New Modals for Rescheduling & Capturing Payments
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCapturePaymentModal, setShowCapturePaymentModal] = useState(false);

  // Dynamic Waitlist Cancellation Match Alert state
  const [activeWaitlistMatch, setActiveWaitlistMatch] = useState(null);
  const [activeReleaseWt, setActiveReleaseWt] = useState(null);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  // Cancellation Reason Prompt Modal state
  const [activeCancellationApt, setActiveCancellationApt] = useState(null);
  const [cancelReasonText, setCancelReasonText] = useState('');

  // New active states for Reschedule & Capture Payment
  const [activeRescheduleApt, setActiveRescheduleApt] = useState(null);
  const [activeCapturePaymentApt, setActiveCapturePaymentApt] = useState(null);

  // Active items for detail overlays
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);
  const [activePrintInvoice, setActivePrintInvoice] = useState(null);

  // Corporate Documents & Sharing states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeViewInvoice, setActiveViewInvoice] = useState(null);
  
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [activeViewPayslip, setActiveViewPayslip] = useState(null);
  const [activeViewPayslipStaff, setActiveViewPayslipStaff] = useState(null);
  
  const [showQuoteViewModal, setShowQuoteViewModal] = useState(false);
  const [activeViewQuote, setActiveViewQuote] = useState(null);
  
  const [showRefundLetterModal, setShowRefundLetterModal] = useState(false);
  const [activeRefundInvoice, setActiveRefundInvoice] = useState(null);
  
  // Custom Search & Whitelists
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState('');
  const [manualQuoteClientSearch, setManualQuoteClientSearch] = useState('');

  // Refunds & Payments date filter states
  const [paymentsFilterType, setPaymentsFilterType] = useState('all'); // all, today, last_week, last_month, custom
  const [paymentsStartDate, setPaymentsStartDate] = useState('');
  const [paymentsEndDate, setPaymentsEndDate] = useState('');

  const [selectedClient, setSelectedClient] = useState(null);

  // Dynamic filter lists
  const [clientSearch, setClientSearch] = useState('');
  const [auditSearch, setAuditSearch] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');

  // Form states
  const [bookingForm, setBookingForm] = useState({
    clientId: '', serviceId: '', staffId: 'usr-3', room: '',
    machineId: '', date: new Date().toISOString().split('T')[0], time: '09:00', duration: 30, notes: '',
    paymentStatus: 'Unpaid' // Unpaid, Paid already, Loyalty Promo
  });
  const [manualClientSearch, setManualClientSearch] = useState('');
  const [clientForm, setClientForm] = useState({
    name: '', email: '', phone: '', dob: '1995-01-01', gender: 'Female',
    allergies: '', medical: '', preferredStaff: 'Jessica Laser', notes: ''
  });
  const [productForm, setProductForm] = useState({
    name: '', price: 250, stock: 10, category: 'Facial Products', description: '', image: ''
  });
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'Card' });
  const [expenseForm, setExpenseForm] = useState({ category: 'Utilities', description: '', amount: 0, machineId: '', frequency: 'once_off' });
  const [waitlistForm, setWaitlistForm] = useState({
    clientId: '',
    serviceId: '',
    notes: '',
    dayPref: 'Any Day',
    waitDate: new Date().toISOString().split('T')[0],
    weekPref: 'Current Week',
    timePref: 'Any Time',
    waitTime: '09:00'
  });
  const [shiftForm, setShiftForm] = useState({ staffId: 'usr-3', date: new Date().toISOString().split('T')[0], startTime: '08:00', endTime: '17:00', type: 'Shift', isLeave: false });

  // New forms for Rescheduling & Capturing Payments
  const [rescheduleForm, setRescheduleForm] = useState({ date: new Date().toISOString().split('T')[0], time: '09:00', reason: '' });
  const [aptPaymentForm, setAptPaymentForm] = useState({ amountPaid: 0, method: 'Card', amountProvided: 0 });

  const [activeClientNotes, setActiveClientNotes] = useState('');
  const [consentForms, setConsentForms] = useState({
    consentPeel: false,
    consentCryo: false,
    consentGDPR: false
  });

  // Client progress tracking uploader
  const [progressForm, setProgressForm] = useState({ weight: 65, waist: 72, hips: 94 });
  const [gallerySearch, setGallerySearch] = useState('');

  // Custom quotes dynamic item builder
  const [quoteItems, setQuoteItems] = useState([{ name: '', quantity: 1, price: 0 }]);
  const [quoteDiscount, setQuoteDiscount] = useState(0);
  const [quoteClient, setQuoteClient] = useState('');

  // Phase 3 Catalog, Inventory & Orders States
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [activeServiceForm, setActiveServiceForm] = useState({ name: '', category: 'Body Contouring', price: 0, duration: 30, requiredMachine: '', consumables: [] });
  const [isEditingService, setIsEditingService] = useState(false);
  const [selectedDrillDownService, setSelectedDrillDownService] = useState(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({ name: '', quantity: 0, alertAt: 5, unit: 'items', cost: 0, sellPrice: 0, supplier: '' });
  const [showStockAdjustModal, setShowStockAdjustModal] = useState(false);
  const [activeStockItem, setActiveStockItem] = useState(null);
  const [stockAdjustForm, setStockAdjustForm] = useState({ type: 'add', amount: 0, reason: '' });
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [archiveList, setArchiveList] = useState([]);

  // HR & Payroll State Hooks
  const [selectedStaffId, setSelectedStaffId] = useState('usr-3');
  const [selectedStaffDossierTab, setSelectedStaffDossierTab] = useState('profile');
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '', username: '', role: 'therapist', email: '', pin: '1234',
    salary: 12500, bankName: 'FNB Pretoria', accountHolder: '', accountNumber: '', branchCode: '250655'
  });
  const [leaveRequestForm, setLeaveRequestForm] = useState({
    type: 'Annual', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], days: 1, notes: '', doctorNoteName: ''
  });
  const [claimForm, setClaimForm] = useState({ type: 'out_of_pocket', description: '', amount: '', km: '' });
  const [loanForm, setLoanForm] = useState({ amount: '', months: 1 });
  const [salaryAdjForm, setSalaryAdjForm] = useState({ type: 'bonus', amount: '' });
  const [activeCommissionsDrilldownStaff, setActiveCommissionsDrilldownStaff] = useState(null);
  const [aaMileageRate, setAaMileageRate] = useState(4.50);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('contract');

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
    setUsers(getTable('users'));
    setArchiveList(JSON.parse(localStorage.getItem('salon_archive') || '[]'));

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
    const activeRooms = localStorage.getItem('salon_rooms');
    if (activeRooms) {
      const parsedRooms = JSON.parse(activeRooms);
      setRooms(parsedRooms);
      if (parsedRooms.length > 0 && !bookingForm.room) {
        setBookingForm(prev => ({ ...prev, room: parsedRooms[0] }));
      }
    } else {
      localStorage.setItem('salon_rooms', JSON.stringify(rooms));
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
      owner: ['dashboard', 'waitlist', 'rooms', 'crm', 'loyalty', 'gallery', 'reviews', 'billing', 'quotes', 'expenses', 'payments', 'services', 'products', 'inventory', 'orders', 'therapist', 'commissions', 'settings', 'audit', 'archive', 'staff'],
      receptionist: ['dashboard', 'waitlist', 'rooms', 'crm', 'loyalty', 'gallery', 'reviews', 'billing', 'quotes', 'payments', 'services', 'products', 'inventory', 'orders', 'therapist', 'commissions', 'staff'],
      therapist: ['dashboard', 'crm', 'gallery', 'reviews', 'therapist', 'commissions', 'staff']
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

  const isAppointmentOverdue = (apt) => {
    if (apt.status !== 'In-progress' && apt.status !== 'Confirmed' && apt.status !== 'Checked-in') return false;
    const [h, m] = apt.time.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + Number(apt.duration);
    
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const isToday = apt.date === now.toISOString().split('T')[0];
    
    return isToday && currentMins > endMins;
  };

  const getReleaseCandidateSlots = (wt) => {
    if (!wt) return [];
    const client = clients.find(c => c.id === wt.clientId);
    const service = services.find(s => s.id === wt.serviceId);

    // 1. Calculate candidate dates
    const dates = [];
    const todayStr = new Date().toISOString().split('T')[0];

    if (wt.dayPref === 'Specific Date') {
      dates.push(wt.waitDate || todayStr);
    } else if (wt.dayPref === 'Specific Week') {
      const startOffset = wt.weekPref === 'Next Week' ? 7 : 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + startOffset + i);
        dates.push(d.toISOString().split('T')[0]);
      }
    } else {
      // Any Day - next 5 days
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }
    }

    // 2. Filter hours based on timePref
    let hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    if (wt.timePref === 'Morning') {
      hours = ['08:00', '09:00', '10:00', '11:00'];
    } else if (wt.timePref === 'Afternoon') {
      hours = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
    } else if (wt.timePref === 'Specific Time') {
      hours = [wt.waitTime || '09:00'];
    }

    // 3. Check conflicts for each date and hour combo
    const candidates = [];
    for (const dStr of dates) {
      for (const hr of hours) {
        // Double check past time
        const [h, m] = hr.split(':').map(Number);
        const nowObj = new Date();
        const isPast = (dStr < todayStr) || 
                       (dStr === todayStr && (h < nowObj.getHours() || (h === nowObj.getHours() && m < nowObj.getMinutes())));

        // Check scheduling conflicts
        const conflictCheck = checkScheduleConflict({
          clientId: wt.clientId,
          serviceId: wt.serviceId,
          staffId: wt.preferredStaffId || 'usr-3',
          room: 'Treatment Room 1',
          machineId: service?.requiredMachine || '',
          date: dStr,
          time: hr,
          duration: service?.duration || 30
        });

        if (!conflictCheck.conflict && !isPast) {
          candidates.push({ date: dStr, time: hr });
        }
      }
    }

    return candidates.slice(0, 15); // Show top 15 matches to keep layout clean
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Sidebar Navigation Config
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
        { id: 'gallery', label: 'Before/After Progress', roles: ['owner', 'receptionist', 'therapist'] },
        { id: 'reviews', label: 'Google Business Reviews', roles: ['owner', 'receptionist', 'therapist'] }
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
        { id: 'inventory', label: 'Consumables Stock', roles: ['owner', 'receptionist'] },
        { id: 'orders', label: 'Client Orders', roles: ['owner', 'receptionist'] }
      ]
    },
    hr: {
      label: 'Staffing & HR',
      icon: Briefcase,
      items: [
        { id: 'staff', label: 'Staff Profile & HR Portal', roles: ['owner', 'receptionist', 'therapist'] },
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
        { id: 'archive', label: 'Archived Deletions', roles: ['owner'] }
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

      {/* SAAS SUSPENSION SHIELD OVERLAY */}
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

      {/* STICKY COLLAPSIBLE DIRECTORY SIDEBAR */}
      <aside style={{
        width: isSidebarMinimized ? '74px' : '320px',
        minWidth: isSidebarMinimized ? '74px' : '320px',
        backgroundColor: 'hsl(var(--brand-charcoal))',
        borderRight: '1px solid rgba(107, 44, 145, 0.2)',
        padding: isSidebarMinimized ? '24px 10px' : '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100vh',
        position: 'sticky',
        top: 0,
        overflowY: isSidebarMinimized ? 'visible' : 'auto',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), padding 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxSizing: 'border-box'
      }}>
        {/* Absolute-positioned Collapse/Expand Trigger Button */}
        <button
          onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
          style={{
            position: 'absolute',
            top: '24px',
            right: '-6px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            backgroundColor: 'hsl(var(--brand-purple))',
            border: '1px solid hsl(var(--brand-gold))',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 0 10px rgba(107, 44, 145, 0.5), 0 0 5px rgba(212, 175, 55, 0.3)',
            zIndex: 100,
            transition: 'transform 0.3s ease, background-color 0.2s ease',
            outline: 'none'
          }}
          title={isSidebarMinimized ? 'Expand Sidebar' : 'Collapse Sidebar'}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--brand-black))';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'hsl(var(--brand-purple))';
            e.currentTarget.style.boxShadow = '0 0 10px rgba(107, 44, 145, 0.5), 0 0 5px rgba(212, 175, 55, 0.3)';
          }}
        >
          <ChevronRight style={{
            width: '14px',
            height: '14px',
            color: 'hsl(var(--brand-gold))',
            transform: isSidebarMinimized ? 'none' : 'rotate(180deg)',
            transition: 'transform 0.3s ease'
          }} />
        </button>

        <div>
          {/* Brand Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isSidebarMinimized ? 'center' : 'flex-start',
            gap: '12px',
            marginBottom: '24px',
            paddingLeft: isSidebarMinimized ? 0 : '4px',
            transition: 'padding 0.3s ease'
          }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '50%',
              backgroundImage: 'url(/logo.jpg)', backgroundSize: 'cover',
              border: '1px solid hsl(var(--brand-gold))', boxShadow: '0 0 10px rgba(212,175,55,0.2)',
              flexShrink: 0
            }} />
            {!isSidebarMinimized && (
              <div style={{ animation: 'fadeIn 0.2s ease-out forwards' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit', margin: 0, letterSpacing: '-0.02em' }}>SCULPT CRM</h2>
                <span style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: '#D4AF37', fontWeight: 700, textTransform: 'uppercase' }}>Reception Grid Suite</span>
              </div>
            )}
          </div>

          {/* Quick-Search Filter inside the sidebar menu (Hidden in minimized state) */}
          {!isSidebarMinimized && (
            <div style={{ position: 'relative', marginBottom: '20px', animation: 'fadeIn 0.2s ease-out forwards' }}>
              <Search style={{ position: 'absolute', top: '9px', left: '10px', width: '14px', height: '14px', color: '#A89684' }} />
              <input
                type="text"
                placeholder="Search CRM operations..."
                className="brand-input"
                style={{ paddingLeft: '32px', fontSize: '0.78rem', height: '32px' }}
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
              />
            </div>
          )}

          {/* Accordion/Icon folders layout */}
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isSidebarMinimized ? '14px' : '10px',
            alignItems: isSidebarMinimized ? 'center' : 'stretch'
          }}>
            {Object.keys(sidebarNavigation).map(folderKey => {
              const folder = sidebarNavigation[folderKey];
              const FolderIcon = folder.icon;

              const filteredItems = folder.items.filter(item => {
                const matchesRole = item.roles.includes(currentUserRole);
                const matchesSearch = item.label.toLowerCase().includes(sidebarSearch.toLowerCase());
                return matchesRole && matchesSearch;
              });

              if (filteredItems.length === 0) return null;

              const isFolderActive = filteredItems.some(item => item.id === activeTab);

              // Minimized vertical folder button view
              if (isSidebarMinimized) {
                return (
                  <button
                    key={folderKey}
                    onClick={() => {
                      setIsSidebarMinimized(false);
                      setExpandedFolders(prev => ({ ...prev, [folderKey]: true }));
                    }}
                    title={folder.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      backgroundColor: isFolderActive ? 'hsl(var(--brand-purple))' : 'transparent',
                      border: isFolderActive ? '1px solid hsl(var(--brand-gold))' : '1px solid rgba(107, 44, 145, 0.1)',
                      color: isFolderActive ? 'white' : '#A89684',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      boxShadow: isFolderActive ? '0 0 10px rgba(107, 44, 145, 0.5)' : 'none',
                      outline: 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isFolderActive) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.borderColor = 'rgba(107, 44, 145, 0.3)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isFolderActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = '#A89684';
                        e.currentTarget.style.borderColor = 'rgba(107, 44, 145, 0.1)';
                      }
                    }}
                  >
                    <FolderIcon style={{ width: '18px', height: '18px', color: isFolderActive ? 'hsl(var(--brand-gold))' : '#D4AF37' }} />
                    
                    {/* Active dot indicator */}
                    {isFolderActive && (
                      <span style={{
                        position: 'absolute',
                        bottom: '5px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        backgroundColor: 'hsl(var(--brand-gold))',
                        boxShadow: '0 0 4px hsl(var(--brand-gold))'
                      }} />
                    )}
                  </button>
                );
              }

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
        <div style={{ borderTop: '1px solid rgba(107, 44, 145, 0.2)', paddingTop: '16px', display: 'flex', justifyContent: 'center' }}>
          {isSidebarMinimized ? (
            <div
              title={`Active User: ${currentUserName()} (${currentUserRole.toUpperCase()})`}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--brand-purple))',
                border: `1px solid ${getRoleBadgeColor(currentUserRole) || 'hsl(var(--brand-gold))'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: 'default',
                boxShadow: '0 0 8px rgba(107, 44, 145, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {currentUserName().split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
            </div>
          ) : (
            <div style={{
              width: '100%',
              backgroundColor: 'hsl(var(--brand-black))', padding: '12px',
              borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.2)', fontSize: '0.78rem',
              animation: 'fadeIn 0.2s ease-out forwards'
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
          )}
        </div>
      </aside>

      {/* MAIN WORKSPACE CANVAS */}
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

        {/* WORKSPACE A: CALENDAR SCHEDULER */}
        {activeTab === 'dashboard' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Clinical Scheduling Ledger</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Select dates via monthly click calendar. Sorted chronologically with overdue alerts.</p>
              </div>
              {currentUserRole !== 'therapist' && (
                <button className="btn-brand-gold" onClick={() => setShowBookingModal(true)}>
                  <Plus style={{ width: '16px', height: '16px' }} /> Manual Appointment
                </button>
              )}
            </div>

            {/* TAB SELECTOR: ACTIVE OR COMPLETED ARCHIVE */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(107, 44, 145, 0.2)', paddingBottom: '10px' }}>
              <button
                onClick={() => setActiveCalendarView('active')}
                style={{
                  backgroundColor: activeCalendarView === 'active' ? 'hsl(var(--brand-purple))' : 'transparent',
                  color: activeCalendarView === 'active' ? 'white' : '#BFA6D8',
                  border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Active Schedule
              </button>
              <button
                onClick={() => setActiveCalendarView('completed')}
                style={{
                  backgroundColor: activeCalendarView === 'completed' ? 'hsl(var(--brand-purple))' : 'transparent',
                  color: activeCalendarView === 'completed' ? 'white' : '#BFA6D8',
                  border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
                }}
              >
                Completed Archive Tab
              </button>
            </div>

            {/* Core Scheduler view breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr', gap: '20px', alignItems: 'start' }}>
              
              {/* Column A: Visual Month Click Grid calendar */}
              <div className="card-premium">
                <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <button style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => {
                    if (currentMonth === 0) {
                      setCurrentMonth(11);
                      setCurrentYear(prev => prev - 1);
                    } else {
                      setCurrentMonth(prev => prev - 1);
                    }
                  }}>◀</button>
                  <strong style={{ fontSize: '0.9rem', color: 'white' }}>{monthNames[currentMonth]} {currentYear}</strong>
                  <button style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => {
                    if (currentMonth === 11) {
                      setCurrentMonth(0);
                      setCurrentYear(prev => prev + 1);
                    } else {
                      setCurrentMonth(prev => prev + 1);
                    }
                  }}>▶</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', fontSize: '0.65rem', color: '#BFA6D8', fontWeight: 700, marginBottom: '8px' }}>
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, dIdx) => <div key={dIdx}>{day}</div>)}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px' }}>
                  {Array.from({ length: getFirstDayOfMonth(currentMonth, currentYear) }).map((_, emptyIdx) => (
                    <div key={`empty-${emptyIdx}`} />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, dayIdx) => {
                    const dayNum = dayIdx + 1;
                    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const isSelected = selectedDate === dateStr;

                    const dayBookings = appointments.filter(a => a.date === dateStr && a.status !== 'Cancelled' && a.status !== 'Completed');
                    const hasBookings = dayBookings.length > 0;

                    const todayDateStr = new Date().toISOString().split('T')[0];
                    const isPastDate = dateStr < todayDateStr;
                    const hasOutstandingPastBookings = isPastDate && appointments.some(a => 
                      a.date === dateStr && 
                      ['Pending', 'Confirmed', 'Checked-in', 'In-progress'].includes(a.status)
                    );

                    return (
                      <button
                        key={`day-${dayNum}`}
                        onClick={() => setSelectedDate(dateStr)}
                        style={{
                          backgroundColor: isSelected ? 'hsl(var(--brand-purple))' : 'hsl(var(--brand-black))',
                          border: isSelected ? '1px solid hsl(var(--brand-gold))' : hasOutstandingPastBookings ? '1px solid #ef4444' : '1px solid transparent',
                          boxShadow: hasOutstandingPastBookings ? '0 0 10px rgba(239, 68, 68, 0.8), inset 0 0 5px rgba(239, 68, 68, 0.4)' : 'none',
                          animation: hasOutstandingPastBookings ? 'pulse-red 2s infinite' : 'none',
                          borderRadius: '8px', color: isSelected ? 'white' : hasOutstandingPastBookings ? '#ef4444' : '#A89684',
                          fontSize: '0.78rem', padding: '6px 0', cursor: 'pointer', fontWeight: 600,
                          display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative'
                        }}
                      >
                        {dayNum}
                        {hasOutstandingPastBookings ? (
                          <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: '#ef4444', position: 'absolute', bottom: '2px',
                            boxShadow: '0 0 8px #ef4444'
                          }} />
                        ) : hasBookings ? (
                          <span style={{
                            width: '4px', height: '4px', borderRadius: '50%',
                            backgroundColor: '#D4AF37', position: 'absolute', bottom: '2px'
                          }} />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#A89684', marginTop: '14px', fontStyle: 'italic', textAlign: 'center' }}>
                  Selected Target Date: <strong style={{ color: '#D4AF37' }}>{selectedDate}</strong>
                </div>
              </div>

              {/* Column B: Bookings list */}
              <div className="card-premium" style={{ minHeight: '400px' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>
                  {activeCalendarView === 'active' ? 'Active Bookings' : 'Completed Archive'} - {selectedDate}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {appointments
                    .filter(apt => {
                      if (apt.date !== selectedDate) return false;
                      const isCompletedTab = apt.status === 'Completed';
                      return activeCalendarView === 'active' ? !isCompletedTab : isCompletedTab;
                    })
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map(apt => {
                      const client = clients.find(c => c.id === apt.clientId);
                      const service = services.find(s => s.id === apt.serviceId);
                      const staff = getTable('users').find(u => u.id === apt.staffId);
                      const isOverdue = isAppointmentOverdue(apt);

                      return (
                        <div key={apt.id} style={{
                          display: 'flex', justify: 'space-between', alignItems: 'center', padding: '14px',
                          backgroundColor: 'hsl(var(--brand-black))', borderRadius: '12px',
                          borderLeft: `4px solid ${isOverdue ? 'gold' : `hsl(var(--status-${apt.status.toLowerCase()}))`}`,
                          border: isOverdue ? '1px solid gold' : '1px solid rgba(107, 44, 145, 0.15)',
                          position: 'relative'
                        }}>
                          {isOverdue && (
                            <span style={{
                              position: 'absolute', top: '-10px', right: '14px',
                              backgroundColor: 'gold', color: 'black', fontSize: '0.62rem',
                              fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                              animation: 'pulseGlow 1.5s infinite ease-in-out'
                            }}>
                              ⚠️ OVERDUE SESSION
                            </span>
                          )}

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: '#D4AF37', fontWeight: 700, fontSize: '0.9rem' }}>{apt.time}</span>
                              <strong style={{ fontSize: '0.9rem', color: 'white' }}>{client?.name || 'Walk-in'}</strong>
                              <span className={`badge-brand ${apt.status.toLowerCase()}`} style={{ fontSize: '0.55rem' }}>{apt.status}</span>
                            </div>

                            <span style={{ display: 'block', fontSize: '0.78rem', color: '#BFA6D8', marginTop: '4px' }}>
                              {service?.name} ({apt.room}) • {apt.duration}m
                            </span>

                            {/* Client contact info */}
                            <span style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginTop: '2px' }}>
                              📞 {client?.phone || 'No phone'} | ✉ {client?.email || 'No email'}
                            </span>

                            {/* Paid indicators */}
                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#34d399', marginTop: '2px', fontWeight: 600 }}>
                              Status: {apt.paymentStatus === 'Paid already' ? '✓ Paid' : apt.paymentStatus === 'Loyalty Promo' ? '⚡ Loyalty Promo used' : '✗ Unpaid'}
                            </span>

                            <span style={{ display: 'block', fontSize: '0.65rem', color: '#A89684', fontStyle: 'italic', marginTop: '4px' }}>
                              By: {apt.createdBy || 'Receptionist'} | Staff: {staff?.name || ' Jessica'}
                            </span>

                            {apt.rescheduleReason && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#BFA6D8', fontStyle: 'italic', marginTop: '2px' }}>
                                Rescheduled: "{apt.rescheduleReason}"
                              </span>
                            )}

                            {apt.cancelReason && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#ef4444', fontWeight: 600, marginTop: '2px' }}>
                                Cancel Reason: {apt.cancelReason}
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {activeCalendarView === 'active' ? (
                              <>
                                <select
                                  value={apt.status}
                                  onChange={(e) => {
                                    const nextStatus = e.target.value;
                                    if (nextStatus === 'Completed' && apt.paymentStatus !== 'Paid already') {
                                      alert(`Admin Duty Compliance Lock:\n\nThis session cannot be marked as "Completed" because the payment has not been settled yet.\n\nPlease click "Settle Payment" to capture the payment first.`);
                                      return;
                                    }
                                    if (nextStatus === 'Cancelled') {
                                      setActiveCancellationApt(apt);
                                      setCancelReasonText('');
                                    } else {
                                      updateAppointmentStatus(currentUserName(), apt.id, nextStatus);
                                      syncDatabase();
                                    }
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
                                  <option value="No-show">No-show</option>
                                </select>

                                {/* Reschedule Click Button */}
                                {currentUserRole !== 'therapist' && (
                                  <button
                                    onClick={() => {
                                      setActiveRescheduleApt(apt);
                                      setRescheduleForm({
                                        date: apt.date,
                                        time: apt.time,
                                        reason: ''
                                      });
                                      setShowRescheduleModal(true);
                                    }}
                                    className="btn-brand-purple"
                                    style={{ fontSize: '0.68rem', padding: '4px 6px', justifyContent: 'center' }}
                                  >
                                    Reschedule
                                  </button>
                                )}

                                {/* Capture Payment shortcut */}
                                {currentUserRole !== 'therapist' && apt.paymentStatus !== 'Paid already' && (
                                  <button
                                    onClick={() => {
                                      setActiveCapturePaymentApt(apt);
                                      const dueAmount = apt.customPrice !== undefined ? apt.customPrice : (service ? service.price : 0);
                                      setAptPaymentForm({
                                        amountPaid: dueAmount,
                                        method: 'Card',
                                        amountProvided: dueAmount
                                      });
                                      setShowCapturePaymentModal(true);
                                    }}
                                    className="btn-brand-gold"
                                    style={{ fontSize: '0.68rem', padding: '4px 6px', justifyContent: 'center' }}
                                  >
                                    Settle Payment
                                  </button>
                                )}

                                {apt.status === 'No-show' && (
                                  <button
                                    onClick={() => {
                                      logAction('System', 'No-Show Alert Blast', `Sent bulk WhatsApp reminder to ${client?.name}`);
                                      alert(`whatsapp sent to ${client?.name}:\n\n"${settings.noShowTemplate || 'We missed you at your appointment! Please contact us to reschedule.'}"`);
                                    }}
                                    className="btn-brand-gold"
                                    style={{ fontSize: '0.65rem', padding: '3px 6px' }}
                                  >
                                    Send No-Show WhatsApp
                                  </button>
                                )}
                              </>
                            ) : (
                              <button
                                onClick={() => {
                                  updateAppointmentStatus(currentUserName(), apt.id, 'Confirmed');
                                  syncDatabase();
                                  alert('Booking successfully reinstated back to active calendar schedule!');
                                }}
                                className="btn-brand-gold"
                                style={{ fontSize: '0.72rem', padding: '4px 8px' }}
                              >
                                Reinstate Booking
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Column C: Chronological Hourly breakdown */}
              <div className="card-premium">
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '14px', color: 'white' }}>Hourly Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflowY: 'auto' }}>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(hour => {
                    const activeApts = appointments.filter(a => a.date === selectedDate && a.time === hour && a.status !== 'Cancelled' && a.status !== 'Completed');
                    const isBooked = activeApts.length > 0;

                    const busyMachineIds = activeApts.map(a => a.machineId).filter(Boolean);
                    const vacantMachines = machines.filter(m => !busyMachineIds.includes(m.id) && m.currentStatus === 'Available');

                    return (
                      <div key={hour} style={{
                        padding: '10px', borderRadius: '10px',
                        backgroundColor: isBooked ? 'rgba(107, 44, 145, 0.15)' : 'rgba(52, 211, 153, 0.05)',
                        border: isBooked ? '1px solid rgba(107, 44, 145, 0.3)' : '1px solid rgba(52, 211, 153, 0.15)'
                      }}>
                        <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.78rem', fontWeight: 700 }}>
                          <span style={{ color: '#D4AF37' }}>{hour}</span>
                          <span style={{ color: isBooked ? '#BFA6D8' : '#34d399' }}>{isBooked ? 'BOOKED' : 'VACANT'}</span>
                        </div>
                        {isBooked ? (
                          activeApts.map(apt => {
                            const cli = clients.find(c => c.id === apt.clientId);
                            return (
                              <div key={apt.id} style={{ fontSize: '0.72rem', color: 'white', marginTop: '4px' }}>
                                👤 {cli?.name} ({cli?.phone || 'No phone'})
                              </div>
                            );
                          })
                        ) : (
                          <div style={{ fontSize: '0.68rem', color: '#A89684', marginTop: '2px' }}>
                            Machines available: {vacantMachines.map(m => m.name).join(', ') || 'None'}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Roster Waitlist</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Auto-release and manual queues if clients cancel active slots.</p>
              </div>
              <button onClick={() => setShowWaitlistModal(true)} className="btn-brand-gold">
                <Plus style={{ width: '16px', height: '16px' }} /> Join Waitlist
              </button>
            </div>

            <div className="card-premium" style={{ padding: '24px' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '20px', color: 'white' }}>Waitlisted Clients Queue</h3>
              {waitlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#A89684', fontSize: '0.85rem' }}>
                  The waitlist is currently empty.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {waitlist.map(wt => {
                    const client = clients.find(c => c.id === wt.clientId);
                    const service = services.find(s => s.id === wt.serviceId);
                    return (
                      <div key={wt.id} style={{
                        display: 'flex', justify: 'space-between', alignItems: 'center', padding: '20px',
                        backgroundColor: 'hsl(var(--brand-black))', borderRadius: '16px',
                        border: '1px solid rgba(107, 44, 145, 0.2)', boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                      }}>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: '#D4AF37', display: 'block', marginBottom: '4px' }}>{client?.name || 'Walk-in'}</strong>
                          <span style={{ display: 'block', fontSize: '0.82rem', color: 'white', marginBottom: '2px' }}>
                            Needs Treatment: <strong>{service?.name}</strong>
                          </span>
                          <span style={{ display: 'block', fontSize: '0.78rem', color: '#A89684' }}>
                            📞 Phone: {client?.phone || 'No phone'} | Join Date: {wt.date}
                          </span>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#BFA6D8', marginTop: '4px' }}>
                            📅 Prefer Day: <strong>{wt.dayPref === 'Specific Date' ? wt.waitDate : wt.dayPref === 'Specific Week' ? (wt.weekPref === 'Current Week' ? 'This Week' : 'Next Week') : 'Any Day'}</strong>
                            {' | '}
                            ⏰ Prefer Time: <strong>{wt.timePref === 'Specific Time' ? wt.waitTime : wt.timePref === 'Morning' ? 'Morning (08:00-12:00)' : wt.timePref === 'Afternoon' ? 'Afternoon (12:00-17:00)' : 'Any Time'}</strong>
                          </span>
                          {wt.notes && (
                            <div style={{ marginTop: '8px', padding: '6px 10px', backgroundColor: 'hsl(var(--brand-charcoal))', borderRadius: '8px', fontSize: '0.75rem', color: '#BFA6D8', fontStyle: 'italic' }}>
                              Notes: "{wt.notes}"
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => {
                              setActiveReleaseWt(wt);
                              setShowReleaseModal(true);
                            }}
                            className="btn-brand-gold"
                            style={{ fontSize: '0.78rem', padding: '8px 16px' }}
                          >
                            Release Slot
                          </button>
                          <button
                            onClick={() => {
                              deleteFromWaitlist(currentUserName(), wt.id);
                              syncDatabase();
                            }}
                            style={{ border: 'none', backgroundColor: '#ef444433', color: '#ef4444', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
                  {rooms.map(room => {
                    const activeApts = appointments.filter(a => a.room === room && a.status !== 'Cancelled' && a.status !== 'Completed');
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
                    const activeApts = appointments.filter(a => a.machineId === mach.id && a.status !== 'Cancelled' && a.status !== 'Completed');
                    const serviceLimit = mach.serviceInterval || 50;
                    const isDueForService = mach.totalUsageHours >= serviceLimit;

                    return (
                      <div key={mach.id} style={{ backgroundColor: 'hsl(var(--brand-black))', padding: '14px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: 'white' }}>{mach.name}</strong>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {isDueForService && (
                              <span style={{
                                backgroundColor: '#ef4444', color: 'white', fontSize: '0.58rem',
                                fontWeight: 800, padding: '2px 6px', borderRadius: '4px'
                              }}>
                                ⚠️ DUE FOR SERVICE!
                              </span>
                            )}
                            <span className="badge-brand gold" style={{ fontSize: '0.6rem' }}>{mach.currentStatus}</span>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.75rem', color: '#BFA6D8', marginBottom: '8px', display: 'flex', gap: '16px' }}>
                          <span>Usage Hours: <strong>{mach.totalUsageHours} / {serviceLimit} hrs</strong></span>
                          <span>Sessions Used: <strong>{appointments.filter(a => a.machineId === mach.id && a.status !== 'Cancelled').length} times</strong></span>
                        </div>

                        {currentUserRole === 'owner' && (() => {
                          const machineExpensesList = expenses.filter(exp => exp.machineId === mach.id);
                          const activeAptsCount = appointments.filter(a => a.machineId === mach.id && a.status !== 'Cancelled').length;
                          
                          let totalExp = 0;
                          let perUseDetails = [];

                          machineExpensesList.forEach(e => {
                            if (e.frequency === 'per_use') {
                              const cost = e.amount * activeAptsCount;
                              totalExp += cost;
                              perUseDetails.push(`${e.description || e.category}: R ${e.amount.toFixed(2)} x ${activeAptsCount} uses = R ${cost.toFixed(2)}`);
                            } else {
                              totalExp += e.amount;
                            }
                          });

                          const netRevenue = mach.revenueGenerated - totalExp;
                          const netRoi = mach.purchaseCost > 0 ? ((netRevenue / mach.purchaseCost) * 100).toFixed(1) : '0.0';
                          return (
                            <div style={{ fontSize: '0.72rem', color: '#34d399', marginBottom: '8px', borderTop: '1px dashed rgba(52,211,153,0.2)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <div>Gross Yield: <strong>R {mach.revenueGenerated.toFixed(2)}</strong></div>
                              <div>Machine Expenses: <strong style={{ color: '#ef4444' }}>R {totalExp.toFixed(2)}</strong></div>
                              {perUseDetails.length > 0 && (
                                <div style={{ fontSize: '0.65rem', color: '#BFA6D8', paddingLeft: '8px', borderLeft: '1px solid rgba(191,166,216,0.3)', margin: '2px 0 4px 0' }}>
                                  {perUseDetails.map((det, idx) => (
                                    <div key={idx}>• {det}</div>
                                  ))}
                                </div>
                              )}
                              <div>Net Profit: <strong style={{ color: '#34d399' }}>R {netRevenue.toFixed(2)}</strong></div>
                              <div style={{ color: '#D4AF37' }}>Net ROI: <strong>{netRoi}%</strong> (Gross: {mach.purchaseCost > 0 ? ((mach.revenueGenerated / mach.purchaseCost) * 100).toFixed(1) : '0.0'}%)</div>
                            </div>
                          );
                        })()}

                        {activeApts.length === 0 ? (
                          <span style={{ fontSize: '0.72rem', color: '#A89684' }}>No active bookings utilizing this unit now.</span>
                        ) : (
                          activeApts.map(apt => {
                            const cli = clients.find(c => c.id === apt.clientId);
                            return (
                              <div key={apt.id} style={{ fontSize: '0.72rem', color: '#BFA6D8', marginTop: '4px' }}>
                                ⚡ {apt.time} - <strong>{cli?.name}</strong> using Treadmill/Cryo
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
        {activeTab === 'gallery' && (() => {
          // Compute dynamic leaderboard rankings based on positive scale improvements
          const leaderboard = clients
            .map(c => {
              const logs = [...(c.weightLogs || [])].sort((a, b) => a.date.localeCompare(b.date));
              if (logs.length >= 2) {
                const oldest = logs[0];
                const latest = logs[logs.length - 1];
                const weightLost = oldest.weight - latest.weight;
                const waistReduced = oldest.waist - latest.waist;
                const hipsReduced = oldest.hips - latest.hips;
                return {
                  client: c,
                  weightLost,
                  waistReduced,
                  hipsReduced,
                  totalImprovementScore: Math.max(0, weightLost) + Math.max(0, waistReduced) + Math.max(0, hipsReduced)
                };
              }
              return null;
            })
            .filter(Boolean)
            .sort((a, b) => b.totalImprovementScore - a.totalImprovementScore);

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Progress Tracker & Digital Consent</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Upload client weight loss charts and manage signed clinical treatment consent sheets.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
                {/* Progress Gallery card */}
                <div className="card-premium">
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Active Progress Gallery Dossiers</h3>
                  <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Search Client Folder Name:</label>
                      <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', top: '9px', left: '10px', width: '14px', height: '14px', color: '#A89684' }} />
                        <input
                          type="text"
                          placeholder="Type client name to search..."
                          className="brand-input"
                          style={{ paddingLeft: '32px', fontSize: '0.78rem', height: '32px' }}
                          value={gallerySearch}
                          onChange={(e) => {
                            setGallerySearch(e.target.value);
                            // Clear selection when typing a new search
                            setSelectedClient(null);
                          }}
                        />
                      </div>

                      {gallerySearch.length > 0 && !selectedClient && (
                        <div style={{
                          maxHeight: '150px', overflowY: 'auto', backgroundColor: 'hsl(var(--brand-black))',
                          borderRadius: '8px', border: '1px solid rgba(107, 44, 145, 0.3)', marginTop: '4px', padding: '6px',
                          position: 'absolute', zIndex: 10, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}>
                          {clients
                            .filter(c => c.name.toLowerCase().includes(gallerySearch.toLowerCase()))
                            .map(c => (
                              <button
                                key={c.id}
                                onClick={() => {
                                  setSelectedClient(c);
                                  setGallerySearch(c.name);
                                }}
                                type="button"
                                style={{
                                  display: 'block', width: '100%', background: 'none', border: 'none',
                                  color: 'white', padding: '8px 10px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem',
                                  borderBottom: '1px solid rgba(107, 44, 145, 0.1)', transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 44, 145, 0.2)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {c.name} ({c.phone})
                              </button>
                            ))}
                          {clients.filter(c => c.name.toLowerCase().includes(gallerySearch.toLowerCase())).length === 0 && (
                            <div style={{ padding: '8px', fontSize: '0.75rem', color: '#ef4444' }}>
                              No client folders found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                            <input type="number" className="brand-input" value={progressForm.weight === 0 ? '' : progressForm.weight} onChange={(e) => setProgressForm(prev => ({ ...prev, weight: Number(e.target.value) }))} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Waist (cm):</label>
                            <input type="number" className="brand-input" value={progressForm.waist === 0 ? '' : progressForm.waist} onChange={(e) => setProgressForm(prev => ({ ...prev, waist: Number(e.target.value) }))} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Hips (cm):</label>
                            <input type="number" className="brand-input" value={progressForm.hips === 0 ? '' : progressForm.hips} onChange={(e) => setProgressForm(prev => ({ ...prev, hips: Number(e.target.value) }))} />
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
                    <div style={{ color: '#A89684', textAlign: 'center', padding: '40px' }}>Type client name in search folder box above to load progress history.</div>
                  )}
                </div>

                {/* Right-hand Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                          <strong style={{ display: 'block', fontSize: '0.82rem', color: 'white' }}>Cryo 360 Waiver</strong>
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

                  {/* Dynamic Improvements Leaderboard */}
                  <div className="card-premium" style={{ border: '1px solid rgba(212, 175, 55, 0.25)' }}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '12px', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>🏆 Client Success Leaderboard</span>
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#BFA6D8', marginBottom: '16px' }}>Rankings based on combined registered body scale improvements.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {leaderboard.slice(0, 5).map((entry, idx) => {
                        const medals = ['🥇', '🥈', '🥉', '🎖️', '🎖️'];
                        return (
                          <div key={entry.client.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontSize: '1.2rem' }}>{medals[idx]}</span>
                              <div>
                                <strong style={{ color: 'white', fontSize: '0.85rem' }}>{entry.client.name}</strong>
                                <div style={{ fontSize: '0.7rem', color: '#A89684', marginTop: '2px' }}>
                                  📏 Waist: -{entry.waistReduced.toFixed(1)}cm | Hips: -{entry.hipsReduced.toFixed(1)}cm
                                </div>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: '#34d399', fontSize: '0.9rem' }}>-{entry.weightLost.toFixed(1)} kg</strong>
                              <span style={{ display: 'block', fontSize: '0.62rem', color: '#D4AF37' }}>Score: {entry.totalImprovementScore.toFixed(0)} pts</span>
                            </div>
                          </div>
                        );
                      })}
                      {leaderboard.length === 0 && (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#A89684', fontSize: '0.78rem' }}>
                          Log measurements for at least two sessions to begin calculating improvement statistics!
                        </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

        {/* WORKSPACE FOR GOOGLE BUSINESS REVIEWS INTEGRATION */}
        {activeTab === 'reviews' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header synced panel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Google Business Reviews Feed</h1>
                <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Monitor public ratings, track feedback loops, and publish live owner replies to your Google listings.</p>
              </div>

              <button
                onClick={() => {
                  if (isSyncingReviews) return;
                  setIsSyncingReviews(true);
                  // Simulate live fetch latency
                  setTimeout(() => {
                    setGoogleReviews(prev => {
                      // Check if already fetched to prevent duplication
                      if (prev.some(r => r.id === 'rev-fetched')) {
                        setIsSyncingReviews(false);
                        alert('Your Google Business profile is already fully synchronized! 0 new reviews found.');
                        return prev;
                      }
                      
                      const newReview = {
                        id: 'rev-fetched',
                        reviewerName: 'Victoria S.',
                        reviewerAvatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&q=80&w=100',
                        rating: 5,
                        timeAgo: 'Just now',
                        comment: 'Absolutely phenomenal clinical standards! The digital weight scale progression charting and the loyalty Glow Points reward system make me feel so valued. The Fat Freezing results are already showing. 10/10!',
                        service: 'Cryo Fat Freezing',
                        status: 'Unanswered',
                        reply: ''
                      };
                      
                      const updated = [newReview, ...prev];
                      localStorage.setItem('salon_google_reviews', JSON.stringify(updated));
                      setIsSyncingReviews(false);
                      logAction(currentUserName(), 'Sync Google Reviews', 'Fetched 1 new review from Google Business Profile.');
                      alert('Success! Sycned Google Business Reviews: 1 new review pulled successfully!');
                      return updated;
                    });
                  }, 1200);
                }}
                className="btn-brand-gold"
                style={{ fontSize: '0.78rem', height: '36px', display: 'flex', alignItems: 'center', gap: '8px' }}
                disabled={isSyncingReviews}
              >
                <RefreshCw className={isSyncingReviews ? 'animate-spin' : ''} style={{ width: '14px', height: '14px' }} />
                {isSyncingReviews ? 'Syncing Profile...' : 'Sync Google Reviews'}
              </button>
            </div>

            {/* Metrics cards grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div className="card-premium" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#A89684', textTransform: 'uppercase', fontWeight: 700 }}>Overall Google Rating</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <strong style={{ fontSize: '1.8rem', color: 'white', fontFamily: 'Outfit' }}>
                    {(googleReviews.reduce((acc, r) => acc + r.rating, 0) / googleReviews.length).toFixed(1)}
                  </strong>
                  <div>
                    <div style={{ display: 'flex', color: '#D4AF37', fontSize: '0.85rem' }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i}>★</span>
                      ))}
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#BFA6D8' }}>{googleReviews.length + 120} verified reviews</span>
                  </div>
                </div>
              </div>

              <div className="card-premium" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#A89684', textTransform: 'uppercase', fontWeight: 700 }}>Response Rate</span>
                <div>
                  <strong style={{ fontSize: '1.8rem', color: 'white', fontFamily: 'Outfit' }}>
                    {Math.round((googleReviews.filter(r => r.status === 'Replied').length / googleReviews.length) * 100)}%
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#BFA6D8', marginTop: '2px' }}>Target SLA threshold: 95%</span>
                </div>
              </div>

              <div className="card-premium" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#A89684', textTransform: 'uppercase', fontWeight: 700 }}>Unanswered Reviews</span>
                <div>
                  <strong style={{ fontSize: '1.8rem', color: googleReviews.some(r => r.status === 'Unanswered') ? '#ef4444' : '#34d399', fontFamily: 'Outfit' }}>
                    {googleReviews.filter(r => r.status === 'Unanswered').length}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: '#BFA6D8', marginTop: '2px' }}>Action required within 24h</span>
                </div>
              </div>

              <div className="card-premium" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#A89684', textTransform: 'uppercase', fontWeight: 700 }}>Synced Google Account</span>
                <div>
                  <strong style={{ fontSize: '0.88rem', color: 'white', display: 'block', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    sculptglow.location1@gmail.com
                  </strong>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#34d399', fontWeight: 700, marginTop: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', display: 'inline-block' }} /> Live Business Sync
                  </span>
                </div>
              </div>
            </div>

            {/* Google Reviews feed cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {googleReviews.map(review => {
                const isReplied = review.status === 'Replied';
                return (
                  <div
                    key={review.id}
                    className="card-premium"
                    style={{
                      borderLeft: isReplied ? '4px solid rgba(107, 44, 145, 0.4)' : '4px solid #D4AF37',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      {/* Left: Reviewer profile */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <img
                          src={review.reviewerAvatar}
                          style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(107, 44, 145, 0.2)' }}
                          alt={review.reviewerName}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ color: 'white', fontSize: '0.92rem' }}>{review.reviewerName}</strong>
                            <span
                              className="badge-brand gold"
                              style={{ fontSize: '0.52rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            >
                              Verified Google Local Guide
                            </span>
                          </div>
                          
                          {/* Rating stars */}
                          <div style={{ display: 'flex', gap: '2px', color: '#D4AF37', fontSize: '0.72rem', marginTop: '3px' }}>
                            {Array.from({ length: 5 }).map((_, idx) => (
                              <span key={idx}>{idx < review.rating ? '★' : '☆'}</span>
                            ))}
                            <span style={{ color: '#A89684', fontSize: '0.7rem', marginLeft: '6px' }}>{review.timeAgo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Treatment Tag & Status Badge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                        {review.service && (
                          <span className="badge-brand purple" style={{ fontSize: '0.62rem' }}>
                            Treatment: {review.service}
                          </span>
                        )}
                        <span
                          className={`badge-brand ${isReplied ? 'completed' : 'pending'}`}
                          style={{ fontSize: '0.62rem' }}
                        >
                          {isReplied ? '✓ Replied' : '⚠️ Unanswered'}
                        </span>
                      </div>
                    </div>

                    {/* Review comment text */}
                    <div style={{ margin: '14px 0', paddingLeft: '4px' }}>
                      <p style={{ color: '#F5EFE6', fontSize: '0.85rem', lineHeight: '1.5', margin: 0, fontStyle: 'italic' }}>
                        "{review.comment}"
                      </p>
                    </div>

                    {/* Reply Section */}
                    {isReplied ? (
                      <div
                        style={{
                          backgroundColor: 'rgba(107, 44, 145, 0.15)',
                          border: '1px solid rgba(107, 44, 145, 0.25)',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          fontSize: '0.8rem',
                          marginTop: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ color: '#D4AF37', fontSize: '0.75rem', textTransform: 'uppercase', tracking: '0.05em' }}>
                            Response from Owner (Verified GMB):
                          </strong>
                          <button
                            onClick={() => {
                              // Edit reply flow
                              setActiveReplyReview(review);
                              setReviewReplyText(review.reply);
                              setShowReplyModal(true);
                            }}
                            style={{
                              background: 'none', border: 'none', color: '#BFA6D8', fontSize: '0.68rem', cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Edit Response
                          </button>
                        </div>
                        <p style={{ color: '#BFA6D8', margin: 0, lineHeight: '1.4' }}>
                          {review.reply}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justify: 'flex-end', marginTop: '12px' }}>
                        <button
                          onClick={() => {
                            setActiveReplyReview(review);
                            setReviewReplyText('');
                            setShowReplyModal(true);
                          }}
                          className="btn-brand-gold"
                          style={{ fontSize: '0.72rem', padding: '6px 14px' }}
                        >
                          Reply on Google
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* REPLY MODAL OVERLAY */}
            {showReplyModal && activeReplyReview && (
              <div
                className="rent-suspend-overlay"
                style={{
                  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                  backgroundColor: 'rgba(13, 13, 13, 0.9)', backdropFilter: 'blur(10px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
                }}
              >
                <div
                  className="card-premium"
                  style={{
                    width: '100%', maxWidth: '540px', padding: '24px',
                    boxShadow: 'var(--shadow-premium), 0 0 30px rgba(107, 44, 145, 0.25)',
                    border: '1px solid hsl(var(--brand-purple) / 0.5)'
                  }}
                >
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: 'white', margin: '0 0 16px 0' }}>
                    Reply to Google Business Review
                  </h3>

                  {/* Original Review Bubble */}
                  <div
                    style={{
                      backgroundColor: 'hsl(var(--brand-black))', borderRadius: '10px',
                      padding: '12px 14px', border: '1px solid rgba(107, 44, 145, 0.15)',
                      marginBottom: '16px', fontSize: '0.78rem'
                    }}
                  >
                    <div style={{ display: 'flex', justify: 'space-between', marginBottom: '6px' }}>
                      <strong style={{ color: 'white' }}>{activeReplyReview.reviewerName}</strong>
                      <div style={{ color: '#D4AF37' }}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i}>{i < activeReplyReview.rating ? '★' : '☆'}</span>
                        ))}
                      </div>
                    </div>
                    <p style={{ color: '#BFA6D8', margin: 0, fontStyle: 'italic' }}>
                      "{activeReplyReview.comment}"
                    </p>
                  </div>

                  {/* Input Label & Assistant */}
                  <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '0.78rem', color: '#A89684', fontWeight: 600 }}>Your Public Owner Response:</label>
                    <button
                      onClick={() => {
                        const greeting = `Dear ${activeReplyReview.reviewerName},\n\n`;
                        const body = `Thank you so much for the glowing ${activeReplyReview.rating}-star Google review! We are absolutely delighted that you had such a premium experience at Sculpt & Glow. Our clinical team works incredibly hard to ensure every treatment feels comfortable and delivers excellent results. We cannot wait to welcome you back for another retreat soon!`;
                        const closing = `\n\nWarmest regards,\nThe Sculpt & Glow Management`;
                        setReviewReplyText(greeting + body + closing);
                      }}
                      type="button"
                      style={{
                        background: 'linear-gradient(135deg, rgba(107, 44, 145, 0.25) 0%, rgba(212, 175, 55, 0.1) 100%)',
                        border: '1px solid hsl(var(--brand-purple) / 0.4)', color: '#D4AF37',
                        padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', cursor: 'pointer',
                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px'
                      }}
                    >
                      <span>✨ Generate AI Response</span>
                    </button>
                  </div>

                  <textarea
                    rows={6}
                    value={reviewReplyText}
                    onChange={(e) => setReviewReplyText(e.target.value)}
                    placeholder="Enter your professional response..."
                    className="brand-input"
                    style={{ fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '20px', fontFamily: 'inherit' }}
                  />

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justify: 'flex-end', gap: '12px' }}>
                    <button
                      onClick={() => {
                        setShowReplyModal(false);
                        setActiveReplyReview(null);
                        setReviewReplyText('');
                      }}
                      className="btn-brand-purple"
                      style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                    >
                      Cancel
                    </button>
                    
                    <button
                      onClick={() => {
                        if (!reviewReplyText.trim()) {
                          alert('Please enter a response or use the AI Assistant before posting!');
                          return;
                        }
                        
                        setGoogleReviews(prev => {
                          const updated = prev.map(r => {
                            if (r.id === activeReplyReview.id) {
                              return { ...r, reply: reviewReplyText, status: 'Replied' };
                            }
                            return r;
                          });
                          localStorage.setItem('salon_google_reviews', JSON.stringify(updated));
                          return updated;
                        });
                        
                        logAction(currentUserName(), 'Google Review Reply', `Responded to ${activeReplyReview.reviewerName}'s review.`);
                        syncDatabase();
                        setShowReplyModal(false);
                        setActiveReplyReview(null);
                        setReviewReplyText('');
                        alert('Success! Reply posted to Google Business profile.');
                      }}
                      className="btn-brand-gold"
                      style={{ fontSize: '0.75rem', padding: '6px 14px' }}
                    >
                      Post Reply to Google
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WORKSPACE G: SERVICES MANAGEMENT */}
        {activeTab === 'services' && (() => {
          const filteredServices = services.filter(srv => {
            const query = serviceSearchQuery.toLowerCase();
            return srv.name.toLowerCase().includes(query) || 
                   srv.category.toLowerCase().includes(query) ||
                   (srv.requiredMachine || 'manual therapy').toLowerCase().includes(query);
          });

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Clinical Services Catalog</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Configure professional treatments list, discount bundles, and equipment targets.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '240px' }}>
                    <Search style={{ position: 'absolute', top: '9px', left: '10px', width: '14px', height: '14px', color: '#A89684' }} />
                    <input
                      type="text"
                      placeholder="Search treatments..."
                      className="brand-input"
                      style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '32px' }}
                      value={serviceSearchQuery}
                      onChange={(e) => setServiceSearchQuery(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsEditingService(false);
                      setActiveServiceForm({ name: '', category: 'Body Contouring', price: 150, duration: 30, requiredMachine: '', consumables: [] });
                      setShowServiceModal(true);
                    }}
                    className="btn-brand-gold"
                    style={{ height: '32px', fontSize: '0.8rem', padding: '0 16px' }}
                  >
                    + Add Service
                  </button>
                </div>
              </div>

              <div className="card-premium" style={{ overflowX: 'auto', border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(107, 44, 145, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '25%' }}>Treatment / Category</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '20%' }}>Hardware Target</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Price</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Consumables</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', width: '25%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map(srv => (
                      <tr 
                        key={srv.id} 
                        style={{ borderBottom: '1px solid rgba(107, 44, 145, 0.15)', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} 
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: 'white' }}>{srv.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: '#BFA6D8', marginTop: '2px' }}>{srv.category} • {srv.duration} mins</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className="badge-brand purple" style={{ fontSize: '0.58rem' }}>
                            {srv.requiredMachine ? (machines.find(m => m.id === srv.requiredMachine)?.name || srv.requiredMachine) : 'Manual Therapy'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'white' }}>
                          R {srv.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            onClick={() => setSelectedDrillDownService(srv)}
                            className="badge-brand gold hover-glow"
                            style={{ 
                              fontSize: '0.55rem', border: 'none', cursor: 'pointer', padding: '3px 8px', borderRadius: '4px',
                              backgroundColor: 'rgba(212, 175, 55, 0.15)', color: '#D4AF37'
                            }}
                          >
                            🔎 {srv.consumables?.length || 0} items
                          </button>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => {
                                setIsEditingService(true);
                                setActiveServiceForm(srv);
                                setShowServiceModal(true);
                              }}
                              style={{ border: 'none', backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove "${srv.name}"?`)) {
                                  deleteService(currentUserName(), srv.id);
                                  syncDatabase();
                                }
                              }}
                              style={{ border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredServices.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#A89684' }}>
                          No services found matching search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* WORKSPACE H: ATELIER SHOP SYNC */}
        {activeTab === 'products' && (() => {
          const filteredProducts = products.filter(prod => {
            const query = (sidebarSearch || '').toLowerCase();
            return prod.name.toLowerCase().includes(query) || prod.category.toLowerCase().includes(query);
          });

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Atelier E-Commerce Product Sync</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Synchronize product pricing parameters. Instantly updates client storefront website `/website`.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button onClick={() => {
                    setProductForm({ name: '', price: 0, stock: 10, category: 'Facial Products', image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300', description: '' });
                    setShowCustomCategoryInput(false);
                    setCustomCategoryText('');
                    setShowProductModal(true);
                  }} className="btn-brand-gold">
                    + Create Product
                  </button>
                </div>
              </div>

              {/* Redesigned Premium E-Commerce Catalog Grid */}
              <div className="card-premium" style={{ overflowX: 'auto', border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(107, 44, 145, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '35%' }}>Product description</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Price</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Current Stock</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '18%' }}>Visibility Status</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', width: '17%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(prod => (
                      <tr 
                        key={prod.id} 
                        style={{ borderBottom: '1px solid rgba(107, 44, 145, 0.15)', transition: 'all 0.2s ease' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} 
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={prod.image} alt={prod.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(212,175,55,0.2)' }} />
                          <div>
                            <strong style={{ color: 'white' }}>{prod.name}</strong>
                            <div style={{ fontSize: '0.72rem', color: '#BFA6D8', marginTop: '2px' }}>{prod.category}</div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'white' }}>R {prod.price.toFixed(2)}</td>
                        <td style={{ padding: '12px' }}>
                          <strong style={{ color: prod.stock <= 0 ? '#ef4444' : '#34d399' }}>{prod.stock} items</strong>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span className={`badge-brand ${prod.stock <= 0 ? 'cancelled' : 'gold'}`} style={{ fontSize: '0.58rem' }}>
                            {prod.stock <= 0 ? 'Marked Out-Stock' : 'Live on Shop'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => {
                                setEditingProduct(prod);
                                setProductForm({
                                  name: prod.name,
                                  price: prod.price,
                                  stock: prod.stock,
                                  category: prod.category,
                                  image: prod.image,
                                  description: prod.description || ''
                                });
                                setShowCustomCategoryInput(false);
                                setCustomCategoryText('');
                                setShowProductModal(true);
                              }}
                              style={{ border: 'none', backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                updateProduct(currentUserName(), { id: prod.id, name: prod.name, stock: prod.stock === 0 ? 15 : 0 });
                                syncDatabase();
                              }}
                              style={{
                                border: 'none',
                                backgroundColor: prod.stock === 0 ? 'rgba(52, 211, 153, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: prod.stock === 0 ? '#34d399' : '#ef4444',
                                padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px'
                              }}
                            >
                              {prod.stock === 0 ? 'In-Stock' : 'Out-Stock'}
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${prod.name}" completely from the Atelier Shop?`)) {
                                  deleteProduct(currentUserName(), prod.id);
                                  syncDatabase();
                                }
                              }}
                              style={{ border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#A89684' }}>
                          No boutique products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* WORKSPACE I: CONSUMABLES STOCK LEDGER */}
        {activeTab === 'inventory' && (() => {
          const filteredInventory = inventory.filter(item => {
            const query = inventorySearchQuery.toLowerCase();
            return item.name.toLowerCase().includes(query) || (item.supplier || '').toLowerCase().includes(query);
          });

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Consumables Stock Ledger</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Track salon treatment consumables. Highlighted in RED if alert threshold hit.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: '240px' }}>
                    <Search style={{ position: 'absolute', top: '9px', left: '10px', width: '14px', height: '14px', color: '#A89684' }} />
                    <input
                      type="text"
                      placeholder="Search stock ledger..."
                      className="brand-input"
                      style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '32px' }}
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      setInventoryForm({ name: '', quantity: 10, alertAt: 5, unit: 'items', cost: 0, sellPrice: 0, supplier: '' });
                      setShowInventoryModal(true);
                    }} 
                    className="btn-brand-gold"
                  >
                    + Add Consumable
                  </button>
                </div>
              </div>

              <div className="card-premium" style={{ overflowX: 'auto', border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(107, 44, 145, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '25%' }}>Item Name</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Current Stock</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Alert Threshold</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '25%' }}>Supplier Details</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(item => {
                      const isLow = item.quantity <= item.alertAt;
                      // Check if synced to e-commerce shop
                      const isSynced = products.some(p => p.name.toLowerCase() === item.name.toLowerCase());
                      const isRetailable = item.sellPrice > 0;

                      return (
                        <tr 
                          key={item.id} 
                          style={{ borderBottom: '1px solid rgba(107, 44, 145, 0.15)', backgroundColor: isLow ? 'rgba(239, 68, 68, 0.08)' : 'transparent', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = isLow ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255,255,255,0.02)'} 
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isLow ? 'rgba(239, 68, 68, 0.08)' : 'transparent'}
                        >
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: 'white' }}>{item.name}</strong>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: isLow ? '#ef4444' : '#34d399' }}>{item.quantity} {item.unit}</strong>
                          </td>
                          <td style={{ padding: '12px', color: '#BFA6D8' }}>{item.alertAt} {item.unit}</td>
                          <td style={{ padding: '12px', color: '#A89684', fontSize: '0.8rem' }}>{item.supplier}</td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {isRetailable && (
                                isSynced ? (
                                  <span style={{ color: '#34d399', fontSize: '0.62rem', fontWeight: 600, marginRight: '4px' }}>✓ Synced</span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      addProduct(currentUserName(), {
                                        name: item.name,
                                        price: item.sellPrice,
                                        stock: item.quantity,
                                        category: 'Atelier Retail Products',
                                        image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300',
                                        description: `Premium boutique selection: ${item.name} now available for purchase.`
                                      });
                                      syncDatabase();
                                    }}
                                    className="btn-brand-gold"
                                    style={{ padding: '4px 10px', fontSize: '0.7rem', height: '26px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    🔄 Sync Shop
                                  </button>
                                )
                              )}
                              <button
                                onClick={() => {
                                  setActiveStockItem(item);
                                  setStockAdjustForm({ type: 'add', amount: '', reason: '' });
                                  setShowStockAdjustModal(true);
                                }}
                                style={{ border: 'none', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: '#D4AF37', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                              >
                                Adjust Stock
                              </button>
                              <button
                                onClick={() => {
                                  setEditingInventoryItem(item);
                                  setInventoryForm({
                                    name: item.name,
                                    quantity: item.quantity,
                                    alertAt: item.alertAt,
                                    unit: item.unit,
                                    cost: item.cost || 0,
                                    sellPrice: item.sellPrice || 0,
                                    supplier: item.supplier || ''
                                  });
                                  setShowInventoryModal(true);
                                }}
                                style={{ border: 'none', backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete "${item.name}" from the stock ledger? (It will be preserved in the deletions archive)`)) {
                                    deleteInventoryItem(currentUserName(), item.id);
                                    syncDatabase();
                                  }
                                }}
                                style={{ border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInventory.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#A89684' }}>
                          No inventory stock records found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* WORKSPACE I.2: CLIENT E-COMMERCE ORDERS */}
        {activeTab === 'orders' && (() => {
          // Locate all orders which contain products or have shipping address
          const sortedInvoices = [...invoices].sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
          const orderInvoices = sortedInvoices.filter(inv => 
            inv.items.some(item => item.name.includes('[Product]')) || inv.shippingAddress
          );

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Client Product Orders</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Track storefront e-commerce purchases, verify payment status, and manage physical product shipments.</p>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#A89684', fontWeight: 600 }}>
                  {orderInvoices.length} e-commerce orders logged
                </div>
              </div>

              <div className="card-premium" style={{ overflowX: 'auto', border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(107, 44, 145, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Order Ref</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '22%' }}>Client Details</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '23%' }}>Shipping Address</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Gross Total</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '13%' }}>Payment</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', width: '12%' }}>Shipment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderInvoices.map(inv => {
                      const cli = clients.find(c => c.id === inv.clientId) || {
                        name: 'Alice Smith',
                        phone: '+27 (82) 019-2834',
                        email: 'alice.smith@gmail.com'
                      };
                      const itemsText = inv.items.map(it => `${it.quantity}x ${it.name.split(' [')[0]}`).join(', ');
                      const isPaid = inv.status === 'Paid';
                      const isShipped = inv.shippingStatus === 'Shipped';

                      return (
                        <tr 
                          key={inv.id} 
                          style={{ borderBottom: '1px solid rgba(107, 44, 145, 0.15)', transition: 'all 0.2s ease' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} 
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: 'white' }}>{inv.invoiceNumber}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#A89684', marginTop: '2px' }}>{inv.date}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: '#BFA6D8' }}>{cli.name}</strong>
                            <div style={{ fontSize: '0.68rem', color: '#A89684', marginTop: '2px' }}>{cli.phone}</div>
                            <div style={{ fontSize: '0.68rem', color: '#A89684' }}>{cli.email}</div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <div style={{ fontSize: '0.78rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={inv.shippingAddress || '12 Glenwood Gardens, Pretoria East'}>
                              {inv.shippingAddress || '12 Glenwood Gardens, Pretoria East'}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#A89684', marginTop: '3px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              Items: {itemsText}
                            </div>
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'white' }}>
                            R {inv.total.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge-brand ${inv.status.toLowerCase()}`} style={{ fontSize: '0.6rem' }}>
                              {inv.status === 'Paid' ? '✓ Confirmed' : '⚠ Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            {isShipped ? (
                              <span style={{ color: '#34d399', fontSize: '0.65rem', fontWeight: 700 }}>✓ Shipped</span>
                            ) : (
                              <button
                                disabled={!isPaid}
                                onClick={() => {
                                  if (!isPaid) {
                                    alert('Payment confirmation is required before arranging physical parcel shipments!');
                                    return;
                                  }
                                  // Mark order as shipped
                                  inv.shippingStatus = 'Shipped';
                                  logAction(currentUserName(), 'Arrange Shipment', `Shipped order ${inv.invoiceNumber} to ${cli.name} at ${inv.shippingAddress || '12 Glenwood Gardens'}`);
                                  syncDatabase();
                                }}
                                className={isPaid ? 'btn-brand-gold' : 'btn-brand-purple'}
                                style={{
                                  padding: '4px 8px', fontSize: '0.65rem', height: '24px',
                                  opacity: isPaid ? 1 : 0.4, cursor: isPaid ? 'pointer' : 'not-allowed'
                                }}
                                title={isPaid ? 'Mark as Shipped' : 'Cannot ship - payment pending'}
                              >
                                Ship Order
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {orderInvoices.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#A89684' }}>
                          No storefront client product orders have been logged yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

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
        {activeTab === 'billing' && (() => {
          const sortedInvoices = [...invoices].sort((a, b) => b.invoiceNumber.localeCompare(a.invoiceNumber));
          const filteredInvoices = sortedInvoices.filter(inv => {
            const cli = clients.find(c => c.id === inv.clientId);
            const clientName = cli ? cli.name.toLowerCase() : 'walk-in guest';
            const query = invoiceSearchQuery.toLowerCase();
            return inv.invoiceNumber.toLowerCase().includes(query) || clientName.includes(query);
          });

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Invoices & Payments Ledger</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Search tax invoices, track settlement states, and view formal accounts dossiers.</p>
                </div>
                <div style={{ position: 'relative', width: '280px' }}>
                  <Search style={{ position: 'absolute', top: '9px', left: '10px', width: '14px', height: '14px', color: '#A89684' }} />
                  <input
                    type="text"
                    placeholder="Search invoice # or client..."
                    className="brand-input"
                    style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '32px' }}
                    value={invoiceSearchQuery}
                    onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="card-premium" style={{ overflowX: 'auto', border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(107, 44, 145, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '20%' }}>Invoice Details</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '22%' }}>Client Name</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Gross Total</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Settlement</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right', width: '28%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map(inv => {
                      const cli = clients.find(c => c.id === inv.clientId);
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(107, 44, 145, 0.15)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: 'white' }}>{inv.invoiceNumber}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#A89684', marginTop: '2px' }}>Issued: {inv.date}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#BFA6D8', fontWeight: 500 }}>
                            {cli ? cli.name : 'Walk-in Guest'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'white' }}>
                            R {inv.total.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge-brand ${inv.status.toLowerCase()}`} style={{ fontSize: '0.62rem' }}>
                              {inv.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {inv.status === 'Unpaid' && (
                                <button
                                  onClick={() => {
                                    setActivePaymentInvoice(inv);
                                    setPaymentForm({ amount: inv.total, method: 'Card' });
                                    setShowPaymentModal(true);
                                  }}
                                  className="btn-brand-gold"
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', height: '26px' }}
                                >
                                  Pay
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setActiveViewInvoice(inv);
                                  setShowInvoiceModal(true);
                                }}
                                className="btn-brand-purple"
                                style={{ padding: '4px 8px', fontSize: '0.7rem', height: '26px' }}
                              >
                                View Invoice
                              </button>
                              
                              <button
                                onClick={() => {
                                  setActivePrintInvoice(inv);
                                  setShowPrintModal(true);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: 'hsl(var(--brand-black))', color: 'white', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                              >
                                <Printer style={{ width: '12px', height: '12px' }} /> Slip
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
                                  style={{ border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                                >
                                  Refund
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredInvoices.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#A89684' }}>
                          No invoices found matching search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* WORKSPACE L: QUOTES GENERATOR */}
        {activeTab === 'quotes' && (() => {
          const sortedQuotes = [...quotes].sort((a, b) => b.quoteNumber.localeCompare(a.quoteNumber));
          const filteredQuotes = sortedQuotes.filter(qte => {
            const cli = clients.find(c => c.id === qte.clientId);
            const clientName = cli ? cli.name.toLowerCase() : 'walk-in';
            const query = quoteSearchQuery.toLowerCase();
            return qte.quoteNumber.toLowerCase().includes(query) || clientName.includes(query);
          });

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', gap: '24px' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Quotes Creator</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Create luxury package quotations. Convert quote to invoice instantly with one click!</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <Search style={{ position: 'absolute', top: '9px', left: '10px', width: '14px', height: '14px', color: '#A89684' }} />
                    <input
                      type="text"
                      placeholder="Search quote # or client..."
                      className="brand-input"
                      style={{ paddingLeft: '32px', fontSize: '0.8rem', height: '32px' }}
                      value={quoteSearchQuery}
                      onChange={(e) => setQuoteSearchQuery(e.target.value)}
                    />
                  </div>
                  <button onClick={() => { setQuoteClient(''); setManualQuoteClientSearch(''); setQuoteItems([{ name: '', quantity: 1, price: 0 }]); setQuoteDiscount(0); setShowQuoteModal(true); }} className="btn-brand-gold">
                    + Create Quote
                  </button>
                </div>
              </div>

              <div className="card-premium" style={{ overflowX: 'auto', border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', marginBottom: '16px', color: 'white' }}>Quotations Ledger</h3>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(107, 44, 145, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700 }}>Quote ID</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700 }}>Client Name</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700 }}>Discount</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700 }}>Total Cost</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuotes.map(qte => {
                      const cli = clients.find(c => c.id === qte.clientId);
                      return (
                        <tr key={qte.id} style={{ borderBottom: '1px solid rgba(107, 44, 145, 0.15)', transition: 'all 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '12px' }}>
                            <strong style={{ color: 'white' }}>{qte.quoteNumber}</strong>
                            <div style={{ fontSize: '0.7rem', color: '#A89684', marginTop: '2px' }}>Created: {qte.date}</div>
                          </td>
                          <td style={{ padding: '12px', color: '#BFA6D8', fontWeight: 500 }}>
                            {cli?.name || 'Walk-in'}
                          </td>
                          <td style={{ padding: '12px', color: '#BFA6D8' }}>
                            {qte.discount}%
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700, color: 'white' }}>
                            R {qte.total.toFixed(2)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`badge-brand ${qte.status === 'Converted' ? 'completed' : 'gold'}`} style={{ fontSize: '0.62rem' }}>
                              {qte.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button
                                onClick={() => {
                                  setActiveViewQuote(qte);
                                  setShowQuoteViewModal(true);
                                }}
                                className="btn-brand-gold"
                                style={{ padding: '4px 8px', fontSize: '0.7rem', height: '26px' }}
                              >
                                View Quote
                              </button>

                              <button
                                onClick={() => alert(`Quotation ${qte.quoteNumber} successfully emailed to client!`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: 'hsl(var(--brand-black))', color: '#BFA6D8', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                              >
                                <Mail style={{ width: '12px', height: '12px' }} /> Email
                              </button>

                              <button
                                onClick={() => alert(`Quotation ${qte.quoteNumber} successfully sent to client WhatsApp!`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: 'hsl(var(--brand-black))', color: '#34d399', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                              >
                                <MessageSquare style={{ width: '12px', height: '12px' }} /> WhatsApp
                              </button>

                              {qte.status === 'Active' && (
                                <button
                                  onClick={() => {
                                    convertQuoteToInvoice(currentUserName(), qte.id);
                                    syncDatabase();
                                    alert('Success! Quote converted to Unpaid Invoice in billing ledger.');
                                  }}
                                  className="btn-brand-purple"
                                  style={{ padding: '4px 8px', fontSize: '0.7rem', height: '26px' }}
                                >
                                  Convert
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredQuotes.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#A89684' }}>
                          No quotations found matching search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {/* WORKSPACE M: ANALYTICS & P&L CHARTS */}
        {activeTab === 'expenses' && currentUserRole === 'owner' && (() => {
          const isExpenseDateInRange = (dateStr) => {
            if (!dateStr) return false;
            const itemDate = new Date(dateStr);
            itemDate.setHours(0,0,0,0);
            
            const now = new Date();
            now.setHours(0,0,0,0);

            if (expensesFilterType === 'all') {
              return true;
            }
            if (expensesFilterType === 'today') {
              const todayStr = now.toISOString().split('T')[0];
              return dateStr === todayStr;
            }
            if (expensesFilterType === 'last_week') {
              const oneWeekAgo = new Date(now);
              oneWeekAgo.setDate(now.getDate() - 7);
              return itemDate >= oneWeekAgo && itemDate <= now;
            }
            if (expensesFilterType === 'last_month') {
              const oneMonthAgo = new Date(now);
              oneMonthAgo.setMonth(now.getMonth() - 1);
              return itemDate >= oneMonthAgo && itemDate <= now;
            }
            if (expensesFilterType === 'custom') {
              if (expensesStartDate && expensesEndDate) {
                const start = new Date(expensesStartDate);
                start.setHours(0,0,0,0);
                const end = new Date(expensesEndDate);
                end.setHours(23,59,59,999);
                return itemDate >= start && itemDate <= end;
              } else if (expensesStartDate) {
                const start = new Date(expensesStartDate);
                start.setHours(0,0,0,0);
                return itemDate >= start;
              } else if (expensesEndDate) {
                const end = new Date(expensesEndDate);
                end.setHours(23,59,59,999);
                return itemDate <= end;
              }
              return true;
            }
            return true;
          };

          const filteredExpensesList = expenses.filter(exp => isExpenseDateInRange(exp.date));

          const getComputedExpenseAmount = (exp) => {
            if (exp.frequency === 'per_use' && exp.machineId) {
              const usageCount = appointments.filter(a => a.machineId === exp.machineId && a.status !== 'Cancelled').length;
              return exp.amount * usageCount;
            }
            return exp.amount;
          };

          const totalExpensesSum = filteredExpensesList.reduce((acc, exp) => acc + getComputedExpenseAmount(exp), 0);

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Financial Operating Expenses</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>P&L analysis, rent logs, utility bills, and hardware amortization.</p>
                </div>
                
                {/* Date range filter controls */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select 
                    className="brand-input" 
                    value={expensesFilterType} 
                    onChange={(e) => setExpensesFilterType(e.target.value)}
                    style={{ width: '150px', height: '36px', fontSize: '0.8rem' }}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="custom">Custom Range...</option>
                  </select>

                  {expensesFilterType === 'custom' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="date" 
                        className="brand-input" 
                        value={expensesStartDate} 
                        onChange={(e) => setExpensesStartDate(e.target.value)}
                        style={{ height: '36px', fontSize: '0.8rem' }}
                      />
                      <span style={{ color: '#BFA6D8', fontSize: '0.8rem' }}>to</span>
                      <input 
                        type="date" 
                        className="brand-input" 
                        value={expensesEndDate} 
                        onChange={(e) => setExpensesEndDate(e.target.value)}
                        style={{ height: '36px', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  <button onClick={() => {
                    setEditingExpense(null);
                    setExpenseForm({ category: 'Rent', description: '', amount: 0, machineId: '', frequency: 'once_off' });
                    setShowExpenseModal(true);
                  }} className="btn-brand-gold">
                    + Log Expense
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px' }}>
                <div className="card-premium">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: 'white', margin: 0 }}>Expenses Tally</h3>
                    <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 700 }}>Total: R {totalExpensesSum.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
                    {filteredExpensesList.map(exp => {
                      const linkedMachine = machines.find(m => m.id === exp.machineId);
                      const computedAmount = getComputedExpenseAmount(exp);
                      
                      let useInfo = '';
                      if (exp.frequency === 'per_use' && exp.machineId) {
                        const usageCount = appointments.filter(a => a.machineId === exp.machineId && a.status !== 'Cancelled').length;
                        useInfo = ` (R ${exp.amount.toFixed(2)} x ${usageCount} uses)`;
                      }
                      
                      let billingTypeLabel = 'Once-off';
                      if (exp.frequency === 'monthly') billingTypeLabel = 'Monthly';
                      if (exp.frequency === 'per_use') billingTypeLabel = 'Per Session';

                      return (
                        <div key={exp.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{exp.category} <span style={{ fontSize: '0.68rem', fontWeight: 400, color: '#A89684' }}>({billingTypeLabel})</span></strong>
                              <span style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', marginTop: '2px' }}>{exp.description}{useInfo}</span>
                              <span style={{ display: 'block', fontSize: '0.65rem', color: '#A89684', marginTop: '2px' }}>Date: {exp.date || new Date().toISOString().split('T')[0]}</span>
                              {linkedMachine && (
                                <span style={{ display: 'inline-block', fontSize: '0.65rem', color: '#D4AF37', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '2px 6px', borderRadius: '4px', marginTop: '4px' }}>
                                  Linked Machine: {linkedMachine.name}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                              <strong style={{ color: '#ef4444' }}>- R {computedAmount.toFixed(2)}</strong>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button
                                  onClick={() => {
                                    setEditingExpense(exp);
                                    setExpenseForm({
                                      category: exp.category,
                                      description: exp.description,
                                      amount: exp.amount,
                                      machineId: exp.machineId || '',
                                      frequency: exp.frequency || 'once_off'
                                    });
                                    setShowExpenseModal(true);
                                  }}
                                  style={{ border: 'none', backgroundColor: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete this expense record: "${exp.category} - ${exp.description}"? (It will be stored in the deletions archive)`)) {
                                      deleteExpense(currentUserName(), exp.id);
                                      syncDatabase();
                                    }
                                  }}
                                  style={{ border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', height: '26px' }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {filteredExpensesList.length === 0 && (
                      <div style={{ padding: '24px', textAlign: 'center', color: '#A89684' }}>
                        No operating expenses logged in this range.
                      </div>
                    )}
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
                        { month: 'May', Sales: invoices.reduce((acc, i) => acc + i.total, 0), Expenses: totalExpensesSum }
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
          );
        })()}

        {/* WORKSPACE N: REFUNDS & PAYMENTS LOG */}
        {activeTab === 'payments' && (() => {
          // Date helper
          const isDateInRange = (dateStr) => {
            if (!dateStr) return false;
            const itemDate = new Date(dateStr);
            itemDate.setHours(0,0,0,0);
            
            const now = new Date();
            now.setHours(0,0,0,0);

            if (paymentsFilterType === 'all') {
              return true;
            }
            if (paymentsFilterType === 'today') {
              const todayStr = now.toISOString().split('T')[0];
              return dateStr === todayStr;
            }
            if (paymentsFilterType === 'last_week') {
              const oneWeekAgo = new Date(now);
              oneWeekAgo.setDate(now.getDate() - 7);
              return itemDate >= oneWeekAgo && itemDate <= now;
            }
            if (paymentsFilterType === 'last_month') {
              const oneMonthAgo = new Date(now);
              oneMonthAgo.setMonth(now.getMonth() - 1);
              return itemDate >= oneMonthAgo && itemDate <= now;
            }
            if (paymentsFilterType === 'custom') {
              if (paymentsStartDate && paymentsEndDate) {
                const start = new Date(paymentsStartDate);
                start.setHours(0,0,0,0);
                const end = new Date(paymentsEndDate);
                end.setHours(23,59,59,999);
                return itemDate >= start && itemDate <= end;
              } else if (paymentsStartDate) {
                const start = new Date(paymentsStartDate);
                start.setHours(0,0,0,0);
                return itemDate >= start;
              } else if (paymentsEndDate) {
                const end = new Date(paymentsEndDate);
                end.setHours(23,59,59,999);
                return itemDate <= end;
              }
              return true;
            }
            return true;
          };

          // Get and sort payments
          const paymentsList = [];
          invoices.forEach(inv => {
            (inv.payments || []).forEach(pay => {
              paymentsList.push({
                invoiceId: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientId: inv.clientId,
                method: pay.method,
                txnId: pay.txnId || 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                date: pay.date || inv.date,
                amount: pay.amount,
                invoice: inv
              });
            });
          });

          const filteredPayments = paymentsList
            .filter(pay => isDateInRange(pay.date))
            .sort((a, b) => b.date.localeCompare(a.date));

          // Outstanding invoices (Unpaid status) in date scope
          const unpaidInvoicesList = invoices
            .filter(inv => inv.status === 'Unpaid' && isDateInRange(inv.date))
            .sort((a, b) => b.date.localeCompare(a.date));

          // Fully Paid invoices in date scope
          const paidInvoicesList = invoices
            .filter(inv => inv.status === 'Paid' && isDateInRange(inv.date))
            .sort((a, b) => b.date.localeCompare(a.date));

          // Refunded invoices
          const refundedInvoices = invoices
            .filter(inv => inv.status === 'Refunded' && isDateInRange(inv.date))
            .sort((a, b) => b.date.localeCompare(a.date));

          // Totals in scope
          const totalPaid = filteredPayments.reduce((acc, pay) => acc + pay.amount, 0);
          const totalOutstanding = unpaidInvoicesList.reduce((acc, inv) => acc + inv.total, 0);
          const totalRefunded = refundedInvoices.reduce((acc, inv) => acc + inv.total, 0);

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit' }}>Payment Transactions & Refunds Log</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>Review card transactions, cash deposits, and logged refund justifications.</p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select 
                    className="brand-input" 
                    value={paymentsFilterType} 
                    onChange={(e) => setPaymentsFilterType(e.target.value)}
                    style={{ width: '150px', height: '36px', fontSize: '0.8rem' }}
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="last_week">Last Week</option>
                    <option value="last_month">Last Month</option>
                    <option value="custom">Custom Range...</option>
                  </select>

                  {paymentsFilterType === 'custom' && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="date" 
                        className="brand-input" 
                        value={paymentsStartDate} 
                        onChange={(e) => setPaymentsStartDate(e.target.value)}
                        style={{ height: '36px', fontSize: '0.8rem' }}
                      />
                      <span style={{ color: '#BFA6D8', fontSize: '0.8rem' }}>to</span>
                      <input 
                        type="date" 
                        className="brand-input" 
                        value={paymentsEndDate} 
                        onChange={(e) => setPaymentsEndDate(e.target.value)}
                        style={{ height: '36px', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Totals Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                <div className="card-premium" style={{ borderLeft: '4px solid #34d399', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#BFA6D8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Invoices Paid</span>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#34d399', fontFamily: 'Outfit' }}>R {totalPaid.toFixed(2)}</h2>
                  <span style={{ fontSize: '0.68rem', color: '#A89684' }}>Settled cash/card receipts in scope</span>
                </div>
                <div className="card-premium" style={{ borderLeft: '4px solid #D4AF37', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#BFA6D8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Outstanding Payments</span>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#D4AF37', fontFamily: 'Outfit' }}>R {totalOutstanding.toFixed(2)}</h2>
                  <span style={{ fontSize: '0.68rem', color: '#A89684' }}>Pending unpaid invoices in scope</span>
                </div>
                <div className="card-premium" style={{ borderLeft: '4px solid #ef4444', padding: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#BFA6D8', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Refunds Processed</span>
                  <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ef4444', fontFamily: 'Outfit' }}>R {totalRefunded.toFixed(2)}</h2>
                  <span style={{ fontSize: '0.68rem', color: '#A89684' }}>Revenue reversals in scope</span>
                </div>
              </div>

              {/* OUTSTANDING / UNPAID INVOICES */}
              <div className="card-premium" style={{ border: '1px solid rgba(212, 175, 55, 0.25)', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: '#D4AF37', margin: 0 }}>Outstanding / Unpaid Invoices</h3>
                  <span style={{ fontSize: '0.75rem', color: '#A89684' }}>{unpaidInvoicesList.length} invoices awaiting payment</span>
                </div>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(212, 175, 55, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '20%' }}>Invoice ID</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '30%' }}>Client Name</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Date Issued</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Balance Due</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '20%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unpaidInvoicesList.map(inv => {
                      const cli = clients.find(c => c.id === inv.clientId);
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.15)' }}>
                          <td style={{ padding: '12px' }}><strong>{inv.invoiceNumber}</strong></td>
                          <td style={{ padding: '12px', color: '#BFA6D8', fontWeight: 500 }}>{cli?.name || 'Walk-in Guest'}</td>
                          <td style={{ padding: '12px', color: '#A89684', fontSize: '0.78rem' }}>{inv.date}</td>
                          <td style={{ padding: '12px' }}><strong style={{ color: '#D4AF37' }}>R {inv.total.toFixed(2)}</strong></td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => {
                                  setActivePaymentInvoice(inv);
                                  setPaymentForm({ amount: inv.total, method: 'Card' });
                                  setShowPaymentModal(true);
                                }}
                                className="btn-brand-gold"
                                style={{ padding: '2px 6px', fontSize: '0.65rem', height: '22px' }}
                              >
                                Settle Pay
                              </button>
                              <button
                                onClick={() => { setActiveViewInvoice(inv); setShowInvoiceModal(true); }}
                                className="btn-brand-purple"
                                style={{ padding: '2px 6px', fontSize: '0.65rem', height: '22px' }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => alert(`Unpaid invoice ${inv.invoiceNumber} emailed to ${cli?.email || 'client'}`)}
                                style={{ border: 'none', backgroundColor: '#1e1b4b', color: '#BFA6D8', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', height: '22px' }}
                              >
                                Email
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {unpaidInvoicesList.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#A89684', fontSize: '0.85rem' }}>
                          ✓ Perfect! No outstanding invoices recorded in this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>



              {/* Payments ledger (journal audit) */}
              <div className="card-premium" style={{ border: '1px solid rgba(107, 44, 145, 0.25)', overflowX: 'auto' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: 'white', margin: '0 0 16px 0' }}>Settled Deposit / Payments Journal</h3>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(107, 44, 145, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '18%' }}>Invoice ID</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '22%' }}>Client Name</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '12%' }}>Method</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '16%' }}>Txn Reference</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '12%' }}>Date</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '10%' }}>Amount Paid</th>
                      <th style={{ padding: '12px', color: '#D4AF37', fontSize: '0.85rem', fontWeight: 700, width: '10%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((pay, idx) => {
                      const cli = clients.find(c => c.id === pay.clientId);
                      return (
                        <tr key={`${pay.invoiceId}-${idx}`} style={{ borderBottom: '1px solid rgba(107, 44, 145, 0.15)' }}>
                          <td style={{ padding: '12px' }}><strong>{pay.invoiceNumber}</strong></td>
                          <td style={{ padding: '12px', color: '#BFA6D8', fontWeight: 500 }}>{cli?.name || 'Walk-in Guest'}</td>
                          <td style={{ padding: '12px' }}><span className="badge-brand purple" style={{ fontSize: '0.58rem' }}>{pay.method}</span></td>
                          <td style={{ padding: '12px' }}><code>{pay.txnId}</code></td>
                          <td style={{ padding: '12px', color: '#A89684', fontSize: '0.78rem' }}>{pay.date}</td>
                          <td style={{ padding: '12px' }}><strong style={{ color: '#34d399' }}>R {pay.amount.toFixed(2)}</strong></td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => { setActiveViewInvoice(pay.invoice); setShowInvoiceModal(true); }}
                                className="btn-brand-purple"
                                style={{ padding: '2px 6px', fontSize: '0.65rem', height: '22px' }}
                              >
                                View
                              </button>
                              <button 
                                onClick={() => alert(`Payment receipt for ${pay.invoiceNumber} emailed to ${cli?.email || 'client'}`)}
                                style={{ border: 'none', backgroundColor: '#1e1b4b', color: '#BFA6D8', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', height: '22px' }}
                              >
                                Email
                              </button>
                              <button 
                                onClick={() => alert(`Payment receipt for ${pay.invoiceNumber} sent via WhatsApp to ${cli?.phone || 'client'}`)}
                                style={{ border: 'none', backgroundColor: '#064e3b', color: '#34d399', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', height: '22px' }}
                              >
                                WhatsApp
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPayments.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: '#A89684', fontSize: '0.85rem' }}>
                          No settled payments recorded in this filter period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Refunds ledger */}
              <div className="card-premium" style={{ border: '1px solid rgba(239, 68, 68, 0.25)', overflowX: 'auto' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: '#ef4444', margin: '0 0 16px 0' }}>Refunded Invoices Registry</h3>
                <table className="table-premium" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(239, 68, 68, 0.3)' }}>
                      <th style={{ padding: '12px', color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, width: '20%' }}>Invoice ID</th>
                      <th style={{ padding: '12px', color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, width: '25%' }}>Client Name</th>
                      <th style={{ padding: '12px', color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, width: '30%' }}>Refund Reason</th>
                      <th style={{ padding: '12px', color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, width: '15%' }}>Amount Refunded</th>
                      <th style={{ padding: '12px', color: '#fca5a5', fontSize: '0.85rem', fontWeight: 700, width: '10%', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundedInvoices.map(inv => {
                      const cli = clients.find(c => c.id === inv.clientId);
                      return (
                        <tr key={inv.id} style={{ borderBottom: '1px solid rgba(239, 68, 68, 0.15)' }}>
                          <td style={{ padding: '12px' }}><strong>{inv.invoiceNumber}</strong><div style={{ fontSize: '0.7rem', color: '#A89684' }}>Refund Date: {inv.date}</div></td>
                          <td style={{ padding: '12px', color: '#BFA6D8', fontWeight: 500 }}>{cli?.name || 'Walk-in Guest'}</td>
                          <td style={{ padding: '12px', color: '#fca5a5', fontSize: '0.8rem', fontStyle: 'italic' }}>{inv.refundReason || 'Service adjustment'}</td>
                          <td style={{ padding: '12px' }}><strong style={{ color: '#ef4444' }}>R {inv.total.toFixed(2)}</strong></td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => { setActiveRefundInvoice(inv); setShowRefundLetterModal(true); }}
                                className="btn-brand-gold"
                                style={{ padding: '2px 6px', fontSize: '0.65rem', height: '22px' }}
                              >
                                Refund Letter
                              </button>
                              <button 
                                onClick={() => alert(`Refund letter for ${inv.invoiceNumber} successfully emailed to ${cli?.email || 'client'}!`)}
                                style={{ border: 'none', backgroundColor: '#1e1b4b', color: '#BFA6D8', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', height: '22px' }}
                              >
                                Email
                              </button>
                              <button 
                                onClick={() => alert(`Refund letter for ${inv.invoiceNumber} successfully sent via WhatsApp to ${cli?.phone || 'client'}!`)}
                                style={{ border: 'none', backgroundColor: '#064e3b', color: '#34d399', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem', height: '22px' }}
                              >
                                WhatsApp
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {refundedInvoices.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#A89684', fontSize: '0.85rem' }}>
                          No refunds issued in this filter period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

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
                  <div
                    key={staff.id}
                    onClick={() => setActiveCommissionsDrilldownStaff(staff)}
                    className="card-premium"
                    style={{ border: '1px solid rgba(107, 44, 145, 0.25)', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#D4AF37'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(107, 44, 145, 0.25)'}
                  >
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', color: 'white', marginBottom: '16px' }}>{staff.name}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                      <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                        <span>Role:</span>
                        <strong style={{ color: 'white' }}>{staff.role}</strong>
                      </div>
                      <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                        <span>Service splits ({staff.commissionRate || 10}%):</span>
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
                      <div style={{ fontSize: '0.72rem', color: '#A89684', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', textAlign: 'center' }}>
                        💡 Click card to view sales drill-down ledger
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WORKSPACE Q.2: STAFF PROFILE & HR PORTAL */}
        {activeTab === 'staff' && (() => {
          const currentStaff = users.find(u => u.id === selectedStaffId) || users[0];
          if (!currentStaff) return <div style={{ color: 'white' }}>Loading staff profiles...</div>;

          const isOwner = currentUserRole === 'owner';
          const activeUserObj = users.find(u => u.username === (currentUserRole === 'receptionist' ? 'reception' : currentUserRole === 'therapist' ? 'therapist' : 'owner')) || currentStaff;
          const displayStaff = isOwner ? currentStaff : activeUserObj;

          // Calculate Target Progress
          const completedApts = appointments.filter(a => a.staffId === displayStaff.id && a.status === 'Completed');
          const actualServicesTotal = completedApts.reduce((acc, a) => {
            const srv = services.find(s => s.id === a.serviceId);
            return acc + (srv ? srv.price : 0);
          }, 0);
          const targetProgressPercent = displayStaff.servicesTarget ? Math.min(100, Math.floor((actualServicesTotal / displayStaff.servicesTarget) * 100)) : 0;

          // Calculate Commissions
          const comm = getStaffCommissions(displayStaff.id);
          
          // Calculate active claims, loans, bonuses
          const approvedClaims = (displayStaff.claims || []).filter(c => c.status === 'approved');
          const claimsAmt = approvedClaims.reduce((acc, c) => acc + Number(c.amount), 0);
          const bonusesAmt = (displayStaff.bonuses || []).reduce((acc, b) => acc + Number(b.amount), 0);
          const activeLoans = (displayStaff.loans || []).filter(l => l.status === 'approved' && l.repaymentMonthsLeft > 0);
          const loansAmt = activeLoans.reduce((acc, l) => acc + l.monthlyRepayment, 0);

          const netSalary = Number((displayStaff.salary + comm.total + claimsAmt + bonusesAmt - loansAmt).toFixed(2));

          return (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit', color: '#D4AF37' }}>Staffing & HR Portal</h1>
                  <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                    {isOwner ? 'Manage employees, banking details, leave allocations, claims, and monthly payslips.' : 'View your target progress, submit leave requests, claims, loan requests, and download payslips.'}
                  </p>
                </div>
                {isOwner && (
                  <button
                    onClick={() => {
                      setNewStaffForm({
                        name: '', username: '', role: 'therapist', email: '', pin: '1234',
                        salary: 12500, bankName: 'FNB Pretoria', accountHolder: '', accountNumber: '', branchCode: '250655'
                      });
                      setShowNewStaffModal(true);
                    }}
                    className="btn-brand-gold"
                    style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus style={{ width: '16px', height: '16px' }} /> Register Staff Member
                  </button>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '280px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
                
                {/* STAFF LIST DIRECTORY (Owner Only) */}
                {isOwner && (
                  <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '16px' }}>
                    <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 8px 0', borderBottom: '1px solid rgba(107, 44, 145, 0.2)', paddingBottom: '6px' }}>Employees Directory</h3>
                    {users.map(u => (
                      <div
                        key={u.id}
                        onClick={() => setSelectedStaffId(u.id)}
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          backgroundColor: selectedStaffId === u.id ? 'rgba(107, 44, 145, 0.2)' : 'rgba(255, 255, 255, 0.02)',
                          border: selectedStaffId === u.id ? '1px solid #D4AF37' : '1px solid transparent',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {u.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                          <div style={{ fontSize: '0.72rem', color: '#BFA6D8', textTransform: 'capitalize' }}>{u.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* MAIN DOSSIER CANVAS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* STAFF PROFILE TARGET BANNER */}
                  <div className="card-premium" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(107, 44, 145, 0.25)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37', fontWeight: 'bold', fontSize: '1.4rem' }}>
                          {displayStaff.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <h2 style={{ fontFamily: 'Outfit', margin: 0, color: 'white', fontSize: '1.3rem' }}>{displayStaff.name}</h2>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                            <span className="badge-brand purple" style={{ fontSize: '0.65rem' }}>{displayStaff.role.toUpperCase()}</span>
                            <span style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>{displayStaff.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: '#A89684', display: 'block' }}>Basic Monthly Salary</span>
                        <strong style={{ fontSize: '1.25rem', color: '#34d399', fontFamily: 'Outfit' }}>R {Number(displayStaff.salary || 0).toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Target Bar */}
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#BFA6D8', marginBottom: '6px' }}>
                        <span>Target Progress (Services Target)</span>
                        <strong>R {actualServicesTotal.toLocaleString()} / R {Number(displayStaff.servicesTarget || 0).toLocaleString()} ({targetProgressPercent}%)</strong>
                      </div>
                      <div style={{ height: '8px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${targetProgressPercent}%`, height: '100%', backgroundColor: targetProgressPercent >= 100 ? '#34d399' : '#D4AF37', borderRadius: '4px', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>

                  {/* DOSSIER TABS */}
                  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(107, 44, 145, 0.2)', paddingBottom: '2px', overflowX: 'auto' }}>
                    {[
                      { id: 'profile', label: 'Overview & Salary' },
                      { id: 'leave', label: 'Leave Requests' },
                      { id: 'claims', label: 'Claims & Travel' },
                      { id: 'loans', label: 'App Loans' },
                      { id: 'documents', label: 'Documents & Contracts' },
                      { id: 'payslips', label: 'Payslip Vault' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedStaffDossierTab(tab.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: selectedStaffDossierTab === tab.id ? '#D4AF37' : '#BFA6D8',
                          borderBottom: selectedStaffDossierTab === tab.id ? '2px solid #D4AF37' : '2px solid transparent',
                          padding: '8px 14px',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          fontWeight: selectedStaffDossierTab === tab.id ? 700 : 500,
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* DOSSIER SUB-TAB PANELS */}

                  {/* PANEL 1: OVERVIEW & SALARY SETTINGS */}
                  {selectedStaffDossierTab === 'profile' && (
                    <div className="card-premium animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: isOwner ? '1fr 1fr' : '1fr', gap: '20px' }}>
                        
                        {/* BANKING DETAILS PANEL */}
                        <div style={{ borderRight: isOwner ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingRight: isOwner ? '20px' : '0' }}>
                          <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 14px 0' }}>Banking Details</h3>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                              <span>Bank Name:</span>
                              <strong style={{ color: 'white' }}>{displayStaff.bankName || 'FNB'}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                              <span>Account Holder:</span>
                              <strong style={{ color: 'white' }}>{displayStaff.accountHolder || displayStaff.name}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                              <span>Account Number:</span>
                              <strong style={{ color: 'white' }}>{displayStaff.accountNumber || '—'}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between', color: '#BFA6D8' }}>
                              <span>Branch Code:</span>
                              <strong style={{ color: 'white' }}>{displayStaff.branchCode || '—'}</strong>
                            </div>
                          </div>
                        </div>

                        {/* CONFIGURATION PANEL (Owner Only) */}
                        {isOwner && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 4px 0' }}>HR Configuration</h3>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Base Salary (R):</label>
                                <input
                                  type="number"
                                  className="brand-input"
                                  defaultValue={displayStaff.salary}
                                  onBlur={(e) => {
                                    updateStaffProfile('System', displayStaff.id, { salary: Number(e.target.value) });
                                    syncDatabase();
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Commission Rate (%):</label>
                                <input
                                  type="number"
                                  className="brand-input"
                                  defaultValue={displayStaff.commissionRate}
                                  onBlur={(e) => {
                                    updateStaffProfile('System', displayStaff.id, { commissionRate: Number(e.target.value) });
                                    syncDatabase();
                                  }}
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Services Target (R):</label>
                                <input
                                  type="number"
                                  className="brand-input"
                                  defaultValue={displayStaff.servicesTarget}
                                  onBlur={(e) => {
                                    updateStaffProfile('System', displayStaff.id, { servicesTarget: Number(e.target.value) });
                                    syncDatabase();
                                  }}
                                />
                              </div>
                              <div>
                                <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Sales Target (R):</label>
                                <input
                                  type="number"
                                  className="brand-input"
                                  defaultValue={displayStaff.salesTarget}
                                  onBlur={(e) => {
                                    updateStaffProfile('System', displayStaff.id, { salesTarget: Number(e.target.value) });
                                    syncDatabase();
                                  }}
                                />
                              </div>
                            </div>
                            
                            <p style={{ color: '#A89684', fontSize: '0.72rem', margin: '4px 0 0 0', fontStyle: 'italic' }}>*Changes save automatically when you click out of the fields.</p>
                          </div>
                        )}
                      </div>

                      {/* SALARY INCREASES & BONUSES SECTION (Owner Only) */}
                      {isOwner && (
                        <div style={{ borderTop: '1px solid rgba(107,44,145,0.15)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: 0 }}>Award Salary Adjustment</h3>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Adjustment Type:</label>
                              <select
                                className="brand-input"
                                value={salaryAdjForm.type}
                                onChange={(e) => setSalaryAdjForm(prev => ({ ...prev, type: e.target.value }))}
                              >
                                <option value="bonus">One-off Bonus (Paid on next pay date)</option>
                                <option value="increase">Permanent Salary Increase (Adds to base)</option>
                              </select>
                            </div>
                            <div style={{ width: '150px' }}>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Amount (R):</label>
                              <input
                                type="number"
                                className="brand-input"
                                placeholder="e.g. 500"
                                value={salaryAdjForm.amount}
                                onChange={(e) => setSalaryAdjForm(prev => ({ ...prev, amount: e.target.value }))}
                              />
                            </div>
                            <button
                              onClick={() => {
                                if (!salaryAdjForm.amount) return alert('Please enter an amount.');
                                const res = addSalaryAdjustment(currentUserName(), displayStaff.id, salaryAdjForm);
                                if (res) {
                                  setSalaryAdjForm({ type: 'bonus', amount: '' });
                                  syncDatabase();
                                }
                              }}
                              className="btn-brand-gold"
                              style={{ height: '36px' }}
                            >
                              Award Adjustment
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PANEL 2: LEAVE REQUESTS */}
                  {selectedStaffDossierTab === 'leave' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* LEAVE BALANCES GRID */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className="card-premium" style={{ textAlign: 'center', padding: '16px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#BFA6D8', display: 'block', marginBottom: '4px' }}>Annual Leave</span>
                          <strong style={{ fontSize: '1.5rem', color: displayStaff.leaveBalance < 0 ? '#ef4444' : '#D4AF37', fontFamily: 'Outfit' }}>{displayStaff.leaveBalance || 0} days</strong>
                          <span style={{ fontSize: '0.7rem', color: '#A89684', display: 'block', marginTop: '4px' }}>Accrual: +{displayStaff.monthlyLeaveAccrual || 1.25}/mo</span>
                        </div>
                        <div className="card-premium" style={{ textAlign: 'center', padding: '16px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#BFA6D8', display: 'block', marginBottom: '4px' }}>Sick Leave</span>
                          <strong style={{ fontSize: '1.5rem', color: '#60a5fa', fontFamily: 'Outfit' }}>{displayStaff.sickLeaveBalance || 0} days</strong>
                          <span style={{ fontSize: '0.7rem', color: '#A89684', display: 'block', marginTop: '4px' }}>Renews: {displayStaff.sickLeaveRenewCycle || '1 year'}</span>
                        </div>
                        <div className="card-premium" style={{ textAlign: 'center', padding: '16px' }}>
                          <span style={{ fontSize: '0.78rem', color: '#BFA6D8', display: 'block', marginBottom: '4px' }}>Family Responsibility</span>
                          <strong style={{ fontSize: '1.5rem', color: '#c084fc', fontFamily: 'Outfit' }}>{displayStaff.familyLeaveBalance || 0} days</strong>
                          <span style={{ fontSize: '0.7rem', color: '#A89684', display: 'block', marginTop: '4px' }}>Standard statutory allocation</span>
                        </div>
                      </div>

                      {/* SUBMIT LEAVE REQUEST FORM (Staff View Only) */}
                      {!isOwner && (
                        <div className="card-premium">
                          <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 16px 0' }}>Request Leave / Log Out of Office</h3>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Leave Category:</label>
                              <select
                                className="brand-input"
                                value={leaveRequestForm.type}
                                onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, type: e.target.value, days: prev.days, notes: prev.notes }))}
                              >
                                <option value="Annual">Annual Leave</option>
                                <option value="Sick">Sick Leave (Requires Doctor's Note)</option>
                                <option value="Family">Family Responsibility</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Start Date:</label>
                              <input
                                type="date"
                                className="brand-input"
                                value={leaveRequestForm.startDate}
                                onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, startDate: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>End Date:</label>
                              <input
                                type="date"
                                className="brand-input"
                                value={leaveRequestForm.endDate}
                                onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, endDate: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Total Days:</label>
                              <input
                                type="number"
                                className="brand-input"
                                value={leaveRequestForm.days}
                                onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, days: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Notes / Justification:</label>
                              <input
                                type="text"
                                className="brand-input"
                                placeholder="e.g. Family holiday trip / dentist visit"
                                value={leaveRequestForm.notes}
                                onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, notes: e.target.value }))}
                              />
                            </div>
                          </div>

                          {leaveRequestForm.type === 'Sick' && (
                            <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: 'rgba(96,165,250,0.05)', borderRadius: '6px', border: '1px solid rgba(96,165,250,0.1)' }}>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#60a5fa', marginBottom: '6px', fontWeight: 600 }}>Doctor's Note Upload:</label>
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  className="brand-input"
                                  placeholder="Simulate doctor note name e.g. sick_note_2026.pdf"
                                  value={leaveRequestForm.doctorNoteName}
                                  onChange={(e) => setLeaveRequestForm(prev => ({ ...prev, doctorNoteName: e.target.value }))}
                                />
                                <button
                                  onClick={() => setLeaveRequestForm(prev => ({ ...prev, doctorNoteName: `medical_certificate_${Date.now().toString().substr(8)}.pdf` }))}
                                  className="badge-brand blue"
                                  style={{ border: 'none', cursor: 'pointer', padding: '8px 12px', height: '36px', borderRadius: '6px' }}
                                >
                                  Attach Note
                                </button>
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (!leaveRequestForm.days || Number(leaveRequestForm.days) <= 0) {
                                return alert('Please enter valid number of leave days.');
                              }
                              if (leaveRequestForm.type === 'Sick' && !leaveRequestForm.doctorNoteName) {
                                return alert('Warning: Uploading a doctor note is mandatory for sick leave request!');
                              }
                              
                              const res = submitLeaveRequest(currentUserName(), displayStaff.id, leaveRequestForm);
                              if (res.success) {
                                if (res.warning) alert(res.warning);
                                setLeaveRequestForm({
                                  type: 'Annual', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], days: 1, notes: '', doctorNoteName: ''
                                });
                                syncDatabase();
                              }
                            }}
                            className="btn-brand-gold"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Submit Leave Request
                          </button>
                        </div>
                      )}

                      {/* LEAVE LOGS & REQUESTS QUEUE */}
                      <div className="card-premium">
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 16px 0' }}>Leave History & Requests</h3>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>Category</th>
                                <th>Dates</th>
                                <th>Total Days</th>
                                <th>Notes / Documents</th>
                                <th>Status</th>
                                {isOwner && <th style={{ textAlign: 'right' }}>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {(displayStaff.leaveRequests || []).length === 0 ? (
                                <tr>
                                  <td colSpan={isOwner ? 6 : 5} style={{ textTransform: 'none', color: '#BFA6D8', textAlign: 'center', padding: '20px 0' }}>
                                    No logged leave requests found for this employee.
                                  </td>
                                </tr>
                              ) : (
                                (displayStaff.leaveRequests || []).map(req => (
                                  <tr key={req.id}>
                                    <td>
                                      <span className={`badge-brand ${req.type === 'Sick' ? 'blue' : req.type === 'Family' ? 'purple' : 'gold'}`}>
                                        {req.type}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem' }}>{req.startDate} to {req.endDate}</td>
                                    <td style={{ fontWeight: 700 }}>{req.days} days</td>
                                    <td style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>
                                      {req.notes}
                                      {req.doctorNoteName && (
                                        <div style={{ color: '#60a5fa', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                          📄 {req.doctorNoteName} (attached)
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <span className={`badge-brand ${req.status === 'approved' ? 'green' : req.status === 'rejected' ? 'red' : 'purple'}`}>
                                        {req.status.toUpperCase()}
                                      </span>
                                    </td>
                                    {isOwner && (
                                      <td style={{ textAlign: 'right' }}>
                                        {req.status === 'pending' ? (
                                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button
                                              onClick={() => {
                                                let balance = displayStaff.leaveBalance;
                                                if (req.type === 'Sick') balance = displayStaff.sickLeaveBalance;
                                                else if (req.type === 'Family') balance = displayStaff.familyLeaveBalance;

                                                let confirmMsg = `Are you sure you want to approve this leave request?`;
                                                if (balance - req.days < 0) {
                                                  confirmMsg = `[WARNING] Approving this request will drive ${displayStaff.name}'s ${req.type} leave balance negative (${(balance - req.days).toFixed(1)} days).\nDo you still wish to proceed and approve?`;
                                                }
                                                if (confirm(confirmMsg)) {
                                                  approveLeaveRequest(currentUserName(), displayStaff.id, req.id, 'approved');
                                                  syncDatabase();
                                                }
                                              }}
                                              className="badge-brand green"
                                              style={{ border: 'none', cursor: 'pointer', fontSize: '0.65rem', padding: '3px 8px' }}
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm(`Reject this leave request?`)) {
                                                  approveLeaveRequest(currentUserName(), displayStaff.id, req.id, 'rejected');
                                                  syncDatabase();
                                                }
                                              }}
                                              className="badge-brand red"
                                              style={{ border: 'none', cursor: 'pointer', fontSize: '0.65rem', padding: '3px 8px' }}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.72rem', color: '#A89684' }}>Processed</span>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PANEL 3: CLAIMS & TRAVEL */}
                  {selectedStaffDossierTab === 'claims' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* SUBMIT CLAIM FORM (Staff View Only) */}
                      {!isOwner && (
                        <div className="card-premium">
                          <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 16px 0' }}>Log Out-of-Pocket Expense or Business Travel Claims</h3>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '14px', marginBottom: '14px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Claim Category:</label>
                              <select
                                className="brand-input"
                                value={claimForm.type}
                                onChange={(e) => setClaimForm(prev => ({ ...prev, type: e.target.value, amount: e.target.value === 'travel' ? '' : prev.amount }))}
                              >
                                <option value="out_of_pocket">Out-of-Pocket Cash Purchase</option>
                                <option value="travel">Business Travel Mileage (Calculated per KM)</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Description / Reason:</label>
                              <input
                                type="text"
                                className="brand-input"
                                placeholder={claimForm.type === 'travel' ? 'e.g. Travel to Pretoria North branch for stock collection' : 'e.g. Replenished hand sanitizers and facial wipes from pharmacy'}
                                value={claimForm.description}
                                onChange={(e) => setClaimForm(prev => ({ ...prev, description: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-end', marginBottom: '16px' }}>
                            {claimForm.type === 'out_of_pocket' ? (
                              <div style={{ width: '160px' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Amount Claimed (R):</label>
                                <input
                                  type="number"
                                  className="brand-input"
                                  placeholder="e.g. 350"
                                  value={claimForm.amount}
                                  onChange={(e) => setClaimForm(prev => ({ ...prev, amount: e.target.value }))}
                                />
                              </div>
                            ) : (
                              <>
                                <div style={{ width: '120px' }}>
                                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Distance (KM):</label>
                                  <input
                                    type="number"
                                    className="brand-input"
                                    placeholder="e.g. 45"
                                    value={claimForm.km}
                                    onChange={(e) => {
                                      const kmVal = Number(e.target.value);
                                      setClaimForm(prev => ({
                                        ...prev,
                                        km: e.target.value,
                                        amount: Number((kmVal * aaMileageRate).toFixed(2))
                                      }));
                                    }}
                                  />
                                </div>
                                <div style={{ flex: 1, padding: '10px', backgroundColor: 'rgba(212,175,55,0.05)', borderRadius: '6px', border: '1px solid rgba(212,175,55,0.1)', fontSize: '0.8rem', color: '#D4AF37' }}>
                                  <span>Refund Rate: <strong>R {aaMileageRate} / KM</strong> (Official AA Rate)</span>
                                  <span style={{ display: 'block', marginTop: '2px' }}>Total Payout: <strong>R {claimForm.amount || 0}</strong></span>
                                </div>
                              </>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              if (!claimForm.description) return alert('Please input description/reason for claim.');
                              if (!claimForm.amount || Number(claimForm.amount) <= 0) return alert('Please enter valid claims parameters.');

                              const created = submitStaffClaim(currentUserName(), displayStaff.id, claimForm);
                              if (created) {
                                setClaimForm({ type: 'out_of_pocket', description: '', amount: '', km: '' });
                                syncDatabase();
                              }
                            }}
                            className="btn-brand-gold"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Submit Claim
                          </button>
                        </div>
                      )}

                      {/* AA MILEAGE RATE SETTING (Owner View Only) */}
                      {isOwner && (
                        <div className="card-premium" style={{ display: 'flex', justify: 'space-between', alignItems: 'center', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                          <div>
                            <strong style={{ color: 'white', display: 'block' }}>Official AA Travel Reimbursement Rate</strong>
                            <span style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>Set the business mileage refund rate per kilometer for travel claims.</span>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>R </span>
                            <input
                              type="number"
                              className="brand-input"
                              style={{ width: '80px', textAlign: 'center' }}
                              value={aaMileageRate}
                              onChange={(e) => setAaMileageRate(Number(e.target.value))}
                            />
                            <span style={{ fontSize: '0.8rem', color: '#A89684' }}>/ KM</span>
                          </div>
                        </div>
                      )}

                      {/* CLAIMS HISTORY GRID */}
                      <div className="card-premium">
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 16px 0' }}>Reimbursement Claims Ledger</h3>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>Category</th>
                                <th>Description / Details</th>
                                <th>Metrics</th>
                                <th>Payout Amount</th>
                                <th>Date Logged</th>
                                <th>Status</th>
                                {isOwner && <th style={{ textAlign: 'right' }}>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {(displayStaff.claims || []).length === 0 ? (
                                <tr>
                                  <td colSpan={isOwner ? 7 : 6} style={{ textTransform: 'none', color: '#BFA6D8', textAlign: 'center', padding: '20px 0' }}>
                                    No claims logged for this employee.
                                  </td>
                                </tr>
                              ) : (
                                (displayStaff.claims || []).map(c => (
                                  <tr key={c.id}>
                                    <td>
                                      <span className={`badge-brand ${c.type === 'travel' ? 'green' : 'purple'}`}>
                                        {c.type === 'travel' ? '🚗 Travel Mileage' : '🛍️ Out of Pocket'}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{c.description}</td>
                                    <td style={{ fontSize: '0.75rem', color: '#BFA6D8' }}>
                                      {c.type === 'travel' ? `${c.km} KM travelled` : 'Cash Receipt'}
                                    </td>
                                    <td style={{ fontWeight: 700, color: '#34d399' }}>R {c.amount.toFixed(2)}</td>
                                    <td style={{ fontSize: '0.75rem', color: '#A89684' }}>{c.date}</td>
                                    <td>
                                      <span className={`badge-brand ${c.status === 'approved' ? 'green' : c.status === 'rejected' ? 'red' : 'purple'}`}>
                                        {c.status.toUpperCase()}
                                      </span>
                                    </td>
                                    {isOwner && (
                                      <td style={{ textAlign: 'right' }}>
                                        {c.status === 'pending' ? (
                                          <div style={{ display: 'flex', gap: '6px', justify: 'flex-end' }}>
                                            <button
                                              onClick={() => {
                                                if (confirm(`Approve this R${c.amount} claim? (It will be added to the next pay slip)`)) {
                                                  approveStaffClaim(currentUserName(), displayStaff.id, c.id, 'approved');
                                                  syncDatabase();
                                                }
                                              }}
                                              className="badge-brand green"
                                              style={{ border: 'none', cursor: 'pointer', fontSize: '0.65rem', padding: '3px 8px' }}
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm(`Reject this claim?`)) {
                                                  approveStaffClaim(currentUserName(), displayStaff.id, c.id, 'rejected');
                                                  syncDatabase();
                                                }
                                              }}
                                              className="badge-brand red"
                                              style={{ border: 'none', cursor: 'pointer', fontSize: '0.65rem', padding: '3px 8px' }}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.72rem', color: '#A89684' }}>Processed</span>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PANEL 4: APP LOANS */}
                  {selectedStaffDossierTab === 'loans' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* LOAN REQUEST FORM (Staff View Only) */}
                      {!isOwner && (
                        <div className="card-premium">
                          <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 16px 0' }}>Request Emergency Staff Cash Loan</h3>
                          <p style={{ fontSize: '0.78rem', color: '#BFA6D8', marginTop: '-8px', marginBottom: '16px' }}>Approved loans will automatically reflect as a monthly amortized deduction on your payslips.</p>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Loan Amount (R):</label>
                              <input
                                type="number"
                                className="brand-input"
                                placeholder="e.g. 1200"
                                value={loanForm.amount}
                                onChange={(e) => setLoanForm(prev => ({ ...prev, amount: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '4px' }}>Repayment Repay Term:</label>
                              <select
                                className="brand-input"
                                value={loanForm.months}
                                onChange={(e) => setLoanForm(prev => ({ ...prev, months: Number(e.target.value) }))}
                              >
                                <option value={1}>1 Month Repayment</option>
                                <option value={2}>2 Months Repayments</option>
                                <option value={3}>3 Months Repayments</option>
                                <option value={4}>4 Months Repayments</option>
                                <option value={5}>5 Months Repayments</option>
                                <option value={6}>6 Months Repayments</option>
                              </select>
                            </div>
                          </div>

                          {loanForm.amount && (
                            <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: 'rgba(96,165,250,0.05)', borderRadius: '6px', border: '1px solid rgba(96,165,250,0.1)', fontSize: '0.8rem', color: '#60a5fa' }}>
                              <span>Deduction Schedule: <strong>R {(loanForm.amount / loanForm.months).toFixed(2)} / month</strong> for the next {loanForm.months} months.</span>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              if (!loanForm.amount || Number(loanForm.amount) <= 0) return alert('Please enter valid loan amount.');
                              const res = submitLoanRequest(currentUserName(), displayStaff.id, loanForm);
                              if (res) {
                                setLoanForm({ amount: '', months: 1 });
                                syncDatabase();
                              }
                            }}
                            className="btn-brand-gold"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            Submit Loan Request
                          </button>
                        </div>
                      )}

                      {/* LOANS LEDGER */}
                      <div className="card-premium">
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 16px 0' }}>Emergency Loan Repayment Book</h3>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>Loan Capital</th>
                                <th>Payback Term</th>
                                <th>Monthly Repayment</th>
                                <th>Months Remaining</th>
                                <th>Date Requested</th>
                                <th>Status</th>
                                {isOwner && <th style={{ textAlign: 'right' }}>Actions</th>}
                              </tr>
                            </thead>
                            <tbody>
                              {(displayStaff.loans || []).length === 0 ? (
                                <tr>
                                  <td colSpan={isOwner ? 7 : 6} style={{ textTransform: 'none', color: '#BFA6D8', textAlign: 'center', padding: '20px 0' }}>
                                    No active or requested staff loans.
                                  </td>
                                </tr>
                              ) : (
                                (displayStaff.loans || []).map(l => (
                                  <tr key={l.id}>
                                    <td style={{ fontWeight: 700, color: '#ef4444' }}>R {l.amount.toFixed(2)}</td>
                                    <td>{l.months} months</td>
                                    <td style={{ color: '#D4AF37' }}>R {l.monthlyRepayment.toFixed(2)} / mo</td>
                                    <td>
                                      {l.status === 'approved' ? (
                                        <strong style={{ color: l.repaymentMonthsLeft > 0 ? '#60a5fa' : '#34d399' }}>
                                          {l.repaymentMonthsLeft > 0 ? `${l.repaymentMonthsLeft} months left` : 'Fully Paid 🎉'}
                                        </strong>
                                      ) : '—'}
                                    </td>
                                    <td style={{ fontSize: '0.75rem', color: '#A89684' }}>{l.date}</td>
                                    <td>
                                      <span className={`badge-brand ${l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : 'purple'}`}>
                                        {l.status.toUpperCase()}
                                      </span>
                                    </td>
                                    {isOwner && (
                                      <td style={{ textAlign: 'right' }}>
                                        {l.status === 'pending' ? (
                                          <div style={{ display: 'flex', gap: '6px', justify: 'flex-end' }}>
                                            <button
                                              onClick={() => {
                                                if (confirm(`Approve this cash loan request for R${l.amount} to be repaid over ${l.months} months?`)) {
                                                  approveLoanRequest(currentUserName(), displayStaff.id, l.id, 'approved');
                                                  syncDatabase();
                                                }
                                              }}
                                              className="badge-brand green"
                                              style={{ border: 'none', cursor: 'pointer', fontSize: '0.65rem', padding: '3px 8px' }}
                                            >
                                              Approve
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (confirm(`Reject this loan request?`)) {
                                                  approveLoanRequest(currentUserName(), displayStaff.id, l.id, 'rejected');
                                                  syncDatabase();
                                                }
                                              }}
                                              className="badge-brand red"
                                              style={{ border: 'none', cursor: 'pointer', fontSize: '0.65rem', padding: '3px 8px' }}
                                            >
                                              Reject
                                            </button>
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: '0.72rem', color: '#A89684' }}>Processed</span>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PANEL 5: DOCUMENTS & EMPLOYMENT CONTRACTS */}
                  {selectedStaffDossierTab === 'documents' && (
                    <div className="card-premium animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: '#D4AF37', margin: 0 }}>Corporate Employee Vault</h3>
                        <span style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>Contracts, Warning Letters, Performance Reviews</span>
                      </div>

                      {/* UPLOAD SIMULATOR (Owner Only) */}
                      {isOwner && (
                        <div style={{ padding: '14px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'white' }}>Upload Simulated Corporate Document</h4>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Document Name / File:</label>
                              <input
                                type="text"
                                className="brand-input"
                                placeholder="e.g. Jessica_Laser_Employment_Contract_2026_V2.pdf"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                              />
                            </div>
                            <div style={{ width: '150px' }}>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Category Type:</label>
                              <select
                                className="brand-input"
                                value={documentType}
                                onChange={(e) => setDocumentType(e.target.value)}
                              >
                                <option value="contract">Employment Contract</option>
                                <option value="warning">Written Warning Letter</option>
                                <option value="other">Business Memo / Certificate</option>
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                if (!documentName) return alert('Please enter a document name.');
                                const res = uploadStaffDocument(currentUserName(), displayStaff.id, documentName, documentType);
                                if (res) {
                                  setDocumentName('');
                                  syncDatabase();
                                }
                              }}
                              className="btn-brand-gold"
                              style={{ height: '36px' }}
                            >
                              Attach Document
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ATTACHED DOCUMENTS LIST */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(displayStaff.contracts || []).length === 0 ? (
                          <div style={{ color: '#BFA6D8', fontSize: '0.85rem', padding: '16px 0', textAlign: 'center' }}>No uploaded contracts or business documents found.</div>
                        ) : (
                          (displayStaff.contracts || []).map(doc => (
                            <div
                              key={doc.id}
                              style={{
                                display: 'flex',
                                justify: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                borderRadius: '6px',
                                backgroundColor: doc.type === 'warning' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(255,255,255,0.02)',
                                border: doc.type === 'warning' ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(255,255,255,0.05)',
                                fontSize: '0.85rem'
                              }}
                            >
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.4rem' }}>{doc.type === 'warning' ? '⚠️' : '📄'}</span>
                                <div>
                                  <strong style={{ color: 'white', display: 'block' }}>{doc.name}</strong>
                                  <span style={{ fontSize: '0.72rem', color: '#BFA6D8', textTransform: 'capitalize' }}>Category: {doc.type} • Uploaded: {doc.uploadDate}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => alert(`Simulating file download: Initializing download stream for employee document "${doc.name}"...`)}
                                className="badge-brand purple"
                                style={{ border: 'none', cursor: 'pointer', fontSize: '0.68rem', padding: '4px 10px' }}
                              >
                                Download
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* PANEL 6: PAYSLIPS VAULT */}
                  {selectedStaffDossierTab === 'payslips' && (
                    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      
                      {/* DRAFT PAYSLIP PROCESSOR (Owner Only) */}
                      {isOwner && (
                        <div className="card-premium" style={{ border: '1px solid rgba(167, 243, 208, 0.25)', backgroundColor: 'rgba(167, 243, 208, 0.02)' }}>
                          <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(167, 243, 208, 0.1)', paddingBottom: '10px' }}>
                            <h3 style={{ fontFamily: 'Outfit', color: '#34d399', fontSize: '1.1rem', margin: 0 }}>Processed Live Draft Payslip</h3>
                            <span className="badge-brand green" style={{ fontSize: '0.6rem' }}>ACTIVE BILLING CYCLE</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#BFA6D8' }}>
                            <div style={{ display: 'flex', justify: 'space-between' }}>
                              <span>1. Basic Monthly Salary:</span>
                              <strong style={{ color: 'white' }}>R {displayStaff.salary.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between' }}>
                              <span>2. Completed Service Commissions:</span>
                              <strong style={{ color: '#34d399' }}>+ R {comm.total.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between' }}>
                              <span>3. Approved Cash & Mileage Claims:</span>
                              <strong style={{ color: '#34d399' }}>+ R {claimsAmt.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between' }}>
                              <span>4. Salary Adjustments / Bonuses:</span>
                              <strong style={{ color: '#34d399' }}>+ R {bonusesAmt.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '8px' }}>
                              <span>5. Active Cash Loan Deductions:</span>
                              <strong style={{ color: '#ef4444' }}>- R {loansAmt.toFixed(2)}</strong>
                            </div>
                            <div style={{ display: 'flex', justify: 'space-between', fontSize: '1.15rem', color: '#34d399', fontWeight: 'bold', paddingTop: '8px' }}>
                              <span>NET SALARY PAYOUT:</span>
                              <span>R {netSalary.toFixed(2)}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginTop: '20px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ display: 'block', fontSize: '0.72rem', color: '#A89684', marginBottom: '4px' }}>Automatic Email Delivery Day:</label>
                              <select className="brand-input" defaultValue="25">
                                <option value="20">20th of the month</option>
                                <option value="25">25th of the month</option>
                                <option value="28">28th of the month</option>
                                <option value="30">30th of the month</option>
                              </select>
                            </div>
                            <button
                              onClick={() => {
                                const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
                                if (confirm(`[PROPOSAL] Finalize, process and email Payslip for ${displayStaff.name} for the billing month of ${currentMonthName}?\nThis will automatically charge the business salaries ledger, archive the payslip, reset temporary claims, and trigger email dispatches.`)) {
                                  const res = finalizeStaffPayslip(currentUserName(), displayStaff.id, currentMonthName);
                                  if (res.success) {
                                    alert(`Successfully finalized payslip! Dynamic Salaries expense entry has been posted to operating expenses.`);
                                    syncDatabase();
                                  }
                                }
                              }}
                              className="btn-brand-gold"
                              style={{ height: '36px', width: '100%', justifyContent: 'center' }}
                            >
                              Finalize Live Payslip & Email Staff
                            </button>
                          </div>
                        </div>
                      )}

                      {/* ARCHIVED PAYSLIPS LEDGER */}
                      <div className="card-premium">
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', color: '#D4AF37', margin: '0 0 16px 0' }}>Payslip Archives</h3>
                        
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table-premium">
                            <thead>
                              <tr>
                                <th>Billing Month</th>
                                <th>Basic Salary</th>
                                <th>Commission</th>
                                <th>Claims & Bonuses</th>
                                <th>Deductions</th>
                                <th>Net Salary Payout</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(displayStaff.payslips || []).length === 0 ? (
                                <tr>
                                  <td colSpan={7} style={{ textTransform: 'none', color: '#BFA6D8', textAlign: 'center', padding: '20px 0' }}>
                                    No finalized or archived payslips for this employee yet.
                                  </td>
                                </tr>
                              ) : (
                                (displayStaff.payslips || []).map(p => (
                                  <tr key={p.id}>
                                    <td style={{ fontWeight: 'bold' }}>{p.month}</td>
                                    <td>R {p.baseSalary.toFixed(2)}</td>
                                    <td style={{ color: '#34d399' }}>R {p.commissionEarned.toFixed(2)}</td>
                                    <td style={{ color: '#34d399' }}>R {(p.claimsApproved + p.bonusApproved).toFixed(2)}</td>
                                    <td style={{ color: '#ef4444' }}>- R {p.loanDeduction.toFixed(2)}</td>
                                    <td style={{ fontWeight: 700, color: '#34d399' }}>R {p.finalSalary.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      <button
                                        onClick={() => {
                                          setActiveViewPayslip(p);
                                          setActiveViewPayslipStaff(displayStaff);
                                          setShowPayslipModal(true);
                                        }}
                                        className="badge-brand purple"
                                        style={{ border: 'none', cursor: 'pointer', fontSize: '0.68rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                      >
                                        <Printer style={{ width: '10px', height: '10px' }} /> View & Print
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>

              </div>
            </div>
          );
        })()}

        {/* WORKSPACE P: GLOBAL SALON SETTINGS */}
        {activeTab === 'settings' && currentUserRole === 'owner' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', color: 'white', marginBottom: '16px' }}>Global Salon Settings</h3>
              <p style={{ fontSize: '0.8rem', color: '#BFA6D8', marginBottom: '20px' }}>Setup business details, VAT rates, and WhatsApp reminder lead times.</p>

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
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>WhatsApp Reminder Lead Time:</label>
                    <select className="brand-input" id="cfgReminderLeadTime" defaultValue={settings.reminderLeadTime || '2 Hours before session'}>
                      <option value="1 Hour before session">1 Hour before session</option>
                      <option value="2 Hours before session">2 Hours before session</option>
                      <option value="12 Hours before session">12 Hours before session</option>
                      <option value="24 Hours before session">24 Hours before session</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>Telephone:</label>
                    <input type="text" className="brand-input" id="cfgPhone" defaultValue={settings.phone} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', marginBottom: '6px' }}>No-Show WhatsApp Template Text:</label>
                  <textarea
                    className="brand-input"
                    id="cfgNoShowTemplate"
                    rows={3}
                    defaultValue={settings.noShowTemplate || "We missed you at your appointment! Please contact Sculpt & Glow Pretoria East to reschedule."}
                  />
                </div>

                <button
                  onClick={() => {
                    const sName = document.getElementById('cfgSalonName').value;
                    const vat = document.getElementById('cfgVat').value;
                    const phone = document.getElementById('cfgPhone').value;
                    const leadTime = document.getElementById('cfgReminderLeadTime').value;
                    const noShowTpl = document.getElementById('cfgNoShowTemplate').value;

                    const newSettings = {
                      ...settings,
                      salonName: sName,
                      vatRate: Number(vat),
                      phone,
                      reminderLeadTime: leadTime,
                      noShowTemplate: noShowTpl
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

            {/* DYNAMIC ROOMS & MACHINES CRUD PANEL */}
            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', color: 'white', marginBottom: '16px' }}>Dynamic Rooms & Equipment Management</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
                
                {/* Rooms CRUD */}
                <div>
                  <h4 style={{ color: '#D4AF37', fontSize: '0.9rem', marginBottom: '10px' }}>Clinic Treatment Rooms</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {rooms.map(rm => (
                      <div key={rm} style={{ display: 'flex', justify: 'space-between', padding: '8px 12px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', fontSize: '0.78rem' }}>
                        <span>{rm}</span>
                        <button onClick={() => {
                          const updated = rooms.filter(r => r !== rm);
                          setRooms(updated);
                          localStorage.setItem('salon_rooms', JSON.stringify(updated));
                        }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="brand-input" id="newRoomInput" placeholder="Add room..." style={{ height: '32px', fontSize: '0.78rem' }} />
                    <button onClick={() => {
                      const inp = document.getElementById('newRoomInput');
                      if (inp.value) {
                        const updated = [...rooms, inp.value];
                        setRooms(updated);
                        localStorage.setItem('salon_rooms', JSON.stringify(updated));
                        inp.value = '';
                      }
                    }} className="btn-brand-gold" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Add</button>
                  </div>
                </div>

                {/* Machines CRUD & Maintenance Hours config */}
                <div>
                  <h4 style={{ color: '#D4AF37', fontSize: '0.9rem', marginBottom: '10px' }}>Clinical Hardware & Service Parameters</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                    {machines.map(mach => (
                      <div key={mach.id} style={{ padding: '10px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justify: 'space-between' }}>
                          <strong>{mach.name}</strong>
                          <button onClick={() => {
                            const newHours = prompt(`Enter service interval hours for ${mach.name}:`, mach.serviceInterval || 50);
                            if (newHours) {
                              const updated = machines.map(m => m.id === mach.id ? { ...m, serviceInterval: Number(newHours) } : m);
                              localStorage.setItem('salon_machines', JSON.stringify(updated));
                              syncDatabase();
                            }
                          }} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer', fontSize: '0.7rem' }}>
                            Edit Service Limit ({mach.serviceInterval || 50}h)
                          </button>
                        </div>
                        <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.7rem', color: '#A89684', marginTop: '4px' }}>
                          <span>Hours running: {mach.totalUsageHours}h | Times used: {appointments.filter(a => a.machineId === mach.id && a.status !== 'Cancelled').length}</span>
                          <button onClick={() => {
                            logMachineMaintenance(currentUserName(), mach.id, 'Reset usage hours after servicing');
                            syncDatabase();
                            alert('Machine flagged as Serviced! Usage hours reset.');
                          }} style={{ border: 'none', backgroundColor: '#34d39933', color: '#34d399', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>
                            Flag Serviced ✓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
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

        {/* WORKSPACE R: ARCHIVED DELETIONS SYSTEM */}
        {activeTab === 'archive' && currentUserRole === 'owner' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, fontFamily: 'Outfit', color: '#D4AF37' }}>Archived Deletions Vault</h1>
            <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.85rem' }}>View, restore, or permanently purge all deleted system entities securely.</p>

            <div className="card-premium">
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', color: '#A89684' }} />
                <input
                  type="text"
                  placeholder="Search deleted archives..."
                  className="brand-input"
                  style={{ paddingLeft: '34px' }}
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                />
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Item Name</th>
                      <th>Key Metadata Details</th>
                      <th>Date Deleted</th>
                      <th>Deleted By</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {archiveList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textTransform: 'none', color: '#BFA6D8', textAlign: 'center', padding: '40px 0' }}>
                          <ShieldAlert style={{ width: '32px', height: '32px', color: '#D4AF37', margin: '0 auto 12px auto', opacity: 0.7 }} />
                          <div style={{ fontWeight: 600 }}>The deletion vault is currently empty.</div>
                          <div style={{ fontSize: '0.78rem', color: '#A89684', marginTop: '4px' }}>All future deleted shifts, services, stock ledger items, products, waitlists and expenses will appear here.</div>
                        </td>
                      </tr>
                    ) : (
                      archiveList
                        .filter(item => {
                          const query = archiveSearch.toLowerCase();
                          return (
                            item.itemType.toLowerCase().includes(query) ||
                            item.name.toLowerCase().includes(query) ||
                            (item.deletedBy && item.deletedBy.toLowerCase().includes(query))
                          );
                        })
                        .map(item => {
                          let metadataStr = '—';
                          if (item.originalData) {
                            if (item.itemType === 'Service') {
                              metadataStr = `Price: R${item.originalData.price} | Duration: ${item.originalData.duration}m | Category: ${item.originalData.category}`;
                            } else if (item.itemType === 'Product') {
                              metadataStr = `Price: R${item.originalData.price} | Stock: ${item.originalData.stock} units | Category: ${item.originalData.category}`;
                            } else if (item.itemType === 'Inventory') {
                              metadataStr = `Qty: ${item.originalData.quantity} ${item.originalData.unit} | Cost: R${item.originalData.cost} | Supplier: ${item.originalData.supplier}`;
                            } else if (item.itemType === 'Expense') {
                              metadataStr = `Amount: R${item.originalData.amount} | Frequency: ${item.originalData.frequency} | Date: ${item.originalData.date}`;
                            } else if (item.itemType === 'Shift') {
                              metadataStr = `Type: ${item.originalData.type} | Date: ${item.originalData.date} | Times: ${item.originalData.startTime}-${item.originalData.endTime}`;
                            } else if (item.itemType === 'Waitlist') {
                              metadataStr = `Day Pref: ${item.originalData.dayPref} | Time Pref: ${item.originalData.timePref} | Notes: ${item.originalData.notes || 'None'}`;
                            }
                          }

                          let badgeClass = 'badge-brand';
                          if (item.itemType === 'Service') badgeClass += ' gold';
                          else if (item.itemType === 'Product') badgeClass += ' purple';
                          else if (item.itemType === 'Inventory') badgeClass += ' green';
                          else if (item.itemType === 'Expense') badgeClass += ' red';
                          else if (item.itemType === 'Shift') badgeClass += ' blue';
                          else if (item.itemType === 'Waitlist') badgeClass += ' purple';

                          return (
                            <tr key={item.id} style={{ transition: 'all 0.2s' }}>
                              <td>
                                <span className={badgeClass} style={{ fontSize: '0.65rem', fontWeight: 700 }}>
                                  {item.itemType}
                                </span>
                              </td>
                              <td><strong style={{ color: 'white' }}>{item.name}</strong></td>
                              <td style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>{metadataStr}</td>
                              <td style={{ fontSize: '0.78rem', color: '#A89684' }}>{item.deletedAt}</td>
                              <td><strong style={{ color: '#D4AF37', fontSize: '0.8rem' }}>{item.deletedBy || 'System'}</strong></td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to restore the archived ${item.itemType} "${item.name}" back to live database tables?`)) {
                                        const res = restoreItem(currentUserName(), item.id);
                                        if (res.success) {
                                          syncDatabase();
                                        } else {
                                          alert(`Failed to restore item: ${res.error}`);
                                        }
                                      }
                                    }}
                                    className="badge-brand green"
                                    style={{ border: 'none', cursor: 'pointer', fontSize: '0.68rem', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <RefreshCw style={{ width: '10px', height: '10px' }} /> Restore
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`[WARNING] Are you sure you want to PERMANENTLY PURGE "${item.name}"?\nThis cannot be undone and will be permanently deleted from the database archive.`)) {
                                        if (confirm(`Double Confirmation: Please confirm once more to permanently erase "${item.name}".`)) {
                                          const ok = purgeItem(currentUserName(), item.id);
                                          if (ok) {
                                            syncDatabase();
                                          } else {
                                            alert('Failed to purge item from archive.');
                                          }
                                        }
                                      }
                                    }}
                                    className="badge-brand red"
                                    style={{ border: 'none', cursor: 'pointer', fontSize: '0.68rem', padding: '4px 10px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Trash2 style={{ width: '10px', height: '10px' }} /> Purge
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================= */}
      {/*   5. MODAL DIALOGS / POPUPS                             */}
      {/* ======================================================= */}

      {/* NEW MODAL: REGISTER STAFF MEMBER */}
      {showNewStaffModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Register New Staff Member</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Full Name:</label>
                <input
                  type="text"
                  className="brand-input"
                  placeholder="e.g. Jessica Thompson"
                  value={newStaffForm.name}
                  onChange={(e) => setNewStaffForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Username:</label>
                  <input
                    type="text"
                    className="brand-input"
                    placeholder="e.g. jessica"
                    value={newStaffForm.username}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Pin (4-digit):</label>
                  <input
                    type="text"
                    className="brand-input"
                    placeholder="e.g. 1234"
                    maxLength={4}
                    value={newStaffForm.pin}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, pin: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Role / Post:</label>
                  <select
                    className="brand-input"
                    value={newStaffForm.role}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <option value="therapist">Clinical Therapist</option>
                    <option value="receptionist">Reception Clerk</option>
                    <option value="owner">Co-Owner / Admin</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Base Salary (R):</label>
                  <input
                    type="number"
                    className="brand-input"
                    placeholder="e.g. 12500"
                    value={newStaffForm.salary}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, salary: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Email Address:</label>
                <input
                  type="email"
                  className="brand-input"
                  placeholder="e.g. jessica@sculptglow.co.za"
                  value={newStaffForm.email}
                  onChange={(e) => setNewStaffForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginTop: '4px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#D4AF37', fontSize: '0.82rem' }}>Banking Details</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#A89684', marginBottom: '4px' }}>Bank Name:</label>
                    <input
                      type="text"
                      className="brand-input"
                      placeholder="e.g. FNB Pretoria"
                      value={newStaffForm.bankName}
                      onChange={(e) => setNewStaffForm(prev => ({ ...prev, bankName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#A89684', marginBottom: '4px' }}>Account Number:</label>
                    <input
                      type="text"
                      className="brand-input"
                      placeholder="e.g. 1029384756"
                      value={newStaffForm.accountNumber}
                      onChange={(e) => setNewStaffForm(prev => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#A89684', marginBottom: '4px' }}>Branch Code:</label>
                  <input
                    type="text"
                    className="brand-input"
                    placeholder="e.g. 250655"
                    value={newStaffForm.branchCode}
                    onChange={(e) => setNewStaffForm(prev => ({ ...prev, branchCode: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    if (!newStaffForm.name || !newStaffForm.username || !newStaffForm.email) {
                      return alert('Please fill in all mandatory staff profile fields.');
                    }
                    const usersList = getTable('users');
                    if (usersList.some(u => u.username === newStaffForm.username)) {
                      return alert('Error: A staff member with this username already exists.');
                    }
                    const newUser = {
                      id: `usr-${Date.now()}`,
                      name: newStaffForm.name,
                      username: newStaffForm.username,
                      role: newStaffForm.role,
                      email: newStaffForm.email,
                      pin: newStaffForm.pin || '1234',
                      salary: Number(newStaffForm.salary || 10000),
                      bankName: newStaffForm.bankName || 'FNB Pretoria',
                      accountHolder: newStaffForm.name,
                      accountNumber: newStaffForm.accountNumber || `102938${Date.now().toString().substr(8)}`,
                      branchCode: newStaffForm.branchCode || '250655',
                      contracts: [],
                      commissionRate: newStaffForm.role === 'therapist' ? 10 : newStaffForm.role === 'receptionist' ? 5 : 0,
                      salesTarget: newStaffForm.role === 'receptionist' ? 10000 : 15000,
                      servicesTarget: newStaffForm.role === 'therapist' ? 15000 : 10000,
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
                    usersList.push(newUser);
                    saveTable('users', usersList);
                    syncDatabase();
                    setShowNewStaffModal(false);
                    alert(`Successfully registered new staff member: ${newUser.name}!`);
                  }}
                  className="btn-brand-gold"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Register Staff
                </button>
                <button
                  onClick={() => setShowNewStaffModal(false)}
                  className="btn-brand-purple"
                  style={{ width: '100px', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', background: 'none' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW MODAL: COMMISSIONS SALES DRILL DOWN */}
      {activeCommissionsDrilldownStaff && (() => {
        const staff = activeCommissionsDrilldownStaff;
        const comm = getStaffCommissions(staff.id);
        const invoicesList = getTable('invoices').filter(i => i.status === 'Paid');
        const appointmentsList = getTable('appointments');
        const svcCommRate = staff.commissionRate || 10;
        const prdCommRate = 5;

        let salesList = [];
        invoicesList.forEach(inv => {
          const apt = appointmentsList.find(a => a.id === inv.appointmentId);
          const client = getTable('clients').find(c => c.id === inv.clientId) || { name: 'Walk-in Client' };
          
          inv.items.forEach(item => {
            if (item.name.includes('[Service]') && apt && apt.staffId === staff.id) {
              const commEarned = Number((item.price * item.quantity * (svcCommRate / 100)).toFixed(2));
              salesList.push({
                date: inv.date,
                clientName: client.name,
                itemName: item.name.split(' [')[0],
                itemType: 'Service',
                price: item.price,
                qty: item.quantity,
                rate: svcCommRate,
                commEarned
              });
            } else if (item.name.includes('[Product]')) {
              if (apt && apt.staffId === staff.id) {
                const commEarned = Number((item.price * item.quantity * (prdCommRate / 100)).toFixed(2));
                salesList.push({
                  date: inv.date,
                  clientName: client.name,
                  itemName: item.name.split(' [')[0],
                  itemType: 'Product Retail',
                  price: item.price,
                  qty: item.quantity,
                  rate: prdCommRate,
                  commEarned
                });
              }
            }
          });
        });

        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
            <div className="card-premium animate-fade-in" style={{ width: '700px', maxHeight: '85vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(107, 44, 145, 0.2)', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: 0 }}>Sales & Commissions Drill Down</h3>
                  <span style={{ fontSize: '0.8rem', color: '#BFA6D8' }}>Detailed ledger for <strong>{staff.name}</strong> • Service: {svcCommRate}%, Retail: {prdCommRate}%</span>
                </div>
                <button
                  onClick={() => setActiveCommissionsDrilldownStaff(null)}
                  className="btn-brand-purple"
                  style={{ padding: '4px 10px', fontSize: '0.75rem', height: '26px' }}
                >
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#BFA6D8', display: 'block' }}>Total Sales Volume</span>
                  <strong style={{ fontSize: '1.2rem', color: 'white', fontFamily: 'Outfit' }}>
                    R {salesList.reduce((acc, s) => acc + (s.price * s.qty), 0).toLocaleString()}
                  </strong>
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.72rem', color: '#BFA6D8', display: 'block' }}>Total Sales Count</span>
                  <strong style={{ fontSize: '1.2rem', color: 'white', fontFamily: 'Outfit' }}>
                    {salesList.length} items
                  </strong>
                </div>
                <div style={{ backgroundColor: 'rgba(167, 243, 208, 0.05)', padding: '10px', borderRadius: '6px', textAlign: 'center', border: '1px solid rgba(167, 243, 208, 0.15)' }}>
                  <span style={{ fontSize: '0.72rem', color: '#a7f3d0', display: 'block' }}>Total Commissions Payout</span>
                  <strong style={{ fontSize: '1.2rem', color: '#34d399', fontFamily: 'Outfit' }}>
                    R {comm.total.toFixed(2)}
                  </strong>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="table-premium">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Client</th>
                      <th>Item Name / Category</th>
                      <th>Price</th>
                      <th>Split Rate</th>
                      <th style={{ textAlign: 'right' }}>Commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesList.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textTransform: 'none', color: '#BFA6D8', textAlign: 'center', padding: '30px 0' }}>
                          No sales contributed by this therapist in the paid invoices directory yet.
                        </td>
                      </tr>
                    ) : (
                      salesList.map((s, idx) => (
                        <tr key={idx}>
                          <td style={{ fontSize: '0.78rem', color: '#A89684' }}>{s.date}</td>
                          <td><strong>{s.clientName}</strong></td>
                          <td style={{ fontSize: '0.78rem' }}>
                            {s.itemName}
                            <span className={`badge-brand ${s.itemType.includes('Service') ? 'gold' : 'purple'}`} style={{ fontSize: '0.55rem', marginLeft: '6px', padding: '1px 4px' }}>
                              {s.itemType}
                            </span>
                          </td>
                          <td>R {s.price.toFixed(2)}</td>
                          <td style={{ color: '#D4AF37' }}>{s.rate}%</td>
                          <td style={{ fontWeight: 700, color: '#34d399', textAlign: 'right' }}>R {s.commEarned.toFixed(2)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* NEW MODAL: RESCHEDULE APPOINTMENT */}
      {showRescheduleModal && activeRescheduleApt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Reschedule Client Appointment</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#A89684' }}>Client Name:</span>
                <strong style={{ display: 'block', color: 'white', fontSize: '0.9rem', marginTop: '2px' }}>
                  {clients.find(c => c.id === activeRescheduleApt.clientId)?.name || 'Walk-in'}
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>New Date:</label>
                  <input
                    type="date"
                    className="brand-input"
                    value={rescheduleForm.date}
                    onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>New Time:</label>
                  <input
                    type="time"
                    className="brand-input"
                    value={rescheduleForm.time}
                    onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Reason for Rescheduling:</label>
                <textarea
                  className="brand-input"
                  rows={2}
                  placeholder="e.g. Work commitment conflict..."
                  value={rescheduleForm.reason}
                  onChange={(e) => setRescheduleForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    if (!rescheduleForm.reason) return alert('Reschedule reason is required');

                    // Conflict Validator Checks
                    const conflictCheck = checkScheduleConflict({
                      id: activeRescheduleApt.id,
                      date: rescheduleForm.date,
                      time: rescheduleForm.time,
                      duration: activeRescheduleApt.duration,
                      staffId: activeRescheduleApt.staffId,
                      machineId: activeRescheduleApt.machineId,
                      room: activeRescheduleApt.room
                    });

                    if (conflictCheck.conflict) {
                      alert(`Reschedule Conflict:\n\n${conflictCheck.reason}`);
                      return;
                    }

                    // Perform database update
                    const allApts = getTable('appointments');
                    const idx = allApts.findIndex(a => a.id === activeRescheduleApt.id);
                    if (idx !== -1) {
                      const prevDate = allApts[idx].date;
                      const prevTime = allApts[idx].time;
                      
                      allApts[idx].date = rescheduleForm.date;
                      allApts[idx].time = rescheduleForm.time;
                      allApts[idx].rescheduleReason = rescheduleForm.reason;

                      localStorage.setItem('salon_appointments', JSON.stringify(allApts));
                      logAction(currentUserName(), 'Reschedule Booking', 
                        `Rescheduled client slot from ${prevDate} ${prevTime} to ${rescheduleForm.date} ${rescheduleForm.time}. Reason: "${rescheduleForm.reason}"`
                      );

                      syncDatabase();
                      setShowRescheduleModal(false);
                      alert('Success! Client appointment rescheduled.');
                    }
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Confirm Reschedule
                </button>
                <button onClick={() => setShowRescheduleModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW MODAL: CAPTURE APPOINTMENT PAYMENT AT RECEPTION */}
      {showCapturePaymentModal && activeCapturePaymentApt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '420px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Settle Booking Payment</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#A89684' }}>Treatment Details:</span>
                <strong style={{ display: 'block', color: 'white', fontSize: '0.9rem', marginTop: '2px' }}>
                  {services.find(s => s.id === activeCapturePaymentApt.serviceId)?.name}
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>
                  Standard Price: R {services.find(s => s.id === activeCapturePaymentApt.serviceId)?.price}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Select Method:</label>
                <select
                  className="brand-input"
                  value={aptPaymentForm.method}
                  onChange={(e) => {
                    const nextMethod = e.target.value;
                    setAptPaymentForm(prev => ({
                      ...prev,
                      method: nextMethod,
                      amountProvided: nextMethod === 'Cash' ? prev.amountPaid : 0
                    }));
                  }}
                >
                  <option value="Card">Visa/Mastercard</option>
                  <option value="Cash">Cash Drawer</option>
                  <option value="EFT">EFT Bank Transfer</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '4px' }}>Total Amount Due (R):</label>
                <input
                  type="number"
                  className="brand-input"
                  value={aptPaymentForm.amountPaid === 0 ? '' : aptPaymentForm.amountPaid}
                  onChange={(e) => {
                    const price = Number(e.target.value);
                    setAptPaymentForm(prev => ({
                      ...prev,
                      amountPaid: price,
                      amountProvided: prev.method === 'Cash' ? price : 0
                    }));
                  }}
                />
              </div>

              {aptPaymentForm.method === 'Cash' && (
                <div style={{ backgroundColor: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.2)', padding: '12px', borderRadius: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#D4AF37', marginBottom: '4px' }}>Cash Received (R):</label>
                    <input
                      type="number"
                      className="brand-input"
                      style={{ borderColor: 'hsl(var(--brand-gold))' }}
                      value={aptPaymentForm.amountProvided === 0 ? '' : aptPaymentForm.amountProvided}
                      onChange={(e) => setAptPaymentForm(prev => ({ ...prev, amountProvided: Number(e.target.value) }))}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.9rem', color: 'white' }}>
                    <span>Change Due:</span>
                    <strong style={{ color: '#D4AF37' }}>
                      R {Math.max(0, aptPaymentForm.amountProvided - aptPaymentForm.amountPaid).toFixed(2)}
                    </strong>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    const price = aptPaymentForm.amountPaid;
                    const method = aptPaymentForm.method;
                    const service = services.find(s => s.id === activeCapturePaymentApt.serviceId);

                    // 1. Update Booking status in appointments table
                    const allApts = getTable('appointments');
                    const aIdx = allApts.findIndex(a => a.id === activeCapturePaymentApt.id);
                    if (aIdx !== -1) {
                      allApts[aIdx].paymentStatus = 'Paid already';
                      localStorage.setItem('salon_appointments', JSON.stringify(allApts));
                    }

                    // 2. Create Invoice in Finances Ledger
                    const subtotal = Number((price / 1.15).toFixed(2));
                    const tax = Number((price - subtotal).toFixed(2));
                    
                    const newInv = addInvoice(currentUserName(), {
                      clientId: activeCapturePaymentApt.clientId,
                      appointmentId: activeCapturePaymentApt.id,
                      items: [{ name: `${service?.name || 'Treatment'} [Service]`, quantity: 1, price }],
                      subtotal,
                      tax,
                      discount: 0,
                      total: price,
                      status: 'Paid'
                    });

                    // 3. Log transaction references
                    addPaymentToInvoice(currentUserName(), newInv.id, {
                      amount: price,
                      method: method
                    });

                    syncDatabase();
                    setShowCapturePaymentModal(false);

                    const printOk = window.confirm(`Payment captured successfully! Settle slip created: ${newInv.invoiceNumber}\n\nWould you like to print the receipt?`);
                    if (printOk) {
                      setActivePrintInvoice(newInv);
                      setShowPrintModal(true);
                    }
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Capture Payment Slip
                </button>
                <button onClick={() => setShowCapturePaymentModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBookingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: 0 }}>Manual Booking</h3>
              <button 
                onClick={() => { setShowBookingModal(false); setManualClientSearch(''); }} 
                style={{
                  background: 'none', border: 'none', color: '#BFA6D8', fontSize: '1.5rem', cursor: 'pointer', padding: '0 4px', lineHeight: 1
                }}
                title="Exit Modal"
              >
                &times;
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Search client by name input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Search Client Name:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="brand-input"
                    placeholder="Search by name..."
                    value={manualClientSearch}
                    onChange={(e) => setManualClientSearch(e.target.value)}
                  />
                </div>

                {/* Seeding matching search options */}
                {manualClientSearch.length > 0 && (
                  <div style={{
                    maxHeight: '120px', overflowY: 'auto', backgroundColor: 'hsl(var(--brand-black))',
                    borderRadius: '8px', border: '1px solid rgba(107, 44, 145, 0.3)', marginTop: '4px', padding: '6px'
                  }}>
                    {clients
                      .filter(c => c.name.toLowerCase().includes(manualClientSearch.toLowerCase()))
                      .map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setBookingForm(prev => ({ ...prev, clientId: c.id }));
                            setManualClientSearch(c.name);
                          }}
                          style={{
                            display: 'block', width: '100%', background: 'none', border: 'none',
                            color: 'white', padding: '6px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem'
                          }}
                        >
                          {c.name} ({c.phone})
                        </button>
                      ))}
                    {clients.filter(c => c.name.toLowerCase().includes(manualClientSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '6px' }}>No client found.</span>
                        <button
                          onClick={() => {
                            setClientForm(prev => ({ ...prev, name: manualClientSearch }));
                            setShowClientModal(true);
                          }}
                          className="btn-brand-gold"
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          + Add New Client Shortcut
                        </button>
                      </div>
                    )}
                  </div>
                )}
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
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Room:</label>
                  <select className="brand-input" value={bookingForm.room} onChange={(e) => setBookingForm(prev => ({ ...prev, room: e.target.value }))}>
                    {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Payment Status:</label>
                  <select className="brand-input" value={bookingForm.paymentStatus} onChange={(e) => setBookingForm(prev => ({ ...prev, paymentStatus: e.target.value }))}>
                    <option value="Unpaid">✗ Unpaid</option>
                    <option value="Paid already">✓ Paid already</option>
                    <option value="Loyalty Promo">⚡ Loyalty Reward Promo</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Date:</label>
                <input type="date" className="brand-input" value={bookingForm.date} onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))} />
              </div>

              {/* Visual Time Slot Availability (Green vs. Red) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Time Slot (08h00 - 17h00):</label>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px',
                  maxHeight: '120px', overflowY: 'auto', padding: '6px',
                  backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px',
                  border: '1px solid rgba(107, 44, 145, 0.3)'
                }}>
                  {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(slotTime => {
                    const activeSrvId = bookingForm.serviceId || (services[0] ? services[0].id : '');
                    const activeSrv = services.find(s => s.id === activeSrvId);
                    
                    const conflictCheck = checkScheduleConflict({
                      ...bookingForm,
                      serviceId: activeSrvId,
                      duration: activeSrv ? activeSrv.duration : 30,
                      machineId: activeSrv ? activeSrv.requiredMachine || '' : '',
                      time: slotTime
                    });
                    const isConflict = conflictCheck.conflict;

                    // Past Check
                    const todayStr = new Date().toISOString().split('T')[0];
                    const [slotH, slotM] = slotTime.split(':').map(Number);
                    const nowObj = new Date();
                    const isPast = (bookingForm.date < todayStr) || 
                                   (bookingForm.date === todayStr && (slotH < nowObj.getHours() || (slotH === nowObj.getHours() && slotM < nowObj.getMinutes())));

                    const isSelected = bookingForm.time === slotTime;

                    let bg = 'rgba(52, 211, 153, 0.15)'; // Green
                    let border = '1px solid rgba(52, 211, 153, 0.4)';
                    let color = '#34d399';

                    if (isPast) {
                      bg = 'rgba(239, 68, 68, 0.1)'; // Past is Red / Orangeish Red
                      border = '1px solid rgba(239, 68, 68, 0.4)';
                      color = '#f87171';
                    } else if (isConflict) {
                      bg = 'rgba(239, 68, 68, 0.2)'; // Conflict is red
                      border = '1px solid #ef4444';
                      color = '#ef4444';
                    }

                    if (isSelected) {
                      border = '2px solid hsl(var(--brand-gold))';
                    }

                    return (
                      <button
                        key={slotTime}
                        type="button"
                        onClick={() => setBookingForm(prev => ({ ...prev, time: slotTime }))}
                        style={{
                          backgroundColor: bg,
                          border: border,
                          borderRadius: '6px',
                          color: color,
                          padding: '6px 2px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s'
                        }}
                        title={isConflict ? `Conflict: ${conflictCheck.reason}` : isPast ? 'Past Slot (Requires Backdate Reason)' : 'Slot Available'}
                      >
                        {slotTime}
                        {isPast ? ' (Past)' : isConflict ? ' (Conf)' : ''}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Past-Time Booking Reason Capture */}
              {(() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const [slotH, slotM] = (bookingForm.time || '09:00').split(':').map(Number);
                const nowObj = new Date();
                const isPast = (bookingForm.date < todayStr) || 
                               (bookingForm.date === todayStr && (slotH < nowObj.getHours() || (slotH === nowObj.getHours() && slotM < nowObj.getMinutes())));
                return isPast ? (
                  <div style={{ marginTop: '4px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#ef4444', marginBottom: '4px', fontWeight: 600 }}>
                      ⚠️ Past Booking Reason (Required):
                    </label>
                    <textarea
                      className="brand-input"
                      style={{ borderColor: '#ef4444' }}
                      placeholder="Enter the backdating reason for this manual past appointment..."
                      value={bookingForm.pastReason || ''}
                      onChange={(e) => setBookingForm(prev => ({ ...prev, pastReason: e.target.value }))}
                      rows={2}
                    />
                  </div>
                ) : null;
              })()}

              {/* Loyalty Reward Partial Payments Calculator */}
              {(() => {
                const selectedClient = clients.find(c => c.id === bookingForm.clientId);
                const activeSrvId = bookingForm.serviceId || (services[0] ? services[0].id : '');
                const activeSrv = services.find(s => s.id === activeSrvId);
                const isLoyaltyPromo = bookingForm.paymentStatus === 'Loyalty Promo';

                if (isLoyaltyPromo && selectedClient && activeSrv) {
                  const pointsAvailable = selectedClient.loyaltyPoints || 0;
                  const pointsNeeded = Math.ceil(activeSrv.price / 10);
                  
                  return (
                    <div style={{
                      backgroundColor: 'rgba(107, 44, 145, 0.15)',
                      border: '1px solid rgba(107, 44, 145, 0.3)',
                      padding: '12px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      marginTop: '4px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#BFA6D8', marginBottom: '4px' }}>
                        <span>Client Glow Points Available:</span>
                        <strong>{pointsAvailable} pts</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#BFA6D8', marginBottom: '4px' }}>
                        <span>Point Value Discount (R10/pt):</span>
                        <strong>R {pointsAvailable * 10}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', marginBottom: '4px' }}>
                        <span>Service Standard Price:</span>
                        <strong>R {activeSrv.price}</strong>
                      </div>
                      <hr style={{ borderColor: 'rgba(107, 44, 145, 0.3)', margin: '8px 0' }} />
                      {pointsAvailable >= pointsNeeded ? (
                        <div style={{ color: '#34d399', fontWeight: 600 }}>
                          🎉 Fully Covered! Deducting {pointsNeeded} Glow Points. Remaining price: R0.00
                        </div>
                      ) : (
                        <div style={{ color: '#F5EFE6' }}>
                          <span style={{ color: '#D4AF37', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                            ⚠️ Points insufficient to cover full price.
                          </span>
                          Deducting all {pointsAvailable} points (R {pointsAvailable * 10} discount).
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontWeight: 'bold' }}>
                            <span>Outstanding Balance:</span>
                            <span style={{ color: '#ef4444' }}>R {activeSrv.price - (pointsAvailable * 10)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else if (isLoyaltyPromo && !selectedClient) {
                  return (
                    <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '4px', fontStyle: 'italic' }}>
                      ⚠️ Please select a registered client above to compute loyalty points benefits.
                    </div>
                  );
                }
                return null;
              })()}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    const activeSrvId = bookingForm.serviceId || (services[0] ? services[0].id : '');
                    const activeSrv = services.find(s => s.id === activeSrvId);

                    if (!bookingForm.clientId) {
                      alert("Error: Please select a client before scheduling.");
                      return;
                    }

                    // Past Check
                    const todayStr = new Date().toISOString().split('T')[0];
                    const [slotH, slotM] = (bookingForm.time || '09:00').split(':').map(Number);
                    const nowObj = new Date();
                    const isPast = (bookingForm.date < todayStr) || 
                                   (bookingForm.date === todayStr && (slotH < nowObj.getHours() || (slotH === nowObj.getHours() && slotM < nowObj.getMinutes())));

                    if (isPast && (!bookingForm.pastReason || !bookingForm.pastReason.trim())) {
                      alert("Error: A 'Past Booking Reason' is strictly required for backdated appointments!");
                      return;
                    }

                    // Prepare final values
                    let finalPaymentStatus = bookingForm.paymentStatus;
                    let finalCustomPrice = undefined;
                    let finalNotes = bookingForm.notes || '';

                    if (isPast) {
                      finalNotes += `\n[Backdated Appointment Reason: ${bookingForm.pastReason}]`;
                    }

                    const selectedClient = clients.find(c => c.id === bookingForm.clientId);
                    if (bookingForm.paymentStatus === 'Loyalty Promo' && selectedClient && activeSrv) {
                      const pointsAvailable = selectedClient.loyaltyPoints || 0;
                      const pointsNeeded = Math.ceil(activeSrv.price / 10);

                      if (pointsAvailable >= pointsNeeded) {
                        // Deduct full points needed
                        const updatedClients = clients.map(c => {
                          if (c.id === selectedClient.id) {
                            return { ...c, loyaltyPoints: c.loyaltyPoints - pointsNeeded };
                          }
                          return c;
                        });
                        localStorage.setItem('salon_clients', JSON.stringify(updatedClients));
                        
                        finalPaymentStatus = 'Paid already';
                        finalCustomPrice = 0;
                        finalNotes += `\n[Loyalty Reward Promo: fully covered by redeeming ${pointsNeeded} Glow Points]`;

                        logAction(currentUserName(), 'Redeem Glow Points', `Redeemed ${pointsNeeded} points for "${activeSrv.name}" for Client "${selectedClient.name}"`);
                      } else {
                        // Deduct all available points, calculate discount
                        const discount = pointsAvailable * 10;
                        const remaining = activeSrv.price - discount;

                        const updatedClients = clients.map(c => {
                          if (c.id === selectedClient.id) {
                            return { ...c, loyaltyPoints: 0 };
                          }
                          return c;
                        });
                        localStorage.setItem('salon_clients', JSON.stringify(updatedClients));

                        finalPaymentStatus = 'Unpaid';
                        finalCustomPrice = remaining;
                        finalNotes += `\n[Loyalty Reward Promo: partial payment. Redeemed ${pointsAvailable} Glow Points (R ${discount} off). R ${remaining} outstanding]`;

                        logAction(currentUserName(), 'Redeem Glow Points', `Redeemed all ${pointsAvailable} points for "${activeSrv.name}" (R${discount} discount) for Client "${selectedClient.name}"`);
                      }
                    }

                    const finalBooking = {
                      ...bookingForm,
                      serviceId: activeSrvId,
                      duration: activeSrv ? activeSrv.duration : 30,
                      machineId: activeSrv ? activeSrv.requiredMachine || '' : '',
                      paymentStatus: finalPaymentStatus,
                      customPrice: finalCustomPrice,
                      notes: finalNotes
                    };

                    const res = addAppointment(currentUserName(), finalBooking);
                    if (!res.success) {
                      alert(`Allocation Overlap:\n\n${res.error}`);
                    } else {
                      setShowBookingModal(false);
                      setManualClientSearch('');
                      setBookingForm({
                        clientId: '', serviceId: '', staffId: 'usr-3', room: '',
                        machineId: '', date: new Date().toISOString().split('T')[0], time: '09:00', duration: 30, notes: '',
                        paymentStatus: 'Unpaid'
                      });
                      syncDatabase();
                    }
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Settle Schedule
                </button>
                <button onClick={() => { setShowBookingModal(false); setManualClientSearch(''); }} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
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
                    
                    const duplicates = clients.some(c => c.email === clientForm.email || c.phone === clientForm.phone);
                    if (duplicates) {
                      alert('Registration Blocked: A client profile with this phone or email already exists!');
                      return;
                    }

                    const created = addClient(currentUserName(), clientForm);
                    setShowClientModal(false);
                    syncDatabase();

                    if (showBookingModal) {
                      setBookingForm(prev => ({ ...prev, clientId: created.id }));
                      setManualClientSearch(created.name);
                    } else if (showQuoteModal) {
                      setQuoteClient(created.id);
                      setManualQuoteClientSearch(created.name);
                    }
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
              <div style={{ textAlign: 'center', borderBottom: '2px dashed #94a3b8', paddingBottom: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                {/* SVG gold woman silhouette with crescent moon */}
                <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Crescent Moon */}
                  <path d="M40 10C23.43 10 10 23.43 10 40C10 56.57 23.43 70 40 70C43.5 70 46.85 69.4 50 68.3C40.6 65.5 33.8 56.8 33.8 46.5C33.8 36.2 40.6 27.5 50 24.7C46.85 23.6 43.5 23 40 23" fill="#D4AF37"/>
                  {/* Woman Silhouette Profile / Elegant flow */}
                  <path d="M45 25C47.8 25 50 27.2 50 30C50 32.8 47.8 35 45 35C42.2 35 40 32.8 40 30C40 27.2 42.2 25 45 25Z" fill="#B8860B"/>
                  <path d="M45 36C52 36 60 41 62 48C63.5 53.2 60 58 56 61C51.5 64.4 46 68 38 68C36.5 68 35 66.8 35 65.3C35 62 38 58 41 55C44 52 45 46 45 42C44.5 40 44 38 45 36Z" fill="#D4AF37"/>
                </svg>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, margin: 0, color: '#0f172a', fontSize: '1.2rem', letterSpacing: '1px' }}>SCULPT & GLOW</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Pretoria East Galleria, South Africa</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => {
                    logAction('System', 'Print Receipt', `Printed thermal receipt for Invoice ${activePrintInvoice.invoiceNumber}`);
                    alert(`Thermal Receipt Printed for Invoice: ${activePrintInvoice.invoiceNumber}`);
                    window.print();
                  }} 
                  className="btn-brand-gold" 
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.78rem' }}
                >
                  🖨️ Print
                </button>
                <button 
                  onClick={() => {
                    const cli = clients.find(c => c.id === activePrintInvoice.clientId);
                    logAction('System', 'Email Receipt', `Emailed receipt for Invoice ${activePrintInvoice.invoiceNumber} to ${cli ? cli.email : 'client'}`);
                    alert(`Email receipt successfully sent to client: ${cli ? cli.email : 'walk-in@sculptglow.co.za'}`);
                  }} 
                  className="btn-brand-purple" 
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.78rem', color: '#0f172a', borderColor: '#cbd5e1' }}
                >
                  📧 Email
                </button>
                <button 
                  onClick={() => {
                    const cli = clients.find(c => c.id === activePrintInvoice.clientId);
                    logAction('System', 'WhatsApp Receipt', `Sent WhatsApp receipt for Invoice ${activePrintInvoice.invoiceNumber} to ${cli ? cli.phone : 'client'}`);
                    alert(`WhatsApp receipt successfully sent to client phone: ${cli ? cli.phone : 'N/A'}`);
                  }} 
                  className="btn-brand-purple" 
                  style={{ justifyContent: 'center', padding: '10px', fontSize: '0.78rem', color: '#0f172a', borderColor: '#cbd5e1' }}
                >
                  💬 WhatsApp
                </button>
              </div>
              <button 
                onClick={() => setShowPrintModal(false)} 
                className="btn-brand-purple" 
                style={{ width: '100%', justifyContent: 'center', color: '#0f172a', border: '1px solid #cbd5e1', padding: '10px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PRODUCT */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>{editingProduct ? 'Edit Atelier Shop Product' : 'Sync E-Commerce Product'}</h3>
 
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Product Name:</label>
                <input 
                  type="text" 
                  className="brand-input" 
                  value={productForm.name} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>
 
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Price (R):</label>
                  <input type="number" className="brand-input" value={productForm.price === 0 ? '' : productForm.price} onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Stock:</label>
                  <input type="number" className="brand-input" value={productForm.stock === 0 ? '' : productForm.stock} onChange={(e) => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))} />
                </div>
              </div>
 
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Category:</label>
                <select 
                  className="brand-input" 
                  value={showCustomCategoryInput ? 'custom' : productForm.category}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setShowCustomCategoryInput(true);
                      setProductForm(prev => ({ ...prev, category: '' }));
                    } else {
                      setShowCustomCategoryInput(false);
                      setProductForm(prev => ({ ...prev, category: e.target.value }));
                    }
                  }}
                >
                  <option value="Facial Products">Facial Products</option>
                  <option value="Weight Loss Products">Weight Loss Products</option>
                  <option value="custom">+ Create Custom Category...</option>
                </select>
              </div>
 
              {showCustomCategoryInput && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#D4AF37', marginBottom: '6px' }}>Custom Category Name:</label>
                  <input 
                    type="text" 
                    className="brand-input" 
                    placeholder="Enter custom category name..." 
                    value={customCategoryText} 
                    onChange={(e) => {
                      setCustomCategoryText(e.target.value);
                      setProductForm(prev => ({ ...prev, category: e.target.value }));
                    }} 
                  />
                </div>
              )}
 
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Image URL:</label>
                <input 
                  type="text" 
                  className="brand-input" 
                  value={productForm.image} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))} 
                />
              </div>
 
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Description:</label>
                <textarea 
                  className="brand-input" 
                  rows={2} 
                  placeholder="Enter product retail description..."
                  value={productForm.description || ''} 
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
 
              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  disabled={!productForm.name || !productForm.category}
                  onClick={() => {
                    if (editingProduct) {
                      updateProduct(currentUserName(), { id: editingProduct.id, ...productForm });
                    } else {
                      addProduct('Dashboard Admin', { ...productForm, image: productForm.image || 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300' });
                    }
                    setShowProductModal(false);
                    setEditingProduct(null);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center', opacity: (productForm.name && productForm.category) ? 1 : 0.4 }}
                >
                  {editingProduct ? 'Save Changes' : 'Create & Sync'}
                </button>
                <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
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
                <input type="number" className="brand-input" value={paymentForm.amount === 0 ? '' : paymentForm.amount} onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
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
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>{editingExpense ? 'Edit Operating Expense' : 'Log Operating Expense'}</h3>
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
                <input type="number" className="brand-input" value={expenseForm.amount === 0 ? '' : expenseForm.amount} onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Link to Machine (Optional):</label>
                <select className="brand-input" value={expenseForm.machineId} onChange={(e) => setExpenseForm(prev => ({ ...prev, machineId: e.target.value }))}>
                  <option value="">-- No Machine (General Expense) --</option>
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Expense Billing Type:</label>
                <select className="brand-input" value={expenseForm.frequency || 'once_off'} onChange={(e) => setExpenseForm(prev => ({ ...prev, frequency: e.target.value }))}>
                  <option value="once_off">Once-off Fixed Cost</option>
                  <option value="monthly">Monthly Recurrent Fixed Cost</option>
                  <option value="per_use">Per-Session Use Cost (Multiplies by machine usage)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    if (editingExpense) {
                      updateExpense(currentUserName(), { id: editingExpense.id, ...expenseForm, date: editingExpense.date });
                    } else {
                      addExpense(currentUserName(), expenseForm);
                    }
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {editingExpense ? 'Save Changes' : 'Save Expense'}
                </button>
                <button onClick={() => { setShowExpenseModal(false); setEditingExpense(null); }} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: JOIN WAITLIST */}
      {showWaitlistModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Join Waitlist Queue</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Client:</label>
                <select className="brand-input" value={waitlistForm.clientId} onChange={(e) => setWaitlistForm(prev => ({ ...prev, clientId: e.target.value }))}>
                  <option value="">-- Choose Client --</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Treatment:</label>
                <select className="brand-input" value={waitlistForm.serviceId} onChange={(e) => setWaitlistForm(prev => ({ ...prev, serviceId: e.target.value }))}>
                  <option value="">-- Choose Treatment --</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              {/* Wait Day Specificity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Day Preference:</label>
                  <select className="brand-input" value={waitlistForm.dayPref} onChange={(e) => setWaitlistForm(prev => ({ ...prev, dayPref: e.target.value }))}>
                    <option value="Any Day">Any Day</option>
                    <option value="Specific Date">Specific Date</option>
                    <option value="Specific Week">Specific Week</option>
                  </select>
                </div>
                <div>
                  {waitlistForm.dayPref === 'Specific Date' && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Date:</label>
                      <input type="date" className="brand-input" value={waitlistForm.waitDate} onChange={(e) => setWaitlistForm(prev => ({ ...prev, waitDate: e.target.value }))} />
                    </>
                  )}
                  {waitlistForm.dayPref === 'Specific Week' && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Week:</label>
                      <select className="brand-input" value={waitlistForm.weekPref} onChange={(e) => setWaitlistForm(prev => ({ ...prev, weekPref: e.target.value }))}>
                        <option value="Current Week">This Week (Next 7 Days)</option>
                        <option value="Next Week">Next Week (Days 8-14)</option>
                      </select>
                    </>
                  )}
                </div>
              </div>

              {/* Wait Time Specificity */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Time Preference:</label>
                  <select className="brand-input" value={waitlistForm.timePref} onChange={(e) => setWaitlistForm(prev => ({ ...prev, timePref: e.target.value }))}>
                    <option value="Any Time">Any Time</option>
                    <option value="Morning">Morning (08:00 - 12:00)</option>
                    <option value="Afternoon">Afternoon (12:00 - 17:00)</option>
                    <option value="Specific Time">Specific Time</option>
                  </select>
                </div>
                <div>
                  {waitlistForm.timePref === 'Specific Time' && (
                    <>
                      <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Time:</label>
                      <input type="time" className="brand-input" value={waitlistForm.waitTime} onChange={(e) => setWaitlistForm(prev => ({ ...prev, waitTime: e.target.value }))} />
                    </>
                  )}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Private Request Notes:</label>
                <input type="text" className="brand-input" placeholder="e.g. Prefers morning slots" value={waitlistForm.notes} onChange={(e) => setWaitlistForm(prev => ({ ...prev, notes: e.target.value }))} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    const finalClientId = waitlistForm.clientId || (clients[0] ? clients[0].id : '');
                    const finalServiceId = waitlistForm.serviceId || (services[0] ? services[0].id : '');
                    
                    if (!finalClientId) {
                      alert("Please select a valid client.");
                      return;
                    }
                    if (!finalServiceId) {
                      alert("Please select a valid treatment.");
                      return;
                    }

                    addToWaitlist(currentUserName(), {
                      ...waitlistForm,
                      clientId: finalClientId,
                      serviceId: finalServiceId
                    });
                    
                    setShowWaitlistModal(false);
                    // Reset waitlistForm
                    setWaitlistForm({
                      clientId: '',
                      serviceId: '',
                      notes: '',
                      dayPref: 'Any Day',
                      waitDate: new Date().toISOString().split('T')[0],
                      weekPref: 'Current Week',
                      timePref: 'Any Time',
                      waitTime: '09:00'
                    });
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

      {/* MODAL: RELEASE WAITLIST SLOT SELECTOR */}
      {showReleaseModal && activeReleaseWt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '12px' }}>Release & Allocate Time Slot</h3>
            
            {(() => {
              const client = clients.find(c => c.id === activeReleaseWt.clientId);
              const service = services.find(s => s.id === activeReleaseWt.serviceId);
              const candidates = getReleaseCandidateSlots(activeReleaseWt);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: 'rgba(107, 44, 145, 0.1)', padding: '12px', borderRadius: '10px', fontSize: '0.8rem', border: '1px solid rgba(107, 44, 145, 0.2)' }}>
                    <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '4px' }}>Client: {client?.name}</div>
                    <div style={{ color: '#BFA6D8', marginBottom: '4px' }}>Treatment: {service?.name}</div>
                    <div style={{ color: '#A89684' }}>
                      Wait Preference: {activeReleaseWt.dayPref} ({activeReleaseWt.timePref})
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#D4AF37', fontWeight: 600, marginBottom: '8px' }}>
                      🟢 Available Matching Slots:
                    </label>
                    
                    {candidates.length === 0 ? (
                      <div style={{ color: '#ef4444', fontSize: '0.8rem', fontStyle: 'italic', padding: '10px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                        ⚠️ No vacant slots found matching their specific day/time preferences for the target week.
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '180px', overflowY: 'auto', padding: '4px' }}>
                        {candidates.map((cand, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              const res = addAppointment(currentUserName(), {
                                clientId: activeReleaseWt.clientId,
                                serviceId: activeReleaseWt.serviceId,
                                staffId: activeReleaseWt.preferredStaffId || 'usr-3',
                                room: 'Treatment Room 1',
                                machineId: service?.requiredMachine || '',
                                date: cand.date,
                                time: cand.time,
                                duration: service?.duration || 30,
                                notes: 'Allocated from waitlist preference queue'
                              });
                              if (res.success) {
                                deleteFromWaitlist(currentUserName(), activeReleaseWt.id);
                                syncDatabase();
                                setShowReleaseModal(false);
                                alert(`Success! Allocated client to slot: ${cand.date} at ${cand.time}`);
                              } else {
                                alert(`Allocation error: ${res.error}`);
                              }
                            }}
                            className="btn-brand-purple"
                            style={{ padding: '8px 10px', fontSize: '0.72rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', border: '1px solid rgba(52, 211, 153, 0.4)' }}
                          >
                            <span style={{ color: '#34d399', fontWeight: 'bold' }}>{cand.date}</span>
                            <span style={{ color: 'white' }}>⏰ {cand.time} (Vacant)</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Override Form */}
                  <div style={{ borderTop: '1px solid rgba(107, 44, 145, 0.2)', paddingTop: '16px' }}>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', fontWeight: 600, marginBottom: '8px' }}>
                      ⚙️ Manual Override Allocation:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#BFA6D8', display: 'block', marginBottom: '4px' }}>Select Date:</span>
                        <input 
                          type="date" 
                          id="manualReleaseDate" 
                          className="brand-input" 
                          defaultValue={activeReleaseWt.waitDate || new Date().toISOString().split('T')[0]} 
                        />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', color: '#BFA6D8', display: 'block', marginBottom: '4px' }}>Select Time:</span>
                        <input 
                          type="time" 
                          id="manualReleaseTime" 
                          className="brand-input" 
                          defaultValue={activeReleaseWt.waitTime || '12:00'} 
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const dateVal = document.getElementById('manualReleaseDate').value;
                        const timeVal = document.getElementById('manualReleaseTime').value;

                        if (!dateVal || !timeVal) {
                          alert('Please select both date and time.');
                          return;
                        }

                        const res = addAppointment(currentUserName(), {
                          clientId: activeReleaseWt.clientId,
                          serviceId: activeReleaseWt.serviceId,
                          staffId: activeReleaseWt.preferredStaffId || 'usr-3',
                          room: 'Treatment Room 1',
                          machineId: service?.requiredMachine || '',
                          date: dateVal,
                          time: timeVal,
                          duration: service?.duration || 30,
                          notes: 'Allocated from waitlist override'
                        });

                        if (res.success) {
                          deleteFromWaitlist(currentUserName(), activeReleaseWt.id);
                          syncDatabase();
                          setShowReleaseModal(false);
                          alert(`Success! Bypassed preferences and scheduled for: ${dateVal} at ${timeVal}`);
                        } else {
                          alert(`Conflict: ${res.error}`);
                        }
                      }}
                      className="btn-brand-gold"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '12px', fontSize: '0.78rem' }}
                    >
                      Bypass Preferences & Allocate Slot
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowReleaseModal(false)} 
                    className="btn-brand-purple" 
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    Cancel
                  </button>
                </div>
              );
            })()}
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
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Search Client Name:</label>
                <input
                  type="text"
                  className="brand-input"
                  placeholder="Type client name to search..."
                  value={manualQuoteClientSearch}
                  onChange={(e) => {
                    setManualQuoteClientSearch(e.target.value);
                    setQuoteClient('');
                  }}
                />

                {manualQuoteClientSearch.length > 0 && !quoteClient && (
                  <div style={{
                    maxHeight: '120px', overflowY: 'auto', backgroundColor: 'hsl(var(--brand-black))',
                    borderRadius: '8px', border: '1px solid rgba(107, 44, 145, 0.3)', marginTop: '4px', padding: '6px',
                    position: 'absolute', zIndex: 20000, width: '440px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                  }}>
                    {clients
                      .filter(c => c.name.toLowerCase().includes(manualQuoteClientSearch.toLowerCase()))
                      .map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setQuoteClient(c.id);
                            setManualQuoteClientSearch(c.name);
                          }}
                          type="button"
                          style={{
                            display: 'block', width: '100%', background: 'none', border: 'none',
                            color: 'white', padding: '8px 10px', textAlign: 'left', cursor: 'pointer', fontSize: '0.8rem',
                            borderBottom: '1px solid rgba(107, 44, 145, 0.1)', transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(107, 44, 145, 0.2)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {c.name} ({c.phone})
                        </button>
                      ))}
                    {clients.filter(c => c.name.toLowerCase().includes(manualQuoteClientSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#ef4444', display: 'block', marginBottom: '6px' }}>No client found.</span>
                        <button
                          onClick={() => {
                            setClientForm({
                              name: manualQuoteClientSearch,
                              email: '',
                              phone: '',
                              dob: '1995-01-01',
                              gender: 'Female',
                              allergies: '',
                              medical: '',
                              preferredStaff: 'Jessica Laser',
                              notes: ''
                            });
                            setShowClientModal(true);
                          }}
                          type="button"
                          className="btn-brand-gold"
                          style={{ fontSize: '0.7rem', padding: '4px 8px' }}
                        >
                          + Add New Client Shortcut
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {quoteClient && (
                  <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '6px', fontWeight: 600 }}>
                    ✓ Selected: {clients.find(c => c.id === quoteClient)?.name}
                  </div>
                )}
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
                      {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                    <input
                      type="number"
                      className="brand-input"
                      placeholder="Qty"
                      style={{ flex: 0.6 }}
                      value={item.quantity === 0 ? '' : item.quantity}
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
                <input type="number" className="brand-input" value={quoteDiscount === 0 ? '' : quoteDiscount} onChange={(e) => setQuoteDiscount(Number(e.target.value))} />
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

      {/* POPUP MODAL: DYNAMIC WAITLIST MATCH CONFIRMATION */}
      {activeWaitlistMatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 11000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '440px', border: '2px solid #D4AF37' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Volume2 style={{ width: '22px', height: '22px' }} /> Waitlist Match Alert!
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#BFA6D8', lineHeight: '1.4', marginBottom: '16px' }}>
              A slot has just opened on the schedule due to a cancellation! We have found matching clients on the waitlist waiting for this treatment:
            </p>

            <div style={{
              backgroundColor: 'hsl(var(--brand-black))', padding: '16px', borderRadius: '12px',
              border: '1px solid rgba(107, 44, 145, 0.25)', marginBottom: '20px'
            }}>
              <strong style={{ fontSize: '1.05rem', color: 'white', display: 'block', marginBottom: '4px' }}>
                {activeWaitlistMatch.client?.name}
              </strong>
              <div style={{ fontSize: '0.82rem', color: '#BFA6D8' }}>
                📞 Telephone: <strong style={{ color: '#D4AF37' }}>{activeWaitlistMatch.client?.phone}</strong>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#BFA6D8', marginTop: '2px' }}>
                ✉ Email: {activeWaitlistMatch.client?.email}
              </div>
              <div style={{ fontSize: '0.82rem', color: '#BFA6D8', marginTop: '2px' }}>
                💆 Treatment: {activeWaitlistMatch.service?.name}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  const res = addAppointment(currentUserName(), {
                    clientId: activeWaitlistMatch.wt.clientId,
                    serviceId: activeWaitlistMatch.wt.serviceId,
                    staffId: activeWaitlistMatch.wt.preferredStaffId || 'usr-3',
                    room: 'Treatment Room 1',
                    machineId: activeWaitlistMatch.service?.requiredMachine || '',
                    date: activeWaitlistMatch.aptDate,
                    time: activeWaitlistMatch.aptTime,
                    duration: activeWaitlistMatch.service?.duration || 30,
                    notes: 'Automatically allocated via cancellation waitlist releasing'
                  });

                  if (res.success) {
                    deleteFromWaitlist(currentUserName(), activeWaitlistMatch.wt.id);
                    syncDatabase();
                    setActiveWaitlistMatch(null);
                    alert('Success! Canceled slot successfully allocated to waitlisted client.');
                  } else {
                    alert(`Conflict error allocating slot: ${res.error}`);
                  }
                }}
                className="btn-brand-gold"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Confirm Spot & Allocate
              </button>
              <button
                onClick={() => setActiveWaitlistMatch(null)}
                className="btn-brand-purple"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Dismiss Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: CANCELLATION REASON PROMPT */}
      {activeCancellationApt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 11000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#ef4444', marginBottom: '14px' }}>Provide Cancellation Reason</h3>
            <p style={{ fontSize: '0.8rem', color: '#BFA6D8', marginBottom: '12px' }}>
              Please explain why this slot is being canceled. This will be recorded in the database audit log.
            </p>
            
            <textarea
              className="brand-input"
              rows={3}
              placeholder="e.g. Client called to cancel due to weather delays..."
              value={cancelReasonText}
              onChange={(e) => setCancelReasonText(e.target.value)}
              style={{ marginBottom: '16px' }}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => {
                  if (!cancelReasonText) return alert('Please enter a cancellation reason');

                  const aptId = activeCancellationApt.id;
                  const allApts = getTable('appointments');
                  const idx = allApts.findIndex(a => a.id === aptId);
                  
                  if (idx !== -1) {
                    const prev = allApts[idx];
                    allApts[idx].status = 'Cancelled';
                    allApts[idx].cancelReason = cancelReasonText;
                    localStorage.setItem('salon_appointments', JSON.stringify(allApts));
                    
                    logAction(currentUserName(), 'Cancel Booking', 
                      `Cancelled appointment ID ${aptId}. Reason: "${cancelReasonText}"`, 
                      prev.status, 'Cancelled'
                    );

                    const wl = getTable('waitlist');
                    const matches = wl.filter(w => w.serviceId === prev.serviceId);

                    syncDatabase();
                    setActiveCancellationApt(null);

                    if (matches.length > 0) {
                      const matchWt = matches[0];
                      const client = getTable('clients').find(c => c.id === matchWt.clientId);
                      const service = getTable('services').find(s => s.id === matchWt.serviceId);
                      
                      setTimeout(() => {
                        setActiveWaitlistMatch({
                          wt: matchWt,
                          client,
                          service,
                          aptDate: prev.date,
                          aptTime: prev.time
                        });
                      }, 400);
                    } else {
                      alert('Appointment canceled successfully.');
                    }
                  }
                }}
                className="btn-brand-gold"
                style={{ width: '100%', justifyContent: 'center', backgroundColor: '#ef4444' }}
              >
                Cancel Booking
              </button>
              <button
                onClick={() => setActiveCancellationApt(null)}
                className="btn-brand-purple"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL A4 CORPORATE INVOICE MODAL */}
      {showInvoiceModal && activeViewInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', color: '#1a1a1a', width: '100%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '12px', boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Toolbar */}
            <div style={{ backgroundColor: 'hsl(var(--brand-charcoal))', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>Corporate Invoice Viewer</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => alert(`Corporate A4 Invoice ${activeViewInvoice.invoiceNumber} successfully queued for printing!`)}
                  className="btn-brand-gold"
                  style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                >
                  <Printer style={{ width: '12px', height: '12px' }} /> Print Invoice
                </button>
                <button
                  onClick={() => alert(`Invoice ${activeViewInvoice.invoiceNumber} successfully emailed to client!`)}
                  className="btn-brand-purple"
                  style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                >
                  <Mail style={{ width: '12px', height: '12px' }} /> Share Email
                </button>
                <button
                  onClick={() => alert(`Invoice ${activeViewInvoice.invoiceNumber} successfully sent to client WhatsApp!`)}
                  className="btn-brand-gold"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', backgroundColor: '#34d399', color: 'white' }}
                >
                  <MessageSquare style={{ width: '12px', height: '12px' }} /> WhatsApp
                </button>
                <button
                  onClick={() => { setShowInvoiceModal(false); setActiveViewInvoice(null); }}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.25rem', cursor: 'pointer', marginLeft: '12px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Sheet Canvas */}
            <div style={{ padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: 'white', flex: 1 }}>
              {/* Invoice Title & Logo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #6B2C91', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ color: '#6B2C91', margin: 0, fontSize: '2rem', fontFamily: 'Outfit', fontWeight: 800 }}>SCULPT & GLOW</h1>
                  <span style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Clinical Aesthetic Atelier</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ color: '#1a1a1a', margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>TAX INVOICE</h2>
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>Invoice No: <strong>{activeViewInvoice.invoiceNumber}</strong></span>
                  <br /><span style={{ color: '#666', fontSize: '0.85rem' }}>Date: {activeViewInvoice.date}</span>
                </div>
              </div>

              {/* Addresses section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                <div>
                  <strong style={{ color: '#6B2C91', textTransform: 'uppercase', fontSize: '0.78rem', display: 'block', marginBottom: '8px' }}>FROM:</strong>
                  <strong>Sculpt & Glow Clinic Ltd</strong>
                  <br />Suite 4, West End Medical Center
                  <br />Atelier Row, Pretoria East
                  <br />Tel: +27 (0) 12 555 0192
                  <br />VAT Reg No: 4890201192
                </div>
                <div>
                  <strong style={{ color: '#6B2C91', textTransform: 'uppercase', fontSize: '0.78rem', display: 'block', marginBottom: '8px' }}>BILL TO:</strong>
                  <strong>{clients.find(c => c.id === activeViewInvoice.clientId)?.name || 'Walk-in Guest'}</strong>
                  <br />Email: {clients.find(c => c.id === activeViewInvoice.clientId)?.email || 'N/A'}
                  <br />Phone: {clients.find(c => c.id === activeViewInvoice.clientId)?.phone || 'N/A'}
                  <br />Client ID: {activeViewInvoice.clientId || 'GUEST-01'}
                </div>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', color: '#1a1a1a', textAlign: 'left', fontWeight: 700 }}>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Description</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>Unit Price (Excl)</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>VAT (15%)</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>Total (Incl)</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeViewInvoice.items || []).map((item, idx) => {
                    const priceExcl = item.price / 1.15;
                    const vatAmount = item.price - priceExcl;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                        <td style={{ padding: '10px 12px' }}><strong>{item.name}</strong></td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>R {priceExcl.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>R {vatAmount.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#1a1a1a' }}>R {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.85rem' }}>
                <div style={{ width: '280px', lineHeight: '1.8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>Subtotal (Excl VAT):</span>
                    <span>R {(activeViewInvoice.subtotal || (activeViewInvoice.total / 1.15)).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>VAT (15%):</span>
                    <span>R {(activeViewInvoice.tax || (activeViewInvoice.total - (activeViewInvoice.total / 1.15))).toFixed(2)}</span>
                  </div>
                  {activeViewInvoice.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                      <span>Discount ({activeViewInvoice.discount}%):</span>
                      <span>- R {((activeViewInvoice.total / (1 - activeViewInvoice.discount / 100)) * (activeViewInvoice.discount / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #6B2C91', paddingTop: '6px', marginTop: '6px', fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a' }}>
                    <span>Grand Total:</span>
                    <span>R {activeViewInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms and banking details */}
              <div style={{ marginTop: '48px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.4' }}>
                <strong>PAYMENT TERMS & BANKING INFORMATION</strong>
                <br />Payment is due upon receipt of invoice. Please use the invoice number <strong>{activeViewInvoice.invoiceNumber}</strong> as reference.
                <br />Bank: <strong>Elysium Private Bank</strong> | Account: <strong>1020491022</strong> | Branch Code: <strong>250655</strong>
                <br /><em style={{ display: 'block', marginTop: '8px', textAlign: 'center' }}>Thank you for choosing Sculpt & Glow Clinical Atelier. We appreciate your valued business!</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL A4 CORPORATE PAYSLIP MODAL */}
      {showPayslipModal && activeViewPayslip && activeViewPayslipStaff && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '20px' }} className="no-print">
          <div style={{ backgroundColor: 'white', color: '#1a1a1a', width: '100%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '12px', boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Toolbar */}
            <div style={{ backgroundColor: 'hsl(var(--brand-charcoal))', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }} className="no-print">
              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>Corporate Payslip Viewer</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => {
                    logAction(currentUserName(), 'Print Payslip', `Printed/Downloaded PDF payslip for ${activeViewPayslipStaff.name} (${activeViewPayslip.month})`);
                    window.print();
                  }}
                  className="btn-brand-gold"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Printer style={{ width: '12px', height: '12px' }} /> Print & Save PDF
                </button>
                <button
                  onClick={() => {
                    alert(`Payslip for ${activeViewPayslip.month} successfully emailed to ${activeViewPayslipStaff.email}!`);
                    logAction(currentUserName(), 'Email Payslip', `Emailed payslip to ${activeViewPayslipStaff.name} (${activeViewPayslip.month})`);
                  }}
                  className="btn-brand-purple"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Mail style={{ width: '12px', height: '12px' }} /> Share Email
                </button>
                <button
                  onClick={() => {
                    setShowPayslipModal(false);
                    setActiveViewPayslip(null);
                    setActiveViewPayslipStaff(null);
                  }}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.25rem', cursor: 'pointer', marginLeft: '12px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Sheet Canvas */}
            <div className="printable-area" style={{ padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: 'white', flex: 1 }}>
              {/* Payslip Header & Logo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #6B2C91', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ color: '#6B2C91', margin: 0, fontSize: '2rem', fontFamily: 'Outfit', fontWeight: 800 }}>SCULPT & GLOW</h1>
                  <span style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Clinical Aesthetic Atelier</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ color: '#1a1a1a', margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>PAY SLIP</h2>
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>Billing Cycle: <strong>{activeViewPayslip.month}</strong></span>
                  <br /><span style={{ color: '#666', fontSize: '0.85rem' }}>Payslip ID: <strong>{activeViewPayslip.id}</strong></span>
                </div>
              </div>

              {/* Company & Employee Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                <div>
                  <strong style={{ color: '#6B2C91', textTransform: 'uppercase', fontSize: '0.78rem', display: 'block', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>EMPLOYER:</strong>
                  <strong>Sculpt & Glow Clinic Ltd</strong>
                  <br />Suite 4, West End Medical Center
                  <br />Atelier Row, Pretoria East
                  <br />Tel: +27 (0) 12 555 0192
                  <br />VAT Reg No: 4890201192
                </div>
                <div>
                  <strong style={{ color: '#6B2C91', textTransform: 'uppercase', fontSize: '0.78rem', display: 'block', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px' }}>EMPLOYEE:</strong>
                  <strong>{activeViewPayslipStaff.name}</strong>
                  <br />Designation / Role: <span style={{ textTransform: 'capitalize' }}>{activeViewPayslipStaff.role}</span>
                  <br />Email: {activeViewPayslipStaff.email}
                  <br />Staff ID: {activeViewPayslipStaff.id}
                  <br />Generation Date: {activeViewPayslip.generatedAt}
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', color: '#1a1a1a', textAlign: 'left', fontWeight: 700 }}>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Description</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>Type</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Earnings */}
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>
                    <td style={{ padding: '10px 12px' }}><strong>Basic Monthly Salary</strong></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#34d399' }}>Basic Pay</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>R {activeViewPayslip.baseSalary.toFixed(2)}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>
                    <td style={{ padding: '10px 12px' }}><strong>Treatment & Sales Commissions</strong></td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#34d399' }}>Variable Pay</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>R {activeViewPayslip.commissionEarned.toFixed(2)}</td>
                  </tr>
                  {(activeViewPayslip.claimsApproved > 0 || activeViewPayslip.bonusApproved > 0) && (
                    <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>
                      <td style={{ padding: '10px 12px' }}><strong>Reimbursements & Performance Bonuses</strong></td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#34d399' }}>Adjustments</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600 }}>R {(activeViewPayslip.claimsApproved + activeViewPayslip.bonusApproved).toFixed(2)}</td>
                    </tr>
                  )}
                  {/* Deductions */}
                  {activeViewPayslip.loanDeduction > 0 && (
                    <tr style={{ borderBottom: '1px solid #e5e7eb', color: '#1a1a1a' }}>
                      <td style={{ padding: '10px 12px' }}><strong>Active Emergency Cash Loan Deduction</strong></td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ef4444' }}>Deduction</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>- R {activeViewPayslip.loanDeduction.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Total Payout Section */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <div style={{ width: '100%', maxWidth: '350px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginBottom: '8px' }}>
                    <span>Gross Earnings:</span>
                    <span>R {(activeViewPayslip.baseSalary + activeViewPayslip.commissionEarned + activeViewPayslip.claimsApproved + activeViewPayslip.bonusApproved).toFixed(2)}</span>
                  </div>
                  {activeViewPayslip.loanDeduction > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563', marginBottom: '8px' }}>
                      <span>Total Deductions:</span>
                      <span style={{ color: '#ef4444' }}>- R {activeViewPayslip.loanDeduction.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '3px double #6B2C91', paddingTop: '10px', marginTop: '10px', fontSize: '1.2rem', fontWeight: 800, color: '#6B2C91' }}>
                    <span>NET SALARY PAID:</span>
                    <span>R {activeViewPayslip.finalSalary.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Particulars / Banking details */}
              <div style={{ marginTop: '48px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', fontSize: '0.78rem', color: '#6b7280', lineHeight: '1.5' }}>
                <strong>BANK DISBURSEMENT DETAILS</strong>
                <br />This payout has been securely processed and transferred electronically to:
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '6px', color: '#1a1a1a', border: '1px solid #e5e7eb' }}>
                  <div>
                    <span>Account Holder: <strong>{activeViewPayslipStaff.name}</strong></span>
                    <br /><span>Bank Name: <strong>{activeViewPayslipStaff.bankName || 'FNB Pretoria'}</strong></span>
                  </div>
                  <div>
                    <span>Account Number: <strong>{activeViewPayslipStaff.accountNumber}</strong></span>
                    <br /><span>Branch Code: <strong>{activeViewPayslipStaff.branchCode || '250655'}</strong></span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontStyle: 'italic', fontSize: '0.72rem', color: '#9ca3af' }}>
                  <span>E-signature Security Token: ESG-PAY-{activeViewPayslip.id.split('-')[1] || 'SECURE'}</span>
                  <span>Sculpt & Glow Operations Ledger © 2026</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL A4 CORPORATE QUOTATION MODAL */}
      {showQuoteViewModal && activeViewQuote && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', color: '#1a1a1a', width: '100%', maxWidth: '800px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '12px', boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Toolbar */}
            <div style={{ backgroundColor: 'hsl(var(--brand-charcoal))', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>Corporate Quotation Viewer</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => alert(`Corporate A4 Quotation ${activeViewQuote.quoteNumber} successfully queued for printing!`)}
                  className="btn-brand-gold"
                  style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                >
                  <Printer style={{ width: '12px', height: '12px' }} /> Print Quote
                </button>
                <button
                  onClick={() => alert(`Quotation ${activeViewQuote.quoteNumber} successfully emailed to client!`)}
                  className="btn-brand-purple"
                  style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                >
                  <Mail style={{ width: '12px', height: '12px' }} /> Share Email
                </button>
                <button
                  onClick={() => alert(`Quotation ${activeViewQuote.quoteNumber} successfully sent to client WhatsApp!`)}
                  className="btn-brand-gold"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', backgroundColor: '#34d399', color: 'white' }}
                >
                  <MessageSquare style={{ width: '12px', height: '12px' }} /> WhatsApp
                </button>
                <button
                  onClick={() => { setShowQuoteViewModal(false); setActiveViewQuote(null); }}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.25rem', cursor: 'pointer', marginLeft: '12px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Sheet Canvas */}
            <div style={{ padding: '40px', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: 'white', flex: 1 }}>
              {/* Quote Title & Logo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #6B2C91', paddingBottom: '20px', marginBottom: '24px' }}>
                <div>
                  <h1 style={{ color: '#6B2C91', margin: 0, fontSize: '2rem', fontFamily: 'Outfit', fontWeight: 800 }}>SCULPT & GLOW</h1>
                  <span style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Clinical Aesthetic Atelier</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h2 style={{ color: '#1a1a1a', margin: 0, fontSize: '1.8rem', fontWeight: 700 }}>OFFICIAL QUOTATION</h2>
                  <span style={{ color: '#666', fontSize: '0.85rem' }}>Quote Reference: <strong>{activeViewQuote.quoteNumber}</strong></span>
                  <br /><span style={{ color: '#666', fontSize: '0.85rem' }}>Date: {activeViewQuote.date}</span>
                  <br /><span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>Expires: {activeViewQuote.expiryDate}</span>
                </div>
              </div>

              {/* Addresses section */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px', fontSize: '0.85rem', lineHeight: '1.5' }}>
                <div>
                  <strong style={{ color: '#6B2C91', textTransform: 'uppercase', fontSize: '0.78rem', display: 'block', marginBottom: '8px' }}>FROM:</strong>
                  <strong>Sculpt & Glow Clinic Ltd</strong>
                  <br />Suite 4, West End Medical Center
                  <br />Atelier Row, Pretoria East
                  <br />Tel: +27 (0) 12 555 0192
                  <br />Email: info@sculptglow.co.za
                </div>
                <div>
                  <strong style={{ color: '#6B2C91', textTransform: 'uppercase', fontSize: '0.78rem', display: 'block', marginBottom: '8px' }}>PREPARED FOR:</strong>
                  <strong>{clients.find(c => c.id === activeViewQuote.clientId)?.name || 'Walk-in Guest'}</strong>
                  <br />Email: {clients.find(c => c.id === activeViewQuote.clientId)?.email || 'N/A'}
                  <br />Phone: {clients.find(c => c.id === activeViewQuote.clientId)?.phone || 'N/A'}
                  <br />Validity period: 14 Days
                </div>
              </div>

              {/* Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f3f4f6', color: '#1a1a1a', textAlign: 'left', fontWeight: 700 }}>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb' }}>Description</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>Unit Cost (Excl VAT)</th>
                    <th style={{ padding: '10px 12px', borderBottom: '2px solid #e5e7eb', textAlign: 'right' }}>Total (Incl VAT)</th>
                  </tr>
                </thead>
                <tbody>
                  {(activeViewQuote.items || []).map((item, idx) => {
                    const priceExcl = item.price / 1.15;
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>
                        <td style={{ padding: '10px 12px' }}><strong>{item.name}</strong></td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>R {priceExcl.toFixed(2)}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#1a1a1a' }}>R {(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.85rem' }}>
                <div style={{ width: '280px', lineHeight: '1.8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4b5563' }}>
                    <span>Gross Estimation:</span>
                    <span>R {(activeViewQuote.total / (1 - activeViewQuote.discount / 100)).toFixed(2)}</span>
                  </div>
                  {activeViewQuote.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                      <span>Discount ({activeViewQuote.discount}%):</span>
                      <span>- R {((activeViewQuote.total / (1 - activeViewQuote.discount / 100)) * (activeViewQuote.discount / 100)).toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #6B2C91', paddingTop: '6px', marginTop: '6px', fontSize: '1.05rem', fontWeight: 700, color: '#1a1a1a' }}>
                    <span>Estimated Total (Incl VAT):</span>
                    <span>R {activeViewQuote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div style={{ marginTop: '48px', borderTop: '1px solid #e5e7eb', paddingTop: '16px', fontSize: '0.75rem', color: '#6b7280', lineHeight: '1.4' }}>
                <strong>QUOTATION COMPLIANCE & ACCEPTANCE NOTES</strong>
                <br />This quotation is valid until <strong>{activeViewQuote.expiryDate}</strong>. All treatments require booking slots in advance.
                <br />To accept this quote and convert it to a confirmed clinic session, please contact the receptionist desk or log in to the Elysium Client App and approve quotation ref: <strong>{activeViewQuote.quoteNumber}</strong>.
                <br /><em style={{ display: 'block', marginTop: '8px', textAlign: 'center' }}>We look forward to partnering in your aesthetic skincare journey!</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL CORPORATE REFUND LETTER MODAL */}
      {showRefundLetterModal && activeRefundInvoice && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 12000, padding: '20px' }}>
          <div style={{ backgroundColor: 'white', color: '#1a1a1a', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '12px', boxShadow: 'var(--shadow-premium)', display: 'flex', flexDirection: 'column' }}>
            {/* Header Toolbar */}
            <div style={{ backgroundColor: 'hsl(var(--brand-charcoal))', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <span style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>Formal Refund Notification Letter</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => alert(`Corporate Refund Confirmation Letter successfully queued for printing!`)}
                  className="btn-brand-gold"
                  style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                >
                  <Printer style={{ width: '12px', height: '12px' }} /> Print Letter
                </button>
                <button
                  onClick={() => alert(`Refund Letter successfully emailed to client!`)}
                  className="btn-brand-purple"
                  style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                >
                  <Mail style={{ width: '12px', height: '12px' }} /> Share Email
                </button>
                <button
                  onClick={() => alert(`Refund Letter successfully sent to client WhatsApp!`)}
                  className="btn-brand-gold"
                  style={{ padding: '6px 12px', fontSize: '0.72rem', backgroundColor: '#34d399', color: 'white' }}
                >
                  <MessageSquare style={{ width: '12px', height: '12px' }} /> WhatsApp
                </button>
                <button
                  onClick={() => { setShowRefundLetterModal(false); setActiveRefundInvoice(null); }}
                  style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '1.25rem', cursor: 'pointer', marginLeft: '12px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Sheet Canvas */}
            <div style={{ padding: '40px 50px', fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: 'white', flex: 1, lineHeight: '1.6', fontSize: '0.88rem', color: '#2d3748' }}>
              {/* Header Letterhead */}
              <div style={{ borderBottom: '2px solid #6B2C91', paddingBottom: '16px', marginBottom: '32px' }}>
                <h1 style={{ color: '#6B2C91', margin: 0, fontSize: '1.75rem', fontFamily: 'Outfit', fontWeight: 800 }}>SCULPT & GLOW CLINIC</h1>
                <span style={{ color: '#6b7280', fontSize: '0.75rem' }}>Atelier Suite 4, West End Medical Center, Pretoria East</span>
              </div>

              {/* Date & Address */}
              <div style={{ marginBottom: '24px' }}>
                <div>Date: {new Date().toISOString().split('T')[0]}</div>
                <div style={{ marginTop: '16px' }}>
                  <strong>To Valued Client:</strong>
                  <br />{clients.find(c => c.id === activeRefundInvoice.clientId)?.name || 'Walk-in Guest'}
                  <br />Email: {clients.find(c => c.id === activeRefundInvoice.clientId)?.email || 'N/A'}
                  <br />Phone: {clients.find(c => c.id === activeRefundInvoice.clientId)?.phone || 'N/A'}
                </div>
              </div>

              {/* Subject */}
              <h3 style={{ color: '#1a1a1a', fontSize: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px', marginBottom: '20px' }}>
                SUBJECT: REFUND TRANSACTION SETTLEMENT CONFIRMATION - {activeRefundInvoice.invoiceNumber}
              </h3>

              {/* Body */}
              <p>Dear {clients.find(c => c.id === activeRefundInvoice.clientId)?.name || 'Valued Guest'},</p>
              
              <p>
                This letter serves as formal confirmation that the refund transaction for invoice reference <strong>{activeRefundInvoice.invoiceNumber}</strong> has been successfully processed and finalized on our accounts ledger.
              </p>

              <p>
                The total refundable amount of <strong>R {activeRefundInvoice.total.toFixed(2)}</strong> has been credited back to your original payment method. Below is the summary details of the transaction:
              </p>

              {/* Details table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0', fontSize: '0.85rem', backgroundColor: '#f7fafc', border: '1px solid #e2e8f0' }}>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, width: '200px' }}>Tax Invoice Number:</td>
                    <td style={{ padding: '8px 12px' }}>{activeRefundInvoice.invoiceNumber}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Originally Settled Date:</td>
                    <td style={{ padding: '8px 12px' }}>{activeRefundInvoice.date}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Refund Settlement Date:</td>
                    <td style={{ padding: '8px 12px' }}>{new Date().toISOString().split('T')[0]}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Refund Reason recorded:</td>
                    <td style={{ padding: '8px 12px', color: '#ef4444', fontStyle: 'italic' }}>{activeRefundInvoice.refundReason || 'Service cancellation adjustment'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontWeight: 700 }}>Total Refunded Amount:</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#34d399' }}>R {activeRefundInvoice.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              <p>
                Please note that depending on your banking institution, the refund credit might take between 2 to 5 business days to reflect in your bank statement.
              </p>

              <p>
                We sincerely apologize for any inconvenience caused. If you have any questions or require further ledger clarification, please do not hesitate to contact our accounts division at accounts@sculptglow.co.za.
              </p>

              <div style={{ marginTop: '40px', lineHeight: '1.4' }}>
                <span>Sincerely,</span>
                <br /><strong style={{ display: 'block', marginTop: '24px', color: '#6B2C91' }}>Sculpt & Glow Financial Desk</strong>
                <span style={{ fontSize: '0.75rem', color: '#718096' }}>Authorized Accounts Office</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLINICAL SERVICE CONFIG CRUD */}
      {showServiceModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>
              {isEditingService ? 'Edit Clinical Service' : 'Add New Clinical Service'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Service Name:</label>
                <input 
                  type="text" 
                  className="brand-input" 
                  value={activeServiceForm.name} 
                  onChange={(e) => setActiveServiceForm(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Category:</label>
                  <select 
                    className="brand-input" 
                    value={activeServiceForm.category} 
                    onChange={(e) => setActiveServiceForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="Body Contouring">Body Contouring</option>
                    <option value="Facials & Wellness">Facials & Wellness</option>
                    <option value="Wellness Packages">Wellness Packages</option>
                    <option value="Hair & Beauty">Hair & Beauty</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Price (R):</label>
                  <input 
                    type="number" 
                    className="brand-input" 
                    value={activeServiceForm.price === 0 ? '' : activeServiceForm.price} 
                    onChange={(e) => setActiveServiceForm(prev => ({ ...prev, price: Number(e.target.value) }))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Duration (mins):</label>
                  <input 
                    type="number" 
                    className="brand-input" 
                    value={activeServiceForm.duration === 0 ? '' : activeServiceForm.duration} 
                    onChange={(e) => setActiveServiceForm(prev => ({ ...prev, duration: Number(e.target.value) }))} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Required Machine:</label>
                  <select 
                    className="brand-input" 
                    value={activeServiceForm.requiredMachine || ''} 
                    onChange={(e) => setActiveServiceForm(prev => ({ ...prev, requiredMachine: e.target.value || null }))}
                  >
                    <option value="">None (Manual Therapy)</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Description:</label>
                <textarea 
                  className="brand-input" 
                  rows={2} 
                  value={activeServiceForm.description || ''} 
                  onChange={(e) => setActiveServiceForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              {/* Service Consumables Mapping */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', marginTop: '4px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#D4AF37', fontWeight: 600, marginBottom: '6px' }}>Consumables Requirements:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto', marginBottom: '8px' }}>
                  {(activeServiceForm.consumables || []).map((cons, index) => {
                    const invItem = inventory.find(i => i.id === cons.itemId);
                    return (
                      <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#BFA6D8' }}>
                          {invItem?.name || 'Unknown item'}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{cons.quantity} {invItem?.unit || 'items'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveServiceForm(prev => ({
                                ...prev,
                                consumables: prev.consumables.filter((_, idx) => idx !== index)
                              }));
                            }}
                            style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '0.9rem', cursor: 'pointer' }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {(!activeServiceForm.consumables || activeServiceForm.consumables.length === 0) && (
                    <span style={{ fontSize: '0.72rem', color: '#A89684', fontStyle: 'italic' }}>No consumables linked to this service yet.</span>
                  )}
                </div>

                {/* Add consumable picker */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    id="add-consumable-picker" 
                    className="brand-input" 
                    style={{ fontSize: '0.75rem', height: '30px', flex: 1.5 }}
                    defaultValue=""
                  >
                    <option value="" disabled>Choose stock item...</option>
                    {inventory.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                    ))}
                  </select>
                  <input 
                    id="add-consumable-qty" 
                    type="number" 
                    className="brand-input" 
                    placeholder="Qty" 
                    style={{ fontSize: '0.75rem', height: '30px', flex: 0.6 }} 
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const picker = document.getElementById('add-consumable-picker');
                      const qtyInput = document.getElementById('add-consumable-qty');
                      const itemId = picker.value;
                      const quantity = Number(qtyInput.value);

                      if (itemId && quantity > 0) {
                        const currentCons = activeServiceForm.consumables || [];
                        // Check duplicate
                        if (currentCons.some(c => c.itemId === itemId)) {
                          alert('This item is already listed in consumables requirements.');
                          return;
                        }
                        setActiveServiceForm(prev => ({
                          ...prev,
                          consumables: [...currentCons, { itemId, quantity }]
                        }));
                        picker.value = '';
                        qtyInput.value = '';
                      } else {
                        alert('Please choose a valid stock item and specify quantity.');
                      }
                    }}
                    className="btn-brand-gold"
                    style={{ height: '30px', padding: '0 10px', fontSize: '0.7rem' }}
                  >
                    + Add
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  disabled={!activeServiceForm.name}
                  onClick={() => {
                    if (isEditingService) {
                      updateService(currentUserName(), activeServiceForm);
                    } else {
                      addService(currentUserName(), activeServiceForm);
                    }
                    setShowServiceModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center', opacity: activeServiceForm.name ? 1 : 0.4 }}
                >
                  {isEditingService ? 'Update Service' : 'Add Treatment'}
                </button>
                <button onClick={() => setShowServiceModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONSUMABLES DRILL DOWN BREAKDOWN */}
      {selectedDrillDownService && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 11000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '380px', border: '1px solid #D4AF37' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 8px 0' }}>Consumables Requirements</h3>
            <span style={{ fontSize: '0.8rem', color: '#BFA6D8', display: 'block', marginBottom: '16px' }}>
              For treatment: <strong>{selectedDrillDownService.name}</strong>
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(selectedDrillDownService.consumables || []).map((cons, idx) => {
                const item = inventory.find(i => i.id === cons.itemId);
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
                    <span style={{ color: 'white', fontSize: '0.8rem' }}>{item?.name || 'Unknown item'}</span>
                    <strong style={{ color: '#D4AF37', fontSize: '0.8rem' }}>{cons.quantity} {item?.unit || 'items'}</strong>
                  </div>
                );
              })}
              {(!selectedDrillDownService.consumables || selectedDrillDownService.consumables.length === 0) && (
                <div style={{ padding: '16px', textAlign: 'center', color: '#A89684', fontSize: '0.8rem', fontStyle: 'italic' }}>
                  ✓ This service requires no physical consumable deductions.
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedDrillDownService(null)} 
              className="btn-brand-purple" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '20px', height: '32px' }}
            >
              Close Breakdown
            </button>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER STOCK ITEM */}
      {showInventoryModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>{editingInventoryItem ? 'Edit Consumable Item' : 'Register Consumable Stock'}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Item Name:</label>
                <input 
                  type="text" 
                  className="brand-input" 
                  value={inventoryForm.name} 
                  onChange={(e) => setInventoryForm(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>{editingInventoryItem ? 'Current Qty:' : 'Starting Qty:'}</label>
                  <input 
                    type="number" 
                    className="brand-input" 
                    value={inventoryForm.quantity === 0 ? '' : inventoryForm.quantity} 
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, quantity: Number(e.target.value) }))} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Alert Threshold:</label>
                  <input 
                    type="number" 
                    className="brand-input" 
                    value={inventoryForm.alertAt === 0 ? '' : inventoryForm.alertAt} 
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, alertAt: Number(e.target.value) }))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Unit Type:</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ml, box, pack, items" 
                    className="brand-input" 
                    value={inventoryForm.unit} 
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, unit: e.target.value }))} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Supplier Name:</label>
                  <input 
                    type="text" 
                    className="brand-input" 
                    value={inventoryForm.supplier} 
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, supplier: e.target.value }))} 
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Unit cost (R):</label>
                  <input 
                    type="number" 
                    placeholder="Optional cost" 
                    className="brand-input" 
                    value={inventoryForm.cost === 0 ? '' : inventoryForm.cost} 
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, cost: Number(e.target.value) }))} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Retail price (R):</label>
                  <input 
                    type="number" 
                    placeholder="If client retailable" 
                    className="brand-input" 
                    value={inventoryForm.sellPrice === 0 ? '' : inventoryForm.sellPrice} 
                    onChange={(e) => setInventoryForm(prev => ({ ...prev, sellPrice: Number(e.target.value) }))} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  disabled={!inventoryForm.name}
                  onClick={() => {
                    if (editingInventoryItem) {
                      updateInventoryItem(currentUserName(), { id: editingInventoryItem.id, ...inventoryForm });
                    } else {
                      addInventoryItem('Dashboard Admin', inventoryForm);
                    }
                    setShowInventoryModal(false);
                    setEditingInventoryItem(null);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center', opacity: inventoryForm.name ? 1 : 0.4 }}
                >
                  {editingInventoryItem ? 'Save Changes' : 'Create Consumable'}
                </button>
                <button onClick={() => { setShowInventoryModal(false); setEditingInventoryItem(null); }} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STOCK ADJUSTMENTS */}
      {showStockAdjustModal && activeStockItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '8px' }}>Audited Stock Adjustment</h3>
            <span style={{ fontSize: '0.85rem', color: '#BFA6D8', display: 'block', marginBottom: '16px' }}>
              Adjusting: <strong>{activeStockItem.name}</strong> (In stock: {activeStockItem.quantity} {activeStockItem.unit})
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Adjustment Type:</label>
                <select 
                  className="brand-input" 
                  value={stockAdjustForm.type} 
                  onChange={(e) => setStockAdjustForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="add">📦 Add Ordered Inbound Stock (+)</option>
                  <option value="set">🔧 Set Absolute Total Count (Recount Correction)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>
                  {stockAdjustForm.type === 'add' ? 'Quantity to Add:' : 'New Total Quantity:'}
                </label>
                <input 
                  type="number" 
                  className="brand-input" 
                  value={stockAdjustForm.amount === '' ? '' : stockAdjustForm.amount} 
                  onChange={(e) => setStockAdjustForm(prev => ({ ...prev, amount: e.target.value === '' ? '' : Number(e.target.value) }))} 
                />
              </div>

              {stockAdjustForm.type === 'set' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#ef4444', fontWeight: 600, marginBottom: '6px' }}>
                    Mandatory Correction Reason:
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Broken packaging, expiry date write-off, count correction" 
                    className="brand-input" 
                    value={stockAdjustForm.reason} 
                    onChange={(e) => setStockAdjustForm(prev => ({ ...prev, reason: e.target.value }))} 
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  disabled={stockAdjustForm.amount === '' || (stockAdjustForm.type === 'set' && !stockAdjustForm.reason.trim())}
                  onClick={() => {
                    const amt = Number(stockAdjustForm.amount);
                    if (stockAdjustForm.type === 'add') {
                      updateInventoryItemStock(currentUserName(), activeStockItem.id, amt);
                    } else {
                      const delta = amt - activeStockItem.quantity;
                      updateInventoryItemStock(currentUserName(), activeStockItem.id, delta);
                      // Custom audit log with the mandatory reason
                      logAction(
                        currentUserName(), 
                        'Manual Stock Adjustment', 
                        `Manually adjusted stock of "${activeStockItem.name}" from ${activeStockItem.quantity} to ${amt} ${activeStockItem.unit}. Reason: ${stockAdjustForm.reason}`,
                        activeStockItem.quantity,
                        amt
                      );
                    }
                    setShowStockAdjustModal(false);
                    syncDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ 
                    width: '100%', justifyContent: 'center', 
                    opacity: (stockAdjustForm.amount !== '' && (stockAdjustForm.type === 'add' || stockAdjustForm.reason.trim())) ? 1 : 0.4 
                  }}
                >
                  Adjust & Log Audit
                </button>
                <button onClick={() => setShowStockAdjustModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
