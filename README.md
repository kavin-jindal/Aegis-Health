# Aegis - Family Health Dashboard

A comprehensive family health management platform that helps families track, manage, and understand their healthcare journey through AI-powered assistance and unified medical records.

## Overview

Aegis transforms family healthcare from a chaotic, reactive experience into a seamless, proactive system. It combines AI-powered health assistance with complete medical record management, making it the ultimate family health operating system.

## Features

### Medical Management
- **Profile**: Complete member profiles with photos, DOB, blood type
- **Doctors**: Directory of all family doctors with contact info and specialties
- **Checkups**: Calendar-based checkup tracking with follow-up alerts
- **Medicines**: Prescription tracking with dosage and schedule reminders
- **Medical Records**: Secure document upload and management (including DICOM imaging)

### Health Analytics
- **Fitness Goals**: Daily tracking of steps, calories, water, sleep
- **Price Comparison**: Live pharmacy price comparison across 3 platforms
- **Reports**: One-click comprehensive health reports in PDF format

### AI-Powered Assistance
- **AI Health Assistant**: Context-aware chatbot with personalized recommendations
- **Emergency Info**: Scannable QR codes for first responders
- **Text-to-Speech**: Voice narration for accessibility

### Family Features
- **Settings**: Admin controls for family management
- **Multi-Member Support**: Unlimited family members from single dashboard

## Architecture

Frontend (Single-page SPA)
├── HTML/CSS/JS (3800+ lines)
└── Hash-based routing

Backend (Flask Microservices)
├── 34 REST API endpoints
└── Real-time data synchronization

Database
├── Supabase (PostgreSQL)
└── 11 optimized tables with RLS

External Services
├── AI: Groq API (Llama 3.1)
├── TTS: ElevenLabs
├── Scraping: Anakin.io
├── Data: FDA OpenFDA, WHO
└── Storage: Supabase Cloud

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| **Frontend** | HTML5, CSS3, Vanilla JS | No framework for maximum performance |
| **Backend** | Python Flask | REST API design |
| **Database** | Supabase PostgreSQL | 11 tables with Row Level Security |
| **Cloud Storage** | Supabase Storage | 2 buckets (medical records, photos) |
| **AI Integration** | Groq API | Llama 3.1-8b-instant |
| **Voice Synthesis** | ElevenLabs | Natural text-to-speech |
| **Pharmacy Data** | Anakin.io | Live price comparison |
| **Med Info** | FDA OpenFDA, WHO | Drug composition, side effects |

## Design Language

### Color System
- **Sage Green** (`#8fae8b`): Primary brand color
- **Coral** (`#e0896a`): Warnings, actions
- **Sky Blue** (`#7bb5c9`): Health metrics
- **Lavender** (`#a89bc4`): Medical records
- **Amber** (`#d4a84b`): Alerts, progress

### UI Principles
- **Glassmorphism**: Semi-transparent cards with backdrop blur
- **Dark Theme**: Forest green base (`#1a2e1f`) for extended use
- **Floating Orbs**: Animated ambient background
- **Dot Grid**: Subtle texture pattern
- **Smooth Transitions**: 0.32s cubic-bezier easing

### Typography
- **Headings**: Outfit (bold, sans-serif)
- **Body**: DM Sans (clean, readable)
- **Code**: System fonts

## Installation

### Prerequisites
- Python 3.8+
- Supabase account (or local setup)
- Environment variables (see `.env.example`)

### Setup

```bash
pip install -r requirements.txt
python app.py
```

## Application Flow

1. **Dashboard**: Family overview with quick stats and member selection
2. **Add Profile**: Create family member profiles with health information
3. **Consult AI**: Ask health questions with contextual assistance
4. **Track Progress**: Monitor checkups, medications, and fitness goals
5. **Generate Reports**: Export comprehensive health reports

## Contact

### Support
- **GitHub Issues**: For bug reports and feature requests
- **Email**: support@example.com

### Social Media
- **GitHub**: @anomalyco
- **Twitter**: @anomalyco

---

*Created with ❤️ by the Aegis Team*

### Quick Links
- [GitHub Repository](https://github.com/anomalyco/opencode)
- [Demo Video](https://github.com/anomalyco/opencode/blob/aegis-health-assistant/assets/demo.mp4?raw=true)

*