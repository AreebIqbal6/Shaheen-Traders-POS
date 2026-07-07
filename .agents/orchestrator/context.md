# Project Context

## Overview
This project targets the UI responsiveness and component accessibility of a React-based B2B POS & Wholesale application. 

## Technical Stack
- Frontend Framework: React (SPA)
- Styling: Tailwind CSS (to be verified)
- Testing Framework: Playwright (for automated UI/E2E testing)
- Router: React Router (routing under `/admin` and `/booker`)

## Known Issues
- Horizontal scrolling on mobile layouts (viewport width <= 375px).
- Overlapping elements / squished text.
- Interactive components (buttons, inputs) cut off or inaccessible on mobile viewports.
- The Inventory Data page has the "Import" buttons cut off.
- Table rows and action buttons in Inventory and Bookers views do not wrap or scroll internally.

## Key Files & Directories
- `src/views/`
- `src/components/`
- `src/utils/`
- `package.json`
- `playwright.config.ts`
