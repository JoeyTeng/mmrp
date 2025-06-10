'use client';

import { useState } from 'react';
import SideBySide from '../comparison-view/SideBySide';
import MenuDropdown, { viewOptions } from '../comparison-view/MenuDropdown';

const ComparisonView = () => {
  const [view, setView] = useState(viewOptions.SideBySide);

  return (
    <div className='flex flex-col flex-1 relative border border-gray-900 rounded-md overflow-hidden bg-gray-100'>
      <div className='flex items-center justify-between bg-gray-700 px-4 py-2 border-b border-gray-300 font-semibold text-white'>
        <div className='flex items-center gap-2'>
          <MenuDropdown onSelect={setView} />
          <span>{view} View</span>
        </div>
      </div>

      {view === viewOptions.SideBySide && <SideBySide />}
      {view === viewOptions.Interleaving && (
        <div className='h-full w-full'>
        </div>
      )}
    </div>
  );

};

export default ComparisonView;