import VideoQualityMetrics from "../comparison-metrics/VideoQualityMetrics";

const ComparisonMetrics = () => {
  return (
    <div className="flex-1 border border-gray-900 rounded-md overflow-hidden bg-white">
      <div className="bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300">
        Comparison Metrics
      </div>
      <div className="p-3">
        <VideoQualityMetrics />
      </div>
    </div>
  );
};

export default ComparisonMetrics;
