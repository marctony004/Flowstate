export interface IdeaMemory {
  rawTranscript: string | null;
  summary: string;
  keyConcepts: string[];
  extractedDates: string[];
  detectedTasks: string[];
  sourceType: "image" | "voice" | "video" | "document" | "text";
  extractedAt: string;
  modelUsed: string;
}
