# Vendor Registration Enhancement - Implementation Plan

## Overview
Enhanced two-step vendor registration with comprehensive KYC, document uploads, and approval workflow.

---

## Database Changes ✅ COMPLETE

### Vendor Model Enhanced
**File**: `Backend/models/Vendor.js`

#### New Fields Added:
1. **Personal Information**
   - `firstName` - String, max 50 chars
   - `lastName` - String, max 50 chars
   - `agentName` - Seller/Agent reference

2. **Business Information**
   - `shopName` - String, max 200 chars
   - `shopAddress` - Detailed shop address

3. **KYC Numbers** (with validation)
   - `gstNumber` - Format: 22AAAAA0000A1Z5
   - `aadhaarNumber` - 12 digits
   - `panNumber` - Format: ABCDE1234F

4. **Document Uploads**
   - `aadhaarFront` - {url, publicId, format, size, uploadedAt}
   - `aadhaarBack` - {url, publicId, format, size, uploadedAt}
   - `pesticideLicense` - {url, publicId, format, size, uploadedAt}
   - `securityChecks` - {url, publicId, format, size, uploadedAt}
   - `dealershipForm` - {url, publicId, format, size, uploadedAt}

5. **Terms & Conditions**
   - `termsAccepted` - Boolean
   - `termsAcceptedAt` - Date

#### Existing Fields (No Changes)
- `status`: 'pending' | 'approved' | 'rejected' | 'suspended'
- `isActive`: false until approved
- `location`: With 20km radius validation
- `otp`: For verification

---

## Frontend Implementation Plan

### Phase 1: Registration Form (2 Steps)

#### Step 1: Personal & Business Details
**Component**: `VendorRegistrationStep1.jsx`

**Fields**:
1. First Name* (required, max 50)
2. Last Name* (required, max 50)
3. Email* (required, valid format)
4. Mobile Number* (required, Indian format: +91XXXXXXXXXX or 10 digits)
5. Agent Name (optional)
6. Shop Name* (required, max 200)
7. Shop Address* (required, Google Maps with 20km validation)
8. GST Number* (required, format validation)
9. PAN Number* (required, format validation)
10. Aadhaar Number* (required, 12 digits)

**Validations**:
- Mobile: `/^(\+91)?[6-9]\d{9}$/`
- GST: `/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/`
- PAN: `/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`
- Aadhaar: `/^[0-9]{12}$/`
- Shop Address: Must be within 20km of existing vendors

#### Step 2: Document Uploads
**Component**: `VendorRegistrationStep2.jsx`

**Uploads** (all required):
1. Aadhaar Front (image/PDF, max 2MB)
2. Aadhaar Back (image/PDF, max 2MB)
3. Pesticide License (image/PDF, max 2MB)
4. Security Checks (image/PDF, max 2MB)
5. Dealership Form (image/PDF, max 2MB)
6. Terms & Conditions Checkbox*

**Upload Features**:
- Drag & drop or click to upload
- Image preview
- File size validation (max 2MB)
- Format validation (jpg, jpeg, png, pdf)
- Progress indicator
- Remove/replace functionality

#### Step 3: OTP Verification
**Component**: `VendorOTPVerification.jsx`

**Flow**:
1. Send OTP to mobile number
2. 6-digit OTP input
3. 5-minute expiry
4. Resend option (after 30 seconds)
5. On success → Submit to admin for approval

---

### Phase 2: Approval Workflow

#### Pending Approval Screen
**Component**: `VendorPendingApproval.jsx`

**Display**:
```
🕐 Account Under Review

Your vendor registration is being reviewed by our admin team.

Submitted: [Date & Time]
Status: Pending Approval

You will be notified once your account is approved.

[Contact Support] button
```

**Trigger**: 
- After successful OTP verification
- When vendor tries to login with status='pending'

#### Admin Review Interface
**Component**: `AdminVendorReview.jsx`

**Display**:
1. Vendor Details (all fields)
2. Document Viewer (all 5 documents)
3. Location Map (with 20km radius check)
4. Action Buttons:
   - Approve
   - Reject (with reason)
   - Request More Info

---

### Phase 3: Login Flow Enhancement

#### Login Logic Update
**File**: `VendorLogin.jsx` or auth logic

**Flow**:
```
User enters phone → OTP sent → OTP verified
  ↓
Check vendor.status:
  - 'pending' → Redirect to PendingApproval
  - 'rejected' → Show rejection message
  - 'approved' → Redirect to Dashboard
  - 'suspended' → Show suspension message
```

---

## API Endpoints

### Registration
```
POST /api/vendors/auth/register-step1
Body: {
  firstName, lastName, email, phone,
  agentName, shopName, shopAddress,
  gstNumber, panNumber, aadhaarNumber,
  location: { address, coordinates }
}
Response: { vendorId, requiresDocuments: true }
```

```
POST /api/vendors/auth/register-step2
Body: FormData with files + vendorId
Files: aadhaarFront, aadhaarBack, pesticideLicense, 
       securityChecks, dealershipForm
Response: { success, requiresOTP: true }
```

```
POST /api/vendors/auth/verify-otp
Body: { phone, otp }
Response: { success, status: 'pending' }
```

### Admin
```
GET /api/admin/vendors/pending
Response: { vendors: [...] }
```

```
GET /api/admin/vendors/:id/details
Response: { vendor: {...}, documents: {...} }
```

```
PUT /api/admin/vendors/:id/approve
Body: { approved: true }
Response: { success }
```

```
PUT /api/admin/vendors/:id/reject
Body: { reason: "..." }
Response: { success }
```

---

## File Structure

```
Frontend/src/modules/Vendor/
├── pages/
│   ├── VendorRegistrationStep1.jsx (NEW)
│   ├── VendorRegistrationStep2.jsx (NEW)
│   ├── VendorOTPVerification.jsx (NEW)
│   ├── VendorPendingApproval.jsx (NEW)
│   └── VendorLogin.jsx (MODIFY)
│
├── components/
│   ├── DocumentUpload.jsx (NEW)
│   ├── AddressInput.jsx (NEW - Google Maps)
│   └── FormInput.jsx (ENHANCE)
│
└── services/
    └── vendorApi.js (ADD new endpoints)

Backend/
├── models/
│   └── Vendor.js (✅ ENHANCED)
│
├── controllers/
│   ├── vendorAuthController.js (MODIFY)
│   └── adminVendorController.js (ADD review methods)
│
├── routes/
│   ├── vendor.js (ADD new routes)
│   └── admin.js (ADD review routes)
│
└── middleware/
    ├── upload.js (Cloudinary/Multer)
    └── validation.js (GST/PAN/Aadhaar)
```

---

## Validation Rules

### Indian Mobile Number
```javascript
const mobileRegex = /^(\+91)?[6-9]\d{9}$/
// Accepts: +919876543210 or 9876543210
```

### GST Number
```javascript
const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
// Example: 22AAAAA0000A1Z5
```

### PAN Number
```javascript
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
// Example: ABCDE1234F
```

### Aadhaar Number
```javascript
const aadhaarRegex = /^[0-9]{12}$/
// Example: 123456789012
```

---

## Security Considerations

1. **Document Storage**: Cloudinary with private URLs
2. **File Size**: Max 2MB per file
3. **File Types**: jpg, jpeg, png, pdf only
4. **OTP**: 6 digits, 5-minute expiry
5. **20km Rule**: Server-side validation mandatory
6. **Terms**: Must be accepted before submission

---

## Testing Checklist

### Registration Flow
- [ ] Step 1 form validation (all fields)
- [ ] Mobile number format (Indian)
- [ ] GST/PAN/Aadhaar format validation
- [ ] Google Maps address selection
- [ ] 20km radius check
- [ ] Step 2 document uploads (all 5)
- [ ] File size validation (2MB)
- [ ] File type validation
- [ ] Terms checkbox required
- [ ] OTP generation and verification
- [ ] Submission to pending status

### Approval Workflow
- [ ] Pending screen shows after registration
- [ ] Login redirects to pending if not approved
- [ ] Admin can view all details
- [ ] Admin can view all documents
- [ ] Admin can approve/reject
- [ ] Vendor notified on approval
- [ ] Approved vendor can access dashboard

---

## Implementation Priority

1. ✅ **Database Model** - COMPLETE
2. **Backend APIs** - Registration & Upload
3. **Frontend Step 1** - Personal/Business form
4. **Frontend Step 2** - Document uploads
5. **OTP Verification** - Integration
6. **Pending Approval Screen**
7. **Admin Review Interface**
8. **Login Flow Update**

---

**Status**: Database Complete, Ready for Frontend Implementation  
**Next**: Create registration form components  
**Estimated Time**: 4-6 hours for complete implementation
