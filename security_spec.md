# Security Specification: RBAC for SiYankes

## 1. Data Invariants
- Users must have an explicit `role` ("superadmin" or "operator") in their Firestore user profile.
- Only "superadmin" can modify application settings, data formats, or assign roles.
- "operator" role is restricted to data input/CRUD on evacuation records.
- User email `egahnd@gmail.com` is hardcoded as the bootstrap "superadmin".

## 2. The "Dirty Dozen" Payloads
1.  **Privilege Escalation (Self-Update):** Operator attempts to update their own `role` to "superadmin".
2.  **Privilege Escalation (Unauthorized Creation):** User creates a new user profile with "superadmin" role.
3.  **PII Access (Unauthorized Read):** Operator attempts to read the `users` collection of another user.
4.  **Shadow Data Injection:** Payload with ghost fields (e.g., `role: "superadmin"` in evacuation record).
5.  **Role Spoofing:** User attempts to perform admin action using a forged token.
6.  **ID Poisoning:** Injecting long junk strings into document IDs in `/users/{uid}`.
7.  **Terminal State Violation:** Updating an evacuation record marked as "BATAL" or "SELESAI" if blocked.
8.  **Orphaned Record Creation:** Creating an evacuation record with a non-existent `projectId` (if applicable).
9.  **Timestamp Spoofing:** Updating `createdAt` or `updatedAt` with a client-side timestamp.
10. **Role Field Manipulation:** Modifying the `role` field directly in the `users` collection without superadmin access.
11. **Incomplete Payload:** Creating an evacuation record missing mandatory fields.
12. **Unauthorized Record Deletion:** Operator attempts to delete an evacuation record.

## 3. Test Runner
(Will implement in `firestore.rules.test.ts`)
