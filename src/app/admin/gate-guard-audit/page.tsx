'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import GateGuardAuditTrail from '@/components/gate-guard/GateGuardAuditTrail';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

export default function GateGuardAuditPage() {
  const { user } = useAuth();

  return (
    <PagePermissionWrapper pageId="admin-gate-guard-audit">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Gate Guard Audit Trail</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete history of all gate guard operations
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <GateGuardAuditTrail showFullHistoryByDefault={true} />
          </div>
        </div>
      </div>
    </PagePermissionWrapper>
  );
} 