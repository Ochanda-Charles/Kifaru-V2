# Bug Report: Fonbnk Wallet Screen Not Skipped

- **Symptom**: User cannot skip the connect wallet screen on the Fonbnk wallet widget, despite configuring the `address` parameter.
- **Root Cause**: The Widget URL was constructed using the `/auth` endpoint. While the `/auth` endpoint skips the Amount page, skipping the Wallet screen when an `address` is provided only works reliably on the `/auto-order` (or fully constructed `/auth` according to older docs) flow in the current Fonbnk API implementation, which automatically routes the user based on passed context parameters.
- **Fix Applied**: Updated `kifaruBackend/src/controllers/fonbnkController.ts` to build the widget URL using the `/auto-order` path instead of `/auth`. This automatically processes the provided `address` and skips the wallet connection step.
- **Files Changed**:
  - `kifaruBackend/src/controllers/fonbnkController.ts`
- **Regression Test Location**: Found in merchant dashboard testing flow for Fonbnk payments.
- **Similar Patterns Found**: No other URL construction patterns for Fonbnk widgets found in the codebase.
