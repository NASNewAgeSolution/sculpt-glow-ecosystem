import React, { useState, useEffect } from 'react';
import { Download, Award, Shield, CheckCircle, Scale, Calendar, AlertTriangle, ArrowRight, User, Settings, Lock } from 'lucide-react';
import { getTable, redeemGlowPoints, addClientWeightLog, updateAppointmentStatus, logAction } from '../db/stateEngine';

export default function MobileClientApp() {
  const [appCurrentClient, setAppCurrentClient] = useState('cli-101'); // logged in as Alice Smith
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  
  // App Forms
  const [measurementForm, setMeasurementForm] = useState({ weight: '', waist: '', hips: '' });
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [activeScreen, setActiveScreen] = useState('profile'); // profile, schedule, progress, shop

  const syncApp = () => {
    setClients(getTable('clients'));
    setAppointments(getTable('appointments'));
    setServices(getTable('services'));
  };

  useEffect(() => {
    syncApp();
    const handleSync = () => syncApp();
    window.addEventListener('salon_db_sync', handleSync);
    return () => window.removeEventListener('salon_db_sync', handleSync);
  }, []);

  const activeClientProfile = clients.find(c => c.id === appCurrentClient) || clients[0];
  const clientBookings = appointments.filter(a => a.clientId === appCurrentClient);

  const handleAppSubmitMeasurements = (e) => {
    e.preventDefault();
    if (!measurementForm.weight) return;
    
    addClientWeightLog('Mobile Client App', appCurrentClient, {
      weight: Number(measurementForm.weight),
      waist: Number(measurementForm.waist) || 0,
      hips: Number(measurementForm.hips) || 0
    });
    
    setMeasurementForm({ weight: '', waist: '', hips: '' });
    syncApp();
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#111827', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justify: 'center', padding: '40px',
      boxSizing: 'border-box'
    }}>
      
      {/* Visual Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit', margin: 0 }}>SCULPT & GLOW APP</h1>
        <span style={{ fontSize: '0.78rem', color: '#BFA6D8' }}>Standalone Client Mobile Interface</span>
      </div>

      {/* iPhone CSS Frame Chassis */}
      <div className="iphone-emulator">
        <div className="iphone-notch" />
        <div className="iphone-screen" style={{ display: 'flex', flexDirection: 'column', justify: 'space-between', padding: '40px 0 0 0' }}>
          
          {/* Top Notch App Header Bar */}
          <div style={{
            display: 'flex', justify: 'space-between', alignItems: 'center',
            padding: '12px 16px', borderBottom: '1px solid rgba(107, 44, 145, 0.25)',
            backgroundColor: '#1A1A1A'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <img src="/logo.jpg" style={{ width: '22px', height: '22px', borderRadius: '50%', border: '1px solid #D4AF37' }} alt="S&G Logo" />
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white', fontFamily: 'Outfit' }}>Sculpt App</span>
            </div>
            
            <button
              onClick={() => setShowFlyerModal(true)}
              style={{ backgroundColor: '#D4AF37', color: 'black', border: 'none', borderRadius: '4px', fontSize: '0.55rem', fontWeight: 700, padding: '3px 6px', cursor: 'pointer' }}
            >
              Rewards Club
            </button>
          </div>

          {/* APP CANVAS SCREEN */}
          <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* RENDER PROFILE SCREEN */}
            {activeScreen === 'profile' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                
                {/* Client Avatar banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#1A1A1A', padding: '12px', borderRadius: '12px', border: '1px solid rgba(107, 44, 145, 0.2)' }}>
                  <img src={activeClientProfile?.profilePhoto} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} alt={activeClientProfile?.name} />
                  <div>
                    <strong style={{ fontSize: '0.82rem', display: 'block', color: 'white' }}>{activeClientProfile?.name}</strong>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                      <span className="badge-brand gold" style={{ fontSize: '0.52rem', padding: '2px 4px' }}>VIP: {activeClientProfile?.vipTier}</span>
                      <span className="badge-brand purple" style={{ fontSize: '0.52rem', padding: '2px 4px' }}>⚡ {activeClientProfile?.loyaltyPoints} Glow Points</span>
                    </div>
                  </div>
                </div>

                {/* Redeem Points list */}
                <div style={{ backgroundColor: 'rgba(46, 13, 61, 0.3)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                  <strong style={{ fontSize: '0.78rem', display: 'block', color: '#D4AF37', marginBottom: '8px' }}>Redeem Glow Points Vouchers</strong>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                      { name: 'EMS Pads Session Add-On', pts: 30 },
                      { name: 'Complimentary Body Roll Session', pts: 60 },
                      { name: 'Complimentary Vacutherm Session', pts: 80 },
                      { name: 'R500 Studio Credit Voucher', pts: 100 }
                    ].map((reward, idx) => (
                      <div key={idx} style={{ display: 'flex', justify: 'space-between', alignItems: 'center', fontSize: '0.68rem', backgroundColor: '#0D0D0D', padding: '8px 10px', borderRadius: '8px' }}>
                        <span style={{ color: 'white' }}>{reward.name}</span>
                        <button
                          onClick={() => {
                            const res = redeemGlowPoints('Mobile Client App', appCurrentClient, reward.pts, reward.name);
                            if (!res.success) {
                              alert(`App Claim Alarm:\n\n${res.error}`);
                            } else {
                              alert(`Voucher claimed successfully: ${reward.name}! Duplicates saved in your profile.`);
                              syncApp();
                            }
                          }}
                          style={{ border: 'none', backgroundColor: 'hsl(var(--brand-purple))', color: 'white', fontSize: '0.58rem', padding: '3px 6px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Redeem ({reward.pts}p)
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specials promo banner */}
                <div style={{
                  backgroundImage: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url('/cover.jpg')",
                  backgroundSize: 'cover', backgroundPosition: 'center', padding: '16px', borderRadius: '12px',
                  border: '1px solid rgba(107, 44, 145, 0.2)', minHeight: '80px', display: 'flex', flexDirection: 'column', justify: 'flex-end'
                }}>
                  <strong style={{ fontSize: '0.78rem', color: '#D4AF37', display: 'block' }}>Roster Specials Promotion</strong>
                  <span style={{ fontSize: '0.62rem', color: '#F5EFE6', display: 'block', marginTop: '2px' }}>Book 5 Korean Corrective Peels over next 5 months and unlock R1000 cashback credit!</span>
                </div>

              </div>
            )}

            {/* RENDER SCHEDULER ACTIVE LIST */}
            {activeScreen === 'schedule' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                <strong style={{ fontSize: '0.8rem', display: 'block', color: 'white' }}>My Active Appointments Schedule</strong>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {clientBookings.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed rgba(107, 44, 145, 0.2)', borderRadius: '10px', color: '#A89684', fontSize: '0.72rem' }}>No active bookings on roster.</div>
                  ) : (
                    clientBookings.map(apt => {
                      const service = services.find(s => s.id === apt.serviceId);
                      return (
                        <div key={apt.id} style={{ padding: '10px', backgroundColor: '#1A1A1A', borderRadius: '10px', border: '1px solid rgba(107, 44, 145, 0.2)', fontSize: '0.7rem' }}>
                          <div style={{ display: 'flex', justify: 'space-between', marginBottom: '4px' }}>
                            <strong style={{ color: 'white' }}>{service?.name}</strong>
                            <span className={`badge-brand ${apt.status.toLowerCase()}`} style={{ fontSize: '0.52rem', padding: '2px 4px' }}>{apt.status}</span>
                          </div>
                          <span style={{ color: '#BFA6D8' }}>Date: {apt.date} at {apt.time}</span>
                          <span style={{ display: 'block', color: '#A89684', marginTop: '2px' }}>Room: {apt.room}</span>
                          
                          {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '8px', borderTop: '1px solid rgba(107, 44, 145, 0.15)', paddingTop: '8px' }}>
                              <button
                                onClick={() => {
                                  updateAppointmentStatus('Mobile Client App', apt.id, 'Cancelled');
                                  syncApp();
                                  logAction('Mobile App Operator', 'Cancel Reservation', `Client self-cancelled booking slot for date ${apt.date}.`);
                                }}
                                style={{ flex: 1, border: 'none', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontSize: '0.58rem', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Cancel Booking
                              </button>
                              <button
                                onClick={() => {
                                  const newDate = prompt(`Enter reschedule date (YYYY-MM-DD):`, apt.date);
                                  if (newDate) {
                                    // Reschedule updates status to Pending or Confirmed
                                    updateAppointmentStatus('Mobile Client App', apt.id, 'Pending');
                                    // We can update the date in localStorage in database helper or simulate it
                                    const appointmentsTable = getTable('appointments');
                                    const aIdx = appointmentsTable.findIndex(a => a.id === apt.id);
                                    if (aIdx !== -1) {
                                      appointmentsTable[aIdx].date = newDate;
                                      saveTable('appointments', appointmentsTable);
                                      logAction('Mobile App Operator', 'Reschedule Slot', `Client rescheduled booking ID ${apt.id} to new date ${newDate}`);
                                    }
                                    syncApp();
                                  }
                                }}
                                style={{ flex: 1, border: 'none', backgroundColor: '#D4AF371a', color: '#D4AF37', fontSize: '0.58rem', padding: '4px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                              >
                                Reschedule
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* RENDER PROGRESS WEIGHTS LOGS */}
            {activeScreen === 'progress' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="animate-fade-in">
                <strong style={{ fontSize: '0.8rem', display: 'block', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}><Scale style={{ width: '14px', height: '14px', color: '#D4AF37' }} /> Body shaping metrics log</strong>

                <form onSubmit={handleAppSubmitMeasurements} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                  <input type="number" placeholder="Weight kg" className="brand-input" style={{ fontSize: '0.65rem', padding: '6px' }} value={measurementForm.weight} onChange={(e) => setMeasurementForm(prev => ({ ...prev, weight: e.target.value }))} />
                  <input type="number" placeholder="Waist cm" className="brand-input" style={{ fontSize: '0.65rem', padding: '6px' }} value={measurementForm.waist} onChange={(e) => setMeasurementForm(prev => ({ ...prev, waist: e.target.value }))} />
                  <input type="number" placeholder="Hips cm" className="brand-input" style={{ fontSize: '0.65rem', padding: '6px' }} value={measurementForm.hips} onChange={(e) => setMeasurementForm(prev => ({ ...prev, hips: e.target.value }))} />
                  <button type="submit" className="btn-brand-gold" style={{ gridColumn: 'span 3', padding: '6px', fontSize: '0.7rem', justifyContent: 'center' }}>+ Record Metrics</button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {activeClientProfile?.weightLogs?.map((wl, i) => (
                    <div key={i} style={{ display: 'flex', justify: 'space-between', backgroundColor: '#1A1A1A', padding: '8px 10px', borderRadius: '8px', fontSize: '0.68rem', color: '#F5EFE6', border: '1px solid rgba(107, 44, 145, 0.15)' }}>
                      <strong>{wl.date}</strong>
                      <span style={{ color: '#D4AF37' }}>{wl.weight} kg</span>
                      <span style={{ color: '#BFA6D8' }}>W: {wl.waist}cm | H: {wl.hips}cm</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Smart iPhone Bottom Nav Tab Bar */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            backgroundColor: '#1A1A1A', borderTop: '1px solid rgba(107, 44, 145, 0.25)',
            padding: '10px 0'
          }}>
            {[
              { id: 'profile', label: 'Loyalty Ring', icon: Award },
              { id: 'schedule', label: 'My Bookings', icon: Calendar },
              { id: 'progress', label: 'Scale Logs', icon: Scale }
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
                  <TabIcon style={{ width: '18px', height: '18px' }} />
                  <span style={{ fontSize: '0.58rem', fontWeight: 600 }}>{tabItem.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </div>

      {/* FLYER IMAGE MODAL POPUP */}
      {showFlyerModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100000 }}>
          <div className="card-premium animate-fade-in" style={{ width: '480px', maxHeight: '90%', overflowY: 'auto' }}>
            <h3 style={{ fontFamily: 'Outfit', color: 'hsl(var(--brand-gold))', marginBottom: '14px', textAlign: 'center' }}>Glow Points Rewards Club</h3>
            <img src="/flyer.jpg" style={{ width: '100%', borderRadius: '12px', border: '1px solid hsl(var(--brand-purple))' }} alt="Flyer" />
            <button onClick={() => setShowFlyerModal(false)} className="btn-brand-gold" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>Close Flyer view</button>
          </div>
        </div>
      )}

    </div>
  );
}
