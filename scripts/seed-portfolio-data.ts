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

        // Group rows by Invoice Number
        const invoiceGroups: Record<string, any[]> = {};

        sheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;

            const invoiceNum = row.getCell(5).text;
            if (!invoiceNum) return;

            if (!invoiceGroups[invoiceNum]) {
                invoiceGroups[invoiceNum] = [];
            }
            invoiceGroups[invoiceNum].push(row);
        });

        for (const [invoiceNum, rows] of Object.entries(invoiceGroups)) {
            const firstRow = rows[0];
            const propertyName = firstRow.getCell(1).text;

            let projectId = projectMap[propertyName];
            if (!projectId) {
                projectId = projectMap[sheet.name];
            }

            if (!projectId) {
                continue;
            }

            const invoiceDateStr = firstRow.getCell(6).text;
            const invoiceDate = new Date(invoiceDateStr);
            if (isNaN(invoiceDate.getTime())) {
                continue;
            }

            const vendorName = firstRow.getCell(3).text || 'Unknown Vendor';
            const totalAmount = parseFloat(firstRow.getCell(7).text || '0');

            const charges = rows.map(row => ({
                description: row.getCell(10).text,
                category: row.getCell(11).text,
                amount: parseFloat(row.getCell(14).text || '0'),
                quantity: parseFloat(row.getCell(12).text || '0'),
                rate: parseFloat(row.getCell(13).text || '0')
            })).filter(c => c.description && !c.description.toLowerCase().includes('payment'));

            if (charges.length === 0) {
                continue;
            }

            const { data: existing } = await supabase
                .from('invoice_data')
                .select('id')
                .eq('invoice_number', invoiceNum)
                .eq('project_id', projectId)
                .single();

            if (existing) {
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
