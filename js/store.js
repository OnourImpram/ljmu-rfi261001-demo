(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./body-chart.js'));
  } else {
    root.AppStore = factory(root.BodyChart);
  }
})(typeof self !== 'undefined' ? self : this, function (bodyChart) {
  'use strict';

  const STORAGE_KEY = 'ljmu_hub_review_v4';

  const INITIAL_PERSONAS = {
    patient: {
      id:'usr_patient_001', name:'James Taylor', role:'patient', title:'Patient', patientId:'pat_taylor',
      episodeId:'rec_2026_0812'
    },
    student: {
      id: 'usr_stu_001',
      name: 'Alex Walker',
      role: 'student',
      title: 'Student Practitioner (Final-year)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins'
    },
    supervisor: {
      id: 'usr_sup_001',
      name: 'Dr. Sarah Jenkins',
      role: 'supervisor',
      title: 'Clinical practice educator'
    },
    manager: {
      id: 'usr_mgr_001',
      name: 'Marcus Vance',
      role: 'manager',
      title: 'Commercial & Lab Operations Manager'
    },
    booker: {
      id: 'usr_bkr_001',
      name: 'David Miller',
      role: 'booker',
      title: 'Head Coach & Corporate Booker',
      organization: 'Riverside Athletics Club (fictional)'
    }
  };

  const INITIAL_FACILITIES = [
    { id: 'rm_tr_g01', name: 'Teaching Clinic - Bay 1', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'osteopathy', status: 'occupied' },
    { id: 'rm_tr_g02', name: 'Teaching Clinic - Bay 2', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'physiotherapy', status: 'occupied' },
    { id: 'rm_tr_g03', name: 'Teaching Clinic - Bay 3', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'physiotherapy', status: 'occupied' },
    { id: 'rm_tr_g04', name: 'Teaching Clinic - Bay 4', campus: 'Teaching Clinic (demo)', type: 'clinical_bay', capacity: 1, discipline: 'osteopathy', status: 'available' },
    { id: 'rm_tr_biomech', name: 'Tom Reilly - Biomechanics Lab', campus: 'Byrom Street (Tom Reilly, L3 3AF)', type: 'specialist_lab', capacity: 10, discipline: 'biomechanics', status: 'available' },
    { id: 'rm_tr_env', name: 'Tom Reilly - Environmental Hypoxia Chamber', campus: 'Byrom Street (Tom Reilly, L3 3AF)', type: 'specialist_lab', capacity: 6, discipline: 'physiology', status: 'available' },
    { id: 'rm_tr_bodycomp', name: 'Tom Reilly - Body Composition Suite', campus: 'Byrom Street (Tom Reilly, L3 3AF)', type: 'diagnostic_suite', capacity: 2, discipline: 'physiology', status: 'available' },
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
    { id: 'sup_davies', name: 'Dr. Mark Davies', maxRatio: 4, activeBays: 1, room: 'Tom Reilly Physiology Labs', disciplines: ['cardiovascular', 'physiology'] }
  ];

  const INITIAL_STUDENT_ROSTER = [
    { id: 'stu_walker', name: 'Alex Walker', year: 'Final-year', supervisorId: 'sup_jenkins', hoursLogged: 124, targetHours: 200, completedCases: 38 },
    { id: 'stu_patel', name: 'Priya Patel', year: 'Final-year', supervisorId: 'sup_jenkins', hoursLogged: 148, targetHours: 200, completedCases: 46 }
  ];

  const INITIAL_RECORDS = {
    osteopathy: {
      id: 'rec_2026_0812',
      bodyMarkers: [{schemaVersion:2, siteId:'back:right:neck'}],
      patientId: 'pat_taylor',
      patientName: 'James Taylor',
      age: 28,
      gender: 'Male',
      dob: '1998-05-14',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-OST-2026-0812',
      discipline: 'osteopathy',
      disciplineTitle: 'Osteopathy clinic',
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
      patientId: 'pat_watson',
      patientName: 'Emma Watson',
      age: 24,
      gender: 'Female',
      dob: '2002-03-21',
      nhsNumber: '999 000 0000',
      episodeCode: 'LJMU-PHY-2026-0904',
      discipline: 'physiotherapy',
      disciplineTitle: 'Physiotherapy and musculoskeletal clinic',
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
      signatureHash: 'SHA256:7e91f043ba4e21a8c093847291a4fd09e13b827e8a93112cba504d6f81a79241',
      signedTimestamp: '2026-10-30T11:45:12Z',
      supervisorSignedBy: 'Dr. Sarah Jenkins',
      researchConsent: true,
      bodyMarkers: [
        { x: 145, y: 310, type: 'primary', label: 'Patellar Tendon (Pain: 6/10)' },
        { x: 140, y: 270, type: 'stiffness', label: 'Distal Quadriceps Guarding' }
      ],
      mskHqScore: 38
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
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins',
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
      qrisk3Score: 2.4
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
      disciplineTitle: 'Exercise physiology and CPET',
      status: 'SUPERVISOR COUNTERSIGNED & LOCKED',
      authorId: 'usr_stu_001',
      authorName: 'Alex Walker (Final-year Student)',
      supervisorId: 'usr_sup_001',
      supervisorName: 'Dr. Sarah Jenkins',
      encounterDate: '2026-10-28 15:00 GMT',
      subjective: 'Competitive triathlete undergoing physiological benchmarking for aerobic power and ventilatory thresholds on Lode Excalibur ergometer.',
      objective: 'Continuous ramp test (25W/min). VO2peak achieved: 56.4 ml/kg/min (114% predicted). Peak RER 1.18. FEV1 4.20L (98% pred), FVC 4.95L, Ratio 84.8%.',
      assessment: 'Ventilatory Threshold 1 (VT1) at 165W (2.3 L/min VO2). Ventilatory Threshold 2 (VT2 / RCP) at 285W (3.8 L/min VO2). Baseline blood lactate 1.2 mmol/L; peak blood lactate 8.6 mmol/L.',
      studentDraftPlan: 'Structure Zone 2 endurance volume at 145-160W (below VT1); establish threshold intervals at 265-280W.',
      supervisorAmendment: 'Thresholds verified against gas exchange criteria (V-slope method). Approved training plan.',
      activePlan: 'Structure Zone 2 endurance volume at 145-160W (below VT1); establish threshold intervals at 265-280W.',
      signatureHash: 'SHA256:c940291e0a2938471b827e8a93112cba504d6f81a792417e91f043ba4e21a8c0',
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
      disciplineTitle: 'Strength and conditioning',
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
      signatureHash: 'SHA256:d8a4f9103b4e21a7c093847291a4fd09e13b827e8a93112cba504d6f81a79241',
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
    {
      id: 'srv_physio_eval',
      name: 'Physiotherapy Initial Assessment',
      discipline: 'physiotherapy',
      stream: 'Area A',
      vatRate: 0.0,
      vatExempt: true,
      price: 45.00,
      duration: '45 mins',
      facility: 'Teaching Clinic Bay 2/3'
    },
    {
      id: 'srv_cardio_screen',
      name: '12-Lead ECG Cardiovascular Screen',
      discipline: 'cardiovascular',
      stream: 'Area A',
      vatRate: 0.0,
      vatExempt: true,
      price: 60.00,
      duration: '60 mins',
      facility: 'Cardiovascular Screening Suite'
    },
    {
      id: 'srv_biomech_hire',
      name: 'Biomechanics Lab Hire (2h Block)',
      discipline: 'biomechanics',
      stream: 'Area B',
      vatRate: 0.20,
      vatExempt: false,
      price: 400.00,
      duration: '2 Hours',
      facility: 'Tom Reilly Biomechanics Lab'
    },
    {
      id: 'srv_cpet_hire',
      name: 'Portable CPET Cart Hire (Day Rate)',
      discipline: 'physiology',
      stream: 'Area B',
      vatRate: 0.20,
      vatExempt: false,
      price: 150.00,
      duration: 'Full Day',
      facility: 'Specialist Equipment Store'
    },
    {
      id: 'srv_cpd_manip',
      name: 'CPD Workshop: Spinal Manipulation Masterclass',
      discipline: 'osteopathy',
      stream: 'Area B',
      vatRate: 0.0,
      vatExempt: true,
      price: 125.00,
      duration: '1 Day (7 CPD hrs)',
      facility: 'Tom Reilly Lecture & Practical Suite',
      seatsTotal: 20,
      seatsBooked: 20
    },
    {
      id: 'srv_env_hire',
      name: 'Environmental Chamber Hire (1 Hour)',
      discipline: 'physiology',
      stream: 'Area B',
      vatRate: 0.20,
      vatExempt: false,
      price: 125.00,
      duration: '1 Hour',
      facility: 'Tom Reilly Environmental Chamber'
    }
  ];

  const INITIAL_CART = [
    {
      serviceId: 'srv_physio_eval',
      name: 'Physiotherapy Initial Assessment (Student Clinic)',
      vatRate: 0.0,
      vatExempt: true,
      unitPrice: 45.00,
      qty: 1
    },
    {
      serviceId: 'srv_cardio_screen',
      name: '12-Lead ECG Cardiovascular Panel',
      vatRate: 0.0,
      vatExempt: true,
      unitPrice: 60.00,
      qty: 1
    },
    {
      serviceId: 'srv_biomech_hire',
      name: 'Biomechanics Lab Hire (2-Hour Block)',
      vatRate: 0.20,
      vatExempt: false,
      unitPrice: 400.00,
      qty: 1
    },
    {
      serviceId: 'srv_cpet_hire',
      name: 'Portable CPET Cart Hire (Day Rate)',
      vatRate: 0.20,
      vatExempt: false,
      unitPrice: 150.00,
      qty: 1
    },
    {
      serviceId: 'srv_env_hire',
      name: 'Environmental Chamber Hire (1 Hour)',
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
      ip: '192.0.2.88',
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
      ip: '192.0.2.12',
      hash: 'SHA256:8d2e41c99b12345ef0192837465abcde9876543210fedcba0987654321fedcba'
    },
    {
      id: 'aud_1003',
      timestamp: '2026-10-31T12:05:14Z',
      userId: 'usr_mgr_001',
      userName: 'Marcus Vance (Commercial Manager)',
      role: 'manager',
      action: 'PURCHASE_ORDER_APPROVE',
      resource: 'ord_2026_0091 (Riverside AC (fictional) - £915.00)',
      ip: '198.51.100.45',
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
      ip: '198.51.100.45',
      hash: 'SHA256:1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809'
    }
  ];

  async function computeSha256(message) {
    const api = typeof window !== 'undefined' && window.crypto && window.crypto.subtle;
    if (!api) return null;
    const bytes = await api.digest('SHA-256', new TextEncoder().encode(message));
    return 'SHA256:' + Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
  }

  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return /[",\r\n]/.test(text) ? '"' + text.replaceAll('"', '""') + '"' : text;
  }

  const costCentres = {
    srv_physio_eval: ['101', 'Teaching clinics', 'Clinical appointments'],
    srv_cardio_screen: ['101', 'Teaching clinics', 'Clinical appointments'],
    srv_biomech_hire: ['201', 'Laboratories', 'Laboratory hire'],
    srv_env_hire: ['201', 'Laboratories', 'Laboratory hire'],
    srv_cpet_hire: ['202', 'Equipment hire', 'Equipment rental'],
    srv_cpd_manip: ['203', 'Workshops', 'Continuing education']
  };

  function normalKey(value) {
    return String(value || '').normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
  }

  function payerKey(order) {
    const payer = normalKey(order.payingOrg);
    if (payer === 'riverside ac (fictional) accounts payable' || payer === 'riverside athletics club (fictional)') return 'riverside athletics club (fictional)';
    return payer;
  }

  function serviceKey(line) {
    if (line.serviceId && costCentres[line.serviceId]) return line.serviceId;
    const catalogued = INITIAL_SERVICES.find(service => service.name === line.name);
    if (catalogued) return catalogued.id;
    const oldCart = INITIAL_CART.find(item => item.name === line.name);
    if (oldCart) return oldCart.serviceId;
    const oldIndex = INITIAL_ORDERS[0].items.findIndex(item => item.name === line.name);
    return oldIndex >= 0 ? INITIAL_CART[oldIndex].serviceId : 'unmapped';
  }

  function pricedLine(line, tariff) {
    const serviceId = serviceKey(line);
    const listPence = Math.round(line.unitPrice * 100);
    const discounted = tariff === 'club-block' && line.qty >= 3 &&
      ['srv_biomech_hire','srv_env_hire','srv_cpet_hire','srv_cpd_manip'].includes(serviceId);
    const unitPence = discounted ? Math.round(listPence * 0.9) : listPence;
    const netPence = unitPence * line.qty;
    const vatRate = line.vatExempt ? 0 : line.vatRate;
    return {serviceId, name:line.name, qty:line.qty, unitPrice:unitPence / 100,
      listUnitPrice:listPence / 100, discountPence:(listPence - unitPence) * line.qty,
      vatRate, net:netPence / 100, vat:Math.round(netPence * vatRate) / 100};
  }

  function totalLines(items) {
    let exempt = 0, standard = 0, tax = 0;
    for (const line of items) {
      const net = Math.round(line.net * 100);
      if (line.vatRate === 0) exempt += net; else standard += net;
      tax += Math.round(line.vat * 100);
    }
    return {netExempt:exempt/100, netStandard:standard/100, vatStandard:tax/100, totalGross:(exempt+standard+tax)/100};
  }

  function incomeAccount(line) {
    const serviceId = serviceKey(line);
    const [centre, department, activity] = costCentres[serviceId] || ['000','Unmapped','Unmapped activity'];
    const service = INITIAL_SERVICES.find(item => item.id === serviceId);
    return {centre, department, activity, service:service?.name || line.name, sub:line.vatRate === 0 ? '4020' : '4030',
      account:line.vatRate === 0 ? '7210' : '7220'};
  }

  class Store {
    constructor() {
      this.listeners = [];
      this.state = this.loadInitialState();
    }

    loadInitialState() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const saved = window.localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed?.records && parsed.cart && parsed.currentUser) {
              parsed.personas = {...parsed.personas,patient:{...INITIAL_PERSONAS.patient}};
              parsed.bookingNotices = parsed.bookingNotices || [];
              parsed.reservations = (parsed.reservations || []).map((booking, index) => ({
                id: 'AP-' + String(index + 1).padStart(4, '0'), slot:'morning', status:'Booked',
                ownerId:null, ...booking
              }));
              for (const key of ['cardiovascular', 'physiology']) {
                const record = parsed.records[key];
                if (record?.id === INITIAL_RECORDS[key].id &&
                    record.supervisorId === INITIAL_PERSONAS.supervisor.id &&
                    ['Dr. Mark Davies', 'Dr. Mark Davies, PhD'].includes(record.supervisorName)) {
                  record.supervisorName = INITIAL_PERSONAS.supervisor.name;
                }
              }
              return parsed;
            }
          }
        }
      } catch {
        return this.getDefaultState();
      }
      return this.getDefaultState();
    }

    getDefaultState() {
      return {
        currentRole: 'supervisor',
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
        reservations: [],
        bookingNotices: [],
        waitlist: [
          { id: 'wl_001', clientName: 'David Miller', clientOrg: 'Riverside AC (fictional)', serviceId: 'srv_cpd_manip', time: '2026-10-31 09:12Z', status: 'WAITING' }
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
    }

    notify() {
      for (const listener of this.listeners) {
        try {
          listener(this.state);
        } catch (e) {
          if (typeof globalThis.reportError === 'function') globalThis.reportError(e);
          else queueMicrotask(() => { throw e; });
        }
      }
    }

    reset() {
      bodyChart.clearSession();
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
        if (roleId !== this.state.currentRole) bodyChart.clearSession();
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

      const id = typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : Date.now().toString(36) + '-' + this.state.auditLog.length;
      const entry = {
        id: 'aud_' + id,
        timestamp: ts,
        userId: user.id,
        userName: `${user.name} (${user.title.split(' ')[0]})`,
        role: user.role,
        action: action,
        resource: resource,
        ip: '192.0.2.' + Math.floor(10 + Math.random() * 80),
        hash: hash || 'Digest unavailable'
      };

      const updatedLog = [entry, ...this.state.auditLog];
      this.setState({ auditLog: updatedLog });
    }

    bookingRoster(slot = 'morning', excludeId, reservations = this.state.reservations || []) {
      const active = reservations.filter(item => item.status !== 'Cancelled' && item.id !== excludeId && (item.slot || 'morning') === slot);
      const facilities = INITIAL_FACILITIES.map(room => ({
        ...room, status: active.some(b => b.roomId === room.id) ? 'occupied' : room.status
      }));
      const equipment = INITIAL_EQUIPMENT.map(asset => ({
        ...asset, status: active.some(b => b.equipmentId === asset.id) ? 'reserved' : asset.status
      }));
      const supervisors = INITIAL_SUPERVISOR_ROSTER.map(supervisor => ({
        ...supervisor, activeBays: supervisor.activeBays + active.filter(b => b.supervisorId === supervisor.id).length
      }));
      return {active, facilities, equipment, supervisors};
    }

    mayManageBooking(booking) {
      const {currentRole, currentUser} = this.state;
      if (currentRole === 'manager' || currentRole === 'supervisor') return true;
      if (currentRole === 'patient') return booking.ownerId === currentUser.id && booking.serviceId === 'student_osteo' &&
        booking.patientId === currentUser.patientId && booking.episodeId === currentUser.episodeId;
      if (currentRole === 'student') return booking.practitionerId === 'stu_walker';
      return currentRole === 'booker' && booking.serviceId === 'commercial_cpet' && booking.ownerId === currentUser.id;
    }

    checkBooking(selection, previousId) {
      const {serviceId, practitionerId, supervisorId, roomId, equipmentId, slot = 'morning'} = selection;
      const previous = previousId && this.state.reservations.find(item => item.id === previousId);
      const {active, facilities, equipment, supervisors} = this.bookingRoster(slot, previousId);
      const commercial = serviceId === 'commercial_cpet';
      const studentService = ['student_osteo', 'student_physio'].includes(serviceId);
      const student = this.state.students.find(person => person.id === practitionerId);
      const supervisor = supervisors.find(person => person.id === supervisorId);
      const practitioner = student || supervisors.find(person => person.id === practitionerId);
      const room = facilities.find(item => item.id === roomId);
      const asset = equipment.find(item => item.id === equipmentId);
      const issues = {};
      if (!['morning','afternoon'].includes(slot)) issues.slot = 'Choose a listed session.';
      if (previousId && (!previous || previous.status === 'Cancelled' || !this.mayManageBooking(previous))) {
        issues.access = 'This appointment cannot be changed in this role.';
      }
      if (previous?.patientId && serviceId !== 'student_osteo') issues.access = 'Keep the linked patient appointment in the osteopathy service.';
      if (selection.forPatient && (previousId || !['supervisor','manager'].includes(this.state.currentRole) ||
          selection.forPatient !== 'pat_taylor' || serviceId !== 'student_osteo')) {
        issues.access = 'Use the linked osteopathy service for a booking on behalf of this patient.';
      }
      const linked = this.state.currentRole === 'patient' ? this.state.currentUser : null;
      if (!this.mayManageBooking({...selection, ownerId:this.state.currentUser.id,patientId:linked?.patientId,episodeId:linked?.episodeId})) {
        issues.access = 'Choose a service and practitioner available to your role.';
      }
      if (!practitioner || (!studentService && !commercial) ||
          (studentService && !student) || (commercial && practitionerId !== 'sup_davies')) {
        issues.practitioner = 'Choose a student for a clinic or the exercise physiologist for CPET.';
      } else if (active.some(item => item.practitionerId === practitionerId)) {
        issues.practitioner = 'The practitioner already has an appointment in this session.';
      }
      if (!room || room.status !== 'available') issues.room = 'The selected room is occupied.';
      if ((commercial && roomId !== 'rm_tr_env') || (studentService && room?.type !== 'clinical_bay')) {
        issues.room = 'Choose a clinic bay for a student or the environmental chamber for CPET.';
      }
      if (equipmentId !== 'none' && asset?.status !== 'available') {
        issues.equipment = 'This equipment is in use or out of service.';
      } else if (commercial && equipmentId !== 'eq_cpet_01') {
        issues.equipment = 'The CPET appointment needs the portable metabolic cart.';
      }
      if (studentService && (!supervisor || supervisor.activeBays >= supervisor.maxRatio)) {
        issues.ratio = 'Choose a supervisor with an available teaching place.';
      }
      return {issues, allowed: !Object.keys(issues).length, studentService, practitioner, supervisor, room, asset};
    }

    saveReservations(reservations, booking, message) {
      const {facilities, equipment, supervisors} = this.bookingRoster('morning', null, reservations);
      const bookingNotices = [...(this.state.bookingNotices || []), {
        reference:booking.id, ownerId:booking.ownerId, message, time:new Date().toISOString()
      }];
      this.setState({reservations, facilities, equipment, supervisors, bookingNotices});
    }

    async reserveBooking(selection, previousId) {
      const {allowed, studentService, practitioner, supervisor, room, asset} = this.checkBooking(selection, previousId);
      if (!allowed) return false;
      const reservations = this.state.reservations || [];
      const previous = reservations.find(item => item.id === previousId);
      const {serviceId, practitionerId, supervisorId, roomId, equipmentId, slot = 'morning'} = selection;
      const id = previous?.id || 'AP-' + String(reservations.length + 1).padStart(4, '0');
      const patient = !previous && serviceId === 'student_osteo' && (this.state.currentRole === 'patient' || selection.forPatient === 'pat_taylor') ?
        this.state.personas.patient : null;
      const reservation = {id, ownerId:previous?.ownerId || patient?.id || this.state.currentUser.id,
        patientId:previous?.patientId || patient?.patientId || null, episodeId:previous?.episodeId || patient?.episodeId || null,
        bookedBy:previous?.bookedBy || this.state.currentUser.id, status:'Booked',
        serviceId, practitionerId, supervisorId: studentService ? supervisorId : null, roomId, equipmentId, slot};
      if (previous && ['serviceId','practitionerId','supervisorId','roomId','equipmentId','slot'].every(key => reservation[key] === previous[key])) return false;
      this.saveReservations(previous ? reservations.map(item => item.id === id ? reservation : item) : [...reservations, reservation],
        reservation, 'Appointment ' + (previous ? 'changed' : 'booked') + ' for ' + (slot === 'morning' ? '09:00–11:00' : '14:00–16:00') + ' in ' + room.name + '.');
      const serviceNames = {student_osteo: 'Student osteopathy', student_physio: 'Student physiotherapy', commercial_cpet: 'Commercial CPET'};
      const detail = [id, serviceNames[serviceId], room.name, practitioner.name, slot];
      if (studentService) detail.push('supervised by ' + supervisor.name);
      if (asset) detail.push(asset.name);
      await this.addAuditLog(previous ? 'BOOKING_CHANGED' : 'BOOKING_CONFIRMED', detail.join(' · '));
      return true;
    }

    async cancelBooking(id) {
      const booking = this.state.reservations.find(item => item.id === id);
      if (!booking || booking.status === 'Cancelled' || !this.mayManageBooking(booking)) return false;
      this.saveReservations(this.state.reservations.map(item => item.id === id ? {...item, status:'Cancelled'} : item),
        booking, 'Your appointment has been cancelled.');
      await this.addAuditLog('BOOKING_CANCELLED', id + ' · ' + booking.slot);
      return true;
    }

    priceCart() { return this.state.cart.map(line => pricedLine(line, this.state.tariff)); }

    calculateCartTotals() { return totalLines(this.priceCart()); }

    priceGroup(groupId, sameOrderId) {
      const group = (this.state.groupBookings || []).find(g => g.id === groupId);
      const service = this.state.services.find(item => item.id === group?.serviceId);
      if (!group || !service || group.status !== 'Booked' || group.ownerId !== this.state.currentUser.id ||
          !Number.isSafeInteger(group.places) || group.places < 1 || this.state.orders.some(o => o.groupBookingId === groupId && o.id !== sameOrderId)) return null;
      return pricedLine({serviceId:service.id, name:service.name, qty:group.places, unitPrice:service.price,
        vatRate:service.vatRate, vatExempt:service.vatExempt}, this.state.tariff);
    }

    escapeText(value) {
      return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
    }

    async changeBodySite(discipline, siteId, operation) {
      const record = this.state.records[discipline];
      if (!['osteopathy','physiotherapy'].includes(discipline) || !record || this.state.currentRole !== 'student' ||
          record.authorId !== this.state.currentUser.id || record.status.includes('COUNTERSIGNED') ||
          !bodyChart.getSite(siteId) || !['add','remove'].includes(operation)) return false;
      const markers = record.bodyMarkers || [];
      const match = marker => marker?.schemaVersion === 2 && marker.siteId === siteId;
      const present = markers.some(match);
      if ((operation === 'add' && present) || (operation === 'remove' && !present)) return false;
      const bodyMarkers = operation === 'add' ? [...markers,{schemaVersion:2,siteId}] : markers.filter(marker => !match(marker));
      this.setState({records:{...this.state.records,[discipline]:{...record,bodyMarkers}}});
      await this.addAuditLog(operation === 'add' ? 'EPR_SITE_ADDED' : 'EPR_SITE_REMOVED',record.id + ' · ' + siteId);
      return true;
    }

    async saveDraft(key, changes) {
      const rec = this.state.records[key];
      if (this.state.currentRole !== 'student' || !rec || rec.authorId !== this.state.currentUser.id || rec.status.includes('COUNTERSIGNED')) return false;
      const fields = ['subjective', 'objective', 'assessment'];
      const sanitized = Object.fromEntries(fields.map(field => [field, String(changes[field] ?? rec[field]).slice(0, 5000)]));
      this.setState({records: {...this.state.records, [key]: {...rec, ...sanitized}}});
      await this.addAuditLog('EPR_DRAFT_SAVE', rec.id);
      return true;
    }

    async executeCountersignature(disciplineKey, amendmentText) {
      const rec = this.state.records[disciplineKey];
      const user = this.state.currentUser;
      if (this.state.currentRole !== 'supervisor' || !rec || rec.supervisorId !== user.id || rec.status.includes('COUNTERSIGNED')) return null;
      const ts = new Date().toISOString();
      const payloadToSign = JSON.stringify({record: rec, reviewer: user.id, reviewedAt: ts, amendment: amendmentText || rec.supervisorAmendment});
      const signatureHash = await computeSha256(payloadToSign);
      if (!signatureHash || this.state.records[disciplineKey] !== rec || this.state.currentUser !== user) return null;

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

      const updatedStudents = this.state.students.map(s => {
        if (s.name === rec.authorName.split(' (')[0]) {
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

    reviewPurchaseOrder(details) {
      if (this.state.currentRole !== 'booker') return {status:'invalid',message:'Use the client booker to submit.'};
      const poNumber = String(details.poNumber || '').normalize('NFKC').trim();
      if (!poNumber || poNumber.length > 60) return {status:'invalid',message:'Enter a purchase order reference of up to 60 characters.'};
      const group = details.groupBookingId && (this.state.groupBookings || []).find(g => g.id === details.groupBookingId);
      const payer = String(group?.organisation || details.payingOrg || details.orgName || 'Riverside AC (fictional) Accounts Payable').trim();
      const reference = normalKey(poNumber), identity = payerKey({payingOrg:payer});
      if (!identity) return {status:'invalid',message:'Enter the paying organisation.'};
      const prior = this.state.orders.find(o => normalKey(o.poNumber) === reference && payerKey(o) === identity);
      const groupLine = group && this.priceGroup(group.id,prior?.id);
      if (details.groupBookingId && !groupLine) return {status:'invalid',message:'This booking is unavailable or already linked to an order.'};
      const lines = groupLine ? [groupLine] : this.priceCart();
      if (!lines.length) return {status:'invalid',message:'Choose a service before submitting.'};
      const fingerprint = items => items.map(line => JSON.stringify([serviceKey(line), serviceKey(line) === 'unmapped' ? normalKey(line.name) : '', line.qty,
        Math.round(line.unitPrice*100),Math.round(line.net*100),Math.round(line.vat*100),line.vatRate])).sort().join('|');
      const terms = details.paymentTerms || 'Net 30 Days';
      if (prior) {
        const same = (prior.groupBookingId || null) === (group?.id || null) && normalKey(prior.paymentTerms) === normalKey(terms) &&
          fingerprint(prior.items) === fingerprint(lines);
        return same ? {status:'existing',order:prior,message:prior.orderNumber + ' already recorded for this purchase order.'} :
          {status:'conflict',message:'This organisation has already used this purchase order reference for different items or terms. Check the existing order or enter another reference.'};
      }
      return {status:'new',lines,totals:totalLines(lines),group,payer,poNumber};
    }

    async submitPurchaseOrder(poDetails) {
      const review = this.reviewPurchaseOrder(poDetails);
      if (review.status === 'existing') return review.order;
      if (review.status !== 'new') return null;
      const {lines, totals, group, payer, poNumber} = review;
      const sequence = this.state.orders.length + 1;
      const orderId = 'order-demo-' + sequence;
      const orderNumber = 'INV-' + String(sequence).padStart(5, '0');
      const newOrder = {
        id: orderId,
        orderNumber: orderNumber,
        groupBookingId:group?.id || null,
        tariff:this.state.tariff || 'standard',
        customerType: 'B2B_ORGANISATIONAL',
        organisationName: group?.organisation || poDetails.orgName || 'Riverside Athletics Club (fictional)',
        bookerName: poDetails.bookerName || this.state.currentUser.name,
        bookerEmail: poDetails.bookerEmail || 'd.miller@riverside-ac.example',
        payingOrg:payer,
        invoiceEmail: poDetails.invoiceEmail || 'accounts@riverside-ac.example',
        poNumber,
        paymentTerms: poDetails.paymentTerms || 'Net 30 Days',
        status: 'PENDING_PO_VERIFICATION',
        dateCreated: new Date().toISOString(),
        dateApproved: null,
        approvedBy: null,
        items:lines,
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
      if (this.state.currentRole !== 'manager' || !this.state.orders.some(o => o.id === orderId && o.status === 'PENDING_PO_VERIFICATION')) return false;
      const batchId = 'DEMO-' + orderId;

      const updatedOrders = this.state.orders.map(ord => {
        if (ord.id === orderId) {
          return {
            ...ord,
            status: 'APPROVED: AWAITING PAYMENT',
            dateApproved: ts,
            approvedBy: `${user.name} (${user.title})`,
            oracleEbsSynced: false,
            oracleBatchId: batchId
          };
        }
        return ord;
      });

      this.setState({ orders: updatedOrders });
      await this.addAuditLog('PURCHASE_ORDER_APPROVE', `${orderId} approved by ${user.name} for local journal batch ${batchId}`);
    }

    invoiceAccount(orderId) {
      if (this.state.currentRole === 'patient') return null;
      const order = this.state.orders.find(o => o.id === orderId && o.status.startsWith('APPROVED'));
      if (!order) return null;
      const entries = order.entries || [];
      const remaining = order.items.map(line => line.qty);
      let creditedPence = 0, paidPence = 0, refundedPence = 0;
      for (const entry of entries) {
        if (entry.kind === 'credit') {
          creditedPence += entry.pence;
          for (const line of entry.items) remaining[line.index] -= line.qty;
        } else if (entry.kind === 'receipt') paidPence += entry.pence;
        else if (entry.kind === 'refund') refundedPence += entry.pence;
      }
      const balance = Math.round(order.totalGross * 100) - creditedPence - paidPence + refundedPence;
      return {order, entries, remaining, creditedPence, paidPence, refundedPence,
        duePence:Math.max(0,balance), refundablePence:Math.max(0,-balance)};
    }

    creditPreview(orderId, index, quantity) {
      const account = this.invoiceAccount(orderId);
      if (!account) return null;
      const all = index === 'all';
      if (!all && (!Number.isSafeInteger(index) || index < 0 || index >= account.remaining.length ||
          !Number.isSafeInteger(quantity) || quantity < 1 || quantity > account.remaining[index])) return null;
      const items = [];
      for (const [i,line] of account.order.items.entries()) {
        const left = account.remaining[i], qty = all ? left : i === index ? quantity : 0;
        if (!qty) continue;
        const prior = line.qty - left;
        const creditPart = amount => Math.round(Math.round(amount*100) * (prior+qty) / line.qty) - Math.round(Math.round(amount*100) * prior / line.qty);
        items.push({...line, index:i, qty, net:creditPart(line.net)/100, vat:creditPart(line.vat)/100});
      }
      return items.length ? {items,pence:Math.round(totalLines(items).totalGross * 100)} : null;
    }

    #financeRevision(account, fields) {
      const sequence = account.entries.length + 1;
      const prefix = {credit:'CN', receipt:'RC', refund:'RF'}[fields.kind];
      const entry = {...fields, id:prefix + '-' + account.order.orderNumber + '-' + sequence, date:new Date().toISOString()};
      const before = account.duePence - account.refundablePence;
      const balance = before + (fields.kind === 'refund' ? fields.pence : -fields.pence);
      const label = balance < 0 ? 'REFUND DUE' : balance > 0 ? 'AWAITING PAYMENT' : 'SETTLED';
      const order = {...account.order,status:'APPROVED: ' + label,entries:[...account.entries,entry]};
      return {entry,order};
    }

    async #postFinanceEntry(account, fields) {
      const change = this.#financeRevision(account,fields);
      this.setState({orders:this.state.orders.map(o => o.id === change.order.id ? change.order : o)});
      await this.addAuditLog('FINANCE_' + fields.kind.toUpperCase(), change.entry.id + ' · ' + account.order.poNumber);
      return change.entry;
    }

    #referenceUsed(reference) {
      const key = normalKey(reference);
      return this.state.orders.some(order => (order.entries || []).some(e => e.reference && normalKey(e.reference) === key));
    }

    outstandingPayers() {
      if (this.state.currentRole !== 'manager') return [];
      const groups = new Map();
      for (const order of this.state.orders) {
        const account = this.invoiceAccount(order.id);
        if (!account?.duePence) continue;
        const key = payerKey(order);
        if (!groups.has(key)) groups.set(key,{key,name:order.payingOrg,accounts:[]});
        groups.get(key).accounts.push(account);
      }
      return [...groups.values()].filter(group => group.accounts.length > 1);
    }

    async recordRemittance(allocations, reference) {
      if (this.state.currentRole !== 'manager' || !Array.isArray(allocations) || allocations.length < 2 ||
          typeof reference !== 'string' || !reference.trim() || reference.trim().length > 60 || this.#referenceUsed(reference)) return null;
      const ids = new Set(allocations.map(a => a?.orderId));
      if (ids.size !== allocations.length || ids.has(undefined)) return null;
      const changes = new Map();
      let payer = null, total = 0;
      const batches = new Set(this.state.orders.flatMap(o => (o.entries || []).map(e => e.batch).filter(Boolean)));
      const batch = 'RM-' + String(batches.size + 1).padStart(5,'0');
      for (const {orderId,pence,revision} of allocations) {
        const account = this.invoiceAccount(orderId);
        if (!account || revision !== account.entries.length || !Number.isSafeInteger(pence) || pence < 1 || pence > account.duePence) return null;
        const key = payerKey(account.order);
        if (!key || (payer !== null && key !== payer)) return null;
        payer = key; total += pence;
        const {order} = this.#financeRevision(account,{kind:'receipt',method:'Bank transfer',pence,reference:reference.trim(),batch});
        changes.set(orderId,order);
      }
      this.setState({orders:this.state.orders.map(o => changes.get(o.id) || o)});
      await this.addAuditLog('FINANCE_REMITTANCE', batch + ' · ' + allocations.length + ' invoices');
      return {batch,pence:total};
    }

    async issueCredit(orderId, index, qty, reason, revision) {
      const account = this.invoiceAccount(orderId);
      const summary = this.creditPreview(orderId,index,qty);
      if (this.state.currentRole !== 'manager' || !summary || account.entries.length !== revision ||
          typeof reason !== 'string' || !reason.trim()) return null;
      return this.#postFinanceEntry(account,{kind:'credit',...summary,reason:reason.trim().slice(0,120)});
    }

    async recordCash(orderId, kind, pence, reference, revision, method = 'Bank transfer') {
      const account = this.invoiceAccount(orderId);
      if (this.state.currentRole !== 'manager' || !account || account.entries.length !== revision ||
          !['receipt','refund'].includes(kind) || !Number.isSafeInteger(pence) || pence < 1 ||
          typeof reference !== 'string' || !reference.trim() || reference.trim().length > 60) return null;
      if (!['Bank transfer','External card payment'].includes(method)) return null;
      if (pence > (kind === 'receipt' ? account.duePence : account.refundablePence)) return null;
      const ref = reference.trim();
      if (this.#referenceUsed(ref)) return null;
      return this.#postFinanceEntry(account,{kind,pence,reference:ref,method});
    }

    incomeReport(level = 'service') {
      if (!['supervisor','manager'].includes(this.state.currentRole)) return [];
      if (!['service','activity','centre'].includes(level)) return [];
      const groups = new Map();
      const collect = (items, direction) => {
        for (const line of items) {
          const dimensions = incomeAccount(line);
          const key = level === 'activity' ? dimensions.activity : level === 'centre' ? dimensions.centre : dimensions.service;
          const row = groups.get(key) || {centre:level === 'activity' ? '' : dimensions.centre,
            department:level === 'activity' ? '' : dimensions.department,activity:level === 'centre' ? '' : dimensions.activity,
            service:level === 'service' ? dimensions.service : '',netPence:0,vatPence:0,units:0};
          row.netPence += direction * Math.round(line.net * 100);
          row.vatPence += direction * Math.round(line.vat * 100);
          row.units += direction * line.qty;
          groups.set(key,row);
        }
      };
      for (const order of this.state.orders.filter(o => o.status.startsWith('APPROVED'))) {
        collect(order.items,1);
        for (const entry of order.entries || []) if (entry.kind === 'credit') collect(entry.items,-1);
      }
      return [...groups.values()].sort((a,b) => a.centre.localeCompare(b.centre) || a.service.localeCompare(b.service));
    }

    incomeCSV(level = 'service') {
      const headings = ['COST_CENTRE','DEPARTMENT','ACTIVITY','SERVICE','NET_UNITS','NET_INCOME_GBP','OUTPUT_VAT_GBP'];
      const rows = this.incomeReport(level).map(r => [r.centre,r.department,r.activity,r.service,r.units,(r.netPence/100).toFixed(2),(r.vatPence/100).toFixed(2)]);
      return [headings,...rows].map(row => row.map(csvCell).join(',')).join(String.fromCharCode(13,10));
    }

    latestJournal(orderId, documentId) {
      if (!['manager','supervisor'].includes(this.state.currentRole)) return null;
      const order = this.state.orders.find(o => o.status.startsWith('APPROVED') && (!orderId || o.id === orderId));
      if (!order) return null;
      const entry = documentId && documentId !== 'invoice' ? (order.entries || []).find(e => e.id === documentId) : null;
      if (documentId && documentId !== 'invoice' && !entry) return null;
      const amounts = [];
      if (!entry || entry.kind === 'credit') {
        const items = entry ? entry.items : order.items;
        const totals = totalLines(items);
        for (const line of items) {
          const {centre,service,sub,account} = incomeAccount(line);
          amounts.push([service,sub,account,entry ? line.net : 0,entry ? 0 : line.net,centre]);
        }
        if (totals.vatStandard) amounts.push(['Output VAT','0000','2110',entry ? totals.vatStandard : 0,entry ? 0 : totals.vatStandard,'100']);
        amounts.push(['Accounts receivable','0000','1210',entry ? 0 : totals.totalGross,entry ? totals.totalGross : 0,'100']);
      } else {
        const cash = entry.pence/100, receipt = entry.kind === 'receipt';
        amounts.push(['Bank clearing','0000','1100',receipt ? cash : 0,receipt ? 0 : cash,'100']);
        amounts.push(['Accounts receivable','0000','1210',receipt ? 0 : cash,receipt ? cash : 0,'100']);
      }
      return {order,amounts,document:entry?.id || order.orderNumber,date:entry?.date || order.dateApproved,externalReference:entry?.reference || '',batch:entry?.batch || ''};
    }

    generateOracleGLCSV(orderId, documentId) {
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
        'REFERENCE4_DESC', 'DOCUMENT_REF', 'PAYMENT_REFERENCE', 'REMITTANCE_REF'
      ];

      const journal = this.latestJournal(orderId, documentId);
      if (!journal) return headers.join(',');
      const {order, amounts} = journal;
      const rows = amounts.map(([label, sub, account, dr, cr, centre]) => ['NEW', '2026', journal.date.slice(0, 10), 'OIV_DEMO', 'Sample journal', '01', centre, sub, account, 'PRJ-PERFHUB', dr.toFixed(2), cr.toFixed(2), 'GBP', order.poNumber, label, journal.document,journal.externalReference,journal.batch]);
      return [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    }

    remittanceCSV(batch) {
      if (!['manager','supervisor'].includes(this.state.currentRole) || !batch) return '';
      const documents = [];
      for (const order of this.state.orders) {
        for (const entry of order.entries || []) {
          if (entry.batch === batch) documents.push(this.generateOracleGLCSV(order.id,entry.id));
        }
      }
      const separator = String.fromCharCode(13,10);
      return documents.map((doc,index) => index ? doc.slice(doc.indexOf(separator) + separator.length) : doc).join(separator);
    }

    researchRows() {
      if (this.state.currentRole !== 'supervisor') return [];
      return Object.entries(this.state.records).filter(([, rec]) => rec.researchConsent).map(([key, rec]) => ({
        studyCode: 'SAMPLE-' + (Object.keys(INITIAL_RECORDS).indexOf(key) + 1),
        ageBand: Math.floor(rec.age / 10) * 10 + '–' + (Math.floor(rec.age / 10) * 10 + 9),
        discipline: rec.discipline,
        status: rec.status,
        consentRecorded: true,
        mskHqScore: Number.isFinite(rec.mskHqScore) ? rec.mskHqScore : null,
        heartRateBpm: Number.isFinite(rec.ecgMetrics?.hr) ? rec.ecgMetrics.hr : null,
        vo2PeakMlKgMin: Number.isFinite(rec.cpetData?.vo2peak) ? rec.cpetData.vo2peak : null,
        jumpHeightCm: Number.isFinite(rec.scData?.jumpHeight) ? rec.scData.jumpHeight : null
      }));
    }
    generateResearchJSON() { return JSON.stringify(this.researchRows(), null, 2); }
    generateResearchCSV() {
      const header = ['studyCode','ageBand','discipline','status','consentRecorded','mskHqScore','heartRateBpm','vo2PeakMlKgMin','jumpHeightCm'];
      return [header, ...this.researchRows().map(row => header.map(key => row[key]))].map(row => row.map(csvCell).join(',')).join('\r\n');
    }
  }

  return new Store();
});
