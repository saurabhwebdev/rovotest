'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, writeBatch } from 'firebase/firestore';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import { generateExcelTemplate, parseExcelFile, exportToCSV } from '@/lib/excelUtils';
import { UploadCloud, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

type DockType = 'LOADING' | 'UNLOADING' | 'BOTH';

interface DockData {
  id: string;
  name: string;
  isActive: boolean;
  type: DockType;
  capacity: number;
  location: string;
}

interface DockUploadData {
  name: string;
  type: string;
  capacity: string | number;
  location: string;
  isActive: string | boolean;
}

export default function DockManagementPage() {
  const [docks, setDocks] = useState<DockData[]>([]);
  const [newDock, setNewDock] = useState({
    name: '',
    type: 'BOTH' as DockType,
    capacity: 1,
    location: '',
    isActive: true
  });
  const [editingDock, setEditingDock] = useState<DockData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchDocks();
  }, []);

  const fetchDocks = async () => {
    try {
      const docksQuery = query(collection(db, 'docks'), orderBy('name'));
      const querySnapshot = await getDocs(docksQuery);
      const docksData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DockData[];
      setDocks(docksData);
    } catch (error) {
      console.error('Error fetching docks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDock) {
        await updateDoc(doc(db, 'docks', editingDock.id), {
          ...newDock
        });
      } else {
        await addDoc(collection(db, 'docks'), {
          ...newDock
        });
      }
      setNewDock({
        name: '',
        type: 'BOTH',
        capacity: 1,
        location: '',
        isActive: true
      });
      setEditingDock(null);
      setShowForm(false);
      fetchDocks();
    } catch (error) {
      console.error('Error saving dock:', error);
    }
  };

  const handleEdit = (dock: DockData) => {
    setEditingDock(dock);
    setNewDock({
      name: dock.name,
      type: dock.type,
      capacity: dock.capacity,
      location: dock.location,
      isActive: dock.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this dock?')) {
      try {
        await deleteDoc(doc(db, 'docks', id));
        fetchDocks();
      } catch (error) {
        console.error('Error deleting dock:', error);
      }
    }
  };

  const handleCancel = () => {
    setEditingDock(null);
    setNewDock({
      name: '',
      type: 'BOTH',
      capacity: 1,
      location: '',
      isActive: true
    });
    setShowForm(false);
  };

  const downloadSampleTemplate = () => {
    const headers = ['Name', 'Type (LOADING/UNLOADING/BOTH)', 'Capacity', 'Location', 'IsActive (Yes/No)'];
    const sampleData = [
      ['Dock A', 'LOADING', '1', 'North Wing', 'Yes'],
      ['Dock B', 'UNLOADING', '2', 'South Wing', 'Yes'],
      ['Dock C', 'BOTH', '1', 'East Wing', 'No'],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Docks Template');

    XLSX.writeFile(wb, 'docks_import_template.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);
    setUploadProgress(0);

    try {
      // Read file directly instead of using the parseExcelFile utility
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            throw new Error('Failed to read file');
          }

          const data = new Uint8Array(event.target.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          if (!workbook.SheetNames.length) {
            throw new Error('No sheets found in Excel file');
          }
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Read as arrays with headers
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          if (rawData.length < 2) {
            throw new Error('File contains insufficient data (needs headers and at least one row)');
          }
          
          // Extract headers and convert to lowercase for case-insensitive matching
          const headers = rawData[0].map(h => String(h).toLowerCase().trim());
          
          // Find column indexes
          const nameIndex = headers.findIndex(h => h.includes('name'));
          const typeIndex = headers.findIndex(h => h.includes('type'));
          const capacityIndex = headers.findIndex(h => h.includes('capacity'));
          const locationIndex = headers.findIndex(h => h.includes('location'));
          const isActiveIndex = headers.findIndex(h => h.includes('active') || h.includes('isactive'));
          
          if (nameIndex === -1) {
            throw new Error('Name column not found in the file');
          }
          
          // Process data rows
          const validDocks: DockUploadData[] = [];
          const invalidRows: { row: number; reason: string }[] = [];
          
          for (let i = 1; i < rawData.length; i++) {
            const row = rawData[i];
            const rowNum = i + 1; // For error reporting
            
            // Skip empty rows
            if (!row || !row.length || !row[nameIndex]) {
              continue;
            }
            
            const name = String(row[nameIndex] || '').trim();
            if (!name) {
              invalidRows.push({ row: rowNum, reason: 'Missing dock name' });
              continue;
            }
            
            // Process type (default to BOTH if not specified)
            let type = 'BOTH';
            if (typeIndex !== -1 && row[typeIndex]) {
              type = String(row[typeIndex]).trim().toUpperCase();
              if (!['LOADING', 'UNLOADING', 'BOTH'].includes(type)) {
                invalidRows.push({ row: rowNum, reason: `Invalid type: "${type}". Must be LOADING, UNLOADING, or BOTH` });
                continue;
              }
            }
            
            // Process capacity (default to 1 if not valid)
            let capacity = 1;
            if (capacityIndex !== -1 && row[capacityIndex] !== undefined && row[capacityIndex] !== null) {
              const capValue = row[capacityIndex];
              const numericValue = Number(capValue);
              
              if (!isNaN(numericValue) && numericValue > 0) {
                capacity = numericValue;
              } else {
                invalidRows.push({ row: rowNum, reason: `Invalid capacity: "${capValue}". Must be a positive number` });
                continue;
              }
            }
            
            // Process location
            const location = locationIndex !== -1 ? String(row[locationIndex] || '').trim() : '';
            
            // Process isActive
            let isActive = true;
            if (isActiveIndex !== -1 && row[isActiveIndex] !== undefined) {
              const activeValue = String(row[isActiveIndex]).toLowerCase().trim();
              isActive = activeValue === 'yes' || activeValue === 'true' || activeValue === '1' || activeValue === 'y';
            }
            
            validDocks.push({
              name,
              type,
              capacity,
              location,
              isActive
            });
          }
          
          // Handle validation results
          if (invalidRows.length > 0) {
            const errorMessage = `Found ${invalidRows.length} invalid rows:\n${invalidRows.slice(0, 3).map(r => `Row ${r.row}: ${r.reason}`).join('\n')}${invalidRows.length > 3 ? '\n...and more' : ''}`;
            setUploadStatus({
              success: false,
              message: errorMessage
            });
            setIsUploading(false);
            return;
          }
          
          if (validDocks.length === 0) {
            setUploadStatus({
              success: false,
              message: 'No valid dock data found in the uploaded file'
            });
            setIsUploading(false);
            return;
          }
          
          // Import the docks in batches
          const batchSize = 20;
          const batches = Math.ceil(validDocks.length / batchSize);
          
          for (let i = 0; i < batches; i++) {
            const batch = writeBatch(db);
            const batchDocks = validDocks.slice(i * batchSize, (i + 1) * batchSize);
            
            for (const dockData of batchDocks) {
              const docRef = doc(collection(db, 'docks'));
              batch.set(docRef, {
                name: dockData.name,
                type: dockData.type,
                capacity: Number(dockData.capacity),
                location: dockData.location,
                isActive: Boolean(dockData.isActive)
              });
            }
            
            await batch.commit();
            setUploadProgress(Math.min(100, Math.round(((i + 1) / batches) * 100)));
          }
          
          setUploadStatus({
            success: true,
            message: `Successfully imported ${validDocks.length} docks`
          });
          fetchDocks();
        } catch (error) {
          console.error('Error processing Excel file:', error);
          setUploadStatus({
            success: false,
            message: 'Failed to process file: ' + (error instanceof Error ? error.message : 'Unknown error')
          });
        } finally {
          setIsUploading(false);
          setUploadProgress(100);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      reader.onerror = () => {
        setUploadStatus({
          success: false,
          message: 'Failed to read file: Error reading the file from disk'
        });
        setIsUploading(false);
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error uploading dock data:', error);
      setUploadStatus({
        success: false,
        message: 'Failed to upload: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
      setIsUploading(false);
    }
  };

  // Export current docks to CSV
  const exportDocks = () => {
    const exportData = docks.map(dock => ({
      Name: dock.name,
      Type: dock.type,
      Capacity: dock.capacity,
      Location: dock.location,
      IsActive: dock.isActive ? 'Yes' : 'No'
    }));
    
    exportToCSV(exportData, 'docks');
  };

  return (
    <PagePermissionWrapper pageId="admin-dock-management">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dock Management</h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={downloadSampleTemplate}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Sample Template
            </button>
            <label
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 cursor-pointer flex items-center"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Import Docks
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={exportDocks}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 flex items-center"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export Docks
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors duration-200"
            >
              Add New Dock
            </button>
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`mb-6 p-4 rounded-md ${uploadStatus.success ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
            <div className="flex items-start">
              {uploadStatus.success ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 dark:text-green-400 mr-3 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-3 mt-0.5" />
              )}
              <div>
                <h3 className={`text-sm font-medium ${uploadStatus.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                  {uploadStatus.success ? 'Upload Successful' : 'Upload Failed'}
                </h3>
                <div className={`mt-1 text-sm whitespace-pre-line ${uploadStatus.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {uploadStatus.message}
                </div>
              </div>
              <button 
                onClick={() => setUploadStatus(null)}
                className="ml-auto text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Uploading...</span>
              <span className="ml-auto text-sm text-blue-600 dark:text-blue-400">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 dark:bg-blue-700 rounded-full h-2.5">
              <div className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {showForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
              {editingDock ? 'Edit Dock' : 'Add New Dock'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dock Name
                </label>
                <input
                  type="text"
                  value={newDock.name}
                  onChange={(e) => setNewDock({ ...newDock, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={newDock.type}
                  onChange={(e) => setNewDock({ ...newDock, type: e.target.value as DockType })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="LOADING">Loading</option>
                  <option value="UNLOADING">Unloading</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capacity (trucks)
                </label>
                <input
                  type="number"
                  value={newDock.capacity}
                  onChange={(e) => setNewDock({ ...newDock, capacity: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newDock.location}
                  onChange={(e) => setNewDock({ ...newDock, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={newDock.isActive}
                    onChange={(e) => setNewDock({ ...newDock, isActive: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
                </label>
              </div>

              <div className="col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {editingDock ? 'Update Dock' : 'Create Dock'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {docks.map((dock) => (
                  <tr key={dock.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {dock.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {dock.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {dock.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                      {dock.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        dock.isActive 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {dock.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(dock)}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(dock.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </PagePermissionWrapper>
  );
} 