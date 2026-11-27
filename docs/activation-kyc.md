# Activation + caregiver KYC

## What changed

- New signups provide **full name, email, mobile number, password and role**.
- The account is created with `users/{uid}.activation = { emailVerified: false, phoneVerified: false, complete: false }`.
- Until both checks are complete, the web app redirects to `/activate`; the booking, payment and caregiver order-feed callables also reject the account server-side.
- Email verification: Firebase Auth's built-in verification link. The client sends it with `sendEmailVerification` and a `/verify-email` continue URL; applying the link refreshes the ID token, then `activationVerifyEmail` records `activation.emailVerified = true`. No SMTP or custom email OTP is involved.
- Mobile OTP: real Firebase Phone Auth SMS. The code is entered on screen, linked to the signed-in account, and `activationVerifyPhone` checks the fresh ID token's `phone_number`.
- Caregiver KYC: masked Aadhaar PDF is stored privately in Storage; Offline e-KYC XML is verified in memory against the pinned UIDAI public certificate.
- Clean matches auto-set `isApproved`, `idVerified`, `kyc.status = verified`, add the email to `whitelisted_partners` with `source: kyc-auto`, and unlock the caregiver panel.
- Mismatches become `kyc.status = needs_review` with a reason; an admin can review from **Admin → Caregivers**.
- Admin caregivers modal shows the KYC status, extracted fields, document SHA-256, signed document link and verification timeline.

## One-time deployment setup

No SMTP secrets are required. Firebase Auth sends the verification email.

- Enable **Email/Password** and **Phone** sign-in in Firebase Authentication.
- Add the deployed domain to Firebase Auth's **Authorized domains**, including the domain in the verification link continue URL (`https://<domain>/verify-email`).
- If a custom `authDomain` is used, ensure the verification link lands on the same web app so `applyActionCode` can read `oobCode` from the URL.

The mobile SMS code is delivered by Firebase Phone Auth. The email link is delivered by Firebase Auth; there is no on-screen email OTP.

Pinned certificate: `functions/certs/uidai_offline_publickey_2026.cer` (valid to 03 Feb 2029). When UIDAI publishes the next certificate, replace the file and update `UIDAI_CERT_FINGERPRINT` in `functions/src/kyc.js`.

## Privacy notes

- The Offline e-KYC XML and share code are never written to Firestore or Storage.
- Only the masked Aadhaar PDF is retained, at `kyc/{uid}/...`, with direct client read/write denied by Storage rules. Access is via short-lived signed URLs from `getCaregiverKyc` or `adminGetKycDocument`.
- Users must accept an explicit consent checkbox before upload. The consent version and timestamp are stored with the KYC record.
- Admin document views and manual KYC decisions are written to `admin_audit_logs`.

## UIDAI help for users

- Verify masked Aadhaar with VID: https://www.youtube.com/watch?v=GJWNvEnqpAA
- Verify masked Aadhaar with enrolment ID or VID: https://www.youtube.com/watch?v=KaxjC4Gl-Ok
- UIDAI Aadhaar Online Services: https://uidai.gov.in/en/aadhaar-online-services
- UIDAI certificates: https://uidai.gov.in/en/data-and-download
