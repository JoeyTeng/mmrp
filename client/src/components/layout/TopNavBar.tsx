import { Download, Save, Upload, HelpCircle } from 'lucide-react';

const TopNavBar = () => {
  return (
    <div className='h-10 flex items-center px-6'>
      {/* Left group of nav items */}
      <div className='flex items-center gap-8'>
        <NavItem icon={<Download size={16} />} label='Import' />
        <NavItem icon={<Upload size={16} />} label='Export' />
        <NavItem icon={<Save size={16} />} label='Save' />
      </div>

      {/* Right-aligned help item */}
      <div className='ml-auto'>
        <NavItem icon={<HelpCircle size={16} />} label='Help' />
      </div>
    </div>
  );
};

const NavItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className='flex items-center gap-2 text-gray-700 text-sm font-medium hover:underline transition-colors cursor-pointer'>
    {icon}
    <span>{label}</span>
  </button>
);

export default TopNavBar;