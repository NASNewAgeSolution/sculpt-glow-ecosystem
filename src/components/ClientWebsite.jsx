import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Phone, MapPin, Search, CheckCircle, 
  AlertTriangle, Download, ArrowRight, MessageSquare, 
  Sparkles, Menu, X, Star, CreditCard, Shield,
  Award, Calendar, Scale, Info, Plus, Minus, Trash2, Camera, Lock, User, RefreshCw, Settings, LogOut
} from 'lucide-react';
import { 
  getTable, 
  addAppointment, 
  addInvoice, 
  addPaymentToInvoice, 
  logAction,
  redeemGlowPoints,
  addClientWeightLog,
  registerClientApp,
  loginClientApp,
  rescheduleAppointmentFromApp,
  cancelAppointmentFromApp,
  updateClientProfileFromApp,
  checkScheduleConflict
} from '../db/stateEngine';

const getServiceImage = (srvName) => {
  const name = srvName.toLowerCase();
  if (name.includes('treadmill') || name.includes('vacutherm')) {
    return 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600';
  }
  if (name.includes('roll') || name.includes('roller')) {
    return 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=600';
  }
  if (name.includes('cavitation') || name.includes('sculpting')) {
    return 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=600';
  }
  if (name.includes('freezing') || name.includes('cryo')) {
    return 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600';
  }
  if (name.includes('facial') || name.includes('corrective')) {
    return 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600';
  }
  if (name.includes('3-in-1') || name.includes('nails') || name.includes('hair') || name.includes('feet')) {
    return 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600';
  }
  return 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=600';
};

export default function ClientWebsite({ defaultTab = 'home' }) {
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    return tabParam || defaultTab;
  });
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // cart, billing, success
  const [billingDetails, setBillingDetails] = useState({ 
    name: 'Alice Smith', 
    phone: '+27 (82) 019-2834', 
    email: 'alice.smith@gmail.com', 
    shipping: '12 Glenwood Gardens, Pretoria East' 
  });

  const [websiteSelectedService, setWebsiteSelectedService] = useState(null);
  const [websiteBookingDate, setWebsiteBookingDate] = useState('2026-05-30');
  const [websiteBookingTime, setWebsiteBookingTime] = useState('09:00');
  const [showWebsiteBookingModal, setShowWebsiteBookingModal] = useState(false);
  const [resultsFilter, setResultsFilter] = useState('all'); // all, treadmill, cryo, peptides

  // Member Portal - Authentication States
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appCurrentClient, setAppCurrentClient] = useState(''); // Logged in client ID
  const [authMode, setAuthMode] = useState('login'); // login, register, forgot
  
  // Auth Form States
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter email, 2 = enter new password
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [resetClientId, setResetClientId] = useState('');

  // Roster & Appointments Table States
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  
  // Rescheduling & Cancellation States
  const [reschedulingAptId, setReschedulingAptId] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ 
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // default tomorrow
    time: '09:00' 
  });
  const [cancelingApt, setCancelingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelPolicyChecked, setCancelPolicyChecked] = useState(false);

  // Scale Log Progress States
  const [measurementForm, setMeasurementForm] = useState({ weight: '', waist: '', hips: '' });

  // Profile Form States
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '', password: '', deliveryAddress: '' });

  // Overlay Modals
  const [showGlowInfoModal, setShowGlowInfoModal] = useState(false);
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);

  // Fairy Dust Star Particle & Glitter checkout states
  const [glitters, setGlitters] = useState([]);
  const websiteRef = useRef(null);
  const canvasRef = useRef(null);

  const syncStorefront = () => {
    const clientsTable = getTable('clients') || [];
    setClients(clientsTable);
    setAppointments(getTable('appointments') || []);
    setServices(getTable('services') || []);
    setProducts(getTable('products') || []);
    setUsers(getTable('users') || []);
    setSettings(getTable('settings') || {});

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
    syncStorefront();
    const handleSync = () => syncStorefront();
    window.addEventListener('salon_db_sync', handleSync);

    return () => {
      window.removeEventListener('salon_db_sync', handleSync);
    };
  }, [appCurrentClient]);

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
        this.size = Math.random() * 6 + 3;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * -1.5 - 0.5;
        this.color = Math.random() > 0.5 ? '#D4AF37' : '#BFA6D8'; // gold or lilac
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.01;
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
  }, [activeTab]);

  // Casino Confetti blast payoff
  const triggerGlitterBomb = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const count = 150;
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
    logAction('E-Commerce Engine', 'Glitter Victory Bomb', 'Spawning checkout victory confetti explosion.');
    setTimeout(() => setGlitters([]), 1500);
  };

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
      setAuthPhone('');
      setAuthPassword('');
      alert(`Successfully logged in! Welcome back, ${res.client.name}.`);
      syncStorefront();
    } else {
      alert(`Login Error: ${res.error}`);
    }
  };

  const handleAppRegister = (e) => {
    e.preventDefault();
    if (!authName || !authPhone || !authEmail || !authPassword) {
      return alert('Please fill in all registration fields.');
    }
    const res = registerClientApp('Website Client Portal', authName, authEmail, authPhone, authPassword);
    if (res.success) {
      setAppCurrentClient(res.client.id);
      setIsLoggedIn(true);
      
      // Clear forms
      setAuthName('');
      setAuthPhone('');
      setAuthEmail('');
      setAuthPassword('');
      
      if (res.linked) {
        alert(`Linked Profile Detected!\n\nWelcome back, ${res.client.name}! We found your details in our clinic system and linked your past booking histories and Glow Points (${res.client.loyaltyPoints} points) to your profile.`);
      } else {
        alert(`Welcome to Sculpt & Glow, ${authName}! Your client account has been registered successfully.`);
      }
      syncStorefront();
    } else {
      alert(`Registration Error: ${res.error}`);
    }
  };

  const handleForgotPasswordRequest = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      return alert('Please enter your email address.');
    }
    const match = clients.find(c => c.email?.toLowerCase().trim() === forgotEmail.toLowerCase().trim());
    if (!match) {
      return alert(`Error: No registered client account found with email "${forgotEmail}".`);
    }
    
    alert(`Reset Link Dispatched!\n\nA secure password reset request has been sent to ${forgotEmail}.\n\nFor simulation convenience, you can now enter your new password below.`);
    setResetClientId(match.id);
    setForgotStep(2);
  };

  const handleForgotPasswordReset = (e) => {
    e.preventDefault();
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      return alert('Password must be at least 4 characters long.');
    }
    
    const match = clients.find(c => c.id === resetClientId);
    if (match) {
      const updatedProfile = { ...match, password: forgotNewPassword };
      const res = updateClientProfileFromApp('Website Client Portal', resetClientId, updatedProfile);
      if (res) {
        alert('Success! Your password has been reset successfully. Please login with your cellphone number and new password.');
        logAction('Website Client Portal', 'Password Reset via Email', `Client ${match.name} reset password via email verification`);
        
        setAuthMode('login');
        setForgotStep(1);
        setForgotEmail('');
        setForgotNewPassword('');
        setResetClientId('');
        syncStorefront();
      } else {
        alert('Error resetting password.');
      }
    }
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (!profileForm.name || !profileForm.email || !profileForm.phone) {
      return alert('Profile name, email, and phone are required.');
    }
    const res = updateClientProfileFromApp('Website Client Portal', appCurrentClient, profileForm);
    if (res) {
      alert('Your profile details have been successfully updated in the salon CRM.');
      syncStorefront();
      setShowProfileEditModal(false);
    } else {
      alert('Error saving profile changes.');
    }
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Str = reader.result;
        updateClientProfileFromApp('Website Client Portal', appCurrentClient, {
          profilePhoto: base64Str
        });
        syncStorefront();
        alert('Profile picture uploaded successfully!');
      };
      reader.readAsDataURL(file);
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
        text: `Strict Policy Warning: Canceling within ${policyMinDays} days of the appointment forfeits ${policyMinForfeit}% of the payment. You will lose the full payment amount.`,
        severity: 'strict'
      };
    } else if (diffDays <= policyMaxDays) {
      return {
        forfeitPercent: policyMaxForfeit,
        text: `Moderate Policy Warning: Canceling within ${policyMaxDays} days of the appointment forfeits ${policyMaxForfeit}% of the payment. You will lose 50% of the payment amount.`,
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

    const res = cancelAppointmentFromApp('Website Client Portal', cancelingApt.id, cancelReason);
    if (res.success) {
      alert('Your appointment has been successfully cancelled and references updated.');
      setCancelingApt(null);
      setCancelReason('');
      setCancelPolicyChecked(false);
      syncStorefront();
    } else {
      alert(`Error canceling booking: ${res.error}`);
    }
  };

  const handleRescheduleSubmit = (e) => {
    e.preventDefault();
    const res = rescheduleAppointmentFromApp('Website Client Portal', reschedulingAptId, rescheduleForm.date, rescheduleForm.time);
    if (res.success) {
      alert('Rescheduled request submitted! Your booking date has been updated and is awaiting admin check.');
      setReschedulingAptId(null);
      syncStorefront();
    } else {
      alert(`Scheduling Conflict:\n\n${res.error}`);
    }
  };

  const handleAppSubmitMeasurements = (e) => {
    e.preventDefault();
    if (!measurementForm.weight) return alert('Please enter your weight.');
    
    addClientWeightLog('Website Client Portal', appCurrentClient, {
      weight: Number(measurementForm.weight),
      waist: Number(measurementForm.waist) || 0,
      hips: Number(measurementForm.hips) || 0
    });
    
    setMeasurementForm({ weight: '', waist: '', hips: '' });
    syncStorefront();
    alert('Progress metrics logged successfully!');
  };

  const handleRedeemPoints = (points, rewardName) => {
    const client = clients.find(c => c.id === appCurrentClient);
    if (!client || (client.loyaltyPoints || 0) < points) {
      return alert('Inadequate Glow Points balance to claim this reward.');
    }
    
    const res = redeemGlowPoints('Website Client Portal', appCurrentClient, points, rewardName);
    if (res.success) {
      alert(`Successfully redeemed reward voucher: "${rewardName}"!\nA unique voucher code has been added to your vouchers ledger in settings.`);
      syncStorefront();
    } else {
      alert(`Redemption Error: ${res.error}`);
    }
  };

  // Custom Inline SVG weight progress graph renderer
  const renderScaleLogsGraph = (activeClientProfile) => {
    const logs = activeClientProfile?.weightLogs || [];
    if (logs.length < 2) {
      return (
        <div style={{
          height: '140px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#BFA6D8', fontSize: '0.8rem', border: '1px dashed rgba(107, 44, 145, 0.3)'
        }}>
          Need at least 2 logged weight records to display progress trend graph.
        </div>
      );
    }

    const weights = logs.map(l => Number(l.weight));
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const diffW = maxW - minW || 1;

    // SVG parameters
    const width = 500;
    const height = 180;
    const padding = 25;
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
      <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.25)', flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#D4AF37', marginBottom: '12px', fontWeight: 600 }}>
          <span>Scale Weight Progress (Trend Line)</span>
          <span style={{ color: '#34d399' }}>Net Change: {(weights[weights.length - 1] - weights[0]).toFixed(1)} kg</span>
        </div>
        
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + graphHeight/2} x2={width - padding} y2={padding + graphHeight/2} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1={padding} y1={padding + graphHeight} x2={width - padding} y2={padding + graphHeight} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px rgba(212,175,55,0.4))' }} />

          {/* Dots & Labels */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill="#6B2C91" stroke="#D4AF37" strokeWidth="2" />
              {/* Tooltip text */}
              <text x={p.x} y={p.y - 10} fill="white" fontSize="9px" fontWeight="bold" textAnchor="middle">
                {p.weight}kg
              </text>
              <text x={p.x} y={height - 5} fill="#BFA6D8" fontSize="8px" textAnchor="middle">
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // E-commerce handlers
  const handleWebsiteBookService = (srv) => {
    setWebsiteSelectedService(srv);
    setShowWebsiteBookingModal(true);
  };

  const handleConfirmWebsiteBooking = () => {
    if (!websiteSelectedService) return;
    
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
    setActiveTab('cart');
    setCheckoutStep('cart');
    logAction('Customer Portal', 'Cart Add', `Added ${websiteSelectedService.name} schedule for ${websiteBookingDate} to cart.`);
  };

  const handleAddProductToCart = (prod) => {
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
    setActiveTab('cart');
    setCheckoutStep('cart');
    logAction('Customer Portal', 'Cart Add', `Added ${prod.name} retail product to cart.`);
  };

  const handleCartCheckoutSubmit = () => {
    if (cart.length === 0) return;

    const subtotal = Number((cart.reduce((acc, c) => acc + c.price, 0) / 1.15).toFixed(2));
    const total = cart.reduce((acc, c) => acc + c.price, 0);
    const tax = Number((total - subtotal).toFixed(2));

    const invoice = addInvoice('Online Customer Storefront', {
      clientId: 'cli-101', // Alice Smith default
      items: cart.map(c => ({ name: c.name, price: c.price, quantity: c.quantity })),
      subtotal,
      tax,
      discount: 0,
      total,
      status: 'Paid'
    });

    addPaymentToInvoice('Payment Gateway', invoice.id, { amount: total, method: 'Card' });

    cart.forEach(c => {
      if (c.type === 'Service' && c.bookingDetails) {
        addAppointment('Customer Online Portal', {
          clientId: 'cli-101',
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
  };

  const handleRemoveCartItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div ref={websiteRef} style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D', color: '#F5EFE6',
      position: 'relative', overflowX: 'hidden', fontFamily: "'Montserrat', sans-serif"
    }}>
      {/* GOOGLE FONTS & CUSTOM MARQUEE CSS INJECTION */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&family=Montserrat:wght@200;300;400;500;600;700&display=swap');
        
        .font-luxury-serif {
          font-family: 'Cormorant Garamond', serif !important;
          text-transform: uppercase;
          letter-spacing: 3px;
        }
        
        .font-luxury-sans {
          font-family: 'Montserrat', sans-serif !important;
        }

        .luxury-hero-title {
          font-family: 'Cormorant Garamond', serif !important;
          text-transform: uppercase;
          letter-spacing: 6px;
          color: #D4AF37;
          text-shadow: 0px 4px 20px rgba(0, 0, 0, 0.9);
          line-height: 1.1;
        }

        /* Marquee Continuous Loop */
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        
        .marquee-container {
          background: #070707;
          padding: 35px 0;
          border-top: 1px solid rgba(107, 44, 145, 0.25);
          border-bottom: 1px solid rgba(107, 44, 145, 0.25);
          overflow: hidden;
          position: relative;
        }
        
        .marquee-track {
          display: flex;
          width: max-content;
          animation: marqueeScroll 35s linear infinite;
        }
        
        .marquee-slide {
          width: 320px;
          height: 200px;
          margin: 0 15px;
          position: relative;
          flex-shrink: 0;
          border: 1px solid rgba(212, 175, 55, 0.25);
          overflow: hidden;
          border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }
        
        .marquee-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          opacity: 0.65;
          transition: all 0.6s ease;
        }
        
        .marquee-slide:hover img {
          opacity: 0.95;
          transform: scale(1.1);
        }
        
        .marquee-overlay {
          position: absolute;
          bottom: 0;
          padding: 12px;
          background: linear-gradient(transparent, rgba(13, 13, 13, 0.95));
          width: 100%;
          font-size: 10px;
          color: #D4AF37;
          text-align: center;
          letter-spacing: 2px;
          font-weight: 600;
        }

        /* Luxury Gold Buttons */
        .btn-luxury-gold {
          background: transparent;
          color: #D4AF37;
          border: 1px solid #D4AF37;
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 0.75rem;
          padding: 15px 35px;
          cursor: pointer;
          transition: all 0.4s ease;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .btn-luxury-gold:hover {
          background: #6B2C91;
          color: #FFF;
          border-color: #6B2C91;
          box-shadow: 0 0 25px rgba(107, 44, 145, 0.6);
          transform: translateY(-2px);
        }

        .btn-luxury-purple {
          background: #6B2C91;
          color: #FFF;
          border: 1px solid rgba(107, 44, 145, 0.5);
          font-family: 'Montserrat', sans-serif;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-size: 0.72rem;
          padding: 14px 30px;
          cursor: pointer;
          transition: all 0.4s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-luxury-purple:hover {
          background: transparent;
          color: #D4AF37;
          border-color: #D4AF37;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.2);
          transform: translateY(-1px);
        }

        /* Luxury Cards */
        .luxury-card {
          background: #111111;
          border: 1px solid rgba(212, 175, 55, 0.12);
          border-radius: 16px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          position: relative;
        }

        .luxury-card:hover {
          border-color: #6B2C91;
          box-shadow: 0 15px 35px rgba(107, 44, 145, 0.15);
          transform: translateY(-5px);
        }

        /* Glass Input Fields */
        .luxury-input {
          background: #111 !important;
          border: 1px solid rgba(107, 44, 145, 0.4) !important;
          color: #F5EFE6 !important;
          font-family: 'Montserrat', sans-serif !important;
          font-size: 0.82rem !important;
          padding: 14px 18px !important;
          border-radius: 8px !important;
          transition: all 0.3s ease !important;
        }

        .luxury-input:focus {
          outline: none !important;
          border-color: #D4AF37 !important;
          box-shadow: 0 0 15px rgba(212, 175, 55, 0.25) !important;
        }

        .fairy-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 999;
        }

        .nav-link-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        .nav-link-btn:hover {
          background-color: #6B2C91 !important;
          color: #FFFFFF !important;
          box-shadow: 0 0 15px rgba(107, 44, 145, 0.5);
        }

        .social-hover-btn {
          transition: all 0.3s ease;
        }
        .social-hover-btn:hover {
          background-color: #6B2C91 !important;
          border-color: #6B2C91 !important;
          color: white !important;
          box-shadow: 0 0 15px rgba(107, 44, 145, 0.6) !important;
          transform: translateY(-2px);
        }
      `}</style>

      <canvas ref={canvasRef} className="fairy-canvas" />

      {/* TOP FLOATING BLENDED HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 6%', backgroundColor: 'rgba(13, 13, 13, 0.9)', backdropFilter: 'blur(10px)',
        zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', boxSizing: 'border-box',
        borderBottom: '1px solid rgba(107, 44, 145, 0.15)'
      }}>
        {/* Beautiful Floating Custom Circular Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
          <div style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            backgroundImage: "url('/logo.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '2px solid #D4AF37',
            filter: 'drop-shadow(0 0 15px rgba(107, 44, 145, 0.65))',
            overflow: 'hidden'
          }} />
          <div style={{ display: 'none' }}>
            <h2 className="font-luxury-serif" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, color: 'white' }}>SCULPT & GLOW</h2>
            <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4AF37' }}>Wellness Studio</span>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '20px', fontSize: '0.68rem', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 600 }}>
          {[
            { id: 'home', label: 'Home' },
            { id: 'services', label: 'Treatments' },
            { id: 'results', label: 'Results Showcase' },
            { id: 'products', label: 'Boutique' },
            { id: 'about', label: 'Philosophy' },
            { id: 'contact', label: 'Contact Us' },
            { id: 'portal', label: 'Member Portal' }
          ].map(menuItem => (
            <button
              key={menuItem.id}
              onClick={() => setActiveTab(menuItem.id)}
              className="nav-link-btn"
              style={{
                color: activeTab === menuItem.id ? '#D4AF37' : '#F5EFE6',
                fontWeight: 700,
                textShadow: '2px 2px 8px rgba(0,0,0,0.85)',
                fontSize: 'inherit', letterSpacing: 'inherit'
              }}
            >
              {menuItem.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setActiveTab('cart')}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', color: '#D4AF37', 
            position: 'relative', filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.8))'
          }}
        >
          <ShoppingCart style={{ width: '22px', height: '22px' }} />
          {cart.length > 0 && (
            <span style={{ 
              position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#6B2C91', 
              color: 'white', fontSize: '0.6rem', width: '15px', height: '15px', 
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 700, border: '1px solid #D4AF37'
            }}>
              {cart.length}
            </span>
          )}
        </button>
      </header>

      {/* CORE ROUTING SECTION */}
      <main style={{ boxSizing: 'border-box', minHeight: '85vh', paddingTop: '100px' }}>
        
        {/* SUBTAB: HOME PAGE */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            
            {/* Immersive 100vh Luxury Cover Hero Block */}
            <div style={{
              position: 'relative', height: '92vh',
              backgroundImage: "linear-gradient(rgba(13, 13, 13, 0.25), rgba(13, 13, 13, 0.95)), url('/cover.jpg')",
              backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex',
              backgroundAttachment: 'fixed',
              flexDirection: 'column', justifyContent: 'center', alignItems: 'center', 
              textAlign: 'center', padding: '0 20px', boxSizing: 'border-box'
            }}>
              <span className="psych-badge" style={{ 
                fontSize: '0.78rem', marginBottom: '24px',
                border: '1px solid rgba(212,175,55,0.4)', backgroundColor: 'rgba(46,13,61,0.4)', color: '#D4AF37'
              }}>
                🔥 Concierge Alert: Only 3 Treatment Slots Remain for Today!
              </span>
              
              <h1 className="luxury-hero-title" style={{ fontSize: 'clamp(2.4rem, 6.5vw, 5.5rem)', margin: '0 0 15px 0' }}>
                Three Treatments.<br />One Appointment.
              </h1>
              
              <p className="font-luxury-serif" style={{ color: '#F5EFE6', fontStyle: 'italic', fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', letterSpacing: '2.5px', margin: 0 }}>
                All at the same time. Experience the wellness ecosystem.
              </p>
              
              <div style={{ marginTop: '45px' }}>
                <button className="btn-luxury-gold" onClick={() => setActiveTab('services')}>
                  Reserve My Transformation <ArrowRight style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            </div>

            {/* Continuous Ad Slider Horizontal Carousel Marquee */}
            <div className="marquee-container">
              <div className="marquee-track">
                {/* Visual Billboard Slides */}
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400" alt="facial" />
                  <div className="marquee-overlay">SIGNATURE 24K GOLD FACIALS</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400" alt="3in1" />
                  <div className="marquee-overlay">THE 3-IN-1 NAILS & HAIR</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400" alt="contouring" />
                  <div className="marquee-overlay">CAVITATION BODY SCULPTING</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=400" alt="lymphatic" />
                  <div className="marquee-overlay">LYMPHATIC DRAINAGE MASSAGE</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=400" alt="detox" />
                  <div className="marquee-overlay">DETOX & RECOVERY CELLULITE</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&q=80&w=400" alt="cryo" />
                  <div className="marquee-overlay">CRYO 360 FAT FREEZING</div>
                </div>

                {/* Duplicated track for endless loop scroll */}
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400" alt="facial" />
                  <div className="marquee-overlay">SIGNATURE 24K GOLD FACIALS</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?auto=format&fit=crop&q=80&w=400" alt="3in1" />
                  <div className="marquee-overlay">THE 3-IN-1 NAILS & HAIR</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&q=80&w=400" alt="contouring" />
                  <div className="marquee-overlay">CAVITATION BODY SCULPTING</div>
                </div>
                <div className="marquee-slide">
                  <img src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&q=80&w=400" alt="lymphatic" />
                  <div className="marquee-overlay">LYMPHATIC DRAINAGE MASSAGE</div>
                </div>
              </div>
            </div>

            {/* Premium Gold Feature Cards */}
            <div style={{ padding: '100px 8%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', background: '#090909' }}>
              
              <div className="luxury-card" style={{ padding: '36px' }}>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D4AF37', borderRadius: '50%', marginBottom: '24px', color: '#D4AF37' }}>
                  <Star style={{ width: '18px', height: '18px' }} />
                </div>
                <h3 className="font-luxury-serif" style={{ fontSize: '1.25rem', color: '#D4AF37', margin: '0 0 12px 0' }}>Bespoke Wellness Ecosystem</h3>
                <p style={{ fontSize: '0.85rem', color: '#A89684', lineHeight: '1.7', margin: 0 }}>
                  More than a beauty salon, Sculpt & Glow is a premium health sanctuary. Our methods combine advanced biological tissue drainage rolls with state-of-the-art infrared vacuum heat.
                </p>
              </div>

              <div className="luxury-card" style={{ padding: '36px' }}>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D4AF37', borderRadius: '50%', marginBottom: '24px', color: '#D4AF37' }}>
                  <CreditCard style={{ width: '18px', height: '18px' }} />
                </div>
                <h3 className="font-luxury-serif" style={{ fontSize: '1.25rem', color: '#D4AF37', margin: '0 0 12px 0' }}>Loyalty Glow Point Club</h3>
                <p style={{ fontSize: '0.85rem', color: '#A89684', lineHeight: '1.7', margin: 0 }}>
                  Earn loyalty Glow points automatically for every R100 spent. Track balances live via your branded smartphone companion app and unlock VIP rewards.
                </p>
              </div>

              <div className="luxury-card" style={{ padding: '36px' }}>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #D4AF37', borderRadius: '50%', marginBottom: '24px', color: '#D4AF37' }}>
                  <Shield style={{ width: '18px', height: '18px' }} />
                </div>
                <h3 className="font-luxury-serif" style={{ fontSize: '1.25rem', color: '#D4AF37', margin: '0 0 12px 0' }}>Clinical Grade Artistry</h3>
                <p style={{ fontSize: '0.85rem', color: '#A89684', lineHeight: '1.7', margin: 0 }}>
                  Every formula is dermatologically approved. We source corrective peptide-matrix solutions directly from leading laboratories in Seoul, Korea, for high-impact glass skin.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* SUBTAB: SERVICES MENU */}
        {activeTab === 'services' && (
          <div style={{ padding: '160px 8% 80px 8%', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>bespoke offerings</span>
              <h2 className="font-luxury-serif" style={{ fontSize: '2.5rem', color: 'white', margin: '8px 0 0 0' }}>Ecosystem Clinical Menu</h2>
              <div style={{ width: '60px', height: '1px', backgroundColor: '#D4AF37', margin: '18px auto 0 auto' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '30px' }}>
              {services.map(srv => (
                <div 
                  key={srv.id} 
                  className="luxury-card" 
                  style={{ 
                    padding: '36px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justify: 'space-between', 
                    gap: '20px',
                    backgroundImage: `linear-gradient(rgba(17, 17, 17, 0.8), rgba(17, 17, 17, 0.95)), url(${getServiceImage(srv.name)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: '280px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge-brand purple" style={{ fontSize: '0.6rem' }}>{srv.category}</span>
                      <strong className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '1.25rem' }}>R {srv.price.toFixed(2)}</strong>
                    </div>
                    <h3 className="font-luxury-serif" style={{ color: 'white', margin: '14px 0 8px 0', fontSize: '1.2rem', letterSpacing: '2px' }}>{srv.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: '#F5EFE6', lineHeight: '1.5', margin: 0, textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{srv.description}</p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(107, 44, 145, 0.15)', paddingTop: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#A89684', fontWeight: 500 }}>⌛ Session: {srv.duration} Mins</span>
                    <button
                      onClick={() => handleWebsiteBookService(srv)}
                      className="btn-luxury-gold"
                      style={{ padding: '10px 20px', fontSize: '0.68rem', letterSpacing: '1px' }}
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: PRODUCTS PHARMACY */}
        {activeTab === 'products' && (
          <div style={{ padding: '160px 8% 80px 8%', display: 'flex', flexDirection: 'column', gap: '48px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>atelier shop</span>
              <h2 className="font-luxury-serif" style={{ fontSize: '2.5rem', color: 'white', margin: '8px 0 0 0' }}>Boutique Collections</h2>
              <div style={{ width: '60px', height: '1px', backgroundColor: '#D4AF37', margin: '18px auto 0 auto' }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
              {products.map(prod => (
                <div key={prod.id} className="luxury-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ overflow: 'hidden', height: '220px', position: 'relative' }}>
                    <img src={prod.image} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.6s' }} className="prod-img" alt={prod.name} />
                    <div style={{ position: 'absolute', top: '16px', right: '16px' }}>
                      <span className={`badge-brand ${prod.stock <= 0 ? 'cancelled' : 'gold'}`} style={{ fontSize: '0.58rem' }}>
                        {prod.stock <= 0 ? 'Sold Out' : `Only ${prod.stock} Left`}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#BFA6D8' }}>{prod.category}</span>
                      <h3 className="font-luxury-serif" style={{ fontSize: '1rem', color: 'white', margin: '6px 0 0 0', letterSpacing: '1.5px' }}>{prod.name}</h3>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: '#A89684', margin: 0, lineHeight: '1.4' }}>{prod.description}</p>
                    
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <strong className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '1.2rem' }}>R {prod.price.toFixed(2)}</strong>
                    </div>

                    <button
                      onClick={() => handleAddProductToCart(prod)}
                      disabled={prod.stock <= 0}
                      className="btn-luxury-gold"
                      style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
                    >
                      Purchase Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: Philosophy */}
        {activeTab === 'about' && (
          <div style={{ padding: '160px 8% 80px 8%', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <span style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>studio history</span>
            <h2 className="font-luxury-serif" style={{ fontSize: '2.5rem', color: 'white', margin: 0 }}>Ecosystem & Philosophy</h2>
            
            <blockquote style={{
              borderLeft: '2px solid #D4AF37', paddingLeft: '24px', fontStyle: 'italic',
              fontSize: '1.25rem', color: '#BFA6D8', margin: '20px 0', lineHeight: '1.6',
              fontFamily: "'Cormorant Garamond', serif"
            }}>
              "Sculpt & Glow is a dedicated body shaping and wellness studio combining infrared-assisted cardio, lymphatic rollers, body contouring, and advanced skin wellness treatments designed to help women feel stronger, lighter, sculpted, and confident in their bodies."
            </blockquote>

            <p style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#F5EFE6' }}>
              We believe in a holistic, biological approach to wellness. We don't just sell standard salon services—we map advanced vacuum treadmills, targeted cold-lipolysis fat freezing, and custom corrective peptide peeling direct from Seoul, Korea, to generate real physiological tissue results. Settle your booking online and claim your Gold loyalty progression!
            </p>
          </div>
        )}

        {/* SUBTAB: Results Showcase */}
        {activeTab === 'results' && (
          <div style={{ padding: '160px 8% 80px 8%', display: 'flex', flexDirection: 'column', gap: '40px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>verified scientific outcomes</span>
              <h2 className="font-luxury-serif" style={{ fontSize: '2.8rem', color: 'white', margin: 0, textShadow: '0 0 15px rgba(212,175,55,0.2)' }}>Before & After Transformations</h2>
              <p style={{ color: '#BFA6D8', maxWidth: '650px', margin: '0 auto', fontSize: '0.9rem', lineHeight: '1.6' }}>
                Explore physiological and aesthetic transformations recorded at Sculpt & Glow. Each result maps directly to our advanced machinery or boutique formulations to showcase real outcomes.
              </p>
            </div>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: '✨ All Results' },
                { id: 'treadmill', label: '🔥 Vacutherm Treadmill' },
                { id: 'cryo', label: '❄️ Cryo Fat Freezing' },
                { id: 'peptides', label: '🧬 Seoul Peptides' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setResultsFilter(btn.id)}
                  style={{
                    backgroundColor: resultsFilter === btn.id ? 'hsl(var(--brand-purple))' : 'rgba(107, 44, 145, 0.1)',
                    border: resultsFilter === btn.id ? '1px solid #D4AF37' : '1px solid rgba(107, 44, 145, 0.3)',
                    borderRadius: '20px', color: 'white', padding: '8px 20px', fontSize: '0.75rem', fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.3s'
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Results Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
              {[
                {
                  id: 'res-1',
                  category: 'treadmill',
                  title: 'Calories Burned: Vacutherm vs Standard Gym',
                  serviceId: 'srv-1', // Vacutherm Treadmill
                  productName: null,
                  summary: 'Alice\'s active energy expenditure and cardiovascular response monitored during standard outdoor jogging versus our Vacutherm Treadmill chamber.',
                  metricsBefore: { label: 'Standard Gym Workout', val: '320 kcal', percentage: 33, color: '#A89684' },
                  metricsAfter: { label: 'Vacutherm Treadmill (30m)', val: '950 kcal', percentage: 100, color: '#D4AF37' },
                  details: 'Chamber vacuum activation increases heart-rate response by 22% while targeting lower body fat stores directly with concentrated infrared thermogenesis.'
                },
                {
                  id: 'res-2',
                  category: 'cryo',
                  title: '4-Week Abdominal Fat Freezing Contour',
                  serviceId: 'srv-6', // Cryolipo Fat Freezing
                  productName: null,
                  summary: 'Physiological contour changes measured 28 days post-session of Cryolipo Fat Freezing. Program targeting stubborn abdominal fat deposits.',
                  metricsBefore: { label: 'Before Treatment', val: 'Starting Baseline', percentage: 100, color: '#A89684' },
                  metricsAfter: { label: 'After Cryo Session (28 Days)', val: '-2.8 cm Circumference', percentage: 40, color: '#34d399' },
                  details: 'Standard diet and cardio reached local plateau. Controlled cold exposure triggered localized apoptosis of subcutaneous fat cells, showing permanent reduction.'
                },
                {
                  id: 'res-3',
                  category: 'peptides',
                  title: '8-Week Face Micro-Wrinkle Texture Recovery',
                  serviceId: null,
                  productId: 'prd-3', // Korean Corrective Peptide Serum
                  productName: 'Korean Corrective Peptide Serum',
                  summary: 'Quantitative facial skin glass texture metrics and deep moisture retention values following daily use of our Seoul Corrective Peptide Matrix.',
                  metricsBefore: { label: 'Standard Facial Moisturizer', val: '+5% Elasticity Boost', percentage: 12, color: '#A89684' },
                  metricsAfter: { label: 'Seoul Corrective Peptide (8 wks)', val: '+40% Elasticity Boost', percentage: 95, color: '#D4AF37' },
                  details: 'Micro-wrinkles smoothed by 34%. Centella and green tea micro-liposomes targeted deeper dermal structures to synthesize natural bioactive collagen blocks.'
                }
              ]
                .filter(res => resultsFilter === 'all' || res.category === resultsFilter)
                .map(res => {
                  const linkedService = services.find(s => s.id === res.serviceId);
                  const linkedProduct = products.find(p => p.id === res.productId);

                  return (
                    <div
                      key={res.id}
                      className="panel-premium"
                      style={{
                        padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px',
                        background: 'rgba(26, 26, 26, 0.95)', border: '1px solid rgba(107, 44, 145, 0.3)',
                        borderRadius: '20px'
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 700 }}>
                          Category: {res.category.toUpperCase()}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', color: 'white', margin: '6px 0 10px 0', fontFamily: 'Outfit' }}>{res.title}</h3>
                        <p style={{ color: '#BFA6D8', fontSize: '0.82rem', lineHeight: '1.5', margin: 0 }}>{res.summary}</p>
                      </div>

                      {/* Before / After Slider/Comparison Simulation */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', backgroundColor: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px' }}>
                        {/* Before */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                            <span style={{ color: '#A89684' }}>{res.metricsBefore.label}</span>
                            <span style={{ fontWeight: 'bold', color: '#A89684' }}>{res.metricsBefore.val}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ width: `${res.metricsBefore.percentage}%`, height: '100%', backgroundColor: res.metricsBefore.color, borderRadius: '4px' }} />
                          </div>
                        </div>

                        {/* After */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                            <span style={{ color: '#D4AF37' }}>{res.metricsAfter.label}</span>
                            <span style={{ fontWeight: 'bold', color: '#34d399' }}>{res.metricsAfter.val}</span>
                          </div>
                          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${res.metricsAfter.percentage}%`, height: '100%',
                              backgroundColor: res.metricsAfter.color, borderRadius: '4px',
                              boxShadow: `0 0 10px ${res.metricsAfter.color}`
                            }} />
                          </div>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#F5EFE6', lineHeight: '1.5', fontStyle: 'italic', borderTop: '1px solid rgba(107, 44, 145, 0.2)', paddingTop: '10px' }}>
                        🔬 <strong>Clinical Analysis:</strong> {res.details}
                      </div>

                      {/* Call-to-action checkout integrations */}
                      <div style={{ marginTop: 'auto', paddingTop: '10px' }}>
                        {res.serviceId && linkedService && (
                          <button
                            onClick={() => {
                              setWebsiteSelectedService(linkedService);
                              setWebsiteBookingDate(new Date().toISOString().split('T')[0]);
                              setShowWebsiteBookingModal(true);
                            }}
                            className="btn-brand-gold"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '10px' }}
                          >
                            📅 Reserve "{linkedService.name}"
                          </button>
                        )}

                        {res.productId && linkedProduct && (
                          <button
                            onClick={() => handleAddProductToCart(linkedProduct)}
                            className="btn-brand-gold"
                            style={{ width: '100%', justifyContent: 'center', fontSize: '0.78rem', padding: '10px' }}
                          >
                            🛍️ Purchase "{linkedProduct.name}"
                          </button>
                        )}

                        {/* Fallback if product/service was deleted or not loaded yet */}
                        {(!linkedService && !linkedProduct) && (
                          <div style={{ color: '#A89684', fontSize: '0.72rem', fontStyle: 'italic', textAlign: 'center' }}>
                            🔗 Linked offer available in our Treatments/Boutique catalog
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* SUBTAB: CONTACT DETAILS (CONCIERGE) */}
        {activeTab === 'contact' && (
          <div style={{ padding: '160px 8% 80px 8%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '50px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>concierge bureau</span>
                <h2 className="font-luxury-serif" style={{ fontSize: '2.5rem', color: 'white', margin: '6px 0 0 0' }}>Pretoria East</h2>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', fontSize: '0.85rem', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                  <MapPin style={{ color: '#D4AF37', width: '20px', height: '20px', flexShrink: 0, marginTop: '2px' }} />
                  <span>Shop 5, Glenwood Galleria, Garstfontein Rd, Pretoria East</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <Phone style={{ color: '#D4AF37', width: '20px', height: '20px', flexShrink: 0 }} />
                  <span>+27 (12) 998-2020</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '8px' }}>
                <a 
                  href="https://www.instagram.com/sculptglow.pta" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(107, 44, 145, 0.2)',
                    border: '1px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#D4AF37', transition: 'all 0.3s ease', boxShadow: '0 0 10px rgba(107, 44, 145, 0.3)'
                  }}
                  className="social-hover-btn"
                >
                  <svg style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a 
                  href="https://www.facebook.com/share/1CZEEXWAqv/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(107, 44, 145, 0.2)',
                    border: '1px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#D4AF37', transition: 'all 0.3s ease', boxShadow: '0 0 10px rgba(107, 44, 145, 0.3)'
                  }}
                  className="social-hover-btn"
                >
                  <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.tiktok.com/@sculptglow.pta" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(107, 44, 145, 0.2)',
                    border: '1px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#D4AF37', transition: 'all 0.3s ease', boxShadow: '0 0 10px rgba(107, 44, 145, 0.3)'
                  }}
                  className="social-hover-btn"
                >
                  <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.14 2.27 1.94 3.71 2.24v3.83c-1.39-.1-2.74-.63-3.87-1.48-.7-.52-1.28-1.19-1.72-1.95v7.26c.03 1.94-.48 3.88-1.5 5.5-1.57 2.49-4.32 4.09-7.31 4.07-2.91.07-5.74-1.36-7.39-3.77-1.78-2.5-2.07-5.94-.78-8.73C2.4 8.78 5.16 6.84 8.24 6.78c.07 1.34.03 2.68.04 4.02-1.43-.02-2.92.51-3.89 1.59-.99 1.05-1.37 2.6-1.02 4.01.35 1.5 1.51 2.76 2.97 3.19 1.48.47 3.18.1 4.31-.9 1.15-1.01 1.63-2.61 1.57-4.14V.02z"/>
                  </svg>
                </a>
              </div>

              <button
                onClick={() => window.open('https://wa.me/27129982020', '_blank')}
                className="btn-luxury-gold"
                style={{ alignSelf: 'flex-start' }}
              >
                <MessageSquare style={{ width: '16px', height: '16px' }} /> Chat on WhatsApp
              </button>
            </div>

            <div className="luxury-card" style={{ padding: '40px' }}>
              <h3 className="font-luxury-serif" style={{ color: 'white', marginBottom: '24px', fontSize: '1.25rem', letterSpacing: '2px' }}>Concierge Desk Inquiry</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="text" placeholder="Full Name" className="luxury-input" />
                <input type="email" placeholder="Email Address" className="luxury-input" />
                <textarea placeholder="Tell us about your wellness goals..." className="luxury-input" rows={3} />
                <button onClick={() => alert('Query captured successfully!')} className="btn-luxury-gold" style={{ width: '100%', justifyContent: 'center' }}>Submit Query</button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: INTEGRATED CLIENT MEMBER PORTAL */}
        {activeTab === 'portal' && (
          <div style={{ 
            padding: '140px 6% 80px 6%', 
            background: 'linear-gradient(to bottom, #0E0712 0%, #0A0A0A 100%)',
            minHeight: '80vh',
            boxSizing: 'border-box'
          }}>
            
            {/* LOGGED OUT PORTAL: Authentication Screen */}
            {!isLoggedIn ? (
              <div className="animate-fade-in" style={{ maxWidth: '500px', margin: '40px auto 0 auto' }}>
                
                {/* Mode Selectors */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(212, 175, 55, 0.15)', marginBottom: '30px' }}>
                  <button 
                    onClick={() => { setAuthMode('login'); setForgotStep(1); }}
                    style={{ 
                      flex: 1, background: 'none', border: 'none', padding: '14px', color: authMode === 'login' ? '#D4AF37' : '#BFA6D8',
                      fontSize: '0.85rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
                      borderBottom: authMode === 'login' ? '2px solid #D4AF37' : '2px solid transparent', transition: 'all 0.3s'
                    }}
                  >
                    🔐 Login
                  </button>
                  <button 
                    onClick={() => setAuthMode('register')}
                    style={{ 
                      flex: 1, background: 'none', border: 'none', padding: '14px', color: authMode === 'register' ? '#D4AF37' : '#BFA6D8',
                      fontSize: '0.85rem', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', cursor: 'pointer',
                      borderBottom: authMode === 'register' ? '2px solid #D4AF37' : '2px solid transparent', transition: 'all 0.3s'
                    }}
                  >
                    ✨ Register
                  </button>
                </div>

                {/* LOGIN FORM */}
                {authMode === 'login' && (
                  <form onSubmit={handleAppLogin} className="luxury-card animate-fade-in" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <h3 className="font-luxury-serif" style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>Welcome to the Atelier</h3>
                      <p style={{ color: '#BFA6D8', fontSize: '0.78rem', marginTop: '6px' }}>Access your personalized wellness goals, active bookings & loyalty rewards.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684', marginBottom: '6px' }}>Cellphone Number:</label>
                        <input 
                          type="tel" 
                          required
                          className="luxury-input" 
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          placeholder="e.g. +27829982020" 
                          value={authPhone} 
                          onChange={(e) => setAuthPhone(e.target.value)} 
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <label style={{ fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684' }}>Access Password:</label>
                          <button 
                            type="button" 
                            onClick={() => { setAuthMode('forgot'); setForgotStep(1); }}
                            style={{ background: 'none', border: 'none', color: '#BFA6D8', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <input 
                          type="password" 
                          required
                          className="luxury-input" 
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          placeholder="••••••••" 
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-luxury-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                      Authorize Account & Enter
                    </button>
                  </form>
                )}

                {/* REGISTER FORM */}
                {authMode === 'register' && (
                  <form onSubmit={handleAppRegister} className="luxury-card animate-fade-in" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <h3 className="font-luxury-serif" style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>Create Member Account</h3>
                      <p style={{ color: '#BFA6D8', fontSize: '0.78rem', marginTop: '6px' }}>Register with your cellphone number to link with our clinic ledger database.</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684', marginBottom: '4px' }}>Full Name:</label>
                        <input 
                          type="text" 
                          required
                          className="luxury-input" 
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          placeholder="Charlotte Guest" 
                          value={authName} 
                          onChange={(e) => setAuthName(e.target.value)} 
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684', marginBottom: '4px' }}>Email Address:</label>
                        <input 
                          type="email" 
                          required
                          className="luxury-input" 
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          placeholder="charlotte@gmail.com" 
                          value={authEmail} 
                          onChange={(e) => setAuthEmail(e.target.value)} 
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684', marginBottom: '4px' }}>Cellphone Number (acts as login ID):</label>
                        <input 
                          type="tel" 
                          required
                          className="luxury-input" 
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          placeholder="+27821234567" 
                          value={authPhone} 
                          onChange={(e) => setAuthPhone(e.target.value)} 
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684', marginBottom: '4px' }}>Create Password (min 4 chars):</label>
                        <input 
                          type="password" 
                          required
                          className="luxury-input" 
                          style={{ width: '100%', boxSizing: 'border-box' }}
                          placeholder="••••••••" 
                          value={authPassword} 
                          onChange={(e) => setAuthPassword(e.target.value)} 
                        />
                      </div>
                    </div>

                    <button type="submit" className="btn-luxury-purple" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                      Register Profile
                    </button>
                  </form>
                )}

                {/* FORGOT PASSWORD FORM */}
                {authMode === 'forgot' && (
                  <div className="luxury-card animate-fade-in" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                      <h3 className="font-luxury-serif" style={{ color: 'white', margin: 0, fontSize: '1.4rem' }}>Reset Password</h3>
                      <p style={{ color: '#BFA6D8', fontSize: '0.78rem', marginTop: '6px' }}>Provide your email to verify and set a new portal security password.</p>
                    </div>

                    {forgotStep === 1 ? (
                      <form onSubmit={handleForgotPasswordRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684', marginBottom: '6px' }}>Account Email Address:</label>
                          <input 
                            type="email" 
                            required
                            className="luxury-input" 
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            placeholder="charlotte@gmail.com" 
                            value={forgotEmail} 
                            onChange={(e) => setForgotEmail(e.target.value)} 
                          />
                        </div>
                        <button type="submit" className="btn-luxury-gold" style={{ width: '100%', justifyContent: 'center' }}>
                          Send Verification Link
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleForgotPasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="psych-badge" style={{ fontSize: '0.75rem', justifyContent: 'center', boxSizing: 'border-box' }}>
                          🔑 Verification Code Verified! Enter your new password below.
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '1px', textTransform: 'uppercase', color: '#A89684', marginBottom: '6px' }}>Enter New Password:</label>
                          <input 
                            type="password" 
                            required
                            className="luxury-input" 
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            placeholder="••••••••" 
                            value={forgotNewPassword} 
                            onChange={(e) => setForgotNewPassword(e.target.value)} 
                          />
                        </div>
                        <button type="submit" className="btn-luxury-purple" style={{ width: '100%', justifyContent: 'center' }}>
                          Confirm Password Reset
                        </button>
                      </form>
                    )}

                    <button 
                      type="button" 
                      onClick={() => setAuthMode('login')}
                      style={{ background: 'none', border: 'none', color: '#BFA6D8', fontSize: '0.78rem', cursor: 'pointer', alignSelf: 'center', marginTop: '10px' }}
                    >
                      Return to Login
                    </button>
                  </div>
                )}

              </div>
            ) : (
              
              // LOGGED IN PORTAL: Dashboard
              (() => {
                const activeClientProfile = clients.find(c => c.id === appCurrentClient);
                if (!activeClientProfile) return <div style={{ color: 'white' }}>Error loading member profile.</div>;

                const clientBookings = appointments.filter(a => a.clientId === appCurrentClient && a.status !== 'Cancelled');
                const glowPoints = activeClientProfile.loyaltyPoints || 0;
                const weightLogs = activeClientProfile.weightLogs || [];
                const latestWeight = weightLogs.length > 0 ? weightLogs[weightLogs.length - 1].weight : '--';

                return (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* TOP SUMMARY BAR */}
                    <div className="luxury-card" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {activeClientProfile.profilePhoto ? (
                          <img 
                            src={activeClientProfile.profilePhoto} 
                            style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4AF37' }} 
                            alt="Profile" 
                          />
                        ) : (
                          <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: 'rgba(107, 44, 145, 0.2)', border: '2px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                            <User style={{ width: '32px', height: '32px' }} />
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h2 style={{ fontSize: '1.4rem', color: 'white', margin: 0, fontWeight: 700 }}>{activeClientProfile.name}</h2>
                            <span className="badge-brand gold" style={{ fontSize: '0.62rem', letterSpacing: '1px', textTransform: 'uppercase', padding: '2px 8px' }}>
                              🏆 VIP Tier: {activeClientProfile.membershipTier || 'Gold'}
                            </span>
                          </div>
                          <p style={{ color: '#BFA6D8', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                            Phone: {activeClientProfile.phone} • Email: {activeClientProfile.email}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <button 
                          onClick={() => {
                            setProfileForm({
                              name: activeClientProfile.name || '',
                              email: activeClientProfile.email || '',
                              phone: activeClientProfile.phone || '',
                              password: activeClientProfile.password || '',
                              deliveryAddress: activeClientProfile.deliveryAddress || ''
                            });
                            setShowProfileEditModal(true);
                          }} 
                          className="btn-luxury-purple"
                          style={{ padding: '8px 16px', fontSize: '0.75rem' }}
                        >
                          <Settings style={{ width: '14px', height: '14px' }} /> Edit Profile
                        </button>
                        
                        <button 
                          onClick={() => {
                            setIsLoggedIn(false);
                            setAppCurrentClient('');
                            alert('You have logged out successfully.');
                          }} 
                          className="btn-luxury-gold" 
                          style={{ padding: '8px 16px', fontSize: '0.75rem', borderColor: '#ef4444', color: '#ef4444' }}
                        >
                          <LogOut style={{ width: '14px', height: '14px' }} /> Log Out
                        </button>
                      </div>
                    </div>

                    {/* THREE COLUMNS GRID LAYOUT */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '30px', alignItems: 'start' }}>
                      
                      {/* COLUMN A: LOYALTY POINTS & VOUCHERS */}
                      <div className="luxury-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 700 }}>VIP rewards program</span>
                          <h3 style={{ fontFamily: 'Outfit', color: 'white', margin: '4px 0 0 0', fontSize: '1.25rem' }}>Glow Points Engine</h3>
                        </div>

                        {/* Balance display */}
                        <div style={{ background: 'rgba(107, 44, 145, 0.1)', border: '1px solid rgba(107, 44, 145, 0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#BFA6D8', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Loyalty Balance</span>
                          <span style={{ fontSize: '2.5rem', fontWeight: 800, color: '#D4AF37', display: 'block', textShadow: '0 0 10px rgba(212,175,55,0.3)', margin: '4px 0' }}>
                            {glowPoints} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'white' }}>Points</span>
                          </span>
                          <button 
                            onClick={() => setShowGlowInfoModal(true)}
                            style={{ background: 'none', border: 'none', color: '#BFA6D8', textDecoration: 'underline', fontSize: '0.72rem', cursor: 'pointer' }}
                          >
                            How does points conversion work?
                          </button>
                        </div>

                        {/* Point Redemption Vouchers list */}
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Available Reward Vouchers:</strong>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {[
                              { points: 50, label: '🎟️ R100 Off any Treatment' },
                              { points: 100, label: '🧬 Free Korean Peptide Mini Serum' },
                              { points: 120, label: '🎟️ R250 Off Voucher' },
                              { points: 200, label: '🔥 Free 30m Vacutherm Chamber session' }
                            ].map((reward, rIdx) => {
                              const canRedeem = glowPoints >= reward.points;
                              return (
                                <div key={rIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                  <div>
                                    <span style={{ display: 'block', fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>{reward.label}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#BFA6D8' }}>Cost: {reward.points} Glow Points</span>
                                  </div>
                                  <button
                                    onClick={() => handleRedeemPoints(reward.points, reward.label.slice(3))}
                                    disabled={!canRedeem}
                                    className={canRedeem ? "btn-brand-gold" : "btn-brand-purple"}
                                    style={{
                                      padding: '6px 12px', fontSize: '0.7rem', height: '28px',
                                      opacity: canRedeem ? 1 : 0.4, cursor: canRedeem ? 'pointer' : 'not-allowed'
                                    }}
                                  >
                                    Claim
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Redeemed vouchers list */}
                        <div style={{ marginTop: '10px' }}>
                          <strong style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Your Vouchers Ledger:</strong>
                          {(activeClientProfile.vouchers || []).length === 0 ? (
                            <span style={{ color: '#BFA6D8', fontSize: '0.72rem', fontStyle: 'italic' }}>No redeemed vouchers in your account yet.</span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                              {(activeClientProfile.vouchers || []).map((v, idx) => (
                                <div key={idx} style={{ display: 'flex', justify: 'space-between', padding: '8px 12px', backgroundColor: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.15)', borderRadius: '6px', fontSize: '0.75rem' }}>
                                  <span style={{ color: '#34d399', fontWeight: 600 }}>{v.rewardName}</span>
                                  <code style={{ color: 'white', fontWeight: 'bold' }}>{v.code}</code>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* COLUMN B: SCALE TRACKER PROGRESS */}
                      <div className="luxury-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 700 }}>physiological parameters</span>
                          <h3 style={{ fontFamily: 'Outfit', color: 'white', margin: '4px 0 0 0', fontSize: '1.25rem' }}>Scale & Weight Tracker</h3>
                        </div>

                        {/* SVG trend graph */}
                        {renderScaleLogsGraph(activeClientProfile)}

                        {/* Add metric logging form */}
                        <form onSubmit={handleAppSubmitMeasurements} style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                          <strong style={{ fontSize: '0.78rem', color: 'white', textTransform: 'uppercase' }}>Log Today's Measurement</strong>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '4px' }}>Weight (kg):</label>
                              <input 
                                type="number" 
                                step="0.1" 
                                required
                                placeholder="e.g. 72.5" 
                                className="luxury-input" 
                                style={{ width: '100%', padding: '8px !important', boxSizing: 'border-box' }}
                                value={measurementForm.weight}
                                onChange={(e) => setMeasurementForm(prev => ({ ...prev, weight: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '4px' }}>Waist (cm):</label>
                              <input 
                                type="number" 
                                placeholder="Optional" 
                                className="luxury-input" 
                                style={{ width: '100%', padding: '8px !important', boxSizing: 'border-box' }}
                                value={measurementForm.waist}
                                onChange={(e) => setMeasurementForm(prev => ({ ...prev, waist: e.target.value }))}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.62rem', color: '#A89684', marginBottom: '4px' }}>Hips (cm):</label>
                              <input 
                                type="number" 
                                placeholder="Optional" 
                                className="luxury-input" 
                                style={{ width: '100%', padding: '8px !important', boxSizing: 'border-box' }}
                                value={measurementForm.hips}
                                onChange={(e) => setMeasurementForm(prev => ({ ...prev, hips: e.target.value }))}
                              />
                            </div>
                          </div>

                          <button type="submit" className="btn-luxury-gold" style={{ padding: '8px 16px', fontSize: '0.72rem', justify: 'center', display: 'flex', width: '100%' }}>
                            Save Progress Log Entry
                          </button>
                        </form>

                        {/* Past history logs table */}
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.78rem', color: '#A89684', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Chronological Log History:</strong>
                          {weightLogs.length === 0 ? (
                            <span style={{ color: '#BFA6D8', fontSize: '0.72rem', fontStyle: 'italic' }}>No logged weight parameters recorded yet.</span>
                          ) : (
                            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                                <thead style={{ backgroundColor: 'rgba(255,255,255,0.02)', color: '#A89684' }}>
                                  <tr>
                                    <th style={{ padding: '8px' }}>Date</th>
                                    <th style={{ padding: '8px' }}>Weight</th>
                                    <th style={{ padding: '8px' }}>Waist</th>
                                    <th style={{ padding: '8px' }}>Hips</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {weightLogs.slice().reverse().map((wl, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                      <td style={{ padding: '8px', color: '#BFA6D8' }}>{wl.date}</td>
                                      <td style={{ padding: '8px', color: 'white', fontWeight: 600 }}>{wl.weight} kg</td>
                                      <td style={{ padding: '8px', color: 'white' }}>{wl.waist ? `${wl.waist} cm` : '--'}</td>
                                      <td style={{ padding: '8px', color: 'white' }}>{wl.hips ? `${wl.hips} cm` : '--'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                      </div>

                      {/* COLUMN C: SCHEDULE & BOOKINGS */}
                      <div className="luxury-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '12px' }}>
                          <span style={{ fontSize: '0.62rem', letterSpacing: '2px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 700 }}>active schedule blocks</span>
                          <h3 style={{ fontFamily: 'Outfit', color: 'white', margin: '4px 0 0 0', fontSize: '1.25rem' }}>Active Appointments</h3>
                        </div>

                        {clientBookings.length === 0 ? (
                          <div style={{ color: '#BFA6D8', fontSize: '0.82rem', padding: '24px 0', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                            No upcoming scheduled bookings in the system. Click "Treatments" tab to secure a slot.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {clientBookings.map((apt) => {
                              const srv = services.find(s => s.id === apt.serviceId) || { name: 'Aesthetic Treatment', price: 0 };
                              const isRescheduling = reschedulingAptId === apt.id;
                              
                              return (
                                <div 
                                  key={apt.id} 
                                  style={{ 
                                    padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)', 
                                    border: '1px solid rgba(107, 44, 145, 0.2)', borderRadius: '10px',
                                    display: 'flex', flexDirection: 'column', gap: '12px'
                                  }}
                                >
                                  <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <strong style={{ color: 'white', fontSize: '0.85rem' }}>{srv.name}</strong>
                                      <span className="badge-brand purple" style={{ fontSize: '0.55rem', padding: '1px 6px', textTransform: 'uppercase' }}>{apt.status}</span>
                                    </div>
                                    <span style={{ display: 'block', fontSize: '0.72rem', color: '#BFA6D8', marginTop: '4px' }}>
                                      📅 {apt.date} @ {apt.time} ({apt.duration || '60'} mins)
                                    </span>
                                    <span style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', marginTop: '2px' }}>
                                      Clinical Specialist: {apt.staffId === 'usr-3' ? 'Jessica (Laser Therapist)' : 'Victoria (Aesthetician)'}
                                    </span>
                                  </div>

                                  {/* RESCHEDULE INNER CHOICE FORM */}
                                  {isRescheduling ? (
                                    <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                                      <strong style={{ fontSize: '0.7rem', color: '#D4AF37', textTransform: 'uppercase' }}>Select New Date & Time Slot:</strong>
                                      <div style={{ display: 'flex', gap: '8px' }}>
                                        <input 
                                          type="date" 
                                          required
                                          className="luxury-input" 
                                          style={{ flex: 1, padding: '8px !important' }}
                                          value={rescheduleForm.date} 
                                          onChange={(e) => setRescheduleForm(prev => ({ ...prev, date: e.target.value }))}
                                        />
                                        <select 
                                          className="luxury-input" 
                                          style={{ width: '120px', padding: '8px !important' }}
                                          value={rescheduleForm.time}
                                          onChange={(e) => setRescheduleForm(prev => ({ ...prev, time: e.target.value }))}
                                        >
                                          <option value="09:00">09:00 AM</option>
                                          <option value="10:30">10:30 AM</option>
                                          <option value="12:00">12:00 PM</option>
                                          <option value="13:30">13:30 PM</option>
                                          <option value="15:00">15:00 PM</option>
                                          <option value="16:30">16:30 PM</option>
                                        </select>
                                      </div>
                                      <div style={{ display: 'flex', gap: '6px' }}>
                                        <button type="submit" className="btn-brand-gold" style={{ flex: 1, height: '30px', fontSize: '0.7rem', justifyContent: 'center' }}>
                                          Confirm Reschedule
                                        </button>
                                        <button type="button" onClick={() => setReschedulingAptId(null)} className="btn-brand-purple" style={{ height: '30px', fontSize: '0.7rem', justifyContent: 'center' }}>
                                          Cancel
                                        </button>
                                      </div>
                                    </form>
                                  ) : (
                                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
                                      <button 
                                        onClick={() => {
                                          setReschedulingAptId(apt.id);
                                          setRescheduleForm({
                                            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
                                            time: apt.time
                                          });
                                        }}
                                        className="btn-brand-gold"
                                        style={{ flex: 1, padding: '4px', fontSize: '0.7rem', justifyContent: 'center', height: '26px' }}
                                      >
                                        Reschedule Slot
                                      </button>
                                      <button 
                                        onClick={() => setCancelingApt(apt)}
                                        className="btn-brand-purple"
                                        style={{ flex: 1, padding: '4px', fontSize: '0.7rem', justifyContent: 'center', height: '26px', borderColor: '#ef4444', color: '#ef4444' }}
                                      >
                                        Cancel Booking
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* SUBTAB: SHOPPING BAG CART */}
        {activeTab === 'cart' && (
          <div style={{ padding: '160px 8% 80px 8%', display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '850px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>secured checkout</span>
              <h2 className="font-luxury-serif" style={{ fontSize: '2.2rem', color: 'white', margin: '6px 0 0 0' }}>Shopping Bag</h2>
              <div style={{ width: '40px', height: '1px', backgroundColor: '#D4AF37', margin: '14px auto 0 auto' }}></div>
            </div>

            {checkoutStep === 'cart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {cart.length === 0 ? (
                  <div className="luxury-card" style={{ padding: '40px', textAlign: 'center', color: '#A89684', borderStyle: 'dashed' }}>
                    Your shopping bag is currently empty. Visit our boutique to start your transformation.
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {cart.map(c => (
                        <div key={c.id} className="luxury-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', gap: '16px', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1', minWidth: '220px' }}>
                            <strong style={{ color: 'white', fontSize: '0.98rem', display: 'block' }}>{c.name}</strong>
                            {c.bookingDetails && (
                              <span style={{ display: 'block', fontSize: '0.75rem', color: '#BFA6D8', marginTop: '4px' }}>
                                Date: {c.bookingDetails.date} @ {c.bookingDetails.time}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'nowrap', minWidth: '150px', justifyContent: 'flex-end' }}>
                            <strong className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '1.15rem', whiteSpace: 'nowrap' }}>R {c.price.toFixed(2)}</strong>
                            <button 
                              onClick={() => handleRemoveCartItem(c.id)}
                              style={{ background: 'none', border: 'none', color: '#e11d48', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600, padding: 0 }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="psych-badge" style={{ width: '100%', justifyContent: 'center', boxSizing: 'border-box' }}>
                      ⚠️ Scarcity Lock: Slot secured for 3 minutes! Settle checkout now to retain Gold multi-point tokens.
                    </div>

                    <div style={{ display: 'flex', justify: 'space-between', borderTop: '1px solid rgba(212, 175, 55, 0.15)', paddingTop: '20px', fontSize: '1.1rem' }}>
                      <span>Subtotal Sum:</span>
                      <strong className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '1.35rem' }}>
                        R {cart.reduce((acc, c) => acc + c.price, 0).toFixed(2)}
                      </strong>
                    </div>

                    <button onClick={() => setCheckoutStep('billing')} className="btn-luxury-gold" style={{ width: '100%', justifyContent: 'center' }}>
                      Confirm Checkout Particulars
                    </button>
                  </>
                )}
              </div>
            )}

            {checkoutStep === 'billing' && (
              <div className="luxury-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h3 className="font-luxury-serif" style={{ color: 'white', fontSize: '1.25rem', letterSpacing: '2px', margin: 0 }}>Billing & Shipping Particulars</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <input type="text" placeholder="Full Name" className="luxury-input" value={billingDetails.name} onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))} />
                  <input type="text" placeholder="Contact Phone" className="luxury-input" value={billingDetails.phone} onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))} />
                  <input type="email" placeholder="Email Address" className="luxury-input" value={billingDetails.email} onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))} />
                  <input type="text" placeholder="Shipping Address (for retail items)" className="luxury-input" value={billingDetails.shipping} onChange={(e) => setBillingDetails(prev => ({ ...prev, shipping: e.target.value }))} />
                </div>
                <button onClick={handleCartCheckoutSubmit} className="btn-luxury-purple" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  🚀 Authorize Payment & Settle Slot
                </button>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="luxury-card" style={{ padding: '50px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #34d399' }}>
                  <CheckCircle style={{ width: '28px', height: '28px' }} />
                </div>
                <h2 className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '1.75rem', letterSpacing: '2px', margin: 0 }}>Transaction Approved</h2>
                <p style={{ fontSize: '0.85rem', color: '#A89684', lineHeight: '1.6', margin: 0 }}>
                   Belles-lettres receipt sent! Your slots are registered on our reception calendar. Points have been successfully credited to your companion app.
                </p>
                <button onClick={() => setActiveTab('home')} className="btn-luxury-purple">Return to Atelier</button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* LUXURY RESERVATION BOOKING MODAL */}
      {showWebsiteBookingModal && websiteSelectedService && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div className="luxury-card animate-fade-in" style={{ width: '420px', padding: '40px', border: '1px solid #D4AF37' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span className="font-luxury-serif" style={{ fontSize: '0.78rem', color: '#D4AF37', letterSpacing: '2px' }}>reservation card</span>
              <button onClick={() => setShowWebsiteBookingModal(false)} style={{ background: 'none', border: 'none', color: '#A89684', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ borderBottom: '1px solid rgba(212,175,55,0.15)', paddingBottom: '16px' }}>
                <h4 className="font-luxury-serif" style={{ fontSize: '1.15rem', color: 'white', margin: '0 0 6px 0', letterSpacing: '1px' }}>{websiteSelectedService.name}</h4>
                <strong className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '1.1rem' }}>R {websiteSelectedService.price.toFixed(2)}</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A89684', marginBottom: '8px' }}>Select Date:</label>
                <input
                  type="date"
                  className="luxury-input"
                  value={websiteBookingDate}
                  onChange={(e) => setWebsiteBookingDate(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#A89684', marginBottom: '8px' }}>Select Time Slot:</label>
                <select
                  className="luxury-input"
                  value={websiteBookingTime}
                  onChange={(e) => setWebsiteBookingTime(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="09:00">09:00 AM (Early Glow)</option>
                  <option value="10:30">10:30 AM</option>
                  <option value="12:00">12:00 PM (Midday Rest)</option>
                  <option value="13:30">13:30 PM</option>
                  <option value="15:00">15:00 PM</option>
                  <option value="16:30">16:30 PM (Sunset Roll)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '14px', marginTop: '16px' }}>
                <button
                  onClick={handleConfirmWebsiteBooking}
                  className="btn-luxury-gold"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Secure Slot
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER PROFILE EDIT MODAL */}
      {showProfileEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, padding: '20px' }}>
          <form onSubmit={handleProfileUpdate} className="luxury-card animate-fade-in" style={{ width: '100%', maxWidth: '480px', padding: '30px', border: '1px solid #D4AF37' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span className="font-luxury-serif" style={{ fontSize: '0.85rem', color: '#D4AF37', letterSpacing: '2px' }}>Edit Profile Credentials</span>
              <button type="button" onClick={() => setShowProfileEditModal(false)} style={{ background: 'none', border: 'none', color: '#A89684', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Photo Upload Area */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'relative' }}>
                  {profileForm.profilePhoto ? (
                    <img src={profileForm.profilePhoto} style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} alt="Avatar" />
                  ) : (
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(107, 44, 145, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4AF37' }}>
                      <User style={{ width: '24px', height: '24px' }} />
                    </div>
                  )}
                  <label style={{ position: 'absolute', bottom: '-4px', right: '-4px', backgroundColor: '#D4AF37', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'black', boxShadow: '0 0 5px rgba(0,0,0,0.5)' }}>
                    <Camera style={{ width: '12px', height: '12px' }} />
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarFileChange} />
                  </label>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: 'white', fontWeight: 600 }}>Profile Avatar</span>
                  <span style={{ fontSize: '0.65rem', color: '#BFA6D8' }}>Click icon to upload a custom image.</span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', marginBottom: '4px' }}>Full Name:</label>
                <input 
                  type="text" 
                  required
                  className="luxury-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', marginBottom: '4px' }}>Email Address:</label>
                <input 
                  type="email" 
                  required
                  className="luxury-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', marginBottom: '4px' }}>Cellphone Number:</label>
                <input 
                  type="tel" 
                  required
                  className="luxury-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={profileForm.phone} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', marginBottom: '4px' }}>Account Password:</label>
                <input 
                  type="password" 
                  required
                  className="luxury-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={profileForm.password} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, password: e.target.value }))} 
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', color: '#A89684', marginBottom: '4px' }}>Shipping Address (for boutique products):</label>
                <input 
                  type="text" 
                  className="luxury-input" 
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  value={profileForm.deliveryAddress} 
                  onChange={(e) => setProfileForm(prev => ({ ...prev, deliveryAddress: e.target.value }))} 
                />
              </div>
            </div>

            <button type="submit" className="btn-luxury-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }}>
              Save Profile Changes
            </button>
          </form>
        </div>
      )}

      {/* GLOW POINTS CONVERSION INFO MODAL */}
      {showGlowInfoModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, padding: '20px' }}>
          <div className="luxury-card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '30px', border: '1px solid #D4AF37' }}>
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="font-luxury-serif" style={{ fontSize: '0.85rem', color: '#D4AF37', letterSpacing: '2px' }}>Loyalty Points Guidelines</span>
              <button onClick={() => setShowGlowInfoModal(false)} style={{ background: 'none', border: 'none', color: '#A89684', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <p style={{ color: '#F5EFE6', fontSize: '0.82rem', lineHeight: '1.6', margin: '0 0 14px 0' }}>
              We reward our aesthetic members with <strong>Glow Points</strong> on all transactions:
            </p>
            <ul style={{ color: '#BFA6D8', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '20px', margin: '0 0 20px 0' }}>
              <li>Earn <strong>1 Glow Point</strong> for every <strong>R 2.00</strong> spent on treatment services or boutique retail products.</li>
              <li>Points are credited automatically to your portal profile immediately after invoicing and payment settlement.</li>
              <li>Vouchers can be claimed from your portal and used dynamically to redeem discount offers in our atelier checkout.</li>
            </ul>

            <button onClick={() => setShowGlowInfoModal(false)} className="btn-luxury-purple" style={{ width: '100%', justifyContent: 'center' }}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* CANCELLATION policy & REASON PROMPT MODAL */}
      {cancelingApt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000, padding: '20px' }}>
          <div className="luxury-card animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '30px', border: '1px solid #ef4444' }}>
            
            <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span className="font-luxury-serif" style={{ fontSize: '0.8rem', color: '#ef4444', letterSpacing: '1px', fontWeight: 'bold' }}>Cancel Appointment Request</span>
              <button onClick={() => setCancelingApt(null)} style={{ background: 'none', border: 'none', color: '#A89684', cursor: 'pointer' }}>
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            {(() => {
              const warning = getCancelPolicyWarning(cancelingApt);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Warning banner */}
                  <div style={{ 
                    backgroundColor: warning.severity === 'free' ? 'rgba(52,211,153,0.08)' : 'rgba(239,68,68,0.08)',
                    border: warning.severity === 'free' ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(239,68,68,0.2)',
                    padding: '14px', borderRadius: '8px', fontSize: '0.8rem', color: warning.severity === 'free' ? '#34d399' : '#f87171',
                    lineHeight: '1.5'
                  }}>
                    <strong>Cancellation Ledger Assessment:</strong>
                    <p style={{ margin: '6px 0 0 0' }}>{warning.text}</p>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#A89684', marginBottom: '6px', fontWeight: 600 }}>
                      Please provide a reason for cancellation (required):
                    </label>
                    <textarea 
                      className="luxury-input" 
                      style={{ width: '100%', boxSizing: 'border-box' }}
                      rows={3} 
                      placeholder="e.g. Flight delay / work commitment change"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.72rem', color: '#BFA6D8', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      style={{ marginTop: '2px' }}
                      checked={cancelPolicyChecked}
                      onChange={(e) => setCancelPolicyChecked(e.target.checked)}
                    />
                    <span>I understand the terms and accept the fee deductions/refund calculations outlined above.</span>
                  </label>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button 
                      onClick={handleCancelBookingSubmit}
                      className="btn-luxury-purple"
                      style={{ flex: 1, justify: 'center', backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                    >
                      Confirm Cancel Booking
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setCancelingApt(null)}
                      className="btn-luxury-gold"
                      style={{ flex: 1, justify: 'center' }}
                    >
                      Keep Booking
                    </button>
                  </div>

                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* RENDER CONFETTI CHASSIS */}
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

      {/* BESPOKE LUXURY FOOTER */}
      <footer style={{
        padding: '80px 8%',
        backgroundColor: '#050505',
        borderTop: '1px solid rgba(107, 44, 145, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '40px'
      }}>
        <div style={{ flex: '1.8', minWidth: '280px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundImage: "url('/logo.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '2px solid #D4AF37',
            marginBottom: '24px'
          }} />
          <p style={{ fontSize: '0.8rem', color: '#A89684', lineHeight: '1.7', maxWidth: '350px' }}>
            A sanctuary of bespoke body shaping, advanced skin mapping, and modern recovery science. Experience cellular transformation in Pretoria East.
          </p>
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', alignItems: 'center' }}>
            <a href="https://www.instagram.com/sculptglow.pta" target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', transition: 'all 0.3s ease' }} className="social-hover-btn">
              <svg style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }} viewBox="0 0 24 24">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://www.facebook.com/share/1CZEEXWAqv/" target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', transition: 'all 0.3s ease' }} className="social-hover-btn">
              <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@sculptglow.pta" target="_blank" rel="noopener noreferrer" style={{ color: '#D4AF37', transition: 'all 0.3s ease' }} className="social-hover-btn">
              <svg style={{ width: '20px', height: '20px', fill: 'currentColor' }} viewBox="0 0 24 24">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.94 1.14 2.27 1.94 3.71 2.24v3.83c-1.39-.1-2.74-.63-3.87-1.48-.7-.52-1.28-1.19-1.72-1.95v7.26c.03 1.94-.48 3.88-1.5 5.5-1.57 2.49-4.32 4.09-7.31 4.07-2.91.07-5.74-1.36-7.39-3.77-1.78-2.5-2.07-5.94-.78-8.73C2.4 8.78 5.16 6.84 8.24 6.78c.07 1.34.03 2.68.04 4.02-1.43-.02-2.92.51-3.89 1.59-.99 1.05-1.37 2.6-1.02 4.01.35 1.5 1.51 2.76 2.97 3.19 1.48.47 3.18.1 4.31-.9 1.15-1.01 1.63-2.61 1.57-4.14V.02z"/>
              </svg>
            </a>
          </div>
        </div>

        <div style={{ flex: '1', minWidth: '200px' }}>
          <h4 className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '0.9rem', marginBottom: '20px', letterSpacing: '2px' }}>The Atelier</h4>
          <p style={{ fontSize: '0.78rem', color: '#A89684', lineHeight: '2' }}>
            Shop 5, Glenwood Galleria<br />
            Pretoria East, ZA<br />
            Mon - Fri: 08:00 - 18:00<br />
            Sat - Sun: 09:00 - 14:00
          </p>
        </div>

        <div style={{ flex: '1', minWidth: '200px' }}>
          <h4 className="font-luxury-serif" style={{ color: '#D4AF37', fontSize: '0.9rem', marginBottom: '20px', letterSpacing: '2px' }}>Concierge</h4>
          <p style={{ fontSize: '0.78rem', color: '#A89684', lineHeight: '2' }}>
            T: +27 (12) 998-2020<br />
            E: info@sculptglow.co.za<br />
            WhatsApp: +27 (12) 998-2020
          </p>
        </div>
      </footer>

    </div>
  );
}
