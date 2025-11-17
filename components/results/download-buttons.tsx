'use client'

import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Globe, Download } from 'lucide-react'

interface DownloadButtonsProps {
  excelUrl: string
  htmlUrl: string
}

export function DownloadButtons({ excelUrl, htmlUrl }: DownloadButtonsProps) {
  const handleDownload = (url: string, filename: string) => {
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
    window.open(htmlUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <section className="flex flex-col sm:flex-row gap-4">
      <Button
        size="lg"
        onClick={() =>
          handleDownload(excelUrl, 'wastewise-analysis-report.xlsx')
        }
        className="flex-1 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-800"
      >
        <FileSpreadsheet className="mr-2 h-5 w-5" />
        Download Excel Report
        <Download className="ml-2 h-4 w-4" />
      </Button>

      <Button
        size="lg"
        variant="outline"
        onClick={handleViewHtml}
        className="flex-1 border-teal-600 text-teal-600 hover:bg-teal-50 dark:border-teal-400 dark:text-teal-400 dark:hover:bg-teal-950"
      >
        <Globe className="mr-2 h-5 w-5" />
        View HTML Dashboard
      </Button>
    </section>
  )
}
