# Add Discount Feature to Medical Requests

The goal is to allow a doctor or admin to add an optional discount amount during the creation of a new medical request. This discount will be applied to the total bill and printed on the final invoice.

## User Review Required

- Adding a new field to the database requires a schema update. I will use `npx prisma db push` to push this change securely without breaking existing data.
- The discount will be a flat amount (in LKR) rather than a percentage. Please confirm if this is acceptable.

## Open Questions

- Is there a maximum limit you'd like to enforce on the discount (e.g., it cannot exceed the total bill amount)? By default, I will ensure the total bill cannot go below 0.

## Proposed Changes

### Database Schema (Prisma)
#### [MODIFY] [schema.prisma](file:///c:/Projects/medicare-system/backend/prisma/schema.prisma)
- Add `discount Float @default(0)` to the `Prescription` model.

### Backend Routes & Types
#### [MODIFY] [prescriptions.routes.ts](file:///c:/Projects/medicare-system/backend/src/routes/prescriptions.routes.ts)
- Update `prescriptionSchema` to accept `discount: z.number().default(0)`.
- Pass `discount` into the `prisma.prescription.create` payload.

#### [MODIFY] [types.ts](file:///c:/Projects/medicare-system/src/types.ts)
- Update the `Prescription` frontend type to include `discount: number`.

### Frontend Components
#### [MODIFY] [NewRequest.tsx](file:///c:/Projects/medicare-system/src/components/NewRequest.tsx)
- Add a state `discount` and an input field next to the consultation fee.
- Update the `totalAmount` calculation to subtract the discount: `(Subtotal + Fees) - Discount`.
- Include the discount row in the printable bill/invoice section at the end of the form.

#### [MODIFY] [PatientsLog.tsx](file:///c:/Projects/medicare-system/src/components/PatientsLog.tsx)
- Update the historical bill view inside the patient logs to display the discount correctly.

#### [MODIFY] [IncomeLedger.tsx](file:///c:/Projects/medicare-system/src/components/IncomeLedger.tsx)
- Ensure the total income calculations reflect the discounted amounts accurately. *(I will also fix a pre-existing minor bug where additional charges weren't summing up correctly in the ledger).*

## Verification Plan

### Automated Tests
- Run `npm run test` on the backend to ensure API schema validates successfully.
- Run `npx playwright test` to ensure E2E tests for the request creation flow still pass.

### Manual Verification
- Create a new prescription with medicines, consultation fees, and a discount.
- Verify the total is calculated correctly in the UI.
- Verify the printed bill shows the "Discount" line item.
- Check the Income Ledger to ensure the totals reflect the discount.
