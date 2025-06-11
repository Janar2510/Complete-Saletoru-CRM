import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Building2, 
  Users, 
  DollarSign, 
  Globe,
  MapPin,
  Calendar,
  TrendingUp,
  Eye,
  Edit,
  MoreHorizontal,
  CheckSquare,
  Square
} from 'lucide-react';
import { Company, CompanyFilters } from '../types/contacts';
import { ContactsAPI } from '../lib/contacts-api';
import { Card } from '../components/common/Card';
import { formatDistanceToNow } from 'date-fns';
import { ImportExportButton } from '../components/import-export/ImportExportButton';
import { BulkActionBar } from '../components/import-export/BulkActionBar';
import { GuruImportSuggestion } from '../components/import-export/GuruImportSuggestion';
import { usePlan } from '../contexts/PlanContext';

const Organizations: React.FC = () => {
  const { currentPlan } = usePlan();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<CompanyFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [showImportSuggestion, setShowImportSuggestion] = useState(false);
  const [lastImportCount, setLastImportCount] = useState(0);

  useEffect(() => {
    loadCompanies();
  }, [filters]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await ContactsAPI.getCompanies(filters);
      setCompanies(data);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleImportComplete = () => {
    // Refresh companies after import
    loadCompanies();
    
    // Show Guru suggestion for analysis if on Team plan
    if (currentPlan === 'team') {
      setLastImportCount(10); // This would be the actual count from the import
      setShowImportSuggestion(true);
    }
  };
  
  const handleBulkActionComplete = () => {
    // Refresh companies after bulk action
    loadCompanies();
  };
  
  const handleAnalyzeImport = () => {
    // In a real app, this would trigger Guru's analysis
    alert('Guru would analyze your imported companies and suggest industry categorization and relationships');
    setShowImportSuggestion(false);
  };
  
  const handleSelectCompany = (companyId: string) => {
    if (selectedCompanyIds.includes(companyId)) {
      setSelectedCompanyIds(selectedCompanyIds.filter(id => id !== companyId));
    } else {
      setSelectedCompanyIds([...selectedCompanyIds, companyId]);
    }
  };
  
  const handleSelectAll = () => {
    if (selectedCompanyIds.length === companies.length) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(companies.map(company => company.id));
    }
  };

  const getStatusColor = (status: Company['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400';
      case 'prospect':
        return 'bg-blue-500/20 text-blue-400';
      case 'customer':
        return 'bg-purple-500/20 text-purple-400';
      case 'partner':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatRevenue = (revenue?: number) => {
    if (!revenue) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(revenue);
  };

  const formatEmployeeCount = (count?: number) => {
    if (!count) return 'Not specified';
    if (count < 1000) return count.toString();
    return `${(count / 1000).toFixed(1)}K`;
  };

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Education',
    'Real Estate',
    'Consulting',
    'Other',
  ];

  const companySizes = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+',
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
      {/* Guru suggestion after import */}
      {showImportSuggestion && (
        <div className="mb-6">
          <GuruImportSuggestion
            entityType="companies"
            importCount={lastImportCount}
            onClose={() => setShowImportSuggestion(false)}
            onAnalyze={handleAnalyzeImport}
          />
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Organizations</h1>
          <p className="text-dark-400">{companies.length} companies found</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Toggle */}
          <div className="flex bg-dark-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              List
            </button>
          </div>
          
          <ImportExportButton 
            entityType="companies"
            onImportComplete={handleImportComplete}
          />

          <button className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Company</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search companies..."
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
          
          <button
            onClick={handleSelectAll}
            className="p-2 bg-dark-200 border border-dark-300 rounded-lg hover:bg-dark-300 transition-colors"
            title="Select All"
          >
            {selectedCompanyIds.length === companies.length ? (
              <CheckSquare className="w-4 h-4 text-accent" />
            ) : (
              <Square className="w-4 h-4 text-dark-400" />
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as Company['status'] || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="prospect">Prospect</option>
              <option value="customer">Customer</option>
              <option value="partner">Partner</option>
            </select>

            <select
              value={filters.industry || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Industries</option>
              {industries.map(industry => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>

            <select
              value={filters.size || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, size: e.target.value || undefined }))}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Sizes</option>
              {companySizes.map(size => (
                <option key={size} value={size}>
                  {size} employees
                </option>
              ))}
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
      
      {/* Bulk Action Bar (shown when items are selected) */}
      {selectedCompanyIds.length > 0 && (
        <BulkActionBar
          entityType="companies"
          selectedIds={selectedCompanyIds}
          onClearSelection={() => setSelectedCompanyIds([])}
          onActionComplete={handleBulkActionComplete}
          availableActions={['assign', 'tag', 'status', 'delete', 'export']}
          statuses={['active', 'inactive', 'prospect', 'customer', 'partner']}
          tags={['Key Account', 'Enterprise', 'SMB', 'Startup', 'Partner']}
        />
      )}

      {/* Companies Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card key={company.id} className="p-6 hover:shadow-lg transition-all duration-200 relative" hover>
              {/* Selection Checkbox */}
              <div className="absolute top-3 right-3">
                <button onClick={() => handleSelectCompany(company.id)}>
                  {selectedCompanyIds.includes(company.id) ? (
                    <CheckSquare className="w-4 h-4 text-accent" />
                  ) : (
                    <Square className="w-4 h-4 text-dark-400" />
                  )}
                </button>
              </div>
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    {company.logo_url ? (
                      <img 
                        src={company.logo_url} 
                        alt={company.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{company.name}</h3>
                    <p className="text-sm text-dark-400">{company.industry}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                {company.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="w-4 h-4 text-dark-400" />
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 transition-colors"
                    >
                      {company.website}
                    </a>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="flex items-center space-x-1 text-dark-400 mb-1">
                      <Users className="w-3 h-3" />
                      <span>Employees</span>
                    </div>
                    <p className="text-white">{formatEmployeeCount(company.employee_count)}</p>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-1 text-dark-400 mb-1">
                      <DollarSign className="w-3 h-3" />
                      <span>Revenue</span>
                    </div>
                    <p className="text-white text-xs">{formatRevenue(company.annual_revenue)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Users className="w-4 h-4 text-dark-400" />
                  <span className="text-white">{company.contacts_count || 0} contacts</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                  {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                </span>
                
                <div className="flex items-center space-x-1">
                  <button className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors">
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-200/50">
                <tr>
                  <th className="p-4 text-left">
                    <button onClick={handleSelectAll}>
                      {selectedCompanyIds.length === companies.length ? (
                        <CheckSquare className="w-4 h-4 text-accent" />
                      ) : (
                        <Square className="w-4 h-4 text-dark-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Company</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Industry</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Size</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Revenue</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Contacts</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-dark-200/30 transition-colors">
                    <td className="p-4">
                      <button onClick={() => handleSelectCompany(company.id)}>
                        {selectedCompanyIds.includes(company.id) ? (
                          <CheckSquare className="w-4 h-4 text-accent" />
                        ) : (
                          <Square className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          {company.logo_url ? (
                            <img 
                              src={company.logo_url} 
                              alt={company.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <Building2 className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{company.name}</p>
                          {company.website && (
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-accent hover:text-accent/80 transition-colors"
                            >
                              {company.website}
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white">{company.industry || 'Not specified'}</span>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white">{formatEmployeeCount(company.employee_count)}</span>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white">{formatRevenue(company.annual_revenue)}</span>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white">{company.contacts_count || 0}</span>
                    </td>
                    
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(company.status)}`}>
                        {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors">
                          <Eye className="w-3 h-3" />
                        </button>
                        <button className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors">
                          <Edit className="w-3 h-3" />
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
        </Card>
      )}

      {companies.length === 0 && (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No companies found</h3>
          <p className="text-dark-400 mb-6">Get started by adding your first company</p>
          <button className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg transition-colors">
            Add Company
          </button>
        </Card>
      )}
    </div>
  );
};

export default Organizations;