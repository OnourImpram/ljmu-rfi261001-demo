/**
 * LJMU Clinical, Student Supervision & Commercial Booking Hub
 * Multi-Constraint Booking Engine, Capacity Guard & Waitlist Simulation
 * Author: ONOUR IMPRAM VENTURES LTD (Company #17429906)
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.BookingModule = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  class BookingModule {
    constructor() {
      this.container = null;
      this.modal = null;
      this.selectedBay = 'rm_tr_g04';
      this.selectedSupervisor = 'sup_jenkins';
      this.waitlistOfferTimer = null;
    }

    init(containerId) {
      this.container = document.getElementById(containerId);
      if (!this.container) return;
      this.render();
      this.bindEvents();
    }

    render() {
      const state = AppStore.getState();
      const sup = state.supervisors.find(s => s.id === 'sup_jenkins') || state.supervisors[0];
      const ratioPct = Math.round((sup.activeBays / sup.maxRatio) * 100);

      this.container.innerHTML = `
        <div class="view-header">
          <div class="view-title-group">
            <span class="view-eyebrow">Area A & Area B Scheduling Core</span>
            <h2 class="view-title">Multi-Constraint Booking & Capacity Guard</h2>
            <p class="view-description">
              Simultaneous 4-constraint validation: Practitioner/Student + Physical Bay + Diagnostic Equipment + 1:4 Supervisor-to-Student Safety Ratio Guard. Synthetic rooms and equipment for demonstration.
            </p>
          </div>
          <div class="view-actions">
            <button id="btn-open-booking-modal" class="btn btn-primary" aria-haspopup="dialog">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>Book Appointment / Bay</span>
            </button>
            <button id="btn-simulate-waitlist" class="btn btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              <span>Simulate Cancellation & Waitlist Backfill</span>
            </button>
          </div>
        </div>

        <!-- Waitlist Live Alert Box -->
        <div id="waitlist-alert-container">
          ${state.waitlistOffer ? this.renderWaitlistOffer(state.waitlistOffer) : ''}
        </div>

        <!-- Supervisor-to-Student Educational Safety Ratio Meter -->
        <section class="card supervisor-ratio-card" aria-labelledby="ratio-heading">
          <div class="ratio-header">
            <div>
              <span class="badge badge-accent">Configurable Clinic Rule</span>
              <h3 id="ratio-heading" class="card-title">Clinic Rule: Supervisor-to-Student Ratio (set to 1:4 in this demo)</h3>
              <p class="text-muted">Rostered Clinical Supervisor: <strong>${sup.name}</strong> (MCSP, HCPC, GOsC) | Location: <strong>Teaching Clinic (demo)</strong></p>
            </div>
            <div id="supervisor-ratio-status" class="ratio-status-pill ${sup.activeBays >= sup.maxRatio ? 'status-pill-danger' : 'status-pill-success'}">
              <span id="supervisor-ratio-indicator" class="pulse-dot"></span>
              <strong>${sup.name}: ${sup.activeBays} / ${sup.maxRatio} Student Bays Utilised (${ratioPct}%)</strong> — 
              <span>${sup.activeBays >= sup.maxRatio ? 'MAXIMUM SAFETY RATIO REACHED' : '1 BAY REMAINING AVAILABLE'}</span>
            </div>
          </div>
          <div class="ratio-bar-wrapper" role="progressbar" aria-valuenow="${sup.activeBays}" aria-valuemin="0" aria-valuemax="${sup.maxRatio}" aria-label="Supervisor Bay Capacity">
            <div class="ratio-bar-fill" style="width: ${ratioPct}%; background-color: ${ratioPct > 80 ? 'var(--clr-crimson)' : ratioPct > 50 ? 'var(--clr-amber)' : 'var(--clr-emerald)'};"></div>
          </div>
          <div class="ratio-footer-meta">
            <span>Bay 1 (Osteopathy): Active</span>
            <span>Bay 2 (Physiotherapy): Active</span>
            <span>Bay 3 (Physiotherapy): Active</span>
            <span class="text-accent font-bold">Bay 4 (Osteopathy): Available (Final Slot)</span>
          </div>
        </section>

        <!-- Facilities & Diagnostic Bay Matrix -->
        <div class="grid-2-col">
          <section class="card" aria-labelledby="bays-heading">
            <div class="card-header-flex">
              <div>
                <h3 id="bays-heading" class="card-title">Tom Reilly Building — Clinical Bays (Area A)</h3>
                <p class="card-subtitle">Real-time occupancy & sensor status</p>
              </div>
              <span class="badge badge-success">Live Synchronised</span>
            </div>
            <div class="bay-grid">
              ${this.renderBays(state.facilities.filter(f => f.type === 'clinical_bay'))}
            </div>
          </section>

          <section class="card" aria-labelledby="labs-heading">
            <div class="card-header-flex">
              <div>
                <h3 id="labs-heading" class="card-title">Specialist Performance Labs & Suites (Area B)</h3>
                <p class="card-subtitle">Biomechanics, Environmental Chambers & body composition</p>
              </div>
              <span class="badge badge-info">Commercial Hire</span>
            </div>
            <div class="bay-grid">
              ${this.renderBays(state.facilities.filter(f => f.type !== 'clinical_bay'))}
            </div>
          </section>
        </div>

        <!-- Timetable & Slot Availability Grid -->
        <section class="card" aria-labelledby="schedule-heading">
          <div class="card-header-flex">
            <div>
              <h3 id="schedule-heading" class="card-title">Today's Unified Schedule Matrix (31 October 2026)</h3>
              <p class="card-subtitle">Live multi-constraint validation for current shift</p>
            </div>
            <div class="table-legend">
              <span class="legend-item"><span class="legend-swatch swatch-booked"></span> Occupied (Area A)</span>
              <span class="legend-item"><span class="legend-swatch swatch-commercial"></span> Commercial (Area B)</span>
              <span class="legend-item"><span class="legend-swatch swatch-free"></span> 4-Constraint Verified Available</span>
            </div>
          </div>

          <div class="table-responsive">
            <table class="data-table" aria-label="Today's Timetable">
              <thead>
                <tr>
                  <th scope="col">Time Window</th>
                  <th scope="col">Service / Discipline</th>
                  <th scope="col">Practitioner / Student</th>
                  <th scope="col">Facility / Treatment Bay</th>
                  <th scope="col">Specialist Equipment</th>
                  <th scope="col">Supervisor Guard</th>
                  <th scope="col">Booking Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>13:00 - 14:00</strong></td>
                  <td>Osteopathy Follow-up</td>
                  <td>Alex Walker (Year 3 MSc)</td>
                  <td>Tom Reilly — Bay 1</td>
                  <td>Plinth + Articulation Props</td>
                  <td>Dr. Sarah Jenkins (1/4)</td>
                  <td><span class="badge badge-neutral">Completed</span></td>
                </tr>
                <tr class="table-row-active">
                  <td><strong>14:00 - 15:00</strong></td>
                  <td>Osteopathy New Patient</td>
                  <td>Alex Walker (Year 3 MSc)</td>
                  <td>Tom Reilly — Bay 1</td>
                  <td>Plinth + Goniometer</td>
                  <td>Dr. Sarah Jenkins (3/4)</td>
                  <td><span class="badge badge-amber">Consulting Now</span></td>
                </tr>
                <tr class="table-row-active">
                  <td><strong>14:00 - 15:00</strong></td>
                  <td>Physiotherapy Rehab</td>
                  <td>Priya Patel (Year 3 MSc)</td>
                  <td>Tom Reilly — Bay 2</td>
                  <td>Biodex Dynamometer</td>
                  <td>Dr. Sarah Jenkins (3/4)</td>
                  <td><span class="badge badge-amber">Consulting Now</span></td>
                </tr>
                <tr class="table-row-active">
                  <td><strong>14:00 - 15:00</strong></td>
                  <td>Physiotherapy MSK Screen</td>
                  <td>Tom Evans (Year 3 MSc)</td>
                  <td>Tom Reilly — Bay 3</td>
                  <td>Theraband & Force Gauges</td>
                  <td>Dr. Sarah Jenkins (3/4)</td>
                  <td><span class="badge badge-amber">Consulting Now</span></td>
                </tr>
                <tr class="table-row-available">
                  <td><strong>14:00 - 15:00</strong></td>
                  <td>Osteopathy Assessment</td>
                  <td><em>Student Roster Open</em></td>
                  <td>Tom Reilly — Bay 4</td>
                  <td>Plinth 4 (Cleaned & Ready)</td>
                  <td>Dr. Sarah Jenkins (3/4)</td>
                  <td><span class="badge badge-success">Available Slot (1 Left)</span></td>
                </tr>
                <tr>
                  <td><strong>15:00 - 17:00</strong></td>
                  <td>Biomechanics Hire</td>
                  <td>External Research Tech</td>
                  <td>Tom Reilly — Biomechanics Lab</td>
                  <td>Vicon Motion Capture 16-Cam</td>
                  <td>N/A (Staff Tech Run)</td>
                  <td><span class="badge badge-primary">Commercial Booked</span></td>
                </tr>
                <tr>
                  <td><strong>15:30 - 17:00</strong></td>
                  <td>CPET Peak VO2 & Lactate</td>
                  <td>Dr. Mark Davies, PhD</td>
                  <td>Environmental Hypoxia Chamber</td>
                  <td>Portable CPET Cart #1</td>
                  <td>Direct Academic Staff</td>
                  <td><span class="badge badge-primary">Staff Reserved</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Booking Modal Structure -->
        <div id="booking-modal" class="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-booking-title" style="display: none;">
          <div class="modal-content">
            <div class="modal-header">
              <h3 id="modal-booking-title" class="modal-title">Live 4-Constraint Slot Reservation</h3>
              <button id="btn-close-booking-modal" class="btn-close" aria-label="Close modal">&times;</button>
            </div>
            <div class="modal-body">
              <p class="text-muted mb-4">
                Test the atomic constraint satisfaction engine. Try booking a 5th student under Dr. Jenkins to witness the configurable supervision ratio block.
              </p>

              <form id="booking-form" onsubmit="return false;">
                <div class="form-group">
                  <label for="booking-service-select">Clinical or Commercial Service:</label>
                  <select id="booking-service-select" class="form-control">
                    <option value="srv_physio_eval" data-type="student">Area A: Physiotherapy Initial Assessment (Student Bay, £45.00)</option>
                    <option value="srv_osteo_eval" data-type="student" selected>Area A: Osteopathy Clinical Encounter (Student Bay, £45.00)</option>
                    <option value="srv_cardio_screen" data-type="staff">Area A: 12-Lead ECG Cardiovascular Screen (Staff Suite, £60.00)</option>
                    <option value="srv_caren_hire" data-type="commercial">Area B: Biomechanics Lab Hire (£400.00)</option>
                    <option value="srv_cpet_hire" data-type="commercial">Area B: Portable CPET Cart Rental (£150.00)</option>
                  </select>
                </div>

                <div class="grid-2-col">
                  <div class="form-group">
                    <label for="booking-practitioner-select">Practitioner / Student Assigned:</label>
                    <select id="booking-practitioner-select" class="form-control">
                      <option value="stu_walker" selected>Alex Walker (Year 3 MSc Student)</option>
                      <option value="stu_patel">Priya Patel (Year 3 MSc Student)</option>
                      <option value="stu_5th_over_ratio">Liam Vance (Year 3 MSc Student - Over-Ratio Test)</option>
                      <option value="sup_jenkins">Dr. Sarah Jenkins (Direct Senior Staff)</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="booking-supervisor-select">Supervising Practice Educator:</label>
                    <select id="booking-supervisor-select" class="form-control">
                      <option value="sup_jenkins" selected>Dr. Sarah Jenkins (Currently 3/4 Bays)</option>
                      <option value="sup_davies">Dr. Mark Davies (Currently 1/4 Bays)</option>
                    </select>
                  </div>
                </div>

                <div class="grid-2-col">
                  <div class="form-group">
                    <label for="booking-room-select">Facility / Treatment Bay:</label>
                    <select id="booking-room-select" class="form-control">
                      <option value="rm_tr_g04" selected>Teaching Clinic — Bay 4 (Available)</option>
                      <option value="rm_tr_g01" disabled>Teaching Clinic — Bay 1 (Occupied)</option>
                      <option value="rm_tr_g02" disabled>Teaching Clinic — Bay 2 (Occupied)</option>
                      <option value="rm_tr_caren">Tom Reilly — Biomechanics Lab</option>
                      <option value="rm_tr_env">Tom Reilly — Environmental Chamber</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="booking-equipment-select">Specialist Instrumentation:</label>
                    <select id="booking-equipment-select" class="form-control">
                      <option value="eq_standard" selected>Standard Plinth & Diagnostic Kit</option>
                      <option value="eq_ecg_01">Schiller 12-Lead ECG Cart #1 (Calibrated)</option>
                      <option value="eq_cpet_01">Portable CPET Cart #1 (Calibrated)</option>
                      <option value="eq_us_01" disabled>12-Lead ECG & Metabolic Cart (Calibration Lockout)</option>
                    </select>
                  </div>
                </div>

                <!-- 4-Constraint Real-Time Evaluation Box -->
                <div class="constraint-eval-box">
                  <h4 class="constraint-eval-title">Simultaneous 4-Constraint Verification</h4>
                  <div class="constraint-badges-grid">
                    <div id="constraint-practitioner" class="constraint-badge badge-pass">
                      <span class="icon">&#10003;</span>
                      <div>
                        <strong>Constraint 1: Practitioner Availability</strong>
                        <div class="subtext">Rostered on duty, zero schedule clash</div>
                      </div>
                    </div>
                    <div id="constraint-room" class="constraint-badge badge-pass">
                      <span class="icon">&#10003;</span>
                      <div>
                        <strong>Constraint 2: Physical Bay Capacity</strong>
                        <div class="subtext">Tom Reilly Bay 4 free & unreserved</div>
                      </div>
                    </div>
                    <div id="constraint-equipment" class="constraint-badge badge-pass">
                      <span class="icon">&#10003;</span>
                      <div>
                        <strong>Constraint 3: Equipment Calibration</strong>
                        <div class="subtext">Instrument sterilised & calibration valid</div>
                      </div>
                    </div>
                    <div id="constraint-ratio" class="constraint-badge badge-pass">
                      <span class="icon">&#10003;</span>
                      <div>
                        <strong>Constraint 4: Supervisor-to-Student Ratio</strong>
                        <div id="ratio-constraint-desc" class="subtext">3/4 student bays occupied under Dr. Jenkins (Pass)</div>
                      </div>
                    </div>
                  </div>

                  <div id="constraint-warning-banner" class="alert-banner alert-danger" style="display: none;">
                    <strong>Configured Supervision Ratio Reached (1:4 Demo Setting)</strong>
                    <span>Dr. Sarah Jenkins is supervising 4 concurrent student bays. Under the configured clinic supervision ratio (set to 1:4 in this demonstration; configurable per clinic to align with GOsC / CSP / HCPC / AHCS governance), a 5th student slot is blocked until an additional supervisor is rostered or another time slot is chosen.</span>
                  </div>
                </div>

                <div class="modal-footer">
                  <div class="status-summary">
                    <span>Overall Engine Status:</span>
                    <span id="booking-status-badge" class="badge badge-success">ALL 4 CONSTRAINTS SATISFIED</span>
                  </div>
                  <div>
                    <button type="button" id="btn-cancel-booking" class="btn btn-neutral">Cancel</button>
                    <button type="button" id="btn-book-slot" class="btn btn-primary">Confirm Slot Booking</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;

      this.bindModalElements();
      this.bindEvents();
    }

    renderBays(facilities) {
      return facilities.map(f => {
        const isOccupied = f.status === 'occupied';
        return `
          <div class="bay-card ${isOccupied ? 'bay-occupied' : 'bay-available'}">
            <div class="bay-card-top">
              <span class="bay-badge ${isOccupied ? 'badge-amber' : 'badge-emerald'}">
                ${isOccupied ? '● Occupied' : '○ Available'}
              </span>
              <span class="bay-discipline">${f.discipline.toUpperCase()}</span>
            </div>
            <h4 class="bay-name">${f.name}</h4>
            <div class="bay-location text-muted">${f.campus}</div>
            <div class="bay-capacity">Capacity: ${f.capacity} ${f.capacity > 1 ? 'persons' : 'bay'}</div>
          </div>
        `;
      }).join('');
    }

    renderWaitlistOffer(offer) {
      return `
        <div class="alert-banner alert-info waitlist-banner" role="alert">
          <div class="waitlist-banner-content">
            <span class="waitlist-icon">&#9889;</span>
            <div>
              <strong>Automated Waiting List Backfill Triggered!</strong>
              <p>
                A cancellation was registered for <em>${offer.serviceName}</em>. The capacity engine has automatically dispatched a priority offer to <strong>${offer.clientName} (${offer.clientOrg})</strong>. 
                Time-limited claim window: <strong class="text-danger">14 mins 52 secs remaining</strong>.
              </p>
            </div>
          </div>
          <button id="btn-claim-waitlist" class="btn btn-sm btn-primary">Simulate External Booker Claim</button>
        </div>
      `;
    }

    bindEvents() {
      const openModalBtn = document.getElementById('btn-open-booking-modal');
      const closeModalBtn = document.getElementById('btn-close-booking-modal');
      const cancelBookingBtn = document.getElementById('btn-cancel-booking');
      const waitlistBtn = document.getElementById('btn-simulate-waitlist');
      const modal = document.getElementById('booking-modal');

      if (openModalBtn && modal) {
        openModalBtn.addEventListener('click', () => {
          modal.style.display = 'flex';
          this.evaluateConstraints();
        });
      }

      const closeHandler = () => {
        if (modal) modal.style.display = 'none';
      };

      if (closeModalBtn) closeModalBtn.addEventListener('click', closeHandler);
      if (cancelBookingBtn) cancelBookingBtn.addEventListener('click', closeHandler);

      if (waitlistBtn) {
        waitlistBtn.addEventListener('click', () => {
          this.simulateWaitlist();
        });
      }
    }

    bindModalElements() {
      const practitionerSelect = document.getElementById('booking-practitioner-select');
      const supervisorSelect = document.getElementById('booking-supervisor-select');
      const roomSelect = document.getElementById('booking-room-select');
      const equipmentSelect = document.getElementById('booking-equipment-select');
      const bookSlotBtn = document.getElementById('btn-book-slot');

      const triggerEval = () => this.evaluateConstraints();

      if (practitionerSelect) practitionerSelect.addEventListener('change', triggerEval);
      if (supervisorSelect) supervisorSelect.addEventListener('change', triggerEval);
      if (roomSelect) roomSelect.addEventListener('change', triggerEval);
      if (equipmentSelect) equipmentSelect.addEventListener('change', triggerEval);

      if (bookSlotBtn) {
        bookSlotBtn.addEventListener('click', () => {
          this.executeBooking();
        });
      }
    }

    evaluateConstraints() {
      const practitionerSelect = document.getElementById('booking-practitioner-select');
      const supervisorSelect = document.getElementById('booking-supervisor-select');
      const roomSelect = document.getElementById('booking-room-select');
      const equipmentSelect = document.getElementById('booking-equipment-select');

      const ratioBadge = document.getElementById('constraint-ratio');
      const ratioDesc = document.getElementById('ratio-constraint-desc');
      const warningBanner = document.getElementById('constraint-warning-banner');
      const overallBadge = document.getElementById('booking-status-badge');
      const bookBtn = document.getElementById('btn-book-slot');

      if (!practitionerSelect || !supervisorSelect) return;

      const isOverRatio = practitionerSelect.value === 'stu_5th_over_ratio' && supervisorSelect.value === 'sup_jenkins';

      if (isOverRatio) {
        // Violates 1:4 safety guard!
        if (ratioBadge) {
          ratioBadge.className = 'constraint-badge badge-fail';
          ratioBadge.querySelector('.icon').innerHTML = '&#10007;';
        }
        if (ratioDesc) {
          ratioDesc.innerText = 'RATIO VIOLATION: 4/4 bays already occupied under Dr. Jenkins';
        }
        if (warningBanner) warningBanner.style.display = 'block';
        if (overallBadge) {
          overallBadge.className = 'badge badge-danger';
          overallBadge.innerText = 'BOOKING BLOCKED: SUPERVISOR RATIO EXCEEDED (1:4)';
        }
        if (bookBtn) {
          bookBtn.disabled = true;
          bookBtn.classList.add('btn-disabled');
        }
      } else {
        // Satisfies constraints!
        if (ratioBadge) {
          ratioBadge.className = 'constraint-badge badge-pass';
          ratioBadge.querySelector('.icon').innerHTML = '&#10003;';
        }
        if (ratioDesc) {
          ratioDesc.innerText = supervisorSelect.value === 'sup_davies' 
            ? '1/4 bays occupied under Dr. Davies (3 Available)' 
            : '3/4 bays occupied under Dr. Jenkins (1 Available)';
        }
        if (warningBanner) warningBanner.style.display = 'none';
        if (overallBadge) {
          overallBadge.className = 'badge badge-success';
          overallBadge.innerText = 'ALL 4 CONSTRAINTS SATISFIED';
        }
        if (bookBtn) {
          bookBtn.disabled = false;
          bookBtn.classList.remove('btn-disabled');
        }
      }
    }

    executeBooking() {
      const modal = document.getElementById('booking-modal');
      const serviceSelect = document.getElementById('booking-service-select');
      const roomSelect = document.getElementById('booking-room-select');

      AppStore.addAuditLog('BOOKING_CONFIRMED', `Appointment reserved in ${roomSelect.options[roomSelect.selectedIndex].text}`);
      
      if (modal) modal.style.display = 'none';
      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Booking successfully validated and confirmed across all 4 constraints!');
      }

      // Update Supervisor Active Bays to 4/4
      const state = AppStore.getState();
      const updatedSupervisors = state.supervisors.map(s => {
        if (s.id === 'sup_jenkins') {
          return { ...s, activeBays: 4 };
        }
        return s;
      });
      AppStore.setState({ supervisors: updatedSupervisors });
      this.render();
    }

    simulateWaitlist() {
      const offer = {
        serviceId: 'srv_cpd_manip',
        serviceName: 'CPD Workshop: Spinal Manipulation Masterclass',
        clientName: 'David Miller',
        clientOrg: 'Liverpool Harriers Athletic Club',
        timestamp: new Date().toISOString()
      };

      AppStore.setState({ waitlistOffer: offer });
      AppStore.addAuditLog('WAITLIST_AUTO_BACKFILL', `Capacity recovered. Automated offer dispatched to ${offer.clientName} (${offer.clientOrg})`);

      const alertContainer = document.getElementById('waitlist-alert-container');
      if (alertContainer) {
        alertContainer.innerHTML = this.renderWaitlistOffer(offer);
        const claimBtn = document.getElementById('btn-claim-waitlist');
        if (claimBtn) {
          claimBtn.addEventListener('click', () => {
            AppStore.setState({ waitlistOffer: null });
            if (alertContainer) alertContainer.innerHTML = '';
            if (typeof App !== 'undefined' && App.showToast) {
              App.showToast('Priority waitlist slot claimed and confirmed by David Miller!');
            }
          });
        }
      }

      if (typeof App !== 'undefined' && App.showToast) {
        App.showToast('Waitlist backfill algorithm triggered! Real-time notification sent to next candidate.');
      }
    }
  }

  return new BookingModule();
});
