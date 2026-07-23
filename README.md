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

```
Frontend (Single-page SPA)

├── HTML/CSS/JS

Backend (Flask Microservices)

├── 34 REST API endpoints

└── Real-time data synchronization

Database

├── Supabase (PostgreSQL)


External Services

├── AI: Groq API (Llama 3.1)

├── TTS: ElevenLabs

├── Scraping: Anakin.io

├── Data: FDA OpenFDA, WHO

└── Storage: Supabase Cloud
```

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


## Application Flow

1. **Dashboard**: Family overview with quick stats and member selection
2. **Add Profile**: Create family member profiles with health information
3. **Consult AI**: Ask health questions with contextual assistance
4. **Track Progress**: Monitor checkups, medications, and fitness goals
5. **Generate Reports**: Export comprehensive health reports

## Screenshots

### Dashboard Overview
![Dashboard](Screenshot%202026-07-23%20170209.png)

### AI Health Assistant
![AI Assistant](Screenshot%202026-07-23%20172055.png)

### Medical Records & Checkups
![Medical Records](Screenshot%202026-07-23%20174651.png)

### Fitness Goals & Price Comparison
![Fitness & Prices](Screenshot%202026-07-23%20220344.png)

### Settings & Family Management
![Settings](Screenshot%202026-07-23%20221111.png)

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