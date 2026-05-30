import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingCart, Phone, MapPin, Search, CheckCircle, 
  AlertTriangle, Download, ArrowRight, MessageSquare, 
  Sparkles, Menu, X, Star, CreditCard, Shield 
} from 'lucide-react';
import { getTable, addAppointment, addInvoice, addPaymentToInvoice, logAction } from '../db/stateEngine';

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

export default function ClientWebsite() {
  const [activeTab, setActiveTab] = useState('home');
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

    return () => {
      window.removeEventListener('salon_db_sync', handleSync);
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
            { id: 'products', label: 'Boutique' },
            { id: 'about', label: 'Philosophy' },
            { id: 'contact', label: 'Contact Us' },
            { id: 'app', label: 'The App' }
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

        {/* SUBTAB: DOWNLOAD MOBILE APP (Radial purple and gold visual showcase) */}
        {activeTab === 'app' && (
          <div style={{ 
            padding: '160px 8% 80px 8%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '60px', alignItems: 'center', background: 'linear-gradient(to top, #0D0D0D, #1A0A24)' 
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', letterSpacing: '3px', textTransform: 'uppercase', color: '#D4AF37', fontWeight: 600 }}>concierge on demand</span>
                <h2 className="font-luxury-serif" style={{ fontSize: '2.5rem', color: 'white', margin: '6px 0 0 0' }}>Luxury At Your Fingertips</h2>
              </div>
              
              <p style={{ color: '#A89684', fontSize: '0.9rem', lineHeight: '1.7', margin: 0 }}>
                The Sculpt & Glow Client App acts as your private digital gateway. Specially developed for our members to ensure complete schedule convenience and loyalty progression.
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Sparkles style={{ color: '#D4AF37', width: '16px', height: '16px' }} /> TRACK LOYALTY POINTS & REDEEM REWARDS</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Sparkles style={{ color: '#D4AF37', width: '16px', height: '16px' }} /> ORDER RETAIL PRODUCTS TO PRETORIA EAST</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Sparkles style={{ color: '#D4AF37', width: '16px', height: '16px' }} /> INSTANT BOOKING, RESCHEDULING & CANCELS</li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Sparkles style={{ color: '#D4AF37', width: '16px', height: '16px' }} /> LOG MEASUREMENTS & SCALE GOALS LIVE</li>
              </ul>

              <div style={{ display: 'flex', gap: '14px' }}>
                <button onClick={() => alert('iOS download fired!')} className="btn-luxury-gold"><Download style={{ width: '14px', height: '14px' }} /> App Store</button>
                <button onClick={() => alert('Android APK download fired!')} className="btn-luxury-purple"><Download style={{ width: '14px', height: '14px' }} /> Google Play</button>
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <img 
                src="/logo.jpg" 
                style={{ 
                  width: '260px', height: '260px', borderRadius: '50%', 
                  border: '3px solid #D4AF37', filter: 'drop-shadow(0 0 25px rgba(107, 44, 145, 0.7))',
                  animation: 'glitterFly 3s infinite alternate ease-in-out'
                }} 
                alt="Sculpt app logo" 
              />
            </div>
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
