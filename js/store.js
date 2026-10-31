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

  const STORAGE_KEY = 'ljmu_hub_state_v3_1';
  const LEGACY_STORAGE_KEYS = ['ljmu_hub_state_v3', 'ljmu_hub_state_v2', 'ljmu_hub_state'];

  const INITIAL_PERSONAS = {
    student: {
      id: 'usr_stu_001',
      name: 'Alex Walker',
      role: 'student',
      title: 'Student Practitioner (Year 3 MSc)',
      program: 'MSc Clinical Exercise Physiology & Osteopathy',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins',
      badgeClass: 'badge-student',
      bannerMsg: 'Notes require Supervisor Countersignature'
    },
    supervisor: {
      id: 'usr_sup_001',
      name: 'Dr. Sarah Jenkins',
      role: 'supervisor',
      title: 'Senior Clinical Practice Educator (MCSP, HCPC, GOsC)',
      program: 'Faculty Clinical Lead, School of Sport & Exercise Sciences',
      maxStudentRatio: 4,
      badgeClass: 'badge-supervisor',
      bannerMsg: '2 Student Drafts Awaiting Countersignature'
    },
    manager: {
      id: 'usr_mgr_001',
      name: 'Marcus Vance',
      role: 'manager',
      title: 'Commercial & Lab Operations Manager',
      program: 'LJMU Performance Hub & Specialist Laboratories',
      badgeClass: 'badge-manager',
      bannerMsg: 'Oracle EBS Batch Ready & 1 PO Pending Approval'
    },
    booker: {
      id: 'usr_bkr_001',
      name: 'David Miller',
      role: 'booker',
      title: 'Head Coach & Corporate Booker',
      organization: 'Liverpool Harriers Athletic Club',
      badgeClass: 'badge-booker',
      bannerMsg: 'Self-Service Booking & PO Checkout'
    }
  };

  const INITIAL_FACILITIES = [
    { id: 'rm_tr_g01', name: 'Teaching Clinic — Bay 1', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'osteopathy', status: 'occupied' },
    { id: 'rm_tr_g02', name: 'Teaching Clinic — Bay 2', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'physiotherapy', status: 'occupied' },
    { id: 'rm_tr_g03', name: 'Teaching Clinic — Bay 3', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'physiotherapy', status: 'occupied' },
    { id: 'rm_tr_g04', name: 'Teaching Clinic — Bay 4', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'osteopathy', status: 'available' },
    { id: 'rm_tr_biomech', name: 'Tom Reilly — Biomechanics Lab', campus: 'Byrom Street (Tom Reilly, L3 3AF)', type: 'specialist_lab', capacity: 10, discipline: 'biomechanics', status: 'available' },
    { id: 'rm_tr_env', name: 'Tom Reilly — Environmental Hypoxia Chamber', campus: 'Byrom Street (Tom Reilly, L3 3AF)', type: 'specialist_lab', capacity: 6, discipline: 'physiology', status: 'available' },
    { id: 'rm_tr_bodycomp', name: 'Tom Reilly — Body Composition Suite', campus: 'Byrom Street (Tom Reilly, L3 3AF)', type: 'diagnostic_suite', capacity: 2, discipline: 'physiology', status: 'available' },
    { id: 'rm_ch_mov', name: 'Clinic Bay 3: Movement Function', campus: 'Clinic Building (demo)', type: 'clinical_bay', capacity: 1, discipline: 'sc', status: 'available' }
  ];

  const INITIAL_EQUIPMENT = [
    { id: 'eq_cpet_01', name: 'Portable CPET Cart #1', room: 'rm_tr_env', status: 'available', calibrationDue: '2026-12-15' },
    { id: 'eq_ecg_01', name: 'Schiller 12-Lead ECG Diagnostic System', room: 'rm_tr_g02', status: 'available', calibrationDue: '2027-01-10' },
    { id: 'eq_fd_01', name: 'ForceDecks Dual Wireless Force Plates', room: 'rm_ch_mov', status: 'available', calibrationDue: '2026-11-30' },
    { id: 'eq_us_01', name: '12-Lead ECG & Metabolic Cart', room: 'rm_tr_g03', status: 'maintenance_lock', calibrationDue: '2026-10-25' }
  ];

  const INITIAL_SUPERVISOR_ROSTER = [
    { id: 'sup_jenkins', name: 'Dr. Sarah Jenkins', maxRatio: 4, activeBays: 3, room: 'Teaching Clinic (demo)', disciplines: ['osteopathy', 'physiotherapy'] },
    { id: 'sup_davies', name: 'Dr. Mark Davies', maxRatio: 4, activeBays: 1, room: 'Tom Reilly Physiology Labs', disciplines: ['cardiovascular', 'physiology'] }
  ];

  const INITIAL_STUDENT_ROSTER = [
    { id: 'stu_walker', name: 'Alex Walker', year: 'Year 3 MSc', supervisorId: 'sup_jenkins', hoursLogged: 124, targetHours: 200, completedCases: 38 },
    { id: 'stu_patel', name: 'Priya Patel', year: 'Year 3 MSc', supervisorId: 'sup_jenkins', hoursLogged: 148, targetHours: 200, completedCases: 46 }
  ];

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
      disciplineTitle: 'Osteopathy Clinic (GOsC Standard)',
      status: 'DRAFT — AWAITING SUPERVISOR COUNTERSIGNATURE',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Year 3 MSc Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins, MCSP',
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
      patientId: 'pat_watson',
      patientName: 'Emma Watson',
      age: 24,
      gender: 'Female',
      dob: '2002-03-21',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-PHY-2026-0904',
      discipline: 'physiotherapy',
      disciplineTitle: 'Physiotherapy & MSK Clinic (CSP / HCPC Standard)',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Year 3 MSc Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins, MCSP',
      encounterDate: '2026-10-30 11:00 GMT',
      subjective: 'Elite field hockey athlete presenting with 6-week progressive anterior knee pain, exacerbated by landing and decelerating. Morning stiffness < 15 mins.',
      objective: 'Focal tenderness over right inferior pole of patella. Single-leg decline squat provokes 6/10 familiar pain. Knee flexion ROM 135 deg symmetrical. Oxford scale: Quads 4/5.',
      assessment: 'Patellar tendinopathy (Jumper\'s knee), Victorian Institute of Sport Assessment (VISA-P) score 62/100.',
      studentDraftPlan: 'Initiate heavy slow resistance (HSR) leg extension protocol and decline board isometric squats (5x45s holds).',
      supervisorAmendment: 'Plan confirmed with progression criteria: Maintain isometrics until VAS <= 3, then graduate to concentric-eccentric loading 3x weekly.',
      activePlan: 'Initiate heavy slow resistance (HSR) leg extension protocol and decline board isometric squats (5x45s holds). Progress per criteria.',
      signatureHash: 'SHA256:7e91f043ba4e21a8c093847291a4fd09e13b827e8a93112cba504d6f81a79241',
      signedTimestamp: '2026-10-30T11:45:12Z',
      supervisorSignedBy: 'Dr. Sarah Jenkins (MCSP 049182)',
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
      authorName: 'Alex Walker (Year 3 MSc Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Mark Davies, PhD',
      encounterDate: '2026-10-29 09:30 GMT',
      subjective: 'Masters marathon runner presenting for annual pre-season cardiovascular screening. Asymptomatic, denies syncope, palpitations, or atypical exertional dyspnoea.',
      objective: 'Resting BP: 118/76 mmHg. Resting HR: 52 bpm (sinus bradycardia of athlete). Radial-femoral pulse symmetry intact.',
      assessment: 'Standard 12-lead ECG confirms normal sinus rhythm with physiological early repolarisation pattern consistent with athletic conditioning. PR interval 156ms, QRS duration 86ms, QTc 408ms.',
      studentDraftPlan: 'Cleared for high-intensity endurance competition. Annual routine follow-up recommended.',
      supervisorAmendment: 'ECG reviewed and verified. Low cardiovascular risk profile.',
      activePlan: 'Cleared for high-intensity endurance competition. Annual routine follow-up recommended.',
      signatureHash: 'SHA256:3a4b9c1d8820ef0192a54b38d7c491e0a293847591cdeba12398571029384abc',
      signedTimestamp: '2026-10-29T10:15:00Z',
      supervisorSignedBy: 'Dr. Mark Davies, PhD',
      researchConsent: true,
      ecgMetrics: {
        hr: 52,
        pr: 156,
        qrs: 86,
        qtc: 408,
        rhythm: 'Normal Sinus Rhythm'
      },
      qrisk3Score: 2.4 // 2.4% low 10-year risk
    },
    physiology: {
      id: 'rec_2026_1011',
      patientId: 'pat_bennett',
      patientName: 'Chloe Bennett',
      age: 26,
      gender: 'Female',
      dob: '2000-11-09',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-EXP-2026-1011',
      discipline: 'physiology',
      disciplineTitle: 'Exercise Physiology & CPET Suite (AHCS / CASES)',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Year 3 MSc Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Mark Davies, PhD',
      encounterDate: '2026-10-28 15:00 GMT',
      subjective: 'Competitive triathlete undergoing physiological benchmarking for aerobic power and ventilatory thresholds on Lode Excalibur ergometer.',
      objective: 'Continuous ramp test (25W/min). VO2peak achieved: 56.4 ml/kg/min (114% predicted). Peak RER 1.18. FEV1 4.20L (98% pred), FVC 4.95L, Ratio 84.8%.',
      assessment: 'Ventilatory Threshold 1 (VT1) at 165W (2.3 L/min VO2). Ventilatory Threshold 2 (VT2 / RCP) at 285W (3.8 L/min VO2). Baseline blood lactate 1.2 mmol/L; peak blood lactate 8.6 mmol/L.',
      studentDraftPlan: 'Structure Zone 2 endurance volume at 145-160W (<VT1); establish threshold intervals at 265-280W.',
      supervisorAmendment: 'Thresholds verified against gas exchange criteria (V-slope method). Approved training plan.',
      activePlan: 'Structure Zone 2 endurance volume at 145-160W (<VT1); establish threshold intervals at 265-280W.',
      signatureHash: 'SHA256:c940291e0a2938471b827e8a93112cba504d6f81a792417e91f043ba4e21a8c0',
      signedTimestamp: '2026-10-28T16:20:10Z',
      supervisorSignedBy: 'Dr. Mark Davies, PhD (AHCS Registered)',
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
      disciplineTitle: 'Strength & Conditioning Suite (CASES / UKSCA)',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Year 3 MSc Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins, MCSP',
      encounterDate: '2026-10-27 14:00 GMT',
      subjective: 'University rugby union wing recovering from grade 2 ankle syndesmosis strain. Return-to-play power assessment.',
      objective: 'ForceDecks dual plate countermovement jump (CMJ): Jump Height 42.6cm, RSImod 0.52, Eccentric Braking RFD 4,280 N/s. Left-Right peak force asymmetry: 3.2% right bias (within normal <10% tolerance).',
      assessment: 'Neuromuscular power output restored; dynamic asymmetry resolved.',
      studentDraftPlan: 'Clear for full-contact training and reactive change-of-direction drills.',
      supervisorAmendment: 'Return-to-play clearance ratified.',
      activePlan: 'Clear for full-contact training and reactive change-of-direction drills.',
      signatureHash: 'SHA256:d8a4f9103b4e21a7c093847291a4fd09e13b827e8a93112cba504d6f81a79241',
      signedTimestamp: '2026-10-27T15:10:00Z',
      supervisorSignedBy: 'Dr. Sarah Jenkins, MCSP',
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
    {
      id: 'srv_physio_eval',
      name: 'Physiotherapy Initial Assessment',
      discipline: 'physiotherapy',
      stream: 'Area A',
      vatRate: 0.0,
      vatCode: 'EXEMPT',
      vatExempt: true,
      price: 45.00,
      vatCategory: 'Healthcare Exempt (VATA 1994 Sch 9 Grp 7)',
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
      vatCategory: 'Healthcare Exempt (VATA 1994 Sch 9 Grp 7)',
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
      facility: 'Tom Reilly Biomechanics Lab'
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
      vatRate: 0.20,
      vatCode: 'STANDARD_20',
      vatExempt: false,
      price: 125.00,
      vatCategory: 'Professional Training (Standard 20%)',
      duration: '1 Day (7 CPD hrs)',
      facility: 'Tom Reilly Lecture & Practical Suite',
      seatsTotal: 20,
      seatsBooked: 20
    }
  ];

  const INITIAL_CART = [
    {
      id: 'item_cart_1',
      serviceId: 'srv_physio_eval',
      name: 'Physiotherapy Initial Assessment (Student Clinic)',
      stream: 'Area A Clinical',
      category: 'Healthcare Exempt (VATA 1994 Sch 9 Grp 7)',
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
      category: 'Healthcare Exempt (VATA 1994 Sch 9 Grp 7)',
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
      serviceId: 'srv_cpd_manip',
      name: 'CPD Workshop: Spinal Manipulation (1 Seat)',
      stream: 'Area B Commercial',
      category: 'Professional Training (Standard 20%)',
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
      organisationName: 'Liverpool Harriers Athletic Club',
      bookerName: 'David Miller',
      bookerEmail: 'd.miller@liverpoolharriers.org.uk',
      payingOrg: 'Liverpool Harriers AC Accounts Payable',
      invoiceEmail: 'accounts@liverpoolharriers.org.uk',
      poNumber: 'LH-2026-PO-9942',
      paymentTerms: 'Net 30 Days',
      status: 'APPROVED — AWAITING PAYMENT',
      dateCreated: '2026-10-31T11:30:00Z',
      dateApproved: '2026-10-31T12:05:14Z',
      approvedBy: 'Marcus Vance (Commercial Manager)',
      items: [
        { name: 'Initial Physiotherapy Assessment (Student Clinic)', qty: 1, unitPrice: 45.00, vatRate: 0.0, net: 45.00, vat: 0.00 },
        { name: '12-Lead ECG Cardiovascular Panel', qty: 1, unitPrice: 60.00, vatRate: 0.0, net: 60.00, vat: 0.00 },
        { name: 'Biomechanics Lab Hire (2h)', qty: 1, unitPrice: 400.00, vatRate: 0.20, net: 400.00, vat: 80.00 },
        { name: 'Portable CPET Cart Hire (Day Rate)', qty: 1, unitPrice: 150.00, vatRate: 0.20, net: 150.00, vat: 30.00 },
        { name: 'CPD Workshop: Spinal Manipulation (1 Seat)', qty: 1, unitPrice: 125.00, vatRate: 0.20, net: 125.00, vat: 25.00 }
      ],
      netExempt: 105.00,
      netStandard: 675.00,
      vatStandard: 135.00,
      totalGross: 915.00,
      oracleEbsSynced: true,
      oracleBatchId: 'EBS-2026-1031-01'
    }
  ];

  const INITIAL_AUDIT_LOG = [
    {
      id: 'aud_1001',
      timestamp: '2026-10-31T14:15:22Z',
      userId: 'usr_stu_001',
      userName: 'Alex Walker (Student Practitioner)',
      role: 'student',
      action: 'EPR_DRAFT_SAVE',
      resource: 'rec_2026_0812 (James Taylor - Osteopathy)',
      ip: '150.204.14.88',
      hash: 'SHA256:7c3b2f910a4e321b09c847e9123847a98b71234cde56789012345678abcdef01'
    },
    {
      id: 'aud_1002',
      timestamp: '2026-10-31T14:16:05Z',
      userId: 'usr_sup_001',
      userName: 'Dr. Sarah Jenkins (Clinical Supervisor)',
      role: 'supervisor',
      action: 'EPR_REVIEW_ACCESS',
      resource: 'rec_2026_0812 (James Taylor - Osteopathy)',
      ip: '150.204.14.12',
      hash: 'SHA256:8d2e41c99b12345ef0192837465abcde9876543210fedcba0987654321fedcba'
    },
    {
      id: 'aud_1003',
      timestamp: '2026-10-31T12:05:14Z',
      userId: 'usr_mgr_001',
      userName: 'Marcus Vance (Commercial Manager)',
      role: 'manager',
      action: 'PURCHASE_ORDER_APPROVE',
      resource: 'ord_2026_0091 (Liverpool Harriers AC - £915.00)',
      ip: '150.204.10.45',
      hash: 'SHA256:4f81092384abcef01928374650192837465bcde8901234567890abcdef123456'
    },
    {
      id: 'aud_1004',
      timestamp: '2026-10-31T12:10:00Z',
      userId: 'usr_mgr_001',
      userName: 'Marcus Vance (Commercial Manager)',
      role: 'manager',
      action: 'ORACLE_EBS_GL_BATCH_GENERATE',
      resource: 'GL_INTERFACE_BATCH_20261031_01',
      ip: '150.204.10.45',
      hash: 'SHA256:1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809'
    }
  ];

  // Helper for SHA-256 fallback when Web Crypto isn't available
  async function computeSha256(message) {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      try {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return 'SHA256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback
      }
    }
    // Simple deterministic pseudo-hash fallback for environments without subtle crypto
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < message.length; i++) {
      const ch = message.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0');
    return 'SHA256:' + hex + hex + hex + hex;
  }

  class Store {
    constructor() {
      this.listeners = [];
      this.state = this.loadInitialState();
    }

    loadInitialState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          for (const oldKey of LEGACY_STORAGE_KEYS) {
            window.localStorage.removeItem(oldKey);
          }
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const staleMarkers = ['Ultrasound', 'Cosmed', 'Portable CPET Portable CPET', 'SEShub', 'Copperas', 'caren', 'dexa'];
            const hasStale = staleMarkers.some(m => saved.includes(m));
            if (hasStale) {
              window.localStorage.removeItem(STORAGE_KEY);
            } else {
              const parsed = JSON.parse(saved);
              // Verify structure has records and cart
              if (parsed && parsed.records && parsed.cart && parsed.currentUser) {
                return parsed;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Could not load stored state:', e);
      }
      return this.getDefaultState();
    }

    getDefaultState() {
      return {
        currentRole: 'supervisor', // Default persona
        currentUser: JSON.parse(JSON.stringify(INITIAL_PERSONAS.supervisor)),
        personas: JSON.parse(JSON.stringify(INITIAL_PERSONAS)),
        facilities: JSON.parse(JSON.stringify(INITIAL_FACILITIES)),
        equipment: JSON.parse(JSON.stringify(INITIAL_EQUIPMENT)),
        supervisors: JSON.parse(JSON.stringify(INITIAL_SUPERVISOR_ROSTER)),
        students: JSON.parse(JSON.stringify(INITIAL_STUDENT_ROSTER)),
        records: JSON.parse(JSON.stringify(INITIAL_RECORDS)),
        services: JSON.parse(JSON.stringify(INITIAL_SERVICES)),
        cart: JSON.parse(JSON.stringify(INITIAL_CART)),
        orders: JSON.parse(JSON.stringify(INITIAL_ORDERS)),
        auditLog: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOG)),
        activeDiscipline: 'osteopathy',
        activeTab: 'booking',
        waitlist: [
          { id: 'wl_001', clientName: 'David Miller', clientOrg: 'Liverpool Harriers AC', serviceId: 'srv_cpd_manip', time: '2026-10-31 09:12Z', status: 'WAITING' }
        ],
        waitlistOffer: null
      };
    }

    saveState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        }
      } catch (e) {
        // quota exceeded or privacy mode
      }
    }

    getState() {
      return this.state;
    }

    setState(patch) {
      this.state = { ...this.state, ...patch };
      this.saveState();
      this.notify();
    }

    subscribe(listener) {
      this.listeners.push(listener);
      return () => {
        this.listeners = this.listeners.filter(l => l !== listener);
      };
    }

    notify() {
      for (const listener of this.listeners) {
        try {
          listener(this.state);
        } catch (e) {
          console.error('Error in state subscriber:', e);
        }
      }
    }

    reset() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      } catch (e) {}
      this.state = this.getDefaultState();
      this.saveState();
      this.notify();
    }

    setRole(roleId) {
      if (this.state.personas[roleId]) {
        const nextUser = JSON.parse(JSON.stringify(this.state.personas[roleId]));
        this.setState({
          currentRole: roleId,
          currentUser: nextUser
        });
        this.addAuditLog('ROLE_SWITCH', `Switched active persona to ${nextUser.title} (${nextUser.name})`);
      }
    }

    setDiscipline(disciplineKey) {
      if (this.state.records[disciplineKey]) {
        this.setState({ activeDiscipline: disciplineKey });
      }
    }

    async addAuditLog(action, resource) {
      const ts = new Date().toISOString();
      const user = this.state.currentUser;
      const rawPayload = `${ts}|${user.id}|${user.role}|${action}|${resource}`;
      const hash = await computeSha256(rawPayload);

      const entry = {
        id: 'aud_' + Date.now().toString(36),
        timestamp: ts,
        userId: user.id,
        userName: `${user.name} (${user.title.split(' ')[0]})`,
        role: user.role,
        action: action,
        resource: resource,
        ip: '150.204.14.' + Math.floor(10 + Math.random() * 80),
        hash: hash
      };

      const updatedLog = [entry, ...this.state.auditLog];
      this.setState({ auditLog: updatedLog });
    }

    calculateCartTotals() {
      let netExempt = 0;
      let netStandard = 0;
      let vatStandard = 0;

      for (const item of this.state.cart) {
        const lineNet = item.unitPrice * item.qty;
        if (item.vatExempt || item.vatRate === 0) {
          netExempt += lineNet;
        } else {
          netStandard += lineNet;
          vatStandard += lineNet * item.vatRate;
        }
      }

      const totalGross = netExempt + netStandard + vatStandard;

      return {
        netExempt: Number(netExempt.toFixed(2)),
        netStandard: Number(netStandard.toFixed(2)),
        vatStandard: Number(vatStandard.toFixed(2)),
        totalGross: Number(totalGross.toFixed(2))
      };
    }

    async executeCountersignature(disciplineKey, amendmentText) {
      const rec = this.state.records[disciplineKey];
      if (!rec) return null;

      const user = this.state.currentUser;
      const ts = new Date().toISOString();
      const payloadToSign = JSON.stringify({
        recordId: rec.id,
        patientId: rec.patientId,
        discipline: rec.discipline,
        studentId: rec.authorId,
        supervisorId: user.id,
        timestamp: ts,
        amendment: amendmentText || rec.supervisorAmendment,
        version: 1
      });

      const signatureHash = await computeSha256(payloadToSign);

      const updatedRecord = {
        ...rec,
        status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
        activePlan: amendmentText || rec.supervisorAmendment || rec.studentDraftPlan,
        supervisorAmendment: amendmentText || rec.supervisorAmendment,
        signatureHash: signatureHash,
        signedTimestamp: ts,
        supervisorSignedBy: `${user.name} (${user.title})`
      };

      const updatedRecords = {
        ...this.state.records,
        [disciplineKey]: updatedRecord
      };

      // Also increment student competency hours
      const updatedStudents = this.state.students.map(s => {
        if (s.id === 'stu_walker') {
          return { ...s, hoursLogged: s.hoursLogged + 1, completedCases: s.completedCases + 1 };
        }
        return s;
      });

      this.setState({
        records: updatedRecords,
        students: updatedStudents
      });

      await this.addAuditLog('SUPERVISOR_COUNTERSIGN', `${rec.id} (${rec.patientName}) countersigned by ${user.name} [${signatureHash.substring(0, 16)}...]`);
      return updatedRecord;
    }

    async submitPurchaseOrder(poDetails) {
      const totals = this.calculateCartTotals();
      const orderId = 'ord_' + Date.now().toString(36);
      const orderNumber = 'ORD-2026-' + Math.floor(1000 + Math.random() * 9000);

      const newOrder = {
        id: orderId,
        orderNumber: orderNumber,
        customerType: 'B2B_ORGANISATIONAL',
        organisationName: poDetails.orgName || 'Liverpool Harriers Athletic Club',
        bookerName: poDetails.bookerName || this.state.currentUser.name,
        bookerEmail: poDetails.bookerEmail || 'd.miller@liverpoolharriers.org.uk',
        payingOrg: poDetails.payingOrg || 'Liverpool Harriers AC Accounts Payable',
        invoiceEmail: poDetails.invoiceEmail || 'accounts@liverpoolharriers.org.uk',
        poNumber: poDetails.poNumber || 'LH-2026-PO-' + Math.floor(1000 + Math.random() * 9000),
        paymentTerms: poDetails.paymentTerms || 'Net 30 Days',
        status: 'PENDING_PO_VERIFICATION',
        dateCreated: new Date().toISOString(),
        dateApproved: null,
        approvedBy: null,
        items: this.state.cart.map(c => ({
          name: c.name,
          qty: c.qty,
          unitPrice: c.unitPrice,
          vatRate: c.vatRate,
          net: c.unitPrice * c.qty,
          vat: c.vatExempt ? 0 : c.unitPrice * c.qty * c.vatRate
        })),
        netExempt: totals.netExempt,
        netStandard: totals.netStandard,
        vatStandard: totals.vatStandard,
        totalGross: totals.totalGross,
        oracleEbsSynced: false,
        oracleBatchId: null
      };

      const updatedOrders = [newOrder, ...this.state.orders];
      this.setState({ orders: updatedOrders });

      await this.addAuditLog('PO_SUBMIT', `${orderNumber} submitted by ${newOrder.bookerName} (PO: ${newOrder.poNumber}, Total: £${totals.totalGross})`);
      return newOrder;
    }

    async approvePurchaseOrder(orderId) {
      const user = this.state.currentUser;
      const ts = new Date().toISOString();
      const batchId = 'EBS-2026-' + Math.floor(1000 + Math.random() * 9000);

      const updatedOrders = this.state.orders.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'APPROVED — AWAITING PAYMENT',
            dateApproved: ts,
            approvedBy: `${user.name} (${user.title})`,
            oracleEbsSynced: true,
            oracleBatchId: batchId
          };
        }
        return ord;
      });

      this.setState({ orders: updatedOrders });
      await this.addAuditLog('PURCHASE_ORDER_APPROVE', `${orderId} approved by ${user.name} and synced to Oracle EBS Batch ${batchId}`);
    }

    generateOracleGLCSV() {
      const headers = [
        'STATUS',
        'LEDGER_ID',
        'ACCOUNTING_DATE',
        'USER_JE_SOURCE_NAME',
        'USER_JE_CATEGORY_NAME',
        'SEGMENT1_ENTITY',
        'SEGMENT2_COST_CENTRE',
        'SEGMENT3_SUB_UNIT',
        'SEGMENT4_ACCOUNT',
        'SEGMENT5_PROJECT',
        'ENTERED_DR',
        'ENTERED_CR',
        'CURRENCY_CODE',
        'REFERENCE1_PO',
        'REFERENCE4_DESC'
      ];

      const rows = [
        ['NEW', '2026', '2026-10-31', 'OIV_CLINICAL_HUB', 'Commercial Sales', '01', '101', '4020', '7210', 'PRJ-PERFHUB', '', '105.00', 'GBP', 'N/A', 'Clinical Consultations Healthcare Exempt (0%)'],
        ['NEW', '2026', '2026-10-31', 'OIV_CLINICAL_HUB', 'Commercial Sales', '01', '101', '4030', '7220', 'PRJ-PERFHUB', '', '400.00', 'GBP', 'LH-2026-PO-9942', 'Biomechanics Lab Hire 2h (Std Rated 20%)'],
        ['NEW', '2026', '2026-10-31', 'OIV_CLINICAL_HUB', 'Commercial Sales', '01', '101', '4030', '7230', 'PRJ-PERFHUB', '', '150.00', 'GBP', 'LH-2026-PO-9942', 'Portable CPET Cart Hire Day Rate (Std Rated 20%)'],
        ['NEW', '2026', '2026-10-31', 'OIV_CLINICAL_HUB', 'Commercial Sales', '01', '101', '4030', '7240', 'PRJ-PERFHUB', '', '125.00', 'GBP', 'LH-2026-PO-9942', 'CPD Workshop Spinal Manipulation (Std Rated 20%)'],
        ['NEW', '2026', '2026-10-31', 'OIV_CLINICAL_HUB', 'VAT Payable', '01', '101', '0000', '2110', 'PRJ-PERFHUB', '', '135.00', 'GBP', 'LH-2026-PO-9942', 'HM Revenue & Customs Output VAT (20%)'],
        ['NEW', '2026', '2026-10-31', 'OIV_CLINICAL_HUB', 'Trade Debtors', '01', '101', '0000', '1210', 'PRJ-PERFHUB', '915.00', '', 'GBP', 'LH-2026-PO-9942', 'Accounts Receivable Control Liverpool Harriers AC']
      ];

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      return csvContent;
    }

    generateResearchCSV() {
      const headers = [
        'PSEUDONYM_ID',
        'AGE_BAND',
        'GENDER',
        'DISTRICT_POSTCODE',
        'SERVICE_DISCIPLINE',
        'ENCOUNTER_DATE',
        'PRESENTING_REGION',
        'PRIMARY_DIAGNOSIS_CODE',
        'STANDARDIZED_OUTCOME_SCORE',
        'RESEARCH_CONSENT_VERIFIED'
      ];

      const rows = [
        ['LJMU-RES-8841-A', '25-29', 'Male', 'L3', 'Osteopathy', '2026-10-31', 'Cervicothoracic Spine', 'ICD11:ME84.0', 'VAS:6/10', 'TRUE'],
        ['LJMU-RES-8842-B', '20-24', 'Female', 'L3', 'Physiotherapy', '2026-10-30', 'Patellar Tendon', 'VISA-P:62/100', 'MSK-HQ:38/56', 'TRUE'],
        ['LJMU-RES-8843-C', '50-54', 'Male', 'L3', 'Cardiovascular', '2026-10-29', 'Cardiopulmonary Screening', 'Rhythm:SinusBrady', 'QRISK3:2.4%', 'TRUE'],
        ['LJMU-RES-8844-D', '25-29', 'Female', 'L3', 'Exercise Physiology', '2026-10-28', 'Cardiopulmonary Fitness', 'VO2peak:56.4', 'VT1:165W_VT2:285W', 'TRUE'],
        ['LJMU-RES-8845-E', '20-24', 'Male', 'L3', 'Strength & Conditioning', '2026-10-27', 'Neuromuscular Power', 'CMJ:42.6cm', 'Asymmetry:3.2%', 'TRUE']
      ];

      return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    generateResearchJSON() {
      return JSON.stringify([
        {
          researchId: 'LJMU-RES-8841-A',
          ageBand: '25-29 years',
          gender: 'Male',
          outwardPostcode: 'L3',
          discipline: 'Osteopathy',
          clinicalMetrics: { chiefComplaint: 'Cervical Spine', restriction: 'C5-C6 Facet', initialVAS: 6 },
          consentRecorded: true
        },
        {
          researchId: 'LJMU-RES-8842-B',
          ageBand: '20-24 years',
          gender: 'Female',
          outwardPostcode: 'L3',
          discipline: 'Physiotherapy',
          clinicalMetrics: { condition: 'Patellar Tendinopathy', visaP: 62, mskHq: 38 },
          consentRecorded: true
        },
        {
          researchId: 'LJMU-RES-8843-C',
          ageBand: '50-54 years',
          gender: 'Male',
          outwardPostcode: 'L3',
          discipline: 'Cardiovascular Screening',
          clinicalMetrics: { restingHR: 52, restingBP: '118/76', qrisk3Pct: 2.4, ecgRhythm: 'Sinus' },
          consentRecorded: true
        },
        {
          researchId: 'LJMU-RES-8844-D',
          ageBand: '25-29 years',
          gender: 'Female',
          outwardPostcode: 'L3',
          discipline: 'Clinical Exercise Physiology',
          clinicalMetrics: { vo2peak: 56.4, vt1Watts: 165, vt2Watts: 285, fev1FvcRatio: 84.8 },
          consentRecorded: true
        },
        {
          researchId: 'LJMU-RES-8845-E',
          ageBand: '20-24 years',
          gender: 'Male',
          outwardPostcode: 'L3',
          discipline: 'Strength & Conditioning',
          clinicalMetrics: { cmjHeightCm: 42.6, rsimod: 0.52, asymmetryPct: 3.2, vbtMeanVel: 0.72 },
          consentRecorded: true
        }
      ], null, 2);
    }
  }

  return new Store();
});
