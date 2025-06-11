export interface ImportLog {
  id: string;
  user_id: string;
  type: 'contacts' | 'companies' | 'deals';
  file_name: string;
  row_count: number;
  success_count: number;
  error_count: number;
  errors?: any[];
  mapping?: Record<string, string>;
  created_at: string;
}

export interface ColumnMapping {
  csvHeader: string;
  dbField: string;
  required?: boolean;
  sample?: string;
}

export interface ImportPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  mapping: ColumnMapping[];
  duplicates?: {
    count: number;
    strategy: 'skip' | 'update' | 'create_new';
  };
}

export interface ExportOptions {
  entityType: 'contacts' | 'companies' | 'deals';
  fields: string[];
  filters?: any;
  format?: 'csv' | 'xlsx';
  includeRelations?: boolean;
  headerFormat?: 'snake_case' | 'readable';
}

export interface BulkActionOptions {
  entityType: 'contacts' | 'companies' | 'deals';
  entityIds: string[];
  action: 'assign' | 'tag' | 'status' | 'delete' | 'stage' | 'export';
  data?: any;
}