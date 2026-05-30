import React, { useState, useEffect, useRef } from 'react';
import {
  Users, Calendar as CalendarIcon, CreditCard, Layers, Shield, Settings,
  TrendingUp, Award, FileText, BarChart2, Trash2, Plus, Check, ArrowRight,
  UserCheck, AlertTriangle, RefreshCw, Printer, Search, Mail, Bell,
  Image as ImageIcon, User, CheckCircle, Clock, Send, ShieldAlert, DollarSign,
  Briefcase, Wrench, Package, HelpCircle, ChevronRight, Download, ShoppingCart,
  Phone, MapPin, Share2, Sparkles, Heart, ArrowUpRight, Scale, Lock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, BarChart, Bar, Legend
} from 'recharts';

import {
  getTable,
  saveTable,
  logAction,
  addAppointment,
  updateAppointmentStatus,
  addClient,
  addClientWeightLog,
  redeemGlowPoints,
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
  checkScheduleConflict
} from './db/stateEngine';

export default function App() {
  // SAAS Remote technician control parameters
  const [rentPaymentStatus, setRentPaymentStatus] = useState('Paid'); // Paid, Suspended

  // Workspace active navigation tab triggers
  const [currentUserRole, setCurrentUserRole] = useState('owner'); // owner, receptionist, therapist
  const [activeDashboardTab, setActiveDashboardTab] = useState('dashboard');
  const [activeWebsiteTab, setActiveWebsiteTab] = useState('home');

  // Shared synched local tables state
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

  // Consumer Storefront & Shopping Cart states
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // cart, billing, success
  const [billingDetails, setBillingDetails] = useState({ name: 'Alice Smith', phone: '+27 (82) 019-2834', email: 'alice.smith@gmail.com', shipping: '12 Glenwood Gardens, Pretoria East' });
  const [websiteSelectedService, setWebsiteSelectedService] = useState(null);
  const [websiteBookingDate, setWebsiteBookingDate] = useState('2026-05-30');
  const [websiteBookingTime, setWebsiteBookingTime] = useState('09:00');
  const [showWebsiteBookingModal, setShowWebsiteBookingModal] = useState(false);
  const [specialSlideshowIdx, setSpecialSlideshowIdx] = useState(0);

  // iPhone Client App internal states
  const [appCurrentClient, setAppCurrentClient] = useState('cli-101'); // logged in as Alice Smith
  const [appMeasurementForm, setAppMeasurementForm] = useState({ weight: '', waist: '', hips: '' });
  const [showFlyerModal, setShowFlyerModal] = useState(false);

  // Administrative Dashboard panel modals states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, method: 'Card' });
  
  // Dashboard form bindings
  const [bookingForm, setBookingForm] = useState({
    clientId: 'cli-101', serviceId: 'srv-1', staffId: 'usr-3', room: 'Treatment Room 1',
    machineId: 'vacutherm-alpha', date: '2026-05-30', time: '09:00', duration: 30, notes: ''
  });
  const [productForm, setProductForm] = useState({ name: '', price: 250, stock: 10, category: 'Facial Products', description: '' });

  // Fairy Dust Star Particle & Glitter checkout states
  const [toasts, setToasts] = useState([]);
  const [glitters, setGlitters] = useState([]);
  const websiteRef = useRef(null);
  const canvasRef = useRef(null);

  // Sync tables from localStorage state engine
  const refreshDatabase = () => {
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
    refreshDatabase();

    // Direct event listener for shared state synchronization across portals
    const handleDbSync = () => refreshDatabase();
    window.addEventListener('salon_db_sync', handleDbSync);

    // Dynamic slideshow banner cycle
    const slideTimer = setInterval(() => {
      setSpecialSlideshowIdx(prev => (prev === 0 ? 1 : 0));
    }, 4000);

    // Register active notification loggers
    const handleNotification = (e) => {
      const { title, message, type } = e.detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    };

    window.addEventListener('salon_notification', handleNotification);
    return () => {
      window.removeEventListener('salon_db_sync', handleDbSync);
      window.removeEventListener('salon_notification', handleNotification);
      clearInterval(slideTimer);
    };
  }, []);

  // HTML5 Canvas gold & lilac fairy dust mouse trail tracker
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    resizeCanvas();

    class Particle {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 6 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * -1.5 - 0.5;
        this.color = Math.random() > 0.5 ? '#D4AF37' : '#BFA6D8'; // gold or lilac
        this.alpha = 1;
        this.decay = Math.random() * 0.03 + 0.015;
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
      }
      draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Draw tiny sparkle star
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size * 0.4, this.y - this.size * 0.4);
        ctx.lineTo(this.x + this.size, this.y);
        ctx.lineTo(this.x + this.size * 0.4, this.y + this.size * 0.4);
        ctx.lineTo(this.x, this.y + this.size);
        ctx.lineTo(this.x - this.size * 0.4, this.y + this.size * 0.4);
        ctx.lineTo(this.x - this.size, this.y);
        ctx.lineTo(this.x - this.size * 0.4, this.y - this.size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p, idx) => {
        p.update();
        p.draw();
        if (p.alpha <= 0) particles.splice(idx, 1);
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Emit stars
      if (Math.random() > 0.4) {
        particles.push(new Particle(x, y));
      }
    };

    const websiteEl = websiteRef.current;
    if (websiteEl) {
      websiteEl.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (websiteEl) {
        websiteEl.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [activeWebsiteTab]);

  // Casino Victory Glitter Confetti blast function
  const triggerGlitterBomb = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const count = 120;
    let newGlitters = [];

    for (let i = 0; i < count; i++) {
      const colors = ['#D4AF37', '#6B2C91', '#BFA6D8', '#B8860B', '#34d399', '#ffffff'];
      const left = windowWidth / 2 + (Math.random() * 200 - 100);
      const top = windowHeight / 2 + (Math.random() * 200 - 100);
      
      newGlitters.push({
        id: `g-${Date.now()}-${i}`,
        left,
        top,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 12 + 6,
        tx: (Math.random() * 600 - 300) + 'px',
        ty: (Math.random() * -500 - 100) + 'px',
        rot: (Math.random() * 720 - 360) + 'deg'
      });
    }

    setGlitters(newGlitters);
    logAction('E-Commerce Engine', 'Glitter Victory Bomb', 'Triggered high-volume casino victory glitter bomb on checkout.');
    setTimeout(() => setGlitters([]), 1500);
  };

  // E-commerce adding service to cart trigger
  const handleWebsiteBookService = (srv) => {
    setWebsiteSelectedService(srv);
    setShowWebsiteBookingModal(true);
  };

  const handleConfirmWebsiteBooking = () => {
    if (!websiteSelectedService) return;
    
    // Add booking to cart as a checkout item
    const cartItem = {
      id: `cart-${Date.now()}`,
      type: 'Service',
      name: `${websiteSelectedService.name} [Service]`,
      price: websiteSelectedService.price,
      quantity: 1,
      bookingDetails: {
        serviceId: websiteSelectedService.id,
        date: websiteBookingDate,
        time: websiteBookingTime,
        machineId: websiteSelectedService.requiredMachine || '',
        duration: websiteSelectedService.duration
      }
    };

    setCart(prev => [...prev, cartItem]);
    setShowWebsiteBookingModal(false);
    setActiveWebsiteTab('cart');
    setCheckoutStep('cart');
    
    logAction('Customer Portal', 'Cart Add', `Added ${websiteSelectedService.name} schedule for ${websiteBookingDate} to cart.`);
  };

  const handleAddProductToCart = (prod) => {
    // Check stock limit
    if (prod.stock <= 0) {
      alert('This highly coveted product is currently sold out! Replenishment due shortly.');
      return;
    }

    const cartItem = {
      id: `cart-${Date.now()}`,
      type: 'Product',
      name: `${prod.name} [Product]`,
      price: prod.price,
      quantity: 1
    };

    setCart(prev => [...prev, cartItem]);
    setActiveWebsiteTab('cart');
    setCheckoutStep('cart');
    logAction('Customer Portal', 'Cart Add', `Added ${prod.name} retail product to cart.`);
  };

  const handleCartCheckoutSubmit = () => {
    if (cart.length === 0) return;

    // Create invoices
    const subtotal = Number((cart.reduce((acc, c) => acc + c.price, 0) / 1.15).toFixed(2));
    const total = cart.reduce((acc, c) => acc + c.price, 0);
    const tax = Number((total - subtotal).toFixed(2));

    const invoice = addInvoice('Online Customer Storefront', {
      clientId: appCurrentClient || 'cli-101',
      items: cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity })),
      subtotal,
      tax,
      discount: 0,
      total,
      status: 'Paid' // Online gateway pay instantly
    });

    // Capture payment
    addPaymentToInvoice('Payment Gateway', invoice.id, { amount: total, method: 'Card' });

    // Handle service booking insertion if services were in cart
    cart.forEach(c => {
      if (c.type === 'Service' && c.bookingDetails) {
        addAppointment('Customer Online Portal', {
          clientId: appCurrentClient || 'cli-101',
          serviceId: c.bookingDetails.serviceId,
          staffId: 'usr-3', // Jessica
          room: 'Treatment Room 1',
          machineId: c.bookingDetails.machineId,
          date: c.bookingDetails.date,
          time: c.bookingDetails.time,
          duration: c.bookingDetails.duration,
          status: 'Confirmed',
          notes: 'Booked online via storefront. Fully paid.'
        });
      }
    });

    triggerGlitterBomb();
    setCart([]);
    setCheckoutStep('success');
    refreshDatabase();
  };

  // Client smartphone forms measurement submits
  const handleAppSubmitMeasurements = (e) => {
    e.preventDefault();
    if (!appMeasurementForm.weight) return;
    
    addClientWeightLog('Mobile Client App', appCurrentClient, {
      weight: Number(appMeasurementForm.weight),
      waist: Number(appMeasurementForm.waist) || 0,
      hips: Number(appMeasurementForm.hips) || 0
    });
    
    setAppMeasurementForm({ weight: '', waist: '', hips: '' });
    refreshDatabase();
  };

  // Active client profile helper
  const activeClientProfile = clients.find(c => c.id === appCurrentClient) || clients[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#000' }}>
      
      {/* 1. SAAS TECHNICAL REMOTE LOCK CONSOLE BAR */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 24px', backgroundColor: '#111827', borderBottom: '2px solid #374151',
        zIndex: 99999, height: '60px', boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert style={{ color: '#ef4444', width: '22px', height: '22px' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 800, tracking: '0.05em', color: '#f3f4f6' }}>
            ELYSIUM SAAS PROVIDER TECH BOARD (REMOTE DEVISE CONTROL)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Rent Payment Lock simulator:</span>
          <div style={{ display: 'flex', backgroundColor: '#1f2937', padding: '3px', borderRadius: '8px', border: '1px solid #4b5563' }}>
            <button
              onClick={() => {
                setRentPaymentStatus('Paid');
                logAction('SaaS Provider Tech', 'Restore Subscription', 'Owner rent paid. Core receptionist dashboard unlocked.');
              }}
              style={{
                backgroundColor: rentPaymentStatus === 'Paid' ? '#10b981' : 'transparent',
                color: '#fff', border: 'none', padding: '4px 10px', fontSize: '0.72rem',
                fontWeight: 700, borderRadius: '6px', cursor: 'pointer'
              }}
            >
              Rent Paid (Unlock)
            </button>
            <button
              onClick={() => {
                setRentPaymentStatus('Suspended');
                logAction('SaaS Provider Tech', 'Suspend Account', 'Rental payment overdue warning! Receptionist dashboard remote-locked.');
              }}
              style={{
                backgroundColor: rentPaymentStatus === 'Suspended' ? '#ef4444' : 'transparent',
                color: '#fff', border: 'none', padding: '4px 10px', fontSize: '0.72rem',
                fontWeight: 700, borderRadius: '6px', cursor: 'pointer'
              }}
            >
              Overdue Rent (LOCKOUT)
            </button>
          </div>
        </div>
      </header>

      {/* 2. THE THREE SIDE-BY-SIDE INTERCONNECTED PORTALS CONTAINER */}
      <div className="workspace-container">
        
        {/* ======================================================= */}
        {/* PLATFORM 1: THE CONSUMER-FACING WEBSITE                 */}
        {/* ======================================================= */}
        <section className="panel-premium website-canvas-wrapper" ref={websiteRef}>
          <canvas ref={canvasRef} className="fairy-canvas" />

          {/* Top navigation menu bar, seamlessly blended */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', backgroundColor: 'transparent', zIndex: 100,
            borderBottom: '1px solid hsl(var(--brand-purple) / 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src="/logo.jpg" style={{ width: '32px', height: '32px', borderRadius: '50%' }} alt="Sculpt & Glow" />
              <span style={{ fontSize: '0.98rem', fontWeight: 800, tracking: '0.1em', fontFamily: 'Outfit' }}>SCULPT & GLOW</span>
            </div>

            <nav style={{ display: 'flex', gap: '14px', fontSize: '0.75rem', fontWeight: 600 }}>
              {[
                { id: 'home', label: 'Home' },
                { id: 'services', label: 'Services' },
                { id: 'products', label: 'Shop Products' },
                { id: 'about', label: 'About Us' },
                { id: 'contact', label: 'Contact' },
                { id: 'app', label: 'Download App' }
              ].map(wTab => (
                <button
                  key={wTab.id}
                  onClick={() => setActiveWebsiteTab(wTab.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: activeWebsiteTab === wTab.id ? 'hsl(var(--brand-gold))' : 'hsl(var(--brand-cream))',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  {wTab.label}
                </button>
              ))}
            </nav>

            <button
              onClick={() => setActiveWebsiteTab('cart')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--brand-gold))', position: 'relative' }}
            >
              <ShoppingCart style={{ width: '18px', height: '18px' }} />
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: 'hsl(var(--status-cancelled))', color: 'white', fontSize: '0.62rem', width: '12px', height: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center' }}>
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          <div className="panel-content animate-fade-in" style={{ backgroundColor: 'hsl(var(--brand-plum) / 0.15)' }}>
            
            {/* SUB-TAB: HOME PAGE */}
            {activeWebsiteTab === 'home' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Visual cover photo banner */}
                <div style={{
                  position: 'relative', height: '240px', borderRadius: '16px',
                  backgroundImage: "linear-gradient(rgba(0,0,0,0.5), rgba(46,13,61,0.85)), url('/cover.jpg')",
                  backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex',
                  flexDirection: 'column', justifyContent: 'flex-end', padding: '24px', boxSizing: 'border-box'
                }}>
                  <span className="psych-badge" style={{ position: 'absolute', top: '16px', right: '16px' }}>
                    🔥 4 Slots Left Today!
                  </span>
                  <h1 className="font-serif" style={{ fontSize: '1.8rem', margin: 0, fontWeight: 400 }}>Three treatments. One appointment.</h1>
                  <p style={{ color: 'hsl(var(--brand-cream))', margin: '4px 0 0 0', fontSize: '0.82rem', maxWidth: '380px', lineHeight: '1.4' }}>
                    Sculpt & Glow body shaping & wellness studio. Helping women feel stronger, lighter, and confidently sculpted. Not a salon, a wellness ecosystem.
                  </p>
                </div>

                {/* Specials banner slideshow */}
                <div>
                  <h4 style={{ fontSize: '0.78rem', tracking: '0.05em', color: 'hsl(var(--brand-gold))', uppercase: true, marginBottom: '8px' }}>Ecosystem Highlights & Machine Promos</h4>
                  <div style={{
                    position: 'relative', height: '140px', borderRadius: '12px',
                    backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url(${specialSlideshowIdx === 0 ? '/ad1.jpg' : '/ad2.jpg'})`,
                    backgroundSize: 'cover', backgroundPosition: 'center', transition: 'all 0.5s ease',
                    display: 'flex', alignItems: 'center', padding: '16px'
                  }}>
                    <div>
                      <strong style={{ fontSize: '0.98rem', display: 'block', color: 'hsl(var(--brand-cream))' }}>
                        {specialSlideshowIdx === 0 ? 'Vacutherm Fat Burner' : 'Infrared Lymph Drainage Rollers'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'hsl(var(--brand-lilac))' }}>
                        {specialSlideshowIdx === 0 ? 'Target metabolic acceleration under deep vacuum thermal waves.' : 'Decompress water weight and roll away lactic stress.'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ backgroundColor: 'hsl(var(--brand-charcoal))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--brand-purple) / 0.4)' }}>
                    <h4 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', margin: '0 0 8px 0', fontSize: '0.9rem' }}>VIP Rewards Loyalty</h4>
                    <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Every R100 spent awards Glow Points. Settle appointments and claim complimentary rollers, cryo angel sculpts or bio upgrades!</p>
                  </div>
                  <div style={{ backgroundColor: 'hsl(var(--brand-charcoal))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--brand-purple) / 0.4)' }}>
                    <h4 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', margin: '0 0 8px 0', fontSize: '0.9rem' }}>Korean Glass Skin</h4>
                    <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Direct corrective ampoule infusions for ultimate cellular resurfacing. Block out booking slots now.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: SERVICES */}
            {activeWebsiteTab === 'services' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>Clinical Treatment Menu</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {services.map(srv => (
                    <div key={srv.id} style={{ display: 'flex', gap: '14px', padding: '14px', backgroundColor: 'hsl(var(--brand-charcoal))', borderRadius: '12px', border: '1px solid hsl(var(--brand-purple) / 0.3)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.92rem', color: 'hsl(var(--brand-cream))' }}>{srv.name}</strong>
                          <span style={{ fontWeight: 700, color: 'hsl(var(--brand-gold))', fontSize: '0.92rem' }}>R {srv.price}</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', margin: '6px 0 8px 0', lineHeight: '1.4' }}>{srv.description}</p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', color: 'hsl(var(--brand-lilac))' }}>⌛ Duration: {srv.duration} mins</span>
                          <button
                            onClick={() => handleWebsiteBookService(srv)}
                            className="btn-brand-gold"
                            style={{ padding: '6px 12px', fontSize: '0.72rem' }}
                          >
                            Book Appointment
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB: PRODUCTS */}
            {activeWebsiteTab === 'products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>Sculpt & Glow Retail Pharmacy</h2>
                <p style={{ fontSize: '0.78rem', color: 'hsl(var(--text-secondary))' }}>Medical-grade Korean corrective skin treatments and advanced thermogenic fat burners.</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  {products.map(prod => (
                    <div key={prod.id} style={{ backgroundColor: 'hsl(var(--brand-charcoal))', borderRadius: '12px', border: '1px solid hsl(var(--brand-purple) / 0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                      <img src={prod.image} style={{ width: '100%', height: '110px', objectFit: 'cover' }} alt={prod.name} />
                      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <strong style={{ fontSize: '0.85rem', color: 'white', display: 'block' }}>{prod.name}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'hsl(var(--brand-lilac))' }}>{prod.category}</span>
                        <strong style={{ color: 'hsl(var(--brand-gold))', fontSize: '0.88rem' }}>R {prod.price}</strong>
                        <span style={{ fontSize: '0.65rem', color: prod.stock <= 0 ? 'hsl(var(--status-cancelled))' : 'hsl(var(--status-completed))' }}>
                          {prod.stock <= 0 ? 'Out of stock' : `Stock: ${prod.stock}`}
                        </span>
                        
                        <button
                          onClick={() => handleAddProductToCart(prod)}
                          disabled={prod.stock <= 0}
                          className="btn-brand-gold"
                          style={{ width: '100%', padding: '6px', fontSize: '0.72rem', justifyContent: 'center', marginTop: '6px' }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB: ABOUT */}
            {activeWebsiteTab === 'about' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', lineHeight: '1.5', fontSize: '0.82rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>Our Ecosystem Moto</h2>
                <blockquote style={{ borderLeft: '2px solid hsl(var(--brand-gold))', paddingLeft: '12px', fontStyle: 'italic', color: 'hsl(var(--brand-lilac))', margin: 0 }}>
                  "Sculpt & Glow is not just a clinic, it is an integrated biological workspace mapping targeted infrared therapies, manual lymphatic Rollers, Cryo angel treatments, and dermis peeling to sculpt women lighter, happier, and stronger."
                </blockquote>
                <p>Designed as a premier cloud studio in Pretoria East, South Africa, we combine Vacutherm vacuum treadmills and Korean CORRECTIVE cosmetics to generate real cellular results in a luxury Champagne space.</p>
              </div>
            )}

            {/* SUB-TAB: CONTACT US */}
            {activeWebsiteTab === 'contact' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.82rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>Visit Sculpt & Glow Pretoria East</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin style={{ width: '16px', height: '16px', color: 'hsl(var(--brand-gold))' }} />
                    <span>Shop 5, Glenwood Galleria, Pretoria East</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone style={{ width: '16px', height: '16px', color: 'hsl(var(--brand-gold))' }} />
                    <span>+27 (12) 998-2020</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <a href="https://www.facebook.com/share/1CZEEXWAqv/" target="_blank" rel="noopener noreferrer" className="btn-brand-purple" style={{ fontSize: '0.72rem', textDecoration: 'none' }}>Facebook</a>
                  <a href="https://www.tiktok.com/@sculptglow.pta" target="_blank" rel="noopener noreferrer" className="btn-brand-purple" style={{ fontSize: '0.72rem', textDecoration: 'none' }}>TikTok</a>
                  <a href="https://www.instagram.com/sculptglow.pta" target="_blank" rel="noopener noreferrer" className="btn-brand-purple" style={{ fontSize: '0.72rem', textDecoration: 'none' }}>Instagram</a>
                </div>

                <div style={{ borderTop: '1px solid hsl(var(--border-color))', paddingTop: '12px' }}>
                  <strong>Drop us a query:</strong>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                    <input type="text" placeholder="Your Name" className="brand-input" />
                    <input type="email" placeholder="Your Email" className="brand-input" />
                    <textarea placeholder="How can we sculpt your body?" className="brand-input" rows={2} />
                    <button onClick={() => alert('Message logged! We will get back to you shortly.')} className="btn-brand-gold" style={{ alignSelf: 'flex-start', fontSize: '0.72rem' }}>Send Query</button>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: APP DOWNLOAD */}
            {activeWebsiteTab === 'app' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>Get the Branded Client App</h2>
                <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Track your Glow Points, log weekly scale weights/waist size, upload before/after contour selfies, and settle bills in 1 tap!</p>
                <img src="/logo.jpg" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto', border: '2px solid hsl(var(--brand-gold))' }} alt="Sculpt & Glow app" />
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={() => alert('Sculpt & Glow iOS build downloaded!')} className="btn-brand-gold" style={{ fontSize: '0.75rem' }}><Download style={{ width: '14px', height: '14px' }} /> iOS Store</button>
                  <button onClick={() => alert('Sculpt & Glow Android APK downloaded!')} className="btn-brand-purple" style={{ fontSize: '0.75rem' }}><Download style={{ width: '14px', height: '14px' }} /> Play Store</button>
                </div>
              </div>
            )}

            {/* SUB-TAB: SHOPPING CART */}
            {activeWebsiteTab === 'cart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>Storefront Checkout</h2>
                
                {checkoutStep === 'cart' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {cart.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed hsl(var(--border-color))', borderRadius: '12px', color: 'hsl(var(--text-muted))' }}>Your shopping bag is empty.</div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {cart.map(c => (
                            <div key={c.id} style={{ display: 'flex', justify: 'space-between', padding: '10px', backgroundColor: 'hsl(var(--brand-charcoal))', borderRadius: '8px', border: '1px solid hsl(var(--brand-purple) / 0.2)', fontSize: '0.8rem' }}>
                              <div>
                                <strong>{c.name}</strong>
                                {c.bookingDetails && <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--brand-lilac))' }}>Booking: {c.bookingDetails.date} @ {c.bookingDetails.time}</span>}
                              </div>
                              <strong>R {c.price}</strong>
                            </div>
                          ))}
                        </div>

                        {/* Psychological checkout conversion enhancer */}
                        <div className="psych-badge" style={{ alignSelf: 'center', width: '100%', justifyContent: 'center' }}>
                          ⚠️ Slots are selling out! Check out in the next 3 minutes to secure your gold VIP points multipliers!
                        </div>

                        <div style={{ display: 'flex', justify: 'space-between', borderTop: '1px solid hsl(var(--border-color))', paddingTop: '10px' }}>
                          <span>Subtotal:</span>
                          <strong>R {cart.reduce((acc, c) => acc + c.price, 0)}</strong>
                        </div>

                        <button
                          onClick={() => setCheckoutStep('billing')}
                          className="btn-brand-gold"
                          style={{ width: '100%', justifyContent: 'center' }}
                        >
                          Proceed to Payment
                        </button>
                      </>
                    )}
                  </div>
                )}

                {checkoutStep === 'billing' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <strong>Billing & Delivery Information:</strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="brand-input"
                        value={billingDetails.name}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Contact Number"
                        className="brand-input"
                        value={billingDetails.phone}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))}
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        className="brand-input"
                        value={billingDetails.email}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))}
                      />
                      <input
                        type="text"
                        placeholder="Shipping Address (for products)"
                        className="brand-input"
                        value={billingDetails.shipping}
                        onChange={(e) => setBillingDetails(prev => ({ ...prev, shipping: e.target.value }))}
                      />
                    </div>

                    <button
                      onClick={handleCartCheckoutSubmit}
                      className="btn-brand-gold"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                    >
                      🚀 Settle Payment (Pay Gate Checkout)
                    </button>
                  </div>
                )}

                {checkoutStep === 'success' && (
                  <div style={{ textAlign: 'center', padding: '30px', display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'hsl(var(--status-completed) / 0.15)', color: 'hsl(var(--status-completed))', display: 'flex', alignItems: 'center', justify: 'center' }}>
                      <CheckCircle style={{ width: '28px', height: '28px' }} />
                    </div>
                    <h3 style={{ color: 'hsl(var(--brand-gold))' }}>CHECKOUT COMPLETED!</h3>
                    <p style={{ fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>
                      Your payment was processed successfully! Time slot reserved. Your **Glow Points** rewards balance has been adjusted. See you at Sculpt & Glow!
                    </p>
                    <button
                      onClick={() => setActiveWebsiteTab('home')}
                      className="btn-brand-purple"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Return Home
                    </button>
                  </div>
                )}

              </div>
            )}

          </div>
        </section>

        {/* ======================================================= */}
        {/* PLATFORM 2: THE MOBILE CLIENT APP                       */}
        {/* ======================================================= */}
        <section className="panel-premium" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
          
          <div className="iphone-emulator">
            <div className="iphone-notch" />
            <div className="iphone-screen">
              
              {/* Brand Header */}
              <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', borderBottom: '1px solid hsl(var(--brand-purple) / 0.4)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img src="/logo.jpg" style={{ width: '24px', height: '24px', borderRadius: '50%' }} alt="S&G App" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'white', tracking: '0.05em' }}>Sculpt App</span>
                </div>
                <button
                  onClick={() => setShowFlyerModal(true)}
                  style={{ backgroundColor: 'hsl(var(--brand-gold))', color: 'black', border: 'none', borderRadius: '6px', fontSize: '0.55rem', fontWeight: 700, padding: '3px 6px', cursor: 'pointer' }}
                >
                  🎁 Rewards Flyer
                </button>
              </div>

              {/* Client Profile Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'hsl(var(--brand-charcoal))', padding: '10px', borderRadius: '10px', border: '1px solid hsl(var(--brand-purple) / 0.3)' }}>
                <img src={activeClientProfile?.profilePhoto} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }} alt="Client avatar" />
                <div>
                  <strong style={{ fontSize: '0.8rem', display: 'block', color: 'white' }}>{activeClientProfile?.name}</strong>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                    <span className="badge-brand gold" style={{ fontSize: '0.52rem', padding: '2px 4px' }}>VIP: {activeClientProfile?.vipTier}</span>
                    <span className="badge-brand purple" style={{ fontSize: '0.52rem', padding: '2px 4px' }}>⚡ {activeClientProfile?.loyaltyPoints} Glow Points</span>
                  </div>
                </div>
              </div>

              {/* App Glow Points Redemption */}
              <div style={{ backgroundColor: 'hsl(var(--brand-plum) / 0.3)', padding: '12px', borderRadius: '10px', border: '1px solid hsl(var(--brand-gold) / 0.2)' }}>
                <strong style={{ fontSize: '0.75rem', display: 'block', color: 'hsl(var(--brand-gold))', marginBottom: '8px' }}>Redeem Glow Points</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {[
                    { name: 'Complimentary Body Roll Session', pts: 60 },
                    { name: 'Complimentary Vacutherm Session', pts: 80 },
                    { name: 'R500 Studio Credit Voucher', pts: 100 }
                  ].map((reward, i) => (
                    <div key={i} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', fontSize: '0.68rem', backgroundColor: 'hsl(var(--brand-black))', padding: '6px 8px', borderRadius: '6px' }}>
                      <span style={{ color: 'white' }}>{reward.name}</span>
                      <button
                        onClick={() => {
                          const res = redeemGlowPoints('Mobile Client App', appCurrentClient, reward.pts, reward.name);
                          if (!res.success) {
                            alert(res.error);
                          } else {
                            alert(`Claimed: ${reward.name}! Voucher saved to app.`);
                            refreshDatabase();
                          }
                        }}
                        style={{ border: 'none', backgroundColor: 'hsl(var(--brand-purple))', color: 'white', fontSize: '0.58rem', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Claim ({reward.pts} pts)
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight & Measurements Tracker */}
              <div style={{ backgroundColor: 'hsl(var(--brand-charcoal))', padding: '12px', borderRadius: '10px', border: '1px solid hsl(var(--brand-purple) / 0.3)' }}>
                <strong style={{ fontSize: '0.75rem', display: 'block', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Scale style={{ width: '12px', height: '12px', color: 'hsl(var(--brand-gold))' }} /> Weight & Measurements Log</strong>
                
                <form onSubmit={handleAppSubmitMeasurements} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '10px' }}>
                  <input
                    type="number"
                    placeholder="Weight (kg)"
                    className="brand-input"
                    style={{ fontSize: '0.65rem', padding: '4px' }}
                    value={appMeasurementForm.weight}
                    onChange={(e) => setAppMeasurementForm(prev => ({ ...prev, weight: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Waist (cm)"
                    className="brand-input"
                    style={{ fontSize: '0.65rem', padding: '4px' }}
                    value={appMeasurementForm.waist}
                    onChange={(e) => setAppMeasurementForm(prev => ({ ...prev, waist: e.target.value }))}
                  />
                  <input
                    type="number"
                    placeholder="Hips (cm)"
                    className="brand-input"
                    style={{ fontSize: '0.65rem', padding: '4px' }}
                    value={appMeasurementForm.hips}
                    onChange={(e) => setAppMeasurementForm(prev => ({ ...prev, hips: e.target.value }))}
                  />
                  <button type="submit" className="btn-brand-gold" style={{ gridColumn: 'span 3', padding: '4px', fontSize: '0.68rem', justifyContent: 'center' }}>
                    + Record scale metrics
                  </button>
                </form>

                {/* Renders client measurement logs */}
                <div style={{ maxHeight: '90px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.62rem' }}>
                  {activeClientProfile?.weightLogs?.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', justify: 'space-between', backgroundColor: 'hsl(var(--brand-black))', padding: '4px 6px', borderRadius: '4px', color: 'hsl(var(--text-secondary))' }}>
                      <span>{log.date}</span>
                      <strong>{log.weight} kg</strong>
                      <span>W: {log.waist}cm | H: {log.hips}cm</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* ======================================================= */}
        {/* PLATFORM 3: THE OWNER BOOKING SYSTEM                     */}
        {/* ======================================================= */}
        <section className="panel-premium" style={{ border: '1px solid hsl(var(--brand-purple) / 0.5)' }}>
          
          {/* SaaS Lockout Shield overlay */}
          {rentPaymentStatus === 'Suspended' && (
            <div className="rent-suspend-overlay">
              <Lock className="rent-lock-shield" style={{ width: '64px', height: '64px' }} />
              <h2 style={{ color: '#ef4444', fontFamily: 'Outfit', fontWeight: 800 }}>DASHBOARD LOCKED</h2>
              <p style={{ color: '#9ca3af', fontSize: '0.85rem', lineHeight: '1.5', marginTop: '10px' }}>
                Your subscription billing invoice for Sculpt & Glow Pretoria East is currently **OVERDUE**. Receptionist and technician dashboard controls have been blocked.
              </p>
              <div style={{ margin: '20px 0', padding: '12px', border: '1px dashed #ef4444', borderRadius: '10px', fontSize: '0.78rem', color: '#fca5a5' }}>
                Technician Notice: Settle outstanding monthly dashboard rent of **R2,800** immediately to restore platform operations.
              </div>
              <button
                onClick={() => {
                  setRentPaymentStatus('Paid');
                  logAction('Elysium SaaS Gateway', 'Settle Rental Invoice', 'Rental fee processed. Unlocking reception grids.');
                }}
                className="btn-brand-gold"
              >
                Mock Pay R2,800 Rent
              </button>
            </div>
          )}

          <div className="panel-header" style={{ borderBottom: '1px solid hsl(var(--brand-purple) / 0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield style={{ color: 'hsl(var(--brand-gold))', width: '22px', height: '22px' }} />
              <span style={{ fontSize: '0.92rem', fontWeight: 700 }}>Studio Dashboard</span>
            </div>
            
            {/* Renders dashboard mini tabs list */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[
                { id: 'dashboard', label: 'Calendar' },
                { id: 'inventory', label: 'Stock' },
                { id: 'products', label: 'Catalog Sync' }
              ].map(dTab => (
                <button
                  key={dTab.id}
                  onClick={() => setActiveDashboardTab(dTab.id)}
                  style={{
                    backgroundColor: activeDashboardTab === dTab.id ? 'hsl(var(--brand-purple))' : 'transparent',
                    color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.72rem', padding: '4px 8px', cursor: 'pointer'
                  }}
                >
                  {dTab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-content animate-fade-in">
            
            {/* DASHBOARD TAB: CALENDAR */}
            {activeDashboardTab === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem' }}>Studio Appointments schedule</h3>
                  <button className="btn-brand-gold" style={{ padding: '6px 12px', fontSize: '0.72rem' }} onClick={() => setShowBookingModal(true)}>
                    + Manual Booking
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {appointments.map(apt => {
                    const client = clients.find(c => c.id === apt.clientId);
                    const service = services.find(s => s.id === apt.serviceId);
                    
                    return (
                      <div key={apt.id} style={{ padding: '12px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', borderLeft: `4px solid hsl(var(--status-${apt.status.toLowerCase()}))`, borderRight: '1px solid hsl(var(--brand-purple) / 0.2)', borderTop: '1px solid hsl(var(--brand-purple) / 0.2)', borderBottom: '1px solid hsl(var(--brand-purple) / 0.2)', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'hsl(var(--brand-gold))', fontWeight: 700, fontSize: '0.85rem' }}>{apt.time}</span>
                            <strong style={{ fontSize: '0.85rem', color: 'white' }}>{client?.name}</strong>
                          </div>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>
                            {service?.name} ({apt.room})
                          </span>
                        </div>

                        <select
                          value={apt.status}
                          onChange={(e) => {
                            updateAppointmentStatus('Reception Desk', apt.id, e.target.value);
                            refreshDatabase();
                          }}
                          style={{ backgroundColor: 'hsl(var(--brand-charcoal))', color: 'white', border: '1px solid hsl(var(--brand-purple) / 0.4)', borderRadius: '6px', fontSize: '0.72rem', padding: '4px' }}
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
            )}

            {/* DASHBOARD TAB: INVENTORY */}
            {activeDashboardTab === 'inventory' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem' }}>Clinical stock ledgers</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {inventory.map(item => {
                    const isLow = item.quantity <= item.alertAt;
                    return (
                      <div key={item.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', border: '1px solid hsl(var(--brand-purple) / 0.2)' }}>
                        <div>
                          <strong style={{ fontSize: '0.82rem', color: isLow ? 'hsl(var(--status-cancelled))' : 'white' }}>{item.name}</strong>
                          <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--text-secondary))' }}>Supplier: {item.supplier}</span>
                        </div>
                        <div style={{ text: 'right' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block' }}>{item.quantity} {item.unit}</span>
                          <button
                            onClick={() => {
                              updateInventoryItemStock('Dashboard Admin', item.id, 50);
                              refreshDatabase();
                            }}
                            style={{ border: 'none', backgroundColor: 'hsl(var(--brand-purple))', color: 'white', fontSize: '0.58rem', padding: '2px 4px', borderRadius: '4px', cursor: 'pointer', marginTop: '4px' }}
                          >
                            +50 Restock
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DASHBOARD TAB: CATALOG SYNC */}
            {activeDashboardTab === 'products' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem' }}>E-Commerce Catalog Sync</h3>
                  <button className="btn-brand-gold" style={{ padding: '4px 8px', fontSize: '0.68rem' }} onClick={() => setShowProductModal(true)}>
                    + Add Product
                  </button>
                </div>
                
                <p style={{ fontSize: '0.7rem', color: 'hsl(var(--brand-lilac))', margin: 0 }}>Modifying items here immediately propagates prices, images, and out-of-stock listings to the Website storefront and Client App!</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {products.map(prod => (
                    <div key={prod.id} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: 'hsl(var(--brand-black))', borderRadius: '8px', border: '1px solid hsl(var(--brand-purple) / 0.2)' }}>
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: 'white' }}>{prod.name}</strong>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'hsl(var(--brand-gold))' }}>Price: R {prod.price}</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => {
                            const newPrice = prompt(`Enter new price for ${prod.name}:`, prod.price);
                            if (newPrice) {
                              updateProduct('Dashboard Admin', { id: prod.id, name: prod.name, price: Number(newPrice) });
                              refreshDatabase();
                            }
                          }}
                          style={{ border: 'none', backgroundColor: 'hsl(var(--brand-purple))', color: 'white', fontSize: '0.62rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Change Price
                        </button>
                        
                        <button
                          onClick={() => {
                            updateProduct('Dashboard Admin', { id: prod.id, name: prod.name, stock: prod.stock === 0 ? 15 : 0 });
                            refreshDatabase();
                          }}
                          style={{
                            border: 'none',
                            backgroundColor: prod.stock === 0 ? 'hsl(var(--status-completed) / 0.15)' : 'hsl(var(--status-cancelled) / 0.15)',
                            color: prod.stock === 0 ? 'hsl(var(--status-completed))' : 'hsl(var(--status-cancelled))',
                            fontSize: '0.62rem', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'
                          }}
                        >
                          {prod.stock === 0 ? 'Set In-Stock' : 'Set Out-Stock'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

      </div>

      {/* ======================================================= */}
      {/*   WORK AREA SYSTEM POPUP ACTIONS MODALS DIAGLOGUES       */}
      {/* ======================================================= */}

      {/* MODAL: WEBSITE APP COMPLIMENTARY REWARDS FLYER */}
      {showFlyerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '480px', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', marginBottom: '14px', textAlign: 'center' }}>Sculpt & Glow Points Club Flyer</h3>
            <img src="/flyer.jpg" style={{ width: '100%', borderRadius: '12px', border: '1px solid hsl(var(--brand-purple))' }} alt="Rewards Flyer" />
            <button
              onClick={() => setShowFlyerModal(false)}
              className="btn-brand-gold"
              style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
            >
              Close Rewards flyer
            </button>
          </div>
        </div>
      )}

      {/* MODAL: WEBSITE BOOKING SLOTS WIZARD */}
      {showWebsiteBookingModal && websiteSelectedService && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', marginBottom: '16px' }}>Select Booking Date & Time</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'white' }}>{websiteSelectedService.name}</strong>
                <span style={{ display: 'block', fontSize: '0.78rem', color: 'hsl(var(--brand-gold))', marginTop: '2px' }}>Fee: R {websiteSelectedService.price}</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Select Date:</label>
                <input
                  type="date"
                  className="brand-input"
                  value={websiteBookingDate}
                  onChange={(e) => setWebsiteBookingDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Select Available Slot:</label>
                <select
                  className="brand-input"
                  value={websiteBookingTime}
                  onChange={(e) => setWebsiteBookingTime(e.target.value)}
                >
                  <option value="09:00">09:00 AM</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="12:00">12:00 PM</option>
                  <option value="13:30">13:30 PM</option>
                  <option value="15:00">15:00 PM</option>
                  <option value="16:30">16:30 PM</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={handleConfirmWebsiteBooking}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Add to Cart
                </button>
                <button onClick={() => setShowWebsiteBookingModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DASHBOARD MANUAL BOOKING FORM */}
      {showBookingModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', marginBottom: '16px' }}>Add Dashboard Appointment</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Select Client:</label>
                <select
                  className="brand-input"
                  onChange={(e) => setBookingForm(prev => ({ ...prev, clientId: e.target.value }))}
                >
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Select Treatment:</label>
                <select
                  className="brand-input"
                  onChange={(e) => {
                    const srv = services.find(s => s.id === e.target.value);
                    setBookingForm(prev => ({ ...prev, serviceId: e.target.value, duration: srv ? srv.duration : 30, machineId: srv ? srv.requiredMachine || '' : '' }));
                  }}
                >
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} (R {s.price})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Date:</label>
                  <input
                    type="date"
                    className="brand-input"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Time:</label>
                  <input
                    type="time"
                    className="brand-input"
                    value={bookingForm.time}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    const res = addAppointment('Receptionist Desk', bookingForm);
                    if (!res.success) {
                      alert(`Smart Scheduler Alarm:\n\n${res.error}`);
                    } else {
                      setShowBookingModal(false);
                      refreshDatabase();
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

      {/* MODAL: ADD PRODUCT TO CATALOG */}
      {showProductModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', marginBottom: '16px' }}>Create Catalog Product</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Product Name:</label>
                <input
                  type="text"
                  className="brand-input"
                  onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Price (R):</label>
                  <input
                    type="number"
                    className="brand-input"
                    defaultValue={productForm.price}
                    onChange={(e) => setProductForm(prev => ({ ...prev, price: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Initial Stock:</label>
                  <input
                    type="number"
                    className="brand-input"
                    defaultValue={productForm.stock}
                    onChange={(e) => setProductForm(prev => ({ ...prev, stock: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Category:</label>
                <select
                  className="brand-input"
                  onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="Facial Products">Facial Products</option>
                  <option value="Weight Loss Products">Weight Loss Products</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Product Image URL:</label>
                <input
                  type="text"
                  className="brand-input"
                  defaultValue="https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300"
                  onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>Description:</label>
                <textarea
                  className="brand-input"
                  rows={2}
                  onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button
                  onClick={() => {
                    addProduct('Dashboard Admin', {
                      ...productForm,
                      image: productForm.image || 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300'
                    });
                    setShowProductModal(false);
                    refreshDatabase();
                  }}
                  className="btn-brand-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Sync Catalog
                </button>
                <button onClick={() => setShowProductModal(false)} className="btn-brand-purple" style={{ width: '100%', justifyContent: 'center' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOAT TOAST ALARMS */}
      <div style={{ position: 'fixed', bottom: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 99999 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className="animate-fade-in card-premium"
            style={{
              padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', width: '300px',
              borderLeft: `4px solid ${t.type === 'warning' ? '#ef4444' : 'hsl(var(--brand-gold))'}`,
              backgroundColor: 'hsl(var(--brand-charcoal))', boxShadow: 'var(--shadow-premium)'
            }}
          >
            {t.type === 'warning' ? (
              <AlertTriangle style={{ width: '22px', height: '22px', color: '#ef4444', flexShrink: 0 }} />
            ) : (
              <CheckCircle style={{ width: '22px', height: '22px', color: 'hsl(var(--brand-gold))', flexShrink: 0 }} />
            )}
            <div>
              <strong style={{ display: 'block', fontSize: '0.85rem', color: '#fff' }}>{t.title}</strong>
              <span style={{ fontSize: '0.78rem', color: 'hsl(var(--brand-cream))' }}>{t.message}</span>
            </div>
          </div>
        ))}
      </div>

      {/* RENDER CASINO EXPLOSION PARTICLES */}
      {glitters.map(gp => (
        <div
          key={gp.id}
          className="glitter-particle"
          style={{
            left: gp.left,
            top: gp.top,
            backgroundColor: gp.color,
            width: gp.size,
            height: gp.size,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            '--tx': gp.tx,
            '--ty': gp.ty,
            '--rot': gp.rot
          }}
        />
      ))}

    </div>
  );
}
