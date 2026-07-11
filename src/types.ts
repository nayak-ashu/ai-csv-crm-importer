export interface CRMLead {
  id?: string; // Client-side display key
  created_at?: string;
  name?: string;
  email?: string;
  country_code?: string;
  mobile_without_country_code?: string;
  company?: string;
  city?: string;
  state?: string;
  country?: string;
  lead_owner?: string;
  crm_status?: string;
  crm_note?: string;
  data_source?: string;
  possession_time?: string;
  description?: string;
}

export interface CSVData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ParseResult {
  records: CRMLead[];
  skippedCount: number;
  totalCount: number;
  mappingLog?: string; // Explanation of how fields were mapped by AI
}
