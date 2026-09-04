# MarketFlip - Frontend Documentation

## Version: 1.0.0
## Last Updated: August 11, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Styling & Design System](#4-styling--design-system)
5. [Components Documentation](#5-components-documentation)
6. [Pages Documentation](#6-pages-documentation)
7. [Context & State Management](#7-context--state-management)
8. [Animations](#8-animations)
9. [API Integration](#9-api-integration)
10. [Responsive Design](#10-responsive-design)
11. [Color Palette](#11-color-palette)
12. [Typography](#12-typography)

---

## 1. Project Overview

MarketFlip is a reverse marketplace platform where:
- **Buyers** post purchase requests
- **Shop owners** bid on those requests
- **Buyers** select the best bid

### Key Features
- ✅ Modern, premium UI with glass-morphism
- ✅ Responsive design for all screen sizes
- ✅ Framer Motion animations throughout
- ✅ shadcn/ui component library
- ✅ Dark/light color scheme with custom palette
- ✅ Role-based authentication
- ✅ Progressive signup flow

---

## 2. Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Language | JavaScript (ES6+) | - |
| Styling | Tailwind CSS | 3.x |
| UI Library | shadcn/ui | Latest |
| Animations | Framer Motion | 11.x |
| Icons | Lucide React | Latest |
| Routing | React Router DOM | 6.x |
| HTTP Client | Axios | 1.x |
| Form Validation | React Hook Form | - |

---

## 3. Project Structure

```
mfx-web/
├── src/
│   ├── api/
│   │   └── client.js              # Axios instance with interceptors
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   └── input.jsx
│   │   ├── backgrounds/
│   │   │   └── WaveBackground.jsx
│   │   ├── sections/
│   │   │   ├── Hero.jsx
│   │   │   ├── Features.jsx
│   │   │   ├── HowItWorks.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   ├── FAQ.jsx
│   │   │   ├── AboutDev.jsx
│   │   │   └── Footer.jsx
│   │   ├── LandingNavbar.jsx      # Navbar for landing page
│   │   └── Navbar.jsx              # Navbar for dashboard pages
│   ├── context/
│   │   └── AuthContext.jsx         # Authentication state
│   ├── pages/
│   │   ├── Auth.jsx                # Login/Signup with toggle
│   │   ├── Landing.jsx             # Landing page
│   │   ├── buyer/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── PostRequest.jsx
│   │   │   ├── RequestDetail.jsx
│   │   │   ├── MyPurchases.jsx
│   │   │   └── EditRequest.jsx
│   │   └── shop/
│   │       ├── Dashboard.jsx
│   │       ├── BrowseRequests.jsx
│   │       ├── MyBids.jsx
│   │       ├── BidDetail.jsx
│   │       └── CompletedTransactions.jsx
│   ├── styles/
│   │   └── index.css              # Global styles with Tailwind
│   ├── lib/
│   │   └── utils.js                # Utility functions (cn helper)
│   ├── App.jsx                     # Main app with routes
│   └── main.jsx                    # Entry point
├── tailwind.config.js              # Tailwind configuration
├── postcss.config.cjs              # PostCSS configuration
├── components.json                 # shadcn/ui configuration
└── package.json
```

---

## 4. Styling & Design System

### 4.1 Tailwind Configuration

**`tailwind.config.js`**

```javascript
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        peach: '#FFBE91',
        cream: '#FFDDB0',
        lightCream: '#FFFCE1',
        softBlue: '#CFEBFF',
        background: '#F8F6F0',
        border: '#EEECE6',
        muted: '#F5F3EF',
      },
      fontFamily: {
        sans: ['Ubuntu', 'system-ui', 'sans-serif'],
        display: ['Ubuntu', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
```

### 4.2 Global CSS

**`src/styles/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Ubuntu:wght@300;400;500;700&display=swap');

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --border: 214.3 31.8% 91.4%;
  }

  * {
    border-color: hsl(var(--border));
  }

  body {
    background-color: #F8F6F0;
    color: #1A1A2E;
    font-family: 'Ubuntu', -apple-system, sans-serif;
  }
}

@layer utilities {
  .animate-gradient {
    background-size: 200% 200%;
    animation: gradient 4s ease-in-out infinite;
  }
}
```

### 4.3 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Glass-morphism** | `backdrop-blur-xl bg-white/80` |
| **Subtle Shadows** | `shadow-sm hover:shadow-lg` |
| **Hover Effects** | Scale, translate, and color changes |
| **Consistent Spacing** | 4px grid system (p-4, p-6, p-8) |
| **Typography Hierarchy** | Clear heading sizes with `font-bold` |

---

## 5. Components Documentation

### 5.1 LandingNavbar

**Location:** `src/components/LandingNavbar.jsx`

**Features:**
- ✅ Transparent background
- ✅ Scroll-based hide/show animation
- ✅ Smooth scroll to sections
- ✅ Mobile responsive menu
- ✅ Login/Dashboard buttons

**Key Animations:**
```javascript
initial={{ y: -100, opacity: 0 }}
animate={{ y: 0, opacity: 1 }}
exit={{ y: -100, opacity: 0 }}
transition={{ duration: 0.4 }}
```

---

### 5.2 Hero Section

**Location:** `src/components/sections/Hero.jsx`

**Features:**
- ✅ Gradient text for brand name
- ✅ Floating animated icons
- ✅ Trust badges
- ✅ Responsive two-column layout
- ✅ CTA buttons with hover effects

**Colors Used:**
- Primary: `#FFBE91`
- Secondary: `#FFDDB0`
- Accent: `#CFEBFF`

---

### 5.3 Features Section

**Location:** `src/components/sections/Features.jsx`

**Features:**
- ✅ 6 feature cards with staggered animations
- ✅ Gradient icon backgrounds
- ✅ Hover effects with arrow indicator
- ✅ Responsive grid (1→2→3 columns)

**Animation:**
```javascript
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5, delay: feature.delay }}
```

---

### 5.4 How It Works Section

**Location:** `src/components/sections/HowItWorks.jsx`

**Features:**
- ✅ 4-step process with numbers
- ✅ Gradient icons
- ✅ Hover lift effect
- ✅ Clean, minimal design

**Icons Used:**
- ShoppingBag
- Users
- TrendingUp
- Shield

---

### 5.5 Testimonials Section

**Location:** `src/components/sections/Testimonials.jsx`

**Features:**
- ✅ User reviews with avatars
- ✅ Star ratings
- ✅ Staggered card animations
- ✅ Quote icons
- ✅ Glass-morphism cards

**Colors:**
- Rating stars: `#FFBE91`

---

### 5.6 FAQ Section

**Location:** `src/components/sections/FAQ.jsx`

**Features:**
- ✅ Accordion-style expandable items
- ✅ Animated chevron rotation
- ✅ Smooth height transitions
- ✅ Hover effects

**Animation:**
```javascript
initial={{ height: 0, opacity: 0 }}
animate={{ height: 'auto', opacity: 1 }}
exit={{ height: 0, opacity: 0 }}
transition={{ duration: 0.3 }}
```

---

### 5.7 About Developer Section

**Location:** `src/components/sections/AboutDev.jsx`

**Features:**
- ✅ Avatar with hover rotation
- ✅ Tech stack badges
- ✅ Social links (text-based)
- ✅ Stats display
- ✅ Location & email

---

### 5.8 Footer

**Location:** `src/components/sections/Footer.jsx`

**Features:**
- ✅ 5-column responsive grid
- ✅ Product, Company, Legal, Connect sections
- ✅ Social links (text-based)
- ✅ Back to top button with smooth scroll
- ✅ Copyright with dynamic year

---

## 6. Pages Documentation

### 6.1 Landing Page

**Location:** `src/pages/Landing.jsx`

**Structure:**
1. AnimatedBackground
2. LandingNavbar
3. Hero
4. Features
5. HowItWorks
6. Testimonials
7. FAQ
8. AboutDev
9. Footer

**Redirection Logic:**
```javascript
useEffect(() => {
  if (!loading && isAuthenticated) {
    if (user?.role === 'buyer') navigate('/buyer/dashboard');
    else if (user?.role === 'shop_owner') navigate('/shop/dashboard');
  }
}, [loading, isAuthenticated, user, navigate]);
```

---

### 6.2 Auth Page

**Location:** `src/pages/Auth.jsx`

**Features:**
- ✅ Login/Signup toggle
- ✅ Progressive signup (3 steps)
- ✅ Form validation
- ✅ Password visibility toggle
- ✅ Role selection (Buyer/Shop Owner)
- ✅ Smooth slide animations

**Signup Steps:**
1. Email & Password
2. Role & Shop (if applicable)
3. Contact Details

**Animations:**
```javascript
const slideVariants = {
  enter: { opacity: 0, x: 15 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -15 }
};
```

---

### 6.3 Dashboard Pages

#### Buyer Dashboard
- ✅ Tabs: Open, Expired, Deleted
- ✅ Request cards with bid counts
- ✅ Status badges
- ✅ Edit button for open requests

#### Shop Dashboard
- ✅ KPI stat cards
- ✅ Bid statistics
- ✅ Quick action buttons

---

## 7. Context & State Management

### 7.1 AuthContext

**Location:** `src/context/AuthContext.jsx`

```javascript
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    // API call to /auth/login
    // Store token in localStorage
    // Update user state
  };

  const logout = () => {
    // Clear localStorage
    // Reset user state
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 8. Animations

### 8.1 Framer Motion Configuration

**Global Settings:**
```javascript
transition: {
  type: "spring",
  stiffness: 400,
  damping: 25,
  duration: 0.3
}
```

### 8.2 Common Animations

| Element | Animation | Props |
|---------|-----------|-------|
| Cards | Staggered fade up | `staggerChildren: 0.06` |
| Buttons | Hover scale | `whileHover={{ scale: 1.02 }}` |
| Modals | Fade in/out | `initial={{ opacity: 0 }}` |
| Navbar | Slide in/out | `initial={{ y: -100 }}` |
| Page transitions | Fade slide | `initial={{ opacity: 0, y: 20 }}` |

---

## 9. API Integration

### 9.1 API Client

**Location:** `src/api/client.js`

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
```

### 9.2 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | User login |
| POST | `/auth/signup` | User registration |
| POST | `/requests` | Create request |
| GET | `/requests` | List requests |
| GET | `/bids/stats` | Get bid statistics |

---

## 10. Responsive Design

### 10.1 Breakpoints

| Breakpoint | Prefix | Width |
|------------|--------|-------|
| Mobile | `sm:` | 640px |
| Tablet | `md:` | 768px |
| Desktop | `lg:` | 1024px |
| Large | `xl:` | 1280px |

### 10.2 Responsive Patterns

**Grid Layouts:**
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

**Typography:**
```jsx
<h1 className="text-3xl md:text-4xl lg:text-5xl">
```

**Spacing:**
```jsx
<div className="p-4 md:p-6 lg:p-8">
```

---

## 11. Color Palette

### 11.1 Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| Peach | `#FFBE91` | `rgb(255, 190, 145)` | Primary buttons, accents |
| Cream | `#FFDDB0` | `rgb(255, 221, 176)` | Secondary accents |
| Soft Blue | `#CFEBFF` | `rgb(207, 235, 255)` | Accent highlights |
| Light Cream | `#FFFCE1` | `rgb(255, 252, 225)` | Background |

### 11.2 Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Dark | `#1A1A2E` | Text, primary elements |
| Muted | `#4A4A5A` | Secondary text |
| Light | `#A0A0B0` | Subtle text |
| Border | `#EEECE6` | Borders, dividers |
| Background | `#F8F6F0` | Page background |

### 11.3 Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| Pending | `#D4A000` | Amber |
| Selected | `#2D7A3A` | Emerald |
| Rejected | `#B33A3A` | Rose |
| Completed | `#2A6B9C` | Blue |

---

## 12. Typography

### 12.1 Font Family

```css
font-family: 'Ubuntu', -apple-system, BlinkMacSystemFont, sans-serif;
```

### 12.2 Font Sizes

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, badges |
| `text-sm` | 14px | Body text, descriptions |
| `text-base` | 16px | Standard text |
| `text-lg` | 18px | Subheadings |
| `text-xl` | 20px | Section titles |
| `text-2xl` | 24px | Page titles |
| `text-3xl` | 30px | H2 headings |
| `text-4xl` | 36px | H1 headings |

### 12.3 Font Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-light` | 300 | Subtle text |
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Emphasis |
| `font-semibold` | 600 | Subheadings |
| `font-bold` | 700 | Headings |

---

## 13. Performance Optimizations

### 13.1 Code Splitting
- Lazy loading for routes
- Dynamic imports for large components

### 13.2 Image Optimization
- SVG for icons and illustrations
- Optimized image loading

### 13.3 Animation Performance
- Hardware-accelerated transforms
- `will-change` for animated elements
- Reduced motion preferences respected

---

## 14. Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 88+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |

---

## 15. Development Setup

### 15.1 Installation

```bash
# Clone repository
git clone [repository-url]

# Install dependencies
cd mfx-web
npm install

# Install shadcn/ui components
npx shadcn-ui@latest init

# Start development server
npm run dev
```

### 15.2 Environment Variables

```env
VITE_API_URL=http://localhost:8000
```

### 15.3 Build for Production

```bash
npm run build
npm run preview
```

---

## 16. Changelog

### v1.0.0 (August 11, 2026)
- ✅ Initial frontend setup
- ✅ Landing page with all sections
- ✅ Authentication with Auth page
- ✅ Dashboard for buyer and shop
- ✅ Framer Motion animations
- ✅ shadcn/ui integration
- ✅ Responsive design
- ✅ Ubuntu font integration

### v1.0.1 (August 11, 2026)
- ✅ Premium glass-morphism design
- ✅ No emojis (vector icons only)
- ✅ Smaller, refined typography
- ✅ Progressive signup flow
- ✅ Smooth animations
- ✅ Professional color palette

---

## 17. Known Issues & Fixes

| Issue | Status | Solution |
|-------|--------|----------|
| GitHub/LinkedIn icon imports | ✅ Fixed | Use text-based social links |
| Emoji icons | ✅ Fixed | Replaced with Lucide icons |
| Font loading | ✅ Fixed | Google Fonts with fallbacks |
| Mobile responsive | ✅ Working | Tailwind responsive classes |

---

## 18. Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [shadcn/ui Docs](https://ui.shadcn.com/)
- [Lucide Icons](https://lucide.dev/icons/)
- [React Router Docs](https://reactrouter.com/)

---

**© 2026 MarketFlip. All rights reserved.**