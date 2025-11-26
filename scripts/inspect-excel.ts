import ExcelJS from 'exceljs';

const FILE_PATH = "C:\\Users\\Richard\\Downloads\\Orion Data Part 2\\Portfolio_Reports\\MASTER_Portfolio_Complete_Data.xlsx";

function getCellValue(cell: any) {
    if (cell.value && typeof cell.value === 'object') {
        if ('result' in cell.value) return cell.value.result;
        if ('richText' in cell.value) return cell.value.richText.map((t: any) => t.text).join('');
        if ('formula' in cell.value) return `=${cell.value.formula}`;
        return JSON.stringify(cell.value);
    }
    return cell.value;
}

async function inspectExcel() {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(FILE_PATH);

    const targetSheets = ['Spend Summary'];

    console.log('All Sheets:', workbook.worksheets.map(w => w.name).join(', '));

    for (const name of targetSheets) {
        const worksheet = workbook.getWorksheet(name);
        if (!worksheet) {
            console.log(`\n--- Sheet: ${name} NOT FOUND ---`);
            continue;
        }

        console.log(`\n--- Sheet: ${name} ---`);

        // Headers (Row 1)
        const headers: string[] = [];
        worksheet.getRow(1).eachCell((cell, colNumber) => {
            if (colNumber <= 20) { // Limit to first 20 columns
                headers.push(`[${colNumber}] ${getCellValue(cell)}`);
            }
        });
        console.log('Headers:', headers.join(' | '));

        // Sample Data (Row 2)
        const sample: string[] = [];
        worksheet.getRow(2).eachCell((cell, colNumber) => {
            if (colNumber <= 20) {
                sample.push(`[${colNumber}] ${getCellValue(cell)}`);
            }
        });
        console.log('Row 2:', sample.join(' | '));
    }
}

inspectExcel().catch(console.error);
