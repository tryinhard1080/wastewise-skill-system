'use client'

import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Globe, Download, AlertCircle } from 'lucide-react'

interface DownloadButtonsProps {
  excelUrl: string
  htmlUrl: string
}

export function DownloadButtons({ excelUrl, htmlUrl }: DownloadButtonsProps) {
  // Check if URLs are valid (not empty, not placeholder '#')
  const isExcelAvailable = excelUrl && excelUrl !== '#'
  const isHtmlAvailable = htmlUrl && htmlUrl !== '#'

  const handleDownload = (url: string, filename: string) => {
    if (!url || url === '#') return

    // Create a temporary anchor element to trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleViewHtml = () => {
    if (!htmlUrl || htmlUrl === '#') return
    window.open(htmlUrl, '_blank', 'noopener,noreferrer')
  }

  // Show message if reports are not available
  if (!isExcelAvailable && !isHtmlAvailable) {
    return (
      <section className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              Reports Not Available
            </h3>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Report generation failed during analysis. The analysis results below are still valid.
              Please contact support if you need the downloadable reports.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col sm:flex-row gap-4">
      <Button
        size="lg"
        onClick={() =>
          handleDownload(excelUrl, 'wastewise-analysis-report.xlsx')
        }
        disabled={!isExcelAvailable}
        className="flex-1 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          isExcelAvailable
            ? 'Download Excel workbook with 5 detailed tabs'
            : 'Excel report not available'
        }
      >
        <FileSpreadsheet className="mr-2 h-5 w-5" />
        Download Excel Report
        <Download className="ml-2 h-4 w-4" />
      </Button>

      <Button
        size="lg"
        variant="outline"
        onClick={handleViewHtml}
        disabled={!isHtmlAvailable}
        className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-950 disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          isHtmlAvailable
            ? 'Open interactive dashboard in new tab'
            : 'HTML dashboard not available'
        }
      >
        <Globe className="mr-2 h-5 w-5" />
        View HTML Dashboard
      </Button>
    </section>
  )
}
