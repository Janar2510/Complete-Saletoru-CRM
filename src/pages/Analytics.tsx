import React, { useState, useEffect } from 'react';
import { 
  BarChart as BarChartIcon, 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Calendar, 
  Download, 
  Filter, 
  Users, 
  Target, 
  DollarSign, 
  Clock,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { supabase } from '../lib/supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const Analytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [pipelineData, setPipelineData] = useState<any[]>([]);
  const [dealVelocityData, setDealVelocityData] = useState<any[]>([]);
  const [leadConversionData, setLeadConversionData] = useState<any[]>([]);
  const [salesPerformanceData, setSalesPerformanceData] = useState<any[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalDeals: 0,
    totalValue: 0,
    avgDealSize: 0,
    conversionRate: 0,
    avgDealCycle: 0
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load pipeline data
      const pipelineResult = await loadPipelineData();
      setPipelineData(pipelineResult.stageData);
      
      // Load deal velocity data
      const velocityResult = await loadDealVelocityData();
      setDealVelocityData(velocityResult);
      
      // Load lead conversion data
      const conversionResult = await loadLeadConversionData();
      setLeadConversionData(conversionResult);
      
      // Load sales performance data
      const performanceResult = await loadSalesPerformanceData();
      setSalesPerformanceData(performanceResult);
      
      // Calculate summary stats
      const stats = await calculateSummaryStats();
      setSummaryStats(stats);
    } catch (error) {
      console.error('Error loading analytics data:', error);
      
      // Set mock data
      setPipelineData([
        { name: 'Lead', value: 12, amount: 180000, color: '#6B7280' },
        { name: 'Qualified', value: 8, amount: 320000, color: '#3B82F6' },
        { name: 'Proposal', value: 6, amount: 450000, color: '#F59E0B' },
        { name: 'Negotiation', value: 4, amount: 280000, color: '#F97316' },
        { name: 'Closed Won', value: 15, amount: 750000, color: '#10B981' },
        { name: 'Closed Lost', value: 7, amount: 420000, color: '#EF4444' }
      ]);
      
      setDealVelocityData([
        { name: 'Jan', avgDays: 45 },
        { name: 'Feb', avgDays: 42 },
        { name: 'Mar', avgDays: 38 },
        { name: 'Apr', avgDays: 35 },
        { name: 'May', avgDays: 32 },
        { name: 'Jun', avgDays: 30 }
      ]);
      
      setLeadConversionData([
        { name: 'Converted', value: 65, color: '#10B981' },
        { name: 'Not Converted', value: 35, color: '#6B7280' }
      ]);
      
      setSalesPerformanceData([
        { name: 'Jan', revenue: 120000, target: 100000 },
        { name: 'Feb', revenue: 150000, target: 120000 },
        { name: 'Mar', revenue: 130000, target: 130000 },
        { name: 'Apr', revenue: 170000, target: 140000 },
        { name: 'May', revenue: 190000, target: 150000 },
        { name: 'Jun', revenue: 210000, target: 160000 }
      ]);
      
      setSummaryStats({
        totalDeals: 52,
        totalValue: 2400000,
        avgDealSize: 46153,
        conversionRate: 28,
        avgDealCycle: 37
      });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return { startDate: startDate.toISOString(), endDate: now.toISOString() };
  };

  const loadPipelineData = async () => {
    try {
      // Get pipeline stages first
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('id, name, color')
        .order('position', { ascending: true });
      
      if (stagesError) throw stagesError;
      
      // Get deals grouped by stage
      const { data: dealsByStage, error: dealsError } = await supabase
        .from('deals')
        .select('stage_id, value')
        .not('stage_id', 'is', null);
      
      if (dealsError) throw dealsError;
      
      // Transform data for charts
      const transformedData = stages?.map(stage => {
        const stageDeals = dealsByStage?.filter(deal => deal.stage_id === stage.id) || [];
        const dealCount = stageDeals.length;
        const totalValue = stageDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
        
        return {
          name: stage.name,
          value: dealCount,
          amount: totalValue,
          color: stage.color
        };
      }) || [];
      
      return { stageData: transformedData };
    } catch (error) {
      console.error('Error loading pipeline data:', error);
      throw error;
    }
  };

  const loadDealVelocityData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Get closed deals with their creation and close dates
      const { data: deals, error } = await supabase
        .from('deals')
        .select('created_at, actual_close_date')
        .eq('status', 'won')
        .not('actual_close_date', 'is', null)
        .gte('actual_close_date', startDate)
        .lte('actual_close_date', endDate);
      
      if (error) throw error;
      
      // Group by month and calculate average days
      const monthlyData: { [key: string]: { totalDays: number; count: number } } = {};
      
      deals?.forEach(deal => {
        const closeDate = new Date(deal.actual_close_date);
        const createDate = new Date(deal.created_at);
        const monthKey = closeDate.toLocaleDateString('en-US', { month: 'short' });
        
        const daysDiff = Math.round((closeDate.getTime() - createDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { totalDays: 0, count: 0 };
        }
        
        monthlyData[monthKey].totalDays += daysDiff;
        monthlyData[monthKey].count += 1;
      });
      
      // Convert to chart format
      const chartData = Object.entries(monthlyData).map(([month, data]) => ({
        name: month,
        avgDays: Math.round(data.totalDays / data.count)
      }));
      
      return chartData;
    } catch (error) {
      console.error('Error loading deal velocity data:', error);
      return [];
    }
  };

  const loadLeadConversionData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Get total contacts created in the time range
      const { data: totalContacts, error: totalError } = await supabase
        .from('contacts')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (totalError) throw totalError;
      
      // First, get the contact_ids from deals
      const { data: dealsWithContacts, error: dealsError } = await supabase
        .from('deals')
        .select('contact_id')
        .not('contact_id', 'is', null);
      
      if (dealsError) throw dealsError;
      
      // Extract the contact_ids into an array
      const contactIdsWithDeals = dealsWithContacts?.map(deal => deal.contact_id) || [];
      
      // Get contacts that have associated deals (converted)
      const { data: convertedContacts, error: convertedError } = await supabase
        .from('contacts')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .in('id', contactIdsWithDeals);
      
      if (convertedError) throw convertedError;
      
      const totalCount = totalContacts?.length || 0;
      const convertedCount = convertedContacts?.length || 0;
      const conversionRate = totalCount > 0 ? (convertedCount / totalCount) * 100 : 0;
      
      return [
        { name: 'Converted', value: Math.round(conversionRate), color: '#10B981' },
        { name: 'Not Converted', value: Math.round(100 - conversionRate), color: '#6B7280' }
      ];
    } catch (error) {
      console.error('Error loading lead conversion data:', error);
      return [
        { name: 'Converted', value: 65, color: '#10B981' },
        { name: 'Not Converted', value: 35, color: '#6B7280' }
      ];
    }
  };

  const loadSalesPerformanceData = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Get deals closed in the time range
      const { data: deals, error } = await supabase
        .from('deals')
        .select('value, actual_close_date')
        .eq('status', 'won')
        .not('actual_close_date', 'is', null)
        .gte('actual_close_date', startDate)
        .lte('actual_close_date', endDate);
      
      if (error) throw error;
      
      // Group by month
      const monthlyRevenue: { [key: string]: number } = {};
      
      deals?.forEach(deal => {
        const closeDate = new Date(deal.actual_close_date);
        const monthKey = closeDate.toLocaleDateString('en-US', { month: 'short' });
        
        if (!monthlyRevenue[monthKey]) {
          monthlyRevenue[monthKey] = 0;
        }
        
        monthlyRevenue[monthKey] += deal.value || 0;
      });
      
      // Convert to chart format with mock targets
      const chartData = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        name: month,
        revenue,
        target: revenue * 0.8 // Mock target as 80% of actual revenue
      }));
      
      return chartData;
    } catch (error) {
      console.error('Error loading sales performance data:', error);
      return [];
    }
  };

  const calculateSummaryStats = async () => {
    try {
      const { startDate, endDate } = getDateRange();
      
      // Get deals in the time range
      const { data: dealsData, error: dealsError } = await supabase
        .from('deals')
        .select('id, value, status, created_at, actual_close_date')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (dealsError) throw dealsError;
      
      const wonDeals = dealsData?.filter(deal => deal.status === 'won') || [];
      const totalDeals = wonDeals.length;
      const totalValue = wonDeals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const avgDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
      
      // Calculate average deal cycle
      const dealCycles = wonDeals
        .filter(deal => deal.actual_close_date)
        .map(deal => {
          const startDate = new Date(deal.created_at);
          const endDate = new Date(deal.actual_close_date);
          return Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        });
      
      const avgDealCycle = dealCycles.length > 0 
        ? dealCycles.reduce((sum, days) => sum + days, 0) / dealCycles.length 
        : 0;
      
      // Calculate conversion rate
      const { data: totalContacts, error: contactsError } = await supabase
        .from('contacts')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate);
      
      if (contactsError) throw contactsError;
      
      const totalContactsCount = totalContacts?.length || 0;
      const conversionRate = totalContactsCount > 0 ? (totalDeals / totalContactsCount) * 100 : 0;
      
      return {
        totalDeals,
        totalValue,
        avgDealSize,
        conversionRate,
        avgDealCycle
      };
    } catch (error) {
      console.error('Error calculating summary stats:', error);
      return {
        totalDeals: 0,
        totalValue: 0,
        avgDealSize: 0,
        conversionRate: 0,
        avgDealCycle: 0
      };
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <ArrowUp className="w-3 h-3 text-green-400" />;
    if (change < 0) return <ArrowDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-dark-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400';
    if (change < 0) return 'text-red-400';
    return 'text-dark-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-dark-400">Sales performance and pipeline insights</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-dark-200 rounded-lg p-1">
            <button
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === 'week'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === 'month'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('quarter')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === 'quarter'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Quarter
            </button>
            <button
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                timeRange === 'year'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
            >
              Year
            </button>
          </div>
          
          <button className="flex items-center space-x-2 px-4 py-2 bg-dark-200 border border-dark-300 rounded-lg hover:bg-dark-300 transition-colors">
            <Download className="w-4 h-4 text-dark-400" />
            <span className="text-dark-400">Export</span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Total Deals</p>
              <p className="text-2xl font-bold text-white">{summaryStats.totalDeals}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-blue-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {getChangeIcon(10)}
            <span className={`ml-1 ${getChangeColor(10)}`}>10% vs previous {timeRange}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Total Value</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summaryStats.totalValue)}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {getChangeIcon(15)}
            <span className={`ml-1 ${getChangeColor(15)}`}>15% vs previous {timeRange}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Avg Deal Size</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(summaryStats.avgDealSize)}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {getChangeIcon(5)}
            <span className={`ml-1 ${getChangeColor(5)}`}>5% vs previous {timeRange}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-white">{summaryStats.conversionRate.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-yellow-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {getChangeIcon(-2)}
            <span className={`ml-1 ${getChangeColor(-2)}`}>2% vs previous {timeRange}</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-dark-400 mb-1">Avg Deal Cycle</p>
              <p className="text-2xl font-bold text-white">{Math.round(summaryStats.avgDealCycle)} days</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-400" />
            </div>
          </div>
          <div className="mt-2 flex items-center text-xs">
            {getChangeIcon(-8)}
            <span className={`ml-1 ${getChangeColor(-8)}`}>8% vs previous {timeRange}</span>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pipeline Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Pipeline Distribution</h3>
            <PieChartIcon className="w-5 h-5 text-accent" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pipelineData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string, props: any) => [
                    `${value} deals (${formatCurrency(props.payload.amount)})`,
                    name
                  ]}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Deal Velocity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Deal Velocity</h3>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dealVelocityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value: number) => [`${value} days`, 'Avg Days to Close']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="avgDays" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Lead Conversion */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Lead Conversion</h3>
            <Users className="w-5 h-5 text-accent" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadConversionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {leadConversionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, '']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        {/* Sales Performance */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Sales Performance</h3>
            <BarChartIcon className="w-5 h-5 text-accent" />
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" />
                <Bar dataKey="target" name="Target" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Deal Value by Month */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Deal Value by Month</h3>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-dark-200 border border-dark-300 rounded-lg hover:bg-dark-300 transition-colors">
                <Filter className="w-4 h-4 text-dark-400" />
                <span className="text-dark-400 text-sm">Filter</span>
              </button>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={[
                  { name: 'Jan', won: 120000, lost: 45000, pipeline: 200000 },
                  { name: 'Feb', won: 150000, lost: 30000, pipeline: 220000 },
                  { name: 'Mar', won: 130000, lost: 50000, pipeline: 180000 },
                  { name: 'Apr', won: 170000, lost: 40000, pipeline: 250000 },
                  { name: 'May', won: 190000, lost: 35000, pipeline: 270000 },
                  { name: 'Jun', won: 210000, lost: 25000, pipeline: 300000 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                <YAxis tick={{ fill: '#64748b' }} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="won" name="Won" stackId="1" fill="#10b981" stroke="#10b981" />
                <Area type="monotone" dataKey="lost" name="Lost" stackId="1" fill="#ef4444" stroke="#ef4444" />
                <Area type="monotone" dataKey="pipeline" name="Pipeline" stackId="1" fill="#6366f1" stroke="#6366f1" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;