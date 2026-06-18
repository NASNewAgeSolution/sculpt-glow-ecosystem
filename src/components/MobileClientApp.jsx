import React, { useState, useEffect } from 'react';
import { 
  Award, Shield, CheckCircle, Scale, Calendar, AlertTriangle, 
  ArrowRight, User, Settings, Lock, ShoppingBag, Phone, Mail, 
  MessageSquare, Info, Plus, Minus, Trash2, Camera, LogOut, RefreshCw 
} from 'lucide-react';
import { 
  getTable, 
  redeemGlowPoints, 
  addClientWeightLog, 
  updateAppointmentStatus, 
  logAction,
  registerClientApp,
  loginClientApp,
  rescheduleAppointmentFromApp,
  cancelAppointmentFromApp,
  purchaseProductsFromApp,
  bookAppointmentFromApp,
  updateClientProfileFromApp,
  checkScheduleConflict
} from '../db/stateEngine';

export default function MobileClientApp() {
  // App Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appCurrentClient, setAppCurrentClient] = useState(''); // Stores logged in client ID
  const [authMode, setAuthMode] = useState('login'); // login, register
  
  // Auth Form States
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  
  // Database tables
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);

  // Active Screen
  const [activeScreen, setActiveScreen] = useState('profile'); // profile, schedule, progress, shop, contact
  
  // E-Commerce Cart & Booking Form States
  const [cart, setCart] = useState({}); // { [productId]: quantity }
  const [shopTab, setShopTab] = useState('products'); // products, booking
  const [bookingForm, setBookingForm] = useState({
    serviceId: '',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // default tomorrow
    time: '09:00',
    staffId: 'usr-3', // default Jessica Laser
    room: 'Treatment Room 1'
  });
  
  // Rescheduling States
  const [reschedulingAptId, setReschedulingAptId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  });

  // Cancellation States
  const [cancelingApt, setCancelingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPolicyChecked, setCancelPolicyChecked] = useState(false);
  
  // Scale Log States
  const [measurementForm, setMeasurementForm] = useState({ weight: '', waist: '', hips: '' });
  
  // Profile Form States
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    deliveryAddress: ''
  });

  // Visual Overlays / Help modals
  const [showGlowInfoModal, setShowGlowInfoModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [cardDetails, setCardDetails] = useState({ name: '', number: '', expiry: '', cvv: '' });
  
  // Fairy Dust Particles Click State
  const [sparkles, setSparkles] = useState([]);

  // Settings dropdown & Profile modal states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const syncApp = () => {
    const clientsTable = getTable('clients') || [];
    setClients(clientsTable);
    setAppointments(getTable('appointments') || []);
    setServices(getTable('services') || []);
    setProducts(getTable('products') || []);
    setUsers(getTable('users') || []);
    
    const settingsData = getTable('settings') || {};
    setSettings(settingsData);
    
    // Auto-sync current logged in client profile parameters
    if (appCurrentClient) {
      const match = clientsTable.find(c => c.id === appCurrentClient);
      if (match) {
        setProfileForm({
          name: match.name || '',
          email: match.email || '',
          phone: match.phone || '',
          password: match.password || '',
          deliveryAddress: match.deliveryAddress || ''
        });
      }
    }
  };

  useEffect(() => {
    syncApp();
    const handleSync = () => syncApp();
    window.addEventListener('salon_db_sync', handleSync);
    return () => window.removeEventListener('salon_db_sync', handleSync);
  }, [appCurrentClient]);

  const activeClientProfile = clients.find(c => c.id === appCurrentClient);
  const clientBookings = appointments.filter(a => a.clientId === appCurrentClient);

  // Sparkle Click Effect
  const handlePhoneScreenClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Create 8 sparkles
    const newSparkles = Array.from({ length: 8 }).map((_, i) => {
      const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.5;
      const velocity = Math.random() * 45 + 20;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity + 15; // downwards drift bias
      return {
        id: `${Date.now()}-${i}-${Math.random()}`,
        x: clickX,
        y: clickY,
        tx,
        ty,
        color: i % 2 === 0 ? '#D4AF37' : '#BFA6D8', // Gold or Lilac
        size: Math.random() * 5 + 3,
        rot: Math.random() * 360
      };
    });
    
    setSparkles(prev => [...prev, ...newSparkles]);
  };

  // Cleanup sparkles
  useEffect(() => {
    if (sparkles.length > 0) {
      const timer = setTimeout(() => {
        setSparkles([]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sparkles]);

  // Auth Action Handlers
  const handleAppLogin = (e) => {
    e.preventDefault();
    if (!authPhone || !authPassword) {
      return alert('Please enter both your cellphone number and password.');
    }
    const res = loginClientApp(authPhone, authPassword);
    if (res.success) {
      setAppCurrentClient(res.client.id);
      setIsLoggedIn(true);
      setActiveScreen('profile');
      setAuthPhone('');
      setAuthPassword('');
      alert(`Successfully logged in! Welcome back, ${res.client.name}.`);
    } else {
      alert(`Login Error: ${res.error}`);
    }
  };

  const handleAppRegister = (e) => {
    e.preventDefault();
    if (!authName || !authPhone || !authEmail || !authPassword) {
      return alert('Please fill in all registration fields.');
    }
    const res = registerClientApp('Mobile App Self', authName, authEmail, authPhone, authPassword);
    if (res.success) {
      setAppCurrentClient(res.client.id);
      setIsLoggedIn(true);
      setActiveScreen('profile');
      
      // Clear forms
      setAuthName('');
      setAuthPhone('');
      setAuthEmail('');
      setAuthPassword('');
      
      if (res.linked) {
        alert(`Linked Profile Detected!\n\nWelcome back, ${res.client.name}! We found your details in our clinic system and linked your past booking histories and Glow Points (${res.client.loyaltyPoints} points) to this app profile.`);
      } else {
        alert(`Welcome to Sculpt & Glow, ${authName}! Your client account has been registered successfully.`);
      }
    } else {
      alert(`Registration Error: ${res.error}`);
    }
  };

  // Cancel policy warning calculations
  const getCancelPolicyWarning = (apt) => {
    if (!apt) return null;
    const policyMinDays = settings.cancelPolicyDaysMin || 8;
    const policyMinForfeit = settings.cancelPolicyForfeitMin || 100;
    const policyMaxDays = settings.cancelPolicyDaysMax || 14;
    const policyMaxForfeit = settings.cancelPolicyForfeitMax || 50;

    const bookingDateObj = new Date(`${apt.date}T${apt.time}`);
    const today = new Date();
    const diffTime = bookingDateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return {
        forfeitPercent: 100,
        text: 'This booking is today or has already passed. Canceling forfeits 100% of the session cost.',
        severity: 'critical'
      };
    } else if (diffDays <= policyMinDays) {
      return {
        forfeitPercent: policyMinForfeit,
        text: `Strict Policy: Canceling within ${policyMinDays} days of the appointment forfeits ${policyMinForfeit}% of the payment. You will lose the fee.`,
        severity: 'strict'
      };
    } else if (diffDays <= policyMaxDays) {
      return {
        forfeitPercent: policyMaxForfeit,
        text: `Moderate Policy: Canceling within ${policyMaxDays} days of the appointment forfeits ${policyMaxForfeit}% of the payment. You will lose half of the fee.`,
        severity: 'moderate'
      };
    } else {
      return {
        forfeitPercent: 0,
        text: `Normal Policy: You are eligible for a 100% full refund on this booking (cancelled ${diffDays} days in advance).`,
        severity: 'free'
      };
    }
  };

  const handleCancelBookingSubmit = () => {
    if (!cancelReason.trim()) {
      return alert('Please enter a cancellation reason.');
    }
    if (!cancelPolicyChecked) {
      return alert('You must review and accept the cancellation refund policy warning checkbox.');
    }

    const res = cancelAppointmentFromApp('Client Self App', cancelingApt.id, cancelReason);
    if (res.success) {
      alert('Your appointment has been successfully cancelled and references updated.');
      setCancelingApt(null);
      setCancelReason('');
      setCancelPolicyChecked(false);
      syncApp();
    } else {
      alert(`Error canceling booking: ${res.error}`);
    }
  };

  // Rescheduling Submission
  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    const res = rescheduleAppointmentFromApp('Client Self App', reschedulingAptId, rescheduleForm.date, rescheduleForm.time);
    if (res.success) {
      alert('Rescheduled request submitted! Your booking date has been updated and is awaiting admin check.');
      setReschedulingAptId(null);
      syncApp();
    } else {
      alert(`Scheduling Conflict:\n\n${res.error}`);
    }
  };

  // E-Commerce purchase checkout
  const handleProductPurchaseSubmit = (e) => {
    e.preventDefault();
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvv) {
      return alert('Please fill in card details.');
    }
    
    // Convert cart items to array list
    const cartItemsList = Object.keys(cart).map(pId => {
      const prod = products.find(p => p.id === pId);
      return {
        id: pId,
        name: prod.name,
        price: prod.price,
        quantity: cart[pId]
      };
    }).filter(item => item.quantity > 0);
    
    if (cartItemsList.length === 0) return;
    
    const grossTotal = cartItemsList.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    const res = purchaseProductsFromApp('Client Self App', appCurrentClient, cartItemsList, grossTotal, 'Card');
    if (res.success) {
      alert(`Order processed successfully! R${grossTotal.toFixed(2)} paid. Check your invoice ledger inside settings profile.`);
      setCart({});
      setShowCheckoutModal(false);
      setCardDetails({ name: '', number: '', expiry: '', cvv: '' });
      syncApp();
    } else {
      alert(`Purchase Error: ${res.error}`);
    }
  };

  // Client App treatment booking checkout
  const handleBookTreatmentFromApp = (e) => {
    e.preventDefault();
    if (!bookingForm.serviceId) {
      return alert('Please select a service.');
    }
    
    const res = bookAppointmentFromApp('Client Self App', appCurrentClient, bookingForm);
    if (res.success) {
      alert('Booking submitted! Reservation saved in "Pending" status and is waiting for receptionist verification.');
      setBookingForm({
        serviceId: '',
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '09:00',
        staffId: 'usr-3',
        room: 'Treatment Room 1'
      });
      syncApp();
      setActiveScreen('schedule');
    } else {
      alert(`Scheduling Conflict:\n\n${res.error}`);
    }
  };

  // Scale Logs metrics submit
  const handleAppSubmitMeasurements = (e) => {
    e.preventDefault();
    if (!measurementForm.weight) return alert('Please enter your weight.');
    
    addClientWeightLog('Client Self App', appCurrentClient, {
      weight: Number(measurementForm.weight),
      waist: Number(measurementForm.waist) || 0,
      hips: Number(measurementForm.hips) || 0
    });
    
    setMeasurementForm({ weight: '', waist: '', hips: '' });
    syncApp();
    alert('Progress weight logged successfully!');
  };

  // Profile Update Submit
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email || !profileForm.phone) {
      return alert('Profile name, email, and phone are required.');
    }
    const res = updateClientProfileFromApp('Client Self App', appCurrentClient, profileForm);
    if (res) {
      alert('Your profile details have been successfully updated in the salon CRM.');
      syncApp();
    } else {
      alert('Error saving profile changes.');
    }
  };

  // Photo uploads (Mock camera image selector generating base64)
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = reader.result;
        updateClientProfileFromApp('Client Self App', appCurrentClient, {
          profilePhoto: base64Str
        });
        syncApp();
        alert('Profile picture uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Cart helper functions
  const addToCart = (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    
    const currentQty = cart[productId] || 0;
    if (prod.stock <= currentQty) {
      return alert('Sorry, no more stock available in studio inventory.');
    }
    
    setCart(prev => ({
      ...prev,
      [productId]: currentQty + 1
    }));
  };

  const removeFromCart = (productId) => {
    const currentQty = cart[productId] || 0;
    if (currentQty <= 0) return;
    setCart(prev => ({
      ...prev,
      [productId]: Math.max(0, currentQty - 1)
    }));
  };

  // Custom Inline SVG weight progress graph renderer
  const renderScaleLogsGraph = () => {
    const logs = activeClientProfile?.weightLogs || [];
    if (logs.length < 2) {
      return (
        <div style={{
          height: '110px', backgroundColor: '#0D0D0D', borderRadius: '10px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#A89684', fontSize: '0.7rem', border: '1px dashed rgba(255,255,255,0.05)'
        }}>
          Need at least 2 weight logs to render visual progress trend line.
        </div>
      );
    }

    const weights = logs.map(l => Number(l.weight));
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const diffW = maxW - minW || 1;

    // SVG parameters
    const width = 240;
    const height = 100;
    const padding = 15;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Map logs to coordinates
    const points = logs.map((log, index) => {
      const x = padding + (index / (logs.length - 1)) * graphWidth;
      const y = padding + graphHeight - ((Number(log.weight) - minW) / diffW) * graphHeight;
      return { x, y, weight: log.weight, date: log.date };
    });

    // Generate path
    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div style={{ backgroundColor: '#0D0D0D', padding: '10px', borderRadius: '10px', border: '1px solid rgba(107, 44, 145, 0.2)' }}>
        <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.62rem', color: '#BFA6D8', marginBottom: '8px' }}>
          <span>Scale Progress Trend</span>
          <span>Diff: {(weights[weights.length - 1] - weights[0]).toFixed(1)} kg</span>
        </div>
        
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + graphHeight/2} x2={width - padding} y2={padding + graphHeight/2} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + graphHeight} x2={width - padding} y2={padding + graphHeight} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots & Labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#6B2C91" stroke="#D4AF37" strokeWidth="1.5" />
              {/* Tooltip text */}
              <text x={p.x} y={p.y - 6} fill="white" fontSize="6px" fontWeight="bold" textAnchor="middle">
                {p.weight}kg
              </text>
              <text x={p.x} y={height - 2} fill="#A89684" fontSize="5px" textAnchor="middle">
                {p.date.slice(-5)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#111827', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justify: 'center', padding: '40px',
      boxSizing: 'border-box', position: 'relative', overflow: 'hidden'
    }}>
      
      {/* Fairy Dust sparkles container style */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fairy-dust {
          0% {
            transform: translate3d(0, 0, 0) scale(1) rotate(0deg);
            opacity: 1;
            filter: drop-shadow(0 0 4px var(--color));
          }
          100% {
            transform: translate3d(var(--tx), var(--ty), 0) scale(0) rotate(var(--rot));
            opacity: 0;
          }
        }
        .sparkle-particle {
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          z-index: 99999;
          animation: fairy-dust 0.8s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
      ` }} />

      {/* Visual Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit', margin: 0, letterSpacing: '0.05em' }}>SCULPT & GLOW</h1>
        <span style={{ fontSize: '0.78rem', color: '#BFA6D8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Interactive Client Mobile App</span>
      </div>

      {/* iPhone CSS Frame Chassis */}
      <div className="iphone-emulator" style={{ border: '12px solid #1F2937', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9)' }}>
        <div className="iphone-notch" />
        
        {/* iPhone screen canvas listening for clicks */}
        <div 
          className="iphone-screen" 
          onClick={handlePhoneScreenClick}
          style={{ display: 'flex', flexDirection: 'column', justify: 'space-between', padding: '40px 0 0 0', position: 'relative' }}
        >
          
          {/* Sparkles particle renderer */}
          {sparkles.map(sparkle => (
            <div 
              key={sparkle.id}
              className="sparkle-particle"
              style={{
                top: sparkle.y,
                left: sparkle.x,
                width: sparkle.size,
                height: sparkle.size,
                backgroundColor: sparkle.color,
                '--tx': `${sparkle.tx}px`,
                '--ty': `${sparkle.ty}px`,
                '--rot': `${sparkle.rot}deg`,
                '--color': sparkle.color
              }}
            />
          ))}

          {/* Top Notch App Header Bar */}
          <div style={{
            display: 'flex', justify: 'space-between', alignItems: 'center',
            padding: '12px 14px', borderBottom: '1px solid rgba(107, 44, 145, 0.25)',
            backgroundColor: '#1A1A1A', zIndex: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="/logo.jpg" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #D4AF37' }} alt="S&G Logo" />
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit' }}>Sculpt App</span>
            </div>
            
            {isLoggedIn && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  style={{
                    backgroundColor: 'transparent',
                    color: showSettingsMenu ? '#D4AF37' : '#BFA6D8',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    padding: '4px',
                    borderRadius: '50%',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  title="Settings"
                >
                  <Settings style={{ width: '16px', height: '16px' }} />
                </button>
                
                {/* Dropdown Menu */}
                {showSettingsMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '28px',
                    right: '0',
                    backgroundColor: '#1E1E1E',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
                    padding: '4px',
                    minWidth: '120px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}>
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setShowProfileModal(true);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'transparent',
                        color: 'white',
                        border: 'none',
                        textAlign: 'left',
                        padding: '6px 8px',
                        fontSize: '0.65rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'background-color 0.2s',
                        fontFamily: 'Outfit'
                      }}
                    >
                      <User style={{ width: '11px', height: '11px', color: '#D4AF37' }} /> View Profile
                    </button>
                    <button
                      onClick={() => {
                        setShowSettingsMenu(false);
                        setIsLoggedIn(false);
                        setAppCurrentClient('');
                        setCart({});
                        alert('Logged out of mobile app successfully.');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        border: 'none',
                        textAlign: 'left',
                        padding: '6px 8px',
                        fontSize: '0.65rem',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'background-color 0.2s',
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        marginTop: '2px',
                        paddingTop: '6px',
                        fontFamily: 'Outfit'
                      }}
                    >
                      <LogOut style={{ width: '11px', height: '11px' }} /> Log Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* AUTHENTICATION SHIELD */}
          {!isLoggedIn ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, justify: 'center' }}>
              
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <Shield style={{ width: '40px', height: '40px', color: '#D4AF37', margin: '0 auto 10px auto' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontFamily: 'Outfit', color: 'white' }}>
                  {authMode === 'login' ? 'Access Client Portal' : 'Register Member account'}
                </h3>
                <p style={{ fontSize: '0.68rem', color: '#BFA6D8', marginTop: '4px' }}>
                  {authMode === 'login' ? 'Enter credentials to manage bookings & rewards.' : 'Cell numbers link profiles automatically.'}
                </p>
              </div>

              {authMode === 'login' ? (
                <form onSubmit={handleAppLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#A89684', marginBottom: '4px' }}>Cellphone Number:</label>
                    <input 
                      type="text" 
                      className="brand-input" 
                      placeholder="e.g. +27820192834"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#A89684', marginBottom: '4px' }}>Password:</label>
                    <input 
                      type="password" 
                      className="brand-input" 
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '8px' }}
                    />
                  </div>
                  
                  <button type="submit" className="btn-brand-gold" style={{ justifyContent: 'center', fontSize: '0.75rem', padding: '8px', marginTop: '6px' }}>
                    Verify & Login <ArrowRight style={{ width: '12px', height: '12px' }} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.68rem', color: '#BFA6D8' }}>
                    Don't have an app account?{' '}
                    <span 
                      onClick={() => setAuthMode('register')} 
                      style={{ color: '#D4AF37', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                      Register here
                    </span>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAppRegister} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#A89684', marginBottom: '4px' }}>Full Name:</label>
                    <input 
                      type="text" 
                      className="brand-input" 
                      placeholder="e.g. Alice Smith"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#A89684', marginBottom: '4px' }}>Email Address:</label>
                    <input 
                      type="email" 
                      className="brand-input" 
                      placeholder="alice@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#A89684', marginBottom: '4px' }}>Cellphone Number:</label>
                    <input 
                      type="text" 
                      className="brand-input" 
                      placeholder="e.g. +27820192834"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.68rem', color: '#A89684', marginBottom: '4px' }}>Create Password:</label>
                    <input 
                      type="password" 
                      className="brand-input" 
                      placeholder="Min 4 characters"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      style={{ fontSize: '0.75rem', padding: '8px' }}
                    />
                  </div>
                  
                  <button type="submit" className="btn-brand-gold" style={{ justifyContent: 'center', fontSize: '0.75rem', padding: '8px', marginTop: '6px' }}>
                    Register Profile <CheckCircle style={{ width: '12px', height: '12px' }} />
                  </button>

                  <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.68rem', color: '#BFA6D8' }}>
                    Already have an account?{' '}
                    <span 
                      onClick={() => setAuthMode('login')} 
                      style={{ color: '#D4AF37', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
                    >
                      Login here
                    </span>
                  </div>
                </form>
              )}

            </div>
          ) : (
            /* ACTIVE APPLICATION CANVAS */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              
              {/* MAIN BODY SCROLL AREA */}
              <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* ACTIVE TAB: PROFILE & REDEEM POINTS */}
                {activeScreen === 'profile' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    
                    {/* Client Banner Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1A1A1A', padding: '12px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.2)' }}>
                      <img src={activeClientProfile?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(212,175,55,0.2)' }} alt="Profile" />
                      <div>
                        <strong style={{ fontSize: '0.85rem', display: 'block', color: 'white' }}>{activeClientProfile?.name}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span className="badge-brand gold" style={{ fontSize: '0.52rem', padding: '1px 4px' }}>VIP: {activeClientProfile?.vipTier || 'Bronze'}</span>
                          <span className="badge-brand purple" style={{ fontSize: '0.52rem', padding: '1px 4px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                            ⚡ {activeClientProfile?.loyaltyPoints || 0} Glow Points
                          </span>
                          <button 
                            onClick={() => setShowGlowInfoModal(true)}
                            style={{ background: 'none', border: 'none', padding: 0, margin: 0, color: '#D4AF37', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            <Info style={{ width: '10px', height: '10px' }} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* VOUCHER REDEEM PANEL */}
                    <div style={{ backgroundColor: 'rgba(46, 13, 61, 0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                      <strong style={{ fontSize: '0.78rem', display: 'block', color: '#D4AF37', marginBottom: '8px' }}>Redeem Glow Points</strong>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {[
                          { name: 'EMS Pads Session Add-On', pts: 30 },
                          { name: 'Complimentary Body Roll Session', pts: 60 },
                          { name: 'Complimentary Vacutherm Session', pts: 80 },
                          { name: 'R500 Studio Credit Voucher', pts: 100 }
                        ].map((reward, idx) => (
                          <div key={idx} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', fontSize: '0.68rem', backgroundColor: '#0D0D0D', padding: '6px 8px', borderRadius: '8px' }}>
                            <span style={{ color: 'white' }}>{reward.name}</span>
                            <button
                              onClick={() => {
                                const res = redeemGlowPoints('Mobile Client App', appCurrentClient, reward.pts, reward.name);
                                if (!res.success) {
                                  alert(`Redemption Error:\n\n${res.error}`);
                                } else {
                                  alert(`Voucher claimed: "${reward.name}"! Code added to client ledger.`);
                                  syncApp();
                                }
                              }}
                              style={{ border: 'none', backgroundColor: 'hsl(var(--brand-purple))', color: 'white', fontSize: '0.55rem', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Claim ({reward.pts}p)
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>



                  </div>
                )}

                {/* ACTIVE TAB: MY BOOKINGS SCREEN */}
                {activeScreen === 'schedule' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    <strong style={{ fontSize: '0.8rem', display: 'block', color: 'white' }}>Active Appointment Bookings</strong>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {clientBookings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed rgba(107, 44, 145, 0.2)', borderRadius: '10px', color: '#A89684', fontSize: '0.72rem' }}>
                          No reservations found on your profile.
                        </div>
                      ) : (
                        clientBookings.map(apt => {
                          const serviceObj = services.find(s => s.id === apt.serviceId);
                          return (
                            <div key={apt.id} style={{ padding: '12px', backgroundColor: '#1A1A1A', borderRadius: '10px', border: '1px solid rgba(107, 44, 145, 0.2)', fontSize: '0.7rem' }}>
                              <div style={{ display: 'flex', justify: 'space-between', marginBottom: '4px' }}>
                                <strong style={{ color: 'white' }}>{serviceObj?.name || 'Aesthetic Treatment'}</strong>
                                <span className={`badge-brand ${apt.status.toLowerCase()}`} style={{ fontSize: '0.52rem', padding: '2px 4px' }}>{apt.status}</span>
                              </div>
                              <div style={{ color: '#BFA6D8', marginTop: '2px' }}>Date: {apt.date} at {apt.time} ({apt.duration} min)</div>
                              <div style={{ color: '#A89684', fontSize: '0.65rem' }}>Room: {apt.room}</div>
                              
                              {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                                  
                                  {/* Reschedule Button */}
                                  <button
                                    onClick={() => {
                                      setReschedulingAptId(apt.id);
                                      setRescheduleForm({ date: apt.date, time: apt.time });
                                    }}
                                    style={{ flex: 1, border: 'none', backgroundColor: '#D4AF371a', color: '#D4AF37', fontSize: '0.58rem', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Reschedule
                                  </button>

                                  {/* Cancel Button */}
                                  <button
                                    onClick={() => {
                                      setCancelingApt(apt);
                                      setCancelReason('');
                                      setCancelPolicyChecked(false);
                                    }}
                                    style={{ flex: 1, border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.58rem', padding: '5px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Cancel Booking
                                  </button>

                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* RESCHEDULING SUB-DRAWER MODAL */}
                    {reschedulingAptId && (() => {
                      const activeReschedApt = appointments.find(a => a.id === reschedulingAptId);
                      const srv = services.find(s => s.id === activeReschedApt?.serviceId);
                      return (
                        <div style={{
                          backgroundColor: '#0D0D0D', border: '1px solid hsl(var(--brand-gold))',
                          padding: '12px', borderRadius: '10px', marginTop: '10px'
                        }} className="animate-fade-in">
                          <strong style={{ fontSize: '0.75rem', color: '#D4AF37', display: 'block', marginBottom: '8px' }}>Reschedule "{srv?.name}"</strong>
                          
                          <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Choose Date:</label>
                              <input 
                                type="date" 
                                className="brand-input" 
                                style={{ fontSize: '0.7rem', padding: '6px' }}
                                value={rescheduleForm.date}
                                onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                              />
                            </div>
                            
                            <div>
                              <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '4px' }}>Select Available Time Slot:</label>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', maxHeight: '80px', overflowY: 'auto' }}>
                                {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(slot => {
                                  const conflict = checkScheduleConflict({
                                    ...activeReschedApt,
                                    date: rescheduleForm.date,
                                    time: slot
                                  });
                                  const isConflict = conflict.conflict;
                                  const isSel = rescheduleForm.time === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      disabled={isConflict}
                                      onClick={() => setRescheduleForm(prev => ({ ...prev, time: slot }))}
                                      style={{
                                        border: isSel ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.05)',
                                        backgroundColor: isSel ? 'rgba(212,175,55,0.2)' : isConflict ? 'rgba(239,68,68,0.05)' : 'rgba(52,211,153,0.1)',
                                        color: isConflict ? '#666' : isSel ? '#D4AF37' : '#34d399',
                                        fontSize: '0.58rem', padding: '3px 0', borderRadius: '4px', cursor: 'pointer'
                                      }}
                                    >
                                      {slot}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                              <button type="button" onClick={() => setReschedulingAptId(null)} className="btn-brand-purple" style={{ flex: 1, fontSize: '0.65rem', padding: '5px', justifyContent: 'center' }}>Cancel</button>
                              <button type="submit" className="btn-brand-gold" style={{ flex: 1, fontSize: '0.65rem', padding: '5px', justifyContent: 'center' }}>Confirm</button>
                            </div>
                          </form>
                        </div>
                      );
                    })()}

                    {/* CANCELLATION SUB-DRAWER WARNING MODAL */}
                    {cancelingApt && (() => {
                      const warningObj = getCancelPolicyWarning(cancelingApt);
                      return (
                        <div style={{
                          backgroundColor: '#0D0D0D', border: '1px solid #ef4444',
                          padding: '12px', borderRadius: '10px', marginTop: '10px'
                        }} className="animate-fade-in">
                          <strong style={{ fontSize: '0.78rem', color: '#ef4444', display: 'block', marginBottom: '6px' }}>Verify Cancellation Request</strong>
                          
                          <div style={{
                            backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                            padding: '8px', borderRadius: '6px', fontSize: '0.65rem', color: '#fca5a5', lineHeight: '1.4', marginBottom: '10px'
                          }}>
                            {warningObj.text}
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Reason for cancellation:</label>
                              <textarea
                                className="brand-input"
                                rows={2}
                                style={{ fontSize: '0.7rem', padding: '6px', borderColor: 'rgba(239,68,68,0.4)' }}
                                placeholder="Type reason here..."
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                              />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginTop: '4px' }}>
                              <input 
                                type="checkbox"
                                checked={cancelPolicyChecked}
                                onChange={(e) => setCancelPolicyChecked(e.target.checked)}
                                style={{ accentColor: '#ef4444' }}
                              />
                              <span style={{ fontSize: '0.6rem', color: 'white' }}>I accept the cancellation refund policy warning terms.</span>
                            </label>

                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                              <button type="button" onClick={() => setCancelingApt(null)} className="btn-brand-purple" style={{ flex: 1, fontSize: '0.65rem', padding: '5px', justifyContent: 'center' }}>Keep Booking</button>
                              <button type="button" onClick={handleCancelBookingSubmit} className="btn-brand-gold" style={{ flex: 1, fontSize: '0.65rem', padding: '5px', justifyContent: 'center', backgroundColor: '#ef4444', color: 'white' }}>Confirm Cancel</button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                  </div>
                )}

                {/* ACTIVE TAB: SCALE LOG PROGRESS */}
                {activeScreen === 'progress' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    <strong style={{ fontSize: '0.8rem', display: 'block', color: 'white' }}>Body Shaping Progress Logs</strong>
                    
                    {/* SVG Progress Graph */}
                    {renderScaleLogsGraph()}

                    {/* Log new metrics form */}
                    <div className="card-premium" style={{ border: '1px solid rgba(255,255,255,0.05)', padding: '12px' }}>
                      <strong style={{ fontSize: '0.72rem', display: 'block', color: 'white', marginBottom: '8px' }}>Log Today's Measurement</strong>
                      <form onSubmit={handleAppSubmitMeasurements} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.58rem', color: '#A89684', marginBottom: '2px' }}>Weight (kg):</label>
                            <input type="number" step="0.1" className="brand-input" style={{ fontSize: '0.68rem', padding: '5px' }} value={measurementForm.weight} onChange={(e) => setMeasurementForm(prev => ({ ...prev, weight: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.58rem', color: '#A89684', marginBottom: '2px' }}>Waist (cm):</label>
                            <input type="number" className="brand-input" style={{ fontSize: '0.68rem', padding: '5px' }} value={measurementForm.waist} onChange={(e) => setMeasurementForm(prev => ({ ...prev, waist: e.target.value }))} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.58rem', color: '#A89684', marginBottom: '2px' }}>Hips (cm):</label>
                            <input type="number" className="brand-input" style={{ fontSize: '0.68rem', padding: '5px' }} value={measurementForm.hips} onChange={(e) => setMeasurementForm(prev => ({ ...prev, hips: e.target.value }))} />
                          </div>
                        </div>
                        <button type="submit" className="btn-brand-gold" style={{ fontSize: '0.7rem', padding: '6px', justifyContent: 'center', marginTop: '4px' }}>
                          Record Metrics
                        </button>
                      </form>
                    </div>

                    {/* Historical logs table list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#BFA6D8' }}>Historical Scale Logs</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '120px', overflowY: 'auto' }}>
                        {activeClientProfile?.weightLogs?.slice().reverse().map((wl, i) => (
                          <div key={i} style={{ display: 'flex', justify: 'space-between', backgroundColor: '#1A1A1A', padding: '6px 8px', borderRadius: '6px', fontSize: '0.65rem', color: 'white', border: '1px solid rgba(255,255,255,0.02)' }}>
                            <strong>{wl.date}</strong>
                            <span style={{ color: '#D4AF37' }}>{wl.weight} kg</span>
                            <span style={{ color: '#BFA6D8' }}>Waist: {wl.waist}cm | Hips: {wl.hips}cm</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* ACTIVE TAB: BOOK & SHOP E-COMMERCE TAB */}
                {activeScreen === 'shop' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    
                    {/* Toggle Shop Sub-Tabs */}
                    <div style={{ display: 'flex', backgroundColor: '#0D0D0D', padding: '4px', borderRadius: '8px' }}>
                      <button
                        onClick={() => setShopTab('products')}
                        style={{
                          flex: 1, border: 'none', background: shopTab === 'products' ? 'hsl(var(--brand-purple))' : 'none',
                          color: 'white', padding: '6px 0', fontSize: '0.68rem', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer'
                        }}
                      >
                        Atelier Boutique
                      </button>
                      <button
                        onClick={() => setShopTab('booking')}
                        style={{
                          flex: 1, border: 'none', background: shopTab === 'booking' ? 'hsl(var(--brand-purple))' : 'none',
                          color: 'white', padding: '6px 0', fontSize: '0.68rem', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer'
                        }}
                      >
                        Book Treatment
                      </button>
                    </div>

                    {/* ATELIER BOUTIQUE SUB-TAB */}
                    {shopTab === 'products' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-fade-in">
                        
                        {/* Cart Summary Bar */}
                        {(() => {
                          const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
                          if (cartCount > 0) {
                            return (
                              <div style={{
                                backgroundColor: 'rgba(212,175,55,0.15)', border: '1px solid #D4AF37',
                                padding: '10px', borderRadius: '10px', display: 'flex', justify: 'space-between', alignItems: 'center'
                              }}>
                                <span style={{ fontSize: '0.7rem', color: '#D4AF37', fontWeight: 'bold' }}>
                                  Cart Items: {cartCount} units
                                </span>
                                <button
                                  onClick={() => setShowCheckoutModal(true)}
                                  className="badge-brand gold"
                                  style={{ cursor: 'pointer', border: 'none', fontSize: '0.65rem' }}
                                >
                                  Checkout Cart
                                </button>
                              </div>
                            );
                          }
                          return null;
                        })()}

                        {/* Retail Products Catalog Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {products.map(prod => (
                            <div key={prod.id} style={{ display: 'flex', gap: '10px', backgroundColor: '#1A1A1A', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                              <img src={prod.image} alt={prod.name} style={{ width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} />
                              
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                                <div>
                                  <strong style={{ fontSize: '0.72rem', display: 'block', color: 'white' }}>{prod.name}</strong>
                                  <span style={{ fontSize: '0.62rem', color: '#A89684' }}>{prod.category}</span>
                                </div>
                                
                                <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                  <strong style={{ fontSize: '0.75rem', color: '#D4AF37' }}>R {prod.price.toFixed(2)}</strong>
                                  
                                  {prod.stock <= 0 ? (
                                    <span style={{ fontSize: '0.58rem', color: '#ef4444', fontWeight: 'bold' }}>Sold Out</span>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <button onClick={() => removeFromCart(prod.id)} style={{ border: 'none', backgroundColor: '#000', color: 'white', width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                                      <span style={{ fontSize: '0.68rem', color: 'white', minWidth: '10px', textAlign: 'center' }}>{cart[prod.id] || 0}</span>
                                      <button onClick={() => addToCart(prod.id)} style={{ border: 'none', backgroundColor: '#000', color: 'white', width: '16px', height: '16px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                                    </div>
                                  )}

                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                      </div>
                    )}

                    {/* BOOK TREATMENT SUB-TAB */}
                    {shopTab === 'booking' && (
                      <form onSubmit={handleBookTreatmentFromApp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }} className="animate-fade-in">
                        
                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#A89684', marginBottom: '4px' }}>Select Treatment:</label>
                          <select
                            className="brand-input"
                            style={{ fontSize: '0.72rem', padding: '6px' }}
                            value={bookingForm.serviceId}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, serviceId: e.target.value }))}
                          >
                            <option value="">-- Choose Treatment --</option>
                            {services.map(s => (
                              <option key={s.id} value={s.id}>{s.name} (R {s.price})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#A89684', marginBottom: '4px' }}>Select Staff / Therapist:</label>
                          <select
                            className="brand-input"
                            style={{ fontSize: '0.72rem', padding: '6px' }}
                            value={bookingForm.staffId}
                            onChange={(e) => setBookingForm(prev => ({ ...prev, staffId: e.target.value }))}
                          >
                            {users.filter(u => u.role === 'therapist' || u.role === 'owner').map(u => (
                              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: '#A89684', marginBottom: '4px' }}>Choose Date:</label>
                            <input
                              type="date"
                              className="brand-input"
                              style={{ fontSize: '0.72rem', padding: '6px' }}
                              value={bookingForm.date}
                              onChange={(e) => setBookingForm(prev => ({ ...prev, date: e.target.value }))}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.65rem', color: '#A89684', marginBottom: '4px' }}>Assign Room:</label>
                            <select
                              className="brand-input"
                              style={{ fontSize: '0.72rem', padding: '6px' }}
                              value={bookingForm.room}
                              onChange={(e) => setBookingForm(prev => ({ ...prev, room: e.target.value }))}
                            >
                              <option value="Treatment Room 1">Treatment Room 1</option>
                              <option value="Treatment Room 2">Treatment Room 2</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.65rem', color: '#A89684', marginBottom: '4px' }}>Available Slots:</label>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', maxHeight: '100px', overflowY: 'auto', padding: '4px', backgroundColor: '#0D0D0D', borderRadius: '6px' }}>
                            {['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(slot => {
                              const activeSvc = services.find(s => s.id === bookingForm.serviceId);
                              const conflict = checkScheduleConflict({
                                serviceId: bookingForm.serviceId,
                                staffId: bookingForm.staffId,
                                room: bookingForm.room,
                                date: bookingForm.date,
                                time: slot,
                                duration: activeSvc ? activeSvc.duration : 30
                              });
                              const isConflict = conflict.conflict;
                              const isSel = bookingForm.time === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={isConflict || !bookingForm.serviceId}
                                  onClick={() => setBookingForm(prev => ({ ...prev, time: slot }))}
                                  style={{
                                    border: isSel ? '1px solid #D4AF37' : '1px solid rgba(255,255,255,0.05)',
                                    backgroundColor: isSel ? 'rgba(212,175,55,0.2)' : isConflict ? 'rgba(239,68,68,0.05)' : 'rgba(52,211,153,0.1)',
                                    color: isConflict ? '#666' : isSel ? '#D4AF37' : '#34d399',
                                    fontSize: '0.58rem', padding: '4px 0', borderRadius: '4px', cursor: 'pointer'
                                  }}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <button type="submit" className="btn-brand-gold" style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '8px', marginTop: '6px' }}>
                          Confirm Booking & Pay <ShoppingBag style={{ width: '12px', height: '12px' }} />
                        </button>
                      </form>
                    )}

                  </div>
                )}

                {/* ACTIVE TAB: CONTACT US */}
                {activeScreen === 'contact' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                    <strong style={{ fontSize: '0.8rem', display: 'block', color: 'white', textAlign: 'center' }}>Contact Sculpt & Glow</strong>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                      
                      {/* WhatsApp Channel */}
                      <a
                        href="https://wa.me/27129982020"
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none',
                          backgroundColor: '#128C7E', color: 'white', padding: '12px', borderRadius: '10px',
                          fontFamily: 'Outfit', fontWeight: 'bold', fontSize: '0.78rem'
                        }}
                      >
                        <MessageSquare style={{ width: '18px', height: '18px' }} /> Contact via WhatsApp
                      </a>

                      {/* Email Channel */}
                      <a
                        href="mailto:info@sculptglow.co.za?subject=App%20Customer%20Enquiry"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none',
                          backgroundColor: 'hsl(var(--brand-purple))', color: 'white', padding: '12px', borderRadius: '10px',
                          fontFamily: 'Outfit', fontWeight: 'bold', fontSize: '0.78rem', border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <Mail style={{ width: '18px', height: '18px' }} /> Email Studio Desk
                      </a>

                      {/* Telephonic Hotline */}
                      <a
                        href="tel:+27129982020"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none',
                          backgroundColor: '#0D0D0D', color: '#D4AF37', padding: '12px', borderRadius: '10px',
                          fontFamily: 'Outfit', fontWeight: 'bold', fontSize: '0.78rem', border: '1px solid rgba(212,175,55,0.2)'
                        }}
                      >
                        <Phone style={{ width: '18px', height: '18px' }} /> Call Clinic Reception
                      </a>

                    </div>

                    <div className="card-premium" style={{ border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.7rem', color: '#BFA6D8', lineHeight: '1.4' }}>
                      <strong>Studio Hours:</strong>
                      <br />Weekdays: 08:00 - 18:00
                      <br />Saturdays: 09:00 - 14:00
                      <br />Sundays: Closed
                      <br /><br />
                      <strong>Physical Address:</strong>
                      <br />Shop 5, Glenwood Galleria, Garstfontein Rd, Pretoria East
                    </div>

                  </div>
                )}

              </div>

              {/* Smart iPhone Bottom Nav Tab Bar */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
                backgroundColor: '#1A1A1A', borderTop: '1px solid rgba(107, 44, 145, 0.25)',
                padding: '10px 0', zIndex: 10
              }}>
                {[
                  { id: 'profile', label: 'Loyalty', icon: Award },
                  { id: 'schedule', label: 'Bookings', icon: Calendar },
                  { id: 'progress', label: 'Scale', icon: Scale },
                  { id: 'shop', label: 'Shop', icon: ShoppingBag },
                  { id: 'contact', label: 'Contact', icon: Phone }
                ].map(tabItem => {
                  const TabIcon = tabItem.icon;
                  const isAct = activeScreen === tabItem.id;
                  return (
                    <button
                      key={tabItem.id}
                      onClick={() => setActiveScreen(tabItem.id)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                        color: isAct ? '#D4AF37' : '#A89684'
                      }}
                    >
                      <TabIcon style={{ width: '16px', height: '16px' }} />
                      <span style={{ fontSize: '0.55rem', fontWeight: 600 }}>{tabItem.label}</span>
                    </button>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* GLOW POINTS INFO OVERLAY MODAL */}
      {showGlowInfoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '300px', padding: '16px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 10px 0', fontSize: '1rem', textAlign: 'center' }}>How Glow Points Work</h3>
            <div style={{ fontSize: '0.72rem', color: 'white', lineHeight: '1.4', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>⭐ <strong>Earn Points:</strong> For every R100 spent in our studio on treatments or retail products, you automatically earn 1 Glow Point.</div>
              <div>⚡ <strong>Redeem Rewards:</strong> Cumulative points can be redeemed instantly for special treatments or studio vouchers on the main app dashboard tab.</div>
              <div>💎 <strong>VIP Status:</strong> Earning points upgrades your VIP status tier (Bronze, Silver, Gold, Platinum) giving you priority slots!</div>
            </div>
            <button onClick={() => setShowGlowInfoModal(false)} className="btn-brand-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', fontSize: '0.72rem', padding: '6px' }}>Close Info</button>
          </div>
        </div>
      )}

      {/* PRODUCT CART CHECKOUT PAYMENT OVERLAY MODAL */}
      {showCheckoutModal && (() => {
        // Calculate totals
        const cartItemsList = Object.keys(cart).map(pId => {
          const prod = products.find(p => p.id === pId);
          return {
            name: prod?.name || 'Product',
            price: prod?.price || 0,
            quantity: cart[pId]
          };
        }).filter(item => item.quantity > 0);
        const grossTotal = cartItemsList.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
            <div className="card-premium animate-fade-in" style={{ width: '320px', padding: '16px', maxHeight: '90%', overflowY: 'auto' }}>
              <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 12px 0', fontSize: '1rem' }}>Boutique Cart Checkout</h3>
              
              {/* Cart Items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', maxHeight: '100px', overflowY: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                {cartItemsList.map((item, i) => (
                  <div key={i} style={{ display: 'flex', justify: 'space-between', fontSize: '0.68rem', color: 'white' }}>
                    <span>{item.name} (x{item.quantity})</span>
                    <strong>R {(item.price * item.quantity).toFixed(2)}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justify: 'space-between', fontSize: '0.75rem', color: '#34d399', fontWeight: 'bold', marginBottom: '14px' }}>
                <span>Total Amount Due:</span>
                <span>R {grossTotal.toFixed(2)}</span>
              </div>

              {/* Billing Payment form */}
              <form onSubmit={handleProductPurchaseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Cardholder Name:</label>
                  <input type="text" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} required value={cardDetails.name} onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Alice Smith" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Card Number:</label>
                  <input type="text" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} required value={cardDetails.number} onChange={(e) => setCardDetails(prev => ({ ...prev, number: e.target.value }))} placeholder="4000 1234 5678 9010" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Expiry Date:</label>
                    <input type="text" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} required value={cardDetails.expiry} onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: e.target.value }))} placeholder="MM/YY" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>CVV:</label>
                    <input type="text" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} required value={cardDetails.cvv} onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value }))} placeholder="123" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowCheckoutModal(false)} className="btn-brand-purple" style={{ flex: 1, fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }}>Cancel</button>
                  <button type="submit" className="btn-brand-gold" style={{ flex: 1, fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }}>Submit Pay</button>
                </div>
              </form>

            </div>
          </div>
        );
      })()}

      {/* PERSONAL PROFILE SETTINGS MODAL */}
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '320px', padding: '16px', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 12px 0', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Personal Profile Settings</span>
              <button 
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', color: '#A89684', cursor: 'pointer', fontSize: '1.2rem', padding: 0 }}
              >
                &times;
              </button>
            </h3>
            
            <form onSubmit={(e) => {
              handleProfileUpdate(e);
              setShowProfileModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              
              {/* Photo upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', justifyContent: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img src={activeClientProfile?.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37' }} alt="Profile" />
                  <label style={{
                    position: 'absolute', bottom: '-2px', right: '-2px',
                    display: 'flex', alignItems: 'center', justify: 'center',
                    backgroundColor: '#1A1A1A', border: '1px solid #D4AF37', borderRadius: '50%',
                    width: '20px', height: '20px', cursor: 'pointer', color: '#BFA6D8'
                  }}>
                    <Camera style={{ width: '10px', height: '10px', color: '#D4AF37' }} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Full Name:</label>
                <input type="text" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} value={profileForm.name} onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Email:</label>
                <input type="email" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Cellphone Number:</label>
                <input type="text" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} value={profileForm.phone} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>App Password:</label>
                <input type="text" className="brand-input" style={{ fontSize: '0.7rem', padding: '6px' }} value={profileForm.password} onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '2px' }}>Delivery Address:</label>
                <textarea className="brand-input" rows={2} style={{ fontSize: '0.7rem', padding: '6px' }} value={profileForm.deliveryAddress} onChange={(e) => setProfileForm(prev => ({ ...prev, deliveryAddress: e.target.value }))} placeholder="Enter shipping address..." />
              </div>

              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowProfileModal(false)} className="btn-brand-purple" style={{ flex: 1, fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn-brand-gold" style={{ flex: 1, fontSize: '0.7rem', padding: '6px', justifyContent: 'center' }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
