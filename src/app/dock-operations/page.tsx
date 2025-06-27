'use client';

import { useState } from 'react';
import DockOperationsList from '@/components/dock-operations/DockOperationsList';
import DockStatusOverview from '@/components/dock-operations/DockStatusOverview';
import NewDockOperationModal from '@/components/dock-operations/NewDockOperationModal';
import HelpIcon from '@/components/ui/HelpIcon';
import { dockOperationsHelp } from '@/lib/helpContent';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';
import Link from 'next/link';
import { History } from 'lucide-react';

export default function DockOperationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <PagePermissionWrapper pageId="dock-operations">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Dock Operations</h1>
            <HelpIcon moduleHelp={dockOperationsHelp} />
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/admin/dock-operations-history"
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              <History className="h-5 w-5 mr-2" />
              View History
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              New Dock Operation
            </button>
          </div>
        </div>

        <DockStatusOverview />
        <DockOperationsList />
        
        <NewDockOperationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    </PagePermissionWrapper>
  );
} 