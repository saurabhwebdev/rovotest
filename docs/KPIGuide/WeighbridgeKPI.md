# Weighbridge Module Documentation

## Overview
The Weighbridge module is a critical component of the logistics management system that handles truck weighing operations, movement tracking, and dock assignments. It ensures accurate weight measurements and maintains a complete audit trail of all operations.

## Core Features

### 1. Truck Entry Management
- Records truck details including truck number and transporter name
- Tracks entry timestamps
- Manages truck status throughout the weighing process

### 2. Weight Management
- **Gross Weight**: Total weight of loaded truck
- **Tare Weight**: Empty truck weight
- **Net Weight**: Calculated material weight (Gross - Tare)

### 3. Milestone Tracking
The module tracks trucks through various milestones:
- `PENDING_WEIGHING`: Initial state when truck arrives
- `WEIGHED`: After weight measurement completion
- `AT_PARKING`: When truck is directed to parking area
- `AT_DOCK`: When truck is assigned to a specific dock

### 4. Status Management
- Pending Approval
- Weighing Rejected
- Active Status based on current milestone

### 5. Dock Management
- Integration with dock system
- Dock assignment capabilities
- Dock capacity tracking
- Support for different dock types (LOADING/UNLOADING/BOTH)

### 6. Audit Trail
Comprehensive audit logging for:
- Weight measurements
- Status changes
- Location changes
- Dock assignments
- User actions

## Process Flow

1. **Truck Entry**
   - Truck arrives at weighbridge
   - Initial entry created with PENDING_WEIGHING status

2. **Weighing Process**
   - Weight measurement recorded
   - Status updated to WEIGHED
   - Audit entry created

3. **Post-Weighing Movement**
   - Option to move to parking area
   - Option to assign directly to dock
   - Location tracking updated
   - Plant tracking system updated

4. **Dock Assignment**
   - Dock selection based on availability
   - Truck status updated
   - Location and tracking information updated

## Key Performance Indicators (KPIs)

### 1. Operational Efficiency
- Average weighing time per truck
- Time between entry and dock assignment
- Weighbridge utilization rate
- Number of trucks processed per shift

### 2. Accuracy and Compliance
- Weight measurement accuracy
- Rejected weighing percentage
- Compliance with standard operating procedures
- Audit trail completeness

### 3. Dock Utilization
- Dock assignment efficiency
- Average waiting time for dock assignment
- Dock utilization patterns
- Peak hour performance

### 4. Process Bottlenecks
- Queue length at weighbridge
- Parking area utilization
- Time spent in each milestone
- Rejection rate analysis

### 5. Transporter Performance
- Average processing time by transporter
- Compliance rate by transporter
- Frequency of visits
- Weight variance analysis

## Data Structure

### WeighbridgeEntry
```typescript
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
}
```

### Dock
```typescript
interface Dock {
  id: string;
  name: string;
  type: 'LOADING' | 'UNLOADING' | 'BOTH';
  isActive: boolean;
  capacity: number;
  location: string;
}
```

## Best Practices

1. **Weight Measurement**
   - Always verify weight sensors calibration
   - Double-check measurements for accuracy
   - Document any anomalies

2. **Dock Assignment**
   - Consider dock type compatibility
   - Check dock capacity before assignment
   - Maintain optimal flow between weighbridge and docks

3. **Audit Trail**
   - Maintain detailed logs of all operations
   - Include user information for accountability
   - Record timestamps for all actions

4. **Error Handling**
   - Clear documentation of rejection reasons
   - Proper error messages for users
   - Recovery procedures for common issues 