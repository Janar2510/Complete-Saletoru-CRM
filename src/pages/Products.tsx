import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  DollarSign, 
  Tag, 
  Layers, 
  X, 
  Save,
  CheckSquare,
  Square,
  Users,
  Calendar
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  price: number;
  cost?: number;
  category?: string;
  tags?: string[];
  status: 'active' | 'inactive' | 'discontinued';
  inventory_count?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  image_url?: string;
}

interface ProductModalProps {
  product?: Product;
  onClose: () => void;
  onSave: (productData: Partial<Product>) => void;
  isNew: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave, isNew }) => {
  const [formData, setFormData] = useState<Partial<Product>>(
    product || {
      name: '',
      description: '',
      sku: '',
      price: 0,
      cost: 0,
      category: '',
      tags: [],
      status: 'active',
      inventory_count: 0
    }
  );
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(tag => tag !== tagToRemove)
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.sku?.trim()) {
      newErrors.sku = 'SKU is required';
    }
    
    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <h2 className="text-xl font-semibold text-white">
            {isNew ? 'Add New Product' : 'Edit Product'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Product Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-dark-300'
                }`}
                placeholder="Enter product name"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                SKU *
              </label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                  errors.sku ? 'border-red-500' : 'border-dark-300'
                }`}
                placeholder="Enter SKU"
              />
              {errors.sku && <p className="text-red-400 text-sm mt-1">{errors.sku}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Select category</option>
                <option value="software">Software</option>
                <option value="hardware">Hardware</option>
                <option value="service">Service</option>
                <option value="subscription">Subscription</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Price *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className={`w-full pl-10 pr-3 py-2 bg-dark-200 border rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent ${
                    errors.price ? 'border-red-500' : 'border-dark-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Cost
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full pl-10 pr-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Inventory Count
              </label>
              <input
                type="number"
                name="inventory_count"
                value={formData.inventory_count}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Enter product description"
              />
            </div>
            
            <div className="md:col-span-2">
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
                  className="flex-1 px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-accent"
                  placeholder="Add tag"
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
                  Add
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4 border-t border-dark-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-dark-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-accent hover:bg-accent/80 text-white px-6 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'Create Product' : 'Update Product'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      
      // Mock data for development
      setProducts([
        {
          id: '1',
          name: 'Enterprise CRM License',
          description: 'Annual license for enterprise CRM software',
          sku: 'CRM-ENT-001',
          price: 5000,
          cost: 2000,
          category: 'software',
          tags: ['enterprise', 'license', 'annual'],
          status: 'active',
          inventory_count: 100,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          image_url: 'https://images.pexels.com/photos/6476260/pexels-photo-6476260.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '2',
          name: 'Data Migration Service',
          description: 'Professional service for data migration to our platform',
          sku: 'SRV-MIG-001',
          price: 2500,
          cost: 1200,
          category: 'service',
          tags: ['migration', 'service', 'data'],
          status: 'active',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1'
        },
        {
          id: '3',
          name: 'Premium Support Plan',
          description: '24/7 priority support with 1-hour response time',
          sku: 'SUP-PRM-001',
          price: 1200,
          cost: 800,
          category: 'subscription',
          tags: ['support', 'premium', 'subscription'],
          status: 'active',
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1'
        },
        {
          id: '4',
          name: 'Mobile CRM Add-on',
          description: 'Mobile application add-on for CRM',
          sku: 'CRM-MOB-001',
          price: 1500,
          cost: 600,
          category: 'software',
          tags: ['mobile', 'add-on'],
          status: 'active',
          inventory_count: 50,
          created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1',
          image_url: 'https://images.pexels.com/photos/6476808/pexels-photo-6476808.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
        },
        {
          id: '5',
          name: 'Legacy CRM System',
          description: 'Previous generation CRM system',
          sku: 'CRM-LEG-001',
          price: 2000,
          cost: 800,
          category: 'software',
          tags: ['legacy', 'outdated'],
          status: 'discontinued',
          inventory_count: 5,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: 'user-1'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsNewProduct(true);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsNewProduct(false);
    setShowProductModal(true);
  };

  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      if (isNewProduct) {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert([productData])
          .select();
        
        if (error) throw error;
        
        if (data) {
          setProducts([...products, data[0] as Product]);
        }
      } else {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', selectedProduct?.id)
          .select();
        
        if (error) throw error;
        
        if (data) {
          setProducts(products.map(p => p.id === selectedProduct?.id ? data[0] as Product : p));
        }
      }
      
      setShowProductModal(false);
    } catch (error) {
      console.error('Error saving product:', error);
      
      // For development, update the UI optimistically
      if (isNewProduct) {
        const newProduct = {
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'user-1',
          ...productData
        } as Product;
        setProducts([...products, newProduct]);
      } else {
        setProducts(products.map(p => p.id === selectedProduct?.id ? { ...p, ...productData } : p));
      }
      
      setShowProductModal(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
      
      setProducts(products.filter(p => p.id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      
      // For development, update the UI optimistically
      setProducts(products.filter(p => p.id !== productId));
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} products?`)) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .in('id', Array.from(selectedProducts));
      
      if (error) throw error;
      
      setProducts(products.filter(p => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      
      // For development, update the UI optimistically
      setProducts(products.filter(p => !selectedProducts.has(p.id)));
      setSelectedProducts(new Set());
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400';
      case 'inactive':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'discontinued':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'software':
        return <Package className="w-5 h-5 text-blue-400" />;
      case 'hardware':
        return <Layers className="w-5 h-5 text-green-400" />;
      case 'service':
        return <Users className="w-5 h-5 text-purple-400" />;
      case 'subscription':
        return <Calendar className="w-5 h-5 text-orange-400" />;
      default:
        return <Package className="w-5 h-5 text-dark-400" />;
    }
  };

  // Apply filters
  const filteredProducts = products.filter(product => {
    // Search term filter
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    
    // Status filter
    const matchesStatus = !statusFilter || product.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Products</h1>
          <p className="text-dark-400">Manage your product catalog</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedProducts.size > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete ({selectedProducts.size})</span>
            </button>
          )}
          
          <button
            onClick={handleCreateProduct}
            className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search products..."
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
          
          <div className="flex bg-dark-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <div className="grid grid-cols-2 gap-0.5">
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
                <div className="w-1.5 h-1.5 bg-current rounded-sm"></div>
              </div>
            </button>
            
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              <div className="flex flex-col space-y-0.5">
                <div className="w-4 h-1.5 bg-current rounded-sm"></div>
                <div className="w-4 h-1.5 bg-current rounded-sm"></div>
                <div className="w-4 h-1.5 bg-current rounded-sm"></div>
              </div>
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-dark-200/50 rounded-lg">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category?.charAt(0).toUpperCase() + category?.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="discontinued">Discontinued</option>
            </select>

            <button
              onClick={() => {
                setCategoryFilter('');
                setStatusFilter('');
                setSearchTerm('');
              }}
              className="bg-dark-300 hover:bg-dark-400 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </Card>

      {/* Products Display */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 text-dark-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
          <p className="text-dark-400 mb-6">Get started by adding your first product</p>
          <button
            onClick={handleCreateProduct}
            className="bg-accent hover:bg-accent/80 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Add Product
          </button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-200" hover>
              {/* Product Image */}
              <div className="h-40 bg-dark-300 relative">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-dark-400" />
                  </div>
                )}
                
                {/* Selection Checkbox */}
                <div className="absolute top-2 right-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectProduct(product.id);
                    }}
                    className="p-1 bg-dark-200/80 rounded-full"
                  >
                    {selectedProducts.has(product.id) ? (
                      <CheckSquare className="w-4 h-4 text-accent" />
                    ) : (
                      <Square className="w-4 h-4 text-white" />
                    )}
                  </button>
                </div>
                
                {/* Status Badge */}
                <div className="absolute bottom-2 left-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{product.name}</h3>
                  <span className="text-lg font-bold text-white">{formatCurrency(product.price)}</span>
                </div>
                
                <p className="text-sm text-dark-400 mb-3 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-dark-200 text-dark-400 px-2 py-1 rounded">
                      SKU: {product.sku}
                    </span>
                    
                    {product.inventory_count !== undefined && (
                      <span className="text-xs bg-dark-200 text-dark-400 px-2 py-1 rounded">
                        Stock: {product.inventory_count}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                
                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {product.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="text-xs bg-accent/20 text-accent px-1.5 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {product.tags.length > 3 && (
                      <span className="text-xs text-dark-400">
                        +{product.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
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
                      {selectedProducts.size === filteredProducts.length ? (
                        <CheckSquare className="w-4 h-4 text-accent" />
                      ) : (
                        <Square className="w-4 h-4 text-dark-400" />
                      )}
                    </button>
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Product</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">SKU</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Category</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Price</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Inventory</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Last Updated</th>
                  <th className="p-4 text-left text-sm font-medium text-dark-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-200">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-dark-200/30 transition-colors">
                    <td className="p-4">
                      <button onClick={() => handleSelectProduct(product.id)}>
                        {selectedProducts.has(product.id) ? (
                          <CheckSquare className="w-4 h-4 text-accent" />
                        ) : (
                          <Square className="w-4 h-4 text-dark-400" />
                        )}
                      </button>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-dark-300 rounded-lg flex items-center justify-center">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name} 
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            getCategoryIcon(product.category)
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{product.name}</p>
                          {product.description && (
                            <p className="text-sm text-dark-400 truncate max-w-xs">{product.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white">{product.sku}</span>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white capitalize">{product.category || 'N/A'}</span>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white font-medium">{formatCurrency(product.price)}</span>
                      {product.cost !== undefined && (
                        <span className="text-dark-400 text-xs block">
                          Cost: {formatCurrency(product.cost)}
                        </span>
                      )}
                    </td>
                    
                    <td className="p-4">
                      <span className="text-white">{product.inventory_count ?? 'N/A'}</span>
                    </td>
                    
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                        {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <span className="text-dark-400 text-sm">
                        {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
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
        </Card>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct || undefined}
          onClose={() => setShowProductModal(false)}
          onSave={handleSaveProduct}
          isNew={isNewProduct}
        />
      )}
    </div>
  );
};

export default Products;