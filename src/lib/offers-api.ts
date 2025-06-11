import { supabase } from './supabase';
import { 
  Offer, 
  OfferFile, 
  OfferActivity, 
  EmailTemplate, 
  EmailTemplateVersion,
  CreateOfferData, 
  UpdateOfferData,
  CreateEmailTemplateData,
  UpdateEmailTemplateData,
  OfferFilters,
  EmailTemplateFilters
} from '../types/offers';

export class OffersAPI {
  // Offer CRUD operations
  static async getOffers(filters?: OfferFilters, limit = 50, offset = 0): Promise<Offer[]> {
    let query = supabase
      .from('offers')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, company:companies(name)),
        deal:deals(id, title, value, stage:pipeline_stages(name))
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (filters) {
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.contact_id) query = query.eq('contact_id', filters.contact_id);
      if (filters.deal_id) query = query.eq('deal_id', filters.deal_id);
      if (filters.created_by) query = query.eq('created_by', filters.created_by);
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.start)
          .lte('created_at', filters.date_range.end);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getOfferById(id: string): Promise<Offer | null> {
    const { data, error } = await supabase
      .from('offers')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, phone, company:companies(name)),
        deal:deals(id, title, value, stage:pipeline_stages(name))
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async createOffer(offerData: CreateOfferData): Promise<Offer> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('offers')
      .insert({
        ...offerData,
        created_by: user.user.id,
      })
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, company:companies(name)),
        deal:deals(id, title, value, stage:pipeline_stages(name))
      `)
      .single();

    if (error) throw error;

    // Log activity
    await this.createOfferActivity(data.id, 'created', 'Offer created');

    return data;
  }

  static async updateOffer(offerData: UpdateOfferData): Promise<Offer> {
    const { id, ...updateData } = offerData;
    
    const { data, error } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, company:companies(name)),
        deal:deals(id, title, value, stage:pipeline_stages(name))
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteOffer(id: string): Promise<void> {
    const { error } = await supabase
      .from('offers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async sendOffer(id: string): Promise<Offer> {
    const trackingId = `offer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('offers')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        tracking_id: trackingId,
      })
      .eq('id', id)
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, company:companies(name)),
        deal:deals(id, title, value, stage:pipeline_stages(name))
      `)
      .single();

    if (error) throw error;

    // Log activity
    await this.createOfferActivity(id, 'sent', 'Offer sent to contact');

    return data;
  }

  static async trackOfferView(trackingId: string, metadata?: any): Promise<void> {
    const { data: offer } = await supabase
      .from('offers')
      .select('id, status')
      .eq('tracking_id', trackingId)
      .single();

    if (!offer) return;

    // Update offer status if first view
    if (offer.status === 'sent') {
      await supabase
        .from('offers')
        .update({
          status: 'viewed',
          viewed_at: new Date().toISOString(),
        })
        .eq('tracking_id', trackingId);
    }

    // Log activity
    await this.createOfferActivity(
      offer.id, 
      'viewed', 
      'Offer viewed by recipient',
      {
        ...metadata,
        timestamp: new Date().toISOString(),
      }
    );
  }

  static async updateOfferStatus(id: string, status: Offer['status'], metadata?: any): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'accepted' || status === 'declined') {
      updateData.responded_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('offers')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    // Log activity
    await this.createOfferActivity(
      id, 
      status, 
      `Offer ${status}`,
      metadata
    );
  }

  // Offer Files
  static async getOfferFiles(offerId: string): Promise<OfferFile[]> {
    const { data, error } = await supabase
      .from('offer_files')
      .select(`
        *,
        uploaded_by
      `)
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async uploadOfferFile(offerId: string, file: File): Promise<OfferFile> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `offers/${offerId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('offer-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Save file record to database
    const { data, error } = await supabase
      .from('offer_files')
      .insert({
        offer_id: offerId,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: filePath,
        storage_provider: 'supabase',
        uploaded_by: user.user.id,
      })
      .select(`
        *,
        uploaded_by
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteOfferFile(fileId: string): Promise<void> {
    // Get file info first
    const { data: file, error: fetchError } = await supabase
      .from('offer_files')
      .select('storage_path')
      .eq('id', fileId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('offer-files')
      .remove([file.storage_path]);

    if (storageError) throw storageError;

    // Delete from database
    const { error } = await supabase
      .from('offer_files')
      .delete()
      .eq('id', fileId);

    if (error) throw error;
  }

  // Offer Activities
  static async getOfferActivities(offerId: string): Promise<OfferActivity[]> {
    const { data, error } = await supabase
      .from('offer_activities')
      .select('*')
      .eq('offer_id', offerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createOfferActivity(
    offerId: string,
    activityType: OfferActivity['activity_type'],
    description: string,
    metadata?: any
  ): Promise<OfferActivity> {
    const { data, error } = await supabase
      .from('offer_activities')
      .insert({
        offer_id: offerId,
        activity_type: activityType,
        description,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Email Templates
  static async getEmailTemplates(filters?: EmailTemplateFilters): Promise<EmailTemplate[]> {
    let query = supabase
      .from('email_templates')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filters) {
      if (filters.category) query = query.eq('category', filters.category);
      if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  static async getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  static async createEmailTemplate(templateData: CreateEmailTemplateData): Promise<EmailTemplate> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('email_templates')
      .insert({
        ...templateData,
        version: 1,
        created_by: user.user.id,
      })
      .select('*')
      .single();

    if (error) throw error;

    // Create initial version
    await this.createTemplateVersion(data.id, 1, templateData.subject, templateData.content, 'Initial version');

    return data;
  }

  static async updateEmailTemplate(templateData: UpdateEmailTemplateData): Promise<EmailTemplate> {
    const { id, ...updateData } = templateData;
    
    // Get current template for version comparison
    const currentTemplate = await this.getEmailTemplateById(id);
    if (!currentTemplate) throw new Error('Template not found');

    const newVersion = currentTemplate.version + 1;
    
    const { data, error } = await supabase
      .from('email_templates')
      .update({
        ...updateData,
        version: newVersion,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    // Create new version if content changed
    if (updateData.subject !== currentTemplate.subject || updateData.content !== currentTemplate.content) {
      await this.createTemplateVersion(
        id, 
        newVersion, 
        updateData.subject || currentTemplate.subject, 
        updateData.content || currentTemplate.content,
        'Template updated'
      );
    }

    return data;
  }

  static async deleteEmailTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async incrementTemplateUsage(id: string): Promise<void> {
    const { error } = await supabase
      .from('email_templates')
      .update({
        usage_count: supabase.sql`usage_count + 1`,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  // Template Versions
  static async getTemplateVersions(templateId: string): Promise<EmailTemplateVersion[]> {
    const { data, error } = await supabase
      .from('email_template_versions')
      .select('*')
      .eq('template_id', templateId)
      .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createTemplateVersion(
    templateId: string,
    version: number,
    subject: string,
    content: string,
    changesSummary?: string
  ): Promise<EmailTemplateVersion> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('email_template_versions')
      .insert({
        template_id: templateId,
        version,
        subject,
        content,
        changes_summary: changesSummary,
        created_by: user.user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Utility functions
  static async getContacts(): Promise<any[]> {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        company:companies(name)
      `)
      .order('first_name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  static async getDeals(): Promise<any[]> {
    const { data, error } = await supabase
      .from('deals')
      .select(`
        id,
        title,
        value,
        stage:pipeline_stages(name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Real-time subscriptions
  static subscribeToOfferUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('offers-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'offers' },
        callback
      )
      .subscribe();
  }

  static subscribeToTemplateUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('templates-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'email_templates' },
        callback
      )
      .subscribe();
  }
}