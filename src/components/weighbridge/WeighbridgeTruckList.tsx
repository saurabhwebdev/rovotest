'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, where, Timestamp, addDoc } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import WeighingModal from './WeighingModal';
import NextMilestoneModal from './NextMilestoneModal';
import { updateTruckLocationAndStatus } from '@/lib/firestore';
import { Input } from '@/components/ui/input';

interface WeighbridgeEntry {
  id: string;
  truckNumber: string;
  transporterName: string;
  status: string;
  inTime: Timestamp;
  grossWeight?: number;
  tareWeight?: number;
  netWeight?: number;
  weighingTime?: Timestamp;
  currentMilestone: 'PENDING_WEIGHING' | 'WEIGHED' | 'AT_PARKING' | 'AT_DOCK';
  dockId?: string;
  dockName?: string;
  rejectionRemarks?: string;
  materialType?: string;
  orderNumber?: string;
}

interface Dock {
  id: string;
  name: string;
  type: 'LOADING' | 'UNLOADING' | 'BOTH';
  isActive: boolean;
  capacity: number;
  location: string;
}

export default function WeighbridgeTruckList() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WeighbridgeEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<WeighbridgeEntry | null>(null);
  const [isWeighingModalOpen, setIsWeighingModalOpen] = useState(false);
  const [isNextMilestoneModalOpen, setIsNextMilestoneModalOpen] = useState(false);
  const [docks, setDocks] = useState<Dock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printEntryId, setPrintEntryId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
    fetchDocks();
  }, []);

  const fetchDocks = async () => {
    try {
      const docksQuery = query(
        collection(db, 'docks'),
        where('isActive', '==', true)
      );
      const docksSnapshot = await getDocs(docksQuery);
      const docksData = docksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Dock));
      setDocks(docksData);
    } catch (error) {
      console.error('Error fetching docks:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const entriesQuery = query(
        collection(db, 'weighbridgeEntries'),
        orderBy('inTime', 'desc')
      );
      const snapshot = await getDocs(entriesQuery);
      console.log('Total weighbridge entries found:', snapshot.docs.length);
      
      const entriesData = snapshot.docs
        .map(doc => {
          const data = doc.data();
          console.log('Entry data:', data);
          return {
            id: doc.id,
            ...data
          } as WeighbridgeEntry;
        })
        .filter(entry => {
          const milestone = entry.currentMilestone?.toUpperCase?.() || '';
          return milestone === 'PENDING_WEIGHING' || 
                 milestone === 'WEIGHED' || 
                 milestone === 'AT_PARKING' || 
                 milestone === 'AT_DOCK';
        });
      
      console.log('Filtered weighbridge entries:', entriesData.length);
      console.log('Entry milestones:', entriesData.map(e => e.currentMilestone));
      
      setEntries(entriesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setLoading(false);
    }
  };

  // Create audit entry function
  const createAuditEntry = async (entry: WeighbridgeEntry, action: string, details: any) => {
    try {
      await addDoc(collection(db, 'weighbridgeAudit'), {
        truckNumber: entry.truckNumber,
        transporterName: entry.transporterName,
        action: action,
        timestamp: Timestamp.now(),
        performedBy: user?.uid || 'unknown',
        performedByName: user?.displayName || 'Unknown User',
        details: details
      });
    } catch (error) {
      console.error('Error creating audit entry:', error);
    }
  };

  const handleWeigh = (entry: WeighbridgeEntry) => {
    setSelectedEntry(entry);
    setIsWeighingModalOpen(true);
  };

  const handleOpenNextMilestoneModal = (entry: WeighbridgeEntry) => {
    setSelectedEntry(entry);
    setIsNextMilestoneModalOpen(true);
  };

  const handleMoveToPark = async (entry: WeighbridgeEntry) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Find the truck document
      const trucksQuery = query(
        collection(db, 'trucks'),
        where('vehicleNumber', '==', entry.truckNumber)
      );
      const truckSnapshot = await getDocs(trucksQuery);
      
      if (!truckSnapshot.empty) {
        const truckDoc = truckSnapshot.docs[0];
        await updateTruckLocationAndStatus(
          truckDoc.id,
          'Parking Area',
          'at_parking',
          user.uid,
          {
            weighbridgeId: entry.id
          }
        );
      }

      // Create audit entry
      await createAuditEntry(entry, 'MOVED_TO_PARKING', {
        milestone: 'AT_PARKING',
        grossWeight: entry.grossWeight,
        tareWeight: entry.tareWeight,
        netWeight: entry.netWeight
      });

      fetchEntries();
    } catch (error) {
      console.error('Error moving to parking:', error);
    }
  };

  const handleMoveToDock = async (entry: WeighbridgeEntry, selectedDockId: string) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const selectedDock = docks.find(d => d.id === selectedDockId);
      if (!selectedDock) return;

      // Find the truck document
      const trucksQuery = query(
        collection(db, 'trucks'),
        where('vehicleNumber', '==', entry.truckNumber)
      );
      const truckSnapshot = await getDocs(trucksQuery);
      
      if (!truckSnapshot.empty) {
        const truckDoc = truckSnapshot.docs[0];
        await updateTruckLocationAndStatus(
          truckDoc.id,
          selectedDock.name,
          'at_dock',
          user.uid,
          {
            dockId: selectedDockId,
            dockName: selectedDock.name,
            weighbridgeId: entry.id
          }
        );
      }

      // Create audit entry
      await createAuditEntry(entry, 'ASSIGNED_TO_DOCK', {
        milestone: 'AT_DOCK',
        dockName: selectedDock.name,
        grossWeight: entry.grossWeight,
        tareWeight: entry.tareWeight,
        netWeight: entry.netWeight
      });

      fetchEntries();
    } catch (error) {
      console.error('Error moving to dock:', error);
    }
  };

  // Function to handle printing weight slip
  const handlePrintWeightSlip = (entry: WeighbridgeEntry) => {
    setSelectedEntry(entry);
    setPrintEntryId(entry.id);
    setShowPrintModal(true);
  };

  // Function to actually print the weight slip
  const printWeightSlip = () => {
    if (!selectedEntry) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups for this website to print weight slips.');
      return;
    }
    
    // Generate the content for the print window
    const printContent = `
      <html>
        <head>
          <title>Weight Slip - ${selectedEntry.truckNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              margin: 0;
              padding: 20px;
            }
            .weight-slip {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ccc;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0 0;
              font-size: 14px;
            }
            .slip-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 20px;
            }
            .slip-info div {
              margin-bottom: 10px;
            }
            .slip-info label {
              font-weight: bold;
              display: block;
              font-size: 14px;
              color: #555;
            }
            .slip-info span {
              font-size: 16px;
            }
            .weights {
              border-top: 1px solid #eee;
              border-bottom: 1px solid #eee;
              padding: 15px 0;
              margin-bottom: 20px;
            }
            .weight-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .weight-row label {
              font-weight: bold;
            }
            .weight-row.net {
              font-size: 18px;
              font-weight: bold;
              border-top: 1px dashed #ccc;
              padding-top: 10px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
            .signature {
              width: 45%;
            }
            .signature p {
              margin-top: 50px;
              border-top: 1px solid #333;
              padding-top: 5px;
              text-align: center;
            }
            @media print {
              body {
                padding: 0;
              }
              .weight-slip {
                border: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="weight-slip">
            <div class="header">
              <h1>WEIGHT SLIP</h1>
              <p>Weighbridge Measurement Certificate</p>
            </div>
            
            <div class="slip-info">
              <div>
                <label>Truck Number</label>
                <span>${selectedEntry.truckNumber}</span>
              </div>
              <div>
                <label>Transporter</label>
                <span>${selectedEntry.transporterName}</span>
              </div>
              <div>
                <label>Date</label>
                <span>${selectedEntry.weighingTime?.toDate().toLocaleDateString() || new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <label>Time</label>
                <span>${selectedEntry.weighingTime?.toDate().toLocaleTimeString() || new Date().toLocaleTimeString()}</span>
              </div>
              <div>
                <label>Slip No.</label>
                <span>WB-${selectedEntry.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div>
                <label>Material Type</label>
                <span>${selectedEntry.materialType || 'N/A'}</span>
              </div>
            </div>
            
            <div class="weights">
              <div class="weight-row">
                <label>Gross Weight</label>
                <span>${selectedEntry.grossWeight} kg</span>
              </div>
              <div class="weight-row">
                <label>Tare Weight</label>
                <span>${selectedEntry.tareWeight} kg</span>
              </div>
              <div class="weight-row net">
                <label>NET WEIGHT</label>
                <span>${selectedEntry.netWeight} kg</span>
              </div>
            </div>
            
            <div class="footer">
              <div class="signature">
                <p>Weighbridge Operator</p>
              </div>
              <div class="signature">
                <p>Driver's Signature</p>
              </div>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
              <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
                Print Weight Slip
              </button>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Write content to the new window, then print
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Create audit trail entry for printing
    createAuditEntry(selectedEntry, 'PRINTED_WEIGHT_SLIP', {
      milestone: selectedEntry.currentMilestone,
      printedAt: new Date().toISOString(),
      printedBy: user?.displayName || user?.email || 'Unknown User'
    });
    
    // Close the modal
    setShowPrintModal(false);
    setSelectedEntry(null);
    setPrintEntryId(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry => 
    entry.truckNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.transporterName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="overflow-x-auto">
      <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-64">
            <Input
              type="text"
              placeholder="Search trucks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <svg
              className="absolute right-2 top-2.5 h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              ></path>
            </svg>
          </div>
          
          <button 
            className="ml-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded border border-gray-300 dark:border-gray-600"
            title="Refresh List"
            onClick={fetchEntries}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <table className="min-w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Truck Number</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Transporter</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Date</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Time</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Gross Weight</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Tare Weight</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Net Weight</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 cursor-pointer" onClick={() => {}}>
              <div className="flex items-center">
                <span>Status</span>
              </div>
            </th>
            <th className="px-2 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredEntries.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-2 py-1.5 whitespace-nowrap text-xs font-medium">
                {entry.truckNumber}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.transporterName}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.inTime.toDate().toLocaleDateString()}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.inTime.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.grossWeight ? `${entry.grossWeight} kg` : '-'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.tareWeight ? `${entry.tareWeight} kg` : '-'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                {entry.netWeight ? `${entry.netWeight} kg` : '-'}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  entry.currentMilestone === 'PENDING_WEIGHING' && entry.status === 'PENDING_APPROVAL' ? 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100' :
                  entry.currentMilestone === 'PENDING_WEIGHING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                  entry.currentMilestone === 'WEIGHED' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                  entry.currentMilestone === 'AT_PARKING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                  'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100'
                }`}>
                  {entry.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : entry.currentMilestone.replace('_', ' ')}
                </span>
                {entry.status === 'WEIGHING_REJECTED' && (
                  <div className="mt-1">
                    <span className="text-xs text-red-600 dark:text-red-400">
                      Rejected
                    </span>
                  </div>
                )}
              </td>
              <td className="px-2 py-1.5 whitespace-nowrap text-xs">
                <div className="flex space-x-1">
                  {entry.currentMilestone === 'PENDING_WEIGHING' && entry.status !== 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => handleWeigh(entry)}
                      className="text-gray-500 hover:text-indigo-600 focus:outline-none"
                      title="Weigh Truck"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                    </button>
                  )}
                  
                  {entry.status === 'PENDING_APPROVAL' && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      Awaiting
                    </span>
                  )}
                  
                  {(entry.currentMilestone === 'WEIGHED' || entry.currentMilestone === 'AT_PARKING') && (
                    <button
                      onClick={() => handleOpenNextMilestoneModal(entry)}
                      className="text-gray-500 hover:text-blue-600 focus:outline-none"
                      title="Next Action"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Print Weight Slip Button - only enabled for weighed entries with valid weights */}
                  {entry.grossWeight && entry.tareWeight && entry.netWeight && 
                   entry.status !== 'PENDING_APPROVAL' && 
                   (entry.currentMilestone === 'WEIGHED' || 
                    entry.currentMilestone === 'AT_PARKING' || 
                    entry.currentMilestone === 'AT_DOCK') && (
                    <button
                      onClick={() => handlePrintWeightSlip(entry)}
                      className="text-gray-500 hover:text-green-600 focus:outline-none ml-1"
                      title="Print Weight Slip"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {filteredEntries.length === 0 && (
        <div className="text-center py-10">
          <h3 className="text-lg font-medium text-gray-500">No trucks found</h3>
          <p className="mt-2 text-gray-400">Try adjusting your search criteria.</p>
        </div>
      )}

      {isWeighingModalOpen && selectedEntry && (
        <WeighingModal
          isOpen={isWeighingModalOpen}
          onClose={() => {
            setIsWeighingModalOpen(false);
            setSelectedEntry(null);
            fetchEntries();
          }}
          entry={selectedEntry}
          onWeighingComplete={(weightDetails) => {
            if (selectedEntry) {
              createAuditEntry(selectedEntry, 'WEIGHED', {
                milestone: 'WEIGHED',
                ...weightDetails
              });
            }
          }}
        />
      )}

      {isNextMilestoneModalOpen && selectedEntry && (
        <NextMilestoneModal
          isOpen={isNextMilestoneModalOpen}
          onClose={() => {
            setIsNextMilestoneModalOpen(false);
            setSelectedEntry(null);
            fetchEntries();
          }}
          entry={selectedEntry}
          docks={docks}
          onMoveToPark={handleMoveToPark}
          onMoveToDock={handleMoveToDock}
        />
      )}

      {/* Print Weight Slip Confirmation Modal */}
      {showPrintModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Print Weight Slip
              </h2>
              <button
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedEntry(null);
                }}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="py-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to print the weight slip for truck <span className="font-semibold">{selectedEntry.truckNumber}</span>?
              </p>
              
              <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Gross Weight:</span>
                    <span className="ml-2 font-medium">{selectedEntry.grossWeight} kg</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Tare Weight:</span>
                    <span className="ml-2 font-medium">{selectedEntry.tareWeight} kg</span>
                  </div>
                  <div className="col-span-2 pt-2 mt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="text-gray-500 dark:text-gray-400">Net Weight:</span>
                    <span className="ml-2 font-semibold">{selectedEntry.netWeight} kg</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  setShowPrintModal(false);
                  setSelectedEntry(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={printWeightSlip}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 