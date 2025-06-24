# Transporter Module KPIs

This document outlines the key performance indicators (KPIs) for the Transporter Module, organized in a parent-child hierarchy for better understanding and implementation.

## 1. Operational Efficiency (Parent KPI)
Primary metric that measures the overall efficiency of transportation operations.

### Child KPIs:
- **On-Time Performance Rate**
  - Formula: (Number of on-time arrivals / Total number of scheduled trucks) × 100
  - Target: ≥ 95%
  - Update Frequency: Daily

- **Gate Utilization Rate**
  - Formula: (Active gate hours / Total available gate hours) × 100
  - Target: ≥ 85%
  - Update Frequency: Weekly

- **Average Processing Time**
  - Formula: Average time between truck arrival and departure
  - Target: ≤ 45 minutes
  - Update Frequency: Daily

## 2. Compliance Management (Parent KPI)
Measures adherence to regulatory and documentation requirements.

### Child KPIs:
- **Documentation Compliance Rate**
  - Formula: (Number of trucks with valid documents / Total number of trucks) × 100
  - Components: License, Insurance, Pollution Certificate
  - Target: 100%
  - Update Frequency: Daily

- **Vehicle Fitness Rate**
  - Formula: (Number of trucks meeting all fitness criteria / Total number of trucks) × 100
  - Target: 100%
  - Update Frequency: Weekly

## 3. Scheduling Effectiveness (Parent KPI)
Measures the effectiveness of the truck scheduling system.

### Child KPIs:
- **Schedule Adherence Rate**
  - Formula: (Number of trucks arriving within scheduled window / Total scheduled trucks) × 100
  - Target: ≥ 90%
  - Update Frequency: Daily

- **Cancellation Rate**
  - Formula: (Number of cancelled schedules / Total scheduled trucks) × 100
  - Target: ≤ 5%
  - Update Frequency: Daily

## 4. Transporter Performance (Parent KPI)
Evaluates individual transporter performance metrics.

### Child KPIs:
- **Transporter Reliability Score**
  - Formula: Weighted average of (On-time arrivals + Documentation compliance + Cancellation rate)
  - Target: ≥ 90%
  - Update Frequency: Monthly

- **Load Optimization Rate**
  - Formula: (Actual load carried / Maximum load capacity) × 100
  - Target: ≥ 95%
  - Update Frequency: Weekly

## Implementation Priority
1. Operational Efficiency KPIs
2. Compliance Management KPIs
3. Scheduling Effectiveness KPIs
4. Transporter Performance KPIs

## Data Collection Points
- Gate entry/exit logs
- Document submission records
- Scheduling system data
- Load measurement data
- Transporter registration data

## Reporting Frequency
- Daily: Operational metrics, compliance rates
- Weekly: Utilization rates, performance trends
- Monthly: Comprehensive performance analysis

## Visualization Recommendations
- Real-time dashboards for daily KPIs
- Weekly trend charts for utilization metrics
- Monthly performance scorecards for transporters
- Compliance status heat maps

Note: All KPIs should be reviewed quarterly for relevance and target adjustments based on business needs and performance trends. 