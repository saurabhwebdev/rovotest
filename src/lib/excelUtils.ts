import * as XLSX from 'xlsx';

interface MasterDataRow {
  name: string;
  code?: string;
  isActive?: boolean;
}

export const generateExcelTemplate = (category: string): Blob => {
  const headers = ['Name', 'Code (Optional)', 'Is Active (Yes/No)'];
  const sampleData = [
    ['Sample Name 1', 'CODE1', 'Yes'],
    ['Sample Name 2', 'CODE2', 'No'],
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, category);

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const parseExcelFile = async (file: File): Promise<MasterDataRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        // Skip header row and process data
        const rows = jsonData.slice(1).map((row) => ({
          name: row[0]?.trim() || '',
          code: row[1]?.trim() || undefined,
          isActive: row[2]?.toLowerCase() === 'yes' || row[2]?.toLowerCase() === 'true'
        })).filter(row => row.name); // Filter out empty rows

        resolve(rows);
      } catch (error) {
        reject(new Error('Failed to parse Excel file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };

    reader.readAsArrayBuffer(file);
  });
}; 