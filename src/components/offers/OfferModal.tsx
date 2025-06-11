import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, User, Building2, Calendar, Eye } from 'lucide-react';
import { Offer, CreateOfferData, UpdateOfferData } from '../../types/offers';
import { OffersAPI } from '../../lib/offers-api';
import { Card } from '../common/Card';

interface OfferModalProps {
  offer?: Offer | null;
  onSave: (offerData: CreateOfferData | UpdateOfferData) => void;
  onClose: () => void;
}

export const OfferModal: React.FC<OfferModalProps> = ({ offer, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    contact_id: '',
    deal_id: '',
    expires_at: '',
  });

  const [contacts, setContacts] = useState<any[]>([]);
  const [deals, setDeals] = useState<any[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    loadFormData();
  }, []);

  useEffect(() => {
    if (offer) {
      setFormData({
        title: offer.title,
        description: offer.description || '',
        contact_id: offer.contact_id,
        deal_id: offer.deal_id || '',
        expires_at: offer.expires_at ? offer.expires_at.split('T')[0] : '',
      });
    }
  }, [offer]);

  const loadFormData = async () => {
    try {
      const [contactsData, dealsData] = await Promise.all([
        OffersAPI.getContacts(),
        OffersAPI.getDeals(),
      ]);

      setContacts(contactsData);
      setDeals(dealsData);
    } catch (error) {
      console.error('Error loading form data:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.contact_id) {
      newErrors.contact_id = 'Contact is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const offerData = {
        ...formData,
        deal_id: formData.deal_id || undefined,
        expires_at: formData.expires_at || undefined,
      };

      if (offer) {
        onSave({ id: offer.id, ...offerData } as UpdateOfferData);
      } else {
        onSave(offerData as CreateOfferData);
      }
    } catch (error) {
      console.error('Error saving offer:', error);
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

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handlePreview = () => {
    // TODO: Implement preview functionality
    console.log('Preview offer');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={(e) => handleSubmit(e, false)}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-dark-200">
            <h2 className="text-xl font-semibold text-white">
              {offer ? 'Edit Offer' : 'Create New Offer'}
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
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Offer Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.title ? 'border-red-500' : 'border-dark-300'
                  }`}
                  placeholder="Enter offer title"
                />
                {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Contact *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <select
                    value={formData.contact_id}
                    onChange={(e) => handleInputChange('contact_id', e.target.value)}
                    className={`w-full pl-10 pr-3 py-2 bg-dark-200 border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                      errors.contact_id ? 'border-red-500' : 'border-dark-300'
                    }`}
                  >
                    <option value="">Select contact</option>
                    {contacts.map(contact => (
                      <option key={contact.id} value={contact.id}>
                        {contact.first_name} {contact.last_name} {contact.company && `(${contact.company.name})`}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.contact_id && <p className="text-red-400 text-sm mt-1">{errors.contact_id}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Associated Deal (Optional)
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <select
                    value={formData.deal_id}
                    onChange={(e) => handleInputChange('deal_id', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  >
                    <option value="">Select deal</option>
                    {deals.map(deal => (
                      <option key={deal.id} value={deal.id}>
                        {deal.title} - ${deal.value.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">
                  Expiration Date (Optional)
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => handleInputChange('expires_at', e.target.value)}
                    className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
                rows={6}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="Enter offer description..."
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Attachments
              </label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive 
                    ? 'border-accent bg-accent/10' 
                    : 'border-dark-300 hover:border-dark-200'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-dark-400" />
                  <span className="text-dark-400">
                    Drop files here or click to upload
                  </span>
                  <span className="text-xs text-dark-500">
                    PDF, DOC, TXT, JPG, PNG up to 10MB each
                  </span>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-dark-200/50 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-5 h-5 text-dark-400" />
                        <div>
                          <p className="font-medium text-white">{file.name}</p>
                          <p className="text-sm text-dark-400">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-dark-200">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="bg-dark-200 hover:bg-dark-300 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
              >
                Save as Draft
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
              >
                {loading ? 'Saving...' : (offer ? 'Update & Send' : 'Create & Send')}
              </button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};