import ComparisonMetrics from '../cards/ComparisonMetrics';
import BottomRightCard from '../cards/ParameterConfiguration';

const RightColumn = () => {
  return (
    <div style={{ height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flex: 1.25 }}>
          <ComparisonMetrics />
        </div>
        <div style={{ display: 'flex', flex: 1 }}>
          <BottomRightCard />
        </div>
    </div>
  );
};

export default RightColumn;