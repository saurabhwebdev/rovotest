interface TruckDetailsModalProps {
  truck: {
    id: string;
    driverName: string;
    vehicleNumber: string;
    transporterName: string;
    reportingDate: string;
    reportingTime: string;
    gate: string;
    status: string;
    createdAt: string;
    mobileNumber: string;
    licenseNumber: string;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    approvalNotes?: string;
    approvalRequestedAt?: string;
    approvalRequestedBy?: string;
    approvalProcessedAt?: string;
    approvalProcessedBy?: string;
    currentLocation?: string;
    locationUpdatedAt?: string;
    locationNotes?: string;
    processedAt?: string;
    processedBy?: string;
    sourceLocation?: string;
    previousLocation?: string;
    previousLocationUpdatedAt?: string;
    destination?: string;
  };
  onClose: () => void;
}

export default function TruckDetailsModal({ truck, onClose }: TruckDetailsModalProps) {
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${formatDate(date.toISOString())} ${formatTime(date.toLocaleTimeString())}`;
  };

  const getLocationLabel = (location: string) => {
    switch (location?.toLowerCase()) {
      case 'parking':
        return 'At Parking';
      case 'weighbridge':
        return 'At Weighbridge';
      case 'loading':
        return 'At Loading';
      case 'unloading':
        return 'At Unloading';
      case 'exit':
        return 'At Exit';
      default:
        return location || 'Unknown';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-bold dark:text-white">Truck Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7h4a1 1 0 011 1v6.05A2.5 2.5 0 0116.95 16H16a1 1 0 01-1-1v-5h-1V7z" />
                </svg>
                Vehicle Information
              </h3>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Vehicle Number</label>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.vehicleNumber}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Driver Name</label>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.driverName}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Mobile Number</label>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.mobileNumber}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">License Number</label>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.licenseNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white mt-4 md:mt-0 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Trip Information
              </h3>
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Transporter</label>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.transporterName}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Gate</label>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.gate}</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm col-span-1 sm:col-span-2">
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Reporting Date & Time</label>
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-white">
                        {formatDate(truck.reportingDate)} {formatTime(truck.reportingTime)}
                      </p>
                      {(() => {
                        // Calculate days remaining
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const reportingDate = new Date(truck.reportingDate);
                        reportingDate.setHours(0, 0, 0, 0);
                        
                        const diffTime = reportingDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        if (diffDays > 0) {
                          return (
                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                              Arriving in {diffDays} {diffDays === 1 ? 'day' : 'days'}
                            </p>
                          );
                        } else if (diffDays === 0) {
                          return (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium flex items-center">
                              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                              Arriving today
                            </p>
                          );
                        } else {
                          return (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                              Was due {Math.abs(diffDays)} {Math.abs(diffDays) === 1 ? 'day' : 'days'} ago
                            </p>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Processing Information
              </h3>
              <div className="grid grid-cols-1 gap-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 p-3 sm:p-4 rounded-lg">
                {/* Processing Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {truck.processedAt && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Processed On</label>
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{formatDateTime(truck.processedAt)}</p>
                      </div>
                    </div>
                  )}
                  {truck.processedBy && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Processed By</label>
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.processedBy}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Location History */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4 mt-2">
                  <h4 className="text-sm sm:text-md font-semibold mb-2 sm:mb-3 dark:text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Location Information
                  </h4>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3 space-y-4">
                    {/* Route Visualization */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Source</span>
                      </div>
                      
                      <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-2 relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">Destination</span>
                      </div>
                    </div>

                    {/* Source Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Source Location</label>
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {truck.sourceLocation || 'Not specified'}
                          </p>
                        </div>
                      </div>

                      {/* Current Location */}
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Current Location</label>
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white">
                              {getLocationLabel(truck.currentLocation || '')}
                            </p>
                            {truck.locationUpdatedAt && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Updated: {formatDateTime(truck.locationUpdatedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Previous Location & Destination */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Previous Location (only if available) */}
                      {truck.previousLocation && (
                        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Previous Location</label>
                          <div className="flex items-start">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                              <p className="text-sm font-medium text-gray-800 dark:text-white">
                                {getLocationLabel(truck.previousLocation)}
                              </p>
                              {truck.previousLocationUpdatedAt && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Left: {formatDateTime(truck.previousLocationUpdatedAt)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Destination */}
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Destination</label>
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600 dark:text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          <p className="text-sm font-medium text-gray-800 dark:text-white">
                            {truck.destination || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Location Notes (if available) */}
                    {truck.locationNotes && (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Location Notes</label>
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {truck.locationNotes}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Information Section */}
            {(truck.approvalStatus || truck.approvalRequestedAt) && (
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Approval Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 p-3 sm:p-4 rounded-lg">
                  {truck.approvalStatus && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm col-span-1 md:col-span-2">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Approval Status</label>
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium dark:text-white">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            truck.approvalStatus === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            truck.approvalStatus === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}>
                            {truck.approvalStatus?.toUpperCase()}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {truck.approvalRequestedAt && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Approval Requested On</label>
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{formatDateTime(truck.approvalRequestedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {truck.approvalRequestedBy && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Requested By</label>
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.approvalRequestedBy}</p>
                      </div>
                    </div>
                  )}
                  
                  {truck.approvalProcessedAt && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Approval Processed On</label>
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{formatDateTime(truck.approvalProcessedAt)}</p>
                      </div>
                    </div>
                  )}
                  
                  {truck.approvalProcessedBy && (
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Approved/Rejected By</label>
                      <div className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-800 dark:text-white">{truck.approvalProcessedBy}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {truck.approvalNotes && (
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-base sm:text-lg font-semibold mb-2 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-amber-600 dark:text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Approval Notes
                </h3>
                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-amber-100 dark:border-amber-800">
                  <div className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    <p className="text-sm text-gray-800 dark:text-gray-300">
                      {truck.approvalNotes}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 
                       text-gray-700 dark:text-gray-300 rounded-md focus:outline-none focus:ring-2 
                       focus:ring-offset-2 focus:ring-gray-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 