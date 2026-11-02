/**
 * LJMU Clinical, Student Supervision & Commercial Booking Hub
 * Reactive Central State Store & Relational Seed Engine
 * Author: ONOUR IMPRAM VENTURES LTD (Company #17429906)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AppStore = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STORAGE_KEY = 'ljmu_hub_state_v4';
  const LEGACY_STORAGE_KEYS = ['ljmu_hub_state_v3_2', 'ljmu_hub_state_v3_1', 'ljmu_hub_state_v3', 'ljmu_hub_state_v2', 'ljmu_hub_state'];

  const INITIAL_PERSONAS = {
    student: {
      id: 'usr_stu_001',
      name: 'Alex Walker',
      role: 'student',
      title: 'Student Practitioner (Final-year)',
      program: 'Supervised clinical placement',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins',
      badgeClass: 'badge-student',
      bannerMsg: 'Notes require Supervisor Countersignature'
    },
    supervisor: {
      id: 'usr_sup_001',
      name: 'Dr. Sarah Jenkins',
      role: 'supervisor',
      title: 'Clinical Practice Educator',
      program: 'Faculty Clinical Lead, School of Sport & Exercise Sciences',
      maxStudentRatio: 4,
      badgeClass: 'badge-supervisor',
      bannerMsg: 'Clinical review and supervised learning'
    },
    manager: {
      id: 'usr_mgr_001',
      name: 'Marcus Vance',
      role: 'manager',
      title: 'Commercial & Lab Operations Manager',
      program: 'LJMU Performance Hub & Specialist Laboratories',
      badgeClass: 'badge-manager',
      bannerMsg: 'Commercial bookings and finance exports'
    },
    booker: {
      id: 'usr_bkr_001',
      name: 'David Miller',
      role: 'booker',
      title: 'Head Coach & Corporate Booker',
      organization: 'Riverside Athletics Club (fictional)',
      badgeClass: 'badge-booker',
      bannerMsg: 'Self-Service Booking & PO Checkout'
    }
  };

  const INITIAL_FACILITIES = [
    { id: 'rm_tr_g01', name: 'Teaching Clinic - Bay 1', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'osteopathy', status: 'occupied' },
    { id: 'rm_tr_g02', name: 'Teaching Clinic - Bay 2', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'physiotherapy', status: 'occupied' },
    { id: 'rm_tr_g03', name: 'Teaching Clinic - Bay 3', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'physiotherapy', status: 'occupied' },
    { id: 'rm_tr_g04', name: 'Teaching Clinic - Bay 4', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'osteopathy', status: 'available' },
    { id: 'rm_tr_biomech', name: 'Biomechanics Lab', campus: 'Reference campus', type: 'specialist_lab', capacity: 10, discipline: 'biomechanics', status: 'available' },
    { id: 'rm_tr_env', name: 'Environmental Hypoxia Chamber', campus: 'Reference campus', type: 'specialist_lab', capacity: 6, discipline: 'physiology', status: 'available' },
    { id: 'rm_tr_bodycomp', name: 'Body Composition Suite', campus: 'Reference campus', type: 'diagnostic_suite', capacity: 2, discipline: 'physiology', status: 'available' },
    { id: 'rm_ch_mov', name: 'S&C Movement Bay', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'sc', status: 'available' }
  ];

  const INITIAL_EQUIPMENT = [
    { id: 'eq_cpet_01', name: 'Portable CPET Cart #1', room: 'rm_tr_env', status: 'available', calibrationDue: '2026-12-15' },
    { id: 'eq_ecg_01', name: 'Schiller 12-Lead ECG Diagnostic System', room: 'rm_tr_g02', status: 'available', calibrationDue: '2027-01-10' },
    { id: 'eq_fd_01', name: 'ForceDecks Dual Wireless Force Plates', room: 'rm_ch_mov', status: 'available', calibrationDue: '2026-11-30' },
    { id: 'eq_us_01', name: '12-Lead ECG & Metabolic Cart', room: 'rm_tr_g03', status: 'maintenance_lock', calibrationDue: '2026-10-25' }
  ];

  const INITIAL_SUPERVISOR_ROSTER = [
    { id: 'sup_jenkins', name: 'Dr. Sarah Jenkins', maxRatio: 4, activeBays: 3, room: 'Teaching Clinic (demo)', disciplines: ['osteopathy', 'physiotherapy'] },
    { id: 'sup_davies', name: 'Dr. Mark Davies', maxRatio: 4, activeBays: 1, room: 'Physiology laboratory', disciplines: ['cardiovascular', 'physiology'] }
  ];

  const INITIAL_STUDENT_ROSTER = [
    { id: 'stu_walker', userId: 'usr_stu_001', busy: true, name: 'Alex Walker', year: 'Final-year', supervisorId: 'sup_jenkins', hoursLogged: 124, targetHours: 200, completedCases: 38 },
    { id: 'stu_patel', userId: 'usr_stu_002', busy: true, name: 'Priya Patel', year: 'Final-year', supervisorId: 'sup_jenkins', hoursLogged: 148, targetHours: 200, completedCases: 46 }
  ];

  INITIAL_STUDENT_ROSTER.push(
    { id: 'stu_reilly', userId: 'usr_stu_003', name: 'Jordan Reilly', year: 'Final-year', supervisorId: 'sup_jenkins', hoursLogged: 96, targetHours: 200, completedCases: 24 },
    { id: 'stu_morgan', userId: 'usr_stu_004', name: 'Sam Morgan', year: 'Final-year', supervisorId: 'sup_davies', hoursLogged: 84, targetHours: 200, completedCases: 21 }
  );

  const INITIAL_RECORDS = {
    osteopathy: {
      id: 'rec_2026_0812',
      patientId: 'pat_taylor',
      patientName: 'James Taylor',
      age: 28,
      gender: 'Male',
      dob: '1998-05-14',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-OST-2026-0812',
      discipline: 'osteopathy',
      disciplineTitle: 'Osteopathy Clinic',
      status: 'DRAFT: AWAITING SUPERVISOR COUNTERSIGNATURE',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Final-year Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins',
      encounterDate: '2026-10-31 14:15 GMT',
      subjective: 'Patient reports persistent right cervicothoracic pain radiating towards the right levator scapulae following extended workstation hours (approx 9h daily). Denies radicular numbness, tingling, or peripheral weakness. Red flags screened negative: no saddle anaesthesia, no bladder/bowel dysfunction, no unexplained night pain or weight loss.',
      objective: 'Cervical active rotation restricted to right (55 deg, normal 80 deg) with end-range pain. Somatic dysfunction detected at C5-C6 with facet joint restriction. Hypertonicity noted in right upper trapezius and levator scapulae. Negative Spurling test.',
      assessment: 'Mechanical cervicothoracic facet restriction with secondary postural myofascial tension (ICD-11: ME84.0).',
      studentDraftPlan: 'Patient reports intermittent sharp neck pain radiating to right shoulder. Plan: Perform cervical spine manipulation (C5-C6 HVLA thrust) and discharge with home exercise sheet.',
      supervisorAmendment: 'Amended clinical plan: Given patient\'s history of acute myofascial guarding, defer HVLA thrust until follow-up encounter 2. Proceed today with gentle soft tissue articulation and supervised isometric scapular stabilising exercises. Re-evaluate neural dynamics next week.',
      activePlan: 'Patient reports intermittent sharp neck pain radiating to right shoulder. Plan: Perform cervical spine manipulation (C5-C6 HVLA thrust) and discharge with home exercise sheet.',
      signatureHash: null,
      signedTimestamp: null,
      supervisorSignedBy: null,
      researchConsent: true,
      diffView: {
        studentOriginal: 'Plan: Perform cervical spine manipulation (C5-C6 HVLA thrust manipulation) and discharge with home posture stretch exercises.',
        supervisorOverride: 'Plan: Defer HVLA thrust due to acute muscle guarding. Execute gentle cervical articulation, soft tissue release of right levator scapulae, and prescribed scapular retraction isometrics. Review in 7 days.'
      }
    },
    physiotherapy: {
      id: 'rec_2026_0904',
      patientId: 'pat_wilson',
      patientName: 'Emma Wilson',
      age: 24,
      gender: 'Female',
      dob: '2002-03-21',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-PHY-2026-0904',
      discipline: 'physiotherapy',
      disciplineTitle: 'Physiotherapy & MSK Clinic',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Final-year Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins',
      encounterDate: '2026-10-30 11:00 GMT',
      subjective: 'Elite field hockey athlete presenting with 6-week progressive anterior knee pain, exacerbated by landing and decelerating. Morning stiffness < 15 mins.',
      objective: 'Focal tenderness over right inferior pole of patella. Single-leg decline squat provokes 6/10 familiar pain. Knee flexion ROM 135 deg symmetrical. Oxford scale: Quads 4/5.',
      assessment: 'Patellar tendinopathy (Jumper\'s knee), Victorian Institute of Sport Assessment (VISA-P) score 62/100.',
      studentDraftPlan: 'Initiate heavy slow resistance (HSR) leg extension protocol and decline board isometric squats (5x45s holds).',
      supervisorAmendment: 'Plan confirmed with progression criteria: Maintain isometrics until VAS <= 3, then graduate to concentric-eccentric loading 3x weekly.',
      activePlan: 'Initiate heavy slow resistance (HSR) leg extension protocol and decline board isometric squats (5x45s holds). Progress per criteria.',
      signatureHash: null,
      signedTimestamp: '2026-10-30T11:45:12Z',
      supervisorSignedBy: 'Dr. Sarah Jenkins',
      researchConsent: true,
      bodyMarkers: [
        { x: 145, y: 310, type: 'primary', label: 'Patellar Tendon (Pain: 6/10)' },
        { x: 140, y: 270, type: 'stiffness', label: 'Distal Quadriceps Guarding' }
      ],
      mskHqScore: 38 // out of 56
    },
    cardiovascular: {
      id: 'rec_2026_0945',
      patientId: 'pat_green',
      patientName: 'Robert Green',
      age: 52,
      gender: 'Male',
      dob: '1974-08-11',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-CVS-2026-0945',
      discipline: 'cardiovascular',
      disciplineTitle: 'Cardiovascular & Exercise Physiology Lab',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Final-year Student)',
      supervisorId: 'usr_sup_002',
      supervisorName: 'Dr. Mark Davies',
      encounterDate: '2026-10-29 09:30 GMT',
      subjective: 'Masters marathon runner presenting for annual pre-season cardiovascular screening. Asymptomatic, denies syncope, palpitations, or atypical exertional dyspnoea.',
      objective: 'Resting BP: 118/76 mmHg. Resting HR: 52 bpm (sinus bradycardia of athlete). Radial-femoral pulse symmetry intact.',
      assessment: 'Standard 12-lead ECG confirms normal sinus rhythm with physiological early repolarisation pattern consistent with athletic conditioning. PR interval 156ms, QRS duration 86ms, QTc 408ms.',
      studentDraftPlan: 'Cleared for high-intensity endurance competition. Annual routine follow-up recommended.',
      supervisorAmendment: 'ECG reviewed and verified. Low cardiovascular risk profile.',
      activePlan: 'Cleared for high-intensity endurance competition. Annual routine follow-up recommended.',
      signatureHash: null,
      signedTimestamp: '2026-10-29T10:15:00Z',
      supervisorSignedBy: 'Dr. Mark Davies',
      researchConsent: true,
      ecgMetrics: {
        hr: 52,
        pr: 156,
        qrs: 86,
        qtc: 408,
        rhythm: 'Normal Sinus Rhythm'
      },
    },
    physiology: {
      id: 'rec_2026_1011',
      patientId: 'pat_brooks',
      patientName: 'Chloe Brooks',
      age: 25,
      gender: 'Female',
      dob: '2000-11-09',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-EXP-2026-1011',
      discipline: 'physiology',
      disciplineTitle: 'Exercise Physiology & CPET Suite',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Final-year Student)',
      supervisorId: 'usr_sup_002',
      supervisorName: 'Dr. Mark Davies',
      encounterDate: '2026-10-28 15:00 GMT',
      subjective: 'Competitive triathlete undergoing physiological benchmarking for aerobic power and ventilatory thresholds on Lode Excalibur ergometer.',
      objective: 'Continuous ramp test (25W/min). VO2peak achieved: 56.4 ml/kg/min (114% predicted). Peak RER 1.18. FEV1 4.20L (98% pred), FVC 4.95L, Ratio 84.8%.',
      assessment: 'Ventilatory Threshold 1 (VT1) at 165W (2.3 L/min VO2). Ventilatory Threshold 2 (VT2 / RCP) at 285W (3.8 L/min VO2). Baseline blood lactate 1.2 mmol/L; peak blood lactate 8.6 mmol/L.',
      studentDraftPlan: 'Structure Zone 2 endurance volume at 145-160W (below VT1); establish threshold intervals at 265-280W.',
      supervisorAmendment: 'Thresholds verified against gas exchange criteria (V-slope method). Approved training plan.',
      activePlan: 'Structure Zone 2 endurance volume at 145-160W (below VT1); establish threshold intervals at 265-280W.',
      signatureHash: null,
      signedTimestamp: '2026-10-28T16:20:10Z',
      supervisorSignedBy: 'Dr. Mark Davies',
      researchConsent: true,
      cpetData: {
        vo2peak: 56.4,
        rerPeak: 1.18,
        vt1Power: 165,
        vt2Power: 285,
        fev1: 4.20,
        fvc: 4.95,
        ratio: 84.8,
        peakLactate: 8.6
      }
    },
    sc: {
      id: 'rec_2026_1033',
      patientId: 'pat_davies',
      patientName: 'Liam Davies',
      age: 22,
      gender: 'Male',
      dob: '2004-06-18',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-SNC-2026-1033',
      discipline: 'sc',
      disciplineTitle: 'Strength & Conditioning Suite',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Final-year Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins',
      encounterDate: '2026-10-27 14:00 GMT',
      subjective: 'University rugby union wing recovering from grade 2 ankle syndesmosis strain. Return-to-play power assessment.',
      objective: 'ForceDecks dual plate countermovement jump (CMJ): Jump Height 42.6cm, RSImod 0.52, Eccentric Braking RFD 4,280 N/s. Left-Right peak force asymmetry: 3.2% right bias (within normal <10% tolerance).',
      assessment: 'Neuromuscular power output restored; dynamic asymmetry resolved.',
      studentDraftPlan: 'Clear for full-contact training and reactive change-of-direction drills.',
      supervisorAmendment: 'Return-to-play clearance ratified.',
      activePlan: 'Clear for full-contact training and reactive change-of-direction drills.',
      signatureHash: null,
      signedTimestamp: '2026-10-27T15:10:00Z',
      supervisorSignedBy: 'Dr. Sarah Jenkins',
      researchConsent: true,
      scData: {
        jumpHeight: 42.6,
        rsimod: 0.52,
        rfd: 4280,
        asymmetry: 3.2,
        vbtMeanVel: 0.72,
        est1RM: 142.5
      }
    }
  };

  const INITIAL_SERVICES = [
    { id: 'srv_osteo_eval', name: 'Osteopathy Clinical Encounter', discipline: 'osteopathy', stream: 'Area A', vatRate: 0, vatCode: 'EXEMPT', vatExempt: true, price: 45, vatCategory: 'Illustrative healthcare exemption', duration: '60 mins', facility: 'Teaching Clinic' },
    {
      id: 'srv_physio_eval',
      name: 'Physiotherapy Initial Assessment',
      discipline: 'physiotherapy',
      stream: 'Area A',
      vatRate: 0.0,
      vatCode: 'EXEMPT',
      vatExempt: true,
      price: 45.00,
      vatCategory: 'Healthcare exemption (illustrative)',
      duration: '45 mins',
      facility: 'Teaching Clinic Bay 2/3'
    },
    {
      id: 'srv_cardio_screen',
      name: '12-Lead ECG Cardiovascular Screen',
      discipline: 'cardiovascular',
      stream: 'Area A',
      vatRate: 0.0,
      vatCode: 'EXEMPT',
      vatExempt: true,
      price: 60.00,
      vatCategory: 'Healthcare exemption (illustrative)',
      duration: '60 mins',
      facility: 'Cardiovascular Screening Suite'
    },
    {
      id: 'srv_biomech_hire',
      name: 'Biomechanics Lab Hire (2h Block)',
      discipline: 'biomechanics',
      stream: 'Area B',
      vatRate: 0.20,
      vatCode: 'STANDARD_20',
      vatExempt: false,
      price: 400.00,
      vatCategory: 'Commercial Facility Hire (Standard 20%)',
      duration: '2 Hours',
      facility: 'Biomechanics laboratory'
    },
    {
      id: 'srv_cpet_hire',
      name: 'Portable CPET Cart Hire (Day Rate)',
      discipline: 'physiology',
      stream: 'Area B',
      vatRate: 0.20,
      vatCode: 'STANDARD_20',
      vatExempt: false,
      price: 150.00,
      vatCategory: 'Diagnostic Equipment Rental (Standard 20%)',
      duration: 'Full Day',
      facility: 'Specialist Equipment Store'
    },
    {
      id: 'srv_cpd_manip',
      name: 'CPD Workshop: Spinal Manipulation Masterclass',
      discipline: 'osteopathy',
      stream: 'Area B',
      vatRate: 0.0,
      vatCode: 'EXEMPT',
      vatExempt: true,
      price: 125.00,
      vatCategory: 'Training exemption (illustrative)',
      duration: '1 Day (7 CPD hrs)',
      facility: 'Teaching and practical suite',
      seatsTotal: 20,
      seatsBooked: 20
    },
    {
      id: 'srv_env_hire',
      name: 'Environmental Chamber Hire (1 Hour)',
      discipline: 'physiology',
      stream: 'Area B',
      vatRate: 0.20,
      vatCode: 'STANDARD_20',
      vatExempt: false,
      price: 125.00,
      vatCategory: 'Commercial Facility Hire (Standard 20%)',
      duration: '1 Hour',
      facility: 'Environmental chamber'
    }
  ];

  const INITIAL_CART = [
    {
      id: 'item_cart_1',
      serviceId: 'srv_physio_eval',
      name: 'Physiotherapy Initial Assessment (Student Clinic)',
      stream: 'Area A Clinical',
      category: 'Healthcare exemption (illustrative)',
      vatRate: 0.0,
      vatExempt: true,
      unitPrice: 45.00,
      qty: 1
    },
    {
      id: 'item_cart_2',
      serviceId: 'srv_cardio_screen',
      name: '12-Lead ECG Cardiovascular Panel',
      stream: 'Area A Clinical',
      category: 'Healthcare exemption (illustrative)',
      vatRate: 0.0,
      vatExempt: true,
      unitPrice: 60.00,
      qty: 1
    },
    {
      id: 'item_cart_3',
      serviceId: 'srv_biomech_hire',
      name: 'Biomechanics Lab Hire (2-Hour Block)',
      stream: 'Area B Commercial',
      category: 'Commercial Facility Hire (Standard 20%)',
      vatRate: 0.20,
      vatExempt: false,
      unitPrice: 400.00,
      qty: 1
    },
    {
      id: 'item_cart_4',
      serviceId: 'srv_cpet_hire',
      name: 'Portable CPET Cart Hire (Day Rate)',
      stream: 'Area B Commercial',
      category: 'Diagnostic Equipment Rental (Standard 20%)',
      vatRate: 0.20,
      vatExempt: false,
      unitPrice: 150.00,
      qty: 1
    },
    {
      id: 'item_cart_5',
      serviceId: 'srv_env_hire',
      name: 'Environmental Chamber Hire (1 Hour)',
      stream: 'Area B Commercial',
      category: 'Commercial Facility Hire (Standard 20%)',
      vatRate: 0.20,
      vatExempt: false,
      unitPrice: 125.00,
      qty: 1
    }
  ];

  const INITIAL_ORDERS = [
    {
      id: 'ord_2026_0091',
      orderNumber: 'ORD-2026-0091',
      customerType: 'B2B_ORGANISATIONAL',
      organisationName: 'Riverside Athletics Club (fictional)',
      bookerName: 'David Miller',
      bookerEmail: 'd.miller@riverside-ac.example',
      payingOrg: 'Riverside AC (fictional) Accounts Payable',
      invoiceEmail: 'accounts@riverside-ac.example',
      poNumber: 'RAC-2026-PO-9942',
      paymentTerms: 'Net 30 Days',
      status: 'APPROVED: AWAITING PAYMENT',
      dateCreated: '2026-10-31T11:30:00Z',
      dateApproved: '2026-10-31T12:05:14Z',
      approvedBy: 'Marcus Vance (Commercial Manager)',
      items: [
        { name: 'Initial Physiotherapy Assessment (Student Clinic)', qty: 1, unitPrice: 45.00, vatRate: 0.0, net: 45.00, vat: 0.00 },
        { name: '12-Lead ECG Cardiovascular Panel', qty: 1, unitPrice: 60.00, vatRate: 0.0, net: 60.00, vat: 0.00 },
        { name: 'Biomechanics Lab Hire (2h)', qty: 1, unitPrice: 400.00, vatRate: 0.20, net: 400.00, vat: 80.00 },
        { name: 'Portable CPET Cart Hire (Day Rate)', qty: 1, unitPrice: 150.00, vatRate: 0.20, net: 150.00, vat: 30.00 },
        { name: 'Environmental Chamber Hire (1 Hour)', qty: 1, unitPrice: 125.00, vatRate: 0.20, net: 125.00, vat: 25.00 }
      ],
      netExempt: 105.00,
      netStandard: 675.00,
      vatStandard: 135.00,
      totalGross: 915.00,
      oracleEbsSynced: false,
      oracleBatchId: 'REF-GL-001'
    }
  ];

  const D = typeof module === 'object' && module.exports ? require('./domain.js') : HubDomain;
  const CAPABILITIES = Object.freeze({
    clinicalRead: ['student', 'supervisor'],
    countersign: ['supervisor'],
    researchExport: ['supervisor'],
    commercialRead: ['manager', 'booker'],
    submitOrder: ['manager', 'booker'],
    approveOrder: ['manager'],
    financeExport: ['manager'],
    governanceRead: ['manager', 'supervisor'],
    book: ['student', 'supervisor', 'manager', 'booker']
  });

  async function computeSha256(message) {
    const crypto = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
    if (!crypto?.subtle) throw new Error('SHA-256 review requires Web Crypto. Open the HTTPS site or a localhost server.');
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(message));
    return 'SHA256:' + Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }

  class Store {
    constructor() {
      this.listeners = [];
      this.signing = new Map();
      this.auditQueue = Promise.resolve();
      this.generation = 0;
      this.sequence = 0;
      this.state = this.loadInitialState();
    }

    getDefaultState() {
      const records = D.clone(INITIAL_RECORDS);
      for (const record of Object.values(records)) {
        record.version = 1;
        record.history = [];
        record.signatureHash = null;
        record.signaturePayload = null;
        record.signatureOrigin = record.signedTimestamp ? 'reference' : null;
        record.creditedEncounter = Boolean(record.signedTimestamp);
      }
      const orders = D.clone(INITIAL_ORDERS).map(order => ({ ...order,
        submittedById: INITIAL_PERSONAS.booker.id, approvedById: INITIAL_PERSONAS.manager.id,
        oracleEbsSynced: false, exportStatus: 'READY', oracleBatchId: 'REF-GL-001' }));
      return {
        schemaVersion: 4, referenceDate: '2026-10-31',
        currentRole: 'supervisor', currentUser: D.clone(INITIAL_PERSONAS.supervisor),
        personas: D.clone(INITIAL_PERSONAS), facilities: D.clone(INITIAL_FACILITIES),
        equipment: D.clone(INITIAL_EQUIPMENT), supervisors: D.clone(INITIAL_SUPERVISOR_ROSTER),
        students: D.clone(INITIAL_STUDENT_ROSTER), records, services: D.clone(INITIAL_SERVICES),
        cart: D.clone(INITIAL_CART), orders, bookings: [], auditLog: [],
        activeDiscipline: 'osteopathy', activeTab: 'booking',
        waitlist: [{ id: 'wl_001', clientName: 'David Miller', clientOrg: 'Riverside Athletics Club',
          userId: INITIAL_PERSONAS.booker.id, serviceId: 'srv_cpd_manip', status: 'WAITING' }],
        waitlistOffer: null
      };
    }

    loadInitialState() {
      try {
        const storage = typeof window !== 'undefined' ? window.localStorage : null;
        if (storage) {
          for (const key of LEGACY_STORAGE_KEYS) storage.removeItem(key);
          const saved = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
          const arrays = ['facilities', 'equipment', 'supervisors', 'students', 'services', 'cart', 'orders', 'bookings', 'auditLog', 'waitlist'];
          if (saved?.schemaVersion === 4 && Object.hasOwn(INITIAL_PERSONAS, saved.currentRole) &&
              saved.records && Object.keys(INITIAL_RECORDS).every(key => saved.records[key]?.id) &&
              arrays.every(key => Array.isArray(saved[key]))) {
            saved.personas = D.clone(INITIAL_PERSONAS);
            saved.currentUser = D.clone(INITIAL_PERSONAS[saved.currentRole]);
            D.cartTotals(saved.cart);
            return saved;
          }
        }
      } catch (_) { /* Storage is optional; an invalid snapshot starts a clean reference session. */ }
      return this.getDefaultState();
    }

    saveState() {
      try {
        if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      } catch (_) { /* Private browsing can disable persistence without disabling the workflows. */ }
    }

    getState() { return this.state; }
    setState(patch) {
      this.state = { ...this.state, ...patch };
      this.saveState();
      for (const listener of this.listeners) listener(this.state);
    }
    subscribe(listener) {
      this.listeners.push(listener);
      return () => { this.listeners = this.listeners.filter(item => item !== listener); };
    }
    reset() {
      this.generation += 1;
      this.signing.clear();
      this.state = this.getDefaultState();
      this.setState({});
    }
    can(capability) { return Boolean(CAPABILITIES[capability]?.includes(this.state.currentRole)); }
    requirePermission(capability) {
      if (!this.can(capability)) throw new Error('This action requires an authorised ' +
        (capability === 'approveOrder' || capability === 'financeExport' ? 'commercial manager.' : 'clinical supervisor or permitted role.'));
    }
    setRole(roleId) {
      if (!Object.hasOwn(INITIAL_PERSONAS, roleId)) throw new Error('Unknown role.');
      this.setState({ currentRole: roleId, currentUser: D.clone(INITIAL_PERSONAS[roleId]) });
    }
    setDiscipline(key) {
      this.requirePermission('clinicalRead');
      if (!Object.hasOwn(this.state.records, key)) throw new Error('Unknown clinical discipline.');
      this.setState({ activeDiscipline: key });
    }
    uid(prefix) {
      this.sequence += 1;
      return `${prefix}_${Date.now().toString(36)}_${this.sequence.toString(36)}`;
    }

    addAuditLog(action, resource) {
      const user = D.clone(this.state.currentUser);
      const generation = this.generation;
      const timestamp = new Date().toISOString();
      this.auditQueue = this.auditQueue.then(async () => {
        if (generation !== this.generation) return;
        const previousHash = this.state.auditLog[0]?.hash || null;
        const entry = { id: this.uid('audit'), timestamp, userId: user.id, userName: user.name,
          role: user.role, action, resource, previousHash };
        let hash = null;
        try { hash = await computeSha256(D.canonical(entry)); } catch (_) { /* No false digest when Web Crypto is unavailable. */ }
        if (generation !== this.generation) return;
        this.setState({ auditLog: [{ ...entry, hash }, ...this.state.auditLog] });
      });
      return this.auditQueue;
    }
    getAuditEntries() {
      this.requirePermission('governanceRead');
      return this.state.auditLog.filter(entry => this.state.currentRole === 'supervisor'
        ? !/^(PO_|PURCHASE_|FINANCE_)/.test(entry.action)
        : !/^(EPR_|SUPERVISOR_|RESEARCH_)/.test(entry.action));
    }

    calculateCartTotals() { return D.cartTotals(this.state.cart); }
    addToCart(serviceId) {
      this.requirePermission('commercialRead');
      const service = this.state.services.find(item => item.id === serviceId);
      if (!service) throw new Error('Unknown service.');
      if (Number.isInteger(service.seatsTotal) && service.seatsBooked >= service.seatsTotal) throw new Error('This course is full. Use the waiting list.');
      const cart = D.clone(this.state.cart);
      const existing = cart.find(item => item.serviceId === serviceId);
      if (existing) existing.qty += 1;
      else cart.push({ id: this.uid('cart'), serviceId, name: service.name, stream: service.stream,
        category: service.vatCategory, vatRate: service.vatRate, vatExempt: service.vatExempt, unitPrice: service.price, qty: 1 });
      D.cartTotals(cart);
      this.setState({ cart });
    }
    removeFromCart(itemId) {
      this.requirePermission('commercialRead');
      this.setState({ cart: this.state.cart.filter(item => item.id !== itemId) });
    }

    evaluateBooking(request) { return D.bookingConstraints(this.state, request); }
    confirmBooking(request) {
      this.requirePermission('book');
      if (request.slotId !== 'reference-afternoon') throw new Error('Select the reference afternoon session.');
      const result = this.evaluateBooking(request);
      if (!result.valid) throw new Error(Object.values(result.checks).filter(x => !x.ok).map(x => x.message).join(' '));
      const service = this.state.services.find(x => x.id === request.serviceId);
      if (service.stream === 'Area A' && !this.can('clinicalRead')) throw new Error('A clinical role is required to allocate supervised clinical appointments.');
      const student = service.stream === 'Area A' && this.state.students.find(x => x.id === request.practitionerId);
      const booking = { ...request, id: this.uid('booking'), status: 'CONFIRMED', createdBy: this.state.currentUser.id };
      this.setState({
        bookings: [...this.state.bookings, booking],
        facilities: this.state.facilities.map(x => x.id === request.roomId ? { ...x, status: 'occupied' } : x),
        equipment: this.state.equipment.map(x => x.id === request.equipmentId ? { ...x, status: 'reserved' } : x),
        supervisors: this.state.supervisors.map(x => student && x.id === request.supervisorId ? { ...x, activeBays: x.activeBays + 1 } : x)
      });
      void this.addAuditLog('BOOKING_CONFIRMED', booking.id + ' / ' + request.roomId);
      return booking;
    }

    createWaitlistOffer(now = Date.now()) {
      if (!['supervisor', 'manager'].includes(this.state.currentRole)) throw new Error('A service lead must release a waiting-list place.');
      const current = this.state.waitlistOffer;
      if (current?.status === 'OFFERED' && Date.parse(current.expiresAt) > now) return current;
      const person = this.state.waitlist.find(x => x.status === 'WAITING');
      if (!person) throw new Error('No eligible people remain on the waiting list.');
      const service = this.state.services.find(x => x.id === person.serviceId);
      const offer = { ...person, id: this.uid('offer'), serviceName: service.name,
        status: 'OFFERED', expiresAt: new Date(now + 15 * 60 * 1000).toISOString() };
      this.setState({ waitlistOffer: offer, services: this.state.services.map(x => x.id === service.id
        ? { ...x, seatsBooked: Math.min(x.seatsBooked, x.seatsTotal - 1) } : x) });
      void this.addAuditLog('WAITLIST_OFFER', offer.id);
      return offer;
    }
    claimWaitlistOffer(now = Date.now()) {
      const offer = this.state.waitlistOffer;
      if (!offer || offer.status !== 'OFFERED' || Date.parse(offer.expiresAt) <= now) throw new Error('This offer has expired or is no longer available.');
      if (this.state.currentUser.id !== offer.userId) throw new Error('Switch to the invited corporate booker to accept this offer.');
      const service = this.state.services.find(x => x.id === offer.serviceId);
      if (service.seatsBooked >= service.seatsTotal) throw new Error('No course places remain.');
      this.setState({ waitlistOffer: { ...offer, status: 'CLAIMED' },
        services: this.state.services.map(x => x.id === service.id ? { ...x, seatsBooked: x.seatsBooked + 1 } : x),
        waitlist: this.state.waitlist.map(x => x.id === offer.id || x.userId === offer.userId ? { ...x, status: 'BOOKED' } : x) });
      void this.addAuditLog('WAITLIST_CLAIM', offer.id);
      return this.state.waitlistOffer;
    }

    saveDraft(key, fields) {
      this.requirePermission('clinicalRead');
      const record = this.state.records[key];
      if (!record || record.authorId !== this.state.currentUser.id || this.state.currentRole !== 'student') throw new Error('Only the authoring student can edit this draft.');
      if (record.status.includes('LOCKED')) throw new Error('A countersigned record is locked.');
      const next = { ...record };
      for (const field of ['subjective', 'objective', 'assessment', 'studentDraftPlan']) {
        if (typeof fields[field] !== 'string' || !fields[field].trim() || fields[field].length > 10000) throw new Error('Complete all draft fields using no more than 10,000 characters per field.');
        next[field] = fields[field].trim();
      }
      next.activePlan = next.studentDraftPlan;
      next.version = record.version + 1;
      next.history = [...record.history, { version: record.version, event: 'DRAFT_SAVED', content: D.recordContent(record) }];
      this.setState({ records: { ...this.state.records, [key]: next } });
      void this.addAuditLog('EPR_DRAFT_SAVE', `${record.id} / version ${next.version}`);
      return next;
    }

    async executeCountersignature(key, amendmentText) {
      this.requirePermission('countersign');
      const record = this.state.records[key];
      if (!record) throw new Error('Clinical record not found.');
      if (record.supervisorId !== this.state.currentUser.id) throw new Error('Only the assigned supervisor can countersign this record.');
      if (record.status.includes('LOCKED')) return D.clone(record);
      if (this.signing.has(record.id)) return this.signing.get(record.id);
      const actor = D.clone(this.state.currentUser);
      const generation = this.generation;
      const original = D.canonical(record);
      const operation = (async () => {
        const timestamp = new Date().toISOString();
        const amendment = String(amendmentText ?? record.supervisorAmendment ?? '').trim();
        if (!amendment || amendment.length > 10000) throw new Error('Enter a supervisor review of 1 to 10,000 characters.');
        const updated = { ...D.clone(record), supervisorAmendment: amendment, activePlan: amendment };
        const payload = { record: D.recordContent(updated), supervisorId: actor.id, timestamp, version: record.version };
        const signatureHash = await computeSha256(D.canonical(payload));
        if (generation !== this.generation || this.state.currentRole !== 'supervisor' || this.state.currentUser.id !== actor.id ||
            D.canonical(this.state.records[key]) !== original) throw new Error('The record or active role changed during review. Review the current version again.');
        Object.assign(updated, { status: 'SUPERVISOR COUNTERSIGNED & LOCKED', signatureHash,
          signaturePayload: payload, signatureOrigin: 'session', signedTimestamp: timestamp,
          supervisorSignedBy: actor.name, creditedEncounter: true });
        const students = this.state.students.map(student => student.userId === record.authorId && !record.creditedEncounter
          ? { ...student, hoursLogged: student.hoursLogged + 1, completedCases: student.completedCases + 1 } : student);
        this.setState({ records: { ...this.state.records, [key]: updated }, students });
        await this.addAuditLog('SUPERVISOR_COUNTERSIGN', `${record.id} / version ${record.version}`);
        return D.clone(updated);
      })();
      this.signing.set(record.id, operation);
      try { return await operation; } finally { this.signing.delete(record.id); }
    }

    async verifyCountersignature(key) {
      this.requirePermission('clinicalRead');
      const record = this.state.records[key];
      if (!record?.signaturePayload || !record.signatureHash) return { valid: false, reason: 'No session-generated digest for this reference record.' };
      const unchanged = D.canonical(D.recordContent(record)) === D.canonical(record.signaturePayload.record);
      const digest = await computeSha256(D.canonical(record.signaturePayload));
      return { valid: unchanged && digest === record.signatureHash, reason: unchanged && digest === record.signatureHash ? 'Record version matches its SHA-256 digest.' : 'Record content no longer matches the reviewed version.' };
    }

    async submitPurchaseOrder(details) {
      this.requirePermission('submitOrder');
      if (!this.state.cart.length) throw new Error('The basket is empty. Add a service before submitting.');
      const poNumber = String(details.poNumber ?? '').trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9 ._\/-]{2,63}$/.test(poNumber)) throw new Error('Enter a PO reference of 3–64 letters, numbers, spaces, dots, slashes or hyphens.');
      const paymentTerms = details.paymentTerms || 'Net 30 Days';
      if (!['Net 30 Days', 'Net 60 Days', 'Payment in advance'].includes(paymentTerms)) throw new Error('Invalid payment terms.');
      const totals = this.calculateCartTotals();
      const actor = this.state.currentUser;
      const items = this.state.cart.map(item => ({ ...D.clone(item), ...D.lineAmounts(item) }));
      const duplicate = this.state.orders.find(order => order.poNumber.toUpperCase() === poNumber.toUpperCase() && order.submittedById === actor.id);
      if (duplicate) {
        if (D.canonical(duplicate.items) === D.canonical(items) && duplicate.paymentTerms === paymentTerms) return D.clone(duplicate);
        throw new Error('This PO reference already belongs to a different order. Use a new reference.');
      }
      const order = { id: this.uid('order'), orderNumber: 'REF-' + this.uid('PO').toUpperCase(),
        customerType: 'B2B_ORGANISATIONAL', organisationName: 'Riverside Athletics Club',
        bookerName: actor.name, submittedById: actor.id, invoiceEmail: 'accounts@riverside-ac.example',
        poNumber, paymentTerms, status: 'PENDING_PO_VERIFICATION', dateCreated: new Date().toISOString(),
        dateApproved: null, approvedBy: null, items, ...totals, oracleEbsSynced: false,
        oracleBatchId: null, exportStatus: 'AWAITING_APPROVAL' };
      this.setState({ orders: [order, ...this.state.orders] });
      await this.addAuditLog('PO_SUBMIT', `${order.orderNumber} / ${poNumber} / GBP ${totals.totalGross.toFixed(2)}`);
      return D.clone(order);
    }

    async approvePurchaseOrder(id) {
      this.requirePermission('approveOrder');
      const order = this.state.orders.find(item => item.id === id);
      if (!order) throw new Error('Purchase order not found.');
      if (order.submittedById === this.state.currentUser.id) throw new Error('A different authorised manager must approve the order.');
      if (order.dateApproved) return D.clone(order);
      if (order.status !== 'PENDING_PO_VERIFICATION') throw new Error('This order is not awaiting approval.');
      const approved = { ...order, status: 'APPROVED: AWAITING PAYMENT', dateApproved: new Date().toISOString(),
        approvedBy: this.state.currentUser.name, approvedById: this.state.currentUser.id,
        oracleEbsSynced: false, oracleBatchId: this.uid('REF-GL'), exportStatus: 'READY' };
      this.setState({ orders: this.state.orders.map(item => item.id === id ? approved : item) });
      await this.addAuditLog('PURCHASE_ORDER_APPROVE', `${order.orderNumber} / export ready`);
      return D.clone(approved);
    }

    generateOracleGLCSV() {
      this.requirePermission('financeExport');
      const rows = [['STATUS', 'LEDGER_ID', 'ACCOUNTING_DATE', 'USER_JE_SOURCE_NAME', 'USER_JE_CATEGORY_NAME',
        'SEGMENT1_ENTITY', 'SEGMENT2_COST_CENTRE', 'SEGMENT3_SUB_UNIT', 'SEGMENT4_ACCOUNT', 'SEGMENT5_PROJECT',
        'ENTERED_DR', 'ENTERED_CR', 'CURRENCY_CODE', 'REFERENCE1_PO', 'REFERENCE4_DESC']];
      for (const order of this.state.orders.filter(item => item.dateApproved && item.exportStatus === 'READY')) {
        const row = (account, debit, credit, description, category = 'Commercial Sales') => ['NEW', 'REF-LEDGER',
          order.dateApproved.slice(0, 10), 'OIV_REFERENCE', category, '01', '101', '4030', account, 'PRJ-REFERENCE',
          debit ? debit.toFixed(2) : '', credit ? credit.toFixed(2) : '', 'GBP', order.poNumber, description];
        for (const item of order.items) rows.push(row(item.vatRate === 0 ? '7210' : '7220', 0, item.net, item.name));
        if (order.vatStandard) rows.push(row('2110', 0, order.vatStandard, 'Output VAT', 'VAT Payable'));
        rows.push(row('1210', order.totalGross, 0, order.orderNumber, 'Trade Debtors'));
      }
      return D.csv(rows);
    }

    researchRows() {
      this.requirePermission('researchExport');
      return Object.values(this.state.records).map((record, index) => ({ record, index })).filter(({ record }) => record.researchConsent === true).map(({ record, index }) => ({
        researchId: 'REF-STUDY-' + String(index + 1).padStart(3, '0'),
        ageBand: `${Math.floor(record.age / 5) * 5}-${Math.floor(record.age / 5) * 5 + 4}`,
        discipline: record.discipline, reviewed: record.status.includes('LOCKED'),
        recordVersion: record.version, consentRecorded: true
      }));
    }
    generateResearchCSV() {
      const rows = this.researchRows();
      return D.csv([['STUDY_ID', 'AGE_BAND', 'DISCIPLINE', 'REVIEWED', 'RECORD_VERSION', 'CONSENT_RECORDED'],
        ...rows.map(row => [row.researchId, row.ageBand, row.discipline, row.reviewed, row.recordVersion, row.consentRecorded])]);
    }
    generateResearchJSON() { return JSON.stringify(this.researchRows(), null, 2); }
  }

  return new Store();
});
