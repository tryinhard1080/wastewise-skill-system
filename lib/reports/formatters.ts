/**
 * Excel Formatting Utilities
 *
 * Reusable cell styles, number formats, and formatting functions for Excel reports
 *
 * Features:
 * - Consistent color scheme (WasteWise branding)
 * - Standardized fonts and alignments
 * - Number formats (currency, percentage, decimal)
 * - Border styles
 * - Column auto-sizing
 */

import type {
  Worksheet,
  Cell,
  Row,
  Column,
  Border,
  Borders,
  Fill,
  Font,
  Alignment,
} from "exceljs";

/**
 * WasteWise Color Palette
 */
export const COLORS = {
  // Primary brand colors
  primary: "0F766E", // Teal 700
  primaryLight: "5EEAD4", // Teal 300
  primaryDark: "134E4A", // Teal 800

  // Accent colors
  accent: "F59E0B", // Amber 500
  accentLight: "FCD34D", // Amber 300
  accentDark: "D97706", // Amber 600

  // Status colors
  success: "10B981", // Green 500
  warning: "F59E0B", // Amber 500
  danger: "EF4444", // Red 500
  info: "3B82F6", // Blue 500

  // Neutral colors
  white: "FFFFFF",
  grayLight: "F3F4F6", // Gray 100
  gray: "D1D5DB", // Gray 300
  grayDark: "6B7280", // Gray 500
  black: "1F2937", // Gray 800
} as const;

/**
 * Font Definitions
 */
export const FONTS = {
  header: {
    name: "Calibri",
    size: 16,
    bold: true,
    color: { argb: COLORS.white },
  },
  subheader: {
    name: "Calibri",
    size: 14,
    bold: true,
    color: { argb: COLORS.primary },
  },
  sectionTitle: {
    name: "Calibri",
    size: 12,
    bold: true,
    color: { argb: COLORS.primaryDark },
  },
  tableHeader: {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: COLORS.white },
  },
  body: {
    name: "Calibri",
    size: 11,
    color: { argb: COLORS.black },
  },
  bodyBold: {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: COLORS.black },
  },
  small: {
    name: "Calibri",
    size: 9,
    color: { argb: COLORS.grayDark },
  },
} as const;

/**
 * Fill Patterns
 */
export const FILLS = {
  header: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.primary },
  },
  subheader: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.primaryLight },
  },
  tableHeader: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.primary },
  },
  highlightGreen: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "D1FAE5" }, // Green 100
  },
  highlightYellow: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FEF3C7" }, // Amber 100
  },
  highlightRed: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FEE2E2" }, // Red 100
  },
  alternateRow: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: COLORS.grayLight },
  },
} as const;

/**
 * Border Styles
 */
export const BORDERS = {
  thin: {
    top: { style: "thin", color: { argb: COLORS.gray } },
    left: { style: "thin", color: { argb: COLORS.gray } },
    bottom: { style: "thin", color: { argb: COLORS.gray } },
    right: { style: "thin", color: { argb: COLORS.gray } },
  },
  medium: {
    top: { style: "medium", color: { argb: COLORS.primary } },
    left: { style: "medium", color: { argb: COLORS.primary } },
    bottom: { style: "medium", color: { argb: COLORS.primary } },
    right: { style: "medium", color: { argb: COLORS.primary } },
  },
  thick: {
    top: { style: "thick", color: { argb: COLORS.primary } },
    left: { style: "thick", color: { argb: COLORS.primary } },
    bottom: { style: "thick", color: { argb: COLORS.primary } },
    right: { style: "thick", color: { argb: COLORS.primary } },
  },
  bottom: {
    bottom: { style: "thin", color: { argb: COLORS.gray } },
  },
  top: {
    top: { style: "thin", color: { argb: COLORS.gray } },
  },
} as const;

/**
 * Alignment Presets
 */
export const ALIGNMENTS = {
  left: { horizontal: "left", vertical: "middle" },
  center: { horizontal: "center", vertical: "middle" },
  right: { horizontal: "right", vertical: "middle" },
  centerTop: { horizontal: "center", vertical: "top" },
  leftTop: { horizontal: "left", vertical: "top" },
  wrapText: { horizontal: "left", vertical: "top", wrapText: true },
} as const;

/**
 * Number Format Strings
 */
export const NUMBER_FORMATS = {
  currency: "$#,##0.00",
  currencyNoDecimals: "$#,##0",
  percentage: "0.00%",
  percentageNoDecimals: "0%",
  decimal: "#,##0.00",
  decimalNoDecimals: "#,##0",
  integer: "#,##0",
  date: "mm/dd/yyyy",
  dateTime: "mm/dd/yyyy hh:mm AM/PM",
} as const;

/**
 * Apply header style to a row
 */
export function applyHeaderStyle(row: Row): void {
  row.height = 25;
  row.eachCell((cell) => {
    cell.font = FONTS.header as Font;
    cell.fill = FILLS.header as Fill;
    cell.alignment = ALIGNMENTS.center as Alignment;
    cell.border = BORDERS.medium as Partial<Borders>;
  });
}

/**
 * Apply subheader style to a row
 */
export function applySubheaderStyle(row: Row): void {
  row.height = 20;
  row.eachCell((cell) => {
    cell.font = FONTS.subheader as Font;
    cell.fill = FILLS.subheader as Fill;
    cell.alignment = ALIGNMENTS.left as Alignment;
    cell.border = BORDERS.thin as Partial<Borders>;
  });
}

/**
 * Apply table header style to a row
 */
export function applyTableHeaderStyle(row: Row): void {
  row.height = 18;
  row.eachCell((cell) => {
    cell.font = FONTS.tableHeader as Font;
    cell.fill = FILLS.tableHeader as Fill;
    cell.alignment = ALIGNMENTS.center as Alignment;
    cell.border = BORDERS.thin as Partial<Borders>;
  });
}

/**
 * Apply alternating row colors to a range
 */
export function applyAlternatingRows(
  worksheet: Worksheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
): void {
  for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
    if (rowNum % 2 === 0) {
      const row = worksheet.getRow(rowNum);
      for (let colNum = startCol; colNum <= endCol; colNum++) {
        const cell = row.getCell(colNum);
        cell.fill = FILLS.alternateRow as Fill;
      }
    }
  }
}

/**
 * Format a cell as currency
 */
export function formatCurrency(
  cell: Cell,
  value: number,
  decimals: boolean = true,
): void {
  cell.value = value;
  cell.numFmt = decimals
    ? NUMBER_FORMATS.currency
    : NUMBER_FORMATS.currencyNoDecimals;
  cell.alignment = ALIGNMENTS.right as Alignment;
}

/**
 * Format a cell as percentage
 */
export function formatPercentage(
  cell: Cell,
  value: number,
  decimals: boolean = true,
): void {
  cell.value = value / 100; // ExcelJS expects decimal for percentage
  cell.numFmt = decimals
    ? NUMBER_FORMATS.percentage
    : NUMBER_FORMATS.percentageNoDecimals;
  cell.alignment = ALIGNMENTS.right as Alignment;
}

/**
 * Format a cell as decimal number
 */
export function formatNumber(
  cell: Cell,
  value: number,
  decimals: boolean = true,
): void {
  cell.value = value;
  cell.numFmt = decimals
    ? NUMBER_FORMATS.decimal
    : NUMBER_FORMATS.decimalNoDecimals;
  cell.alignment = ALIGNMENTS.right as Alignment;
}

/**
 * Format a cell as date
 */
export function formatDate(cell: Cell, value: string | Date): void {
  cell.value = typeof value === "string" ? new Date(value) : value;
  cell.numFmt = NUMBER_FORMATS.date;
  cell.alignment = ALIGNMENTS.center as Alignment;
}

/**
 * Auto-size columns based on content
 */
export function autoSizeColumns(
  worksheet: Worksheet,
  minWidth: number = 10,
  maxWidth: number = 50,
): void {
  worksheet.columns.forEach((column) => {
    if (!column) return;

    let maxLength = minWidth;
    const colLetter = column.letter;

    if (!colLetter) return;

    // Iterate through all cells in the column
    worksheet.getColumn(colLetter).eachCell({ includeEmpty: false }, (cell) => {
      const cellValue = cell.value;
      let cellLength = 0;

      if (cellValue) {
        if (typeof cellValue === "string") {
          cellLength = cellValue.length;
        } else if (typeof cellValue === "number") {
          cellLength = cellValue.toString().length;
        } else if (cellValue instanceof Date) {
          cellLength = 10; // Date format length
        }
      }

      maxLength = Math.max(maxLength, cellLength);
    });

    // Add padding and cap at max width
    column.width = Math.min(maxLength + 2, maxWidth);
  });
}

/**
 * Merge cells and apply style
 */
export function mergeCells(
  worksheet: Worksheet,
  startRow: number,
  startCol: number,
  endRow: number,
  endCol: number,
  value: string,
  style: "header" | "subheader" | "section" = "section",
): void {
  worksheet.mergeCells(startRow, startCol, endRow, endCol);
  const cell = worksheet.getCell(startRow, startCol);
  cell.value = value;

  switch (style) {
    case "header":
      cell.font = FONTS.header as Font;
      cell.fill = FILLS.header as Fill;
      cell.alignment = ALIGNMENTS.center as Alignment;
      cell.border = BORDERS.medium as Partial<Borders>;
      break;
    case "subheader":
      cell.font = FONTS.subheader as Font;
      cell.fill = FILLS.subheader as Fill;
      cell.alignment = ALIGNMENTS.left as Alignment;
      cell.border = BORDERS.thin as Partial<Borders>;
      break;
    case "section":
      cell.font = FONTS.sectionTitle as Font;
      cell.alignment = ALIGNMENTS.left as Alignment;
      cell.border = BORDERS.bottom as Partial<Borders>;
      break;
  }
}

/**
 * Add conditional formatting for savings/losses
 */
export function applyConditionalFormatting(
  cell: Cell,
  value: number,
  isSavings: boolean = true,
): void {
  if (isSavings) {
    // Positive is good (green), negative is bad (red)
    if (value > 0) {
      cell.fill = FILLS.highlightGreen as Fill;
      cell.font = {
        ...FONTS.bodyBold,
        color: { argb: COLORS.success },
      } as Font;
    } else if (value < 0) {
      cell.fill = FILLS.highlightRed as Fill;
      cell.font = { ...FONTS.bodyBold, color: { argb: COLORS.danger } } as Font;
    }
  } else {
    // Negative is good (green), positive is bad (red) - for costs
    if (value < 0) {
      cell.fill = FILLS.highlightGreen as Fill;
      cell.font = {
        ...FONTS.bodyBold,
        color: { argb: COLORS.success },
      } as Font;
    } else if (value > 0) {
      cell.fill = FILLS.highlightRed as Fill;
      cell.font = { ...FONTS.bodyBold, color: { argb: COLORS.danger } } as Font;
    }
  }
}

/**
 * Add footer with timestamp
 */
export function addFooter(
  worksheet: Worksheet,
  startCol: number = 1,
  endCol: number = 6,
): void {
  const lastRow = worksheet.rowCount + 2;
  const footerRow = worksheet.getRow(lastRow);

  mergeCells(
    worksheet,
    lastRow,
    startCol,
    lastRow,
    endCol,
    `Generated by WasteWise on ${new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`,
    "section",
  );

  const footerCell = footerRow.getCell(startCol);
  footerCell.font = FONTS.small as Font;
  footerCell.alignment = ALIGNMENTS.center as Alignment;
}

/**
 * Create a key-value pair row (label: value)
 */
export function addKeyValueRow(
  worksheet: Worksheet,
  row: Row,
  label: string,
  value: string | number,
  formatType?: "currency" | "percentage" | "number" | "date",
): void {
  const labelCell = row.getCell(1);
  const valueCell = row.getCell(2);

  labelCell.value = label;
  labelCell.font = FONTS.bodyBold as Font;
  labelCell.alignment = ALIGNMENTS.left as Alignment;

  if (formatType === "currency" && typeof value === "number") {
    formatCurrency(valueCell, value);
  } else if (formatType === "percentage" && typeof value === "number") {
    formatPercentage(valueCell, value);
  } else if (formatType === "number" && typeof value === "number") {
    formatNumber(valueCell, value);
  } else if (formatType === "date") {
    if (
      typeof value === "string" ||
      (value && typeof value === "object" && "getDate" in value)
    ) {
      formatDate(valueCell, value as string | Date);
    }
  } else {
    valueCell.value = value;
    valueCell.font = FONTS.body as Font;
    valueCell.alignment = ALIGNMENTS.left as Alignment;
  }
}
