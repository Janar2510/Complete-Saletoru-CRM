import { supabase, isSupabaseConfigured } from './supabase';
import { ImportLog, ImportPreview, ExportOptions, BulkActionOptions, ColumnMapping } from '../types/import-export';
import { Contact, CreateContactData, BulkAction } from '../types/contacts';
import { Deal } from '../types/deals';
import { ContactsAPI } from './contacts-api';
import { DealsAPI } from './deals-api';

export class ImportExportAPI {
  // CSV Import
  static async parseCSV(file: File): Promise<ImportPreview> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvContent = event.target?.result as string;
          const rows = csvContent.split('\n').map(row => 
            row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
          );
          
          if (rows.length < 2) {
            throw new Error('CSV file must contain at least a header row and one data row');
          }
          
          const headers = rows[0];
          const dataRows = rows.slice(1).filter(row => row.length === headers.length && row.some(cell => cell));
          
          // Generate initial mapping
          const mapping: ColumnMapping[] = headers.map(header => {
            // Try to match CSV header with database field
            const normalizedHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '_');
            let dbField = '';
            
            // Simple mapping logic - can be enhanced
            if (/first.*name/i.test(header)) dbField = 'first_name';
            else if (/last.*name/i.test(header)) dbField = 'last_name';
            else if (/email/i.test(header)) dbField = 'email';
            else if (/phone/i.test(header)) dbField = 'phone';
            else if (/company/i.test(header)) dbField = 'company_name';
            else if (/title/i.test(header)) dbField = 'title';
            else if (/lead.*score/i.test(header)) dbField = 'lead_score';
            else if (/status/i.test(header)) dbField = 'status';
            else if (/source/i.test(header)) dbField = 'lead_source';
            else if (/linkedin/i.test(header)) dbField = 'linkedin_url';
            else if (/twitter/i.test(header)) dbField = 'twitter_url';
            else if (/notes/i.test(header)) dbField = 'notes';
            else if (/tags/i.test(header)) dbField = 'tags';
            
            return {
              csvHeader: header,
              dbField,
              required: ['first_name', 'last_name'].includes(dbField),
              sample: dataRows[0]?.[headers.indexOf(header)] || ''
            };
          });
          
          resolve({
            headers,
            rows: dataRows.slice(0, 5), // Preview first 5 rows
            totalRows: dataRows.length,
            mapping,
            duplicates: {
              count: 0, // Will be calculated during import
              strategy: 'update'
            }
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read CSV file'));
      };
      
      reader.readAsText(file);
    });
  }
  
  static async importContacts(
    file: File, 
    mapping: ColumnMapping[], 
    duplicateStrategy: 'skip' | 'update' | 'create_new' = 'update'
  ): Promise<ImportLog> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');
    
    try {
      // Parse CSV
      const csvContent = await file.text();
      const rows = csvContent.split('\n').map(row => 
        row.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
      );
      
      const headers = rows[0];
      const dataRows = rows.slice(1).filter(row => row.length === headers.length && row.some(cell => cell));
      
      // Prepare for import
      let successCount = 0;
      let errorCount = 0;
      const errors: any[] = [];
      
      // Check for duplicates
      const emailIndex = mapping.findIndex(m => m.dbField === 'email');
      const emails = emailIndex >= 0 ? 
        dataRows.map(row => row[headers.indexOf(mapping[emailIndex].csvHeader)]).filter(Boolean) : 
        [];
      
      let duplicates: Record<string, Contact> = {};
      
      if (emails.length > 0) {
        const { data: existingContacts } = await supabase
          .from('contacts')
          .select('*')
          .in('email', emails);
          
        duplicates = (existingContacts || []).reduce((acc, contact) => {
          if (contact.email) acc[contact.email] = contact;
          return acc;
        }, {} as Record<string, Contact>);
      }
      
      // Process rows
      for (const row of dataRows) {
        try {
          const contactData: any = {};
          
          // Map CSV data to contact fields
          mapping.forEach(map => {
            if (map.dbField && map.csvHeader) {
              const value = row[headers.indexOf(map.csvHeader)];
              if (value) {
                // Handle special fields
                if (map.dbField === 'tags') {
                  contactData[map.dbField] = value.split(';').map(tag => tag.trim());
                } else if (map.dbField === 'lead_score') {
                  contactData[map.dbField] = parseInt(value) || 0;
                } else {
                  contactData[map.dbField] = value;
                }
              }
            }
          });
          
          // Add required fields
          contactData.created_by = user.user.id;
          
          // Check for duplicates
          const email = contactData.email;
          if (email && duplicates[email]) {
            if (duplicateStrategy === 'skip') {
              continue;
            } else if (duplicateStrategy === 'update') {
              // Update existing contact
              await ContactsAPI.updateContact(duplicates[email].id, contactData);
            } else {
              // Create new (potentially duplicate) contact
              await ContactsAPI.createContact(contactData);
            }
          } else {
            // Create new contact
            await ContactsAPI.createContact(contactData);
          }
          
          successCount++;
        } catch (error) {
          errorCount++;
          errors.push({
            row: rows.indexOf(row) + 1,
            error: error instanceof Error ? error.message : String(error),
            data: row
          });
        }
      }
      
      // Log import
      const { data: importLog } = await supabase
        .from('import_logs')
        .insert({
          user_id: user.user.id,
          type: 'contacts',
          file_name: file.name,
          row_count: dataRows.length,
          success_count: successCount,
          error_count: errorCount,
          errors: errors.length > 0 ? errors : null,
          mapping: mapping.reduce((acc, map) => {
            acc[map.csvHeader] = map.dbField;
            return acc;
          }, {} as Record<string, string>)
        })
        .select()
        .single();
      
      return importLog;
    } catch (error) {
      console.error('Error importing contacts:', error);
      throw error;
    }
  }
  
  static async importCompanies(
    file: File, 
    mapping: ColumnMapping[], 
    duplicateStrategy: 'skip' | 'update' | 'create_new' = 'update'
  ): Promise<ImportLog> {
    // Similar implementation to importContacts but for companies
    // This would follow the same pattern but with company-specific fields
    
    // For now, we'll return a mock response
    return {
      id: 'mock-import-log',
      user_id: 'user-id',
      type: 'companies',
      file_name: file.name,
      row_count: 0,
      success_count: 0,
      error_count: 0,
      created_at: new Date().toISOString()
    };
  }
  
  static async importDeals(
    file: File, 
    mapping: ColumnMapping[], 
    duplicateStrategy: 'skip' | 'update' | 'create_new' = 'update'
  ): Promise<ImportLog> {
    // Similar implementation to importContacts but for deals
    // This would follow the same pattern but with deal-specific fields
    
    // For now, we'll return a mock response
    return {
      id: 'mock-import-log',
      user_id: 'user-id',
      type: 'deals',
      file_name: file.name,
      row_count: 0,
      success_count: 0,
      error_count: 0,
      created_at: new Date().toISOString()
    };
  }
  
  // CSV Export
  static async exportContacts(options: ExportOptions): Promise<string> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }
    
    try {
      // Get contacts based on filters
      let query = supabase
        .from('contacts')
        .select(`
          id, first_name, last_name, email, phone, title, status, lead_score, 
          lead_source, created_at, updated_at, last_contacted_at, last_interaction_at,
          company:companies(id, name)
        `);
      
      // Apply filters if any
      if (options.filters) {
        if (options.filters.status) query = query.eq('status', options.filters.status);
        if (options.filters.lead_score_min) query = query.gte('lead_score', options.filters.lead_score_min);
        if (options.filters.lead_score_max) query = query.lte('lead_score', options.filters.lead_score_max);
        if (options.filters.search) {
          query = query.or(`first_name.ilike.%${options.filters.search}%,last_name.ilike.%${options.filters.search}%,email.ilike.%${options.filters.search}%`);
        }
      }
      
      const { data: contacts, error } = await query;
      
      if (error) throw error;
      
      // Generate CSV
      const selectedFields = options.fields.length > 0 ? options.fields : [
        'id', 'first_name', 'last_name', 'email', 'phone', 'title', 'company.name', 
        'status', 'lead_score', 'lead_source', 'created_at'
      ];
      
      // Format headers
      const headers = selectedFields.map(field => {
        if (options.headerFormat === 'readable') {
          return field
            .split('.')
            .map(part => part
              .replace(/_/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase())
            )
            .join(' ');
        }
        return field;
      });
      
      // Format rows
      const rows = contacts?.map(contact => {
        return selectedFields.map(field => {
          // Handle nested fields (e.g., company.name)
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return contact[parent]?.[child] || '';
          }
          
          // Format dates
          if (['created_at', 'updated_at', 'last_contacted_at', 'last_interaction_at'].includes(field) && contact[field]) {
            return new Date(contact[field]).toISOString().split('T')[0];
          }
          
          return contact[field] || '';
        });
      }) || [];
      
      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return csvContent;
    } catch (error) {
      console.error('Error exporting contacts:', error);
      throw error;
    }
  }
  
  static async exportDeals(options: ExportOptions): Promise<string> {
    // Similar implementation to exportContacts but for deals
    // This would follow the same pattern but with deal-specific fields
    
    // For now, we'll return a mock CSV
    const headers = ['id', 'title', 'value', 'status', 'created_at'];
    const rows = [
      ['1', 'Sample Deal', '10000', 'open', new Date().toISOString()]
    ];
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
  
  static async exportCompanies(options: ExportOptions): Promise<string> {
    // Similar implementation to exportContacts but for companies
    // This would follow the same pattern but with company-specific fields
    
    // For now, we'll return a mock CSV
    const headers = ['id', 'name', 'industry', 'size', 'created_at'];
    const rows = [
      ['1', 'Sample Company', 'Technology', '50-100', new Date().toISOString()]
    ];
    
    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }
  
  // Bulk Actions
  static async performBulkAction(options: BulkActionOptions): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');
    
    try {
      const { entityType, entityIds, action, data } = options;
      
      // Check permissions for destructive actions
      if (action === 'delete') {
        // In a real app, check if user is admin or has delete permissions
        const { data: userRole } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.user.id)
          .single();
          
        if (userRole?.role !== 'admin') {
          throw new Error('Only administrators can perform bulk delete operations');
        }
      }
      
      // Perform action based on entity type
      switch (entityType) {
        case 'contacts':
          await this.performBulkContactAction(entityIds, action, data);
          break;
        case 'companies':
          await this.performBulkCompanyAction(entityIds, action, data);
          break;
        case 'deals':
          await this.performBulkDealAction(entityIds, action, data);
          break;
        default:
          throw new Error(`Unsupported entity type: ${entityType}`);
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      throw error;
    }
  }
  
  private static async performBulkContactAction(
    contactIds: string[], 
    action: BulkActionOptions['action'], 
    data?: any
  ): Promise<void> {
    switch (action) {
      case 'assign':
        if (!data?.owner_id) throw new Error('Owner ID is required');
        
        await supabase
          .from('contacts')
          .update({ owner_id: data.owner_id })
          .in('id', contactIds);
        break;
        
      case 'tag':
        if (!data?.tags || !Array.isArray(data.tags)) throw new Error('Tags array is required');
        
        // For each contact, get current tags and append new ones
        for (const contactId of contactIds) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('tags')
            .eq('id', contactId)
            .single();
            
          const currentTags = contact?.tags || [];
          const newTags = [...new Set([...currentTags, ...data.tags])];
          
          await supabase
            .from('contacts')
            .update({ tags: newTags })
            .eq('id', contactId);
        }
        break;
        
      case 'status':
        if (!data?.status) throw new Error('Status is required');
        
        await supabase
          .from('contacts')
          .update({ status: data.status })
          .in('id', contactIds);
        break;
        
      case 'delete':
        await supabase
          .from('contacts')
          .delete()
          .in('id', contactIds);
        break;
        
      case 'export':
        // Handled separately by export function
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
  
  private static async performBulkCompanyAction(
    companyIds: string[], 
    action: BulkActionOptions['action'], 
    data?: any
  ): Promise<void> {
    // Similar implementation to performBulkContactAction but for companies
    // This would follow the same pattern but with company-specific actions
  }
  
  private static async performBulkDealAction(
    dealIds: string[], 
    action: BulkActionOptions['action'], 
    data?: any
  ): Promise<void> {
    switch (action) {
      case 'assign':
        if (!data?.owner_id) throw new Error('Owner ID is required');
        
        await supabase
          .from('deals')
          .update({ owner_id: data.owner_id })
          .in('id', dealIds);
        break;
        
      case 'tag':
        if (!data?.tags || !Array.isArray(data.tags)) throw new Error('Tags array is required');
        
        // For each deal, get current tags and append new ones
        for (const dealId of dealIds) {
          const { data: deal } = await supabase
            .from('deals')
            .select('tags')
            .eq('id', dealId)
            .single();
            
          const currentTags = deal?.tags || [];
          const newTags = [...new Set([...currentTags, ...data.tags])];
          
          await supabase
            .from('deals')
            .update({ tags: newTags })
            .eq('id', dealId);
        }
        break;
        
      case 'stage':
        if (!data?.stage_id) throw new Error('Stage ID is required');
        
        await supabase
          .from('deals')
          .update({ 
            stage_id: data.stage_id,
            // Optionally update probability based on stage
            ...(data.probability !== undefined ? { probability: data.probability } : {})
          })
          .in('id', dealIds);
        break;
        
      case 'status':
        if (!data?.status) throw new Error('Status is required');
        
        await supabase
          .from('deals')
          .update({ status: data.status })
          .in('id', dealIds);
        break;
        
      case 'delete':
        await supabase
          .from('deals')
          .delete()
          .in('id', dealIds);
        break;
        
      case 'export':
        // Handled separately by export function
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
  
  // Import Logs
  static async getImportLogs(limit = 10, offset = 0): Promise<ImportLog[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];
    
    const { data, error } = await supabase
      .from('import_logs')
      .select('*')
      .eq('user_id', user.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error('Error fetching import logs:', error);
      return [];
    }
    
    return data || [];
  }
}