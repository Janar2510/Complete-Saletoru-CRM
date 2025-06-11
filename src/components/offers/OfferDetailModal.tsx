import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit, 
  Send, 
  Download, 
  Archive, 
  User, 
  Building2, 
  Calendar,
  FileText,
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Offer, OfferFile, OfferActivity } from '../../types/offers';
import { OffersAPI } from '../../lib/offers-api';
import { Card } from '../common/Card';
import { formatDistanceToNow } from 'date-fns';

interface OfferDetailModalProps {
  offer: Offer;
  onClose: () => void;
  onEdit: (offer: Offer) => void;
}

export const OfferDetailModal: React.FC<OfferDetailModalProps> = ({ offer, onClose, onEdit }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'activity'>('overview');
  const [files, setFiles] = useState<OfferFile[]>([]);
  const [activities, setActivities] = useState<OfferActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOfferData();
  }, [offer.id]);

  const loadOfferData = async () => {
    try {
      setLoading(true);
      const [filesData, activitiesData] = await Promise.all([
        OffersAPI.getOfferFiles(offer.id),
        OffersAPI.getOfferActivities(offer.id),
      ]);

      setFiles(filesData);
      setActivities(activitiesData);
    } catch (error) {
      console.error('Error loading offer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOffer = async () => {
    try {
      await OffersAPI.sendOffer(offer.id);
      // Refresh data
      loadOfferData();
    } catch (error) {
      console.error('Error resending offer:', error);
    }
  };

  const handleArchiveOffer = async () => {
    if (!confirm('Are you sure you want to archive this offer?')) return;
    
    try {
      await OffersAPI.updateOfferStatus(offer.id, 'expired');
      onClose();
    } catch (error) {
      console.error('Error archiving offer:', error);
    }
  };

  const getStatusColor = (status: Offer['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400';
      case 'viewed':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'accepted':
        return 'bg-green-500/20 text-green-400';
      case 'declined':
        return 'bg-red-500/20 text-red-400';
      case 'expired':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusIcon = (status: Offer['status']) => {
    switch (status) {
      case 'draft':
        return <FileText className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      case 'viewed':
        return <Eye className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      case 'expired':
        return <Clock className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getActivityIcon = (type: OfferActivity['activity_type']) => {
    switch (type) {
      case 'created':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'sent':
        return <Send className="w-4 h-4 text-green-400" />;
      case 'viewed':
        return <Eye className="w-4 h-4 text-yellow-400" />;
      case 'downloaded':
        return <Download className="w-4 h-4 text-purple-400" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'declined':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'expired':
        return <Clock className="w-4 h-4 text-orange-400" />;
      default:
        return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'files', label: 'Files', icon: FileText, count: files.length },
    { id: 'activity', label: 'Activity', icon: Activity, count: activities.length },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-xl font-semibold text-white">{offer.title}</h2>
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                {getStatusIcon(offer.status)}
                <span>{offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}</span>
              </span>
            </div>
            <p className="text-dark-400 text-sm font-mono">{offer.offer_id}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {offer.status === 'sent' && (
              <button
                onClick={handleResendOffer}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Resend</span>
              </button>
            )}
            
            <button
              onClick={() => onEdit(offer)}
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            
            <button
              onClick={handleArchiveOffer}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Archive className="w-4 h-4" />
              <span>Archive</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-dark-200">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-dark-400 hover:text-white'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="bg-dark-200 text-dark-400 text-xs px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Information */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-dark-200/50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-dark-400">Created</span>
                  </div>
                  <p className="text-white">
                    {formatDistanceToNow(new Date(offer.created_at), { addSuffix: true })}
                  </p>
                </div>
                
                {offer.sent_at && (
                  <div className="bg-dark-200/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Send className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-dark-400">Sent</span>
                    </div>
                    <p className="text-white">
                      {formatDistanceToNow(new Date(offer.sent_at), { addSuffix: true })}
                    </p>
                  </div>
                )}
                
                {offer.expires_at && (
                  <div className="bg-dark-200/50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      <span className="text-sm text-dark-400">Expires</span>
                    </div>
                    <p className="text-white">
                      {new Date(offer.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {offer.description && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Description</h3>
                  <div className="bg-dark-200/50 rounded-lg p-4">
                    <p className="text-dark-300 whitespace-pre-wrap">{offer.description}</p>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {offer.contact && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Contact Information</h3>
                  <div className="bg-dark-200/50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {offer.contact.first_name} {offer.contact.last_name}
                        </p>
                        {offer.contact.email && (
                          <p className="text-sm text-dark-400">{offer.contact.email}</p>
                        )}
                      </div>
                    </div>
                    {offer.contact.company && (
                      <div className="flex items-center space-x-2 text-sm text-dark-400">
                        <Building2 className="w-4 h-4" />
                        <span>{offer.contact.company.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Associated Deal */}
              {offer.deal && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Associated Deal</h3>
                  <div className="bg-dark-200/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{offer.deal.title}</p>
                        <p className="text-sm text-dark-400">
                          ${offer.deal.value.toLocaleString()} • {offer.deal.stage?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              {files.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                  <p className="text-dark-400">No files attached to this offer</p>
                </div>
              ) : (
                files.map(file => (
                  <div key={file.id} className="bg-dark-200/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-dark-400" />
                      <div>
                        <p className="font-medium text-white">{file.file_name}</p>
                        <p className="text-sm text-dark-400">
                          {file.file_size && `${(file.file_size / 1024 / 1024).toFixed(2)} MB`} • 
                          {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                  <p className="text-dark-400">No activity recorded for this offer</p>
                </div>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white">{activity.description}</p>
                      <p className="text-sm text-dark-400">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                      {activity.metadata && (
                        <div className="mt-2 text-xs text-dark-500">
                          <pre>{JSON.stringify(activity.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};