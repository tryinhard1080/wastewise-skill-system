# Results Components

Results page components for displaying WasteWise analysis results.

## Components

### AnalysisSummary

Displays summary metrics in card layout with icons.

**Props:**

```typescript
interface AnalysisSummaryProps {
  summary: WasteWiseAnalyticsCompleteResult["summary"];
}
```

**Features:**

- 4 metric cards: Total Savings, Current Cost, Optimized Cost, Savings %
- Color-coded icons (green, blue, teal, amber)
- Responsive grid layout (1 column mobile, 2 tablet, 4 desktop)
- Date range and haul count display
- Formatted currency and percentages

### RecommendationsList

Displays optimization recommendations in collapsible accordion.

**Props:**

```typescript
interface RecommendationsListProps {
  recommendations: WasteWiseAnalyticsCompleteResult["recommendations"];
}
```

**Features:**

- Priority badges (Critical=red, High=default, Medium=secondary, Low=outline)
- Confidence level badges (HIGH/MEDIUM/LOW)
- Collapsible details with implementation timeline
- Annual savings display
- Empty state for no recommendations
- Sorted by priority (ascending)

### DownloadButtons

Download buttons for Excel and HTML reports.

**Props:**

```typescript
interface DownloadButtonsProps {
  excelUrl: string;
  htmlUrl: string;
}
```

**Features:**

- Excel download button (teal background)
- HTML view button (teal outline)
- Responsive layout (stack on mobile, side-by-side on desktop)
- Icons: FileSpreadsheet, Globe, Download

## Usage

```typescript
import { AnalysisSummary } from '@/components/results/analysis-summary'
import { RecommendationsList } from '@/components/results/recommendations-list'
import { DownloadButtons } from '@/components/results/download-buttons'

export default function ResultsPage() {
  const result = // ... fetch from database

  return (
    <div>
      <DownloadButtons
        excelUrl={result.reports.excelWorkbook.downloadUrl}
        htmlUrl={result.reports.htmlDashboard.downloadUrl}
      />
      <AnalysisSummary summary={result.summary} />
      <RecommendationsList recommendations={result.recommendations} />
    </div>
  )
}
```

## Color Scheme

Following WasteWise brand colors:

- **Primary (Teal)**: #0d9488 (teal-600)
- **Accent (Amber)**: #f59e0b (amber-500)
- **Success (Green)**: #16a34a (green-600)
- **Info (Blue)**: #2563eb (blue-600)

## Dependencies

- shadcn/ui components: Card, Badge, Button, Accordion
- lucide-react icons
- @/lib/skills/types for TypeScript types
