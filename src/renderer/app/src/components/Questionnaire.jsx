import React, { useState } from 'react';
import { useStore } from '../services/store';

const ALL_AREAS = [
  { id: 'client', icon: '💼', label: 'Client work' },
  { id: 'creative', icon: '🎨', label: 'Creative' },
  { id: 'learning', icon: '📚', label: 'Learning' },
  { id: 'admin', icon: '🗂️', label: 'Admin' },
  { id: 'health', icon: '🏃', label: 'Health' },
  { id: 'personal', icon: '🏠', label: 'Personal' },
  { id: 'finance', icon: '💰', label: 'Finance' },
  { id: 'social', icon: '👥', label: 'Social' }
];

export function Questionnaire({ isOpen, onClose }) {
  const { areas, saveAreas } = useStore();
  const [selectedAreas, setSelectedAreas] = useState([]);
  
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAreas(areas);
    }
  }, [isOpen, areas]);

  if (!isOpen) return null;

  const toggleArea = (id) => {
    if (selectedAreas.includes(id)) {
      if (selectedAreas.length > 1) setSelectedAreas(selectedAreas.filter(a => a !== id));
    } else {
      setSelectedAreas([...selectedAreas, id]);
    }
  };

  const handleSave = () => {
    saveAreas(selectedAreas);
    onClose();
  };

  return (
    <div className="quest-overlay quest-enter">
      <div className="quest-card">
        <div className="quest-ruled"></div>
        <div className="quest-margin"></div>
        <div className="quest-inner">
          <div className="quest-step-num">Step 1 of 1</div>
          <h2 className="quest-headline">What areas do you work in?</h2>
          <p className="quest-sub">We'll customise your task labels to match how you actually think.</p>

          <div className="quest-body">
            <div className="quest-areas">
              {ALL_AREAS.map(a => (
                <button 
                  key={a.id} 
                  className={`quest-area-btn ${selectedAreas.includes(a.id) ? 'active' : ''}`}
                  onClick={() => toggleArea(a.id)}
                >
                  <span className="quest-area-icon">{a.icon}</span>
                  <span className="quest-area-label">{a.label}</span>
                </button>
              ))}
            </div>
            <p className="quest-hint" style={{ marginTop: '16px' }}>Tap to toggle. You can change these later.</p>
          </div>

          <button className="quest-next-btn" onClick={handleSave} style={{ marginTop: '12px' }}>Save & Close</button>
        </div>
      </div>
    </div>
  );
}
