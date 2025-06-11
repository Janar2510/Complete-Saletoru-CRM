import React, { useState } from 'react';
import { GitBranch, Plus, Trash2, GripVertical, Edit, Check, X } from 'lucide-react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface PipelineStage {
  name: string;
  probability: number;
  color: string;
  position: number;
}

interface PipelineSetupStepProps {
  data: {
    name: string;
    stages: PipelineStage[];
  };
  setData: (data: any) => void;
}

interface DraggableStageProps {
  stage: PipelineStage;
  index: number;
  moveStage: (dragIndex: number, hoverIndex: number) => void;
  editingStage: number | null;
  setEditingStage: (index: number | null) => void;
  handleUpdateStage: (index: number, updates: Partial<PipelineStage>) => void;
  handleDeleteStage: (index: number) => void;
}

const DraggableStage: React.FC<DraggableStageProps> = ({
  stage,
  index,
  moveStage,
  editingStage,
  setEditingStage,
  handleUpdateStage,
  handleDeleteStage,
}) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'stage',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'stage',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveStage(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`bg-dark-200/50 rounded-lg p-3 border-l-4 transition-all cursor-move ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      style={{ borderLeftColor: stage.color }}
    >
      <div className="flex items-center">
        <div className="mr-3 cursor-grab">
          <GripVertical className="w-5 h-5 text-dark-400" />
        </div>
        
        {editingStage === index ? (
          <div className="flex-1 flex items-center space-x-2">
            <input
              type="text"
              value={stage.name}
              onChange={(e) => handleUpdateStage(index, { name: e.target.value })}
              className="flex-1 px-2 py-1 bg-dark-300 border border-dark-400 rounded text-white focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
            <button
              onClick={() => setEditingStage(null)}
              className="p-1 bg-accent rounded-full text-white"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingStage(null)}
              className="p-1 bg-dark-400 rounded-full text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-between">
            <div>
              <span className="font-medium text-white">{stage.name}</span>
              <div className="flex items-center mt-1">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: stage.color }}
                ></div>
                <span className="text-xs text-dark-400">
                  {stage.probability}% probability
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setEditingStage(index)}
                className="p-1 hover:bg-dark-300 rounded transition-colors"
              >
                <Edit className="w-4 h-4 text-dark-400" />
              </button>
              <button
                onClick={() => handleDeleteStage(index)}
                className="p-1 hover:bg-dark-300 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4 text-dark-400" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const PipelineSetupStep: React.FC<PipelineSetupStepProps> = ({ data, setData }) => {
  const [editingStage, setEditingStage] = useState<number | null>(null);
  const [newStageName, setNewStageName] = useState('');
  
  const moveStage = (dragIndex: number, hoverIndex: number) => {
    const draggedStage = data.stages[dragIndex];
    const newStages = [...data.stages];
    newStages.splice(dragIndex, 1);
    newStages.splice(hoverIndex, 0, draggedStage);
    
    // Update positions
    const updatedStages = newStages.map((stage, index) => ({
      ...stage,
      position: index + 1
    }));
    
    setData({ ...data, stages: updatedStages });
  };
  
  const handleAddStage = () => {
    if (!newStageName.trim()) return;
    
    const newStage: PipelineStage = {
      name: newStageName,
      probability: 50,
      color: getRandomColor(),
      position: data.stages.length + 1
    };
    
    setData({
      ...data,
      stages: [...data.stages, newStage]
    });
    
    setNewStageName('');
  };
  
  const handleUpdateStage = (index: number, updates: Partial<PipelineStage>) => {
    const updatedStages = [...data.stages];
    updatedStages[index] = { ...updatedStages[index], ...updates };
    
    setData({
      ...data,
      stages: updatedStages
    });
  };
  
  const handleDeleteStage = (index: number) => {
    const updatedStages = data.stages.filter((_, i) => i !== index);
    
    // Update positions
    const reindexedStages = updatedStages.map((stage, i) => ({
      ...stage,
      position: i + 1
    }));
    
    setData({
      ...data,
      stages: reindexedStages
    });
  };
  
  const getRandomColor = () => {
    const colors = [
      '#6B7280', // Gray
      '#3B82F6', // Blue
      '#F59E0B', // Amber
      '#F97316', // Orange
      '#10B981', // Emerald
      '#EF4444', // Red
      '#8B5CF6', // Violet
      '#EC4899', // Pink
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Pipeline Name
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="Enter pipeline name"
          />
        </div>
        
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-white">
              Pipeline Stages
            </label>
            <span className="text-xs text-dark-400">
              Drag to reorder
            </span>
          </div>
          
          <div className="space-y-2 mb-4">
            {data.stages.map((stage, index) => (
              <DraggableStage
                key={index}
                stage={stage}
                index={index}
                moveStage={moveStage}
                editingStage={editingStage}
                setEditingStage={setEditingStage}
                handleUpdateStage={handleUpdateStage}
                handleDeleteStage={handleDeleteStage}
              />
            ))}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="New stage name"
              className="flex-1 px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              onClick={handleAddStage}
              disabled={!newStageName.trim()}
              className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stage</span>
            </button>
          </div>
        </div>
        
        <div className="bg-dark-200/50 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <GitBranch className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium">Pipeline Best Practices</p>
              <ul className="text-sm text-dark-400 mt-1 space-y-1 list-disc pl-4">
                <li>Keep your pipeline stages aligned with your sales process</li>
                <li>Use probability percentages to forecast deal outcomes</li>
                <li>Limit your pipeline to 5-7 stages for clarity</li>
                <li>Include both "Closed Won" and "Closed Lost" stages</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};