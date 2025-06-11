import { supabase, isSupabaseConfigured } from './supabase';
import { Company, CompanyFilters } from '../types/contacts';

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  company?: {
    id: string;
    name: string;
  };
  lead_score?: number;
  status: string;
  owner_id?: string;
  country_code?: string;
  created_at: string;
  updated_at: string;
}

// Mock data for when Supabase is not configured
const mockContacts: Contact[] = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@acmecorp.com',
    phone: '+1-555-0123',
    title: 'CTO',
    company: { id: '1', name: 'Acme Corp' },
    lead_score: 85,
    status: 'active',
    owner_id: '1',
    country_code: '+1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.j@techcorp.com',
    phone: '+1-555-0124',
    title: 'VP Engineering',
    company: { id: '2', name: 'TechCorp' },
    lead_score: 78,
    status: 'active',
    owner_id: '1',
    country_code: '+1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    first_name: 'Michael',
    last_name: 'Brown',
    email: 'mbrown@global.com',
    phone: '+1-555-0125',
    title: 'Director of IT',
    company: { id: '3', name: 'Global Industries' },
    lead_score: 72,
    status: 'active',
    owner_id: '1',
    country_code: '+1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily@startup.com',
    phone: '+1-555-0126',
    title: 'Founder',
    company: { id: '4', name: 'Startup Inc' },
    lead_score: 65,
    status: 'active',
    owner_id: '1',
    country_code: '+1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    first_name: 'David',
    last_name: 'Wilson',
    email: 'dwilson@enterprise.com',
    phone: '+1-555-0127',
    title: 'IT Manager',
    company: { id: '5', name: 'Enterprise Solutions' },
    lead_score: 58,
    status: 'active',
    owner_id: '1',
    country_code: '+1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock companies data
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'Acme Corp',
    domain: 'acmecorp.com',
    industry: 'Technology',
    size: '201-500',
    phone: '+1-555-0100',
    email: 'info@acmecorp.com',
    website: 'https://acmecorp.com',
    annual_revenue: 50000000,
    employee_count: 350,
    status: 'customer',
    founded_year: 2010,
    description: 'Leading technology solutions provider',
    contacts_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'TechCorp',
    domain: 'techcorp.com',
    industry: 'Technology',
    size: '51-200',
    phone: '+1-555-0200',
    email: 'contact@techcorp.com',
    website: 'https://techcorp.com',
    annual_revenue: 25000000,
    employee_count: 150,
    status: 'prospect',
    founded_year: 2015,
    description: 'Innovative tech startup',
    contacts_count: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Global Industries',
    domain: 'global.com',
    industry: 'Manufacturing',
    size: '1000+',
    phone: '+1-555-0300',
    email: 'info@global.com',
    website: 'https://global.com',
    annual_revenue: 500000000,
    employee_count: 2500,
    status: 'active',
    founded_year: 1985,
    description: 'Global manufacturing leader',
    contacts_count: 8,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Startup Inc',
    domain: 'startup.com',
    industry: 'Technology',
    size: '11-50',
    phone: '+1-555-0400',
    email: 'hello@startup.com',
    website: 'https://startup.com',
    annual_revenue: 2000000,
    employee_count: 25,
    status: 'prospect',
    founded_year: 2020,
    description: 'Fast-growing startup',
    contacts_count: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Enterprise Solutions',
    domain: 'enterprise.com',
    industry: 'Consulting',
    size: '501-1000',
    phone: '+1-555-0500',
    email: 'contact@enterprise.com',
    website: 'https://enterprise.com',
    annual_revenue: 75000000,
    employee_count: 750,
    status: 'customer',
    founded_year: 2005,
    description: 'Enterprise consulting services',
    contacts_count: 12,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export class ContactsAPI {
  static async getContacts(): Promise<Contact[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Using mock contacts data - Supabase not configured');
      return mockContacts;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          company:companies(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contacts:', error);
        return mockContacts;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getContacts:', error);
      return mockContacts;
    }
  }

  static async getCompanies(filters?: CompanyFilters): Promise<Company[]> {
    if (!isSupabaseConfigured || !supabase) {
      console.log('Using mock companies data - Supabase not configured');
      let filteredCompanies = [...mockCompanies];

      // Apply filters to mock data
      if (filters) {
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filteredCompanies = filteredCompanies.filter(company =>
            company.name.toLowerCase().includes(searchLower) ||
            company.industry?.toLowerCase().includes(searchLower) ||
            company.description?.toLowerCase().includes(searchLower)
          );
        }

        if (filters.status) {
          filteredCompanies = filteredCompanies.filter(company => company.status === filters.status);
        }

        if (filters.industry) {
          filteredCompanies = filteredCompanies.filter(company => company.industry === filters.industry);
        }

        if (filters.size) {
          filteredCompanies = filteredCompanies.filter(company => company.size === filters.size);
        }
      }

      return filteredCompanies;
    }

    try {
      let query = supabase
        .from('companies')
        .select(`
          *,
          contacts_count:contacts(count)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.search) {
          query = query.or(`name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        if (filters.status) {
          query = query.eq('status', filters.status);
        }

        if (filters.industry) {
          query = query.eq('industry', filters.industry);
        }

        if (filters.size) {
          query = query.eq('size', filters.size);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching companies:', error);
        return mockCompanies;
      }

      // Transform the data to match the expected format
      const companies = data?.map(company => ({
        ...company,
        contacts_count: Array.isArray(company.contacts_count) ? company.contacts_count.length : company.contacts_count?.count || 0
      })) || [];

      return companies;
    } catch (error) {
      console.error('Error in getCompanies:', error);
      return mockCompanies;
    }
  }

  static async getContact(id: string): Promise<Contact | null> {
    if (!isSupabaseConfigured || !supabase) {
      return mockContacts.find(c => c.id === id) || null;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select(`
          *,
          company:companies(id, name)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching contact:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getContact:', error);
      return null;
    }
  }

  static async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>): Promise<Contact> {
    if (!isSupabaseConfigured || !supabase) {
      const newContact: Contact = {
        ...contact,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockContacts.unshift(newContact);
      return newContact;
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([contact])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating contact:', error);
      throw error;
    }
  }

  static async updateContact(id: string, updates: Partial<Contact>): Promise<Contact> {
    if (!isSupabaseConfigured || !supabase) {
      const index = mockContacts.findIndex(c => c.id === id);
      if (index !== -1) {
        mockContacts[index] = { ...mockContacts[index], ...updates, updated_at: new Date().toISOString() };
        return mockContacts[index];
      }
      throw new Error('Contact not found');
    }

    try {
      const { data, error } = await supabase
        .from('contacts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating contact:', error);
      throw error;
    }
  }

  static async deleteContact(id: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) {
      const index = mockContacts.findIndex(c => c.id === id);
      if (index !== -1) {
        mockContacts.splice(index, 1);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      throw error;
    }
  }
}