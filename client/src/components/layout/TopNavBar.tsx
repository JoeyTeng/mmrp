const TopNavBar = () => {
  return (
    <div
      style={{
        height: '50px',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'left',
        justifyContent: 'space-between',
        padding: '0 16px',
      }}
    >
      <div style={{ display: 'flex', gap: '12px' }}>
        <button className='nav-button'>Save</button>
        <button className='nav-button'>Export</button>
      </div>
    </div>
  );
};
export default TopNavBar;