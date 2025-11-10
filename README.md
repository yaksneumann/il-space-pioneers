# 🚀 Israeli Space Pioneers - Mission Application Portal

Welcome to the **Israeli Space Pioneers** application portal - a cutting-edge web platform designed for Israel's first imaginary space mission! This Angular application enables aspiring astronauts to submit their mission applications and join a historic journey to the stars.

![Angular](https://img.shields.io/badge/Angular-18+-red?style=flat&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=flat&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=flat&logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)

## 🌟 About the Project

The **Israeli Space Pioneers** application is a modern, responsive web platform that allows candidates to:

- 📋 **Submit comprehensive mission applications** with personal details, motivations, and profile information
- 🔄 **Edit applications** within a 3-day grace period after submission
- 📱 **View application status** and track submission details
- 📊 **Access recruiter dashboard** for mission coordinators to review candidates
- 🔒 **Secure authentication** system for recruiters and administrators

### 🎯 Key Features

- ✨ **Multi-step Application Form** - Intuitive 3-step process with real-time validation
- 📷 **File Upload System** - Support for profile images and resume uploads
- 🎨 **Cosmic UI Design** - Space-themed interface with smooth animations
- 📱 **Fully Responsive** - Optimized for desktop, tablet, and mobile devices
- 🔐 **Privacy-Focused** - Secure data handling with edit/delete capabilities
- ⚡ **Real-time Updates** - Instant feedback and dynamic content loading
- 🌙 **Modern Tech Stack** - Built with Angular 18+, TypeScript, and Supabase

## 🛸 Mission Overview

> *"Be part of history! Join Israel's first space mission and make your mark among the stars."*

The Israeli Imaginary Space Agency is seeking pioneering candidates for our inaugural space flight. This application serves as the primary gateway for:

- **Candidate Registration** - Comprehensive application process
- **Mission Coordination** - Recruiter tools for candidate management  
- **Application Management** - Edit, view, and track submissions
- **Dashboard Analytics** - Real-time statistics and insights

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Angular CLI** (v18+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yaksneumann/il-space-pioneers.git
   cd il-space-pioneers
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Configure Supabase credentials in `src/environments/`
   - Update authentication settings as needed

4. **Start the development server**
   ```bash
   ng serve
   ```
   
   Navigate to `http://localhost:4200/` - the app will automatically reload when you modify source files.

## 🏗️ Project Structure

```
src/
├── app/
│   ├── core/                    # Core services and models
│   │   ├── models/              # TypeScript interfaces
│   │   └── services/            # Business logic services
│   ├── features/                # Feature modules
│   │   ├── registration/        # Application submission
│   │   ├── candidate-view/      # Application viewing
│   │   └── dashboard/           # Recruiter dashboard
│   ├── shared/                  # Shared components
│   │   └── components/          # Reusable UI components
│   └── environments/            # Environment configurations
├── assets/                      # Static assets
└── styles/                      # Global styles and themes
```

## 🎨 Technology Stack

### Frontend
- **Angular 18+** - Modern web framework with latest features
- **TypeScript 5.0+** - Type-safe development
- **SCSS** - Advanced styling with variables and mixins
- **RxJS** - Reactive programming for async operations

### Backend & Database
- **Supabase** - Backend-as-a-Service for database and authentication
- **PostgreSQL** - Robust relational database
- **Real-time subscriptions** - Live data updates

### Development & Deployment
- **Angular CLI** - Development tooling and scaffolding
- **Vercel** - Modern deployment platform
- **Git** - Version control with GitHub integration

## 🌌 Key Features Breakdown

### 📋 Multi-Step Application Form
- **Step 1**: Personal Information (name, email, phone, age, city)
- **Step 2**: Background Details (hobbies, motivation)
- **Step 3**: File Uploads (profile image, resume)

### 🔄 Application Management
- **3-Day Edit Period** - Candidates can modify submissions
- **Real-time Validation** - Instant feedback on form inputs
- **Progress Tracking** - Visual progress indicators
- **Privacy Controls** - Clear form and delete options

### 📊 Recruiter Dashboard
- **Candidate Overview** - Comprehensive applicant listings
- **Application Details** - In-depth candidate profiles
- **Search & Filter** - Advanced candidate discovery
- **Authentication** - Secure recruiter login system

## 🛠️ Development Commands

### Development Server
```bash
ng serve                    # Start development server
ng serve --open            # Start and open in browser
```

### Building
```bash
ng build                   # Build for production
ng build --configuration development  # Development build
```

### Testing
```bash
ng test                    # Run unit tests
ng test --watch=false      # Run tests once
```

### Code Quality
```bash
ng lint                    # Run ESLint checks
ng generate component name # Generate new component
```

## 🌍 Environment Configuration

The application supports multiple environments:

- **Development** (`environment.development.ts`)
- **Production** (`environment.ts`)

Configure Supabase credentials and authentication settings in these files.

## 🔐 Security Features

- **Input Validation** - Comprehensive form validation
- **File Upload Security** - Type and size restrictions
- **Privacy Controls** - User data management options
- **Secure Authentication** - Recruiter login system
- **Data Protection** - Privacy-focused design principles

## 🎯 Future Roadmap

- 🌐 **Internationalization** - Multi-language support
- 📧 **Email Notifications** - Application status updates
- 📊 **Advanced Analytics** - Enhanced dashboard metrics
- 🔄 **Real-time Updates** - Live application status
- 🎨 **Theme Customization** - Multiple UI themes
- 📱 **Mobile App** - React Native companion

## 🤝 Contributing

We welcome contributions to the Israeli Space Pioneers project! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of an interview demonstration and is intended for educational purposes.

## 🚀 Live Demo

Visit our live application: [Israeli Space Pioneers Portal](https://il-space-pioneers.vercel.app/)

## 📞 Contact

For questions about this project or the space mission:

- **Developer**: [Your Name]
- **Mission Control**: evgeny@space-pioneers.com
- **Project Repository**: [GitHub Link]

---

*🌟 Ready to make history? Join Israel's first space mission today! 🌟*

---

**Built with ❤️ for the stars** | **Angular 18+ | TypeScript | Supabase**
