import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Building2, Tag, Globe, Linkedin, Twitter } from 'lucide-react';
import { Contact, CreateContactData, UpdateContactData, Company } from '../../types/contacts';
import { ContactsAPI } from '../../lib/contacts-api';
import { Card } from '../common/Card';

interface ContactModalProps {
  contact?: Contact | null;
  onSave: (contactData: CreateContactData | UpdateContactData) => void;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ contact, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country_code: '+1',
    title: '',
    company_id: '',
    avatar_url: '',
    status: 'active' as Contact['status'],
    owner_id: '',
    lead_source: '',
    linkedin_url: '',
    twitter_url: '',
    notes: '',
    tags: [] as string[],
  });

  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [enriching, setEnriching] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (contact) {
      setFormData({
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email || '',
        phone: contact.phone || '',
        country_code: contact.country_code || '+1',
        title: contact.title || '',
        company_id: contact.company_id || '',
        avatar_url: contact.avatar_url || '',
        status: contact.status,
        owner_id: contact.owner_id || '',
        lead_source: contact.lead_source || '',
        linkedin_url: contact.linkedin_url || '',
        twitter_url: contact.twitter_url || '',
        notes: contact.notes || '',
        tags: contact.tags || [],
      });
    }
  }, [contact]);

  const loadFormData = async () => {
    try {
      const [companiesData] = await Promise.all([
        ContactsAPI.getCompanies(),
        // Load users for owner assignment
      ]);

      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const contactData = {
        ...formData,
        company_id: formData.company_id || undefined,
        owner_id: formData.owner_id || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        avatar_url: formData.avatar_url || undefined,
        lead_source: formData.lead_source || undefined,
        linkedin_url: formData.linkedin_url || undefined,
        twitter_url: formData.twitter_url || undefined,
        notes: formData.notes || undefined,
      };

      if (contact) {
        onSave({ id: contact.id, ...contactData } as UpdateContactData);
      } else {
        onSave(contactData as CreateContactData);
      }
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTagAdd = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleEnrichContact = async () => {
    if (!formData.email) return;

    setEnriching(true);
    try {
      // Mock enrichment - in real implementation, this would call external APIs
      const enrichedData = {
        linkedin_url: `https://linkedin.com/in/${formData.email.split('@')[0]}`,
        title: 'Software Engineer', // This would come from the API
        company_id: companies.find(c => c.domain === formData.email.split('@')[1])?.id || '',
      };

      setFormData(prev => ({ ...prev, ...enrichedData }));
    } catch (error) {
      console.error('Error enriching contact:', error);
    } finally {
      setEnriching(false);
    }
  };

  const countryCodes = [
    { code: '+1', country: 'US/CA' },
    { code: '+44', country: 'UK' },
    { code: '+49', country: 'DE' },
    { code: '+33', country: 'FR' },
    { code: '+81', country: 'JP' },
    { code: '+86', country: 'CN' },
  ];

  const leadSources = [
    'Website',
    'Referral',
    'Social Media',
    'Cold Outreach',
    'Event',
    'Advertisement',
    'Partner',
    'Other',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-200">
            <h2 className="text-xl font-semibold text-white">
              {contact ? 'Edit Contact' : 'Create New Contact'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  First Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                      errors.first_name ? 'border-red-500' : 'border-dark-300'
                    }`}
                    placeholder="Enter first name"
                  />
                </div>
                {errors.first_name && <p className="text-red-400 text-sm mt-1">{errors.first_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.last_name ? 'border-red-500' : 'border-dark-300'
                  }`}
                  placeholder="Enter last name"
                />
                {errors.last_name && <p className="text-red-400 text-sm mt-1">{errors.last_name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-dark-300'
                    }`}
                    placeholder="Enter email address"
                  />
                  {formData.email && !contact && (
                    <button
                      type="button"
                      onClick={handleEnrichContact}
                      disabled={enriching}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs bg-accent text-white px-2 py-1 rounded"
                    >
                      {enriching ? 'Enriching...' : 'Enrich'}
                    </button>
                  )}
                </div>
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Phone
                </label>
                <div className="flex space-x-2">
                  <select
                    value={formData.country_code}
                    onChange={(e) => handleInputChange('country_code', e.target.value)}
                    className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    {countryCodes.map(({ code, country }) => (
                      <option key={code} value={code}>
                        {code} ({country})
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="Enter job title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <select
                    value={formData.company_id}
                    onChange={(e) => handleInputChange('company_id', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Status and Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="prospect">Prospect</option>
                  <option value="customer">Customer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Lead Source
                </label>
                <select
                  value={formData.lead_source}
                  onChange={(e) => handleInputChange('lead_source', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">Select source</option>
                  {leadSources.map(source => (
                    <option key={source} value={source.toLowerCase().replace(' ', '_')}>
                      {source}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Owner
                </label>
                <select
                  value={formData.owner_id}
                  onChange={(e) => handleInputChange('owner_id', e.target.value)}
                  className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                >
                  <option value="">Assign to user</option>
                  {/* Users would be loaded here */}
                </select>
              </div>
            </div>

            {/* Social Profiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  LinkedIn URL
                </label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Twitter URL
                </label>
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="url"
                    value={formData.twitter_url}
                    onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="https://twitter.com/username"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Add any additional notes about this contact"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-accent/20 text-accent px-2 py-1 rounded-lg text-sm flex items-center space-x-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="text-accent hover:text-accent/80"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter"
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const target = e.target as HTMLInputElement;
                    handleTagAdd(target.value.trim());
                    target.value = '';
                  }
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-dark-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              {loading ? 'Saving...' : (contact ? 'Update Contact' : 'Create Contact')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};