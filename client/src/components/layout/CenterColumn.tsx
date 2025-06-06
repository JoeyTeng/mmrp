import ComparisonView from '@/components/cards/ComparisonView';

const CenterColumn = () => {
  return (
    <div style={{ flex: 2.5, display: 'flex', flexDirection: 'column' }}>
      <ComparisonView />
    </div>
  );
};

export default CenterColumn;