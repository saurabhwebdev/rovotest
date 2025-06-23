'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import DockOperationsList from '@/components/dock-operations/DockOperationsList';
import NewDockOperationModal from '@/components/dock-operations/NewDockOperationModal';
import HelpIcon from '@/components/ui/HelpIcon';
import { dockOperationsHelp } from '@/lib/helpContent';

export default function DockOperationsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">Dock Operations</h1>
          <HelpIcon moduleHelp={dockOperationsHelp} />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          New Dock Operation
        </button>
      </div>

      <DockOperationsList />
      
      <NewDockOperationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
} 