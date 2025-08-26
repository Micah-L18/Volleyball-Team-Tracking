# Known Bugs & Issues - Volleyball Coach App

## 🐛 Active Bugs (Need Fixing)

### #001 - Head Coach Transfer Not Demoting Current Head Coach
**Status:** 🔴 ACTIVE  
**Priority:** HIGH  
**Date Reported:** August 26, 2025  
**Phase:** Phase 8 - Role Management System  

**Description:**
When transferring head coach ownership to another team member, the system successfully promotes the target member to head coach and updates team ownership, but fails to demote the current head coach to assistant coach.

**Steps to Reproduce:**
1. Log in as head coach (dev@test.com)
2. Navigate to Team 4 → Members tab
3. Find coachmicahl@yahoo.com (assistant coach)
4. Click edit role → Select "Head Coach" → Save
5. Confirm transfer in popup dialog
6. Check database: both users show as head coaches

**Expected Behavior:**
- Target member becomes head coach ✅
- Current head coach becomes assistant coach ❌
- Team ownership transfers ✅
- UI updates properly ❌

**Actual Behavior:**
- Target member becomes head coach ✅
- Current head coach remains head coach ❌
- Team ownership transfers ✅
- Frontend shows success message ✅

**Technical Details:**
- **Backend:** Transaction appears to execute without errors
- **Database:** Both users end up with 'head_coach' role
- **Frontend:** Success message shows but UI doesn't reflect role change for current user
- **Logs:** Debug logs implemented but need to test with valid authenticated requests

**Investigation Status:**
- ✅ Fixed table name issue (teams → team)
- ✅ Added comprehensive debug logging
- ✅ Verified database schema and column names
- 🔍 Need to test with valid browser session (not curl)
- 🔍 Need to verify transaction logic execution

**Files Affected:**
- `/server/routes/team-access.js` - Role update endpoint with transfer logic
- `/client/src/app/services/team-member.service.ts` - Frontend service
- `/client/src/app/components/team-detail/team-detail.component.ts` - UI component

**Database Tables:**
- `team_users` - Member roles
- `team` - Team ownership (`created_by` field)

**Test Case for Verification:**
```sql
-- Before transfer
SELECT tu.id, u.email, tu.role FROM team_users tu 
JOIN users u ON tu.user_id = u.id WHERE tu.team_id = 4;

-- Expected after transfer
-- dev@test.com: head_coach → assistant_coach
-- coachmicahl@yahoo.com: assistant_coach → head_coach
```

**Helper Scripts:**
- `./scripts/add-test-user.sh` - Add test user back to team
- `./scripts/remove-test-user.sh` - Remove test user for reset

---

## 🔧 Recently Fixed Bugs

### #000 - Template Entry
**Status:** ✅ FIXED  
**Priority:** N/A  
**Date Fixed:** N/A  

This section will contain bugs that have been resolved for historical reference.

---

## 📝 Bug Reporting Guidelines

When reporting a new bug:
1. Add it to the **Active Bugs** section
2. Use sequential numbering (#002, #003, etc.)
3. Include all required fields
4. Add relevant technical details
5. Update status when fixed and move to **Recently Fixed Bugs**

**Required Fields:**
- Status (🔴 ACTIVE, 🟡 IN PROGRESS, ✅ FIXED)
- Priority (LOW, MEDIUM, HIGH, CRITICAL)
- Date Reported
- Phase/Feature Area
- Description
- Steps to Reproduce
- Expected vs Actual Behavior
- Files Affected
