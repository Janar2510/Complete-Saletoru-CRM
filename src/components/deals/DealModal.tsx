import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, Building2, Tag, Percent } from 'lucide-react';
import { Deal, CreateDealData, UpdateDealData, PipelineStage, Company, Contact } from '../../types/deals';
import { DealsAPI } from '../../lib/deals-api';
import { Card } from '../common/Card';

interface DealModalProps {
  deal?: Deal | null;
  pipelineId: string;
  onSave: (dealData: CreateDealData | UpdateDealData) => void;
  onClose: () => void;
}

export const DealModal: React.FC<DealModalProps> = ({ deal, pipelineId, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    value: 0,
    currency: 'USD',
    stage_id: '',
    contact_id: '',
    company_id: '',
    probability: 0,
    expected_close_date: '',
    tags: [] as string[],
  });

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dealId, setDealId] = useState<string>('');

  useEffect(() => {
    loadFormData();
  }, [pipelineId]);

  useEffect(() => {
    if (deal) {
      setFormData({
        title: deal.title,
        description: deal.description || '',
        value: deal.value,
        currency: deal.currency,
        stage_id: deal.stage_id,
        contact_id: deal.contact_id || '',
        company_id: deal.company_id || '',
        probability: deal.probability,
        expected_close_date: deal.expected_close_date || '',
        tags: deal.tags || [],
      });
      setDealId(deal.deal_id);
    }
  }, [deal]);

  const loadFormData = async () => {
    try {
      const [stagesData, companiesData, contactsData] = await Promise.all([
        DealsAPI.getPipelineStages(pipelineId),
        DealsAPI.getCompanies(),
        DealsAPI.getContacts(),
      ]);

      setStages(stagesData);
      setCompanies(companiesData);
      setContacts(contactsData);

      // Set default stage if creating new deal
      if (!deal && stagesData.length > 0) {
        setFormData(prev => ({ ...prev, stage_id: stagesData[0].id }));
      }
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.stage_id) {
      newErrors.stage_id = 'Stage is required';
    }

    if (formData.value < 0) {
      newErrors.value = 'Value must be positive';
    }

    if (formData.probability < 0 || formData.probability > 100) {
      newErrors.probability = 'Probability must be between 0 and 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const dealData = {
        ...formData,
        contact_id: formData.contact_id || undefined,
        company_id: formData.company_id || undefined,
        expected_close_date: formData.expected_close_date || undefined,
      };

      if (deal) {
        onSave({ id: deal.id, ...dealData } as UpdateDealData);
      } else {
        onSave(dealData as CreateDealData);
      }
    } catch (error) {
      console.error('Error saving deal:', error);
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

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-200">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {deal ? 'Edit Deal' : 'Create New Deal'}
              </h2>
              {dealId && (
                <p className="text-sm text-dark-400 font-mono mt-1">ID: {dealId}</p>
              )}
            </div>
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Deal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-dark-300'
                  }`}
                  placeholder="Enter deal title"
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Value
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => handleInputChange('value', parseFloat(e.target.value) || 0)}
                    className={`w-full pl-10 pr-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                      errors.value ? 'border-red-500' : 'border-dark-300'
                    }`}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.value && <p className="text-red-400 text-sm mt-1">{errors.value}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Probability
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="number"
                    value={formData.probability}
                    onChange={(e) => handleInputChange('probability', parseInt(e.target.value) || 0)}
                    className={`w-full pl-10 pr-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                      errors.probability ? 'border-red-500' : 'border-dark-300'
                    }`}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                {errors.probability && <p className="text-red-400 text-sm mt-1">{errors.probability}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stage *
                </label>
                <select
                  value={formData.stage_id}
                  onChange={(e) => handleInputChange('stage_id', e.target.value)}
                  className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.stage_id ? 'border-red-500' : 'border-dark-300'
                  }`}
                >
                  <option value="">Select stage</option>
                  {stages.map(stage => (
                    <option key={stage.id} value={stage.id}>
                      {stage.name}
                    </option>
                  ))}
                </select>
                {errors.stage_id && <p className="text-red-400 text-sm mt-1">{errors.stage_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Expected Close Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="date"
                    value={formData.expected_close_date}
                    onChange={(e) => handleInputChange('expected_close_date', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Company and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Contact
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <select
                    value={formData.contact_id}
                    onChange={(e) => handleInputChange('contact_id', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select contact</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter deal description"
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
              {loading ? 'Saving...' : (deal ? 'Update Deal' : 'Create Deal')}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};