/**
 * Natural Language Task Parser
 *
 * Parses natural language input like "finish vocals for Track 3 by Friday"
 * into structured task data (title, due date, project reference, assignee).
 *
 * This is a client-side rule-based parser. For production, this would be
 * replaced with an LLM-based parser via Supabase Edge Function.
 */

export interface ParsedTask {
  title: string;
  dueDate: string | null;
  dueDateText: string | null;
  projectHint: string | null;
  assigneeHint: string | null;
  priority: "low" | "medium" | "high" | null;
  confidence: number; // 0-1 score indicating parsing confidence
}

// Date expression patterns with resolver that takes the input string and match
type DateResolver = (input: string, match: RegExpExecArray) => Date;

const DATE_PATTERNS: { pattern: RegExp; resolver: DateResolver }[] = [
  { pattern: /\btoday\b/i, resolver: () => new Date() },
  { pattern: /\btomorrow\b/i, resolver: () => addDays(new Date(), 1) },
  { pattern: /\byesterday\b/i, resolver: () => addDays(new Date(), -1) },
  { pattern: /\bnext week\b/i, resolver: () => addDays(new Date(), 7) },
  { pattern: /\bin (\d+) days?\b/i, resolver: (_input, match) => addDays(new Date(), parseInt(match[1] || "1")) },
  { pattern: /\bin (\d+) weeks?\b/i, resolver: (_input, match) => addDays(new Date(), parseInt(match[1] || "1") * 7) },
  { pattern: /\bthis (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, resolver: (_input, match) => getNextDayOfWeek(match[1] || "monday", false) },
  { pattern: /\bnext (monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, resolver: (_input, match) => getNextDayOfWeek(match[1] || "monday", true) },
  { pattern: /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i, resolver: (_input, match) => getNextDayOfWeek(match[1] || "monday", false) },
  { pattern: /\bend of week\b/i, resolver: () => getNextDayOfWeek("friday", false) },
  { pattern: /\bend of month\b/i, resolver: () => getEndOfMonth() },
];

// Day name to number mapping
const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

// Priority keywords
const PRIORITY_PATTERNS = {
  high: /\b(urgent|asap|important|critical|high priority|!!!)\b/i,
  low: /\b(low priority|whenever|not urgent|eventually)\b/i,
};

// Project reference patterns (e.g., "for Track 3", "on the EP project")
const PROJECT_PATTERNS = [
  /\bfor\s+["']?([^"']+?)["']?\s*(?:project|track|song|album|ep)?\s*(?:by|before|$)/i,
  /\bon\s+(?:the\s+)?["']?([^"']+?)["']?\s*(?:project|track|song|album|ep)/i,
  /\b(?:project|track|song|album|ep)\s+["']?([^"']+?)["']?/i,
];

// Assignee patterns (e.g., "@maya", "assign to Leo")
const ASSIGNEE_PATTERNS = [
  /@(\w+)/,
  /\bassign(?:ed)?\s+to\s+(\w+)/i,
  /\bfor\s+(\w+)\s+to\b/i,
];

// Due date trigger words that precede the date expression
const DUE_TRIGGERS = /\b(by|before|due|until|no later than)\s+/i;

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function getNextDayOfWeek(dayName: string, nextWeek: boolean): Date {
  const today = new Date();
  const targetDay = DAY_MAP[dayName.toLowerCase()];
  const currentDay = today.getDay();

  let daysToAdd = targetDay - currentDay;
  if (daysToAdd <= 0 || nextWeek) {
    daysToAdd += 7;
  }

  return addDays(today, daysToAdd);
}

function getEndOfMonth(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0);
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function extractDueDate(input: string): { date: string | null; text: string | null; remaining: string } {
  let remaining = input;

  // First, look for explicit date triggers
  const triggerMatch = DUE_TRIGGERS.exec(input);

  for (const { pattern, resolver } of DATE_PATTERNS) {
    const match = pattern.exec(input);
    if (match) {
      const date = resolver(input, match);
      const dateText = match[0];

      // Remove the date expression and any trigger from the remaining text
      remaining = input.replace(match[0], "").replace(DUE_TRIGGERS, "").trim();

      return {
        date: formatDate(date),
        text: triggerMatch ? `${triggerMatch[1]} ${dateText}` : dateText,
        remaining,
      };
    }
  }

  // Try to parse explicit dates like "March 15" or "3/15"
  const explicitDatePatterns = [
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i,
    /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/,
  ];

  for (const pattern of explicitDatePatterns) {
    const match = pattern.exec(input);
    if (match) {
      const dateText = match[0];
      remaining = input.replace(match[0], "").replace(DUE_TRIGGERS, "").trim();

      // Parse the date (simplified - would need more robust parsing for production)
      const today = new Date();
      let parsedDate: Date;

      if (match[1] && isNaN(parseInt(match[1]))) {
        // Month name format
        const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const monthIndex = monthNames.findIndex(m => match[1].toLowerCase().startsWith(m));
        const day = parseInt(match[2]);
        parsedDate = new Date(today.getFullYear(), monthIndex, day);
        if (parsedDate < today) {
          parsedDate.setFullYear(parsedDate.getFullYear() + 1);
        }
      } else {
        // Numeric format (M/D or M/D/Y)
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        const year = match[3] ? parseInt(match[3]) : today.getFullYear();
        parsedDate = new Date(year < 100 ? 2000 + year : year, month, day);
      }

      return {
        date: formatDate(parsedDate),
        text: dateText,
        remaining,
      };
    }
  }

  return { date: null, text: null, remaining };
}

function extractProjectHint(input: string): { hint: string | null; remaining: string } {
  for (const pattern of PROJECT_PATTERNS) {
    const match = pattern.exec(input);
    if (match && match[1]) {
      const hint = match[1].trim();
      const remaining = input.replace(match[0], "").trim();
      return { hint, remaining };
    }
  }
  return { hint: null, remaining: input };
}

function extractAssigneeHint(input: string): { hint: string | null; remaining: string } {
  for (const pattern of ASSIGNEE_PATTERNS) {
    const match = pattern.exec(input);
    if (match && match[1]) {
      const hint = match[1].trim();
      const remaining = input.replace(match[0], "").trim();
      return { hint, remaining };
    }
  }
  return { hint: null, remaining: input };
}

function extractPriority(input: string): { priority: "low" | "medium" | "high" | null; remaining: string } {
  if (PRIORITY_PATTERNS.high.test(input)) {
    const remaining = input.replace(PRIORITY_PATTERNS.high, "").trim();
    return { priority: "high", remaining };
  }
  if (PRIORITY_PATTERNS.low.test(input)) {
    const remaining = input.replace(PRIORITY_PATTERNS.low, "").trim();
    return { priority: "low", remaining };
  }
  return { priority: null, remaining: input };
}

function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, " ")  // Normalize whitespace
    .replace(/^[-–—]\s*/, "")  // Remove leading dashes
    .replace(/\s*[-–—]$/, "")  // Remove trailing dashes
    .replace(/^\s*(to|and|the)\s+/i, "")  // Remove leading articles
    .trim();
}

/**
 * Parse natural language input into structured task data
 */
export function parseNaturalLanguageTask(input: string): ParsedTask {
  if (!input || !input.trim()) {
    return {
      title: "",
      dueDate: null,
      dueDateText: null,
      projectHint: null,
      assigneeHint: null,
      priority: null,
      confidence: 0,
    };
  }

  let remaining = input.trim();
  let confidence = 0.5; // Base confidence for any input

  // Extract components in order
  const dateResult = extractDueDate(remaining);
  remaining = dateResult.remaining;
  if (dateResult.date) confidence += 0.15;

  const projectResult = extractProjectHint(remaining);
  remaining = projectResult.remaining;
  if (projectResult.hint) confidence += 0.1;

  const assigneeResult = extractAssigneeHint(remaining);
  remaining = assigneeResult.remaining;
  if (assigneeResult.hint) confidence += 0.1;

  const priorityResult = extractPriority(remaining);
  remaining = priorityResult.remaining;
  if (priorityResult.priority) confidence += 0.05;

  // Clean up the remaining text to use as title
  const title = cleanTitle(remaining);

  // Boost confidence if title looks meaningful
  if (title.length > 3 && title.split(" ").length >= 2) {
    confidence += 0.1;
  }

  return {
    title,
    dueDate: dateResult.date,
    dueDateText: dateResult.text,
    projectHint: projectResult.hint,
    assigneeHint: assigneeResult.hint,
    priority: priorityResult.priority,
    confidence: Math.min(confidence, 1),
  };
}

/**
 * Format a parsed task for display
 */
export function formatParsedTaskPreview(parsed: ParsedTask): string {
  const parts: string[] = [];

  if (parsed.title) parts.push(`"${parsed.title}"`);
  if (parsed.dueDate) parts.push(`Due: ${parsed.dueDateText || parsed.dueDate}`);
  if (parsed.projectHint) parts.push(`Project: ${parsed.projectHint}`);
  if (parsed.assigneeHint) parts.push(`Assignee: @${parsed.assigneeHint}`);
  if (parsed.priority) parts.push(`Priority: ${parsed.priority}`);

  return parts.join(" • ");
}
