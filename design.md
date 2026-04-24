Booth Lens React Native App Design

Project goal
- Build the React Native frontend app for Booth Lens.
- Backend source of truth is `boothlens-backend`.
- Follow clean architecture, reusable components, and consistent API/error handling.
- Please stick to best practice.

UI and app shell
- Theme: light blue theme using React Native Paper.
- Initial screen logic:
  - If no JWT token in AsyncStorage, go to Login.
  - If token exists, call `GET /api/v1/user/me`.
  - If `/me` fails (401/403/invalid token), clear token and go to Login.
  - If `/me` succeeds, go to Main App.
- Main app navigation:
  - Bottom tab bar with center tab for camera.
  - Tabs:
    - Home (announcements)
    - Credits
    - Capture (take/select photos and analyze booth)
    - Requests
    - Profile
    - Settings (logout)
  - Admin entry button can be shown in Settings or as right-most tab only when role is ADMIN/SUPERADMIN.

Authentication and session
- Login API: `POST /api/auth/login`
- Logout API: `POST /api/auth/logout` (currently simple backend TODO, frontend still clears local token).
- Store JWT token securely (AsyncStorage for now).
- Attach header to protected routes:
  - `Authorization: Bearer <token>`
- Global interceptor behavior:
  - On 401/403, clear token and navigate to Login.

Standard API response format
- All endpoints return:
  - `success` (boolean)
  - `message` (string)
  - `data` (payload, nullable)
- Frontend should always check `success` first, then render `data`.

Core user APIs (from existing backend controllers)

Registration and login
- `POST /api/userRegistration/send-verification-code`
- `POST /api/userRegistration`
- `POST /api/auth/login`
- `POST /api/auth/logout`

Profile
- `GET /api/profile/fetchProfile`
- `PATCH /api/profile/update`

User portal (`/api/v1/user`)
- `GET /api/v1/user/me`
  - App initialization payload:
    - request list
    - credits
    - role
    - profile
- `GET /api/v1/user/requests`
- `GET /api/v1/user/requests/{referenceCode}/files`
- `GET /api/v1/user/files/{fileRecordId}/download`
- `POST /api/v1/user/requests` (multipart/form-data)
  - Generic request creation via requestType.
  - Supports contractor request and support request.
  - Supports optional sourceReferenceCode and optional file attachments.
- `GET /api/v1/user/transactions`
- `GET /api/v1/user/credits`

Booth analysis
- `POST /api/v1/booth/analyze` (multipart/form-data)
  - images[] + requestData fields
  - returns a reference code (used to track request/files/results)

Request type behavior
- Use requestType enum from backend:
  - `CONTRACTOR`
  - `SUPPORT`
- Request page should provide two quick actions:
  - Ask Contractor
  - Ask Support / Ask Admin
- Both call the same endpoint `POST /api/v1/user/requests` with different requestType.

Frontend pages and feature scope

1) Login page
- Inputs: email, password
- Actions:
  - Login
  - Navigate to register flow
- On success:
  - Save token
  - Call `/api/v1/user/me`
  - Navigate to Main tabs

2) Register page
- Inputs based on backend `RegistrationRequest`
- Includes verification code flow:
  - Send code
  - Submit registration

3) Home page
- Show latest announcements (admin-managed content)
- Read-only for normal user

4) Credits page
- Show credits data from `/api/v1/user/credits`
- Button: transaction history
- Transaction list from `/api/v1/user/transactions`

5) Capture page
- Take photo / pick from gallery (single or multiple)
- Submit to booth analyze API
- Show reference code and success/failure state

6) Requests page
- Show current user requests (`/api/v1/user/requests`)
- For each request:
  - Show status
  - View related files
  - Download file via pre-signed URL
- Create request form:
  - requestType
  - requestInfo
  - optional sourceReferenceCode
  - optional attachments

7) Profile page
- Fetch profile from `/api/profile/fetchProfile`
- Edit profile via `/api/profile/update`

8) Settings page
- Logout action:
  - Call `/api/auth/logout` (best effort)
  - Clear token regardless of API result
  - Navigate to Login

Admin portal scope (role-based)
- Show admin portal only if role is ADMIN or SUPERADMIN.
- Admin APIs (`/api/admin`):
  - Request search and update
  - Announcement CRUD
  - Transaction search
  - Credits search
  - Credits adjust
- Super admin APIs (`/api/superadmin/user-role`):
  - List user roles
  - Update user role/block status

Recommended frontend architecture
- `src/api`: API client and endpoint wrappers
- `src/hooks`: auth/session and data hooks
- `src/screens`: page components
- `src/components`: reusable UI components
- `src/store`: global state (auth + me data)
- `src/theme`: React Native Paper theme configuration
- Use one shared `request()` wrapper for headers, timeout, and error normalization.

State management and initialization
- Keep `me` payload as app bootstrap state.
- On app start:
  - load token
  - fetch `/me`
  - prefill tabs with bootstrap data
- Refresh strategies:
  - pull-to-refresh per page
  - or soft refresh after write actions (profile update/create request/analyze)

Error handling UX
- API/network error: show snackbar/toast + retry entry.
- Validation error (400): show inline form message.
- Unauthorized (401/403): force logout flow.
- Empty states:
  - no requests
  - no announcements
  - no transactions

Non-functional requirements
- Keep TypeScript types aligned with backend DTOs.
- Add loading and skeleton states for all major pages.
- Avoid duplicate API calls when `/me` data already has needed fields.
- Keep secure logging: do not log JWT token.