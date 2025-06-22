import { supabase, isSupabaseConfigured } from './supabase';
import type { Deal, DealFormData, Pipeline, PipelineStage, KanbanColumn, DealFilters, DealNote, DealFile, DealActivity, EmailThread, DealFolder, CloudStorageConnection, LeadScoreLog } from '../types/deals';

export class DealsAPI {
  static async getDeals(filters?: DealFilters): Promise<Deal[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning mock data');
      return this.getMockDeals();
    }

    try {
      let query = supabase
        .from('deals')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          companies (
            id,
            name,
            domain
          ),
          pipeline_stages (
            id,
            name,
            color,
            probability,
            position
          ),
          pipelines (
            id,
            name,
            is_default
          )
        `);

      // Apply filters
      if (filters) {
        if (filters.pipeline_id) {
          query = query.eq('pipeline_id', filters.pipeline_id);
        }
        
        if (filters.stage_id) {
          query = query.eq('stage_id', filters.stage_id);
        }
        
        if (filters.owner_id) {
          query = query.eq('owner_id', filters.owner_id);
        }
        
        if (filters.company_id) {
          query = query.eq('company_id', filters.company_id);
        }
        
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        if (filters.search) {
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,deal_id.ilike.%${filters.search}%`);
        }
        
        if (filters.engagement_score_min !== undefined) {
          query = query.gte('engagement_score', filters.engagement_score_min);
        }
        
        if (filters.engagement_score_max !== undefined) {
          query = query.lte('engagement_score', filters.engagement_score_max);
        }
        
        if (filters.date_range) {
          if (filters.date_range.start) {
            query = query.gte('created_at', filters.date_range.start);
          }
          if (filters.date_range.end) {
            query = query.lte('created_at', filters.date_range.end);
          }
        }
        
        if (filters.last_activity_range) {
          if (filters.last_activity_range.start) {
            query = query.gte('last_activity_at', filters.last_activity_range.start);
          }
          if (filters.last_activity_range.end) {
            query = query.lte('last_activity_at', filters.last_activity_range.end);
          }
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals:', error);
        throw new Error(`Failed to fetch deals: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deals:', error);
      // Return mock data as fallback
      console.warn('Falling back to mock data due to connection error');
      return this.getMockDeals();
    }
  }

  static async getPipelines(): Promise<Pipeline[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning mock pipelines');
      return this.getMockPipelines();
    }

    try {
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching pipelines:', error);
        throw new Error(`Failed to fetch pipelines: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pipelines:', error);
      return this.getMockPipelines();
    }
  }

  static async getCompanies(): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning mock companies');
      return this.getMockCompanies();
    }

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, domain')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching companies:', error);
        throw new Error(`Failed to fetch companies: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching companies:', error);
      return this.getMockCompanies();
    }
  }

  static async getContacts(): Promise<any[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.warn('Supabase not configured, returning mock contacts');
      return this.getMockContacts();
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email, phone')
        .order('first_name', { ascending: true });

      if (error) {
        console.error('Error fetching contacts:', error);
        throw new Error(`Failed to fetch contacts: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching contacts:', error);
      return this.getMockContacts();
    }
  }

  static async getDealById(id: string): Promise<Deal | null> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getMockDeals().find(deal => deal.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          companies (
            id,
            name,
            domain
          ),
          pipeline_stages (
            id,
            name,
            color,
            probability
          ),
          pipelines (
            id,
            name,
            is_default
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching deal:', error);
        throw new Error(`Failed to fetch deal: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error fetching deal:', error);
      return null;
    }
  }

  static async createDeal(dealData: DealFormData): Promise<Deal> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Generate a unique deal ID
      const dealId = await this.generateDealId();
      
      const { data, error } = await supabase
        .from('deals')
        .insert([{
          ...dealData,
          deal_id: dealId,
          created_by: (await supabase.auth.getUser()).data.user?.id,
          engagement_score: 40, // Default starting score
          last_activity_at: new Date().toISOString()
        }])
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            email
          ),
          companies (
            id,
            name
          ),
          pipeline_stages (
            id,
            name,
            color,
            probability
          )
        `)
        .single();

      if (error) {
        console.error('Error creating deal:', error);
        throw new Error(`Failed to create deal: ${error.message}`);
      }

      // Log activity for the new deal
      await this.logDealActivity(data.id, 'created', 'Deal created');

      return data;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  }

  static async updateDeal(id: string, dealData: Partial<DealFormData>): Promise<Deal> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get current deal data for comparison
      const { data: currentDeal } = await supabase
        .from('deals')
        .select('*')
        .eq('id', id)
        .single();
      
      // Update the deal
      const { data, error } = await supabase
        .from('deals')
        .update({
          ...dealData,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            email
          ),
          companies (
            id,
            name
          ),
          pipeline_stages (
            id,
            name,
            color,
            probability
          )
        `)
        .single();

      if (error) {
        console.error('Error updating deal:', error);
        throw new Error(`Failed to update deal: ${error.message}`);
      }

      // Log activity for the update
      await this.logDealActivity(id, 'updated', 'Deal updated');
      
      // If stage changed, log a specific activity
      if (currentDeal && dealData.stage_id && currentDeal.stage_id !== dealData.stage_id) {
        // Get stage names
        const { data: stages } = await supabase
          .from('pipeline_stages')
          .select('id, name')
          .in('id', [currentDeal.stage_id, dealData.stage_id]);
        
        if (stages) {
          const fromStage = stages.find(s => s.id === currentDeal.stage_id)?.name || 'Unknown';
          const toStage = stages.find(s => s.id === dealData.stage_id)?.name || 'Unknown';
          
          await this.logDealActivity(
            id, 
            'stage_changed', 
            `Deal moved from ${fromStage} to ${toStage}`,
            { from_stage: fromStage, to_stage: toStage }
          );
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating deal:', error);
      throw error;
    }
  }

  static async deleteDeal(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting deal:', error);
        throw new Error(`Failed to delete deal: ${error.message}`);
      }
    } catch (error) {
      console.error('Error deleting deal:', error);
      throw error;
    }
  }

  static async moveDealToStage(dealId: string, stageId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get current deal data
      const { data: currentDeal, error: fetchError } = await supabase
        .from('deals')
        .select('stage_id')
        .eq('id', dealId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Get stage data to update probability
      const { data: stageData, error: stageError } = await supabase
        .from('pipeline_stages')
        .select('probability')
        .eq('id', stageId)
        .single();
      
      if (stageError) throw stageError;
      
      // Update the deal
      const { error } = await supabase
        .from('deals')
        .update({ 
          stage_id: stageId,
          probability: stageData.probability,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString()
        })
        .eq('id', dealId);

      if (error) throw error;
      
      // Log stage change activity
      if (currentDeal && currentDeal.stage_id !== stageId) {
        // Get stage names
        const { data: stages } = await supabase
          .from('pipeline_stages')
          .select('id, name')
          .in('id', [currentDeal.stage_id, stageId]);
        
        if (stages) {
          const fromStage = stages.find(s => s.id === currentDeal.stage_id)?.name || 'Unknown';
          const toStage = stages.find(s => s.id === stageId)?.name || 'Unknown';
          
          await this.logDealActivity(
            dealId, 
            'stage_changed', 
            `Deal moved from ${fromStage} to ${toStage}`,
            { from_stage: fromStage, to_stage: toStage }
          );
        }
      }
    } catch (error) {
      console.error('Error moving deal to stage:', error);
      throw error;
    }
  }

  static async getPipelineStages(pipelineId: string): Promise<PipelineStage[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getMockStages();
    }

    try {
      const { data, error } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching pipeline stages:', error);
        throw new Error(`Failed to fetch pipeline stages: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      return this.getMockStages();
    }
  }
  
  static async getDealsByStage(stageId: string): Promise<Deal[]> {
    if (!isSupabaseConfigured || !supabase) {
      return this.getMockDeals().filter(deal => deal.stage_id === stageId);
    }

    try {
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          contacts (
            id,
            first_name,
            last_name,
            email
          ),
          companies (
            id,
            name
          ),
          pipeline_stages (
            id,
            name,
            color,
            probability
          )
        `)
        .eq('stage_id', stageId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deals by stage:', error);
        throw new Error(`Failed to fetch deals by stage: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deals by stage:', error);
      return [];
    }
  }
  
  static async getKanbanData(pipelineId: string): Promise<KanbanColumn[]> {
    try {
      // Get pipeline stages
      const stages = await this.getPipelineStages(pipelineId);
      
      // Get deals for this pipeline
      const deals = await this.getDeals({ pipeline_id: pipelineId });
      
      // Group deals by stage
      const columns: KanbanColumn[] = stages.map(stage => {
        const stageDeals = deals.filter(deal => deal.stage_id === stage.id);
        const totalValue = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
        
        return {
          stage,
          deals: stageDeals,
          totalValue,
          count: stageDeals.length
        };
      });
      
      return columns;
    } catch (error) {
      console.error('Error loading kanban data:', error);
      throw error;
    }
  }
  
  static async getDealNotes(dealId: string): Promise<DealNote[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('deal_notes')
        .select(`
          *
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deal notes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deal notes:', error);
      return [];
    }
  }
  
  static async createDealNote(dealId: string, content: string, noteType: DealNote['note_type'] = 'general'): Promise<DealNote> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('deal_notes')
        .insert([{
          deal_id: dealId,
          content,
          note_type: noteType,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select(`
          *
        `)
        .single();

      if (error) {
        console.error('Error creating deal note:', error);
        throw error;
      }
      
      // Log activity
      await this.logDealActivity(dealId, 'note_added', 'Note added to deal');
      
      // Update deal engagement score
      await this.updateDealEngagementScore(dealId, 3, 'Note added');

      return data;
    } catch (error) {
      console.error('Error creating deal note:', error);
      throw error;
    }
  }
  
  static async getDealFiles(dealId: string): Promise<DealFile[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('deal_files')
        .select(`
          *
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deal files:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deal files:', error);
      return [];
    }
  }
  
  static async uploadDealFile(dealId: string, file: File, category: DealFile['category'] = 'other'): Promise<DealFile> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `deals/${dealId}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('deal-files')
        .upload(filePath, file);

      if (storageError) {
        console.error('Error uploading file to storage:', storageError);
        throw storageError;
      }

      // Create file record in database
      const { data, error } = await supabase
        .from('deal_files')
        .insert([{
          deal_id: dealId,
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          storage_path: filePath,
          storage_provider: 'supabase',
          category,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select(`
          *
        `)
        .single();

      if (error) {
        console.error('Error creating file record:', error);
        throw error;
      }
      
      // Log activity
      await this.logDealActivity(dealId, 'file_uploaded', 'File uploaded to deal');
      
      // Update deal engagement score
      await this.updateDealEngagementScore(dealId, 5, 'File uploaded');

      return data;
    } catch (error) {
      console.error('Error uploading deal file:', error);
      throw error;
    }
  }
  
  static async getDealActivities(dealId: string): Promise<DealActivity[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('deal_activities')
        .select(`
          *
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deal activities:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deal activities:', error);
      return [];
    }
  }
  
  static async logDealActivity(
    dealId: string, 
    activityType: DealActivity['activity_type'], 
    description: string,
    metadata?: any
  ): Promise<DealActivity> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('deal_activities')
        .insert([{
          deal_id: dealId,
          activity_type: activityType,
          description,
          metadata,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error logging deal activity:', error);
        throw error;
      }
      
      // Update deal last activity timestamp
      await supabase
        .from('deals')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', dealId);

      return data;
    } catch (error) {
      console.error('Error logging deal activity:', error);
      throw error;
    }
  }
  
  static async getEmailThreadsForDeal(dealId: string): Promise<EmailThread[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('email_threads')
        .select(`
          *,
          messages:email_messages (
            *
          )
        `)
        .eq('deal_id', dealId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching email threads:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching email threads:', error);
      return [];
    }
  }
  
  static async createEmailThread(
    subject: string,
    dealId: string,
    contactId?: string
  ): Promise<EmailThread> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // Get user email
      const { data: user } = await supabase.auth.getUser();
      const userEmail = user.user?.email || 'user@example.com';
      
      // Get contact email if contactId is provided
      let contactEmail = '';
      let contactName = '';
      
      if (contactId) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('email, first_name, last_name')
          .eq('id', contactId)
          .single();
        
        if (contact) {
          contactEmail = contact.email || '';
          contactName = `${contact.first_name} ${contact.last_name}`;
        }
      }
      
      // Create participants array
      const participants = [
        { email: userEmail, name: user.user?.user_metadata?.full_name || 'User' }
      ];
      
      if (contactEmail) {
        participants.push({ email: contactEmail, name: contactName });
      }
      
      // Create thread
      const { data, error } = await supabase
        .from('email_threads')
        .insert([{
          subject,
          deal_id: dealId,
          contact_id: contactId,
          participants,
          message_count: 0,
          status: 'active',
          created_by: user.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating email thread:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating email thread:', error);
      throw error;
    }
  }
  
  static async getDealFolders(dealId: string): Promise<DealFolder[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('deal_folders')
        .select(`
          *,
          storage_connection (
            id,
            provider
          )
        `)
        .eq('deal_id', dealId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching deal folders:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching deal folders:', error);
      return [];
    }
  }
  
  static async getCloudStorageConnections(): Promise<CloudStorageConnection[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('cloud_storage_connections')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cloud storage connections:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching cloud storage connections:', error);
      return [];
    }
  }
  
  static async createCloudStorageConnection(
    provider: CloudStorageConnection['provider'],
    accessToken: string,
    refreshToken: string,
    expiresAt: Date,
    providerUserId: string
  ): Promise<CloudStorageConnection> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('cloud_storage_connections')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          provider,
          provider_user_id: providerUserId,
          access_token: accessToken,
          refresh_token: refreshToken,
          token_expires_at: expiresAt.toISOString(),
          is_active: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating cloud storage connection:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating cloud storage connection:', error);
      throw error;
    }
  }
  
  static async createDealFolder(
    dealId: string,
    storageConnectionId: string,
    folderName: string,
    folderPath: string
  ): Promise<DealFolder> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      // In a real implementation, this would create a folder in the cloud storage
      // For demo purposes, we'll create a mock folder
      const folderId = `folder-${Date.now()}`;
      const folderUrl = `https://example.com/folders/${folderId}`;
      
      const { data, error } = await supabase
        .from('deal_folders')
        .insert([{
          deal_id: dealId,
          storage_connection_id: storageConnectionId,
          folder_name: folderName,
          folder_id: folderId,
          folder_path: folderPath,
          folder_url: folderUrl,
          sync_enabled: true,
          created_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating deal folder:', error);
        throw error;
      }
      
      // Log activity
      await this.logDealActivity(
        dealId, 
        'file_uploaded', 
        'Cloud folder created for deal',
        { folder_name: folderName, folder_url: folderUrl }
      );

      return data;
    } catch (error) {
      console.error('Error creating deal folder:', error);
      throw error;
    }
  }
  
  static async updateDealFolder(
    folderId: string,
    updates: Partial<DealFolder>
  ): Promise<DealFolder> {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error('Supabase not configured');
    }

    try {
      const { data, error } = await supabase
        .from('deal_folders')
        .update(updates)
        .eq('id', folderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating deal folder:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating deal folder:', error);
      throw error;
    }
  }
  
  static async getLeadScoreLogs(entityType: 'deal' | 'contact', entityId: string): Promise<LeadScoreLog[]> {
    if (!isSupabaseConfigured || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('lead_score_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lead score logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching lead score logs:', error);
      return [];
    }
  }
  
  static async updateDealEngagementScore(
    dealId: string, 
    changeAmount: number, 
    reason: string
  ): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    try {
      // Get current score
      const { data: deal, error: fetchError } = await supabase
        .from('deals')
        .select('engagement_score')
        .eq('id', dealId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentScore = deal?.engagement_score || 0;
      const newScore = Math.max(0, Math.min(100, currentScore + changeAmount));
      
      // Update score
      const { error: updateError } = await supabase
        .from('deals')
        .update({ engagement_score: newScore })
        .eq('id', dealId);
      
      if (updateError) throw updateError;
      
      // Log score change
      const { error: logError } = await supabase
        .from('lead_score_logs')
        .insert([{
          entity_type: 'deal',
          entity_id: dealId,
          previous_score: currentScore,
          new_score: newScore,
          change_reason: reason,
          change_source: 'automatic',
          created_by: (await supabase.auth.getUser()).data.user?.id
        }]);
      
      if (logError) throw logError;
    } catch (error) {
      console.error('Error updating deal engagement score:', error);
    }
  }
  
  // Generate a unique deal ID (e.g., DEAL-2025-001)
  static async generateDealId(): Promise<string> {
    const year = new Date().getFullYear();
    
    if (!isSupabaseConfigured || !supabase) {
      // For mock data, generate a random ID
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `DEAL-${year}-${randomNum}`;
    }
    
    try {
      // Get the count of deals created this year
      const { count, error } = await supabase
        .from('deals')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${year}-01-01`)
        .lte('created_at', `${year}-12-31`);
      
      if (error) throw error;
      
      // Generate the next number in sequence
      const nextNum = ((count || 0) + 1).toString().padStart(3, '0');
      return `DEAL-${year}-${nextNum}`;
    } catch (error) {
      console.error('Error generating deal ID:', error);
      // Fallback to random ID
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `DEAL-${year}-${randomNum}`;
    }
  }
  
  // Subscribe to real-time updates
  static subscribeToDealUpdates(callback: (payload: any) => void) {
    if (!isSupabaseConfigured || !supabase) {
      return {
        unsubscribe: () => {}
      };
    }
    
    return supabase
      .channel('deals-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'deals' },
        callback
      )
      .subscribe();
  }

  // Mock data for fallback
  private static getMockDeals(): Deal[] {
    return [
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        deal_id: 'DEAL-2025-001',
        title: 'Enterprise Software Package',
        description: 'Annual license for enterprise software',
        value: 75000,
        currency: 'USD',
        stage_id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        contact_id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        company_id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        owner_id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        probability: 50,
        expected_close_date: '2025-07-15',
        status: 'open',
        tags: ['enterprise', 'software', 'annual'],
        engagement_score: 82,
        last_activity_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        created_by: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        stage: {
          id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
          pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Proposal',
          probability: 50,
          position: 3,
          color: '#F59E0B',
          created_at: '2025-01-01T00:00:00Z'
        },
        contact: {
          id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@example.com'
        },
        company: {
          id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Acme Corp'
        }
      },
      {
        id: 'a1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        deal_id: 'DEAL-2025-002',
        title: 'Cloud Infrastructure',
        description: 'Cloud migration and infrastructure setup',
        value: 45000,
        currency: 'USD',
        stage_id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        contact_id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        company_id: 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        owner_id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        probability: 25,
        expected_close_date: '2025-08-30',
        status: 'open',
        tags: ['cloud', 'migration'],
        engagement_score: 76,
        last_activity_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: '2025-02-10T14:30:00Z',
        updated_at: '2025-02-10T14:30:00Z',
        created_by: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        stage: {
          id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
          pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'Qualified',
          probability: 25,
          position: 2,
          color: '#3B82F6',
          created_at: '2025-01-01T00:00:00Z'
        },
        contact: {
          id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          first_name: 'Sarah',
          last_name: 'Johnson',
          email: 'sarah.j@example.com'
        },
        company: {
          id: 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          name: 'TechCorp'
        }
      }
    ];
  }

  private static getMockPipelines(): Pipeline[] {
    return [
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Sales Pipeline',
        description: 'Main sales pipeline',
        is_default: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        created_by: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      },
      {
        id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Enterprise Pipeline',
        description: 'Pipeline for enterprise deals',
        is_default: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        created_by: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
      }
    ];
  }

  private static getMockStages(): PipelineStage[] {
    return [
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Lead',
        color: '#6B7280',
        probability: 10,
        position: 1,
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
        name: 'Qualified',
        color: '#3B82F6',
        probability: 25,
        position: 2,
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13',
        name: 'Proposal',
        color: '#F59E0B',
        probability: 50,
        position: 3,
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
        name: 'Negotiation',
        color: '#F97316',
        probability: 75,
        position: 4,
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
        name: 'Closed Won',
        color: '#10B981',
        probability: 100,
        position: 5,
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
        name: 'Closed Lost',
        color: '#EF4444',
        probability: 0,
        position: 6,
        pipeline_id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        created_at: '2025-01-01T00:00:00Z'
      }
    ];
  }

  private static getMockCompanies(): any[] {
    return [
      {
        id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Acme Corp',
        domain: 'acme.com'
      },
      {
        id: 'e1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'TechCorp',
        domain: 'techcorp.com'
      },
      {
        id: 'e2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Global Industries',
        domain: 'global-industries.com'
      }
    ];
  }

  private static getMockContacts(): any[] {
    return [
      {
        id: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@example.com',
        phone: '+1-555-0123'
      },
      {
        id: 'd1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        first_name: 'Sarah',
        last_name: 'Johnson',
        email: 'sarah.j@example.com',
        phone: '+1-555-0124'
      },
      {
        id: 'd2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        first_name: 'Michael',
        last_name: 'Brown',
        email: 'michael.b@example.com',
        phone: '+1-555-0125'
      }
    ];
  }
}