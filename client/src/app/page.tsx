import LeftColumn from '@/components/layout/LeftColumn';
import CenterColumn from '@/components/layout/CenterColumn';
import RightColumn from '@/components/layout/RightColumn';
import DragAndDropArea from '@/components/cards/DragAndDropArea';
import TopNavBar from '@/components/layout/TopNavBar';

export default function Home() {
  return (
     <main style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ height: '50px' }}>
        <TopNavBar />
      </div>

      {/* rest of screen */}
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 3, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', flex: 1 }}>
            <LeftColumn />
            <CenterColumn />
            <RightColumn />
          </div>
          <div style={{ display: 'flex', flex: 1 }}>
            <DragAndDropArea />
          </div>
        </div>
      </div>
    </main>
  );
}