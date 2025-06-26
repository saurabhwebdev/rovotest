'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateExcelTemplate, parseExcelFile } from '@/lib/excelUtils';
import { Save, X, Edit, Power, Trash2 } from 'lucide-react';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import TruckStatusView from '@/components/master-data/TruckStatusView';

interface MasterDataItem {
  id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

interface MasterDataCategory {
  id: string;
  name: string;
  items: MasterDataItem[];
}

export default function MasterDataManagement() {
  const [categories] = useState<string[]>([
    'transporters',
    'depots',
    'suppliers',
    'gates',
    'truck-status'
  ]);

  const [selectedCategory, setSelectedCategory] = useState('transporters');
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCode, setNewItemCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState<MasterDataItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchItems = () => {
      const q = query(collection(db, selectedCategory));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MasterDataItem[];
        
        // Sort by name
        itemsData.sort((a, b) => a.name.localeCompare(b.name));
        setItems(itemsData);
        setLoading(false);
      }, (err) => {
        console.error('Error fetching items:', err);
        setError('Failed to load items');
        setLoading(false);
      });

      return unsubscribe;
    };

    setLoading(true);
    const unsubscribe = fetchItems();
    return () => unsubscribe();
  }, [selectedCategory]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newItemName.trim()) {
      setError('Please enter a name');
      return;
    }

    try {
      await addDoc(collection(db, selectedCategory), {
        name: newItemName.trim(),
        code: newItemCode.trim() || null,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      setNewItemName('');
      setNewItemCode('');
      setError('');
    } catch (err) {
      console.error('Error adding item:', err);
      setError('Failed to add item');
    }
  };

  const handleUpdateItem = async (item: MasterDataItem) => {
    try {
      const itemRef = doc(db, selectedCategory, item.id);
      await updateDoc(itemRef, {
        name: editingItem?.name || item.name,
        code: editingItem?.code || item.code,
        updatedAt: new Date().toISOString()
      });
      setEditingItem(null);
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item');
    }
  };

  const handleToggleActive = async (item: MasterDataItem) => {
    try {
      const itemRef = doc(db, selectedCategory, item.id);
      await updateDoc(itemRef, {
        isActive: !item.isActive,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error toggling item status:', err);
      setError('Failed to update item status');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteDoc(doc(db, selectedCategory, itemId));
    } catch (err) {
      console.error('Error deleting item:', err);
      setError('Failed to delete item');
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'transporters':
        return 'Transporters';
      case 'depots':
        return 'Depots';
      case 'suppliers':
        return 'Suppliers';
      case 'gates':
        return 'Gates';
      case 'truck-status':
        return 'Truck Status';
      default:
        return category;
    }
  };

  const handleDownloadTemplate = () => {
    try {
      const blob = generateExcelTemplate(selectedCategory);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCategory}-template.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error generating template:', err);
      setError('Failed to generate template');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const rows = await parseExcelFile(file);
      
      // Upload each row to Firestore
      const promises = rows.map(row => 
        addDoc(collection(db, selectedCategory), {
          ...row,
          createdAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading data:', err);
      setError('Failed to upload data. Please check the file format.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <PagePermissionWrapper pageId="admin-master-data">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </PagePermissionWrapper>
    );
  }

  return (
    <PagePermissionWrapper pageId="admin-master-data">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Master Data Management</h1>

        {/* Category Selection */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
              >
                {getCategoryLabel(category)}
              </button>
            ))}
          </div>
        </div>

        {/* Show Excel Import/Export and Add Item form only for regular master data categories */}
        {selectedCategory !== 'truck-status' && (
          <>
            {/* Excel Import/Export Section */}
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Bulk Import/Export</h2>
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 
                           focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Download Template
                </button>
                
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls"
                    className="hidden"
                    disabled={uploading}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                             disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {uploading ? 'Uploading...' : 'Upload Excel'}
                  </button>
                </div>
              </div>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Add Item Form */}
            <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">
                Add New {getCategoryLabel(selectedCategory).slice(0, -1)}
              </h2>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                               dark:bg-gray-700 dark:text-white"
                      placeholder={`Enter ${getCategoryLabel(selectedCategory).toLowerCase().slice(0, -1)} name`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={newItemCode}
                      onChange={(e) => setNewItemCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                               shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 
                               dark:bg-gray-700 dark:text-white"
                      placeholder="Enter code"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Add {getCategoryLabel(selectedCategory).slice(0, -1)}
                  </button>
                </div>
              </form>
            </div>

            {/* Items List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingItem?.id === item.id ? (
                            <input
                              type="text"
                              value={editingItem.name}
                              onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded 
                                       dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <span className="text-gray-900 dark:text-gray-100">{item.name}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingItem?.id === item.id ? (
                            <input
                              type="text"
                              value={editingItem.code || ''}
                              onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded 
                                       dark:bg-gray-700 dark:text-white"
                            />
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">{item.code || '-'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {item.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          {editingItem?.id === item.id ? (
                            <>
                              <button
                                onClick={() => handleUpdateItem(item)}
                                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                         transition-colors duration-200"
                                title="Save"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingItem(null)}
                                className="p-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 
                                         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                                         transition-colors duration-200"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingItem(item)}
                                className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 
                                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                         transition-colors duration-200"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleToggleActive(item)}
                                className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2
                                          transition-colors duration-200 ${
                                  item.isActive
                                    ? 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500'
                                    : 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
                                }`}
                                title={item.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 
                                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                                         transition-colors duration-200"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No items found. Add your first {getCategoryLabel(selectedCategory).toLowerCase().slice(0, -1)}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Show Truck Status View for truck-status category */}
        {selectedCategory === 'truck-status' && (
          <TruckStatusView />
        )}
      </div>
    </PagePermissionWrapper>
  );
} 