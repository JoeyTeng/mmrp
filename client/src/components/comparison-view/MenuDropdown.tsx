'use client';

import { Menu, MenuButton, MenuItems, MenuItem, Transition } from '@headlessui/react';
import { Menu as MenuIcon } from 'lucide-react';
import { Fragment } from 'react';

export enum viewOptions {
    SideBySide = 'Side-by-Side',
    Interleaving = 'Interleaving Frames'
}

interface MenuDropdownProps {
  onSelect: (view: viewOptions) => void;
}

const MenuDropdown = ({ onSelect }: MenuDropdownProps) => {
  return (
    <Menu as='div' className='relative inline-block z-50'>
        <MenuButton className='flex items-center text-white hover:text-gray-300'>
            <MenuIcon size={20} className='cursor-pointer' />
        </MenuButton>

        <Transition
            as={Fragment}
            enter='transition duration-100 ease-out'
            enterFrom='transform scale-95 opacity-0'
            enterTo='transform scale-100 opacity-100'
            leave='transition duration-75 ease-in'
            leaveFrom='transform scale-100 opacity-100'
            leaveTo='transform scale-95 opacity-0'
        >
            <MenuItems className='absolute z-50 mt-2 w-48 origin-top-left rounded-md bg-white shadow-lg'>
                <div className='px-4 py-2 text-sm text-gray-500 font-semibold'>
                    Select view:
                </div>
                <div className='py-1'>
                    {Object.entries(viewOptions).map(([opt, key]) => (
                        <MenuItem key={opt} as={Fragment}>
                            {({ active }) => (
                            <button
                                type='button'
                                onClick={() => onSelect(key)}
                                className={`${
                                active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                } block w-full px-4 py-2 text-sm cursor-pointer text-left`}
                            >
                                {key}
                            </button>
                            )}
                        </MenuItem>
                    ))}
                </div>
            </MenuItems>
        </Transition>
    </Menu>
  );
}

export default MenuDropdown;