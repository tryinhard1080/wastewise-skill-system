import { createClient } from '@supabase/supabase-js';
import ExcelJS from 'exceljs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const FILE_PATH = "C:\\Users\\Richard\\Downloads\\Orion Data Part 2\\Portfolio_Reports\\MASTER_Portfolio_Complete_Data.xlsx";

// Sheets to ignore when looking for invoice data
const IGNORE_SHEETS = [
    'Executive Summary',
    'Property_Reference',
    'Property Overview',
    'Spend Summary',
    'Yards Per Door',
    'Service Details',
    'Contract Terms',
    'Spend by Category'
];

async function getUserId() {
    // Get the first user to assign projects to
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error || !users.users.length) {
        throw new Error('No users found to assign projects to.');
    }
    return users.users[0].id;
}

function mapPropertyType(type: string): string {
    if (!type) return 'Garden-Style';
    const t = type.toLowerCase();
    if (t.includes('garden')) return 'Garden-Style';
    if (t.includes('mid')) return 'Mid-Rise';
    if (t.includes('high')) return 'High-Rise';
    return 'Garden-Style';
}

function mapEquipmentType(type: string): "COMPACTOR" | "DUMPSTER" | "MIXED" {
    if (!type) return 'DUMPSTER';
    const t = type.toLowerCase();
    if (t.includes('compactor')) return 'COMPACTOR';
    if (t.includes('dumpster')) return 'DUMPSTER';
    return 'MIXED';
}

async function seedProjects(workbook: ExcelJS.Workbook, userId: string) {
    const sheet = workbook.getWorksheet('Property Overview');
    if (!sheet) {
        console.error('Property Overview sheet not found');
        return {};
    }

    console.log('Seeding Projects...');
    const projectMap: Record<string, string> = {}; // Name -> ID

    // Iterate rows starting from 2
    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        rows.push(row);
    });

    for (const row of rows) {
        const propertyName = row.getCell(1).text;
        if (!propertyName) continue;

        const state = row.getCell(2).text || 'TX';
        let units = parseInt(row.getCell(3).text || '0') || 100;
        if (units < 10) units = 10; // Enforce constraint
        if (units > 2000) units = 2000; // Enforce constraint

        const propertyType = mapPropertyType(row.getCell(4).text);
        const serviceType = mapEquipmentType(row.getCell(5).text);

        // Check if project exists
        const { data: existing } = await supabase
            .from('projects')
            .select('id')
            .eq('property_name', propertyName)
            .eq('user_id', userId)
            .single();

        if (existing) {
            console.log(`Project ${propertyName} already exists.`);
            projectMap[propertyName] = existing.id;
            continue;
        }

        const { data: newProject, error } = await supabase
            .from('projects')
            .insert({
                user_id: userId,
                property_name: propertyName,
                units,
                city: 'Unknown',
                state,
                property_type: propertyType,
                equipment_type: serviceType,
                status: 'completed',
                analysis_period_months: 12
            })
            .select()
            .single();

        if (error) {
            console.error(`Failed to create project ${propertyName}:`, error);
        } else {
            console.log(`Created project: ${propertyName}`);
            projectMap[propertyName] = newProject.id;
        }
    }

    return projectMap;
}

async function seedInvoices(workbook: ExcelJS.Workbook, projectMap: Record<string, string>) {
    console.log('Seeding Invoices...');

    for (const sheet of workbook.worksheets) {
        if (IGNORE_SHEETS.includes(sheet.name)) continue;

        console.log(`Processing sheet: ${sheet.name}`);

        // Map headers to column indices
        const headerMap: Record<string, number> = {};
        const headerRow = sheet.getRow(1);
        headerRow.eachCell((cell, colNumber) => {
            const val = cell.text?.toLowerCase().trim();
            if (val) headerMap[val] = colNumber;
        });

        if (sheet.name.includes('Springs')) {
            console.log(`Debug Springs Header Map:`, JSON.stringify(headerMap));
        }

        // Helper to get value by header name
        const getVal = (row: ExcelJS.Row, header: string, fallbackIndex: number) => {
            // Try exact match
            let idx = headerMap[header.toLowerCase()];
            // Try partial match if not found
            if (!idx) {
                const key = Object.keys(headerMap).find(k => k.includes(header.toLowerCase()));
                if (key) idx = headerMap[key];
            }

            const finalIdx = idx || fallbackIndex;
            const cell = row.getCell(finalIdx);
            let val = cell.text || cell.value?.toString();

            // Fallback to row.values if cell is empty but values array has data
            if (!val && row.values && Array.isArray(row.values)) {
                const values = row.values as any[];
                if (values[finalIdx]) {
                    val = values[finalIdx]?.toString();
                }
            }

            return val || '';
        };

        // Group rows by Invoice Number
        const invoiceGroups: Record<string, any[]> = {};

        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            // Invoice # is usually Col 5
            const invoiceNum = getVal(row, 'invoice #', 5);
            if (!invoiceNum) return;

            if (!invoiceGroups[invoiceNum]) {
                invoiceGroups[invoiceNum] = [];
            }
            invoiceGroups[invoiceNum].push(row);
        });

        for (const [invoiceNum, rows] of Object.entries(invoiceGroups)) {
            const firstRow = rows[0];
            const propertyName = getVal(firstRow, 'property', 1).trim();

            let projectId = projectMap[propertyName];
            if (!projectId) {
                projectId = projectMap[sheet.name.trim()];
            }

            if (!projectId) {
                continue;
            }

            const invoiceDateStr = getVal(firstRow, 'invoice date', 6);
            const invoiceDate = new Date(invoiceDateStr);
            if (isNaN(invoiceDate.getTime())) {
                continue;
            }

            const vendorName = getVal(firstRow, 'vendor', 3) || 'Unknown Vendor';
            const totalAmount = parseFloat(getVal(firstRow, 'total amount', 7) || '0');

            const rawCharges = rows.map(row => {
                let desc = getVal(row, 'description', 10);
                // Fallback to service notes if description is empty
                if (!desc || desc.trim() === '') {
                    desc = getVal(row, 'service notes', 19);
                }

                const cat = getVal(row, 'category', 11);
                const amt = getVal(row, 'amount', 14);

                return {
                    description: desc,
                    category: cat,
                    amount: parseFloat(amt || '0'),
                    quantity: parseFloat(getVal(row, 'quantity', 12) || '0'),
                    rate: parseFloat(getVal(row, 'rate', 13) || '0'),
                    _rowNumber: row.number,
                    _rowValues: row.values
                };
            });

            if (sheet.name.includes('Springs')) {
                console.log(`  Raw Charges Count: ${rawCharges.length}`);
                if (rawCharges.length > 0) {
                    const first = rawCharges[0];
                    console.log(`  First Raw Charge Row #${first._rowNumber}:`);
                    console.log(`    Desc='${first.description}'`);
                    console.log(`    Cat='${first.category}'`);
                    console.log(`    Values=${JSON.stringify(first._rowValues)}`);
                }
            }

            const charges = rawCharges.filter(c => {
                const hasDesc = !!c.description;
                const isPayment = c.description && c.description.toLowerCase().includes('payment');
                const keep = hasDesc && !isPayment;

                if (sheet.name.includes('Springs')) {
                    const rowNum = (c as any)._rowNumber;
                    console.log(`  Row ${rowNum} Filter: Desc='${c.description}', Keep=${keep}, HasDesc=${hasDesc}, IsPayment=${isPayment}`);
                }

                // Remove internal debug props before returning
                delete (c as any)._rowNumber;
                delete (c as any)._rowValues;

                return keep;
            });

            if (sheet.name.includes('Springs')) {
                console.log(`  Filtered Charges Count: ${charges.length}`);
            }

            if (charges.length === 0) {
                if (sheet.name.includes('Springs')) console.log('  SKIPPING: No charges found');
                continue;
            }

            const { data: existing } = await supabase
                .from('invoice_data')
                .select('id')
                .eq('invoice_number', invoiceNum)
                .eq('project_id', projectId)
                .single();

            if (existing) {
                if (sheet.name.includes('Springs')) console.log('  SKIPPING: Already exists');
                continue;
            }

            const { error } = await supabase
                .from('invoice_data')
                .insert({
                    project_id: projectId,
                    invoice_number: invoiceNum,
                    invoice_date: invoiceDate.toISOString(),
                    vendor_name: vendorName,
                    total_amount: totalAmount,
                    service_type: 'Waste Services',
                    charges: { items: charges },
                    notes: `Imported from ${sheet.name}`
                });

            if (error) {
                console.error(`Failed to insert invoice ${invoiceNum}:`, error);
            } else {
                if (sheet.name.includes('Springs')) console.log('  SUCCESS: Inserted invoice');
            }
        }
    }
}

async function seedAnalysisJobs(projectMap: Record<string, string>, userId: string) {
    console.log('Seeding Analysis Jobs...');

    for (const [propertyName, projectId] of Object.entries(projectMap)) {
        const { data: existing } = await supabase
            .from('analysis_jobs')
            .select('id')
            .eq('project_id', projectId)
            .eq('status', 'completed')
            .single();

        if (existing) {
            continue;
        }

        const { error } = await supabase
            .from('analysis_jobs')
            .insert({
                project_id: projectId,
                user_id: userId,
                job_type: 'complete_analysis',
                status: 'completed',
                progress_percent: 100,
                current_step: 'Analysis Complete',
                steps_completed: 5,
                total_steps: 5,
                started_at: new Date().toISOString(),
                completed_at: new Date().toISOString(),
                result_data: { note: 'Imported from Excel' }
            });

        if (error) {
            console.error(`Failed to create job for ${propertyName}:`, error);
        } else {
            console.log(`Created analysis job for ${propertyName}`);
        }
    }
}

async function main() {
    const workbook = new ExcelJS.Workbook();
    console.log('Reading Excel file...');
    await workbook.xlsx.readFile(FILE_PATH);
    console.log('Excel file loaded.');

    const userId = await getUserId();
    console.log(`Using User ID: ${userId}`);

    const projectMap = await seedProjects(workbook, userId);
    await seedInvoices(workbook, projectMap);
    await seedAnalysisJobs(projectMap, userId);

    console.log('Seeding complete.');
}

main().catch(console.error);
