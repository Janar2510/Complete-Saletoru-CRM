import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  MoreHorizontal,
  Calendar,
  Tag,
  TrendingUp,
  FileText
} from 'lucide-react';
import { EmailTemplate, EmailTemplateFilters } from '../../types/offers';
import { OffersAPI } from '../../lib/offers-api';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';

interface EmailTemplatesTableProps {
  onCreateTemplate: () => void;
  onEditTemplate: (template: EmailTemplate) => void;
  onViewTemplate: (template: EmailTemplate) => void;
}

export const EmailTemplatesTable: React.FC<EmailTemplatesTableProps> = ({
  onCreateTemplate,
  onEditTemplate,
  onViewTemplate,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<EmailTemplateFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [filters]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await OffersAPI.getEmailTemplates(filters);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) return;
    
    try {
      await OffersAPI.deleteEmailTemplate(template.id);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: EmailTemplate) => {
    try {
      await OffersAPI.createEmailTemplate({
        name: `${template.name} (Copy)`,
        subject: template.subject,
        content: template.content,
        category: template.category,
        tags: template.tags,
        variables: template.variables,
      });
      loadTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-500/20 text-green-400' 
      : 'bg-gray-500/20 text-gray-400';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Templates</h1>
          <p className="text-dark-400">{templates.length} templates found</p>
        </div>
        
        <button
          onClick={onCreateTemplate}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Template</span>
        </button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search templates..."
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={filters.category || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filters.is_active !== undefined ? filters.is_active.toString() : ''}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                is_active: e.target.value === '' ? undefined : e.target.value === 'true' 
              }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>

            <button
              onClick={() => setFilters({})}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </Card>

      {/* Templates Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-200/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Template Name</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Subject</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Category</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Usage</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Last Modified</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Status</th>
                <th className="p-4 text-left text-sm font-medium text-dark-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-dark-200/30 transition-colors">
                  <td className="p-4">
                    <button
                      onClick={() => onViewTemplate(template)}
                      className="font-medium text-white hover:text-accent transition-colors text-left"
                    >
                      {template.name}
                    </button>
                    {template.tags && template.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 2 && (
                          <span className="text-xs text-dark-400">
                            +{template.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  
                  <td className="p-4">
                    <p className="text-white truncate max-w-xs">{template.subject}</p>
                  </td>
                  
                  <td className="p-4">
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs font-medium">
                      {template.category}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-dark-400" />
                      <span className="text-white">{template.usage_count}</span>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-dark-400" />
                      <span className="text-white">
                        {formatDistanceToNow(new Date(template.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </td>
                  
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(template.is_active)}`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewTemplate(template)}
                        className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                        title="View Template"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => onEditTemplate(template)}
                        className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                        title="Edit Template"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
                        title="Duplicate Template"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      
                      <button className="p-1.5 bg-dark-200 text-dark-400 rounded hover:bg-dark-300 transition-colors">
                        <MoreHorizontal className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {templates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-dark-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No templates found</h3>
            <p className="text-dark-400 mb-4">Get started by creating your first email template</p>
            <button
              onClick={onCreateTemplate}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create Template
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};