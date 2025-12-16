import cronstrue from 'cronstrue';

interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion?: number;
  position: [number, number];
  parameters?: any;
}

interface N8nWorkflow {
  id: string;
  name: string;
  nodes: N8nNode[];
  connections: any;
  settings?: any;
  active?: boolean;
}

export interface ProcessorCondition {
  field: string;
  operator: string | { type?: string; operation?: string };
  value: string;
  rawExpression?: string;
}

export interface ProcessorOutput {
  name: string;
  value: string;
}

export interface Processor {
  id: string;
  type: string; // lead, sale, canceled, rev-share, etc.
  ifNodeName: string;
  setNodeName: string;
  conditions: ProcessorCondition[];
  outputs: ProcessorOutput[];
}

export interface FetcherNode {
  id: string;
  name: string;
  type: string;
  // HTTP fields
  url?: string;
  method?: string;
  queryParameters?: { name: string; value: string }[];
  headers?: { name: string; value: string }[];
  body?: any;
  authentication?: string;
  // Gmail fields
  operation?: string;
  searchQuery?: string;
  receivedAfter?: string;
  downloadAttachments?: boolean;
  // Google Sheets fields
  documentId?: string;
  sheetId?: string;
}

export interface TriggerNode {
  id: string;
  name: string;
  type: string;
  triggerType: 'schedule' | 'manual' | 'webhook' | 'email';
  // Schedule-specific fields
  cronExpression?: string;
  humanReadable?: string;
  scheduleMode?: string; // everyMinute, everyHour, everyDay, etc.
  scheduleDetails?: string; // Additional details like time, day, etc.
}

export interface SetNode {
  id: string;
  name: string;
  type: string;
  assignments: Array<{
    id: string;
    name: string;
    type: string;
    value: string;
  }>;
}

export interface WorkflowAnalysis {
  workflowId: string;
  workflowName: string;
  trigger: string;
  fetcherType: string;
  translationNodesCount: number;
  processorNodesCount: number;
  processors: Processor[];
  fetcher?: FetcherNode;
  triggerNode?: TriggerNode;
  triggerNodes?: TriggerNode[]; // Support multiple trigger nodes
  setNodes?: SetNode[]; // Standalone SET nodes (not part of IF-SET processors)
}

// Node type categories
const TRIGGER_TYPES = [
  'n8n-nodes-base.scheduleTrigger',
  'n8n-nodes-base.cronTrigger',
  'n8n-nodes-base.webhook',
  'n8n-nodes-base.manualTrigger',
  'n8n-nodes-base.emailTrigger',
  'n8n-nodes-base.start'
];

const FETCHER_TYPES = [
  'n8n-nodes-base.httpRequest',
  'n8n-nodes-base.gmail',
  'n8n-nodes-base.googleSheets',
  'n8n-nodes-base.googleDrive',
  'n8n-nodes-base.postgres',
  'n8n-nodes-base.mysql',
  'n8n-nodes-base.mongodb',
  'n8n-nodes-base.redis',
  'n8n-nodes-base.airtable',
  'n8n-nodes-base.notion',
  'n8n-nodes-base.slack',
  'n8n-nodes-base.telegram',
  'n8n-nodes-base.discord'
];

const TRANSLATION_TYPES = [
  'n8n-nodes-base.spreadsheetFile',
  'n8n-nodes-base.compression',
  'n8n-nodes-base.merge',
  'n8n-nodes-base.aggregate',
  'n8n-nodes-base.sort',
  'n8n-nodes-base.removeDuplicates',
  'n8n-nodes-base.filter',
  'n8n-nodes-base.itemLists',
  'n8n-nodes-base.code',
  'n8n-nodes-base.function',
  'n8n-nodes-base.moveToFtp',
  'n8n-nodes-base.moveBinaryData',
  'n8n-nodes-base.xml',
  'n8n-nodes-base.html',
  'n8n-nodes-base.crypto',
  'n8n-nodes-base.executeWorkflow'
];

const IF_TYPES = ['n8n-nodes-base.if', 'n8n-nodes-base.switch'];
const SET_TYPES = ['n8n-nodes-base.set'];

/**
 * Parse cron expression to human-readable format
 */
function parseCronExpression(cronExpression: string): string {
  try {
    return cronstrue.toString(cronExpression, { use24HourTimeFormat: true });
  } catch (error) {
    return cronExpression;
  }
}

/**
 * Format cron expression in a concise, user-friendly way
 * Examples: hourly ranges, step intervals, daily, weekly, monthly schedules
 */
function formatCronSchedule(cronExpression: string): string {
  try {
    const parts = cronExpression.trim().split(/\s+/);
    if (parts.length < 5) {
      return cronExpression;
    }

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Handle hourly ranges: "10 9-18 * * *"
    if (hour.includes('-') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const [startHour, endHour] = hour.split('-').map(h => parseInt(h, 10));
      const min = minute.padStart(2, '0');
      const start = `${startHour}:${min}`;
      const end = `${endHour}:${min}`;
      const frequency = 1;
      return `${start} - ${end} every ${frequency} hour${frequency > 1 ? 's' : ''}`;
    }

    // Handle step hours: "0 */2 * * *" (every 2 hours)
    if (hour.startsWith('*/') && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const step = parseInt(hour.substring(2), 10);
      const min = minute.padStart(2, '0');
      if (step === 1) {
        return `Every hour at :${min}`;
      }
      return `Every ${step} hours at :${min}`;
    }

    // Handle daily: "30 14 * * *"
    if (!hour.includes('*') && !hour.includes('/') && !hour.includes('-') &&
        dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      const h = hour.padStart(2, '0');
      const m = minute.padStart(2, '0');
      return `${h}:${m} every day`;
    }

    // Handle every minute: "* * * * *"
    if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Every minute';
    }

    // Handle weekly: "0 9 * * 1" (Monday at 9:00)
    if (!hour.includes('*') && dayOfMonth === '*' && month === '*' && !dayOfWeek.includes('*')) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayNum = parseInt(dayOfWeek, 10);
      const dayName = days[dayNum] || dayOfWeek;
      const h = hour.padStart(2, '0');
      const m = minute.padStart(2, '0');
      return `${h}:${m} every ${dayName}`;
    }

    // Handle monthly: "0 9 1 * *" (1st of month at 9:00)
    if (!hour.includes('*') && !dayOfMonth.includes('*') && month === '*' && dayOfWeek === '*') {
      const h = hour.padStart(2, '0');
      const m = minute.padStart(2, '0');
      const day = parseInt(dayOfMonth, 10);
      const suffix = day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
      return `${h}:${m} on ${day}${suffix} of every month`;
    }

    // Fallback to cronstrue
    return parseCronExpression(cronExpression);
  } catch (error) {
    return cronExpression;
  }
}

/**
 * Extract trigger information from the first node
 * IMPORTANT: Always prioritize schedule triggers over manual triggers
 */
function extractTrigger(nodes: N8nNode[]): string {
  if (!nodes || nodes.length === 0) {
    return 'No trigger found';
  }

  // PRIORITY 1: Look for schedule triggers first (highest priority)
  const scheduleTrigger = nodes.find(node =>
    node.type === 'n8n-nodes-base.scheduleTrigger' ||
    node.type === 'n8n-nodes-base.cronTrigger'
  );

  // If schedule trigger exists, always use it
  if (scheduleTrigger) {
    const params = scheduleTrigger.parameters || {};

    // Check for cron expression
    if (params.rule?.interval) {
      const interval = params.rule.interval;
      if (Array.isArray(interval) && interval.length > 0) {
        const cronExpr = interval[0].expression;
        if (cronExpr) {
          return parseCronExpression(cronExpr);
        }
      }
    }

    // Check for simple schedule (minutes, hours, days)
    if (params.triggerTimes) {
      const triggerTimes = params.triggerTimes;
      if (triggerTimes.mode === 'everyMinute') {
        return 'Every minute';
      } else if (triggerTimes.mode === 'everyHour') {
        return `Every hour at ${triggerTimes.minute || '00'} minutes`;
      } else if (triggerTimes.mode === 'everyDay') {
        return `Every day at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      } else if (triggerTimes.mode === 'everyWeek') {
        return `Every week on ${triggerTimes.weekday || 'Monday'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      } else if (triggerTimes.mode === 'everyMonth') {
        return `Every month on day ${triggerTimes.day || '1'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      }
    }

    return 'Scheduled (see workflow for details)';
  }

  // PRIORITY 2: Look for other trigger types (webhook, email, etc.)
  const triggerNode = nodes.find(node =>
    TRIGGER_TYPES.some(type => node.type === type)
  ) || nodes[0];

  if (!triggerNode) {
    return 'Manual trigger';
  }

  // Handle Schedule Trigger (redundant check but kept for safety)
  if (triggerNode.type === 'n8n-nodes-base.scheduleTrigger' ||
      triggerNode.type === 'n8n-nodes-base.cronTrigger') {
    const params = triggerNode.parameters || {};

    // Check for cron expression
    if (params.rule?.interval) {
      const interval = params.rule.interval;
      if (Array.isArray(interval) && interval.length > 0) {
        const cronExpr = interval[0].expression;
        if (cronExpr) {
          return parseCronExpression(cronExpr);
        }
      }
    }

    // Check for simple schedule (minutes, hours, days)
    if (params.triggerTimes) {
      const triggerTimes = params.triggerTimes;
      if (triggerTimes.mode === 'everyMinute') {
        return 'Every minute';
      } else if (triggerTimes.mode === 'everyHour') {
        return `Every hour at ${triggerTimes.minute || '00'} minutes`;
      } else if (triggerTimes.mode === 'everyDay') {
        return `Every day at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      } else if (triggerTimes.mode === 'everyWeek') {
        return `Every week on ${triggerTimes.weekday || 'Monday'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      } else if (triggerTimes.mode === 'everyMonth') {
        return `Every month on day ${triggerTimes.day || '1'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      }
    }

    return 'Scheduled (see workflow for details)';
  }

  // Handle Webhook Trigger
  if (triggerNode.type === 'n8n-nodes-base.webhook') {
    return 'Webhook trigger';
  }

  // Handle Manual Trigger
  if (triggerNode.type === 'n8n-nodes-base.manualTrigger' ||
      triggerNode.type === 'n8n-nodes-base.start') {
    return 'Manual trigger';
  }

  // Handle Email Trigger
  if (triggerNode.type === 'n8n-nodes-base.emailTrigger') {
    return 'Email trigger';
  }

  return 'Manual trigger';
}

/**
 * Extract fetcher type from nodes
 */
function extractFetcherType(nodes: N8nNode[]): string {
  if (!nodes || nodes.length === 0) {
    return 'None';
  }

  // Look for fetcher nodes (excluding triggers)
  const fetcherNode = nodes.find(node =>
    FETCHER_TYPES.some(type => node.type === type)
  );

  if (!fetcherNode) {
    return 'None';
  }

  // Map node types to human-readable names
  const typeMap: { [key: string]: string } = {
    'n8n-nodes-base.httpRequest': 'HTTP',
    'n8n-nodes-base.gmail': 'Gmail',
    'n8n-nodes-base.googleSheets': 'Google Sheets',
    'n8n-nodes-base.googleDrive': 'Google Drive',
    'n8n-nodes-base.postgres': 'PostgreSQL',
    'n8n-nodes-base.mysql': 'MySQL',
    'n8n-nodes-base.mongodb': 'MongoDB',
    'n8n-nodes-base.redis': 'Redis',
    'n8n-nodes-base.airtable': 'Airtable',
    'n8n-nodes-base.notion': 'Notion',
    'n8n-nodes-base.slack': 'Slack',
    'n8n-nodes-base.telegram': 'Telegram',
    'n8n-nodes-base.discord': 'Discord'
  };

  return typeMap[fetcherNode.type] || fetcherNode.type;
}

/**
 * Extract detailed fetcher node information
 */
function extractFetcherNode(nodes: N8nNode[]): FetcherNode | undefined {
  if (!nodes || nodes.length === 0) {
    return undefined;
  }

  // Look for fetcher nodes
  const fetcherNode = nodes.find(node =>
    FETCHER_TYPES.some(type => node.type === type)
  );

  if (!fetcherNode) {
    return undefined;
  }

  const params = fetcherNode.parameters || {};
  const fetcher: FetcherNode = {
    id: fetcherNode.id,
    name: fetcherNode.name,
    type: fetcherNode.type
  };

  // Handle HTTP Request nodes
  if (fetcherNode.type === 'n8n-nodes-base.httpRequest') {
    fetcher.url = params.url || '';
    fetcher.method = params.method || params.requestMethod || 'GET';

    // Extract query parameters
    if (params.queryParameters?.parameters && Array.isArray(params.queryParameters.parameters)) {
      fetcher.queryParameters = params.queryParameters.parameters.map((qp: any) => ({
        name: qp.name || '',
        value: qp.value || ''
      }));
    }

    // Extract headers
    if (params.headerParameters?.parameters && Array.isArray(params.headerParameters.parameters)) {
      fetcher.headers = params.headerParameters.parameters.map((hp: any) => ({
        name: hp.name || '',
        value: hp.value || ''
      }));
    }

    // Extract authentication type
    if (params.authentication) {
      fetcher.authentication = params.authentication;
    } else if (params.options?.authentication) {
      fetcher.authentication = params.options.authentication;
    }

    // Extract body if present
    if (params.body || params.bodyParameters) {
      fetcher.body = params.body || params.bodyParameters;
    }
  }
  // Handle Gmail nodes
  else if (fetcherNode.type === 'n8n-nodes-base.gmail') {
    fetcher.operation = params.operation || 'getAll';

    // Extract search query from filters
    if (params.filters?.q) {
      fetcher.searchQuery = params.filters.q;
    }

    // Extract receivedAfter filter
    if (params.filters?.receivedAfter) {
      fetcher.receivedAfter = params.filters.receivedAfter;
    }

    // Extract download attachments option
    if (params.options?.downloadAttachments !== undefined) {
      fetcher.downloadAttachments = params.options.downloadAttachments;
    }
  }
  // Handle Google Sheets nodes
  else if (fetcherNode.type === 'n8n-nodes-base.googleSheets') {
    // Extract document ID
    if (params.documentId) {
      // documentId can be a string or an object with value property
      if (typeof params.documentId === 'string') {
        fetcher.documentId = params.documentId;
      } else if (params.documentId.value) {
        fetcher.documentId = params.documentId.value;
      }
    }

    // Extract sheet ID (stored in sheetName field)
    if (params.sheetName) {
      // sheetName can be a string or an object with value property
      if (typeof params.sheetName === 'string') {
        fetcher.sheetId = params.sheetName;
      } else if (params.sheetName.value) {
        fetcher.sheetId = params.sheetName.value;
      }
    }
  }

  return fetcher;
}

/**
 * Extract detailed trigger node information
 */
function extractTriggerNode(nodes: N8nNode[]): TriggerNode | undefined {
  if (!nodes || nodes.length === 0) {
    return undefined;
  }

  // Find the first trigger node
  const triggerNode = nodes.find(node =>
    TRIGGER_TYPES.some(type => node.type === type)
  );

  if (!triggerNode) {
    return undefined;
  }

  return buildTriggerNode(triggerNode);
}

/**
 * Extract all trigger nodes (supports multiple triggers per workflow)
 */
function extractTriggerNodes(nodes: N8nNode[]): TriggerNode[] {
  if (!nodes || nodes.length === 0) {
    return [];
  }

  // Find all trigger nodes
  const triggerNodes = nodes.filter(node =>
    TRIGGER_TYPES.some(type => node.type === type)
  );

  return triggerNodes.map(buildTriggerNode).filter(Boolean) as TriggerNode[];
}

/**
 * Build a TriggerNode object from an N8nNode
 */
function buildTriggerNode(triggerNode: N8nNode): TriggerNode | undefined {
  if (!triggerNode) {
    return undefined;
  }

  const params = triggerNode.parameters || {};
  const trigger: TriggerNode = {
    id: triggerNode.id,
    name: triggerNode.name,
    type: triggerNode.type,
    triggerType: 'manual' // default
  };

  // Handle Schedule Trigger
  if (triggerNode.type === 'n8n-nodes-base.scheduleTrigger' ||
      triggerNode.type === 'n8n-nodes-base.cronTrigger') {
    trigger.triggerType = 'schedule';

    // Check for cron expression
    if (params.rule?.interval) {
      const interval = params.rule.interval;
      if (Array.isArray(interval) && interval.length > 0) {
        const cronExpr = interval[0].expression;
        if (cronExpr) {
          trigger.cronExpression = cronExpr;
          trigger.humanReadable = formatCronSchedule(cronExpr);
        }
      }
    }

    // Check for simple schedule (minutes, hours, days)
    if (params.triggerTimes) {
      const triggerTimes = params.triggerTimes;
      trigger.scheduleMode = triggerTimes.mode;

      if (triggerTimes.mode === 'everyMinute') {
        trigger.humanReadable = 'Every minute';
      } else if (triggerTimes.mode === 'everyHour') {
        trigger.humanReadable = `Every hour at ${triggerTimes.minute || '00'} minutes`;
        trigger.scheduleDetails = `At minute ${triggerTimes.minute || '00'}`;
      } else if (triggerTimes.mode === 'everyDay') {
        trigger.humanReadable = `Every day at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
        trigger.scheduleDetails = `At ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      } else if (triggerTimes.mode === 'everyWeek') {
        trigger.humanReadable = `Every week on ${triggerTimes.weekday || 'Monday'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
        trigger.scheduleDetails = `${triggerTimes.weekday || 'Monday'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      } else if (triggerTimes.mode === 'everyMonth') {
        trigger.humanReadable = `Every month on day ${triggerTimes.day || '1'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
        trigger.scheduleDetails = `Day ${triggerTimes.day || '1'} at ${triggerTimes.hour || '00'}:${triggerTimes.minute || '00'}`;
      }
    }
  }
  // Handle Webhook Trigger
  else if (triggerNode.type === 'n8n-nodes-base.webhook') {
    trigger.triggerType = 'webhook';
  }
  // Handle Email Trigger
  else if (triggerNode.type === 'n8n-nodes-base.emailTrigger') {
    trigger.triggerType = 'email';
  }
  // Handle Manual Trigger
  else if (triggerNode.type === 'n8n-nodes-base.manualTrigger' ||
           triggerNode.type === 'n8n-nodes-base.start') {
    trigger.triggerType = 'manual';
  }

  return trigger;
}

/**
 * Count translation nodes
 */
function countTranslationNodes(nodes: N8nNode[]): number {
  if (!nodes || nodes.length === 0) {
    return 0;
  }

  return nodes.filter(node =>
    TRANSLATION_TYPES.some(type => node.type === type)
  ).length;
}

/**
 * Count processor nodes (IF-SET pairs)
 * Each IF node followed by SET nodes counts as one processor
 */
function countProcessorNodes(nodes: N8nNode[], connections: any): number {
  if (!nodes || nodes.length === 0) {
    return 0;
  }

  let processorCount = 0;
  const ifNodes = nodes.filter(node => IF_TYPES.some(type => node.type === type));

  // For each IF node, check if it has SET nodes connected to it
  for (const ifNode of ifNodes) {
    const nodeConnections = connections[ifNode.name];

    if (nodeConnections && nodeConnections.main) {
      // Check if any of the outputs connect to SET nodes
      const outputs = nodeConnections.main;
      let hasSetNode = false;

      for (const output of outputs) {
        if (output && Array.isArray(output)) {
          for (const connection of output) {
            const connectedNode = nodes.find(n => n.name === connection.node);
            if (connectedNode && SET_TYPES.some(type => connectedNode.type === type)) {
              hasSetNode = true;
              break;
            }
          }
        }
        if (hasSetNode) break;
      }

      if (hasSetNode) {
        processorCount++;
      }
    }
  }

  return processorCount;
}

/**
 * Extract conditions from an IF node
 */
function extractConditions(ifNode: N8nNode): ProcessorCondition[] {
  const conditions: ProcessorCondition[] = [];
  const params = ifNode.parameters || {};

  // Handle IF node conditions
  if (params.conditions) {
    const conditionsData = params.conditions;

    // Handle different IF node structures
    if (conditionsData.conditions && Array.isArray(conditionsData.conditions)) {
      for (const condition of conditionsData.conditions) {
        // n8n uses leftValue and rightValue for conditions
        const leftValue = condition.leftValue || condition.value1 || '';
        const rightValue = condition.rightValue !== undefined && condition.rightValue !== null
          ? String(condition.rightValue)
          : (condition.value2 !== undefined && condition.value2 !== null ? String(condition.value2) : '');

        conditions.push({
          field: leftValue,
          operator: condition.operator || '',  // This is an object with {type, operation}
          value: rightValue,
          rawExpression: ''
        });
      }
    }
  }

  // If no structured conditions found, try to extract from raw parameters
  if (conditions.length === 0 && params.conditions) {
    // Sometimes conditions are stored differently, create a generic condition
    conditions.push({
      field: 'condition',
      operator: 'custom',
      value: JSON.stringify(params.conditions),
      rawExpression: JSON.stringify(params.conditions)
    });
  }

  return conditions;
}

/**
 * Extract outputs from a SET node
 */
function extractOutputs(setNode: N8nNode): ProcessorOutput[] {
  const outputs: ProcessorOutput[] = [];
  const params = setNode.parameters || {};

  // Handle different SET node parameter structures
  // Modern n8n uses nested "assignments.assignments" field
  if (params.assignments && params.assignments.assignments && Array.isArray(params.assignments.assignments)) {
    for (const assignment of params.assignments.assignments) {
      if (assignment.name && assignment.value !== undefined) {
        outputs.push({
          name: assignment.name,
          value: String(assignment.value)
        });
      }
    }
  }
  // Check for direct assignments array (older structure)
  else if (params.assignments && Array.isArray(params.assignments)) {
    for (const assignment of params.assignments) {
      if (assignment.name && assignment.value !== undefined) {
        outputs.push({
          name: assignment.name,
          value: String(assignment.value)
        });
      }
    }
  }
  // Older n8n might use "values" field
  else if (params.values && typeof params.values === 'object') {
    for (const [key, value] of Object.entries(params.values)) {
      outputs.push({
        name: key,
        value: String(value)
      });
    }
  }
  // Check for keepOnlySet field with values
  else if (params.keepOnlySet && params.options?.values) {
    const values = params.options.values;
    for (const [key, value] of Object.entries(values)) {
      outputs.push({
        name: key,
        value: String(value)
      });
    }
  }

  return outputs;
}

/**
 * Determine processor type from SET node outputs
 */
function getProcessorType(outputs: ProcessorOutput[]): string {
  // Look for the "event" field to determine type
  const eventOutput = outputs.find(output => output.name === 'event');

  if (eventOutput) {
    const eventValue = eventOutput.value.toLowerCase().trim();
    // Remove any n8n expression syntax if present
    const cleanValue = eventValue.replace(/^=+\s*/, '').replace(/[{}"'\s]/g, '');

    // Return the event type as-is (will be used for color coding)
    return cleanValue || 'unknown';
  }

  return 'unknown';
}

/**
 * Extract detailed processor information (IF-SET pairs with conditions and outputs)
 */
function extractProcessors(nodes: N8nNode[], connections: any): Processor[] {
  const processors: Processor[] = [];

  if (!nodes || nodes.length === 0) {
    return processors;
  }

  const ifNodes = nodes.filter(node => IF_TYPES.some(type => node.type === type));

  // For each IF node, find connected SET nodes
  for (const ifNode of ifNodes) {
    const nodeConnections = connections[ifNode.name];

    if (nodeConnections && nodeConnections.main) {
      const outputs = nodeConnections.main;

      // Check each output branch (typically IF nodes have multiple outputs: true/false branches)
      for (let outputIndex = 0; outputIndex < outputs.length; outputIndex++) {
        const output = outputs[outputIndex];

        if (output && Array.isArray(output)) {
          for (const connection of output) {
            const connectedNode = nodes.find(n => n.name === connection.node);

            if (connectedNode && SET_TYPES.some(type => connectedNode.type === type)) {
              // Extract conditions from IF node
              const conditions = extractConditions(ifNode);

              // Extract outputs from SET node
              const setOutputs = extractOutputs(connectedNode);

              // Determine processor type
              const processorType = getProcessorType(setOutputs);

              processors.push({
                id: `${ifNode.id}-${connectedNode.id}`,
                type: processorType,
                ifNodeName: ifNode.name,
                setNodeName: connectedNode.name,
                conditions,
                outputs: setOutputs
              });
            }
          }
        }
      }
    }
  }

  return processors;
}

/**
 * Extract standalone SET nodes (not part of IF-SET processor pairs)
 */
function extractStandaloneSetNodes(nodes: N8nNode[], connections: any): SetNode[] {
  const setNodes: SetNode[] = [];

  if (!nodes || nodes.length === 0) {
    return setNodes;
  }

  // Get all SET nodes
  const allSetNodes = nodes.filter(node => SET_TYPES.some(type => node.type === type));

  // Get SET nodes that are part of processors
  const processorSetNodeNames = new Set<string>();
  const ifNodes = nodes.filter(node => IF_TYPES.some(type => node.type === type));

  for (const ifNode of ifNodes) {
    const nodeConnections = connections[ifNode.name];
    if (nodeConnections && nodeConnections.main) {
      const outputs = nodeConnections.main;
      for (const output of outputs) {
        if (output && Array.isArray(output)) {
          for (const connection of output) {
            const connectedNode = nodes.find(n => n.name === connection.node);
            if (connectedNode && SET_TYPES.some(type => connectedNode.type === type)) {
              processorSetNodeNames.add(connectedNode.name);
            }
          }
        }
      }
    }
  }

  // Filter out SET nodes that are part of processors
  const standaloneSetNodes = allSetNodes.filter(node => !processorSetNodeNames.has(node.name));

  // Build SetNode objects
  for (const setNode of standaloneSetNodes) {
    const params = setNode.parameters || {};
    const assignments: Array<{ id: string; name: string; type: string; value: string }> = [];

    // Extract assignments
    if (params.assignments?.assignments && Array.isArray(params.assignments.assignments)) {
      for (const assignment of params.assignments.assignments) {
        assignments.push({
          id: assignment.id || assignment.name,
          name: assignment.name || '',
          type: assignment.type || 'string',
          value: String(assignment.value || '')
        });
      }
    }

    setNodes.push({
      id: setNode.id,
      name: setNode.name,
      type: setNode.type,
      assignments
    });
  }

  return setNodes;
}

/**
 * Analyze a single workflow
 */
export function analyzeWorkflow(workflow: N8nWorkflow): WorkflowAnalysis {
  const processors = extractProcessors(workflow.nodes, workflow.connections);
  const fetcher = extractFetcherNode(workflow.nodes);
  const triggerNode = extractTriggerNode(workflow.nodes);
  const triggerNodes = extractTriggerNodes(workflow.nodes);
  const setNodes = extractStandaloneSetNodes(workflow.nodes, workflow.connections);

  return {
    workflowId: workflow.id,
    workflowName: workflow.name,
    trigger: extractTrigger(workflow.nodes),
    fetcherType: extractFetcherType(workflow.nodes),
    translationNodesCount: countTranslationNodes(workflow.nodes),
    processorNodesCount: processors.length,
    processors,
    fetcher,
    triggerNode,
    triggerNodes,
    setNodes
  };
}

/**
 * Analyze multiple workflows
 */
export function analyzeWorkflows(workflows: N8nWorkflow[]): WorkflowAnalysis[] {
  return workflows.map(workflow => analyzeWorkflow(workflow));
}
