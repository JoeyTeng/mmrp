import { Info } from 'lucide-react';

const ParameterConfiguration = () => {
  return (
    <div className="flex-1 border border-gray-900 rounded-md overflow-hidden bg-white">
      <div className="bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300">
        Configure Parameters
      </div>
      <div className="p-3">
        <div className="flex items-center gap-2 text-gray-700">
          <Info size={16} className="text-gray-500" />
          <span>select pipeline module to edit parameters</span>
        </div>
      </div>
    </div>
  );
};

export default ParameterConfiguration;