export interface HelpContent {
  title: string;
  sections: {
    heading: string;
    content: string;
  }[];
}

export const transporterHelp: HelpContent = {
  title: "Transporter Module Help",
  sections: [
    {
      heading: "Overview",
      content: "The Transporter Dashboard allows you to manage all your truck scheduling activities. From this page, you can schedule new trucks, view existing schedules, update truck details, and cancel or reschedule trucks as needed."
    },
    {
      heading: "Scheduling a New Truck",
      content: "To schedule a new truck:\n\n1. Click the 'Schedule New Truck' button in the top-right corner\n2. Fill in all required details including truck number, driver information, and scheduled arrival time\n3. Select the appropriate material type and quantity\n4. Click 'Submit' to complete the scheduling process\n\nOnce scheduled, the truck will appear in your list and be visible to gate guards upon arrival."
    },
    {
      heading: "Managing Existing Schedules",
      content: "For each scheduled truck, you can:\n\n- View current status and location within the facility\n- Update truck details if needed (before arrival)\n- Reschedule the truck if it cannot arrive at the originally scheduled time\n- Cancel the schedule if the truck will not be coming\n\nAll actions are tracked in the system audit log for accountability and transparency."
    },
    {
      heading: "Status Explanations",
      content: "Truck statuses and their meanings:\n\n• Scheduled: Truck is scheduled but has not yet arrived\n• At Gate: Truck has arrived and is being processed by gate guards\n• At Weighbridge (In): Truck is getting its inbound weight measured\n• At Dock: Truck is at the loading/unloading dock\n• At Weighbridge (Out): Truck is getting its outbound weight measured\n• Completed: Truck has completed the entire process\n• Cancelled: Schedule was cancelled"
    },
    {
      heading: "Troubleshooting",
      content: "Common issues:\n\n• If a scheduled truck doesn't appear in your list, try refreshing the page\n• If you cannot update a truck's details, it may have already arrived at the facility\n• If you need to make changes to a truck that has already started processing, please contact facility management\n\nFor additional help, contact system support at support@lpms.example.com"
    }
  ]
};

export const gateGuardHelp: HelpContent = {
  title: "Gate Guard Module Help",
  sections: [
    {
      heading: "Overview",
      content: "The Gate Guard module helps you manage and process trucks arriving at the facility. You can verify truck details, check scheduled appointments, and authorize entry."
    },
    {
      heading: "Coming Soon",
      content: "Detailed help content for this module is coming soon."
    }
  ]
};

export const weighbridgeHelp: HelpContent = {
  title: "Weighbridge Module Help",
  sections: [
    {
      heading: "Overview",
      content: "The Weighbridge module allows you to record truck weights at entry and exit, calculate net weights, and manage the weighing process."
    },
    {
      heading: "Coming Soon",
      content: "Detailed help content for this module is coming soon."
    }
  ]
};

export const dockOperationsHelp: HelpContent = {
  title: "Dock Operations Module Help",
  sections: [
    {
      heading: "Overview",
      content: "The Dock Operations module helps you manage loading and unloading activities at dock stations, track progress, and optimize dock usage."
    },
    {
      heading: "Coming Soon",
      content: "Detailed help content for this module is coming soon."
    }
  ]
}; 