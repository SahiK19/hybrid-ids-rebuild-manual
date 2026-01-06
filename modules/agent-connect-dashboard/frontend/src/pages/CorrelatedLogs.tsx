import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { LogsTable } from '@/components/dashboard/LogsTable';
import { useCorrelatedEvents } from '@/hooks/use-correlated-events';

const CorrelatedLogs = () => {
  const { correlatedLogs, isLoading, error } = useCorrelatedEvents();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">Loading correlated attacks...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Correlated Security Events</h1>
            <p className="text-gray-600 mt-1">
              {correlatedLogs.length === 0 ? 'No correlated attacks detected' : `Showing ${correlatedLogs.length} correlated attacks`}
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            Error: {error}
          </div>
        )}

        {correlatedLogs.length === 0 && !isLoading ? (
          <div className="text-center py-12">
            <div className="bg-green-50 border border-green-200 rounded-lg p-8">
              <p className="text-green-700 text-lg font-medium">No correlated events found</p>
              <p className="text-green-600 text-sm mt-2">Your system is secure</p>
            </div>
          </div>
        ) : (
          <LogsTable logs={correlatedLogs || []} />
        )}
      </div>
    </DashboardLayout>
  );
};

export default CorrelatedLogs;