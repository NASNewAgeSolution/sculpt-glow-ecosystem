// Seed data for the Sculpt & Glow Wellness Ecosystem.
// All values are configured to match official services, weight loss/facial products, and South African Rand currency.

export const initialUsers = [
  { id: 'usr-1', username: 'owner', name: 'Victoria Owner', role: 'owner', email: 'owner@sculptglow.co.za', pin: '1234' },
  { id: 'usr-2', username: 'reception', name: 'Sarah Desk', role: 'receptionist', email: 'reception@sculptglow.co.za', pin: '5678' },
  { id: 'usr-3', username: 'therapist', name: 'Jessica Laser', role: 'therapist', email: 'jessica@sculptglow.co.za', pin: '9999' }
];

export const initialClients = [
  {
    id: 'cli-101',
    name: 'Alice Smith',
    email: 'alice.smith@gmail.com',
    phone: '+27 (82) 019-2834',
    dob: '1990-06-15',
    gender: 'Female',
    allergies: 'Lanolin, Peanuts',
    medical: 'Sensitive skin prone to redness',
    preferredStaff: 'Jessica Laser',
    loyaltyPoints: 34, // 34 points = R3,400 spent
    vipTier: 'Silver',
    notes: 'Prefers lukewarm towels. Doing the Postpartum body rest program.',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    weightLogs: [
      { date: '2026-05-01', weight: 68.5, waist: 78, hips: 98, photo: '/cover.jpg' },
      { date: '2026-05-15', weight: 66.8, waist: 76, hips: 96, photo: '/logo.jpg' }
    ]
  },
  {
    id: 'cli-102',
    name: 'Catherine Du Pont',
    email: 'catherine.dp@hotmail.com',
    phone: '+27 (71) 022-7711',
    dob: '1995-02-10',
    gender: 'Female',
    allergies: 'Penicillin, Lavender',
    medical: 'None',
    preferredStaff: 'Jessica Laser',
    loyaltyPoints: 62, // 62 points = R6,200 spent (Eligible for Body Roll session)
    vipTier: 'Gold',
    notes: 'A regular member. Loves Cryo Fat Freezing and Korean Corrective Facials.',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    weightLogs: [
      { date: '2026-05-10', weight: 62.0, waist: 70, hips: 90, photo: '/cover.jpg' }
    ]
  }
];

export const initialServices = [
  {
    id: 'srv-1',
    name: 'Vacutherm Treadmill Session',
    description: 'Infrared and vacuum cardio technology designed to accelerate weight loss and fat burning.',
    category: 'Body Contouring',
    duration: 30,
    price: 450.00,
    vat: 15.00,
    requiredMachine: 'vacutherm-alpha',
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-3', quantity: 2 }] // Wipes
  },
  {
    id: 'srv-2',
    name: 'Infrared Body Roll Session',
    description: 'Deep tissue lymphatic drainage roll stimulation using therapeutic infrared heat.',
    category: 'Drainage & Recovery',
    duration: 45,
    price: 350.00,
    vat: 15.00,
    requiredMachine: 'body-roller-1',
    requiredStaffType: 'receptionist',
    consumables: [{ itemId: 'inv-3', quantity: 1 }]
  },
  {
    id: 'srv-3',
    name: 'Cavitation Body Sculpting',
    description: 'Non-invasive ultrasonic fat reduction therapy that targets obstinate fat cells.',
    category: 'Body Contouring',
    duration: 45,
    price: 950.00,
    vat: 15.00,
    requiredMachine: 'rf-cavitation-unit',
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-1', quantity: 50 }, { itemId: 'inv-2', quantity: 2 }] // Gel + Gloves
  },
  {
    id: 'srv-4',
    name: 'Radio Frequency Skin Tightening',
    description: 'Advanced collagen-stimulating RF wave frequencies to tighten loose and sagging tissue.',
    category: 'Body Contouring',
    duration: 30,
    price: 850.00,
    vat: 15.00,
    requiredMachine: 'rf-cavitation-unit',
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-1', quantity: 30 }, { itemId: 'inv-2', quantity: 2 }]
  },
  {
    id: 'srv-5',
    name: 'Vacuum RF Contouring',
    description: 'Powerful deep vacuum suction combined with RF heat waves to remodel body curves.',
    category: 'Body Contouring',
    duration: 45,
    price: 800.00,
    vat: 15.00,
    requiredMachine: 'rf-cavitation-unit',
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-1', quantity: 40 }, { itemId: 'inv-2', quantity: 2 }]
  },
  {
    id: 'srv-6',
    name: 'Cryo Angel 360 Fat Freezing',
    description: 'Controlled cold thermal fat crystallization system to eliminate obstinate bulge volumes.',
    category: 'Body Contouring',
    duration: 60,
    price: 1800.00,
    vat: 15.00,
    requiredMachine: 'cryo-angel-360',
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-2', quantity: 2 }, { itemId: 'inv-3', quantity: 2 }]
  },
  {
    id: 'srv-7',
    name: 'Lymphatic Drainage Therapy',
    description: 'Soothing therapist-led manual circulatory and lymphatic stimulation to detoxify.',
    category: 'Drainage & Recovery',
    duration: 60,
    price: 600.00,
    vat: 15.00,
    requiredMachine: null,
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-6', quantity: 30 }] // Massage oil
  },
  {
    id: 'srv-8',
    name: 'Detox & Recovery Session',
    description: 'Thermal wrap detoxification session designed to speed metabolism and reduce bloat.',
    category: 'Drainage & Recovery',
    duration: 45,
    price: 500.00,
    vat: 15.00,
    requiredMachine: null,
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-3', quantity: 2 }]
  },
  {
    id: 'srv-9',
    name: 'Postpartum Body Reset Program',
    description: 'Custom bundle combining vacuum RF contouring and targeted lymphatic rollers to restore muscles.',
    category: 'Wellness Packages',
    duration: 90,
    price: 2400.00,
    vat: 15.00,
    requiredMachine: 'vacutherm-alpha',
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-1', quantity: 50 }, { itemId: 'inv-2', quantity: 4 }]
  },
  {
    id: 'srv-10',
    name: 'Advance Skin Analysis Consultation',
    description: 'Dermatological camera magnification analysis to map custom corrective facial formulations.',
    category: 'Facials & Wellness',
    duration: 30,
    price: 350.00,
    requiredMachine: null,
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-3', quantity: 2 }]
  },
  {
    id: 'srv-11',
    name: 'Korean Corrective Facial',
    description: 'Exclusive state-of-the-art Korean glass-skin corrective facial peeling and serum infusions.',
    category: 'Facials & Wellness',
    duration: 60,
    price: 950.00,
    vat: 15.00,
    requiredMachine: null,
    requiredStaffType: 'therapist',
    consumables: [{ itemId: 'inv-4', quantity: 1 }, { itemId: 'inv-2', quantity: 2 }] // Serum + Gloves
  },
  {
    id: 'srv-12',
    name: 'Full 3-in-1 Roster (Nails, Hair, Feet)',
    description: 'Ultimate pampering combo session: luxury hair wash & blowout, custom manicure, and pedicure.',
    category: 'Hair & Beauty',
    duration: 120,
    price: 850.00,
    vat: 15.00,
    requiredMachine: null,
    requiredStaffType: 'receptionist',
    consumables: [{ itemId: 'inv-5', quantity: 1 }, { itemId: 'inv-3', quantity: 4 }]
  }
];

export const initialInventory = [
  { id: 'inv-1', name: 'Premium Ultrasonic Gel', quantity: 2400, alertAt: 500, unit: 'ml', cost: 0.05, sellPrice: 0, supplier: 'Sculpt-Supplies South Africa' },
  { id: 'inv-2', name: 'Disposable Vinyl Gloves (Box 100)', quantity: 92, alertAt: 20, unit: 'box', cost: 120.00, sellPrice: 0, supplier: 'Medical-Direct SA' },
  { id: 'inv-3', name: 'Alcohol Disinfectant Wipes', quantity: 150, alertAt: 30, unit: 'pack', cost: 65.00, sellPrice: 0, supplier: 'Medical-Direct SA' },
  { id: 'inv-4', name: 'Korean Corrective Glass-Skin Ampoule', quantity: 12, alertAt: 3, unit: 'vial', cost: 220.00, sellPrice: 450.00, supplier: 'Seoul Cosmetics Ltd' },
  { id: 'inv-5', name: 'Luxury Gel Polish (OPI Gelcolor)', quantity: 18, alertAt: 5, unit: 'bottle', cost: 180.00, sellPrice: 280.00, supplier: 'Nail-Tech Distributors' },
  { id: 'inv-6', name: 'Natural Detox Aromatherapy Oil', quantity: 850, alertAt: 200, unit: 'ml', cost: 0.20, sellPrice: 0, supplier: 'Escentia Essential Oils' }
];

export const initialProducts = [
  {
    id: 'prd-1',
    name: 'Korean Glow Daily Cleanser',
    category: 'Facial Products',
    price: 320.00,
    stock: 15,
    image: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=300',
    description: 'High-end foaming cleanser containing green tea extracts and centella for ultimate skin glass glow.'
  },
  {
    id: 'prd-2',
    name: 'Sculpt & Slim Thermogenic Gel',
    category: 'Weight Loss Products',
    price: 480.00,
    stock: 24,
    image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=300',
    description: 'Sweat-inducing thermogenic gel infused with ginger extracts and L-Carnitine to target stubborn curves.'
  },
  {
    id: 'prd-3',
    name: 'Korean Corrective Peptide Serum',
    category: 'Facial Products',
    price: 750.00,
    stock: 8,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300',
    description: 'Seoul corrective peptide matrix serum. Minimizes micro-wrinkles and restores youthful elasticity.'
  },
  {
    id: 'prd-4',
    name: 'Sculpt & Glow Detox Shake (Vanilla)',
    category: 'Weight Loss Products',
    price: 550.00,
    stock: 18,
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300',
    description: 'High-protein, low-carb meal replacement shake packed with prebiotics and vital thermogenics.'
  },
  {
    id: 'prd-5',
    name: 'Cellulite & Lymphatic Drain Cream',
    category: 'Weight Loss Products',
    price: 380.00,
    stock: 30,
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=300',
    description: 'Rich therapeutic cream supporting Roll Sessions to flush water rent and smooth skin textures.'
  }
];

export const initialMachines = [
  {
    id: 'vacutherm-alpha',
    name: 'Vacutherm Treadmill Pro',
    serial: 'VT-990-X',
    purchaseDate: '2025-02-15',
    warrantyExpiry: '2027-02-15',
    serviceInterval: 100, // hrs
    currentStatus: 'Available',
    totalUsageHours: 42.5,
    purchaseCost: 280000.00, // ROI Math: Machine Cost
    revenueGenerated: 19125.00
  },
  {
    id: 'body-roller-1',
    name: 'Infrared Lymphatic Roller 1',
    serial: 'IR-882-M',
    purchaseDate: '2025-06-10',
    warrantyExpiry: '2026-06-10',
    serviceInterval: 150,
    currentStatus: 'Available',
    totalUsageHours: 124.0,
    purchaseCost: 85000.00,
    revenueGenerated: 43400.00
  },
  {
    id: 'rf-cavitation-unit',
    name: '3-in-1 RF Cavitation Sculptor',
    serial: 'RF-441-Y',
    purchaseDate: '2025-11-01',
    warrantyExpiry: '2026-11-01',
    serviceInterval: 80,
    currentStatus: 'Available',
    totalUsageHours: 68.0,
    purchaseCost: 120000.00,
    revenueGenerated: 64600.00
  },
  {
    id: 'cryo-angel-360',
    name: 'Cryo Angel 360 Fat Freezer',
    serial: 'CA-360-Z',
    purchaseDate: '2025-08-20',
    warrantyExpiry: '2027-08-20',
    serviceInterval: 120,
    currentStatus: 'Available',
    totalUsageHours: 32.0,
    purchaseCost: 195000.00,
    revenueGenerated: 57600.00
  }
];

export const initialAppointments = [
  {
    id: 'apt-201',
    clientId: 'cli-101',
    serviceId: 'srv-1', // Vacutherm
    staffId: 'usr-3', // Jessica
    room: 'Treatment Room 1',
    machineId: 'vacutherm-alpha',
    date: '2026-05-30',
    time: '10:00',
    duration: 30,
    status: 'Completed',
    notes: 'Alice completed her treadmill cardio. Redness normal, sweated heavily.'
  },
  {
    id: 'apt-202',
    clientId: 'cli-102',
    serviceId: 'srv-6', // Cryo Fat Freezing
    staffId: 'usr-3', // Jessica
    room: 'Treatment Room 2',
    machineId: 'cryo-angel-360',
    date: '2026-05-30',
    time: '11:30',
    duration: 60,
    status: 'Completed',
    notes: 'Cryo target area: Abdomen lower. Crystallized smoothly.'
  },
  {
    id: 'apt-203',
    clientId: 'cli-101',
    serviceId: 'srv-11', // Korean corrective facial
    staffId: 'usr-3',
    room: 'Treatment Room 1',
    machineId: null,
    date: '2026-05-30',
    time: '14:00',
    duration: 60,
    status: 'In-progress',
    notes: 'Korean peeling applied. Patient relaxing under peptide repair.'
  }
];

export const initialInvoices = [
  {
    id: 'inv-5001',
    invoiceNumber: 'INV-2026-0001',
    appointmentId: 'apt-201',
    clientId: 'cli-101',
    date: '2026-05-30',
    dueDate: '2026-05-30',
    items: [
      { name: 'Vacutherm Treadmill Session [Service]', quantity: 1, price: 450.00, taxRate: 15 }
    ],
    subtotal: 391.30,
    tax: 58.70,
    discount: 0.00,
    total: 450.00,
    payments: [
      { date: '2026-05-30', amount: 450.00, method: 'Card', txnId: 'TXN-90211' }
    ],
    status: 'Paid',
    refundReason: ''
  },
  {
    id: 'inv-5002',
    invoiceNumber: 'INV-2026-0002',
    appointmentId: 'apt-202',
    clientId: 'cli-102',
    date: '2026-05-30',
    dueDate: '2026-05-30',
    items: [
      { name: 'Cryo Angel 360 Fat Freezing [Service]', quantity: 1, price: 1800.00, taxRate: 15 }
    ],
    subtotal: 1565.22,
    tax: 234.78,
    discount: 0.00,
    total: 1800.00,
    payments: [
      { date: '2026-05-30', amount: 1800.00, method: 'EFT', txnId: 'TXN-55442' }
    ],
    status: 'Paid',
    refundReason: ''
  }
];

export const initialExpenses = [
  { id: 'exp-1', category: 'Stock Purchases', description: 'Korean ampoules replenishment box', amount: 2600.00, date: '2026-05-02' },
  { id: 'exp-2', category: 'Rent', description: 'Studio Pretoria East monthly rental', amount: 12000.00, date: '2026-05-01' },
  { id: 'exp-3', category: 'Salaries', description: 'Therapist Jessica May salary', amount: 8500.00, date: '2026-05-01' }
];

export const initialStaffShifts = [
  { id: 'shf-1', staffId: 'usr-3', date: '2026-05-30', startTime: '09:00', endTime: '18:00', type: 'Shift', isLeave: false },
  { id: 'shf-2', staffId: 'usr-2', date: '2026-05-30', startTime: '08:00', endTime: '17:00', type: 'Shift', isLeave: false },
  { id: 'shf-3', staffId: 'usr-1', date: '2026-05-30', startTime: '09:00', endTime: '18:00', type: 'Shift', isLeave: false }
];

export const initialAuditLogs = [
  { id: 'log-1', username: 'SaaS Platform Technician', timestamp: '2026-05-30T08:00:00Z', action: 'System Init', details: 'Sculpt & Glow custom portal generated successfully.', prevValue: '', newValue: '' }
];

export const initialSettings = {
  salonName: 'Sculpt & Glow Body shaping and Wellness Studio',
  phone: '+27 (12) 998-2020',
  email: 'info@sculptglow.co.za',
  address: 'Shop 5, Glenwood Galleria, Garstfontein Rd, Pretoria East',
  vatRate: 15, // South African VAT is 15%
  currency: 'R',
  hours: {
    weekdayStart: '08:00',
    weekdayEnd: '18:00',
    weekendStart: '09:00',
    weekendEnd: '14:00'
  },
  smsTemplate: 'Hi {client}, ready to get sculpted? Reminder for your {service} at Sculpt & Glow Pretoria East on {date} at {time}.',
  emailTemplate: 'Dear {client},\n\nWe look forward to hosting you for your scheduled wellness treatment {service} on {date} at {time}.\n\nRemember to wear comfortable activewear for infrared roll/cardio sessions.\n\nWarm regards,\nSculpt & Glow'
};

export const initialQuotes = [
  {
    id: 'qte-801',
    quoteNumber: 'QTE-2026-0001',
    clientId: 'cli-101',
    date: '2026-05-30',
    expiryDate: '2026-06-30',
    items: [
      { name: 'Korean Corrective Facial [Service]', quantity: 1, price: 950.00 },
      { name: 'Korean Glow Daily Cleanser [Product]', quantity: 1, price: 320.00 }
    ],
    discount: 50.00,
    total: 1220.00,
    status: 'Active'
  }
];

