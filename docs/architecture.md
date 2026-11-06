# Application architecture

Static HTML pages load local styles, fonts, images and JavaScript. The store holds the example dataset in browser storage and notifies the active views after a change. Reset restores the sample. The role selector lets reviewers follow the same case across different people.

## Relationships

- Appointments keep their reference across amendments. Clinic and laboratory bookings check the selected practitioner, session, room, equipment and supervisory capacity before allocation. Course bookings draw places from the same workshop capacity used by the waiting list.
- A remote follow-up joins the appointment owner, patient, episode, service and assigned supervisor. The invited patient records a decision, and the supervisor can record attendance after consent. Progress entries keep their original author, observation label and review decision.
- An invoice snapshots its lines and tariff. Receipts, credits and refunds reference that invoice. The on-screen journal and CSV use the same amounts. The activity and cost-centre reports apply the posted credits.

## Deployment interfaces

The demonstration runs on one device. A shared deployment requires transactional storage, authenticated server-side permissions, clinical governance and agreed retention. Teams, Entra ID, the hosted payment gateway and Oracle E-Business Suite are proposed interfaces. The browser produces example transactions and files for reviewing the handoff. With the University’s agreed clinical templates, role definitions, chart of accounts and test-tenant access, OIV would configure the services, exercise the integrations and present the results for user acceptance. The written response sets out the implementation plan and assurance responsibilities.
