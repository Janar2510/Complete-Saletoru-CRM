import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  User, 
  Target,
  Grid,
  List,
  X,
  Save
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { format, addDays, startOfWeek, endOfWeek, addWeeks, subWeeks, startOfMonth, endOfMonth, addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_all_day: boolean;
  related_contact_id?: string;
  related_deal_id?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  visibility: 'public' | 'private' | 'shared';
  contact?: {
    first_name: string;
    last_name: string;
  };
  deal?: {
    title: string;
  };
}

interface EventModalProps {
  event: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  isNew: boolean;
}

const EventModal: React.FC<EventModalProps> = ({ event, onClose, onSave, isNew }) => {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>(
    event || {
      title: '',
      description: '',
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      location: '',
      is_all_day: false,
      status: 'confirmed',
      visibility: 'private'
    }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-dark-200">
          <h2 className="text-xl font-semibold text-white">
            {isNew ? 'Create Event' : 'Edit Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
          >
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="start_time"
                value={formData.start_time ? new Date(formData.start_time).toISOString().slice(0, 16) : ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                name="end_time"
                value={formData.end_time ? new Date(formData.end_time).toISOString().slice(0, 16) : ''}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location || ''}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description || ''}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_all_day"
                checked={formData.is_all_day}
                onChange={handleChange}
                className="rounded border-dark-300 text-accent focus:ring-accent"
              />
              <span className="ml-2 text-white">All Day</span>
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
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
                <option value="confirmed">Confirmed</option>
                <option value="tentative">Tentative</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Visibility
              </label>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
                <option value="shared">Shared</option>
              </select>
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
              className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isNew ? 'Create' : 'Update'}</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const Calendar: React.FC = () => {
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [currentDate, viewMode]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      let startDate, endDate;
      
      if (viewMode === 'month') {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else {
        startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
        endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
      }
      
      // Simplified query to avoid RLS recursion issues
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString())
        .order('start_time', { ascending: true });
      
      if (error) throw error;
      
      // Get contact and deal info separately to avoid RLS issues
      const eventsWithRelations = await Promise.all((data || []).map(async (event) => {
        let contactData = null;
        let dealData = null;
        
        if (event.related_contact_id) {
          const { data: contact } = await supabase
            .from('contacts')
            .select('first_name, last_name')
            .eq('id', event.related_contact_id)
            .single();
          contactData = contact;
        }
        
        if (event.related_deal_id) {
          const { data: deal } = await supabase
            .from('deals')
            .select('title')
            .eq('id', event.related_deal_id)
            .single();
          dealData = deal;
        }
        
        return {
          ...event,
          contact: contactData,
          deal: dealData
        };
      }));
      
      setEvents(eventsWithRelations);
    } catch (error) {
      console.error('Error loading events:', error);
      
      // Mock data for development
      setEvents([
        {
          id: '1',
          title: 'Client Meeting',
          description: 'Discuss project requirements',
          start_time: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 10, 0).toISOString(),
          end_time: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 11, 0).toISOString(),
          location: 'Conference Room A',
          is_all_day: false,
          status: 'confirmed',
          visibility: 'private',
          contact: {
            first_name: 'John',
            last_name: 'Smith'
          }
        },
        {
          id: '2',
          title: 'Team Standup',
          description: 'Daily team standup',
          start_time: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 9, 0).toISOString(),
          end_time: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1, 9, 30).toISOString(),
          is_all_day: false,
          status: 'confirmed',
          visibility: 'public'
        },
        {
          id: '3',
          title: 'Product Demo',
          description: 'Demo new features to client',
          start_time: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2, 14, 0).toISOString(),
          end_time: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 2, 15, 30).toISOString(),
          location: 'Zoom',
          is_all_day: false,
          status: 'confirmed',
          visibility: 'shared',
          deal: {
            title: 'Enterprise Software Package'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsNewEvent(true);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsNewEvent(false);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    try {
      if (isNewEvent) {
        // Create new event
        const { data, error } = await supabase
          .from('calendar_events')
          .insert([eventData])
          .select();
        
        if (error) throw error;
        
        if (data) {
          setEvents([...events, data[0] as CalendarEvent]);
        }
      } else {
        // Update existing event
        const { data, error } = await supabase
          .from('calendar_events')
          .update(eventData)
          .eq('id', selectedEvent?.id)
          .select();
        
        if (error) throw error;
        
        if (data) {
          setEvents(events.map(e => e.id === selectedEvent?.id ? data[0] as CalendarEvent : e));
        }
      }
      
      setShowEventModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
      
      // For development, update the UI optimistically
      if (isNewEvent) {
        const newEvent = {
          id: `temp-${Date.now()}`,
          ...eventData
        } as CalendarEvent;
        setEvents([...events, newEvent]);
      } else {
        setEvents(events.map(e => e.id === selectedEvent?.id ? { ...e, ...eventData } : e));
      }
      
      setShowEventModal(false);
    }
  };

  const navigatePrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    return (
      <div className="bg-surface border border-dark-200 rounded-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-dark-200">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-dark-400 font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map(day => {
            const dayEvents = events.filter(event => 
              isSameDay(parseISO(event.start_time), day)
            );
            
            return (
              <div 
                key={day.toISOString()} 
                className={`min-h-24 p-1 border-r border-b border-dark-200 ${
                  isSameMonth(day, currentDate) 
                    ? 'bg-surface' 
                    : 'bg-dark-200/30'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm font-medium ${
                    isSameMonth(day, currentDate) ? 'text-white' : 'text-dark-400'
                  }`}>
                    {format(day, 'd')}
                  </span>
                  {isSameDay(day, new Date()) && (
                    <span className="w-2 h-2 rounded-full bg-accent"></span>
                  )}
                </div>
                
                <div className="space-y-1 overflow-y-auto max-h-20">
                  {dayEvents.map(event => (
                    <div 
                      key={event.id}
                      onClick={() => handleEditEvent(event)}
                      className="text-xs p-1 rounded bg-accent/20 text-white cursor-pointer truncate hover:bg-accent/30 transition-colors"
                    >
                      {!event.is_all_day && format(parseISO(event.start_time), 'HH:mm')} {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    // Time slots from 8:00 to 18:00
    const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8);
    
    return (
      <div className="bg-surface border border-dark-200 rounded-lg overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-8 border-b border-dark-200">
          <div className="p-2 text-center text-dark-400 font-medium border-r border-dark-200">
            Time
          </div>
          {days.map(day => (
            <div 
              key={day.toISOString()} 
              className={`p-2 text-center ${
                isSameDay(day, new Date()) 
                  ? 'bg-accent/10 text-white' 
                  : 'text-dark-400'
              }`}
            >
              <div className="font-medium">{format(day, 'EEE')}</div>
              <div className="text-sm">{format(day, 'd MMM')}</div>
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div>
          {timeSlots.map(hour => (
            <div key={hour} className="grid grid-cols-8 border-b border-dark-200">
              <div className="p-2 text-center text-dark-400 text-sm border-r border-dark-200">
                {hour}:00
              </div>
              
              {days.map(day => {
                const startTime = new Date(day);
                startTime.setHours(hour, 0, 0);
                const endTime = new Date(day);
                endTime.setHours(hour + 1, 0, 0);
                
                const hourEvents = events.filter(event => {
                  const eventStart = parseISO(event.start_time);
                  const eventEnd = parseISO(event.end_time);
                  return (
                    isSameDay(eventStart, day) && 
                    eventStart.getHours() <= hour && 
                    eventEnd.getHours() > hour
                  );
                });
                
                return (
                  <div 
                    key={day.toISOString()} 
                    className="p-1 min-h-16 relative"
                  >
                    {hourEvents.map(event => (
                      <div 
                        key={event.id}
                        onClick={() => handleEditEvent(event)}
                        className="absolute inset-x-1 bg-accent text-white text-xs p-1 rounded overflow-hidden cursor-pointer"
                        style={{
                          top: `${((parseISO(event.start_time).getMinutes()) / 60) * 100}%`,
                          height: `${Math.min(
                            ((parseISO(event.end_time).getHours() - parseISO(event.start_time).getHours()) * 60 + 
                            parseISO(event.end_time).getMinutes() - parseISO(event.start_time).getMinutes()) / 60 * 100,
                            100
                          )}%`,
                          zIndex: 10
                        }}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
          <p className="text-dark-400">Manage your schedule and meetings</p>
        </div>
        
        <button
          onClick={handleCreateEvent}
          className="bg-accent hover:bg-accent/80 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar Controls */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={navigatePrevious}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-dark-400" />
            </button>
            
            <h2 className="text-xl font-semibold text-white">
              {viewMode === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM')} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'd MMM')}`
              }
            </h2>
            
            <button
              onClick={navigateNext}
              className="p-2 rounded-lg hover:bg-dark-200 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-dark-400" />
            </button>
            
            <button
              onClick={navigateToday}
              className="px-4 py-2 bg-dark-200 hover:bg-dark-300 text-white rounded-lg transition-colors"
            >
              Today
            </button>
          </div>
          
          <div className="flex bg-dark-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'month'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
              title="Month View"
            >
              <Grid className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setViewMode('week')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'week'
                  ? 'bg-accent text-white'
                  : 'text-dark-400 hover:text-white'
              }`}
              title="Week View"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Calendar View */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        viewMode === 'month' ? renderMonthView() : renderWeekView()
      )}

      {/* Upcoming Events */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-accent" />
          Upcoming Events
        </h3>
        
        <div className="space-y-4">
          {events
            .filter(event => new Date(event.start_time) >= new Date())
            .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
            .slice(0, 5)
            .map(event => (
              <div 
                key={event.id}
                className="p-4 bg-dark-200/50 rounded-lg hover:bg-dark-200 transition-colors cursor-pointer"
                onClick={() => handleEditEvent(event)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-white">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-dark-400 mt-1">{event.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                    event.status === 'tentative' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                  </span>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center text-dark-400">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      {event.is_all_day 
                        ? 'All day' 
                        : `${format(parseISO(event.start_time), 'h:mm a')} - ${format(parseISO(event.end_time), 'h:mm a')}`
                      }
                    </span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center text-dark-400">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event.contact && (
                    <div className="flex items-center text-dark-400">
                      <User className="w-4 h-4 mr-2" />
                      <span>{event.contact.first_name} {event.contact.last_name}</span>
                    </div>
                  )}
                  
                  {event.deal && (
                    <div className="flex items-center text-dark-400">
                      <Target className="w-4 h-4 mr-2" />
                      <span>{event.deal.title}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {events.filter(event => new Date(event.start_time) >= new Date()).length === 0 && (
              <div className="text-center py-8">
                <CalendarIcon className="w-12 h-12 text-dark-400 mx-auto mb-3" />
                <p className="text-dark-400">No upcoming events</p>
              </div>
            )}
        </div>
      </Card>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onSave={handleSaveEvent}
          isNew={isNewEvent}
        />
      )}
    </div>
  );
};

export default Calendar;