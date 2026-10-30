# BarangayBook Client Presentation

**Target duration:** 15-20 minutes, maximum 8 slides. Keep the live system as the main content.

## Slide Outline

1. **The service challenge** (2 min): Introduce yourself as the developer; explain how requests through walk-ins, social media, and a paper log create schedule conflicts and make status hard to track.
2. **What BarangayBook changes** (2 min): Show the resident and staff roles and the core journey from a submitted request to an approved event.
3. **A simple view of the system** (2 min): Walk through the ERD and explain that residents, reservations, venues, and equipment are linked records; the React application sends requests to a Laravel API backed by MySQL.
4. **Resident reservation journey** (3 min): Log in as a resident, filter reservations, start a new request, select a facility and schedule, add guests and equipment, and submit.
5. **Staff decision and schedule** (3 min): Log in as an administrator, inspect the pending request, show remarks, approve it, and point out the updated upcoming-events dashboard.
6. **Inventory and safeguards** (2 min): Show available equipment counts, low-stock indicators, role controls, validation feedback, and the schedule conflict protection.
7. **Handover** (2 min): Show the repository structure, setup instructions, demo accounts, endpoint documentation, and test command.
8. **Close and next phase** (1-2 min): Compare delivered features with the proposal, name limitations, and recommend calendar exports and notifications as Phase 2.

## Live Demo Script

1. Sign in as `resident@barangaybook.test` with password `password`.
2. Open **Reservations**, use search/status/date filters, and show pagination if the list spans multiple pages.
3. Select **New reservation**. Choose the Barangay Multipurpose Hall, a future event date and time, enter a realistic event purpose and guest count, and request chairs and a sound system.
4. Submit the request and show the pending status. Briefly demonstrate client-side field validation if appropriate.
5. Sign out, then sign in as `admin@barangaybook.test` with password `password`.
6. Open the request from the reservations list. Review the resident, facility, date/time, guest count, and equipment; add a short note and approve it.
7. Return to the administrator dashboard and point to the upcoming approved event, weekly totals, low-stock count, and most reserved facility.
8. Sign out and sign back in as the resident. Reopen the reservation and show its approved status and staff note.
9. Close by showing facility/equipment browsing and, if time permits, the confirmation step for cancelling a separate pending request.

## Presenter Notes

- Start both applications and confirm the MySQL connection before the presentation begins.
- Keep the demo accounts ready and use one pending request for the scenario.
- Use seed data with realistic event purposes; avoid creating an overlapping approved booking during the demo.
- The video backup should cover authentication, reservation submission, staff approval, resident status, filters, pagination, and dashboard figures.
