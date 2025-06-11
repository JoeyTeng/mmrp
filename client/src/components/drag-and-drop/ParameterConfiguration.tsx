'use client';

import React from 'react';
import type { Node } from '@xyflow/react';
import { moduleRegistry } from '../modules/modulesRegistry';
import { Info } from 'lucide-react';

type ParamsValue = string | number | string[];

type ParameterConfigurationProps = {
  node?: Node<{ label: string; params: Record<string, ParamsValue> }> | null;
  onChange: (key: string, value: ParamsValue) => void;
};

export default function ParameterConfiguration({
  node,
  onChange,
}: ParameterConfigurationProps) {
  if (!node) {
    return (
      <div className='flex-1 border border-gray-700 h-full bg-white'>
        <div className='bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300'>
          Select a node to configure
        </div>
        <div className='flex justify-evenly gap-2.5'>
          <Info size={16} className='text-gray-500' />
          <span>select pipeline module to edit parameters</span>
        </div>
      </div>
    );
  }

  const { label, params } = node.data;

  return (
    <div className='flex-1 border border-gray-900 rounded-md overflow-hidden bg-white h-full'>
      <div className='bg-gray-700 text-white font-semibold px-4 py-2 border-b border-gray-300'>
        {label} Parameters
      </div>
      <div className='p-2.5'>
        {Object.entries(params).map(([key, value]) => {
          // Shared label
          const labelEl = (
            <label htmlFor={key} className='block mb-1 font-medium'>
              {key}
            </label>
          );

          const moduleRegistryVal = (
            moduleRegistry[label].params as Record<
              string,
              string | number | string[]
            >
          )[key];
          // 1) string[]
          if (Array.isArray(moduleRegistryVal)) {
            const options = moduleRegistryVal as string[];
            const selected = Array.isArray(value) ? (value as string[]) : [];
            return (
              <div key={key} className='mb-4'>
                {labelEl}
                <select
                  id={key}
                  value={selected}
                  className='w-full p-1.5 rounded bg-gray-100'
                  onChange={(e) => {
                    const selected = Array.from(
                      e.currentTarget.selectedOptions,
                      (opt) => opt.value
                    );
                    onChange(key, selected);
                  }}
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            );
          }

          // 2) number
          if (typeof value === 'number') {
            return (
              <div key={key} className='mb-4'>
                {labelEl}
                <input
                  id={key}
                  type='number'
                  value={value}
                  onChange={(e) => onChange(key, Number(e.currentTarget.value))}
                  className='w-full p-1.5 rounded bg-gray-100'
                />
              </div>
            );
          }

          // 3) string
          return (
            <div key={key} className='mb-4'>
              {labelEl}
              <input
                id={key}
                type='text'
                value={value}
                onChange={(e) => onChange(key, e.currentTarget.value)}
                className='w-full p-1.5 rounded bg-gray-100'
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}