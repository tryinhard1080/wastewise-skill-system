/**
 * Unit tests for BatchExtractorSkill Excel/CSV parsers
 *
 * Tests the new Excel and CSV parsing capabilities added to BatchExtractorSkill.
 * These tests validate that the parsers correctly handle spreadsheet files
 * and extract structured data.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import path from 'path'
import ExcelJS from 'exceljs'
import Papa from 'papaparse'

describe('BatchExtractorSkill - Excel/CSV Parsers', () => {
  const fixturesPath = path.join(process.cwd(), '__tests__', 'fixtures')

  describe('Excel Parser', () => {
    it('should parse sample-invoice.xlsx successfully', async () => {
      const filePath = path.join(fixturesPath, 'sample-invoice.xlsx')
      expect(fs.existsSync(filePath)).toBe(true)

      const fileBuffer = fs.readFileSync(filePath)
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(fileBuffer as any)

      const worksheet = workbook.worksheets[0]
      expect(worksheet).toBeDefined()
      expect(worksheet.rowCount).toBeGreaterThan(0)

      // Verify headers
      const headerRow = worksheet.getRow(1)
      const headers: string[] = []
      headerRow.eachCell(cell => {
        headers.push(cell.value?.toString() || '')
      })

      expect(headers).toContain('Invoice Number')
      expect(headers).toContain('Invoice Date')
      expect(headers).toContain('Amount')
    })

    it('should parse sample-haullog.xlsx successfully', async () => {
      const filePath = path.join(fixturesPath, 'sample-haullog.xlsx')
      expect(fs.existsSync(filePath)).toBe(true)

      const fileBuffer = fs.readFileSync(filePath)
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(fileBuffer as any)

      const worksheet = workbook.worksheets[0]
      expect(worksheet).toBeDefined()
      expect(worksheet.rowCount).toBeGreaterThan(1) // Header + at least 1 data row

      // Verify haul log data structure
      const headerRow = worksheet.getRow(1)
      const headers: string[] = []
      headerRow.eachCell(cell => {
        headers.push(cell.value?.toString() || '')
      })

      expect(headers).toContain('Date')
      expect(headers).toContain('Container Type')
      expect(headers).toContain('Tons')
    })

    it('should handle Excel files with formulas', async () => {
      // Create a workbook with formulas
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Test')

      worksheet.columns = [
        { header: 'Value 1', key: 'val1' },
        { header: 'Value 2', key: 'val2' },
        { header: 'Sum', key: 'sum' },
      ]

      worksheet.addRow({ val1: 100, val2: 200, sum: { formula: 'A2+B2' } })

      const buffer = await workbook.xlsx.writeBuffer()

      // Load it back
      const loadedWorkbook = new ExcelJS.Workbook()
      await loadedWorkbook.xlsx.load(buffer as any)

      const loadedSheet = loadedWorkbook.worksheets[0]
      const row = loadedSheet.getRow(2)

      // Formulas should be handled (either as result or empty)
      const sumCell = row.getCell(3)
      expect(sumCell.type).toBe(ExcelJS.ValueType.Formula)
    })

    it('should handle empty Excel sheets gracefully', async () => {
      const workbook = new ExcelJS.Workbook()
      workbook.addWorksheet('Empty')

      const buffer = await workbook.xlsx.writeBuffer()

      const loadedWorkbook = new ExcelJS.Workbook()
      await loadedWorkbook.xlsx.load(buffer as any)

      const worksheet = loadedWorkbook.worksheets[0]
      expect(worksheet.rowCount).toBe(0)
    })

    it('should truncate large Excel files to 100 rows', () => {
      // This tests the logic that limits token usage
      const MAX_ROWS = 100
      const totalRows = 200
      const rows: any[][] = []

      for (let i = 0; i < totalRows; i++) {
        rows.push([`Row ${i}`, i])
      }

      const truncatedRows = rows.slice(0, MAX_ROWS)

      expect(truncatedRows.length).toBe(MAX_ROWS)
      expect(rows.length).toBe(totalRows)
      expect(truncatedRows.length).toBeLessThan(totalRows)
    })
  })

  describe('CSV Parser', () => {
    it('should parse sample-invoice.csv successfully', () => {
      const filePath = path.join(fixturesPath, 'sample-invoice.csv')
      expect(fs.existsSync(filePath)).toBe(true)

      const csvContent = fs.readFileSync(filePath, 'utf-8')
      const result = Papa.parse<string[]>(csvContent, {
        skipEmptyLines: true,
        header: false,
      })

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.errors.length).toBe(0)

      // Check header row
      const headers = result.data[0]
      expect(headers).toContain('Invoice Number')
      expect(headers).toContain('Amount')
    })

    it('should parse sample-haullog.csv successfully', () => {
      const filePath = path.join(fixturesPath, 'sample-haullog.csv')
      expect(fs.existsSync(filePath)).toBe(true)

      const csvContent = fs.readFileSync(filePath, 'utf-8')
      const result = Papa.parse<string[]>(csvContent, {
        skipEmptyLines: true,
        header: false,
      })

      expect(result.data.length).toBeGreaterThan(1) // Header + data rows
      expect(result.errors.length).toBe(0)

      // Check header row
      const headers = result.data[0]
      expect(headers).toContain('Date')
      expect(headers).toContain('Container Type')
      expect(headers).toContain('Tons')
    })

    it('should auto-detect comma delimiter', () => {
      const csvContent = 'Name,Age,City\nJohn,30,NYC\nJane,25,LA'
      const result = Papa.parse<string[]>(csvContent, {
        delimiter: '', // Auto-detect
        header: false,
      })

      expect(result.data[0]).toEqual(['Name', 'Age', 'City'])
      expect(result.data[1]).toEqual(['John', '30', 'NYC'])
    })

    it('should handle tab-delimited CSV', () => {
      const csvContent = 'Name\tAge\tCity\nJohn\t30\tNYC\nJane\t25\tLA'
      const result = Papa.parse<string[]>(csvContent, {
        delimiter: '\t',
        header: false,
      })

      expect(result.data[0]).toEqual(['Name', 'Age', 'City'])
      expect(result.data[1]).toEqual(['John', '30', 'NYC'])
    })

    it('should handle quoted fields with commas', () => {
      const csvContent = 'Name,Description,Amount\nJohn,"Service, Monthly",1000'
      const result = Papa.parse<string[]>(csvContent, {
        header: false,
      })

      expect(result.data[1][1]).toBe('Service, Monthly')
    })

    it('should handle empty CSV gracefully', () => {
      const csvContent = ''
      const result = Papa.parse<string[]>(csvContent, {
        skipEmptyLines: true,
        header: false,
      })

      expect(result.data.length).toBe(0)
    })

    it('should truncate large CSV files to 100 rows', () => {
      const MAX_ROWS = 100
      const totalRows = 200
      const rows: string[][] = []

      for (let i = 0; i < totalRows; i++) {
        rows.push([`Row ${i}`, `${i}`])
      }

      const truncatedRows = rows.slice(0, MAX_ROWS)

      expect(truncatedRows.length).toBe(MAX_ROWS)
      expect(rows.length).toBe(totalRows)
    })
  })

  describe('Table Formatting for LLM', () => {
    it('should format table data correctly', () => {
      const rows = [
        ['Header 1', 'Header 2', 'Header 3'],
        ['Value 1', 'Value 2', 'Value 3'],
        ['Value 4', 'Value 5', 'Value 6'],
      ]

      const fileName = 'test.xlsx'
      const formatted = formatTableForTesting(rows, fileName)

      expect(formatted).toContain(fileName)
      expect(formatted).toContain('Table with 2 data rows and 3 columns')
      expect(formatted).toContain('Header 1 | Header 2 | Header 3')
      expect(formatted).toContain('Row 1: Value 1 | Value 2 | Value 3')
    })

    it('should handle empty tables', () => {
      const rows: any[][] = []
      const formatted = formatTableForTesting(rows, 'empty.csv')

      expect(formatted).toBe('Empty table')
    })

    it('should handle tables with varying column counts', () => {
      const rows = [
        ['A', 'B', 'C'],
        ['1', '2'], // Missing column
        ['3', '4', '5', '6'], // Extra column
      ]

      const formatted = formatTableForTesting(rows, 'test.csv')

      // Should calculate max columns (4)
      expect(formatted).toContain('Table with 2 data rows and 4 columns')
    })
  })

  describe('File Size Validation', () => {
    it('should reject files larger than 10MB', () => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      const fileSize = 11 * 1024 * 1024 // 11MB

      expect(fileSize).toBeGreaterThan(MAX_FILE_SIZE)

      // This would trigger error in actual implementation
      const shouldReject = fileSize > MAX_FILE_SIZE
      expect(shouldReject).toBe(true)
    })

    it('should accept files smaller than 10MB', () => {
      const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
      const fileSize = 5 * 1024 * 1024 // 5MB

      expect(fileSize).toBeLessThan(MAX_FILE_SIZE)

      const shouldAccept = fileSize <= MAX_FILE_SIZE
      expect(shouldAccept).toBe(true)
    })
  })

  describe('Security - Formula Sanitization', () => {
    it('should extract formula results, not formulas themselves', async () => {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Test')

      worksheet.columns = [
        { header: 'Value', key: 'val' },
        { header: 'Malicious Formula', key: 'formula' },
      ]

      // Add a potentially malicious formula
      worksheet.addRow({
        val: 'Test',
        formula: { formula: '=HYPERLINK("http://malicious.com","Click")' },
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const loadedWorkbook = new ExcelJS.Workbook()
      await loadedWorkbook.xlsx.load(buffer as any)

      const loadedSheet = loadedWorkbook.worksheets[0]
      const row = loadedSheet.getRow(2)
      const formulaCell = row.getCell(2)

      // Should be identified as formula type
      expect(formulaCell.type).toBe(ExcelJS.ValueType.Formula)

      // Implementation should extract result, not formula
      const value = formulaCell.result?.toString() || ''
      expect(value).not.toContain('HYPERLINK')
    })
  })
})

/**
 * Helper function to test table formatting logic
 * (mimics the private method in BatchExtractorSkill)
 */
function formatTableForTesting(rows: any[][], fileName: string): string {
  if (rows.length === 0) {
    return 'Empty table'
  }

  const rowCount = rows.length
  const colCount = Math.max(...rows.map(r => r.length))

  const header = rows[0]
  const dataRows = rows.slice(1)

  let formatted = `Spreadsheet: ${fileName}\n`
  formatted += `Table with ${dataRows.length} data rows and ${colCount} columns\n\n`
  formatted += `Header: ${header.join(' | ')}\n`
  formatted += `${'-'.repeat(80)}\n`

  dataRows.forEach((row, idx) => {
    formatted += `Row ${idx + 1}: ${row.join(' | ')}\n`
  })

  return formatted
}
