# Device-Confirm Checklist (Android-runtime items)

These audit findings depend on the **Android runtime**, which was never exercised (no Android SDK/emulator in the dev environment). They were **deliberately not changed** in the fix pass — fixing them blind risks regressions. Confirm each on a **physical Android device** (or a properly configured emulator) first; only then implement the noted fix.

Build: `cd mobile && npx expo run:android` (needs `expo prebuild --platform android` + an Android toolchain).

---

## M4 — Onboarding back-stack re-enterable after completion
**Suspected cause:** onboarding advances with `router.push`; the final step (`app/onboarding/paywall.tsx:77/81`) does `router.replace("/dashboard")`, which swaps only the top entry — the earlier onboarding screens may remain beneath the dashboard in the native stack.

**Repro (Android):**
1. Fresh install (or clear app data) so onboarding runs.
2. Complete onboarding end-to-end through the paywall → land on the dashboard.
3. Press the **Android hardware back** button once (and repeatedly).

**Pass:** back exits the app (or does nothing on the dashboard root).
**Fail:** back navigates *into* a previous onboarding screen (goal / stats / coach / paywall).

**If it fails — fix to apply:** before the final `router.replace("/dashboard")`, clear the stack — e.g. `router.dismissAll()` then `router.replace("/dashboard")`, or a navigation reset — so the tab group is the stack root. Re-test the same steps.

---

## m6 — CoachChat composer covered by the Android keyboard
**Suspected cause:** `app/coach.tsx:94` uses `KeyboardAvoidingView` with `behavior="padding"` on iOS and `undefined` on Android; depending on `windowSoftInputMode`, the composer/input may be covered.

**Repro (Android):**
1. Set a premium user (CoachChat composer visible) and open `/coach`.
2. Tap the message input to raise the keyboard.

**Pass:** the text input and send button stay visible above the keyboard.
**Fail:** the keyboard covers the input/send button.

**If it fails — fix to apply:** set an explicit Android behavior (e.g. `behavior="height"` or rely on `android:windowSoftInputMode="adjustResize"` in the manifest / `app.json`), and re-test. Verify it doesn't regress the iOS layout.

---

*Both remain UNCONFIRMED until device-tested. Note any iOS-confirmable half separately if addressed.*
