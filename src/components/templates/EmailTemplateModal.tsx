import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Code, Smartphone, Monitor, Tag, Plus } from 'lucide-react';
import { EmailTemplate, CreateEmailTemplateData, UpdateEmailTemplateData } from '../../types/offers';
import { Card } from '../common/Card';

interface EmailTemplateModalProps {
  template?: EmailTemplate | null;
  onSave: (templateData: CreateEmailTemplateData | UpdateEmailTemplateData) => void;
  onClose: () => void;
}

export const EmailTemplateModal: React.FC<EmailTemplateModalProps> = ({ template, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    content: '',
    category: '',
    tags: [] as string[],
    variables: [] as string[],
  });

  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'html'>('edit');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [newTag, setNewTag] = useState('');
  const [newVariable, setNewVariable] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category,
        tags: template.tags || [],
        variables: template.variables || [],
      });
    }
  }, [template]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Content is required';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (template) {
        onSave({ id: template.id, ...formData } as UpdateEmailTemplateData);
      } else {
        onSave(formData as CreateEmailTemplateData);
      }
    } catch (error) {
      console.error('Error saving template:', error);
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

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) }));
  };

  const handleAddVariable = () => {
    if (newVariable.trim() && !formData.variables.includes(newVariable.trim())) {
      setFormData(prev => ({ ...prev, variables: [...prev.variables, newVariable.trim()] }));
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (variableToRemove: string) => {
    setFormData(prev => ({ ...prev, variables: prev.variables.filter(variable => variable !== variableToRemove) }));
  };

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = textarea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${variable}}}` + after;
      
      handleInputChange('content', newText);
      
      // Set cursor position after the inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const renderPreview = () => {
    let processedContent = formData.content;
    
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      'first_name': 'John',
      'last_name': 'Doe',
      'company': 'Acme Corp',
      'deal_title': 'Enterprise Software Package',
      'deal_value': '$75,000',
      'sender_name': 'Jane Smith',
      'sender_title': 'Sales Manager',
    };

    formData.variables.forEach(variable => {
      const regex = new RegExp(`{{${variable}}}`, 'g');
      processedContent = processedContent.replace(regex, sampleData[variable] || `[${variable}]`);
    });

    return (
      <div className={`bg-white text-black p-6 rounded-lg ${
        previewDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
      }`}>
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="font-semibold text-lg">{formData.subject}</h3>
          <p className="text-sm text-gray-600">From: your-email@company.com</p>
        </div>
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br>') }}
        />
      </div>
    );
  };

  const categories = [
    'Follow-up',
    'Welcome',
    'Proposal',
    'Thank You',
    'Reminder',
    'Newsletter',
    'Promotion',
    'Other',
  ];

  const commonVariables = [
    'first_name',
    'last_name',
    'company',
    'deal_title',
    'deal_value',
    'sender_name',
    'sender_title',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Edit Email Template' : 'Create New Email Template'}
          </h2>
          
          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-dark-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'edit'
                    ? 'bg-accent text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'preview'
                    ? 'bg-accent text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  viewMode === 'html'
                    ? 'bg-accent text-white'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                HTML
              </button>
            </div>
            
            {viewMode === 'preview' && (
              <div className="flex bg-dark-200 rounded-lg p-1">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1 rounded transition-colors ${
                    previewDevice === 'desktop'
                      ? 'bg-accent text-white'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1 rounded transition-colors ${
                    previewDevice === 'mobile'
                      ? 'bg-accent text-white'
                      : 'text-dark-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'edit' ? (
            <div className="flex h-full">
              {/* Form */}
              <div className="w-2/3 p-6 overflow-y-auto border-r border-dark-200">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                          errors.name ? 'border-red-500' : 'border-dark-300'
                        }`}
                        placeholder="Enter template name"
                      />
                      {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                          errors.category ? 'border-red-500' : 'border-dark-300'
                        }`}
                      >
                        <option value="">Select category</option>
                        {categories.map(category => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                      {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category}</p>}
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Subject Line *
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                        errors.subject ? 'border-red-500' : 'border-dark-300'
                      }`}
                      placeholder="Enter email subject"
                    />
                    {errors.subject && <p className="text-red-400 text-sm mt-1">{errors.subject}</p>}
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Email Content *
                    </label>
                    <textarea
                      id="content-editor"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      rows={12}
                      className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent font-mono text-sm ${
                        errors.content ? 'border-red-500' : 'border-dark-300'
                      }`}
                      placeholder="Enter email content..."
                    />
                    {errors.content && <p className="text-red-400 text-sm mt-1">{errors.content}</p>}
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
                            onClick={() => handleRemoveTag(tag)}
                            className="text-accent hover:text-accent/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        className="flex-1 px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-accent hover:bg-accent/80 text-white px-3 py-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Variables Panel */}
              <div className="w-1/3 p-6 overflow-y-auto">
                <h3 className="text-lg font-semibold text-white mb-4">Variables</h3>
                
                {/* Common Variables */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-dark-400 mb-2">Common Variables</h4>
                  <div className="space-y-1">
                    {commonVariables.map(variable => (
                      <button
                        key={variable}
                        type="button"
                        onClick={() => insertVariable(variable)}
                        className="w-full text-left px-2 py-1 text-sm bg-dark-200 hover:bg-dark-300 text-white rounded transition-colors"
                      >
                        {`{{${variable}}}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Variables */}
                <div>
                  <h4 className="text-sm font-medium text-dark-400 mb-2">Custom Variables</h4>
                  <div className="space-y-2 mb-3">
                    {formData.variables.map(variable => (
                      <div key={variable} className="flex items-center justify-between bg-dark-200 rounded px-2 py-1">
                        <button
                          type="button"
                          onClick={() => insertVariable(variable)}
                          className="text-sm text-white hover:text-accent transition-colors"
                        >
                          {`{{${variable}}}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariable(variable)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newVariable}
                      onChange={(e) => setNewVariable(e.target.value)}
                      placeholder="Variable name"
                      className="flex-1 px-2 py-1 text-sm bg-dark-200 border border-dark-300 rounded text-white placeholder-dark-400 focus:outline-none focus:ring-1 focus:ring-accent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVariable();
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddVariable}
                      className="bg-accent hover:bg-accent/80 text-white px-2 py-1 rounded text-sm transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === 'preview' ? (
            <div className="p-6 overflow-y-auto bg-gray-100">
              {renderPreview()}
            </div>
          ) : (
            <div className="p-6 overflow-y-auto">
              <pre className="bg-dark-200 p-4 rounded-lg text-white text-sm overflow-x-auto">
                <code>{formData.content}</code>
              </pre>
            </div>
          )}
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
            onClick={handleSubmit}
            disabled={loading}
            className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Saving...' : (template ? 'Update Template' : 'Create Template')}</span>
          </button>
        </div>
      </Card>
    </div>
  );
};