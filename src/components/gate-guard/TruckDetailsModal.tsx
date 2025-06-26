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
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Vehicle Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Vehicle Number</label>
                  <p className="text-sm sm:text-base font-medium dark:text-white">{truck.vehicleNumber}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Driver Name</label>
                  <p className="text-sm sm:text-base font-medium dark:text-white">{truck.driverName}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Mobile Number</label>
                  <p className="text-sm sm:text-base font-medium dark:text-white">{truck.mobileNumber}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">License Number</label>
                  <p className="text-sm sm:text-base font-medium dark:text-white">{truck.licenseNumber}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white mt-4 md:mt-0">Trip Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Transporter</label>
                  <p className="text-sm sm:text-base font-medium dark:text-white">{truck.transporterName}</p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Reporting Date & Time</label>
                  <p className="text-sm sm:text-base font-medium dark:text-white">
                    {formatDate(truck.reportingDate)} {formatTime(truck.reportingTime)}
                  </p>
                </div>
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Gate</label>
                  <p className="text-sm sm:text-base font-medium dark:text-white">{truck.gate}</p>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Processing Information</h3>
              <div className="grid grid-cols-1 gap-4 bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                {/* Processing Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {truck.processedAt && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Processed On</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">{formatDateTime(truck.processedAt)}</p>
                    </div>
                  )}
                  {truck.processedBy && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Processed By</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">{truck.processedBy}</p>
                    </div>
                  )}
                </div>

                {/* Location History */}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4 mt-2">
                  <h4 className="text-sm sm:text-md font-semibold mb-2 sm:mb-3 dark:text-white">Location Information</h4>
                  <div className="space-y-3">
                    {/* Source Location */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Source Location</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">
                        {truck.sourceLocation || 'Not specified'}
                      </p>
                    </div>

                    {/* Current Location */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Current Location</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">
                        {getLocationLabel(truck.currentLocation || '')}
                        {truck.locationUpdatedAt && (
                          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 block sm:inline sm:ml-2">
                            (Updated at {formatDateTime(truck.locationUpdatedAt)})
                          </span>
                        )}
                      </p>
                      {truck.locationNotes && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1 bg-gray-100 dark:bg-gray-600 p-2 rounded">
                          Note: {truck.locationNotes}
                        </p>
                      )}
                    </div>

                    {/* Previous Location */}
                    {truck.previousLocation && (
                      <div>
                        <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Previous Location</label>
                        <p className="text-sm sm:text-base font-medium dark:text-white">
                          {getLocationLabel(truck.previousLocation)}
                          {truck.previousLocationUpdatedAt && (
                            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 block sm:inline sm:ml-2">
                              (Updated at {formatDateTime(truck.previousLocationUpdatedAt)})
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Destination */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Destination</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">
                        {truck.destination || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Information Section */}
            {(truck.approvalStatus || truck.approvalRequestedAt) && (
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 dark:text-white">Approval Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg">
                  {truck.approvalRequestedAt && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Approval Requested On</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">{formatDateTime(truck.approvalRequestedAt)}</p>
                    </div>
                  )}
                  {truck.approvalRequestedBy && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Requested By</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">{truck.approvalRequestedBy}</p>
                    </div>
                  )}
                  {truck.approvalStatus && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Approval Status</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white capitalize">{truck.approvalStatus}</p>
                    </div>
                  )}
                  {truck.approvalProcessedAt && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Approval Processed On</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">{formatDateTime(truck.approvalProcessedAt)}</p>
                    </div>
                  )}
                  {truck.approvalProcessedBy && (
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Approved/Rejected By</label>
                      <p className="text-sm sm:text-base font-medium dark:text-white">{truck.approvalProcessedBy}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {truck.approvalNotes && (
              <div className="col-span-1 md:col-span-2">
                <h3 className="text-base sm:text-lg font-semibold mb-2 dark:text-white">Approval Notes</h3>
                <p className="text-sm sm:text-base dark:text-gray-300 bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
                  {truck.approvalNotes}
                </p>
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