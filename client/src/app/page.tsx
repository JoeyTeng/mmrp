import LeftColumn from '@/components/layout/LeftColumn';
import CenterColumn from '@/components/layout/CenterColumn';
import RightColumn from '@/components/layout/RightColumn';
import DragAndDropArea from '@/components/cards/DragAndDropArea';
import TopNavBar from '@/components/layout/TopNavBar';

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopNavBar />
      
      <div style={{ display: 'flex', flex: 1 }}>

        <div style={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <LeftColumn />
            <CenterColumn />
          </div>
          <div style={{ display: 'flex', flex: 1.25 }}>
            <DragAndDropArea />
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <RightColumn />
        </div>
        
      </div>
    </main>
  );
}