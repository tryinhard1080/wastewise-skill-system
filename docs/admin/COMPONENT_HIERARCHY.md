# Admin Dashboard Component Hierarchy

Visual reference of the admin dashboard architecture.

## Page Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Layout (app/admin/layout.tsx)                         │
│  ┌─────────────┐  ┌────────────────────────────────────┐   │
│  │  AdminSide  │  │  Header (Admin Badge)              │   │
│  │  bar        │  └────────────────────────────────────┘   │
│  │             │                                            │
│  │  • Overview │  ┌────────────────────────────────────┐   │
│  │  • Users    │  │                                    │   │
│  │  • Jobs     │  │  Page Content (children)           │   │
│  │  • System   │  │                                    │   │
│  │  • Skills   │  │  - Dashboard Overview              │   │
│  │  • Audit    │  │  - User Management                 │   │
│  │  • Analytics│  │  - Job Queue                       │   │
│  │             │  │  - System Health                   │   │
│  │  [Back]     │  │  - Skills Config                   │   │
│  └─────────────┘  │  - Audit Log                       │   │
│                   │  - Analytics                       │   │
│                   └────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Dependencies

### Dashboard Overview (`/admin`)

```
AdminDashboard
├── StatsCard (x4)
│   ├── Total Users
│   ├── Active Jobs
│   ├── Failed Jobs (24h)
│   └── System Health
├── Card (Recent Activity)
│   └── Badge + formatDistanceToNow
├── Card (Quick Actions)
│   └── Button (x3)
└── Card (System Status)
    └── Service indicators
```

### User Management (`/admin/users`)

```
UsersPage
├── UserTable
│   ├── Input (search)
│   ├── Select (role filter)
│   ├── Select (status filter)
│   ├── Table
│   │   ├── Badge (role, status)
│   │   └── DropdownMenu (actions)
│   └── Results count
├── AlertDialog (delete confirmation)
└── Dialog (change role)
    └── Select (new role)
```

### User Detail (`/admin/users/[id]`)

```
UserDetailPage
├── Button (back)
├── Card (User Info)
│   ├── Badge (role, status)
│   └── Button (toggle status)
├── Card (Projects)
│   └── Table
├── Card (Job History)
    └── Table
```

### Job Queue (`/admin/jobs`)

```
JobsPage
├── StatsCard (x4)
│   ├── Total Jobs
│   ├── Processing
│   ├── Completed
│   └── Failed
└── JobQueue
    ├── Button (refresh)
    ├── Table
    │   ├── Badge (status)
    │   ├── Progress (processing)
    │   └── Button (retry, delete)
    └── Auto-refresh (5s)
```

### System Health (`/admin/system`)

```
SystemPage
├── SystemHealthCard (x5)
│   ├── Database
│   ├── Storage
│   ├── API
│   ├── Workers
│   └── Search
├── Select (time period)
├── MetricsChart (x4)
│   ├── User Registrations
│   ├── Jobs Completed
│   ├── AI Usage
│   └── Storage Used
└── Card (Active Alerts)
```

### Skills Configuration (`/admin/skills`)

```
SkillsPage
├── Card (Active Skills)
│   └── Badge (version, enabled)
├── SkillConfigEditor (per skill)
│   ├── Alert (warning)
│   ├── Input (formula constants x4)
│   └── Button (save)
└── Card (Version History)
```

### Audit Log (`/admin/audit`)

```
AuditPage
└── AuditLogTable
    ├── Input (search)
    ├── Select (action filter)
    ├── Button (export CSV)
    ├── Table
    │   ├── Badge (action)
    │   └── Dialog (details viewer)
    │       └── JSON diff display
    └── Results count
```

### Analytics (`/admin/analytics`)

```
AnalyticsPage
├── Select (time period)
├── StatsCard (x4)
│   ├── Revenue (with trend)
│   ├── Active Users (with trend)
│   ├── Reports Generated
│   └── Avg Analysis Time
├── MetricsChart (x4)
│   ├── Daily Active Users
│   ├── Revenue Trend
│   ├── Analysis Jobs
│   └── AI Cost
└── Card (Usage Breakdown)
```

## Shared Component Usage

### shadcn/ui Components Used

- ✅ Card, CardHeader, CardTitle, CardContent
- ✅ Button, Badge
- ✅ Table, TableHeader, TableBody, TableRow, TableHead, TableCell
- ✅ Input, Label, Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- ✅ Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
- ✅ AlertDialog (for confirmations)
- ✅ Sheet (mobile sidebar)
- ✅ DropdownMenu (action menus)
- ✅ Progress (job progress bars)
- ✅ Skeleton (loading states)
- ✅ Alert, AlertDescription, AlertTitle (warnings)
- ✅ Breadcrumb components

### External Libraries

- ✅ `date-fns` - formatDistanceToNow, formatDuration, intervalToDuration
- ✅ `recharts` - LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
- ✅ `swr` - Data fetching and caching
- ✅ `sonner` - Toast notifications
- ✅ `lucide-react` - Icons (40+ icons used)

## Data Flow

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Admin Page  │─────▶│  SWR Hook    │─────▶│  API Route   │
│  (Client)    │      │  (useUsers)  │      │  /api/admin/ │
└──────────────┘      └──────────────┘      └──────────────┘
       │                     │                      │
       │                     ▼                      ▼
       │              ┌──────────────┐      ┌──────────────┐
       │              │  SWR Cache   │      │  Supabase    │
       │              └──────────────┘      │  Database    │
       │                     │              └──────────────┘
       ▼                     │
┌──────────────┐             │
│  Component   │◀────────────┘
│  (render)    │
└──────────────┘
```

### Real-time Updates

- **Job Queue**: Auto-refreshes every 5 seconds
- **System Health**: Auto-refreshes every 30 seconds
- **Other pages**: Manual refresh or triggered by mutations

### Optimistic Updates

- User disable/enable
- Role changes
- Job retries
- Skill config updates

All mutations use SWR's `mutate()` to immediately update the UI before the API call completes.

## Mobile Responsive Breakpoints

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Mobile     │  Tablet     │  Desktop    │  Large      │
│  375px      │  768px      │  1024px     │  1440px     │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ - Sidebar   │ - Sidebar   │ - Sidebar   │ - Sidebar   │
│   drawer    │   drawer    │   fixed     │   fixed     │
│ - 1 col     │ - 2 cols    │ - 2-4 cols  │ - 4 cols    │
│   stats     │   stats     │   stats     │   stats     │
│ - Stack     │ - Stack     │ - Grid      │ - Grid      │
│   cards     │   cards     │   layout    │   layout    │
│ - Horizontal│ - Horizontal│ - Full      │ - Full      │
│   scroll    │   scroll    │   table     │   table     │
│   tables    │   or stack  │             │             │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

## Performance Optimizations

### Code Splitting

- Each admin page is a separate route (automatic code splitting)
- Charts only loaded on pages that need them (System, Analytics)
- Heavy components lazy-loaded

### Data Caching

- SWR caches all GET requests
- Revalidation on focus, reconnect, interval
- Dedupe requests within 2 seconds

### Optimizations Applied

- ✅ Server Components where possible (layouts, static pages)
- ✅ Client Components only when needed (interactive tables, charts)
- ✅ Memoization for expensive calculations (formatters, filters)
- ✅ Virtualization for long lists (future: react-window)
- ✅ Image optimization (Next.js Image component ready)

---

**Total Components**: 8 reusable + 8 pages = 16 components
**Total Lines of Code**: ~2,500 lines
**shadcn/ui Components Used**: 25+
**Icons Used**: 40+ (lucide-react)
