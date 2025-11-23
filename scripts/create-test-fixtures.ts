/**
 * Script to create test fixture Excel files
 * Run with: tsx scripts/create-test-fixtures.ts
 */

import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

async function createInvoiceExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Invoice");

  // Add headers
  worksheet.columns = [
    { header: "Invoice Number", key: "invoice_number", width: 15 },
    { header: "Invoice Date", key: "invoice_date", width: 15 },
    { header: "Service Period Start", key: "service_start", width: 20 },
    { header: "Service Period End", key: "service_end", width: 20 },
    { header: "Vendor Name", key: "vendor", width: 30 },
    { header: "Service Type", key: "service_type", width: 20 },
    { header: "Description", key: "description", width: 30 },
    { header: "Amount", key: "amount", width: 12 },
  ];

  // Add data rows
  worksheet.addRow({
    invoice_number: "INV-2025-001",
    invoice_date: "2025-01-15",
    service_start: "2025-01-01",
    service_end: "2025-01-31",
    vendor: "Waste Management Services",
    service_type: "Waste Collection",
    description: "Monthly Compactor Service",
    amount: 1250.0,
  });

  worksheet.addRow({
    invoice_number: "INV-2025-001",
    invoice_date: "2025-01-15",
    service_start: "2025-01-01",
    service_end: "2025-01-31",
    vendor: "Waste Management Services",
    service_type: "Waste Collection",
    description: "Environmental Fee",
    amount: 75.0,
  });

  worksheet.addRow({
    invoice_number: "INV-2025-001",
    invoice_date: "2025-01-15",
    service_start: "2025-01-01",
    service_end: "2025-01-31",
    vendor: "Waste Management Services",
    service_type: "Waste Collection",
    description: "Fuel Surcharge",
    amount: 42.5,
  });

  worksheet.addRow({
    invoice_number: "INV-2025-001",
    invoice_date: "2025-01-15",
    service_start: "2025-01-01",
    service_end: "2025-01-31",
    vendor: "Waste Management Services",
    service_type: "Waste Collection",
    description: "Administrative Fee",
    amount: 25.0,
  });

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Save file
  const outputPath = path.join(
    process.cwd(),
    "__tests__",
    "fixtures",
    "sample-invoice.xlsx",
  );
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✓ Created: ${outputPath}`);
}

async function createHaulLogExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Haul Log");

  // Add headers
  worksheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Time", key: "time", width: 10 },
    { header: "Container Type", key: "container_type", width: 15 },
    { header: "Tons", key: "tons", width: 10 },
    { header: "Location", key: "location", width: 15 },
    { header: "Notes", key: "notes", width: 20 },
  ];

  // Add data rows
  const haulData = [
    {
      date: "2025-01-05",
      time: "08:15",
      container_type: "COMPACTOR",
      tons: 6.8,
      location: "Building A",
      notes: "Normal pickup",
    },
    {
      date: "2025-01-08",
      time: "09:30",
      container_type: "COMPACTOR",
      tons: 7.2,
      location: "Building A",
      notes: "",
    },
    {
      date: "2025-01-12",
      time: "08:45",
      container_type: "COMPACTOR",
      tons: 6.5,
      location: "Building A",
      notes: "Light load",
    },
    {
      date: "2025-01-15",
      time: "10:00",
      container_type: "COMPACTOR",
      tons: 8.1,
      location: "Building A",
      notes: "",
    },
    {
      date: "2025-01-19",
      time: "08:00",
      container_type: "COMPACTOR",
      tons: 7.8,
      location: "Building A",
      notes: "Normal pickup",
    },
    {
      date: "2025-01-22",
      time: "09:15",
      container_type: "COMPACTOR",
      tons: 6.9,
      location: "Building A",
      notes: "",
    },
    {
      date: "2025-01-26",
      time: "08:30",
      container_type: "COMPACTOR",
      tons: 7.5,
      location: "Building A",
      notes: "",
    },
    {
      date: "2025-01-29",
      time: "09:45",
      container_type: "COMPACTOR",
      tons: 8.3,
      location: "Building A",
      notes: "Heavy load",
    },
  ];

  haulData.forEach((row) => worksheet.addRow(row));

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Save file
  const outputPath = path.join(
    process.cwd(),
    "__tests__",
    "fixtures",
    "sample-haullog.xlsx",
  );
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✓ Created: ${outputPath}`);
}

async function main() {
  console.log("Creating test fixture Excel files...\n");

  try {
    await createInvoiceExcel();
    await createHaulLogExcel();

    console.log("\n✅ All test fixtures created successfully!");
  } catch (error) {
    console.error("❌ Error creating fixtures:", error);
    process.exit(1);
  }
}

main();
