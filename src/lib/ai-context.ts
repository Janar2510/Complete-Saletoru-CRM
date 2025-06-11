import { AIContext } from '../types/ai';

export class AIContextManager {
  private static context: AIContext = {
    user_role: 'user',
    permissions: ['read', 'write'],
    recent_activity: [],
    current_page: '/',
    selected_entities: [],
  };

  static updateContext(updates: Partial<AIContext>): void {
    this.context = { ...this.context, ...updates };
  }

  static getContext(): AIContext {
    return { ...this.context };
  }

  static setCurrentPage(page: string): void {
    this.context.current_page = page;
    
    // Add page-specific context
    if (page.startsWith('/deals')) {
      this.context.permissions.push('deals:read');
    } else if (page.startsWith('/contacts') || page.startsWith('/leads')) {
      this.context.permissions.push('contacts:read');
    } else if (page.startsWith('/analytics')) {
      this.context.permissions.push('analytics:read');
    }
  }

  static addRecentActivity(activity: any): void {
    this.context.recent_activity = [activity, ...this.context.recent_activity.slice(0, 9)];
  }

  static setSelectedEntities(entities: any[]): void {
    this.context.selected_entities = entities;
  }

  static setUserPermissions(permissions: string[]): void {
    this.context.permissions = permissions;
  }

  static hasPermission(permission: string): boolean {
    return this.context.permissions.includes(permission);
  }

  static canAccessData(dataType: string): boolean {
    const dataPermissions: Record<string, string[]> = {
      deals: ['read', 'deals:read'],
      contacts: ['read', 'contacts:read'],
      companies: ['read', 'companies:read'],
      analytics: ['read', 'analytics:read'],
      admin: ['admin'],
    };

    const requiredPermissions = dataPermissions[dataType] || ['read'];
    return requiredPermissions.some(perm => this.hasPermission(perm));
  }
  
  // New methods for enhanced CRM intelligence
  static setDealContext(dealId: string, dealTitle: string): void {
    this.context.selected_entities = [{ type: 'deal', id: dealId, title: dealTitle }];
  }
  
  static setContactContext(contactId: string, contactName: string): void {
    this.context.selected_entities = [{ type: 'contact', id: contactId, name: contactName }];
  }
  
  static setUserContext(userId: string, userName: string): void {
    this.context.selected_entities = [{ type: 'user', id: userId, name: userName }];
  }
  
  static clearEntityContext(): void {
    this.context.selected_entities = [];
  }
  
  static addPageViewActivity(page: string): void {
    this.addRecentActivity({
      type: 'page_view',
      page,
      timestamp: new Date().toISOString()
    });
  }
  
  static addDealActivity(dealId: string, activityType: string, details?: any): void {
    this.addRecentActivity({
      type: 'deal_activity',
      deal_id: dealId,
      activity_type: activityType,
      details,
      timestamp: new Date().toISOString()
    });
  }
  
  static addContactActivity(contactId: string, activityType: string, details?: any): void {
    this.addRecentActivity({
      type: 'contact_activity',
      contact_id: contactId,
      activity_type: activityType,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

// Auto-update context based on route changes
if (typeof window !== 'undefined') {
  // Listen for route changes
  const updatePageContext = () => {
    AIContextManager.setCurrentPage(window.location.pathname);
    AIContextManager.addPageViewActivity(window.location.pathname);
  };

  window.addEventListener('popstate', updatePageContext);
  
  // Initial setup
  updatePageContext();
}