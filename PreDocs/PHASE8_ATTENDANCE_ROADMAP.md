# Phase 8: Player Attendance & Availability Tracking

## Feature List

1. **Attendance Tracking**
   - Mark player attendance for each event (present, absent, excused, late)
   - View attendance history per player and per event

2. **Availability Management**
   - Players/coaches can set availability for upcoming events
   - Coaches can view who is available/unavailable for each event

3. **Attendance Reporting**
   - Summary statistics (attendance %, absences, trends)
   - Export attendance data (CSV or PDF)

4. **Role-Based Permissions**
   - Only coaches can mark attendance
   - Players can update their own availability

5. **UI Enhancements**
   - Attendance/availability controls in event details and calendar/list views
   - Visual indicators for attendance status

6. **Notifications (Optional)**
   - Reminders for players to set availability
   - Alerts for coaches about low attendance

---

## Implementation Instructions

1. **Database**
   - Add `attendance` table: event_id, player_id, status, notes, timestamp
   - Add `availability` table: event_id, player_id, available (boolean), notes

2. **Backend API**
   - Endpoints for marking attendance, updating availability, fetching reports
   - Secure endpoints with role-based access

3. **Frontend**
   - Add attendance/availability controls to event modals and views
   - Display attendance status in calendar/list
   - Add reporting UI for coaches

4. **Testing**
   - Unit and integration tests for new endpoints and UI
   - Validate permissions and data integrity

5. **Documentation**
   - Update onboarding and technical docs for new features

---

**Tip:**
Start with database and API changes, then build UI features, and finally add reporting and notifications if time allows.
