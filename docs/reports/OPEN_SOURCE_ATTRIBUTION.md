# Open-Source Software Attribution & Licensing Registry
### FreshCart AI — Master Academic Project Attribution

> **Compliance Reference**: Master Development Directive (Sections 7, 22)  
> All third-party open-source implementations, design systems, algorithms, and libraries adapted into FreshCart AI are strictly documented below with author provenance and permissive licenses (MIT, Apache-2.0, BSD).

---

## 1. Third-Party Implementations & Design Systems

### 1. `satnaing/shadcn-admin`
- **Repository**: [`satnaing/shadcn-admin`](https://github.com/satnaing/shadcn-admin)
- **Author / Organization**: Sat Naing
- **License**: MIT License
- **Reused Components**:
  - Information hierarchy, KPI metric card structures, and status pill badges.
  - Command palette layout principles and responsive tab navigation patterns.
  - Color palette hierarchy for dark-mode administrative dashboards.
- **Modifications**:
  - Adapted from React/Vite/Tailwind into native Vanilla CSS tokens and accessible semantic HTML5/JS without adding 50+ npm dependencies.
- **Location in FreshCart**:
  - [`public/admin.html`](file:///c:/Users/shash/demo1/public/admin.html)
  - [`public/css/admin.css`](file:///c:/Users/shash/demo1/public/css/admin.css)
  - [`public/js/admin.js`](file:///c:/Users/shash/demo1/public/js/admin.js)

---

### 2. `tabler/tabler`
- **Repository**: [`tabler/tabler`](https://github.com/tabler/tabler)
- **Author / Organization**: Paweł Kuna / Tabler Authors
- **License**: MIT License
- **Reused Components**:
  - Semantic administrative grid layouts, responsive card containers, and data-table styling.
  - Incident log card patterns and telematics telemetry layout.
- **Modifications**:
  - Integrated directly into FreshCart's custom dark-mode theme (`--bg-admin: #060a12`).
- **Location in FreshCart**:
  - [`public/admin.html`](file:///c:/Users/shash/demo1/public/admin.html)
  - [`public/css/admin.css`](file:///c:/Users/shash/demo1/public/css/admin.css)

---

### 3. `TanStack/table` (Headless Datatable Architecture)
- **Repository**: [`TanStack/table`](https://github.com/TanStack/table)
- **Author / Organization**: Tanner Linsley & Contributors
- **License**: MIT License
- **Reused Components**:
  - Client-side data table pagination mathematics, multi-column search filtering, and stateful pagination controllers.
- **Modifications**:
  - Implemented as lightweight, zero-dependency client-side functions in `admin.js`.
- **Location in FreshCart**:
  - [`public/js/admin.js`](file:///c:/Users/shash/demo1/public/js/admin.js)

---

### 4. Model Cards for Model Reporting (Mitchell et al., 2019)
- **Standard**: *Model Cards for Model Reporting* (FAT* '19) & Hugging Face Model Card Schema
- **Authors**: Margaret Mitchell, Simone Wu, Andrew Zaldivar, Parker Barnes, Lucy Vasserman, Ben Hutchinson, Elena Spitzer, Inioluwa Deborah Raji, Timnit Gebru
- **License**: Creative Commons Attribution 4.0 / Apache-2.0
- **Reused Components**:
  - 12-field standardized model card metadata schema (`model_id`, `algorithm`, `dataset`, `features`, `baseline`, `evaluation_metrics`, `limitations`, `runtime_status`).
- **Modifications**:
  - Adapted into an interactive, live-filtered Model Registry tab in the FreshCart Admin Command Center.
- **Location in FreshCart**:
  - [`public/admin.html`](file:///c:/Users/shash/demo1/public/admin.html) (Model Registry & Experiment View)
  - [`public/js/admin.js`](file:///c:/Users/shash/demo1/public/js/admin.js)

---

## 2. Core Library Dependencies

| Package | Version | License | Primary Purpose | Location |
| :--- | :--- | :--- | :--- | :--- |
| `express` | ^4.18.2 | MIT | HTTP Application Gateway & API Server | `package.json`, `server.js` |
| `sql.js` | ^1.12.0 | MIT | SQLite 3 Engine in WebAssembly | `package.json`, `db/database.js` |
| `bcryptjs` | ^2.4.3 | MIT | One-Way Salted Password Hashing | `package.json`, `routes/auth.js` |
| `jsonwebtoken` | ^9.0.2 | MIT | RFC 7519 Cryptographic Claims Authentication | `package.json`, `middleware/auth.js` |
| `uuid` | ^9.0.0 | MIT | Cryptographic UUIDv4 Token Generation | `package.json` |
| `Chart.js` | v4.x (CDN) | MIT | Canvas Visualizations for Loss & Forecast Curves | `public/admin.html` |
| `FastAPI` | v0.109+ | MIT | Python Asynchronous ML Microservice Engine | `ml/service/app.py` |
| `PyTorch` | v2.1+ | BSD-3-Clause | 2-Layer Multivariate LSTM Neural Network | `ml/service/demand_service.py` |
