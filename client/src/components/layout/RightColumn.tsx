import ComparisonMetrics from '../cards/ComparisonMetrics';

const RightColumn = () => {
  return (
     <div style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', flex: 1 }}>
        <ComparisonMetrics />
      </div>
    </div>
  );
};

export default RightColumn;