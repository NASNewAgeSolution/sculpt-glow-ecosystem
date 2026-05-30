import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Phone, MapPin, Search, CheckCircle, AlertTriangle, Download, ArrowRight, ChevronLeft, ChevronRight, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';
import { getTable, addAppointment, addInvoice, addPaymentToInvoice, logAction } from '../db/stateEngine';

export default function ClientWebsite() {
  const [activeTab, setActiveTab] = useState('home');
  const [services, setServices] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState({});
  const [cart, setCart] = useState([]);
  const [checkoutStep, setCheckoutStep] = useState('cart'); // cart, billing, success
  const [billingDetails, setBillingDetails] = useState({ name: 'Alice Smith', phone: '+27 (82) 019-2834', email: 'alice.smith@gmail.com', shipping: '12 Glenwood Gardens, Pretoria East' });

  // Banner and booking wizard states
  const [specialSlideshowIdx, setSpecialSlideshowIdx] = useState(0);
  const [websiteSelectedService, setWebsiteSelectedService] = useState(null);
  const [websiteBookingDate, setWebsiteBookingDate] = useState('2026-05-30');
  const [websiteBookingTime, setWebsiteBookingTime] = useState('09:00');
  const [showWebsiteBookingModal, setShowWebsiteBookingModal] = useState(false);

  // Fairy Dust Star Particle & Glitter checkout states
  const [glitters, setGlitters] = useState([]);
  const websiteRef = useRef(null);
  const canvasRef = useRef(null);

  const syncStorefront = () => {
    setServices(getTable('services'));
    setProducts(getTable('products'));
    setSettings(getTable('settings'));
  };

  useEffect(() => {
    syncStorefront();
    const handleSync = () => syncStorefront();
    window.addEventListener('salon_db_sync', handleSync);

    const slideTimer = setInterval(() => {
      setSpecialSlideshowIdx(prev => (prev === 0 ? 1 : 0));
    }, 4500);

    return () => {
      window.removeEventListener('salon_db_sync', handleSync);
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

  return (
    <div ref={websiteRef} style={{
      minHeight: '100vh', backgroundColor: '#0D0D0D', color: '#F5EFE6',
      position: 'relative', overflowX: 'hidden'
    }}>
      <canvas ref={canvasRef} className="fairy-canvas" />

      {/* TOP BLENDED HEADER */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '24px 40px', backgroundColor: 'transparent', zIndex: 100,
        borderBottom: '1px solid rgba(107, 44, 145, 0.15)', position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
          <img src="/logo.jpg" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid #D4AF37' }} alt="Sculpt & Glow" />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, tracking: '0.1em', margin: 0, fontFamily: 'Outfit', color: 'white' }}>SCULPT & GLOW</h2>
            <span style={{ fontSize: '0.62rem', tracking: '0.15em', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 700 }}>Wellness Ecosystem</span>
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '24px', fontSize: '0.85rem', fontWeight: 600 }}>
          {[
            { id: 'home', label: 'Home' },
            { id: 'services', label: 'Treatments Menu' },
            { id: 'products', label: 'Retail Shop' },
            { id: 'about', label: 'About Us' },
            { id: 'contact', label: 'Contact' },
            { id: 'app', label: 'Download App' }
          ].map(menuItem => (
            <button
              key={menuItem.id}
              onClick={() => setActiveTab(menuItem.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: activeTab === menuItem.id ? '#D4AF37' : '#F5EFE6',
                fontWeight: activeTab === menuItem.id ? 700 : 500,
                transition: 'var(--transition-smooth)', fontSize: 'inherit'
              }}
            >
              {menuItem.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setActiveTab('cart')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4AF37', position: 'relative' }}
        >
          <ShoppingCart style={{ width: '22px', height: '22px' }} />
          {cart.length > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#e11d48', color: 'white', fontSize: '0.62rem', width: '14px', height: '14px', borderRadius: '50%', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 700 }}>
              {cart.length}
            </span>
          )}
        </button>
      </header>

      {/* CORE CANVAS TAB ROUTING SCREEN */}
      <main style={{ padding: '40px', boxSizing: 'border-box', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* SUBTAB: HOME PAGE */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }} className="animate-fade-in">
            
            {/* Stunning Cover Hero Block */}
            <div style={{
              position: 'relative', height: '400px', borderRadius: '24px',
              backgroundImage: "linear-gradient(rgba(13, 13, 13, 0.4), rgba(46, 13, 61, 0.9)), url('/cover.jpg')",
              backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex',
              flexDirection: 'column', justifyContent: 'flex-end', padding: '48px', boxSizing: 'border-box',
              border: '1px solid rgba(107, 44, 145, 0.3)', boxShadow: 'var(--shadow-premium)'
            }}>
              <span className="psych-badge" style={{ position: 'absolute', top: '24px', right: '24px', fontSize: '0.85rem' }}>
                🔥 Urgent: Only 3 Booking Openings Left for Pretoria East Today!
              </span>
              <h1 className="font-serif" style={{ fontSize: '3rem', margin: 0, fontWeight: 400, color: 'white', lineHeight: '1.2' }}>
                Three treatments. One appointment.
              </h1>
              <p style={{ color: '#F5EFE6', margin: '12px 0 0 0', fontSize: '1rem', maxWidth: '600px', lineHeight: '1.5' }}>
                Sculpt & Glow combines targeted infrared-assisted cardio, manual lymphatic rolls, cold fat crystallization, and corrective cosmetic facials to sculpt your curves stronger, lighter, and confident.
              </p>
              <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                <button className="btn-brand-gold" onClick={() => setActiveTab('services')}>Book A Treatment <ArrowRight style={{ width: '18px', height: '18px' }} /></button>
                <button className="btn-brand-purple" onClick={() => setActiveTab('about')}>Map Ecosystem</button>
              </div>
            </div>

            {/* Specials slide banner ad carousel */}
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', color: '#D4AF37', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles style={{ color: '#D4AF37' }} /> Ecosystem Highlights & Specials</h3>
              <div style={{
                position: 'relative', height: '180px', borderRadius: '16px',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.8)), url(${specialSlideshowIdx === 0 ? '/ad1.jpg' : '/ad2.jpg'})`,
                backgroundSize: 'cover', backgroundPosition: 'center', transition: 'all 0.5s ease',
                display: 'flex', alignItems: 'center', padding: '32px', border: '1px solid rgba(107, 44, 145, 0.2)'
              }}>
                <div>
                  <span className="badge-brand gold" style={{ marginBottom: '8px' }}>Active Promo</span>
                  <strong style={{ fontSize: '1.35rem', display: 'block', color: 'white', fontFamily: 'Outfit' }}>
                    {specialSlideshowIdx === 0 ? 'Vacutherm Infrared Treadmill' : 'Manual Lymphatic Roller Massage'}
                  </strong>
                  <span style={{ fontSize: '0.88rem', color: '#BFA6D8', display: 'block', marginTop: '4px', maxWidth: '600px', lineHeight: '1.4' }}>
                    {specialSlideshowIdx === 0 ? 'Harness vacuum-seal and thermal heat waves to accelerate metabolic sweat levels.' : 'Soothe muscles, sweep water retention, and roll away localized fatigue.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Psychological conversion boosters grids */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              <div style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(107, 44, 145, 0.3)', padding: '24px', borderRadius: '16px' }}>
                <h4 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 8px 0', fontSize: '1.05rem' }}>Glow Points Reward Club</h4>
                <p style={{ fontSize: '0.85rem', color: '#A89684', lineHeight: '1.5' }}>
                  Every R100 spent automatically awards Glow Points. Redeem points to claim complimentary rollers, cryo angel sculpts or R500 credit vouchers!
                </p>
              </div>

              <div style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(107, 44, 145, 0.3)', padding: '24px', borderRadius: '16px' }}>
                <h4 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 8px 0', fontSize: '1.05rem' }}>Korean Glass Skin Correctives</h4>
                <p style={{ fontSize: '0.85rem', color: '#A89684', lineHeight: '1.5' }}>
                  Advanced skin mapping consultations and corrective peptide matrix peels direct from Seoul. Formulated to restore cellular glassglow.
                </p>
              </div>

              <div style={{ backgroundColor: '#1A1A1A', border: '1px solid rgba(107, 44, 145, 0.3)', padding: '24px', borderRadius: '16px' }}>
                <h4 style={{ fontFamily: 'Outfit', color: '#D4AF37', margin: '0 0 8px 0', fontSize: '1.05rem' }}>Fat Freezing 360 Cryo</h4>
                <p style={{ fontSize: '0.85rem', color: '#A89684', lineHeight: '1.5' }}>
                  Targeted non-invasive localized thermal cooling to crystallize and eliminate fat bulge layers comfortably and safely.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* SUBTAB: SERVICES MENU */}
        {activeTab === 'services' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            <div>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', color: 'white', margin: 0 }}>Ecosystem Clinical Menu</h2>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Choose your specialized body shaping or wellness treatment below and secure your slot instantly.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {services.map(srv => (
                <div key={srv.id} style={{ display: 'flex', flexDirection: 'column', justify: 'space-between', padding: '24px', backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid rgba(107, 44, 145, 0.3)', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'flex-start' }}>
                      <span className="badge-brand purple" style={{ fontSize: '0.62rem' }}>{srv.category}</span>
                      <strong style={{ color: '#D4AF37', fontSize: '1.25rem', fontFamily: 'Outfit' }}>R {srv.price.toFixed(2)}</strong>
                    </div>
                    <h3 style={{ fontFamily: 'Outfit', color: 'white', margin: '10px 0 6px 0', fontSize: '1.15rem' }}>{srv.name}</h3>
                    <p style={{ fontSize: '0.82rem', color: '#F5EFE6', lineHeight: '1.4', margin: 0 }}>{srv.description}</p>
                  </div>

                  <div style={{ borderTop: '1px solid rgba(107, 44, 145, 0.15)', paddingTop: '12px', display: 'flex', justify: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: '#A89684' }}>⌛ Duration: {srv.duration} mins</span>
                    <button
                      onClick={() => handleWebsiteBookService(srv)}
                      className="btn-brand-gold"
                      style={{ padding: '8px 16px', fontSize: '0.78rem' }}
                    >
                      Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: PRODUCTS PHARMACY */}
        {activeTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            <div>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', color: 'white', margin: 0 }}>Retail Wellness Pharmacy</h2>
              <p style={{ color: '#BFA6D8', margin: '4px 0 0 0', fontSize: '0.9rem' }}>Seoul glass skin formulas and advanced fat burner proteins synced in real-time.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
              {products.map(prod => (
                <div key={prod.id} style={{ backgroundColor: '#1A1A1A', borderRadius: '16px', border: '1px solid rgba(107, 44, 145, 0.3)', overflow: 'hidden', display: 'flex', flexDirection: 'column', justify: 'space-between' }}>
                  <img src={prod.image} style={{ width: '100%', height: '150px', objectFit: 'cover' }} alt={prod.name} />
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'white', display: 'block' }}>{prod.name}</strong>
                    <span style={{ fontSize: '0.72rem', color: '#BFA6D8' }}>{prod.category}</span>
                    <p style={{ fontSize: '0.75rem', color: '#A89684', margin: 0, lineHeight: '1.4' }}>{prod.description}</p>
                    
                    <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <strong style={{ color: '#D4AF37', fontSize: '1.1rem' }}>R {prod.price}</strong>
                      <span className={`badge-brand ${prod.stock <= 0 ? 'cancelled' : 'gold'}`} style={{ fontSize: '0.55rem' }}>
                        {prod.stock <= 0 ? 'Sold Out' : `Stock: ${prod.stock}`}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddProductToCart(prod)}
                      disabled={prod.stock <= 0}
                      className="btn-brand-gold"
                      style={{ width: '100%', padding: '10px', fontSize: '0.8rem', justifyContent: 'center', marginTop: '8px' }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB: ABOUT US */}
        {activeTab === 'about' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }} className="animate-fade-in">
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', color: 'white', margin: 0 }}>Ecosystem & Philosophy</h2>
            
            <blockquote style={{
              borderLeft: '4px solid #D4AF37', paddingLeft: '16px', fontStyle: 'italic',
              fontSize: '1.1rem', color: '#BFA6D8', margin: 0, lineHeight: '1.5'
            }}>
              "Sculpt & Glow is a dedicated body shaping and wellness studio combining infrared-assisted cardio, lymphatic rollers, body contouring, and advanced skin wellness treatments designed to help women feel stronger, lighter, sculpted, and confident in their bodies."
            </blockquote>

            <p style={{ fontSize: '0.92rem', lineHeight: '1.6', color: '#F5EFE6' }}>
              We believe in a holistic, biological approach to wellness. We don't just sell standard salon services—we map advanced vacuum treadmills, targeted cold-lipolysis fat freezing, and custom corrective peptide peeling direct from Seoul, Korea, to generate real physiological tissue results. Settle your booking online and claim your Gold loyalty progression!
            </p>
          </div>
        )}

        {/* SUBTAB: CONTACT DETAILS */}
        {activeTab === 'contact' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }} className="animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', color: 'white', margin: 0 }}>Pretoria East Studio</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <MapPin style={{ color: '#D4AF37', width: '20px', height: '20px' }} />
                  <span>Shop 5, Glenwood Galleria, Garstfontein Rd, Pretoria East</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Phone style={{ color: '#D4AF37', width: '20px', height: '20px' }} />
                  <span>+27 (12) 998-2020</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <a href="https://www.facebook.com/share/1CZEEXWAqv/" target="_blank" rel="noopener noreferrer" className="btn-brand-purple" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>Facebook</a>
                <a href="https://www.tiktok.com/@sculptglow.pta" target="_blank" rel="noopener noreferrer" className="btn-brand-purple" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>TikTok</a>
                <a href="https://www.instagram.com/sculptglow.pta" target="_blank" rel="noopener noreferrer" className="btn-brand-purple" style={{ textDecoration: 'none', fontSize: '0.8rem' }}>Instagram</a>
              </div>

              <button
                onClick={() => window.open('https://wa.me/27129982020', '_blank')}
                className="btn-brand-gold"
                style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <MessageSquare style={{ width: '18px', height: '18px' }} /> Chat on WhatsApp
              </button>
            </div>

            <div className="card-premium">
              <h3 style={{ fontFamily: 'Outfit', color: 'white', marginBottom: '16px', fontSize: '1.1rem' }}>Settle a Query</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input type="text" placeholder="Full Name" className="brand-input" />
                <input type="email" placeholder="Email Address" className="brand-input" />
                <textarea placeholder="Write message..." className="brand-input" rows={3} />
                <button onClick={() => alert('Query captured successfully!')} className="btn-brand-gold" style={{ alignSelf: 'flex-start' }}>Send Inquiry</button>
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB: DOWNLOAD MOBILE APP */}
        {activeTab === 'app' && (
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }} className="animate-fade-in">
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', color: 'white', margin: 0 }}>Get Branded Sculpt App</h2>
            <p style={{ color: '#BFA6D8', maxWidth: '500px', margin: 0, fontSize: '0.92rem', lineHeight: '1.5' }}>
              Download our mobile application to claim your custom loyalty vouchers, track weekly measurements, and settle invoice deposits.
            </p>
            <img src="/logo.jpg" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '2px solid #D4AF37', boxShadow: 'var(--shadow-premium)' }} alt="Sculpt app" />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => alert('iOS download mock fired!')} className="btn-brand-gold" style={{ fontSize: '0.85rem' }}><Download style={{ width: '16px', height: '16px' }} /> Apple App Store</button>
              <button onClick={() => alert('Android APK download mock fired!')} className="btn-brand-purple" style={{ fontSize: '0.85rem' }}><Download style={{ width: '16px', height: '16px' }} /> Google Play Store</button>
            </div>
          </div>
        )}

        {/* SUBTAB: SHOPPING BAG CART */}
        {activeTab === 'cart' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="animate-fade-in">
            <h2 style={{ fontFamily: 'Outfit', fontSize: '2rem', color: 'white', margin: 0 }}>Shopping Bag Checkout</h2>

            {checkoutStep === 'cart' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {cart.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px', border: '1px dashed rgba(107, 44, 145, 0.3)', borderRadius: '16px', color: '#A89684' }}>Your cart bag is currently empty.</div>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {cart.map(c => (
                        <div key={c.id} style={{ display: 'flex', justify: 'space-between', padding: '16px', backgroundColor: '#1A1A1A', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.2)' }}>
                          <div>
                            <strong style={{ color: 'white' }}>{c.name}</strong>
                            {c.bookingDetails && <span style={{ display: 'block', fontSize: '0.72rem', color: '#BFA6D8', marginTop: '4px' }}>Date: {c.bookingDetails.date} @ {c.bookingDetails.time}</span>}
                          </div>
                          <strong>R {c.price.toFixed(2)}</strong>
                        </div>
                      ))}
                    </div>

                    <div className="psych-badge" style={{ alignSelf: 'center', width: '100%', justifyContent: 'center' }}>
                      ⚠️ Cart Scarcity Alert: Booking slots are selling out! Settle invoice checkout inside 3 minutes to secure free VIP Glow points upgrades.
                    </div>

                    <div style={{ display: 'flex', justify: 'space-between', borderTop: '1px solid rgba(107, 44, 145, 0.2)', paddingTop: '16px' }}>
                      <span>Subtotal:</span>
                      <strong style={{ fontSize: '1.25rem', color: '#D4AF37' }}>R {cart.reduce((acc, c) => acc + c.price, 0).toFixed(2)}</strong>
                    </div>

                    <button onClick={() => setCheckoutStep('billing')} className="btn-brand-gold" style={{ width: '100%', justifyContent: 'center' }}>Settle Checkout Info</button>
                  </>
                )}
              </div>
            )}

            {checkoutStep === 'billing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '500px', margin: '0 auto' }}>
                <h3 style={{ fontFamily: 'Outfit', color: 'white' }}>Checkout Particulars</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input type="text" placeholder="Full Name" className="brand-input" value={billingDetails.name} onChange={(e) => setBillingDetails(prev => ({ ...prev, name: e.target.value }))} />
                  <input type="text" placeholder="Contact Phone" className="brand-input" value={billingDetails.phone} onChange={(e) => setBillingDetails(prev => ({ ...prev, phone: e.target.value }))} />
                  <input type="email" placeholder="Email Address" className="brand-input" value={billingDetails.email} onChange={(e) => setBillingDetails(prev => ({ ...prev, email: e.target.value }))} />
                  <input type="text" placeholder="Shipping Address (for retail products)" className="brand-input" value={billingDetails.shipping} onChange={(e) => setBillingDetails(prev => ({ ...prev, shipping: e.target.value }))} />
                </div>
                <button onClick={handleCartCheckoutSubmit} className="btn-brand-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>🚀 Confirm Payment & Settle Slot</button>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '40px', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(52, 211, 153, 0.1)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle style={{ width: '36px', height: '36px' }} />
                </div>
                <h2 style={{ color: '#D4AF37', fontFamily: 'Outfit' }}>Checkout Victory Completed!</h2>
                <p style={{ fontSize: '0.9rem', color: '#A89684', maxWidth: '500px', lineHeight: '1.5' }}>
                  Thank you! Your transaction settled successfully. Your **Glow Points** rewards balance is updated. Check your smartphone client app to track your measurements!
                </p>
                <button onClick={() => setActiveTab('home')} className="btn-brand-purple">Return Home</button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* MODAL: WEBSITE BOOKING SLOTS CALENDAR DIALOGUE */}
      {showWebsiteBookingModal && websiteSelectedService && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '400px' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#D4AF37', marginBottom: '16px' }}>Select Booking Date & Time</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'white' }}>{websiteSelectedService.name}</strong>
                <span style={{ display: 'block', fontSize: '0.78rem', color: '#D4AF37', marginTop: '2px' }}>Fee: R {websiteSelectedService.price}</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Date:</label>
                <input
                  type="date"
                  className="brand-input"
                  value={websiteBookingDate}
                  onChange={(e) => setWebsiteBookingDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#A89684', marginBottom: '6px' }}>Select Available Slot:</label>
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

      {/* RENDER EXPLOSION CONFETTI PARTICLES */}
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
