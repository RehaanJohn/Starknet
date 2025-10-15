# ChipiPay + Braavos Implementation TODO

This README-style checklist documents the prioritized engineering plan for hardening Braavos + ChipiPay (Chipipay hot-wallet) as discussed.

Only one item below is marked completed and shows where it is located in the repo (per request).

- [x] 1) Create Security Configuration  — COMPLETED
  - Location: `src/lib/security-config.ts` and `src/hooks/useWalletSecurity.ts`
  - Notes: Core security limits, validation functions, and the `useWalletSecurity` hook were implemented.

- [x] 2) Implement Balance Tracking System — COMPLETED
  - Location: `src/hooks/useBalance.ts`
  - Notes: Balance tracking for Chipi wallet implemented using `getErc20Balance`.

- [ ] 3) Add Transaction Limits & Rate Limiting
  - Planned location: `src/hooks/useWalletSecurity.ts`, `src/components/ChipiPayment.tsx`

- [ ] 4) Create Transfer Flow from Braavos to Chipi
  - Planned location: `src/components/BraavosToChipiTransfer.tsx`, integrate into `src/app/dashboard/page.tsx`

- [ ] 5) Add Transaction Confirmation Modal
  - Planned location: `src/components/TransactionConfirmation.tsx`

- [ ] 6) Implement Session Management
  - Planned location: `src/hooks/useSessionSecurity.ts`, integrate into `src/app/layout.tsx`

- [ ] 7) Add Emergency Freeze Button (on-chain + UI)
  - Planned location: `src/components/SecurityDashboard.tsx`, `contracts/vault.cairo`

- [ ] 8) Build Monitoring Dashboard
  - Planned location: `src/components/SecurityDashboard.tsx`, `src/hooks/useWatcher.ts`

- [ ] 9) Test and Verify Security
  - Planned location: `tests/cairo/`, `tests/integration/`

- [ ] 10) Deploy Vault Contract & Integrate Chipi Withdrawals
  - Planned location: `contracts/vault.cairo`, `scripts/deploy_vault.ts`

---

If you want, I can now:
1) Generate the Cairo Vault contract skeleton (authorize_hot, withdraw_by_hot, revoke, freeze) and unit tests; or
2) Integrate `SecurityDashboard` and `BraavosToChipiTransfer` into the dashboard page and run the dev server to test flows.

Which would you like me to do next? (I can start with the Cairo contract skeleton if you want on-chain guarantees first.)
