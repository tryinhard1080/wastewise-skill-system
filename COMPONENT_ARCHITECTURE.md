# 🏗️ Landing Page Component Architecture & Prompt Library

## Visual Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                          HEADER                                  │
│  Logo | Navigation (Products, Pricing, Docs) | Log in Button   │
└─────────────────────────────────────────────────────────────────┘
│
├─ 01. HERO SECTION ─────────────────────────────────────────────
│  ├─ Heading (80px serif): "Effortless custom contract billing"
│  ├─ Subheading (18px): Description text
│  ├─ CTA Button: "Start for free"
│  └─ Background Pattern (SVG, multiply blend)
│
├─ 02. DASHBOARD PREVIEW ────────────────────────────────────────
│  ├─ Container (960x695px, white, shadow)
│  │  ├─ Image 1: Customer Dashboard (active)
│  │  ├─ Image 2: Analytics Dashboard (hidden)
│  │  └─ Image 3: Data Visualization (hidden)
│  │
│  └─ Indicator Cards (3 horizontal)
│     ├─ Card 1: "Plan schedules" [ACTIVE] ◆◆◆◆◇◇◇◇
│     ├─ Card 2: "Data insights"
│     └─ Card 3: "Explore templates"
│
├─ 03. SMART SIMPLE BRILLIANT ───────────────────────────────────
│  ├─ Section Title (52px)
│  ├─ Subtitle (18px)
│  └─ Feature Cards (3 columns)
│     ├─ Card: Smart Automation [Zap icon]
│     ├─ Card: Simple Management [FileText icon]
│     └─ Card: Brilliant Insights [TrendingUp icon]
│
├─ 04. WORK IN SYNC ─────────────────────────────────────────────
│  ├─ Section Title: "Your work, perfectly in sync"
│  ├─ Block 1 [IMAGE ◆] ←→ [TEXT: Collaborate seamlessly]
│  └─ Block 2 [TEXT: Stay organized] ←→ [IMAGE ◆]
│
├─ 05. INTEGRATIONS ─────────────────────────────────────────────
│  ├─ Title: "Effortless Integration"
│  ├─ Subtitle
│  └─ Logo Grid (3x3)
│     ├─ Row 1: [Slack] [Notion] [GitHub]
│     ├─ Row 2: [Figma] [Stripe] [Vercel]
│     └─ Row 3: [Discord] [Tailwind] [+More]
│
├─ 06. STATISTICS ───────────────────────────────────────────────
│  ├─ Title: "Numbers that speak"
│  └─ Stat Cards (4 columns)
│     ├─ 50K+ Active Users
│     ├─ $2.4M+ Processed
│     ├─ 99.9% Uptime
│     └─ 24/7 Support
│
├─ 07. TESTIMONIALS ─────────────────────────────────────────────
│  ├─ Title: "Loved by teams worldwide"
│  └─ Carousel (3 cards, horizontal scroll)
│     ├─ ⭐⭐⭐⭐⭐ Quote | [Avatar] Name, Title
│     ├─ ⭐⭐⭐⭐⭐ Quote | [Avatar] Name, Title
│     └─ ⭐⭐⭐⭐⭐ Quote | [Avatar] Name, Title
│
├─ 08. DOCUMENTATION ────────────────────────────────────────────
│  ├─ Title: "Comprehensive documentation"
│  └─ Doc Cards (3 horizontal)
│     ├─ [BookOpen] Getting Started → Read guide
│     ├─ [Code] API Reference → View docs
│     └─ [Video] Tutorials → Watch now
│
├─ 09. FAQ SECTION ──────────────────────────────────────────────
│  ├─ Title: "Frequently asked questions"
│  └─ Accordion (8 items)
│     ├─ Q1: How does trial work? [Expandable]
│     ├─ Q2: Can I change plans? [Expandable]
│     ├─ ...
│     └─ Q8: How does support work? [Expandable]
│
├─ 10. PRICING ──────────────────────────────────────────────────
│  ├─ Title: "Simple, transparent pricing"
│  ├─ Toggle: [Monthly] [Annual] ← Save 20%
│  └─ Pricing Cards (3 columns)
│     ├─ STARTER ($19/mo)
│     │  - Features list ✓
│     │  - [Start free trial]
│     │
│     ├─ PROFESSIONAL ($49/mo) [MOST POPULAR]
│     │  - Features list ✓
│     │  - [Get started] ← Primary CTA
│     │
│     └─ ENTERPRISE (Custom)
│        - Features list ✓
│        - [Contact sales]
│
├─ 11. FINAL CTA ────────────────────────────────────────────────
│  ├─ Dark Gradient Background
│  ├─ Heading (64px): "Ready to transform..."
│  ├─ Subheading
│  ├─ Buttons: [Start free trial] [Schedule demo]
│  └─ Trust indicators: "No credit card • 14-day trial"
│
└─ 12. FOOTER ───────────────────────────────────────────────────
   ├─ Logo Column
   │  ├─ "Brillance" logo
   │  ├─ Tagline
   │  └─ Social: [Twitter] [LinkedIn] [GitHub]
   │
   ├─ Product Column
   │  ├─ Features
   │  ├─ Pricing
   │  ├─ Integrations
   │  └─ ...
   │
   ├─ Company Column
   │  ├─ About
   │  ├─ Blog
   │  └─ ...
   │
   ├─ Resources Column
   │  ├─ Documentation
   │  ├─ API Reference
   │  └─ ...
   │
   ├─ Legal Column
   │  ├─ Privacy Policy
   │  ├─ Terms of Service
   │  └─ ...
   │
   └─ Bottom Bar
      ├─ © 2025 Brillance
      └─ [Language] [Theme Toggle]
```

---

## Component Dependencies

```
┌─────────────────────────────────────────┐
│           Layout Components              │
├─────────────────────────────────────────┤
│                                          │
│  Header                                  │
│  ├─ Logo                                 │
│  ├─ Navigation                           │
│  └─ AuthButton                           │
│                                          │
│  Main Container                          │
│  ├─ Vertical Borders (decorative)       │
│  └─ Content Sections ─────────────────┐ │
│                                        │ │
└────────────────────────────────────────┼─┘
                                         │
        ┌────────────────────────────────┘
        │
        ├─ HeroSection
        │  ├─ Heading
        │  ├─ Subheading
        │  ├─ CTAButton
        │  └─ BackgroundPattern
        │
        ├─ DashboardPreview
        │  ├─ ImageCarousel
        │  │  ├─ useState (activeCard, progress)
        │  │  ├─ useEffect (auto-rotate timer)
        │  │  └─ Image Components (3)
        │  │
        │  └─ IndicatorCards
        │     ├─ Card Component (reusable)
        │     └─ ProgressBar (on active)
        │
        ├─ FeatureSection (Smart/Simple/Brilliant)
        │  ├─ SectionHeader
        │  └─ FeatureCard (x3)
        │     ├─ Icon (Lucide)
        │     ├─ Heading
        │     └─ Description
        │
        ├─ WorkInSyncSection
        │  └─ ContentBlock (x2)
        │     ├─ Image
        │     └─ TextContent
        │        ├─ Heading
        │        ├─ Description
        │        └─ BulletList
        │
        ├─ IntegrationSection
        │  ├─ SectionHeader
        │  └─ LogoGrid
        │     └─ LogoCard (x9)
        │
        ├─ StatisticsSection
        │  ├─ SectionHeader
        │  └─ StatCard (x4)
        │     ├─ Icon
        │     ├─ Number
        │     └─ Label
        │
        ├─ TestimonialsSection
        │  ├─ SectionHeader
        │  └─ TestimonialCarousel
        │     └─ TestimonialCard (x3)
        │        ├─ Stars (5)
        │        ├─ Quote
        │        ├─ Avatar
        │        ├─ Name
        │        └─ Title
        │
        ├─ DocumentationSection
        │  ├─ SectionHeader
        │  └─ DocCard (x3)
        │     ├─ Icon
        │     ├─ Title
        │     ├─ Description
        │     └─ Link
        │
        ├─ FAQSection
        │  ├─ SectionHeader
        │  └─ Accordion (shadcn/ui)
        │     └─ AccordionItem (x8)
        │
        ├─ PricingSection
        │  ├─ SectionHeader
        │  ├─ BillingToggle (Monthly/Annual)
        │  └─ PricingCard (x3)
        │     ├─ Badge (optional: "Most popular")
        │     ├─ Price
        │     ├─ Tagline
        │     ├─ FeatureList
        │     └─ CTAButton
        │
        ├─ CTASection
        │  ├─ Heading
        │  ├─ Subheading
        │  ├─ ButtonGroup
        │  └─ TrustIndicators
        │
        └─ Footer
           ├─ LogoColumn
           │  ├─ Logo
           │  ├─ Tagline
           │  └─ SocialLinks
           │
           ├─ NavigationColumns (x4)
           │  └─ LinkList
           │
           └─ BottomBar
              ├─ Copyright
              └─ Utilities
```

---

## Reusable Components Library

### Button Component

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

// Usage:
<Button variant="primary" size="lg">
  Start free trial
</Button>
```

### Card Component

```typescript
interface CardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  hover?: boolean;
  shadow?: 'sm' | 'md' | 'lg';
}

// Usage:
<Card
  icon={<Zap />}
  title="Smart Automation"
  description="Automatically generate invoices..."
  hover={true}
  shadow="md"
/>
```

### Section Header

```typescript
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

// Usage:
<SectionHeader
  title="Smart, Simple, Brilliant"
  subtitle="Everything you need..."
  centered={true}
/>
```

---

## Copy-Paste Prompt Library

### 📝 Section Headers

**Smart Simple Brilliant:**

```
Title: "Smart, Simple, Brilliant"
Font: Serif, 52px, centered
Color: #37322F
Spacing: 96px padding vertical

Subtitle: "Everything you need to manage custom contracts effortlessly"
Font: Sans-serif, 18px, centered
Color: rgba(55, 50, 47, 0.8)
Max-width: 600px
```

**Work in Sync:**

```
Title: "Your work, perfectly in sync"
Font: Serif, 52px, left-aligned
Color: #37322F
Spacing: 96px padding vertical
```

**Integration:**

```
Title: "Effortless Integration"
Font: Serif, 52px, centered
Color: #37322F

Subtitle: "Connect with the tools you already use"
Font: Sans-serif, 18px, centered
Color: rgba(55, 50, 47, 0.8)
```

**Numbers:**

```
Title: "Numbers that speak for themselves"
Font: Serif, 52px, centered
Color: #37322F
Spacing: 96px padding vertical
```

**Testimonials:**

```
Title: "Loved by teams worldwide"
Font: Serif, 52px, centered
Color: #37322F
Spacing: 96px padding vertical
```

**Documentation:**

```
Title: "Comprehensive documentation"
Font: Serif, 52px, centered
Color: #37322F

Subtitle: "Everything you need to get started and succeed"
Font: Sans-serif, 18px, centered
Color: rgba(55, 50, 47, 0.8)
```

**FAQ:**

```
Title: "Frequently asked questions"
Font: Serif, 52px, centered
Color: #37322F
Spacing: 96px padding vertical
```

**Pricing:**

```
Title: "Simple, transparent pricing"
Font: Serif, 52px, centered
Color: #37322F

Subtitle: "Choose the plan that's right for your team"
Font: Sans-serif, 18px, centered
Color: rgba(55, 50, 47, 0.8)
```

---

## 🎨 Style Specifications

### Colors

```css
/* Backgrounds */
--bg-primary: #f7f5f3;
--bg-secondary: #ffffff;
--bg-dark: #37322f;
--bg-darker: #2f3037;

/* Text */
--text-primary: #37322f;
--text-secondary: rgba(55, 50, 47, 0.8);
--text-tertiary: rgba(55, 50, 47, 0.6);
--text-white: #ffffff;

/* Borders */
--border-light: rgba(55, 50, 47, 0.06);
--border-medium: rgba(55, 50, 47, 0.12);
--border-dark: rgba(55, 50, 47, 0.2);

/* Accent */
--accent-primary: #2563eb; /* Blue */
--accent-success: #22c55e; /* Green */
--accent-warning: #f59e0b; /* Orange */
--accent-error: #dc2626; /* Red */
```

### Typography Scale

```css
/* Display */
--text-display: 80px / 96px line-height;

/* Headings */
--text-h1: 64px / 76px;
--text-h2: 52px / 62px;
--text-h3: 36px / 43px;
--text-h4: 24px / 32px;
--text-h5: 20px / 28px;
--text-h6: 18px / 24px;

/* Body */
--text-lg: 18px / 28px;
--text-base: 16px / 24px;
--text-sm: 14px / 20px;
--text-xs: 13px / 18px;
--text-tiny: 12px / 16px;
```

### Spacing Scale

```css
--space-1: 8px;
--space-2: 16px;
--space-3: 24px;
--space-4: 32px;
--space-5: 40px;
--space-6: 48px;
--space-8: 64px;
--space-10: 80px;
--space-12: 96px;
--space-16: 128px;
--space-20: 160px;
--space-24: 192px;
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 3px;
--radius-base: 6px;
--radius-md: 9px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-pill: 50px;
--radius-round: 90px; /* For badges */
--radius-circle: 50%;
```

### Shadows

```css
/* Subtle */
--shadow-xs: 0px 0px 0px 0.9px rgba(0, 0, 0, 0.08);
--shadow-sm: 0px 1px 2px rgba(55, 50, 47, 0.12);

/* Medium */
--shadow-md: 0px 4px 6px rgba(55, 50, 47, 0.1);
--shadow-lg: 0px 10px 15px rgba(55, 50, 47, 0.12);

/* Heavy */
--shadow-xl: 0px 20px 25px rgba(55, 50, 47, 0.15);
--shadow-2xl: 0px 25px 50px rgba(55, 50, 47, 0.2);

/* Inner */
--shadow-inner: inset 0px 2px 4px rgba(0, 0, 0, 0.06);

/* Special */
--shadow-inset-white: inset 0px 0px 0px 2.5px rgba(255, 255, 255, 0.08);
```

---

## 🔄 State Management Patterns

### Dashboard Rotation State

```typescript
// State
const [activeCard, setActiveCard] = useState(0);
const [progress, setProgress] = useState(0);
const mountedRef = useRef(true);

// Auto-rotation effect
useEffect(() => {
  const interval = setInterval(() => {
    if (!mountedRef.current) return;

    setProgress((prev) => {
      if (prev >= 100) {
        setActiveCard((current) => (current + 1) % 3);
        return 0;
      }
      return prev + 2; // 2% every 100ms = 5s total
    });
  }, 100);

  return () => clearInterval(interval);
}, []);

// Cleanup
useEffect(() => {
  return () => {
    mountedRef.current = false;
  };
}, []);

// Manual card selection
const handleCardClick = (index: number) => {
  setActiveCard(index);
  setProgress(0);
};
```

### Form State Pattern

```typescript
// Form state
const [formData, setFormData] = useState({
  name: "",
  email: "",
  company: "",
  message: "",
});
const [errors, setErrors] = useState<Record<string, string>>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitted, setSubmitted] = useState(false);

// Validation
const validateForm = () => {
  const newErrors: Record<string, string> = {};

  if (!formData.name) newErrors.name = "Name is required";
  if (!formData.email) newErrors.email = "Email is required";
  if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = "Email is invalid";
  }
  if (!formData.message) newErrors.message = "Message is required";

  return newErrors;
};

// Submit handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const newErrors = validateForm();
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setIsSubmitting(true);

  try {
    // Submit to Supabase or API
    await submitForm(formData);
    setSubmitted(true);
  } catch (error) {
    setErrors({ submit: "Failed to submit. Please try again." });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Modal State Pattern

```typescript
// Modal state
const [isOpen, setIsOpen] = useState(false);

// Open/close handlers
const openModal = () => setIsOpen(true);
const closeModal = () => setIsOpen(false);

// Keyboard support
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === "Escape") closeModal();
  };

  if (isOpen) {
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden"; // Prevent background scroll
  }

  return () => {
    document.removeEventListener("keydown", handleEscape);
    document.body.style.overflow = "unset";
  };
}, [isOpen]);
```

---

## 🎬 Animation Specifications

### Fade In on Scroll

```css
/* CSS */
.fade-in-section {
  opacity: 0;
  transform: translateY(50px);
  transition:
    opacity 600ms ease-out,
    transform 600ms ease-out;
}

.fade-in-section.visible {
  opacity: 1;
  transform: translateY(0);
}
```

```typescript
// React Implementation
const [ref, isVisible] = useInView({ threshold: 0.2 });

<div
  ref={ref}
  className={isVisible ? 'fade-in-section visible' : 'fade-in-section'}
>
  Content
</div>
```

### Card Hover Effect

```css
.card {
  transition:
    transform 300ms ease,
    box-shadow 300ms ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0px 10px 25px rgba(55, 50, 47, 0.15);
}
```

### Button Hover

```css
.button {
  transition:
    opacity 200ms ease,
    transform 100ms ease;
}

.button:hover {
  opacity: 0.9;
}

.button:active {
  transform: scale(0.98);
}
```

### Dashboard Image Transition

```css
.dashboard-image {
  position: absolute;
  inset: 0;
  transition:
    opacity 500ms ease-in-out,
    transform 500ms ease-in-out,
    filter 500ms ease-in-out;
}

.dashboard-image.active {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}

.dashboard-image.inactive {
  opacity: 0;
  transform: scale(0.95);
  filter: blur(4px);
}
```

### Progress Bar Animation

```css
.progress-bar {
  width: 0%;
  height: 4px;
  background: linear-gradient(to right, #d1d5db, #2563eb);
  border-radius: 2px;
  transition: width 100ms linear;
}

.progress-bar.animating {
  animation: progress 5s linear forwards;
}

@keyframes progress {
  from {
    width: 0%;
  }
  to {
    width: 100%;
  }
}
```

---

## 📱 Responsive Breakpoints

### Tailwind Breakpoints

```css
/* Mobile (default) */
/* 320px - 640px */
.container {
  padding: 16px;
  max-width: 100%;
}

/* Tablet (sm) */
@media (min-width: 640px) {
  .container {
    padding: 24px;
  }
}

/* Desktop (md) */
@media (min-width: 768px) {
  .container {
    padding: 32px;
  }
}

/* Large Desktop (lg) */
@media (min-width: 1024px) {
  .container {
    padding: 48px;
    max-width: 1060px;
    margin: 0 auto;
  }
}

/* XL Desktop (xl) */
@media (min-width: 1280px) {
  .container {
    max-width: 1060px; /* Fixed width */
  }
}
```

### Grid Responsive Patterns

```css
/* Feature Cards Grid */
.feature-grid {
  display: grid;
  gap: 24px;

  /* Mobile: 1 column */
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .feature-grid {
    /* Tablet: 2 columns */
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .feature-grid {
    /* Desktop: 3 columns */
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### Typography Responsive

```css
.hero-heading {
  /* Mobile */
  font-size: 24px;
  line-height: 1.2;
}

@media (min-width: 640px) {
  .hero-heading {
    /* Tablet */
    font-size: 36px;
  }
}

@media (min-width: 768px) {
  .hero-heading {
    /* Desktop */
    font-size: 52px;
  }
}

@media (min-width: 1024px) {
  .hero-heading {
    /* Large Desktop */
    font-size: 80px;
    line-height: 96px;
  }
}
```

---

## 🧪 Testing Scenarios

### Manual Testing Checklist

**Navigation:**

- [ ] Logo links to home
- [ ] All nav links work
- [ ] Mobile menu toggles
- [ ] Sticky header activates on scroll
- [ ] Smooth scroll to sections

**Hero Section:**

- [ ] Heading displays correctly
- [ ] CTA button hover works
- [ ] Background pattern visible
- [ ] Responsive text sizing
- [ ] Button click triggers action

**Dashboard Preview:**

- [ ] All 3 images load
- [ ] Auto-rotation works (5s)
- [ ] Manual card click works
- [ ] Progress bar animates
- [ ] Smooth image transitions
- [ ] No console errors

**Feature Sections:**

- [ ] All icons render
- [ ] Grids responsive (3 → 2 → 1)
- [ ] Cards hover effects work
- [ ] Images load correctly
- [ ] Text readable on all devices

**Forms:**

- [ ] Email validation works
- [ ] Required fields enforced
- [ ] Loading state shows
- [ ] Success message displays
- [ ] Error messages clear

**Testimonials:**

- [ ] Carousel scrolls smoothly
- [ ] Auto-play works (if enabled)
- [ ] Manual navigation works
- [ ] Stars render correctly
- [ ] Avatars load

**Pricing:**

- [ ] Toggle switches plans
- [ ] Prices update correctly
- [ ] Popular badge shows
- [ ] CTA buttons work
- [ ] Feature lists complete

**FAQ:**

- [ ] Accordion expands/collapses
- [ ] Only one open at a time (optional)
- [ ] Smooth animation
- [ ] Icons rotate on expand
- [ ] All content readable

**Footer:**

- [ ] All links work
- [ ] Social icons link correctly
- [ ] Copyright year correct
- [ ] Columns stack on mobile
- [ ] Bottom bar displays properly

---

## 🎯 Quick Reference: Component Sizes

### Container Widths

- Main Container: 1060px max-width
- Hero Content: 937px max-width
- Hero Heading: 748px max-width
- Hero Subheading: 506px max-width
- Dashboard Preview: 960px width
- FAQ Section: 800px max-width
- CTA Content: 800px max-width

### Component Heights

- Header: 84px
- Dashboard Container: 695px
- Card Padding: 32px
- Button Height: 48px (lg), 40px (md), 32px (sm)
- Input Height: 48px
- Icon Size: 32px (sections), 48px (large), 20px (small)

### Spacing Patterns

- Section Vertical: 96px padding
- Between Elements: 24px gap
- Card Grid Gap: 24px
- Content Max-Width: 1060px
- Hero Top Padding: 216px
- Footer Padding: 64px vertical

---

## 💾 Data Structures

### Pricing Plan Data

```typescript
interface PricingPlan {
  name: string;
  price: number | "Custom";
  period: "month" | "year";
  tagline: string;
  popular?: boolean;
  features: string[];
  ctaText: string;
  ctaVariant: "primary" | "outline";
}

const plans: PricingPlan[] = [
  {
    name: "Starter",
    price: 19,
    period: "month",
    tagline: "Perfect for small teams",
    features: [
      "Up to 50 contracts/month",
      "Basic automation rules",
      "Email support",
      "10GB storage",
      "2 team members",
    ],
    ctaText: "Start free trial",
    ctaVariant: "outline",
  },
  // ... more plans
];
```

### Testimonial Data

```typescript
interface Testimonial {
  id: string;
  rating: number;
  quote: string;
  author: {
    name: string;
    title: string;
    company: string;
    avatar: string;
  };
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    rating: 5,
    quote: "Brillance transformed how we handle billing...",
    author: {
      name: "Sarah Johnson",
      title: "CFO",
      company: "TechCorp",
      avatar: "/avatars/sarah.jpg",
    },
  },
  // ... more testimonials
];
```

### FAQ Data

```typescript
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    id: "1",
    question: "How does the free trial work?",
    answer:
      "Start with a 14-day free trial with full access to all Pro features. No credit card required.",
  },
  // ... more FAQs
];
```

---

## 🚀 Performance Optimization Tips

### Image Optimization

```typescript
// Use next/image (if using Next.js) or optimize manually
- Compress images: TinyPNG, ImageOptim
- Use WebP format: Better compression
- Lazy load: Load images as they enter viewport
- Responsive images: Multiple sizes for different screens
- CDN delivery: Serve from edge locations

// Example sizes:
- Hero background: 2800px → 1400px (mobile), 2800px (desktop)
- Dashboard previews: 1920px x 1400px → compress to < 200KB
- Logos: 96px x 96px SVG or PNG
- Avatars: 128px x 128px → 64px x 64px (display size)
```

### Code Splitting

```typescript
// Lazy load sections below fold
import dynamic from "next/dynamic";

const TestimonialsSection = dynamic(() => import("./TestimonialsSection"));
const PricingSection = dynamic(() => import("./PricingSection"));
const FAQSection = dynamic(() => import("./FAQSection"));

// Only load when needed
```

### CSS Optimization

```css
/* Remove unused Tailwind classes */
/* In tailwind.config.js: */
module.exports = {
  content:
    [ "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    ],
    // Tailwind will purge unused classes in production
;
}
```

### JavaScript Optimization

```typescript
// Memoize expensive computations
const memoizedValue = useMemo(() => {
  return expensiveComputation(data);
}, [data]);

// Memoize components
const MemoizedCard = React.memo(Card);

// Debounce event handlers
const debouncedHandleResize = debounce(handleResize, 250);
```

---

This component architecture document provides a visual understanding of how all pieces fit together, along with reusable code patterns and specifications for consistent implementation throughout your Lovable project.

Use this as a reference while following the main LOVABLE_REBUILD_PLAN.md step-by-step guide!

---

**Version:** 1.0  
**Last Updated:** November 14, 2025  
**Format:** Technical Architecture Reference
