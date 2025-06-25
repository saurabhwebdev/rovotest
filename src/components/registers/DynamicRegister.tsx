import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { collection, getDocs, getDoc, addDoc, deleteDoc, doc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getCollection } from '@/lib/firestore';

// Interfaces for RegisterField and RegisterTemplate types
interface RegisterField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  defaultValue?: any;
}

interface RegisterTemplate {
  id: string;
  name: string;
  description: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  fields: RegisterField[];
}

interface Truck {
  id: string;
  driverName: string;
  vehicleNumber: string;
  transporterName: string;
  reportingDate: string;
  reportingTime: string;
  status: string;
  gate: string;
  createdAt: string | Date;
  approvalStatus?: string;
  [key: string]: any;
}

interface RegisterEntry {
  id: string;
  templateId: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  truckId?: string;
  truck?: Truck;
  data: {[key: string]: any};
}

interface DynamicRegisterProps {
  slug: string;
}

export default function DynamicRegister({ slug }: DynamicRegisterProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [entries, setEntries] = useState<RegisterEntry[]>([]);
  const [template, setTemplate] = useState<RegisterTemplate | null>(null);
  const [formData, setFormData] = useState<{[key: string]: any}>({});
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<string>('');

  // Fetch the register template
  useEffect(() => {
    async function fetchTemplate() {
      setTemplateLoading(true);
      try {
        const templatesCollection = collection(db, 'registerTemplates');
        const templatesQuery = query(templatesCollection, where('slug', '==', slug));
        const templatesSnapshot = await getDocs(templatesQuery);
        
        if (templatesSnapshot.empty) {
          console.error(`No template found with slug: ${slug}`);
          return;
        }
        
        const templateData = {
          id: templatesSnapshot.docs[0].id,
          ...templatesSnapshot.docs[0].data()
        } as RegisterTemplate;
        
        setTemplate(templateData);
        
        // Initialize form data with default values
        const initialFormData: {[key: string]: any} = {};
        templateData.fields.forEach(field => {
          initialFormData[field.id] = field.defaultValue || '';
        });
        
        setFormData(initialFormData);
      } catch (error) {
        console.error("Error fetching register template:", error);
      } finally {
        setTemplateLoading(false);
      }
    }
    
    fetchTemplate();
  }, [slug]);

  // Fetch trucks from the Transporter module
  useEffect(() => {
    async function fetchTrucks() {
      try {
        const trucksData = await getCollection('trucks') as Truck[];
        // Filter trucks to only include those that are active or in the plant
        const activeTrucks = trucksData.filter(truck => 
          truck.status !== 'cancelled' && 
          truck.status !== 'completed' &&
          truck.status !== 'rejected'
        );
        setTrucks(activeTrucks);
      } catch (error) {
        console.error("Error fetching trucks:", error);
      }
    }
    
    fetchTrucks();
  }, []);

  // Fetch register entries
  useEffect(() => {
    async function fetchEntries() {
      if (!template) return;
      
      setLoading(true);
      try {
        const entriesCollection = collection(db, `registers/${template.id}/entries`);
        const entriesSnapshot = await getDocs(entriesCollection);
        const entriesList = entriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate()
        })) as RegisterEntry[];
        
        // For entries with a truckId, fetch the truck details
        const entriesWithTrucks = await Promise.all(
          entriesList.map(async (entry) => {
            if (entry.truckId) {
              try {
                const truckDoc = await getDoc(doc(db, 'trucks', entry.truckId));
                if (truckDoc.exists()) {
                  return {
                    ...entry,
                    truck: {
                      id: truckDoc.id,
                      ...truckDoc.data()
                    } as Truck
                  };
                }
              } catch (error) {
                console.error(`Error fetching truck for entry ${entry.id}:`, error);
              }
            }
            return entry;
          })
        );
        
        setEntries(entriesWithTrucks);
      } catch (error) {
        console.error("Error fetching register entries:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEntries();
  }, [template]);

  // Handle form input changes
  const handleInputChange = (fieldId: string, value: any) => {
    setFormData({
      ...formData,
      [fieldId]: value
    });
  };

  // Initialize form data with default values when opening the modal
  const handleOpenNewEntryModal = () => {
    // Reset form errors
    setFormErrors({});
    
    // Reset selected truck
    setSelectedTruck('');
    
    // Reset form data with default values
    const initialFormData: {[key: string]: any} = {};
    if (template) {
      template.fields.forEach(field => {
        initialFormData[field.id] = field.defaultValue || '';
      });
    }
    
    setFormData(initialFormData);
    setShowForm(true);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template || !user) return;
    
    // Validate form
    const errors: {[key: string]: string} = {};
    
    // Validate truck selection
    if (!selectedTruck) {
      errors.truck = "Please select a truck";
    }
    
    template.fields.forEach(field => {
      if (field.required && (!formData[field.id] || formData[field.id] === '')) {
        errors[field.id] = `${field.name} is required`;
      }
    });
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form
    try {
      setSubmitting(true);
      
      const now = new Date();
      const entryData: Omit<RegisterEntry, 'id'> = {
        templateId: template.id,
        createdAt: now,
        updatedAt: now,
        createdBy: user.uid,
        updatedBy: user.uid,
        truckId: selectedTruck,
        data: formData
      };
      
      // Add entry to Firestore
      await addDoc(collection(db, `registers/${template.id}/entries`), entryData);
      
      // Close the modal
      setShowForm(false);
      
      // Refresh entries
      const entriesCollection = collection(db, `registers/${template.id}/entries`);
      const entriesSnapshot = await getDocs(entriesCollection);
      const entriesList = entriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as RegisterEntry[];
      
      // For entries with a truckId, fetch the truck details
      const entriesWithTrucks = await Promise.all(
        entriesList.map(async (entry) => {
          if (entry.truckId) {
            try {
              const truckDoc = await getDoc(doc(db, 'trucks', entry.truckId));
              if (truckDoc.exists()) {
                return {
                  ...entry,
                  truck: {
                    id: truckDoc.id,
                    ...truckDoc.data()
                  } as Truck
                };
              }
            } catch (error) {
              console.error(`Error fetching truck for entry ${entry.id}:`, error);
            }
          }
          return entry;
        })
      );
      
      setEntries(entriesWithTrucks);
      
    } catch (error) {
      console.error("Error adding register entry:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle entry deletion
  const handleDeleteEntry = async (id: string) => {
    if (!template || !window.confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await deleteDoc(doc(db, `registers/${template.id}/entries`, id));
      setEntries(entries.filter(entry => entry.id !== id));
    } catch (error) {
      console.error("Error deleting register entry:", error);
    }
  };

  // Render field based on type
  const renderField = (field: RegisterField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        );
        
      case 'select':
        return (
          <select
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          >
            <option value="">Select {field.name}</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
        
      case 'checkbox':
        return (
          <input
            type="checkbox"
            id={field.id}
            checked={formData[field.id] || false}
            onChange={(e) => handleInputChange(field.id, e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
        );
        
      case 'date':
        return (
          <input
            type="date"
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        );
        
      case 'datetime':
        return (
          <input
            type="datetime-local"
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        );
        
      case 'textarea':
        return (
          <textarea
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        );
        
      case 'file':
        return (
          <input
            type="file"
            id={field.id}
            onChange={(e) => handleInputChange(field.id, e.target.files?.[0])}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        );
        
      default:
        return (
          <input
            type="text"
            id={field.id}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
          />
        );
    }
  };

  if (templateLoading) {
    return (
      <div className="text-center py-8">
        <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Loading register...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">Register not found. Please check the URL or contact an administrator.</p>
        <Link
          href="/register"
          className="mt-4 inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
        >
          Back to Registers
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{template.name}</h1>
        </div>
        <div className="flex space-x-2">
          <Link
            href="/register"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200"
          >
            Back to Registers
          </Link>
          <button
            onClick={handleOpenNewEntryModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            New Entry
          </button>
        </div>
      </div>

      {/* New Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-xl font-semibold">New {template.name} Entry</h2>
              <button 
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <form onSubmit={handleSubmit}>
                {/* Truck Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Select Truck<span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    value={selectedTruck}
                    onChange={(e) => setSelectedTruck(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                  >
                    <option value="">-- Select a Truck --</option>
                    {trucks.map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.vehicleNumber} - {truck.transporterName} ({truck.driverName})
                      </option>
                    ))}
                  </select>
                  {formErrors.truck && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.truck}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {template.fields.map((field) => (
                    <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {field.name}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      {renderField(field)}
                      {formErrors[field.id] && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors[field.id]}</p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-6 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 ${
                      submitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Entries Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Truck
                </th>
                {template.fields.slice(0, 4).map((field) => (
                  <th 
                    key={field.id} 
                    scope="col" 
                    className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {field.name}
                  </th>
                ))}
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={template.fields.slice(0, 4).length + 3} className="px-2 py-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
                    Loading entries...
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={template.fields.slice(0, 4).length + 3} className="px-2 py-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
                    No entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {entry.truck ? (
                        <div>
                          <div className="font-medium">{entry.truck.vehicleNumber}</div>
                          <div className="text-xs opacity-75">{entry.truck.transporterName}</div>
                        </div>
                      ) : (
                        <span className="italic">No truck data</span>
                      )}
                    </td>
                    {template.fields.slice(0, 4).map((field) => (
                      <td key={field.id} className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                        {field.type === 'checkbox' 
                          ? (entry.data[field.id] ? 'Yes' : 'No')
                          : (entry.data[field.id] || '-')}
                      </td>
                    ))}
                    <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      {entry.createdAt?.toLocaleString() || '-'}
                    </td>
                    <td className="px-2 py-1.5 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => {/* View entry details */}}
                          className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                          title="View Details"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-gray-500 hover:text-red-600 focus:outline-none"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
} 