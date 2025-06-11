import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Star, 
  Download, 
  ExternalLink,
  Zap,
  Users,
  FileText,
  Bell,
  RotateCcw,
  MessageSquare,
  Shield,
  Sparkles,
  TrendingUp,
  Clock,
  X,
  Check,
  Globe
} from 'lucide-react';
import { Card } from '../components/common/Card';

interface App {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'AI' | 'Automation' | 'Communication' | 'Files';
  rating: number;
  downloads: number;
  price: 'Free' | number;
  screenshots: string[];
  permissions: string[];
  integrations: string[];
  developer: {
    name: string;
    website?: string;
  };
  featured?: boolean;
  installed?: boolean;
}

const Marketplace: React.FC = () => {
  const [apps, setApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Apps', icon: Sparkles },
    { id: 'AI', name: 'AI & Intelligence', icon: Zap },
    { id: 'Automation', name: 'Automation', icon: RotateCcw },
    { id: 'Communication', name: 'Communication', icon: MessageSquare },
    { id: 'Files', name: 'Files & Storage', icon: FileText },
  ];

  useEffect(() => {
    loadApps();
  }, []);

  useEffect(() => {
    filterApps();
  }, [apps, selectedCategory, searchTerm]);

  const loadApps = async () => {
    try {
      setLoading(true);
      
      // Mock featured apps data
      const mockApps: App[] = [
        {
          id: 'shadowclone',
          name: 'ShadowClone',
          shortDescription: 'Smart project and task duplicator with AI-powered optimization',
          longDescription: 'ShadowClone revolutionizes project management by intelligently duplicating your successful projects and tasks. Using advanced AI algorithms, it analyzes your past projects to identify patterns and automatically optimizes new duplicates for better performance. Perfect for agencies and teams that handle similar projects repeatedly.',
          icon: RotateCcw,
          category: 'Automation',
          rating: 4.8,
          downloads: 12500,
          price: 'Free',
          screenshots: [
            'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
            'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg'
          ],
          permissions: ['Read deals', 'Create tasks', 'Modify projects'],
          integrations: ['Deals', 'Tasks', 'Projects', 'Calendar'],
          developer: {
            name: 'ShadowTech Solutions',
            website: 'https://shadowtech.com'
          },
          featured: true
        },
        {
          id: 'echomind',
          name: 'EchoMind',
          shortDescription: 'Advanced team sentiment tracker and mood analytics',
          longDescription: 'EchoMind provides deep insights into your team\'s emotional well-being and productivity patterns. Using natural language processing and sentiment analysis, it tracks team morale, identifies potential burnout risks, and suggests actionable improvements. Integrates seamlessly with your existing communication channels.',
          icon: Users,
          category: 'AI',
          rating: 4.6,
          downloads: 8900,
          price: 29,
          screenshots: [
            'https://images.pexels.com/photos/3184293/pexels-photo-3184293.jpeg',
            'https://images.pexels.com/photos/3184294/pexels-photo-3184294.jpeg'
          ],
          permissions: ['Read messages', 'Access user data', 'Send notifications'],
          integrations: ['Teams', 'Slack', 'Email', 'Analytics'],
          developer: {
            name: 'MindTech Analytics',
            website: 'https://mindtech.ai'
          },
          featured: true
        },
        {
          id: 'papertrail',
          name: 'PaperTrail AI',
          shortDescription: 'Intelligent document clause searcher and contract analyzer',
          longDescription: 'PaperTrail AI transforms how you handle legal documents and contracts. With advanced AI-powered search capabilities, it can instantly find specific clauses, identify potential risks, and suggest improvements. Perfect for sales teams dealing with complex contracts and legal documentation.',
          icon: FileText,
          category: 'AI',
          rating: 4.9,
          downloads: 15600,
          price: 49,
          screenshots: [
            'https://images.pexels.com/photos/3184295/pexels-photo-3184295.jpeg',
            'https://images.pexels.com/photos/3184296/pexels-photo-3184296.jpeg'
          ],
          permissions: ['Read files', 'Access documents', 'Create reports'],
          integrations: ['Documents', 'Deals', 'Legal', 'Storage'],
          developer: {
            name: 'LegalTech Innovations',
            website: 'https://legaltech.com'
          },
          featured: true
        },
        {
          id: 'quiethours',
          name: 'QuietHours',
          shortDescription: 'Smart notification blocker for focused work sessions',
          longDescription: 'QuietHours intelligently manages your notifications to maximize productivity. It learns your work patterns and automatically blocks distracting notifications during focus time while ensuring critical alerts still get through. Includes smart scheduling and team coordination features.',
          icon: Bell,
          category: 'Communication',
          rating: 4.7,
          downloads: 22100,
          price: 'Free',
          screenshots: [
            'https://images.pexels.com/photos/3184297/pexels-photo-3184297.jpeg',
            'https://images.pexels.com/photos/3184298/pexels-photo-3184298.jpeg'
          ],
          permissions: ['Manage notifications', 'Access calendar', 'Read user preferences'],
          integrations: ['Notifications', 'Calendar', 'Teams', 'Focus'],
          developer: {
            name: 'Productivity Labs',
            website: 'https://productivitylabs.com'
          },
          featured: true
        },
        {
          id: 'loopback',
          name: 'LoopBack',
          shortDescription: 'Workflow time-rewind tool for process optimization',
          longDescription: 'LoopBack provides powerful workflow versioning and rollback capabilities. Track every change in your sales processes, compare different workflow versions, and instantly revert to previous states when needed. Includes detailed analytics on workflow performance and optimization suggestions.',
          icon: Clock,
          category: 'Automation',
          rating: 4.5,
          downloads: 7800,
          price: 39,
          screenshots: [
            'https://images.pexels.com/photos/3184299/pexels-photo-3184299.jpeg',
            'https://images.pexels.com/photos/3184300/pexels-photo-3184300.jpeg'
          ],
          permissions: ['Read workflows', 'Modify processes', 'Access history'],
          integrations: ['Workflows', 'Automation', 'Analytics', 'History'],
          developer: {
            name: 'TimeFlow Systems',
            website: 'https://timeflow.io'
          },
          featured: true
        },
        {
          id: 'pocketnegotiator',
          name: 'Pocket Negotiator',
          shortDescription: 'AI-powered negotiation coach for closing deals',
          longDescription: 'Pocket Negotiator is your personal AI coach for sales negotiations. It analyzes deal data, customer interactions, and market conditions to provide real-time negotiation advice. Features include objection handling suggestions, pricing optimization, and post-negotiation analysis to continuously improve your skills.',
          icon: TrendingUp,
          category: 'AI',
          rating: 4.9,
          downloads: 18300,
          price: 59,
          screenshots: [
            'https://images.pexels.com/photos/3184301/pexels-photo-3184301.jpeg',
            'https://images.pexels.com/photos/3184302/pexels-photo-3184302.jpeg'
          ],
          permissions: ['Read deals', 'Access communications', 'View pricing data'],
          integrations: ['Deals', 'Contacts', 'Analytics', 'Communication'],
          developer: {
            name: 'NegotiateAI',
            website: 'https://negotiateai.com'
          },
          featured: true
        },
        {
          id: 'databridge',
          name: 'DataBridge',
          shortDescription: 'Seamless data integration across multiple platforms',
          longDescription: 'DataBridge connects your CRM with over 100 external platforms, ensuring your data stays synchronized across your entire tech stack. Features automated data cleaning, duplicate detection, and custom mapping rules.',
          icon: Globe,
          category: 'Automation',
          rating: 4.7,
          downloads: 14200,
          price: 29,
          screenshots: [
            'https://images.pexels.com/photos/3184303/pexels-photo-3184303.jpeg'
          ],
          permissions: ['Read/write data', 'External API access', 'Modify records'],
          integrations: ['All modules', 'External APIs'],
          developer: {
            name: 'Integration Solutions',
            website: 'https://integrationsolutions.com'
          }
        },
        {
          id: 'securelock',
          name: 'SecureLock',
          shortDescription: 'Advanced security and compliance management',
          longDescription: 'SecureLock enhances your CRM security with advanced threat protection, compliance monitoring, and data access controls. Includes GDPR, HIPAA, and CCPA compliance tools.',
          icon: Shield,
          category: 'Files',
          rating: 4.8,
          downloads: 9600,
          price: 49,
          screenshots: [
            'https://images.pexels.com/photos/3184304/pexels-photo-3184304.jpeg'
          ],
          permissions: ['Security settings', 'User permissions', 'Audit logs'],
          integrations: ['Users', 'Security', 'Files', 'Audit'],
          developer: {
            name: 'CyberShield Security',
            website: 'https://cybershield.com'
          }
        }
      ];
      
      setApps(mockApps);
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterApps = () => {
    let filtered = [...apps];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(app => app.category === selectedCategory);
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(term) || 
        app.shortDescription.toLowerCase().includes(term)
      );
    }
    
    setFilteredApps(filtered);
  };

  const handleInstallApp = (app: App) => {
    setApps(prev => prev.map(a => 
      a.id === app.id ? { ...a, installed: true } : a
    ));
    setSelectedApp(null);
    setShowModal(false);
  };

  const handleUninstallApp = (app: App) => {
    if (confirm(`Are you sure you want to uninstall ${app.name}?`)) {
      setApps(prev => prev.map(a => 
        a.id === app.id ? { ...a, installed: false } : a
      ));
    }
  };

  const formatPrice = (price: 'Free' | number) => {
    return price === 'Free' ? 'Free' : `$${price}/mo`;
  };

  const formatDownloads = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">App Marketplace</h1>
          <p className="text-dark-400">Extend your CRM with powerful integrations and tools</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent w-full"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-accent text-white'
                    : 'bg-dark-200 text-dark-400 hover:text-white hover:bg-dark-300'
                }`}
              >
                <category.icon className="w-4 h-4" />
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Featured Apps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-400" />
            <span>Featured Apps</span>
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredApps
            .filter(app => app.featured)
            .map(app => (
              <Card 
                key={app.id} 
                className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden"
                hover
                onClick={() => {
                  setSelectedApp(app);
                  setShowModal(true);
                }}
              >
                {/* Background Gradient */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-full -translate-y-10 translate-x-10" />
                
                <div className="flex items-start space-x-4 relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <app.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-white">{app.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-400" />
                        <span className="text-sm text-white">{app.rating}</span>
                      </div>
                    </div>
                    
                    <p className="text-dark-400 text-sm mb-4 line-clamp-2">{app.shortDescription}</p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-400 flex items-center space-x-1">
                        <Download className="w-3 h-3" />
                        <span>{formatDownloads(app.downloads)}</span>
                      </span>
                      
                      <span className={`text-sm ${app.price === 'Free' ? 'text-green-400' : 'text-white'}`}>
                        {formatPrice(app.price)}
                      </span>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-dark-200 flex items-center justify-between">
                      <span className="text-xs px-2 py-1 rounded bg-dark-200 text-dark-400">
                        {app.category}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          app.installed ? handleUninstallApp(app) : handleInstallApp(app);
                        }}
                        className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                          app.installed
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-accent text-white hover:bg-accent/80'
                        }`}
                      >
                        {app.installed ? 'Uninstall' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </div>

      {/* All Apps */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">All Apps</h2>
          <span className="text-sm text-dark-400">{filteredApps.length} apps available</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {filteredApps.map(app => (
            <Card 
              key={app.id} 
              className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              hover
              onClick={() => {
                setSelectedApp(app);
                setShowModal(true);
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <app.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">{app.name}</h3>
              </div>
              
              <p className="text-dark-400 text-sm mb-4 line-clamp-2">{app.shortDescription}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 rounded bg-dark-200 text-dark-400">
                    {app.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-white">{app.rating}</span>
                  </div>
                </div>
                
                <span className={`text-sm ${app.price === 'Free' ? 'text-green-400' : 'text-white'}`}>
                  {formatPrice(app.price)}
                </span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-dark-200 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    app.installed ? handleUninstallApp(app) : handleInstallApp(app);
                  }}
                  className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                    app.installed
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-accent text-white hover:bg-accent/80'
                  }`}
                >
                  {app.installed ? 'Uninstall' : 'Add'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Guru Suggests */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Guru Suggests</h3>
            <p className="text-sm text-dark-400">Personalized app recommendations based on your usage</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {apps
            .filter(app => ['echomind', 'papertrail', 'pocketnegotiator'].includes(app.id))
            .map(app => (
              <div 
                key={app.id}
                className="flex items-start space-x-3 p-4 bg-dark-200/50 rounded-lg cursor-pointer hover:bg-dark-200 transition-colors"
                onClick={() => {
                  setSelectedApp(app);
                  setShowModal(true);
                }}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <app.icon className="w-4 h-4 text-white" />
                </div>
                
                <div>
                  <h4 className="font-medium text-white mb-1">{app.name}</h4>
                  <p className="text-xs text-dark-400 line-clamp-2 mb-2">{app.shortDescription}</p>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs ${app.price === 'Free' ? 'text-green-400' : 'text-white'}`}>
                      {formatPrice(app.price)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-xs text-white">{app.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* App Detail Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-dark-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple-500 rounded-lg flex items-center justify-center">
                  <selectedApp.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedApp.name}</h2>
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-dark-400">{selectedApp.category}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400" />
                      <span className="text-white">{selectedApp.rating}</span>
                    </div>
                    <span className="text-dark-400">{formatDownloads(selectedApp.downloads)} downloads</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setSelectedApp(null);
                  setShowModal(false);
                }}
                className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
              >
                <X className="w-5 h-5 text-dark-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                    <p className="text-dark-400">{selectedApp.longDescription}</p>
                  </div>

                  {/* Screenshots */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Screenshots</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedApp.screenshots.map((screenshot, index) => (
                        <div key={index} className="rounded-lg overflow-hidden border border-dark-200">
                          <img 
                            src={screenshot} 
                            alt={`${selectedApp.name} screenshot ${index + 1}`}
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Integrations */}
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-3">Integrates With</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.integrations.map((integration, index) => (
                        <span 
                          key={index}
                          className="bg-dark-200 text-dark-400 px-3 py-1 rounded-lg text-sm"
                        >
                          {integration}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* App Info */}
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-dark-400 mb-1">Price</p>
                        <p className={`font-medium ${selectedApp.price === 'Free' ? 'text-green-400' : 'text-white'}`}>
                          {formatPrice(selectedApp.price)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-dark-400 mb-1">Developer</p>
                        <p className="font-medium text-white">{selectedApp.developer.name}</p>
                        {selectedApp.developer.website && (
                          <a 
                            href={selectedApp.developer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-accent hover:text-accent/80 flex items-center space-x-1 mt-1"
                          >
                            <Globe className="w-3 h-3" />
                            <span>Visit website</span>
                          </a>
                        )}
                      </div>
                      
                      <div>
                        <p className="text-sm text-dark-400 mb-1">Permissions Required</p>
                        <div className="space-y-2">
                          {selectedApp.permissions.map((permission, index) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <Check className="w-3 h-3 text-green-400" />
                              <span className="text-white">{permission}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Action Button */}
                  <button
                    onClick={() => selectedApp.installed ? handleUninstallApp(selectedApp) : handleInstallApp(selectedApp)}
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      selectedApp.installed
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-accent hover:bg-accent/80 text-white'
                    }`}
                  >
                    {selectedApp.installed ? 'Uninstall' : 'Add to CRM'}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {filteredApps.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No apps found</h3>
          <p className="text-dark-400 mb-6">Try adjusting your search or filters</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;