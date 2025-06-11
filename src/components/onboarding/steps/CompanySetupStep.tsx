import React, { useState } from 'react';
import { Building2, Upload, X } from 'lucide-react';

interface CompanySetupStepProps {
  data: {
    name: string;
    logo: string;
    industry: string;
    size: string;
  };
  setData: (data: any) => void;
}

export const CompanySetupStep: React.FC<CompanySetupStepProps> = ({ data, setData }) => {
  const [logoPreview, setLogoPreview] = useState<string | null>(data.logo || null);
  
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
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real app, this would upload to storage
      // For now, we'll just create a data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        setLogoPreview(dataUrl);
        setData({ ...data, logo: dataUrl });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveLogo = () => {
    setLogoPreview(null);
    setData({ ...data, logo: '' });
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Enter your company name"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Industry
          </label>
          <select
            value={data.industry}
            onChange={(e) => setData({ ...data, industry: e.target.value })}
            className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select industry</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Company Size
        </label>
        <select
          value={data.size}
          onChange={(e) => setData({ ...data, size: e.target.value })}
          className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Select company size</option>
          {companySizes.map((size) => (
            <option key={size} value={size}>
              {size} employees
            </option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-white mb-2">
          Company Logo
        </label>
        
        {logoPreview ? (
          <div className="relative w-32 h-32 bg-dark-200 rounded-lg overflow-hidden">
            <img 
              src={logoPreview} 
              alt="Company logo" 
              className="w-full h-full object-contain"
            />
            <button
              onClick={handleRemoveLogo}
              className="absolute top-2 right-2 p-1 bg-dark-300/80 rounded-full hover:bg-dark-400/80 transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed border-dark-300 rounded-lg p-6 text-center">
            <input
              type="file"
              id="logo-upload"
              className="hidden"
              accept="image/*"
              onChange={handleLogoChange}
            />
            <label
              htmlFor="logo-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Building2 className="w-12 h-12 text-dark-400 mb-2" />
              <span className="text-dark-400 mb-1">Click to upload logo</span>
              <span className="text-dark-500 text-xs">SVG, PNG, JPG (max. 2MB)</span>
            </label>
          </div>
        )}
      </div>
      
      <div className="bg-dark-200/50 p-4 rounded-lg">
        <div className="flex items-start space-x-3">
          <Building2 className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Why this matters</p>
            <p className="text-sm text-dark-400 mt-1">
              Your company information helps personalize your CRM experience and is used in reports and communications with your clients.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};