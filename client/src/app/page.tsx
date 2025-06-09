import LeftColumn from '@/components/layout/LeftColumn';
import CenterColumn from '@/components/layout/CenterColumn';
import RightColumn from '@/components/layout/RightColumn';
import DragAndDropArea from '@/components/cards/DragAndDropArea';
import TopNavBar from '@/components/layout/TopNavBar';

export default function Home() {
  return (
     <main className="h-screen w-screen flex flex-col overflow-hidden">
      <TopNavBar />

      {/* rest of screen */}
      <div className="flex flex-1">
        <div className="flex flex-col flex-3 gap-0.5">
          <div className="flex flex-1 gap-0.5">
            <LeftColumn />
            <CenterColumn />
            <RightColumn />
          </div>
          <div className="flex flex-1">
            <DragAndDropArea />
          </div>
        </div>
      </div>
    </main>
  );
}