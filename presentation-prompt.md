# Aegis — Presentation Prompt

Use this prompt to generate slides, a pitch deck, or a spoken demo script for Aegis.

---

## Prompt

Draft a product presentation for **Aegis**, a family health dashboard application. Here is everything about the product — use it to create a compelling, structured presentation (slides or script):

---

### What Aegis Is

Aegis is a centralized, AI-powered family health management platform. It lets a single family admin manage the complete health records of every family member — parents, children, grandparents, spouse — from one dashboard. Think of it as a private health OS for your family.

### Problem It Solves

Families track health data across scattered apps, paper records, and memory. A checkup date is forgotten, a medicine dosage is ambiguous, an allergy isn't communicated in an emergency, and medicine prices are compared manually across pharmacy apps. Aegis unifies all of this into one place.

### Core Features (12 modules)

1. **Dashboard** — At-a-glance health overview per member: next follow-up, active medicines, today's fitness metrics, emergency info status. Dynamic greeting, quick-access tiles to every module.

2. **Doctors** — Full CRUD for each member's care team: name, specialty, clinic, phone, notes. Linked to checkups and medicines.

3. **Checkups** — Calendar-based checkup tracker with follow-up date visualization. Monthly calendar with color-coded dots (green = checkup, amber = follow-up). Click a date to filter.

4. **Medicines** — Track prescriptions with dosage, frequency, prescribing doctor, active/ended status. Auto-computed from date ranges.

5. **Medical Records** — Upload and manage files: PDFs, JPGs, PNGs, and DICOM medical images (X-rays, CT scans). Stored in Supabase cloud storage. Max 10 MB per file.

6. **Fitness Goals** — Daily logging of steps, calories, water intake, sleep hours with progress bars against targets (10K steps, 2000 kcal, 2L water, 8 hrs sleep). 14-day history.

7. **Price Comparison** — Live scraping of 3 Indian pharmacies (Apollo, Tata 1mg, Netmeds) via Anakin.io API. Shows drug composition and side effects from FDA OpenFDA / WHO database. Auto-translates non-English medicine names. Computes savings, identifies cheapest option, tracks stock. Includes a shopping cart with PDF export.

8. **Emergency Info** — Blood group, allergies, conditions, emergency contact. Generates a scannable QR code that links to a public standalone HTML page (`/emergency/<uuid>`) — designed for first responders.

9. **AI Health Assistant** — Context-aware chatbot powered by Groq's Llama 3.1. Receives full patient context (doctors, checkups, medicines, emergency info, recent fitness activity and goals) to give personalized answers. Conversation history saved per member. Text-to-speech via ElevenLabs.

10. **Reports** — One-click PDF generation (jsPDF) of a comprehensive health report: profile, doctors, checkups, medicines, fitness, emergency info. Dark-themed, styled A4 document.

11. **Profile** — Member profile with photo upload (stored in Supabase Storage), relation, DOB with auto-age calculation, gender, location, blood group. Photos appear across the app in member cards.

12. **Settings** — Admin info management (name, email, family name), family member add/remove.

### Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (single-page app, ~3800 lines), dark glassmorphism UI with animated ambient orbs, hash-based client-side routing
- **Backend**: Python Flask (34 REST API endpoints)
- **Database**: Supabase (PostgreSQL) with 11 tables, RLS enabled
- **Cloud Storage**: Supabase Storage (2 buckets: medical-records, profile-photos)
- **AI**: Groq API (Llama 3.1) for chat, ElevenLabs for TTS
- **Scraping**: Anakin.io Wire API for real-time pharmacy data
- **Drug Info**: FDA OpenFDA API + WHO Essential Medicines database

### Key Differentiators

- **Family-first model**: All data scoped per family member with cascade deletes. One account manages the whole family.
- **Real-time price scraping**: Concurrently searches 3 pharmacies, normalizes results, computes savings — not just a static database.
- **Emergency QR system**: A scannable QR code that any first responder can scan to see critical medical info — no app install needed.
- **Context-aware AI**: The chatbot knows the patient's full medical history, not just generic health advice.
- **Medical imaging support**: Accepts DICOM files (the standard for X-rays, CT, MRI) alongside regular documents.
- **No vendor lock-in**: Built on open standards (Supabase/PostgreSQL, vanilla JS, Flask). Self-hostable.

### Architecture

```
Browser (SPA) ──> Flask Backend (34 endpoints) ──> Supabase (PostgreSQL + Storage)
                                    │
                        External APIs:
                        - Groq (AI Chat)
                        - ElevenLabs (Text-to-Speech)
                        - Anakin.io (Pharmacy Scraping)
                        - FDA OpenFDA (Drug Info)
```

### Design Language

Dark forest green (#1a2e1f) base with glassmorphism cards, backdrop blur, animated floating orbs, dot-grid texture. Color-coded accent system: sage (primary), coral (danger), sky (fitness), lavender (medicines), amber (warnings). Outfit + DM Sans typography.

### Data Model

11 tables: family_members, member_profiles, doctors, checkups, medicines, medical_records, fitness_logs, emergency_info, scraped_prices, assistant_messages, admin_settings. All linked via family_member_id with foreign keys and cascade deletes.

---

## Suggested Presentation Structure

1. **Hook** — One sentence that captures the problem
2. **Solution** — What Aegis is (30 seconds)
3. **Live Demo Flow** — Walk through Dashboard → Profile → Checkups → Medicine Prices → Emergency QR → AI Assistant
4. **Technical Highlights** — Architecture, 34 API endpoints, real-time scraping, AI integration
5. **Differentiators** — 3 things no other product does
6. **Closing** — Vision for what's next (auth, multi-family, mobile app)
