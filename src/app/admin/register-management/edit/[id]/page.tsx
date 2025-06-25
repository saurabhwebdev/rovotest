'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// Define field types for register templates
const fieldTypes = [
  { id: 'text', name: 'Text' },
  { id: 'number', name: 'Number' },
  { id: 'select', name: 'Select (Dropdown)' },
  { id: 'checkbox', name: 'Checkbox' },
  { id: 'date', name: 'Date' },
  { id: 'datetime', name: 'Date & Time' },
  { id: 'textarea', name: 'Text Area' },
  { id: 'file', name: 'File Upload' },
];

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
  name: string;
  description: string;
  slug: string;
  icon?: string;
  isActive: boolean;
  fields: RegisterField[];
}

export default function EditRegisterTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [template, setTemplate] = useState<RegisterTemplate>({
    name: '',
    description: '',
    slug: '',
    isActive: true,
    fields: []
  });
  const [currentField, setCurrentField] = useState<RegisterField>({
    id: '',
    name: '',
    type: 'text',
    required: false,
    options: []
  });
  const [currentOption, setCurrentOption] = useState('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const templateId = params.id as string;

  // Fetch the register template
  useEffect(() => {
    async function fetchTemplate() {
      setLoading(true);
      try {
        const templateDoc = doc(db, 'registerTemplates', templateId);
        const templateSnapshot = await getDoc(templateDoc);
        
        if (templateSnapshot.exists()) {
          const templateData = templateSnapshot.data() as RegisterTemplate;
          setTemplate(templateData);
        } else {
          setFormErrors({general: 'Template not found'});
        }
      } catch (error) {
        console.error("Error fetching register template:", error);
        setFormErrors({general: 'Error loading template'});
      } finally {
        setLoading(false);
      }
    }
    
    fetchTemplate();
  }, [templateId]);

  // Add an option to the current field
  const handleAddOption = () => {
    if (!currentOption.trim()) return;
    
    if (!currentField.options) {
      currentField.options = [];
    }
    
    setCurrentField({
      ...currentField,
      options: [...currentField.options, currentOption.trim()]
    });
    
    setCurrentOption('');
  };

  // Remove an option from the current field
  const handleRemoveOption = (index: number) => {
    if (!currentField.options) return;
    
    const newOptions = [...currentField.options];
    newOptions.splice(index, 1);
    
    setCurrentField({
      ...currentField,
      options: newOptions
    });
  };

  // Add the current field to the template
  const handleAddField = () => {
    // Validate field
    if (!currentField.name.trim()) {
      setFormErrors({...formErrors, fieldName: 'Field name is required'});
      return;
    }
    
    // Generate a unique ID for the field
    const fieldId = currentField.name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w_]+/g, '');
    
    // Check if field with same name already exists
    if (template.fields.some(f => f.name.toLowerCase() === currentField.name.toLowerCase())) {
      setFormErrors({...formErrors, fieldName: 'A field with this name already exists'});
      return;
    }
    
    // Validate that options are provided for select type
    if (currentField.type === 'select' && (!currentField.options || currentField.options.length === 0)) {
      setFormErrors({...formErrors, options: 'At least one option is required for dropdown fields'});
      return;
    }
    
    // Add the field to the template
    const newField = {
      ...currentField,
      id: fieldId
    };
    
    setTemplate({
      ...template,
      fields: [...template.fields, newField]
    });
    
    // Reset the current field
    setCurrentField({
      id: '',
      name: '',
      type: 'text',
      required: false,
      options: []
    });
    
    // Clear errors
    setFormErrors({});
  };

  // Remove a field from the template
  const handleRemoveField = (index: number) => {
    const newFields = [...template.fields];
    newFields.splice(index, 1);
    
    setTemplate({
      ...template,
      fields: newFields
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form
    const errors: {[key: string]: string} = {};
    
    if (!template.name.trim()) {
      errors.name = 'Register name is required';
    }
    
    if (!template.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!template.slug.trim()) {
      errors.slug = 'Slug is required';
    }
    
    if (template.fields.length === 0) {
      errors.fields = 'At least one field is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit the form
    try {
      setSubmitting(true);
      
      // Update the template in Firestore
      await updateDoc(doc(db, 'registerTemplates', templateId), template);
      
      // Redirect to the register management page
      router.push('/admin/register-management');
      
    } catch (error) {
      console.error('Error updating register template:', error);
      setFormErrors({submit: 'An error occurred while updating the register template'});
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PagePermissionWrapper pageId="admin-register-management">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-8">
            <svg className="animate-spin h-8 w-8 mx-auto text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading register template...</p>
          </div>
        </div>
      </PagePermissionWrapper>
    );
  }

  return (
    <PagePermissionWrapper pageId="admin-register-management">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Edit Register Template</h1>
          <Link
            href="/admin/register-management"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors duration-200"
          >
            Back to Register Management
          </Link>
        </div>

        {formErrors.general && (
          <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-6">
            {formErrors.general}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Template Information */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Register Name*
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={e => setTemplate({...template, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    placeholder="e.g., Vehicle Inspection Register"
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description*
                  </label>
                  <textarea
                    value={template.description}
                    onChange={e => setTemplate({...template, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    rows={3}
                    placeholder="Describe the purpose of this register"
                  />
                  {formErrors.description && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.description}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug (URL Path)*
                  </label>
                  <input
                    type="text"
                    value={template.slug}
                    onChange={e => setTemplate({...template, slug: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    placeholder="e.g., vehicle-inspection"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    This will be used in the URL: /register/{template.slug || 'example-slug'}
                  </p>
                  {formErrors.slug && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.slug}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={template.isActive}
                    onChange={e => setTemplate({...template, isActive: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Active (available for use)
                  </label>
                </div>
              </div>
            </Card>

            {/* Field Configuration */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Add New Field</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={currentField.name}
                    onChange={e => setCurrentField({...currentField, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    placeholder="e.g., Vehicle Number"
                  />
                  {formErrors.fieldName && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.fieldName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Field Type
                  </label>
                  <select
                    value={currentField.type}
                    onChange={e => setCurrentField({...currentField, type: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                  >
                    {fieldTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="required"
                    checked={currentField.required}
                    onChange={e => setCurrentField({...currentField, required: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="required" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Required Field
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Placeholder Text
                  </label>
                  <input
                    type="text"
                    value={currentField.placeholder || ''}
                    onChange={e => setCurrentField({...currentField, placeholder: e.target.value})}
                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                    placeholder="e.g., Enter vehicle number"
                  />
                </div>

                {/* Options for select fields */}
                {currentField.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Options
                    </label>
                    
                    <div className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        value={currentOption}
                        onChange={e => setCurrentOption(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                        placeholder="Add an option"
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                      />
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
                      >
                        Add
                      </button>
                    </div>
                    
                    {formErrors.options && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.options}</p>
                    )}
                    
                    {currentField.options && currentField.options.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {currentField.options.map((option, index) => (
                          <li key={index} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                            <span>{option}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(index)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              &times;
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No options added yet</p>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200"
                  >
                    Add Field
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Fields Preview */}
          <Card className="p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Current Fields</h2>
            
            {formErrors.fields && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">{formErrors.fields}</p>
            )}
            
            {template.fields.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No fields added yet. Add fields using the form above.</p>
            ) : (
              <div className="border rounded-md dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Field Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Required
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {template.fields.map((field, index) => (
                      <tr key={field.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {field.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {fieldTypes.find(t => t.id === field.type)?.name || field.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {field.required ? 'Yes' : 'No'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            type="button"
                            onClick={() => handleRemoveField(index)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Submit Button */}
          <div className="mt-6 flex justify-end">
            {formErrors.submit && (
              <p className="mr-4 text-sm text-red-600 dark:text-red-400 self-center">{formErrors.submit}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 ${
                submitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {submitting ? 'Saving...' : 'Save Register Template'}
            </button>
          </div>
        </form>
      </div>
    </PagePermissionWrapper>
  );
} 