'use client';

interface TruckDetailsViewProps {
  details: {
    [key: string]: any;
  };
}

export default function TruckDetailsView({ details }: TruckDetailsViewProps) {
  // Extract the relevant data from details object
  const scheduledData = details.scheduledData || details.updatedFields || details.newScheduleData || details;
  
  // Define groups of related fields for better organization
  const fieldGroups = [
    {
      title: "Vehicle Information",
      fields: [
        { key: "vehicleNumber", label: "Vehicle Number" },
        { key: "loadingCapacity", label: "Loading Capacity" },
        { key: "rtoPassingCapacity", label: "RTO Passing Capacity" },
      ]
    },
    {
      title: "Documents",
      fields: [
        { key: "rcNumber", label: "RC Number" },
        { key: "rcValidityDate", label: "RC Validity Date" },
        { key: "insuranceNumber", label: "Insurance Number" },
        { key: "insuranceValidityDate", label: "Insurance Validity Date" },
        { key: "pollutionNumber", label: "Pollution Number" },
        { key: "pollutionValidityDate", label: "Pollution Validity Date" },
        { key: "lrNumber", label: "LR Number" },
      ]
    },
    {
      title: "Driver Information",
      fields: [
        { key: "driverName", label: "Driver Name" },
        { key: "licenseNumber", label: "License Number" },
        { key: "dlValidityDate", label: "DL Validity Date" },
        { key: "mobileNumber", label: "Mobile Number" },
      ]
    },
    {
      title: "Scheduling Information",
      fields: [
        { key: "reportingDate", label: "Reporting Date" },
        { key: "reportingTime", label: "Reporting Time" },
        { key: "gate", label: "Gate" },
        { key: "transporterName", label: "Transporter Name" },
        { key: "supplierName", label: "Supplier Name" },
        { key: "depotName", label: "Depot Name" },
      ]
    }
  ];

  const getStatusStyles = (value: string) => {
    // If the value is a date, check if it's valid and not expired
    if (value && (value.includes('-') || value.includes('/'))) {
      try {
        const dateValue = new Date(value);
        const today = new Date();
        
        if (dateValue < today) {
          return "text-red-600 dark:text-red-400 font-medium";
        } else if (dateValue < new Date(today.setMonth(today.getMonth() + 1))) {
          return "text-amber-600 dark:text-amber-400 font-medium";
        } else {
          return "text-green-600 dark:text-green-400 font-medium";
        }
      } catch (e) {
        // If date parsing fails, just return default styling
        return "";
      }
    }
    
    return "";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 p-2 sm:p-4">
        {fieldGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4">
            <h3 className="text-sm sm:text-md font-semibold text-gray-800 dark:text-gray-200 mb-2 sm:mb-3 pb-1 sm:pb-2 border-b border-gray-200 dark:border-gray-700">
              {group.title}
            </h3>
            <dl className="grid grid-cols-1 gap-1 sm:gap-2">
              {group.fields.map((field, fieldIndex) => {
                const value = scheduledData[field.key];
                return value ? (
                  <div key={fieldIndex} className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-1">
                    <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                      {field.label}:
                    </dt>
                    <dd className={`text-xs sm:text-sm sm:ml-2 sm:text-right ${getStatusStyles(value)}`}>
                      {value}
                    </dd>
                  </div>
                ) : null;
              })}
            </dl>
          </div>
        ))}
      </div>
      
      {/* Display any additional fields that weren't in our predefined groups */}
      {Object.keys(scheduledData).some(key => 
        !fieldGroups.flatMap(g => g.fields.map(f => f.key)).includes(key)
      ) && (
        <div className="mt-3 sm:mt-4 px-3 sm:px-4 pb-3 sm:pb-4">
          <h3 className="text-sm sm:text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Additional Information
          </h3>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-1 sm:gap-2">
            {Object.entries(scheduledData)
              .filter(([key]) => !fieldGroups.flatMap(g => g.fields.map(f => f.key)).includes(key))
              .map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:justify-between sm:items-start py-1">
                  <dt className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">
                    {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                  </dt>
                  <dd className="text-xs sm:text-sm sm:ml-2 sm:text-right text-gray-900 dark:text-gray-300">
                    {String(value)}
                  </dd>
                </div>
              ))}
          </dl>
        </div>
      )}
    </div>
  );
} 