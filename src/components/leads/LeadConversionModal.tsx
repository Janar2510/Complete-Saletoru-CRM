import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, User, Building2, Tag, Percent, ChevronRight } from 'lucide-react';
import { Contact } from '../../types/contacts';
import { CreateDealData, PipelineStage, Pipeline } from '../../types/deals';
import { DealsAPI } from '../../lib/deals-api';
import { Card } from '../common/Card';
import { useNavigate } from 'react-router-dom';

interface LeadConversionModalProps {
  lead: Contact;
  onClose: () => void;
  onConversionComplete: () => void;
}

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({ 
  lead, 
  onClose, 
  onConversionComplete 
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Partial<CreateDealData>>({
    title: '',
    description: '',
    value: 0,
    currency: 'USD',
    stage_id: '',
    pipeline_id: '',
    contact_id: lead.id,
    company_id: lead.company_id,
    probability: 0,
    expected_close_date: '',
    tags: lead.tags || [],
  });

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      const pipelinesData = await DealsAPI.getPipelines();
      setPipelines(pipelinesData);
      
      // Select default pipeline
      if (pipelinesData.length > 0) {
        const defaultPipeline = pipelinesData.find(p => p.is_default) || pipelinesData[0];
        setFormData(prev => ({ ...prev, pipeline_id: defaultPipeline.id }));
        loadStages(defaultPipeline.id);
      }
    } catch (error) {
      console.error('Error loading pipelines:', error);
    }
  };

  const loadStages = async (pipelineId: string) => {
    try {
      const stagesData = await DealsAPI.getPipelineStages(pipelineId);
      setStages(stagesData);
      
      // Select first stage by default
      if (stagesData.length > 0) {
        setFormData(prev => ({ 
          ...prev, 
          stage_id: stagesData[0].id,
          probability: stagesData[0].probability
        }));
      }
    } catch (error) {
      console.error('Error loading stages:', error);
    }
  };

  const handlePipelineChange = (pipelineId: string) => {
    setFormData(prev => ({ ...prev, pipeline_id: pipelineId }));
    loadStages(pipelineId);
  };

  const handleStageChange = (stageId: string) => {
    const selectedStage = stages.find(stage => stage.id === stageId);
    setFormData(prev => ({ 
      ...prev, 
      stage_id: stageId,
      probability: selectedStage?.probability || 0
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title?.trim()) {
      newErrors.title = 'Deal title is required';
    }

    if (!formData.stage_id) {
      newErrors.stage_id = 'Stage is required';
    }

    if (!formData.pipeline_id) {
      newErrors.pipeline_id = 'Pipeline is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Create the deal
      const dealData: CreateDealData = {
        title: formData.title || '',
        description: formData.description,
        value: formData.value || 0,
        currency: formData.currency || 'USD',
        stage_id: formData.stage_id || '',
        pipeline_id: formData.pipeline_id || '',
        contact_id: lead.id,
        company_id: lead.company_id,
        probability: formData.probability || 0,
        expected_close_date: formData.expected_close_date,
        tags: formData.tags,
      };

      const newDeal = await DealsAPI.createDeal(dealData);
      
      // Create a note about the conversion
      await DealsAPI.createDealNote(
        newDeal.id,
        `This deal was converted from lead: ${lead.first_name} ${lead.last_name}.\n\nLead score at time of conversion: ${lead.lead_score || 0}/100`,
        'general'
      );
      
      // Update contact status to reflect conversion
      await ContactsAPI.updateContact({
        id: lead.id,
        status: 'prospect'
      });
      
      onConversionComplete();
      
      // Navigate to the deals page
      navigate('/deals');
    } catch (error) {
      console.error('Error converting lead to deal:', error);
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
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  // Generate a suggested deal title based on lead info
  useEffect(() => {
    if (!formData.title) {
      let title = '';
      
      if (lead.company?.name) {
        title = `${lead.company.name} - `;
      }
      
      title += `${lead.first_name} ${lead.last_name}`;
      
      setFormData(prev => ({ ...prev, title }));
    }
  }, [lead]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-200">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Convert Lead to Deal
              </h2>
              <p className="text-dark-400 text-sm mt-1">
                Create a new deal from {lead.first_name} {lead.last_name}
              </p>
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
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>
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
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Pipeline *
                </label>
                <select
                  value={formData.pipeline_id}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.pipeline_id ? 'border-red-500' : 'border-dark-300'
                  }`}
                >
                  <option value="">Select pipeline</option>
                  {pipelines.map(pipeline => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </option>
                  ))}
                </select>
                {errors.pipeline_id && <p className="text-red-400 text-sm mt-1">{errors.pipeline_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Stage *
                </label>
                <select
                  value={formData.stage_id}
                  onChange={(e) => handleStageChange(e.target.value)}
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

            {/* Contact and Company Info (Read-only) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Contact
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    value={`${lead.first_name} ${lead.last_name}`}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white focus:outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Company
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="text"
                    value={lead.company?.name || 'No company'}
                    readOnly
                    className="w-full pl-10 pr-3 py-2 bg-dark-200/50 border border-dark-300 rounded-lg text-white focus:outline-none cursor-not-allowed"
                  />
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
                {formData.tags?.map(tag => (
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
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  <span>Convert to Deal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};