import ExcelJS from 'exceljs';

const FILE_PATH = "C:\\Users\\Richard\\Downloads\\Orion Data Part 2\\Portfolio_Reports\\MASTER_Portfolio_Complete_Data.xlsx";

async function inspectExcel() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(FILE_PATH);

    const sheetName = 'Orion McKinney';
    const worksheet = workbook.getWorksheet(sheetName);

    if (!worksheet) {
        console.log(`Sheet ${sheetName} not found!`);
        return;
    }

    console.log(`--- Inspecting ${sheetName} ---`);

    // Check first 5 rows to find headers
    for (let i = 1; i <= 5; i++) {
        const row = worksheet.getRow(i);
        const values = row.values;
        console.log(`Row ${i}:`, JSON.stringify(values));
    }
}

inspectExcel().catch(console.error);
