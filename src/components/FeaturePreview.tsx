import React from 'react';

interface PreviewProps {
  type: 'planner' | 'documents' | 'esim' | 'profile' | 'checklist' | 'budget' | 'journal' | 'travel-reels' | 'scratch';
}

const FeaturePreview: React.FC<PreviewProps> = ({ type }) => {
  switch (type) {
    case 'planner':
      return (
        <div className="bg-white p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Adventure in Thailand</h3>
              <p className="text-gray-600">01 Sep - 20 Sep 2024</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#00C48C] flex items-center justify-center text-white text-sm">
                13/22
              </div>
              <span className="text-sm text-gray-600">Nights planned</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Bangkok</span>
              <span className="text-gray-600">3 nights</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Chiang Mai</span>
              <span className="text-gray-600">3 nights</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Pai District</span>
              <span className="text-gray-600">5 nights</span>
            </div>
          </div>
        </div>
      );
    
    // Add other preview components for each feature type
    default:
      return null;
  }
};

export default FeaturePreview; 