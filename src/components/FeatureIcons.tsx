import React, { useState } from 'react';
import { motion } from 'framer-motion';

const features = [
  {
    id: 'documents',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
      </svg>
    ),
    label: 'Documents',
    preview: '/images/features/documents-preview.png'
  },
  {
    id: 'esim',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12" y2="18" />
      </svg>
    ),
    label: 'eSIM',
    preview: '/images/features/esim-preview.png'
  },
  {
    id: 'profile',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    label: 'Profile',
    preview: '/images/features/profile-preview.png'
  },
  {
    id: 'checklist',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    label: 'Checklist',
    preview: '/images/features/checklist-preview.png'
  },
  {
    id: 'planner',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    label: 'Planner',
    preview: '/images/features/planner-preview.png'
  },
  {
    id: 'budget',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
        <line x1="12" y1="6" x2="12" y2="18" />
      </svg>
    ),
    label: 'Budget',
    preview: '/images/features/budget-preview.png'
  },
  {
    id: 'journal',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
    label: 'Journal',
    preview: '/images/features/journal-preview.png'
  },
  {
    id: 'travel-reels',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" />
        <line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" />
        <line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" />
        <line x1="17" y1="7" x2="22" y2="7" />
      </svg>
    ),
    label: 'Travel reels',
    preview: '/images/features/travel-reels-preview.png'
  },
  {
    id: 'scratch',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    ),
    label: 'Scratch',
    preview: '/images/features/scratch-preview.png'
  }
];

const FeatureIcons = () => {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div className="relative">
      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-8 px-4 py-6 min-w-max">
          {features.map((feature) => (
            <button
              key={feature.id}
              className={`flex flex-col items-center gap-2 transition-all ${
                selectedFeature === feature.id 
                  ? 'text-[#00C48C]' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => !isDragging && setSelectedFeature(feature.id)}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all ${
                selectedFeature === feature.id
                  ? 'bg-[#00C48C] text-white'
                  : 'bg-white text-gray-600'
              }`}>
                {feature.icon}
              </div>
              <span className="text-sm font-medium">{feature.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feature Preview Modal */}
      {selectedFeature && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeature(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl overflow-hidden max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={features.find(f => f.id === selectedFeature)?.preview}
              alt={`${selectedFeature} preview`}
              className="w-full h-auto"
            />
            <button
              className="absolute top-4 right-4 bg-white rounded-full p-2 shadow-lg"
              onClick={() => setSelectedFeature(null)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default FeatureIcons; 