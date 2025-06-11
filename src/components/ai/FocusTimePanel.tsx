import React, { useState } from 'react';
import { 
  Clock, 
  X, 
  Calendar, 
  Check, 
  Brain,
  Sun,
  Sunrise,
  Sunset
} from 'lucide-react';
import { Card } from '../common/Card';
import { FocusTimeSlot } from '../../types/ai';

interface FocusTimePanelProps {
  focusSlots: FocusTimeSlot[];
  onClose: () => void;
  onSchedule: (slot: FocusTimeSlot) => void;
}

export const FocusTimePanel: React.FC<FocusTimePanelProps> = ({
  focusSlots,
  onClose,
  onSchedule
}) => {
  const [selectedSlot, setSelectedSlot] = useState<number>(-1);
  const [timePreference, setTimePreference] = useState<'morning' | 'afternoon' | 'evening' | 'any'>('any');
  const [duration, setDuration] = useState<number>(60);

  const formatTimeSlot = (slot: FocusTimeSlot) => {
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    
    const dateStr = start.toLocaleDateString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
    
    const timeStr = `${start.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    })} - ${end.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
    
    return { dateStr, timeStr };
  };

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'bg-green-400';
    if (score >= 70) return 'bg-yellow-400';
    return 'bg-orange-400';
  };

  const filteredSlots = focusSlots.filter(slot => {
    if (timePreference === 'any') return true;
    
    const hour = new Date(slot.start).getHours();
    
    if (timePreference === 'morning' && hour >= 5 && hour < 12) return true;
    if (timePreference === 'afternoon' && hour >= 12 && hour < 17) return true;
    if (timePreference === 'evening' && hour >= 17) return true;
    
    return false;
  });

  return (
    <Card className="p-4 border-l-4 border-blue-400">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
            <Clock className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">Focus Time Recommendations</h3>
            <p className="text-xs text-dark-400">
              Optimal times for deep work based on your schedule
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-dark-200 transition-colors"
        >
          <X className="w-4 h-4 text-dark-400" />
        </button>
      </div>
      
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Preferred Time of Day
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => setTimePreference('any')}
                className={`p-2 rounded-lg text-xs flex flex-col items-center transition-colors ${
                  timePreference === 'any'
                    ? 'bg-accent text-white'
                    : 'bg-dark-200 text-dark-400 hover:bg-dark-300 hover:text-white'
                }`}
              >
                <Clock className="w-4 h-4 mb-1" />
                <span>Any</span>
              </button>
              <button
                onClick={() => setTimePreference('morning')}
                className={`p-2 rounded-lg text-xs flex flex-col items-center transition-colors ${
                  timePreference === 'morning'
                    ? 'bg-accent text-white'
                    : 'bg-dark-200 text-dark-400 hover:bg-dark-300 hover:text-white'
                }`}
              >
                <Sunrise className="w-4 h-4 mb-1" />
                <span>Morning</span>
              </button>
              <button
                onClick={() => setTimePreference('afternoon')}
                className={`p-2 rounded-lg text-xs flex flex-col items-center transition-colors ${
                  timePreference === 'afternoon'
                    ? 'bg-accent text-white'
                    : 'bg-dark-200 text-dark-400 hover:bg-dark-300 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 mb-1" />
                <span>Afternoon</span>
              </button>
              <button
                onClick={() => setTimePreference('evening')}
                className={`p-2 rounded-lg text-xs flex flex-col items-center transition-colors ${
                  timePreference === 'evening'
                    ? 'bg-accent text-white'
                    : 'bg-dark-200 text-dark-400 hover:bg-dark-300 hover:text-white'
                }`}
              >
                <Sunset className="w-4 h-4 mb-1" />
                <span>Evening</span>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Duration (minutes)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full bg-dark-200 border border-dark-300 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={90}>1.5 hours</option>
              <option value={120}>2 hours</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="bg-dark-200/50 p-4 rounded-lg mb-4">
        <div className="flex items-start space-x-3">
          <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Focus Time Benefits</p>
            <p className="text-sm text-dark-400 mt-1">
              Blocking dedicated focus time can increase productivity by up to 40% by reducing context switching and interruptions.
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 max-h-64 overflow-y-auto pr-1 mb-4">
        {filteredSlots.length > 0 ? (
          filteredSlots.map((slot, index) => {
            const { dateStr, timeStr } = formatTimeSlot(slot);
            return (
              <button
                key={index}
                onClick={() => setSelectedSlot(index)}
                className={`w-full flex items-start p-3 rounded-lg transition-colors ${
                  selectedSlot === index
                    ? 'bg-accent text-white'
                    : 'bg-dark-200/50 hover:bg-dark-200 text-white'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{dateStr}</p>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${getQualityColor(slot.quality_score)}`}></div>
                      <span className="text-xs">{slot.quality_score}/100</span>
                    </div>
                  </div>
                  <p className="text-sm opacity-80">{timeStr}</p>
                  <p className={`text-xs mt-1 ${selectedSlot === index ? 'text-white/70' : 'text-dark-400'}`}>
                    {slot.reason}
                  </p>
                </div>
                {selectedSlot === index && (
                  <Check className="w-4 h-4 ml-2 flex-shrink-0" />
                )}
              </button>
            );
          })
        ) : (
          <div className="text-center py-6">
            <Clock className="w-12 h-12 text-dark-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">No focus slots available</p>
            <p className="text-dark-400 text-sm">
              Try different time preferences or check your calendar
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={() => selectedSlot >= 0 && onSchedule(filteredSlots[selectedSlot])}
          disabled={selectedSlot < 0 || filteredSlots.length === 0}
          className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
        >
          <Calendar className="w-4 h-4" />
          <span>Schedule Focus Time</span>
        </button>
      </div>
    </Card>
  );
};