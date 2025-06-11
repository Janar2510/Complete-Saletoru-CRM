import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle, 
  User, 
  Target, 
  Clock,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow, parseISO, format } from 'date-fns';

interface ActivityItem {
  id: string;
  activity_type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'deal_created' | 'deal_updated';
  title: string;
  description?: string;
  metadata?: any;
  created_at: string;
  created_by: string;
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  deal?: {
    id: string;
    title: string;
  };
  created_by_user?: {
    id: string;
    email: string;
    raw_user_meta_data: {
      full_name: string;
    };
  };
}

const Activities: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    type?: string;
    contactId?: string;
    userId?: string;
    dateRange?: 'today' | 'week' | 'month' | 'all';
  }>({
    dateRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadActivities();
  }, [filters]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      
      // First, get contact activities
      let contactActivitiesQuery = supabase
        .from('contact_activities')
        .select('*');
      
      // Apply filters
      if (filters.type) {
        contactActivitiesQuery = contactActivitiesQuery.eq('activity_type', filters.type);
      }
      
      if (filters.contactId) {
        contactActivitiesQuery = contactActivitiesQuery.eq('contact_id', filters.contactId);
      }
      
      if (filters.userId) {
        contactActivitiesQuery = contactActivitiesQuery.eq('created_by', filters.userId);
      }
      
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setDate(now.getDate() - 30));
            break;
          default:
            startDate = new Date(0);
        }
        
        contactActivitiesQuery = contactActivitiesQuery.gte('created_at', startDate.toISOString());
      }
      
      const { data: contactActivitiesData, error: contactActivitiesError } = await contactActivitiesQuery
        .order('created_at', { ascending: false });
      
      if (contactActivitiesError) throw contactActivitiesError;
      
      // Get contact data for each activity
      const contactIds = contactActivitiesData
        ?.filter(a => a.contact_id)
        .map(a => a.contact_id) || [];
      
      let contactsData: any[] = [];
      if (contactIds.length > 0) {
        const { data: contacts, error: contactsError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name')
          .in('id', contactIds);
        
        if (!contactsError) {
          contactsData = contacts || [];
        }
      }
      
      // Get user data for each activity
      const userIds = contactActivitiesData?.map(a => a.created_by).filter(Boolean) || [];
      
      let usersData: any[] = [];
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, email, raw_user_meta_data')
          .in('id', userIds);
        
        if (!usersError) {
          usersData = users || [];
        }
      }
      
      // Create a map of user ID to user data
      const usersMap = usersData.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, any>);
      
      // Create a map of contact ID to contact data
      const contactsMap = contactsData.reduce((acc, contact) => {
        acc[contact.id] = contact;
        return acc;
      }, {} as Record<string, any>);
      
      // Combine contact activities with contact and user data
      const contactActivities = contactActivitiesData?.map(activity => ({
        ...activity,
        contact: contactsMap[activity.contact_id] || null,
        created_by_user: usersMap[activity.created_by] || null
      })) || [];
      
      // Now get deal activities
      let dealActivitiesQuery = supabase
        .from('deal_activities')
        .select('*');
      
      // Apply filters
      if (filters.type) {
        dealActivitiesQuery = dealActivitiesQuery.eq('activity_type', filters.type);
      }
      
      if (filters.userId) {
        dealActivitiesQuery = dealActivitiesQuery.eq('created_by', filters.userId);
      }
      
      if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        switch (filters.dateRange) {
          case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setDate(now.getDate() - 30));
            break;
          default:
            startDate = new Date(0);
        }
        
        dealActivitiesQuery = dealActivitiesQuery.gte('created_at', startDate.toISOString());
      }
      
      const { data: dealActivitiesData, error: dealActivitiesError } = await dealActivitiesQuery
        .order('created_at', { ascending: false });
      
      if (dealActivitiesError) throw dealActivitiesError;
      
      // Get deal data for each activity
      const dealIds = dealActivitiesData?.map(a => a.deal_id).filter(Boolean) || [];
      
      let dealsData: any[] = [];
      if (dealIds.length > 0) {
        const { data: deals, error: dealsError } = await supabase
          .from('deals')
          .select('id, title')
          .in('id', dealIds);
        
        if (!dealsError) {
          dealsData = deals || [];
        }
      }
      
      // Create a map of deal ID to deal data
      const dealsMap = dealsData.reduce((acc, deal) => {
        acc[deal.id] = deal;
        return acc;
      }, {} as Record<string, any>);
      
      // Combine deal activities with deal and user data
      const dealActivities = dealActivitiesData?.map(activity => ({
        ...activity,
        deal: dealsMap[activity.deal_id] || null,
        created_by_user: usersMap[activity.created_by] || null,
        activity_type: activity.activity_type === 'note_added' ? 'note' : activity.activity_type
      })) || [];
      
      // Combine all activities and sort by created_at
      const allActivities = [
        ...contactActivities,
        ...dealActivities
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setActivities(allActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
      
      // Mock data for development
      setActivities([
        {
          id: '1',
          activity_type: 'email',
          title: 'Sent follow-up email',
          description: 'Sent a follow-up email regarding the proposal',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          contact: {
            id: 'contact-1',
            first_name: 'John',
            last_name: 'Smith'
          },
          created_by_user: {
            id: 'user-1',
            email: 'user@example.com',
            raw_user_meta_data: {
              full_name: 'Jane Doe'
            }
          }
        },
        {
          id: '2',
          activity_type: 'call',
          title: 'Discovery call',
          description: 'Initial discovery call to understand requirements',
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          contact: {
            id: 'contact-2',
            first_name: 'Sarah',
            last_name: 'Johnson'
          },
          created_by_user: {
            id: 'user-1',
            email: 'user@example.com',
            raw_user_meta_data: {
              full_name: 'Jane Doe'
            }
          }
        },
        {
          id: '3',
          activity_type: 'meeting',
          title: 'Product demo',
          description: 'Demonstrated the enterprise package features',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          contact: {
            id: 'contact-1',
            first_name: 'John',
            last_name: 'Smith'
          },
          deal: {
            id: 'deal-1',
            title: 'Enterprise Software Package'
          },
          created_by_user: {
            id: 'user-1',
            email: 'user@example.com',
            raw_user_meta_data: {
              full_name: 'Jane Doe'
            }
          }
        },
        {
          id: '4',
          activity_type: 'note',
          title: 'Meeting notes',
          description: 'Client expressed interest in the premium support plan. Need to follow up with pricing details.',
          created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          contact: {
            id: 'contact-3',
            first_name: 'Michael',
            last_name: 'Brown'
          },
          created_by_user: {
            id: 'user-1',
            email: 'user@example.com',
            raw_user_meta_data: {
              full_name: 'Jane Doe'
            }
          }
        },
        {
          id: '5',
          activity_type: 'task',
          title: 'Prepare proposal',
          description: 'Create detailed proposal for cloud migration project',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          deal: {
            id: 'deal-2',
            title: 'Cloud Infrastructure'
          },
          created_by_user: {
            id: 'user-1',
            email: 'user@example.com',
            raw_user_meta_data: {
              full_name: 'Jane Doe'
            }
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleActivityExpanded = (activityId: string) => {
    const newExpanded = new Set(expandedActivities);
    if (newExpanded.has(activityId)) {
      newExpanded.delete(activityId);
    } else {
      newExpanded.add(activityId);
    }
    setExpandedActivities(newExpanded);
  };

  const getActivityIcon = (type: ActivityItem['activity_type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-5 h-5 text-blue-400" />;
      case 'call':
        return <Phone className="w-5 h-5 text-green-400" />;
      case 'meeting':
        return <Calendar className="w-5 h-5 text-purple-400" />;
      case 'note':
        return <MessageSquare className="w-5 h-5 text-yellow-400" />;
      case 'task':
        return <CheckCircle className="w-5 h-5 text-orange-400" />;
      case 'deal_created':
      case 'deal_updated':
        return <Target className="w-5 h-5 text-accent" />;
      default:
        return <Activity className="w-5 h-5 text-dark-400" />;
    }
  };

  // Apply search filter
  const filteredActivities = activities.filter(activity => {
    return (
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.contact?.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.contact?.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.deal?.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Group activities by date
  const groupedActivities: Record<string, ActivityItem[]> = {};
  
  filteredActivities.forEach(activity => {
    const date = new Date(activity.created_at).toDateString();
    if (!groupedActivities[date]) {
      groupedActivities[date] = [];
    }
    groupedActivities[date].push(activity);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Activity Timeline</h1>
          <p className="text-dark-400">Track all activities across your CRM</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
              showFilters 
                ? 'bg-accent border-accent text-white' 
                : 'bg-dark-200 border-dark-300 hover:bg-dark-300 text-dark-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={filters.type || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Activity Types</option>
              <option value="email">Emails</option>
              <option value="call">Calls</option>
              <option value="meeting">Meetings</option>
              <option value="note">Notes</option>
              <option value="task">Tasks</option>
              <option value="deal_created">Deal Created</option>
              <option value="deal_updated">Deal Updated</option>
            </select>

            <select
              value={filters.dateRange || 'all'}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as any || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <select
              value={filters.contactId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, contactId: e.target.value || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Contacts</option>
              {Array.from(new Set(activities.filter(a => a.contact).map(a => a.contact?.id))).map(contactId => {
                const contact = activities.find(a => a.contact?.id === contactId)?.contact;
                return (
                  <option key={contactId} value={contactId}>
                    {contact?.first_name} {contact?.last_name}
                  </option>
                );
              })}
            </select>

            <button
              onClick={() => {
                setFilters({
                  dateRange: 'all'
                });
              }}
              className="bg-dark-300 hover:bg-dark-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </Card>

      {/* Activity Timeline */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-dark-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No activities found</h3>
            <p className="text-dark-400">Try adjusting your filters or search criteria</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedActivities).map(([date, dateActivities]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-accent" />
                  {new Date(date).toLocaleDateString() === new Date().toLocaleDateString()
                    ? 'Today'
                    : new Date(date).toLocaleDateString() === new Date(Date.now() - 86400000).toLocaleDateString()
                    ? 'Yesterday'
                    : format(new Date(date), 'EEEE, MMMM d, yyyy')}
                </h3>
                
                <div className="space-y-4">
                  {dateActivities.map(activity => {
                    const isExpanded = expandedActivities.has(activity.id);
                    
                    return (
                      <div 
                        key={activity.id}
                        className="relative pl-8 pb-6"
                      >
                        {/* Timeline line */}
                        <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-dark-300"></div>
                        
                        {/* Activity dot */}
                        <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-dark-200 flex items-center justify-center">
                          {getActivityIcon(activity.activity_type)}
                        </div>
                        
                        {/* Activity content */}
                        <div className="bg-dark-200/50 rounded-lg p-4 ml-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-medium text-white">{activity.title}</h4>
                              <div className="flex items-center space-x-2 text-sm text-dark-400 mt-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true })}</span>
                                
                                {activity.created_by_user && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>{activity.created_by_user.raw_user_meta_data?.full_name || activity.created_by_user.email}</span>
                                    </div>
                                  </>
                                )}
                                
                                {activity.contact && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>{activity.contact.first_name} {activity.contact.last_name}</span>
                                    </div>
                                  </>
                                )}
                                
                                {activity.deal && (
                                  <>
                                    <span>•</span>
                                    <div className="flex items-center space-x-1">
                                      <Target className="w-3 h-3" />
                                      <span>{activity.deal.title}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => toggleActivityExpanded(activity.id)}
                              className="p-1 rounded hover:bg-dark-300 transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-dark-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-dark-400" />
                              )}
                            </button>
                          </div>
                          
                          {/* Expanded content */}
                          {isExpanded && activity.description && (
                            <div className="mt-3 pt-3 border-t border-dark-300">
                              <p className="text-dark-300">{activity.description}</p>
                              
                              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                                <div className="mt-3 bg-dark-300/30 p-3 rounded-lg">
                                  <p className="text-xs text-dark-400 font-mono">
                                    {JSON.stringify(activity.metadata, null, 2)}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Activities;