'use client';

import { useParams } from 'next/navigation';
import DynamicRegister from '@/components/registers/DynamicRegister';
import { useAuth } from '@/contexts/AuthContext';
import PagePermissionWrapper from '@/components/PagePermissionWrapper';

export default function RegisterPage() {
  const params = useParams();
  const { hasPermission } = useAuth();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;

  return (
    <PagePermissionWrapper pageId="register-detail">
      <div>
        <DynamicRegister slug={slug} />
      </div>
    </PagePermissionWrapper>
  );
} 