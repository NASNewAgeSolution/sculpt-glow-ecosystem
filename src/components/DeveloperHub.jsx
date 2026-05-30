import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, Layers, Smartphone, DollarSign, Database, CheckCircle, Clock } from 'lucide-react';
import { logAction, getTable } from '../db/stateEngine';

export default function DeveloperHub() {
  const [rentStatus, setRentStatus] = useState('Paid');
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ bookings: 0, clients: 0, products: 0 });

  // Sync parameters
  useEffect(() => {
    // Load remote lock state
    const locked = localStorage.getItem('saas_lock') === 'true';
    setRentStatus(locked ? 'Suspended' : 'Paid');

    // Load active logs and stats
    setLogs(getTable('auditLogs').slice(0, 5));
    setStats({
      bookings: getTable('appointments').length,
      clients: getTable('clients').length,
      products: getTable('products').length
    });

    const handleSync = () => {
      setLogs(getTable('auditLogs').slice(0, 5));
      setStats({
        bookings: getTable('appointments').length,
        clients: getTable('clients').length,
        products: getTable('products').length
      });
    };
    window.addEventListener('salon_db_sync', handleSync);
    return () => window.removeEventListener('salon_db_sync', handleSync);
  }, []);

  const handleToggleLock = (newStatus) => {
    setRentStatus(newStatus);
    localStorage.setItem('saas_lock', newStatus === 'Suspended' ? 'true' : 'false');
    logAction('SaaS Provider Tech', newStatus === 'Suspended' ? 'Suspend Account' : 'Restore Subscription', 
      newStatus === 'Suspended' ? 'Rental payment overdue warning! Internal receptionist CRM locked.' : 'Owner rent paid. Internal receptionist CRM unlocked.'
    );
  };

  const handleNavigate = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: 'hsl(var(--brand-black))', color: 'hsl(var(--brand-cream))',
      display: 'flex', flexDirection: 'column', padding: '40px', boxSizing: 'border-box',
      backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(46, 13, 61, 0.25) 0%, transparent 40%)'
    }}>
      
      {/* HEADER LOGO */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'hsl(var(--brand-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid hsl(var(--brand-gold))' }}>
          <Layers style={{ color: 'hsl(var(--brand-gold))', width: '24px', height: '24px' }} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'white' }}>ELYSIUM SAAS</h1>
          <span style={{ fontSize: '0.72rem', tracking: '0.1em', textTransform: 'uppercase', color: 'hsl(var(--brand-gold))', fontWeight: 700 }}>Workspace Control Hub</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
        
        {/* PLATFORM LINKS GRID */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card-premium">
            <h2 style={{ fontSize: '1.35rem', fontFamily: 'Outfit', color: 'white', marginBottom: '8px' }}>Launch Standalone Applications</h2>
            <p style={{ fontSize: '0.88rem', color: 'hsl(var(--brand-taupe))', marginBottom: '24px' }}>
              These three independent portals are fully full-screen and run on a live-synced local cloud simulator database.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* PLATFORM A: WEBSITE */}
              <button 
                onClick={() => handleNavigate('/website')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px',
                  backgroundColor: 'hsl(var(--brand-charcoal))', border: '1px solid hsl(var(--brand-purple) / 0.3)',
                  borderRadius: '16px', color: 'white', cursor: 'pointer', textAlign: 'left',
                  transition: 'var(--transition-smooth)'
                }}
                className="panel-premium"
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'hsl(var(--brand-gold) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers style={{ color: 'hsl(var(--brand-gold))', width: '22px', height: '22px' }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.05rem', display: 'block', color: 'white' }}>Standalone Customer Website</strong>
                    <span style={{ fontSize: '0.78rem', color: 'hsl(var(--brand-taupe))' }}>Browse treatments, shop facial/weight loss creams, contact Pretoria East, cart checkout glitter.</span>
                  </div>
                </div>
                <ArrowRight style={{ color: 'hsl(var(--brand-gold))' }} />
              </button>

              {/* PLATFORM B: internal CRM */}
              <button 
                onClick={() => handleNavigate('/crm')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px',
                  backgroundColor: 'hsl(var(--brand-charcoal))', border: '1px solid hsl(var(--brand-purple) / 0.3)',
                  borderRadius: '16px', color: 'white', cursor: 'pointer', textAlign: 'left',
                  transition: 'var(--transition-smooth)'
                }}
                className="panel-premium"
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'hsl(var(--brand-purple) / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database style={{ color: 'hsl(var(--brand-lilac))', width: '22px', height: '22px' }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.05rem', display: 'block', color: 'white' }}>Owner & Receptionist CRM Booking System</strong>
                    <span style={{ fontSize: '0.78rem', color: 'hsl(var(--brand-taupe))' }}>Smart calendar scheduler conflicts checker, stock reorder ledgers, therapist shift records.</span>
                  </div>
                </div>
                <ArrowRight style={{ color: 'hsl(var(--brand-lilac))' }} />
              </button>

              {/* PLATFORM C: CLIENT MOBILE APP */}
              <button 
                onClick={() => handleNavigate('/app')}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px',
                  backgroundColor: 'hsl(var(--brand-charcoal))', border: '1px solid hsl(var(--brand-purple) / 0.3)',
                  borderRadius: '16px', color: 'white', cursor: 'pointer', textAlign: 'left',
                  transition: 'var(--transition-smooth)'
                }}
                className="panel-premium"
              >
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: '#34d3991a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Smartphone style={{ color: '#34d399', width: '22px', height: '22px' }} />
                  </div>
                  <div>
                    <strong style={{ fontSize: '1.05rem', display: 'block', color: 'white' }}>Standalone Branded Smartphone App</strong>
                    <span style={{ fontSize: '0.78rem', color: 'hsl(var(--brand-taupe))' }}>Customer Glow Points ring progress, weight loss logs, waist measurements charts, promotions.</span>
                  </div>
                </div>
                <ArrowRight style={{ color: '#34d399' }} />
              </button>

            </div>
          </div>
        </div>

        {/* SAAS CONTROLLER PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Lock controller */}
          <div className="card-premium" style={{ border: '1px solid #ef44444d' }}>
            <h3 style={{ fontFamily: 'Outfit', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', margin: '0 0 12px 0' }}>
              <ShieldAlert style={{ width: '18px', height: '18px' }} /> Remote Lock Key
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'hsl(var(--brand-taupe))', lineHeight: '1.4', marginBottom: '16px' }}>
              Bypass default parameters to lock out the business owner from the CRM Dashboard on non-payment.
            </p>

            <div style={{ display: 'flex', backgroundColor: 'hsl(var(--brand-black))', padding: '4px', borderRadius: '10px', border: '1px solid hsl(var(--border-color))' }}>
              <button
                onClick={() => handleToggleLock('Paid')}
                style={{
                  flex: 1, backgroundColor: rentStatus === 'Paid' ? '#10b981' : 'transparent',
                  color: 'white', border: 'none', padding: '6px', fontSize: '0.75rem',
                  fontWeight: 700, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                Rent Paid
              </button>
              <button
                onClick={() => handleToggleLock('Suspended')}
                style={{
                  flex: 1, backgroundColor: rentStatus === 'Suspended' ? '#ef4444' : 'transparent',
                  color: 'white', border: 'none', padding: '6px', fontSize: '0.75rem',
                  fontWeight: 700, borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s'
                }}
              >
                Overdue (LOCK)
              </button>
            </div>
          </div>

          {/* Database stats */}
          <div className="card-premium">
            <h3 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', fontSize: '1rem', margin: '0 0 12px 0' }}>Ecosystem Database Stats</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '6px' }}>
                <span>Total Bookings:</span>
                <strong>{stats.bookings}</strong>
              </div>
              <div style={{ display: 'flex', justify: 'space-between', borderBottom: '1px solid hsl(var(--border-color))', paddingBottom: '6px' }}>
                <span>CRM Client Folders:</span>
                <strong>{stats.clients}</strong>
              </div>
              <div style={{ display: 'flex', justify: 'space-between' }}>
                <span>Active Retail Products:</span>
                <strong>{stats.products}</strong>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
