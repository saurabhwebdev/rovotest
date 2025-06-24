'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Page {
  id: string;
  name: string;
  path: string;
}

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => Promise<void>;
  roleName: string;
  setRoleName: (name: string) => void;
  roleDescription: string;
  setRoleDescription: (description: string) => void;
  selectedPermissions: string[];
  setSelectedPermissions: (permissions: string[]) => void;
  pages: Page[];
  isEditing: boolean;
}

export default function RoleModal({
  isOpen,
  onClose,
  onSubmit,
  roleName,
  setRoleName,
  roleDescription,
  setRoleDescription,
  selectedPermissions,
  setSelectedPermissions,
  pages,
  isEditing
}: RoleModalProps) {
  const togglePermission = (pageId: string) => {
    if (selectedPermissions.includes(pageId)) {
      setSelectedPermissions(selectedPermissions.filter(id => id !== pageId));
    } else {
      setSelectedPermissions([...selectedPermissions, pageId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Role' : 'Create New Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role Name
                </label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter role name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Enter role description"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Permissions (Select pages this role can access)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border border-gray-200 dark:border-gray-700 rounded-md p-4 max-h-[40vh] overflow-y-auto">
                  {pages.map((page) => (
                    <div key={page.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`page-${page.id}`}
                        checked={selectedPermissions.includes(page.id)}
                        onChange={() => togglePermission(page.id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor={`page-${page.id}`}
                        className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
                      >
                        {page.name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            >
              {isEditing ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 