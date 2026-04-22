// ============================================================
// Field schema
// ------------------------------------------------------------
// Every field now carries the "Call Prep Template" metadata so the
// builder can ask questions naturally during a discovery call.
//
//   id           - stable key, used for storage
//   label        - short internal name (e.g. "Call Direction")
//   question     - natural-language question to ask the client
//   helpText     - WHY this matters; what the answer unlocks
//   priority     - 'must' | 'should' | 'nice' - drives filter + badge
//   category     - group within Section B (e.g. "Interaction Setup")
//   type         - input rendering type (text / textarea / select / etc.)
// ============================================================

// ===== Section A: Universal fields for every Agent Card =====
export const SECTION_A_FIELDS = [
  {
    id: 'agentName',
    label: 'Agent Name',
    question: 'What should we call this agent internally?',
    helpText: 'A clear, descriptive name makes the agent easy to reference in tickets, Slack, and reports. Action-oriented names work best (e.g. "Inbound Triage Agent", not "Agent 3").',
    priority: 'must',
    type: 'text',
    required: true,
    placeholder: 'e.g. Inbound Support Agent'
  },
  {
    id: 'purpose',
    label: 'Purpose',
    question: 'In one sentence: what is this agent\u2019s primary objective?',
    helpText: 'The purpose anchors every other decision. If a feature doesn\u2019t support the purpose, it goes to backlog. Keep it tight - one sentence.',
    priority: 'must',
    type: 'textarea',
    required: true,
    placeholder: 'e.g. Qualify inbound leads and book discovery calls with sales reps.'
  },
  {
    id: 'agreedSteps',
    label: '6 Agreed Steps',
    question: 'Walk me through the exact steps this agent will follow, start to finish.',
    helpText: 'The steps become the QA checklist. Capped at 6 intentionally - if it needs more, it\u2019s probably two agents.',
    priority: 'must',
    type: 'steps',
    required: true,
    placeholder: 'Define the steps this agent follows...',
    maxSteps: 6
  },
  {
    id: 'escalationRule',
    label: 'Escalation Rule',
    question: 'When should this agent hand off to a human, and to whom?',
    helpText: 'Without an explicit rule, escalation becomes subjective and clients get frustrated. Specify the trigger AND the named recipient.',
    priority: 'must',
    type: 'textarea',
    required: true,
    placeholder: 'e.g. After 2 failed attempts OR customer asks for a manager, escalate to the on-shift CS lead via Slack.'
  },
  {
    id: 'approvedCopy',
    label: 'Approved Copy',
    question: 'Which scripts, templates, or messaging must the agent use verbatim?',
    helpText: 'Copy lives in Section A (not B) because it\u2019s what the client will be held to on sign-off. If the client hasn\u2019t provided copy, note that here.',
    priority: 'should',
    type: 'textarea',
    placeholder: 'Paste approved scripts, email templates, or conversational guardrails...'
  },
  {
    id: 'outOfScopeList',
    label: 'Out-of-Scope List',
    question: 'What will this agent explicitly NOT do? (things clients often ask for but aren\u2019t included)',
    helpText: 'Naming out-of-scope items upfront prevents scope creep. If the client asks for them later they become Change Requests, not Fixes.',
    priority: 'should',
    type: 'tags',
    placeholder: 'Items explicitly NOT handled by this agent'
  },
]

// ===== Section B: Type-specific parameter libraries =====
//
// Fields are grouped into `category` blocks for the builder UI.
// Category order below becomes the rendering order.
export const AGENT_TYPES = [
  // ------------------------------------------------------------
  // SUPPORT AGENT
  // ------------------------------------------------------------
  {
    id: 'support',
    name: 'Support Agent',
    icon: 'support',
    color: '#6B30FF',
    description: 'Customer support, inbound/outbound call handling, ticket response',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Interactive Agent', workerVerb: 'Speak to the World' },
    sectionB: [
      // Interaction Setup
      {
        id: 'callDirection',
        label: 'Call Direction',
        question: 'Inbound, outbound, or both?',
        helpText: 'Drives whether we design for greeting flows, dialler integration, or both.',
        priority: 'must',
        category: 'Interaction Setup',
        type: 'select',
        options: ['Inbound', 'Outbound', 'Both']
      },
      {
        id: 'channels',
        label: 'Communication Channels',
        question: 'Which channels will the agent operate on?',
        helpText: 'Each channel requires different handling (voice vs text). Avoid over-scoping - pick the ones live in Phase 1.',
        priority: 'must',
        category: 'Interaction Setup',
        type: 'checklist',
        items: ['Phone', 'Email', 'Chat', 'SMS', 'Web Form']
      },
      {
        id: 'businessHours',
        label: 'Operating Hours',
        question: 'When does this agent need to be live?',
        helpText: 'Determines whether we need queuing / out-of-hours fallback, and sets client expectations.',
        priority: 'should',
        category: 'Interaction Setup',
        type: 'text',
        placeholder: 'e.g. Mon-Fri 8am-6pm BST, with 24/7 email fallback'
      },
      // Audience & Voice
      {
        id: 'greeting',
        label: 'Greeting Script',
        question: 'What are the first words the agent says/sends?',
        helpText: 'The opening sets the tone. Should be approved by the client, not drafted by us.',
        priority: 'should',
        category: 'Audience & Voice',
        type: 'textarea',
        placeholder: 'e.g. "Hi, you\u2019re through to [Client] support. How can I help today?"'
      },
      {
        id: 'voicePersonality',
        label: 'Voice & Personality',
        question: 'What tone should the agent use?',
        helpText: 'Must match the client\u2019s existing brand voice, not our defaults.',
        priority: 'should',
        category: 'Audience & Voice',
        type: 'select',
        options: ['Professional', 'Friendly', 'Authoritative', 'Warm & Empathetic']
      },
      {
        id: 'language',
        label: 'Language(s)',
        question: 'Which languages must the agent handle?',
        helpText: 'Multi-language doubles build time and testing. If not explicitly needed, default to English only.',
        priority: 'nice',
        category: 'Audience & Voice',
        type: 'tags',
        placeholder: 'English, Spanish, etc.'
      },
      // Qualification & Routing
      {
        id: 'qualificationCriteria',
        label: 'Qualification Criteria',
        question: 'What makes a contact "qualified" vs one we route elsewhere?',
        helpText: 'Without clear criteria, the agent will either over-qualify (annoying clients) or under-qualify (wasting sales time).',
        priority: 'must',
        category: 'Qualification & Routing',
        type: 'checklist',
        items: ['Budget confirmed', 'Decision maker identified', 'Timeline established', 'Need identified', 'Authority verified']
      },
      // Systems
      {
        id: 'integrations',
        label: 'Integrations',
        question: 'Which systems will the agent read from or write to?',
        helpText: 'Every integration = access + testing + failure modes. Only list what\u2019s required in Phase 1.',
        priority: 'must',
        category: 'Systems',
        type: 'tags',
        placeholder: 'CRM, Helpdesk, Calendar, etc.'
      },
      // Success Metrics
      {
        id: 'successMetrics',
        label: 'Success Metrics',
        question: 'How will we measure the agent is working?',
        helpText: 'Metrics become the QA Gate 2 acceptance bar. Make them measurable and time-bounded.',
        priority: 'must',
        category: 'Success Metrics',
        type: 'metrics',
        defaults: [
          { name: 'Response Time', target: '<15 min', unit: 'min' },
          { name: 'Resolution Rate', target: '80%', unit: '%' },
          { name: 'Customer Satisfaction', target: '4.5/5', unit: 'rating' }
        ]
      },
      {
        id: 'notes',
        label: 'Additional Notes',
        question: 'Anything else we need to know?',
        helpText: 'Catch-all for edge cases that don\u2019t fit elsewhere.',
        priority: 'nice',
        category: 'Success Metrics',
        type: 'textarea',
        placeholder: 'Any other requirements...'
      },
    ]
  },
  // ------------------------------------------------------------
  // ANALYST AGENT
  // ------------------------------------------------------------
  {
    id: 'analyst',
    name: 'Analyst Agent',
    icon: 'analyst',
    color: '#0DEABA',
    description: 'Data analysis, reporting, insights generation, and revenue discovery',
    seethendo: { stage: 1, stageLabel: 'Insights', workerType: 'Analyst Agent', workerVerb: 'See What\'s Hidden' },
    sectionB: [
      // Data Foundation
      {
        id: 'dataSources',
        label: 'Data Sources',
        question: 'Which datasets will we analyse?',
        helpText: 'Stage 1 agents are read-only. Every source needs read access agreed with client IT before Gate 2.',
        priority: 'must',
        category: 'Data Foundation',
        type: 'tags',
        placeholder: 'CRM, Call logs, Sales data, etc.'
      },
      {
        id: 'analysisType',
        label: 'Analysis Type',
        question: 'What kind of analysis are we running?',
        helpText: 'Narrows the algorithm choice and the expected output shape.',
        priority: 'must',
        category: 'Data Foundation',
        type: 'checklist',
        items: ['Trend Analysis', 'Revenue Discovery', 'Performance Metrics', 'Customer Segmentation', 'Anomaly Detection', 'Forecasting']
      },
      // Output & Distribution
      {
        id: 'reportFrequency',
        label: 'Report Frequency',
        question: 'How often should insights be delivered?',
        helpText: 'Real-time costs more than weekly. Match the frequency to how fast the client can act on the data.',
        priority: 'must',
        category: 'Output & Distribution',
        type: 'select',
        options: ['Real-time', 'Daily', 'Weekly', 'Monthly', 'On-demand']
      },
      {
        id: 'outputFormat',
        label: 'Output Format',
        question: 'How should insights be presented?',
        helpText: 'Different formats have different build costs. Dashboards take longest, email summaries are cheapest.',
        priority: 'should',
        category: 'Output & Distribution',
        type: 'checklist',
        items: ['Dashboard', 'PDF Report', 'Email Summary', 'Slack Notification', 'API Endpoint']
      },
      {
        id: 'recipients',
        label: 'Report Recipients',
        question: 'Who receives the output?',
        helpText: 'Name roles and individuals. Determines distribution list and formatting.',
        priority: 'should',
        category: 'Output & Distribution',
        type: 'tags',
        placeholder: 'Manager, VP Sales, Operations, etc.'
      },
      // Success Metrics
      {
        id: 'successMetrics',
        label: 'Success Metrics',
        question: 'What makes this analyst agent "successful"?',
        helpText: 'Stage 1 metrics are usually about identifying value, not automating it. Quantify the insights.',
        priority: 'must',
        category: 'Success Metrics',
        type: 'metrics',
        defaults: [
          { name: 'Revenue Identified', target: '$7,700/mo', unit: '$' },
          { name: 'Report Accuracy', target: '98%', unit: '%' },
          { name: 'Insights per Week', target: '5+', unit: 'count' }
        ]
      },
      {
        id: 'notes',
        label: 'Additional Notes',
        question: 'Anything else to know?',
        helpText: 'Catch-all for edge cases.',
        priority: 'nice',
        category: 'Success Metrics',
        type: 'textarea',
        placeholder: 'Any other requirements...'
      },
    ]
  },
  // ------------------------------------------------------------
  // COMPUTER USE AGENT
  // ------------------------------------------------------------
  {
    id: 'computer-use',
    name: 'Computer Use Agent',
    icon: 'computer',
    color: '#2A2092',
    description: 'Automated browser and desktop tasks, data entry, system operations',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Action Agent', workerVerb: 'Do the Work' },
    sectionB: [
      // Task Definition
      {
        id: 'taskType',
        label: 'Task Type',
        question: 'What kind of work is the agent doing?',
        helpText: 'Each task type has different error modes. Web scraping breaks when sites change; data entry breaks when schemas change.',
        priority: 'must',
        category: 'Task Definition',
        type: 'checklist',
        items: ['Data Entry', 'Form Filling', 'Web Scraping', 'File Management', 'System Navigation', 'Report Generation']
      },
      {
        id: 'targetSystems',
        label: 'Target Systems',
        question: 'Which systems or URLs will the agent operate on?',
        helpText: 'Name specific tools, not categories. "Salesforce Lightning" not "CRM".',
        priority: 'must',
        category: 'Task Definition',
        type: 'tags',
        placeholder: 'CRM, ERP, Web portals, etc.'
      },
      // Execution
      {
        id: 'frequency',
        label: 'Execution Frequency',
        question: 'When should the agent run?',
        helpText: 'Affects infrastructure cost and robustness requirements.',
        priority: 'must',
        category: 'Execution',
        type: 'select',
        options: ['Real-time', 'Scheduled', 'On-trigger', 'Batch']
      },
      {
        id: 'inputData',
        label: 'Input Data Sources',
        question: 'Where does the agent get its inputs?',
        helpText: 'Determines if we need a staging layer or can work directly from the source.',
        priority: 'should',
        category: 'Execution',
        type: 'tags',
        placeholder: 'Spreadsheets, APIs, Emails, etc.'
      },
      {
        id: 'outputActions',
        label: 'Output Actions',
        question: 'What does the agent produce or do at the end?',
        helpText: 'The outputs are the acceptance criteria. Be concrete: "Creates a row in X, emails Y".',
        priority: 'must',
        category: 'Execution',
        type: 'steps',
        placeholder: 'What does the agent produce or do?'
      },
      // Reliability
      {
        id: 'errorHandling',
        label: 'Error Handling',
        question: 'What should happen when something goes wrong?',
        helpText: 'Action agents fail silently unless told otherwise. Always define a notification path.',
        priority: 'must',
        category: 'Reliability',
        type: 'textarea',
        placeholder: 'e.g. Retry twice, then email ops@ with the error and pause the job.'
      },
      {
        id: 'accessRequirements',
        label: 'Access Requirements',
        question: 'What credentials or access does the agent need?',
        helpText: 'Client IT must provision these before Gate 2. Flag blockers early.',
        priority: 'must',
        category: 'Reliability',
        type: 'tags',
        placeholder: 'Login credentials, VPN, API keys, etc.'
      },
      // Success Metrics
      {
        id: 'successMetrics',
        label: 'Success Metrics',
        question: 'How will we prove the automation is working?',
        helpText: 'Usually completion rate + error rate + time saved. Quantify hours saved for ROI story.',
        priority: 'must',
        category: 'Success Metrics',
        type: 'metrics',
        defaults: [
          { name: 'Task Completion Rate', target: '99%', unit: '%' },
          { name: 'Error Rate', target: '<1%', unit: '%' },
          { name: 'Time Saved/Week', target: '20 hrs', unit: 'hrs' }
        ]
      },
      {
        id: 'notes',
        label: 'Additional Notes',
        question: 'Anything else we need to know?',
        helpText: 'Catch-all.',
        priority: 'nice',
        category: 'Success Metrics',
        type: 'textarea',
        placeholder: 'Any other requirements...'
      },
    ]
  },
  // ------------------------------------------------------------
  // SALES / OUTREACH AGENT
  // ------------------------------------------------------------
  {
    id: 'sales',
    name: 'Sales/Outreach Agent',
    icon: 'sales',
    color: '#FF6629',
    description: 'Lead nurturing, pipeline management, outbound outreach, and demo scheduling',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Interactive Agent', workerVerb: 'Speak to the World' },
    sectionB: [
      // Audience & Stage
      {
        id: 'salesStage',
        label: 'Pipeline Stage Focus',
        question: 'Where in the pipeline does this agent work?',
        helpText: 'Different stages need different messaging and KPIs. Don\u2019t build a "whole pipeline" agent in Phase 1.',
        priority: 'must',
        category: 'Audience & Stage',
        type: 'select',
        options: ['Lead Generation', 'Lead Qualification', 'Demo Scheduling', 'Follow-up', 'Closing Support']
      },
      {
        id: 'targetAudience',
        label: 'Target Audience',
        question: 'Who is the ideal customer this agent is targeting?',
        helpText: 'Be specific about title, company size, industry, and pain. Vague audiences = vague outreach.',
        priority: 'must',
        category: 'Audience & Stage',
        type: 'textarea',
        placeholder: 'Describe the ideal customer profile'
      },
      // Outreach Approach
      {
        id: 'channels',
        label: 'Communication Channels',
        question: 'Which channels will the agent use for outreach?',
        helpText: 'Match channels to where the audience actually engages. LinkedIn + email works for B2B; phone for SMB.',
        priority: 'must',
        category: 'Outreach Approach',
        type: 'checklist',
        items: ['Phone', 'Email', 'LinkedIn', 'SMS', 'Chat']
      },
      {
        id: 'cadence',
        label: 'Outreach Cadence',
        question: 'What is the exact sequence and timing?',
        helpText: 'The cadence is the core IP of the agent. Too aggressive = spam. Too passive = no pipeline.',
        priority: 'must',
        category: 'Outreach Approach',
        type: 'steps',
        placeholder: 'Define the outreach sequence...'
      },
      {
        id: 'objectionHandling',
        label: 'Common Objections',
        question: 'What objections will the agent hear most, and how should it respond?',
        helpText: 'Pre-writing responses to top 3-5 objections saves half the escalations. Client must approve these.',
        priority: 'should',
        category: 'Outreach Approach',
        type: 'tags',
        placeholder: 'Price, Timing, Competition, etc.'
      },
      // Systems
      {
        id: 'integrations',
        label: 'Integrations',
        question: 'Which tools need to be connected?',
        helpText: 'CRM is almost always required (to log activity). Calendar for booking.',
        priority: 'must',
        category: 'Systems',
        type: 'tags',
        placeholder: 'CRM, Calendar, LinkedIn, etc.'
      },
      // Success Metrics
      {
        id: 'successMetrics',
        label: 'Success Metrics',
        question: 'What numbers prove the agent is working?',
        helpText: 'Outreach agents live or die on conversion + velocity metrics. Be honest about realistic benchmarks.',
        priority: 'must',
        category: 'Success Metrics',
        type: 'metrics',
        defaults: [
          { name: 'Lead Conversion Rate', target: '25%', unit: '%' },
          { name: 'Demos Booked/Week', target: '15', unit: 'count' },
          { name: 'Response Time', target: '<10 min', unit: 'min' }
        ]
      },
      {
        id: 'notes',
        label: 'Additional Notes',
        question: 'Anything else worth knowing?',
        helpText: 'Catch-all.',
        priority: 'nice',
        category: 'Success Metrics',
        type: 'textarea',
        placeholder: 'Any other requirements...'
      },
    ]
  },
  // ------------------------------------------------------------
  // TASK / AUTOMATION AGENT
  // ------------------------------------------------------------
  {
    id: 'task',
    name: 'Task/Automation Agent',
    icon: 'task',
    color: '#FFCD18',
    description: 'Workflow automation, scheduled tasks, cross-system orchestration',
    seethendo: { stage: 2, stageLabel: 'Action', workerType: 'Action Agent', workerVerb: 'Do the Work' },
    sectionB: [
      // Trigger
      {
        id: 'triggerType',
        label: 'Trigger Type',
        question: 'What starts this automation running?',
        helpText: 'Drives infrastructure: webhook receivers, cron scheduling, or manual queues.',
        priority: 'must',
        category: 'Trigger',
        type: 'select',
        options: ['Scheduled', 'Event-based', 'Manual', 'Webhook', 'Conditional']
      },
      {
        id: 'triggerConditions',
        label: 'Trigger Conditions',
        question: 'What specific conditions cause the trigger to fire?',
        helpText: 'Vague triggers cause false positives or missed runs. Be concrete about the exact signal.',
        priority: 'must',
        category: 'Trigger',
        type: 'steps',
        placeholder: 'What starts this automation?'
      },
      // Workflow
      {
        id: 'workflowSteps',
        label: 'Workflow Steps',
        question: 'What happens at each step of the automation?',
        helpText: 'Each step is a failure point. Fewer steps = more reliable agent. Aim for 3-6 steps.',
        priority: 'must',
        category: 'Workflow',
        type: 'steps',
        placeholder: 'Define each step of the automation...'
      },
      {
        id: 'conditions',
        label: 'Conditional Logic',
        question: 'Are there any if/then branches we need to handle?',
        helpText: 'Call out branches explicitly. Hidden conditionals are the #1 cause of production surprises.',
        priority: 'should',
        category: 'Workflow',
        type: 'textarea',
        placeholder: 'Describe any if/then rules or branching logic'
      },
      // Systems
      {
        id: 'systems',
        label: 'Connected Systems',
        question: 'Which systems does the automation touch?',
        helpText: 'Each system needs credentials + testing. Name specific tools, not categories.',
        priority: 'must',
        category: 'Systems',
        type: 'tags',
        placeholder: 'CRM, Email, Slack, Database, etc.'
      },
      {
        id: 'errorNotifications',
        label: 'Error Notifications',
        question: 'Where should failures be reported?',
        helpText: 'Automations fail silently by default. Always route errors to a human channel.',
        priority: 'must',
        category: 'Systems',
        type: 'tags',
        placeholder: 'Email, Slack, SMS, etc.'
      },
      // Success Metrics
      {
        id: 'successMetrics',
        label: 'Success Metrics',
        question: 'How do we know the automation is working and adding value?',
        helpText: 'Success rate + volume + time saved. Quantify for the ROI story.',
        priority: 'must',
        category: 'Success Metrics',
        type: 'metrics',
        defaults: [
          { name: 'Automation Success Rate', target: '99%', unit: '%' },
          { name: 'Tasks Automated/Day', target: '50+', unit: 'count' },
          { name: 'Time Saved/Week', target: '15 hrs', unit: 'hrs' }
        ]
      },
      {
        id: 'notes',
        label: 'Additional Notes',
        question: 'Anything else to know?',
        helpText: 'Catch-all.',
        priority: 'nice',
        category: 'Success Metrics',
        type: 'textarea',
        placeholder: 'Any other requirements...'
      },
    ]
  },
]

// ============================================================
// Helpers for category-grouped rendering
// ============================================================

/**
 * Returns Section B fields grouped by category, preserving order.
 * Category order = first-seen order in the sectionB array.
 */
export function groupSectionBByCategory(sectionB) {
  const groups = []
  const seen = new Map()
  for (const field of sectionB) {
    const cat = field.category || 'Other'
    if (!seen.has(cat)) {
      const entry = { category: cat, fields: [] }
      seen.set(cat, entry)
      groups.push(entry)
    }
    seen.get(cat).fields.push(field)
  }
  return groups
}

/**
 * Priority badge metadata for UI.
 */
export const PRIORITY_BADGES = {
  must:   { label: 'Must Have',  bg: 'rgba(239,68,68,0.12)',  fg: '#991b1b' },
  should: { label: 'Should Have', bg: 'rgba(245,158,11,0.15)', fg: '#92400e' },
  nice:   { label: 'Nice to Have', bg: 'rgba(16,185,129,0.15)', fg: '#065f46' },
}

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
