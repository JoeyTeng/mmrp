import ComparisonMetrics from '../cards/ComparisonMetrics';

const RightColumn = () => {
  return (
     <div className='h-full flex flex-col flex-1'>
      <div className='flex flex-1'>
        <ComparisonMetrics />
      </div>
    </div>
  );
};

export default RightColumn;