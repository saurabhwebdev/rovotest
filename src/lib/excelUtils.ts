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

/**
 * Export data to CSV file
 * @param data Array of objects to export
 * @param filename Name of the file without extension
 */
export const exportToCSV = (data: Record<string, any>[], filename: string) => {
  try {
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Create workbook and add worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Generate xlsx file
    const excelBuffer = XLSX.write(workbook, { bookType: 'csv', type: 'array' });
    
    // Create blob and download
    const blob = new Blob([excelBuffer], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    
    // Trigger download and cleanup
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting to CSV:', error);
  }
}; 