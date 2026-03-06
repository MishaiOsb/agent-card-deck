// ===== Section A: Universal fields for every Agent Card =====
// These are fixed across all agent types per the Agent Card Type Spec
export const SECTION_A_FIELDS = [
  { id: 'agentName', label: 'Agent Name', type: 'text', required: true, placeholder: 'e.g. Inbound Support Agent' },
  { id: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'What is this agent\'s primary objective?' },
  { id: 'agreedSteps', label: '6 Agreed Steps', type: 'steps', required: true, placeholder: 'Define the steps this agent follows...', maxSteps: 6 },
  { id: 'approvedCopy', label: 'Approved Copy', type: 'textarea', placeholder: 'Scripts, templates, and messaging this agent uses...' },
  { id: 'escalationRule', label: 'Escalation Rule', type: 'textarea', required: true, placeholder: 'When does this agent escalate to a human? e.g. After 2 failed attempts, customer asks for manager...' },
  { id: 'outOfScopeList', label: 'Out-of-Scope List', type: 'tags', placeholder: 'Items explicitly NOT handled by this agent' },
]

// ===== Section B: Type-specific parameter libraries =====
export const AGENT_TYPES = [
  {
    id: 'support',
    name: 'Support Agent',
    icon: 'support',
    color: '#6B30FF',
    description: 'Customer support, inbound/outbound call handling, ticket response',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Interactive Agent', workerVerb: 'Speak to the World' },
    sectionB: [
      { id: 'callDirection', label: 'Call Direction', type: 'select', options: ['Inbound', 'Outbound', 'Both'] },
      { id: 'greeting', label: 'Greeting Script', type: 'textarea', placeholder: 'Opening greeting when interaction begins...' },
      { id: 'qualificationCriteria', label: 'Qualification Criteria', type: 'checklist', items: ['Budget confirmed', 'Decision maker identified', 'Timeline established', 'Need identified', 'Authority verified'] },
      { id: 'channels', label: 'Communication Channels', type: 'checklist', items: ['Phone', 'Email', 'Chat', 'SMS', 'Web Form'] },
      { id: 'voicePersonality', label: 'Voice & Personality', type: 'select', options: ['Professional', 'Friendly', 'Authoritative', 'Warm & Empathetic'] },
      { id: 'language', label: 'Language(s)', type: 'tags', placeholder: 'English, Spanish, etc.' },
      { id: 'businessHours', label: 'Operating Hours', type: 'text', placeholder: 'e.g. Mon-Fri 8am-6pm EST' },
      { id: 'successMetrics', label: 'Success Metrics', type: 'metrics', defaults: [
        { name: 'Response Time', target: '<15 min', unit: 'min' },
        { name: 'Resolution Rate', target: '80%', unit: '%' },
        { name: 'Customer Satisfaction', target: '4.5/5', unit: 'rating' }
      ]},
      { id: 'integrations', label: 'Integrations', type: 'tags', placeholder: 'CRM, Helpdesk, Calendar, etc.' },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any other requirements...' },
    ]
  },
  {
    id: 'analyst',
    name: 'Analyst Agent',
    icon: 'analyst',
    color: '#0DEABA',
    description: 'Data analysis, reporting, insights generation, and revenue discovery',
    seethendo: { stage: 1, stageLabel: 'Insights', workerType: 'Analyst Agent', workerVerb: 'See What\'s Hidden' },
    sectionB: [
      { id: 'dataSources', label: 'Data Sources', type: 'tags', placeholder: 'CRM, Call logs, Sales data, etc.' },
      { id: 'analysisType', label: 'Analysis Type', type: 'checklist', items: ['Trend Analysis', 'Revenue Discovery', 'Performance Metrics', 'Customer Segmentation', 'Anomaly Detection', 'Forecasting'] },
      { id: 'reportFrequency', label: 'Report Frequency', type: 'select', options: ['Real-time', 'Daily', 'Weekly', 'Monthly', 'On-demand'] },
      { id: 'outputFormat', label: 'Output Format', type: 'checklist', items: ['Dashboard', 'PDF Report', 'Email Summary', 'Slack Notification', 'API Endpoint'] },
      { id: 'successMetrics', label: 'Success Metrics', type: 'metrics', defaults: [
        { name: 'Revenue Identified', target: '$7,700/mo', unit: '$' },
        { name: 'Report Accuracy', target: '98%', unit: '%' },
        { name: 'Insights per Week', target: '5+', unit: 'count' }
      ]},
      { id: 'recipients', label: 'Report Recipients', type: 'tags', placeholder: 'Manager, VP Sales, Operations, etc.' },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any other requirements...' },
    ]
  },
  {
    id: 'computer-use',
    name: 'Computer Use Agent',
    icon: 'computer',
    color: '#2A2092',
    description: 'Automated browser and desktop tasks, data entry, system operations',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Action Agent', workerVerb: 'Do the Work' },
    sectionB: [
      { id: 'taskType', label: 'Task Type', type: 'checklist', items: ['Data Entry', 'Form Filling', 'Web Scraping', 'File Management', 'System Navigation', 'Report Generation'] },
      { id: 'targetSystems', label: 'Target Systems', type: 'tags', placeholder: 'CRM, ERP, Web portals, etc.' },
      { id: 'frequency', label: 'Execution Frequency', type: 'select', options: ['Real-time', 'Scheduled', 'On-trigger', 'Batch'] },
      { id: 'inputData', label: 'Input Data Sources', type: 'tags', placeholder: 'Spreadsheets, APIs, Emails, etc.' },
      { id: 'outputActions', label: 'Output Actions', type: 'steps', placeholder: 'What does the agent produce or do?' },
      { id: 'errorHandling', label: 'Error Handling', type: 'textarea', placeholder: 'How should the agent handle errors or unexpected states?' },
      { id: 'successMetrics', label: 'Success Metrics', type: 'metrics', defaults: [
        { name: 'Task Completion Rate', target: '99%', unit: '%' },
        { name: 'Error Rate', target: '<1%', unit: '%' },
        { name: 'Time Saved/Week', target: '20 hrs', unit: 'hrs' }
      ]},
      { id: 'accessRequirements', label: 'Access Requirements', type: 'tags', placeholder: 'Login credentials, VPN, API keys, etc.' },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any other requirements...' },
    ]
  },
  {
    id: 'sales',
    name: 'Sales/Outreach Agent',
    icon: 'sales',
    color: '#FF6629',
    description: 'Lead nurturing, pipeline management, outbound outreach, and demo scheduling',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Interactive Agent', workerVerb: 'Speak to the World' },
    sectionB: [
      { id: 'salesStage', label: 'Pipeline Stage Focus', type: 'select', options: ['Lead Generation', 'Lead Qualification', 'Demo Scheduling', 'Follow-up', 'Closing Support'] },
      { id: 'targetAudience', label: 'Target Audience', type: 'textarea', placeholder: 'Describe the ideal customer profile' },
      { id: 'channels', label: 'Communication Channels', type: 'checklist', items: ['Phone', 'Email', 'LinkedIn', 'SMS', 'Chat'] },
      { id: 'cadence', label: 'Outreach Cadence', type: 'steps', placeholder: 'Define the outreach sequence...' },
      { id: 'objectionHandling', label: 'Common Objections', type: 'tags', placeholder: 'Price, Timing, Competition, etc.' },
      { id: 'successMetrics', label: 'Success Metrics', type: 'metrics', defaults: [
        { name: 'Lead Conversion Rate', target: '25%', unit: '%' },
        { name: 'Demos Booked/Week', target: '15', unit: 'count' },
        { name: 'Response Time', target: '<10 min', unit: 'min' }
      ]},
      { id: 'integrations', label: 'Integrations', type: 'tags', placeholder: 'CRM, Calendar, LinkedIn, etc.' },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any other requirements...' },
    ]
  },
  {
    id: 'task',
    name: 'Task/Automation Agent',
    icon: 'task',
    color: '#FFCD18',
    description: 'Workflow automation, scheduled tasks, cross-system orchestration',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Action Agent', workerVerb: 'Do the Work' },
    sectionB: [
      { id: 'triggerType', label: 'Trigger Type', type: 'select', options: ['Scheduled', 'Event-based', 'Manual', 'Webhook', 'Conditional'] },
      { id: 'triggerConditions', label: 'Trigger Conditions', type: 'steps', placeholder: 'What starts this automation?' },
      { id: 'workflowSteps', label: 'Workflow Steps', type: 'steps', placeholder: 'Define each step of the automation...' },
      { id: 'systems', label: 'Connected Systems', type: 'tags', placeholder: 'CRM, Email, Slack, Database, etc.' },
      { id: 'conditions', label: 'Conditional Logic', type: 'textarea', placeholder: 'Describe any if/then rules or branching logic' },
      { id: 'successMetrics', label: 'Success Metrics', type: 'metrics', defaults: [
        { name: 'Automation Success Rate', target: '99%', unit: '%' },
        { name: 'Tasks Automated/Day', target: '50+', unit: 'count' },
        { name: 'Time Saved/Week', target: '15 hrs', unit: 'hrs' }
      ]},
      { id: 'errorNotifications', label: 'Error Notifications', type: 'tags', placeholder: 'Email, Slack, SMS, etc.' },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Any other requirements...' },
    ]
  },
]

// ===== Revision Policy =====
export const REVISION_POLICY = {
  maxRevisions: 3,
  categories: ['Fix (In-Scope)', 'Change Request (Out-of-Scope)', 'Out-of-Type (New Card)'],
  description: 'Maximum 3 revisions per agent. Fixes for in-scope issues are covered. Change requests for new features are logged for future phases. Out-of-type requests require a new agent card.'
}

// ===== Fix vs Change Definitions =====
export const FIX_VS_CHANGE = {
  fix: {
    label: 'Fix (In-Scope)',
    description: 'The agent is not performing to the signed spec. This is a fix, not a change.',
    examples: ['Agent not following agreed steps', 'Wrong copy being used', 'Escalation rule not triggering'],
    color: '#0DEABA',
  },
  change: {
    label: 'Change Request',
    description: 'Anything not covered in the Agent Card. This is new work that needs to be assessed and scoped.',
    examples: ['New feature or capability', 'Different workflow', 'Additional integration'],
    color: '#FFCD18',
  },
  outOfType: {
    label: 'Out-of-Type',
    description: 'This requires a completely new agent card. The request falls outside the current agent type.',
    examples: ['Support agent asked to do sales', 'Analyst asked to handle calls'],
    color: '#FF6629',
  },
}

// ===== Delivery Gates =====
export const DELIVERY_GATES = [
  { id: 'spec', name: 'Spec Sign-Off', description: 'Client reviews and approves the agent card specification', icon: 'clipboard' },
  { id: 'qa', name: 'Internal QA', description: 'Team tests the agent against the signed spec', icon: 'check' },
  { id: 'delivery', name: 'Live Delivery', description: 'Synchronous call: demo live, sign off in the room', icon: 'target' },
]

// ===== Default Timeline =====
export const DEFAULT_TIMELINE = {
  phases: [
    { name: 'Specification & Sign-off', duration: '1 week' },
    { name: 'Development & Configuration', duration: '1-2 weeks' },
    { name: 'Internal QA & Testing', duration: '3-5 days' },
    { name: 'Live Delivery Call', duration: '1 session' },
    { name: 'Monitoring & Support', duration: '1 week' },
  ],
  totalEstimate: '3-5 weeks'
}

// ===== Seethendo Framework: See. Then Do. =====
export const SEETHENDO_FRAMEWORK = {
  stages: [
    {
      number: 1,
      name: 'Insights',
      verb: 'See',
      description: 'Deploy Analyst Agents first. Read-only, low-risk, no workflow changes. Make the domain visible before you try to change it.',
      color: '#0DEABA',
    },
    {
      number: 2,
      name: 'Action',
      verb: 'Do',
      description: 'Deploy Interactive and Action Agents after evidence is gathered. Act on data, not assumptions.',
      color: '#6B30FF',
    },
  ],
  dimensions: [
    { symbol: '\u00A3', name: 'Revenue', insight: 'Detect hidden revenue', action: 'Capture that revenue', color: '#0DEABA' },
    { symbol: 'C', name: 'Capacity', insight: 'Find the time sinks', action: 'Eliminate those drains', color: '#6B30FF' },
    { symbol: 'E', name: 'Experience', insight: 'Expose quality gaps', action: 'Fix the experience', color: '#FF6629' },
  ],
  dataStreams: ['Calls', 'Emails', 'Tickets', 'Meetings', 'Messaging', 'CRM & Systems'],
  workerTypes: [
    { name: 'Analyst Agent', stage: 1, verb: 'See What\'s Hidden', description: 'Read-only agents that observe, score, classify, and surface intelligence from data that already exists.', color: '#0DEABA' },
    { name: 'Interactive Agent', stage: 2, verb: 'Speak to the World', description: 'Voice, chat, and messaging agents that interact with customers, prospects, and employees.', color: '#6B30FF' },
    { name: 'Action Agent', stage: 2, verb: 'Do the Work', description: 'Agents that operate computers, navigate SaaS platforms, process documents, and update CRMs.', color: '#2A2092' },
  ],
}
