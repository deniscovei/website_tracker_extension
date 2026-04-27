# Refactor Regression Checklist

## Popup / Websites

- [ ] Website list renders correctly
- [ ] Add website opens empty editor
- [ ] New site defaults to Always blocked
- [ ] New site is not saved unless Add website is clicked
- [ ] Existing site autosaves
- [ ] Existing site shows no Save button
- [ ] Delete site works

## Global Settings

- [ ] PIN and extra-time toggles are independent
- [ ] Global warning banners show correctly
- [ ] Per-site toggles still clickable when global overrides are on

## Focus

- [ ] Focus timer starts
- [ ] Focus timer counts down
- [ ] Stop session works
- [ ] Completed sessions are logged
- [ ] Statistics load
- [ ] Week chart heights are proportional
- [ ] Date picker changes stats correctly

## Blocked Experiences

- [ ] State-preserving overlay appears
- [ ] Audio/video pauses while overlay is visible
- [ ] Adding time preserves page state
- [ ] PIN overlay matches main block style
- [ ] blocked.html fallback still works

## Persistence

- [ ] Reloading extension preserves data
- [ ] Demo mode does not pollute real data

## Automated Checks Run In This Refactor

- [x] JavaScript syntax checks
- [x] Manifest JSON parse check
- [x] Grep checks for module wiring, demo mode, chart classes, and store docs
- [x] Git whitespace check
