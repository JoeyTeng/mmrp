import TopLeftCard from '../cards/TopLeftCard';

const LeftColumn = () => {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopLeftCard />
    </div>
  );
};

export default LeftColumn;