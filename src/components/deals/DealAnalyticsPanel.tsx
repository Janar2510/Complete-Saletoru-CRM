import React, { useState } from 'react';
import { 
  X, 
  BarChart2, 
  Download, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  Target,
  Filter,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { Card } from '../common/Card';
import { Deal, PipelineStage } from '../../types/deals';
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

interface DealAnalyticsPanelProps {
  deals: Deal[];
  stages: PipelineStage[];
  onClose: () => void;
  onExport: () => void;
}

export const DealAnalyticsPanel: React.FC<DealAnalyticsPanelProps> = ({ 
  deals, 
  stages,
  onClose,
  onExport
}) => {
  const [timeRange, setTimeRange] = useState<'month' | 'quarter' | 'year'>('month');
  
  // Calculate pipeline value by stage
  const getPipelineByStage = () => {
    const stageMap = new Map<string, { count: number, value: number, color: string }>();
    
    // Initialize with all stages
    stages.forEach(stage => {
      stageMap.set(stage.name, { 
        count: 0, 
        value: 0, 
        color: stage.color || '#6B7280' 
      });
    });
    
    // Count deals and sum values by stage
    deals.forEach(deal => {
      const stageName = deal.stage?.name || 'Unknown';
      if (!stageMap.has(stageName)) {
        stageMap.set(stageName, { count: 0, value: 0, color: '#6B7280' });
      }
      
      const stageData = stageMap.get(stageName)!;
      stageData.count += 1;
      stageData.value += deal.value;
    });
    
    return Array.from(stageMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      value: data.value,
      color: data.color
    }));
  };
  
  // Calculate deal status distribution
  const getStatusDistribution = () => {
    const open = deals.filter(deal => deal.status === 'open').length;
    const won = deals.filter(deal => deal.status === 'won').length;
    const lost = deals.filter(deal => deal.status === 'lost').length;
    
    return [
      { name: 'Open', value: open, color: '#3B82F6' },
      { name: 'Won', value: won, color: '#10B981' },
      { name: 'Lost', value: lost, color: '#EF4444' }
    ];
  };
  
  // Calculate monthly deal value
  const getMonthlyDealValue = () => {
    // In a real implementation, this would analyze actual monthly data
    // For demo purposes, we'll create mock data
    return [
      { name: 'Jan', won: 120000, lost: 45000, pipeline: 200000 },
      { name: 'Feb', won: 150000, lost: 30000, pipeline: 220000 },
      { name: 'Mar', won: 130000, lost: 50000, pipeline: 180000 },
      { name: 'Apr', won: 170000, lost: 40000, pipeline: 250000 },
      { name: 'May', won: 190000, lost: 35000, pipeline: 270000 },
      { name: 'Jun', won: 210000, lost: 25000, pipeline: 300000 }
    ];
  };
  
  // Calculate win rate trend
  const getWinRateTrend = () => {
    // In a real implementation, this would analyze actual win rate data
    // For demo purposes, we'll create mock data
    return [
      { name: 'Jan', rate: 35 },
      { name: 'Feb', rate: 42 },
      { name: 'Mar', rate: 38 },
      { name: 'Apr', rate: 45 },
      { name: 'May', rate: 48 },
      { name: 'Jun', rate: 52 }
    ];
  };
  
  // Calculate deal cycle time
  const getDealCycleTime = () => {
    // In a real implementation, this would analyze actual deal cycle data
    // For demo purposes, we'll create mock data
    return [
      { name: 'Jan', days: 45 },
      { name: 'Feb', days: 42 },
      { name: 'Mar', days: 38 },
      { name: 'Apr', days: 35 },
      { name: 'May', days: 32 },
      { name: 'Jun', days: 30 }
    ];
  };
  
  const pipelineByStage = getPipelineByStage();
  const statusDistribution = getStatusDistribution();
  const monthlyDealValue = getMonthlyDealValue();
  const winRateTrend = getWinRateTrend();
  const dealCycleTime = getDealCycleTime();
  
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
    <Card className="p-6 bg-surface/80 backdrop-blur-sm border border-dark-200 shadow-glass">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Deal Analytics</h2>
            <p className="text-sm text-dark-400">Performance metrics for {deals.length} deals</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex bg-dark-200 rounded-lg p-1">
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
          
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 bg-dark-200 hover:bg-dark-300 text-dark-400 hover:text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-400" />
              <span className="text-sm text-dark-400">Total Pipeline</span>
            </div>
            <div className="flex items-center text-xs">
              {getChangeIcon(15)}
              <span className={`ml-1 ${getChangeColor(15)}`}>15%</span>
            </div>
          </div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(deals.reduce((sum, deal) => sum + deal.value, 0))}
          </p>
        </div>
        
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-dark-400">Win Rate</span>
            </div>
            <div className="flex items-center text-xs">
              {getChangeIcon(8)}
              <span className={`ml-1 ${getChangeColor(8)}`}>8%</span>
            </div>
          </div>
          <p className="text-xl font-bold text-white">
            {(deals.filter(d => d.status === 'won').length / 
              (deals.filter(d => d.status === 'won').length + 
               deals.filter(d => d.status === 'lost').length) * 100 || 0).toFixed(1)}%
          </p>
        </div>
        
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-dark-400">Avg Deal Size</span>
            </div>
            <div className="flex items-center text-xs">
              {getChangeIcon(5)}
              <span className={`ml-1 ${getChangeColor(5)}`}>5%</span>
            </div>
          </div>
          <p className="text-xl font-bold text-white">
            {formatCurrency(deals.length > 0 ? 
              deals.reduce((sum, deal) => sum + deal.value, 0) / deals.length : 0)}
          </p>
        </div>
        
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-dark-400">Avg Deal Cycle</span>
            </div>
            <div className="flex items-center text-xs">
              {getChangeIcon(-8)}
              <span className={`ml-1 ${getChangeColor(-8)}`}>8%</span>
            </div>
          </div>
          <p className="text-xl font-bold text-white">
            {Math.round(dealCycleTime.reduce((sum, item) => sum + item.days, 0) / dealCycleTime.length)} days
          </p>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pipeline by Stage */}
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Pipeline by Stage</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineByStage}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Value']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Value" 
                  fill="#6366f1"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Deal Status Distribution */}
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Deal Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} deals`, '']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Monthly Deal Value */}
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Deal Value</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={monthlyDealValue}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), '']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="won" 
                  name="Won" 
                  stackId="1" 
                  fill="#10b981" 
                  stroke="#10b981" 
                />
                <Area 
                  type="monotone" 
                  dataKey="lost" 
                  name="Lost" 
                  stackId="1" 
                  fill="#ef4444" 
                  stroke="#ef4444" 
                />
                <Area 
                  type="monotone" 
                  dataKey="pipeline" 
                  name="Pipeline" 
                  stackId="1" 
                  fill="#6366f1" 
                  stroke="#6366f1" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Win Rate Trend */}
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-4">Win Rate Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={winRateTrend}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b' }}
                  axisLine={{ stroke: '#334155' }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value}%`, 'Win Rate']}
                  contentStyle={{ backgroundColor: '#1e1a2e', borderColor: '#334155' }}
                  itemStyle={{ color: '#ffffff' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  name="Win Rate" 
                  stroke="#10b981" 
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Insights */}
      <div className="bg-dark-200/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Key Insights</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-dark-300/50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <h4 className="font-medium text-white">Conversion Rate</h4>
            </div>
            <p className="text-sm text-dark-400">
              Your win rate has improved by 8% compared to last {timeRange}. Continue focusing on high-quality leads.
            </p>
          </div>
          
          <div className="bg-dark-300/50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Target className="w-4 h-4 text-blue-400" />
              <h4 className="font-medium text-white">Deal Velocity</h4>
            </div>
            <p className="text-sm text-dark-400">
              Deals are moving 15% faster through your pipeline this {timeRange}. Your process improvements are working.
            </p>
          </div>
          
          <div className="bg-dark-300/50 p-3 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-400" />
              <h4 className="font-medium text-white">Revenue Growth</h4>
            </div>
            <p className="text-sm text-dark-400">
              Your average deal size has increased by 5% this {timeRange}. Consider upselling opportunities.
            </p>
          </div>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-6 pt-4 border-t border-dark-200">
        <h3 className="text-lg font-semibold text-white mb-4">Recommendations</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-white font-medium">Focus on Proposal stage deals</p>
              <p className="text-sm text-dark-400 mt-1">
                The Proposal stage has the highest number of stalled deals. Consider implementing a follow-up strategy to move these deals forward.
              </p>
              <button className="mt-2 text-xs bg-dark-300 hover:bg-dark-400 text-white px-3 py-1 rounded transition-colors">
                View Stalled Deals
              </button>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-white font-medium">Improve deal qualification</p>
              <p className="text-sm text-dark-400 mt-1">
                Your win rate in the early stages is below average. Consider refining your qualification criteria to focus on higher-quality leads.
              </p>
              <button className="mt-2 text-xs bg-dark-300 hover:bg-dark-400 text-white px-3 py-1 rounded transition-colors">
                View Qualification Guide
              </button>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors">
            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <ArrowRight className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-white font-medium">Optimize deal cycle time</p>
              <p className="text-sm text-dark-400 mt-1">
                Your average deal cycle time has decreased, but there's room for improvement. Consider streamlining your approval process for faster closings.
              </p>
              <button className="mt-2 text-xs bg-dark-300 hover:bg-dark-400 text-white px-3 py-1 rounded transition-colors">
                View Process Optimization Tips
              </button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};