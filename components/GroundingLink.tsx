
import React from 'react';
import { GroundingChunk } from '../types';

interface Props {
  chunks: GroundingChunk[];
}

export const GroundingLinks: React.FC<Props> = ({ chunks }) => {
  const mapChunks = chunks.filter(chunk => chunk.maps);

  if (mapChunks.length === 0) return null;

  return (
    <div className="mt-4 border-t border-gray-100 pt-3">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sources & Places</h4>
      <div className="flex flex-wrap gap-2">
        {mapChunks.map((chunk, index) => (
          <a
            key={index}
            href={chunk.maps?.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors border border-blue-200"
          >
            <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            {chunk.maps?.title || 'View on Maps'}
          </a>
        ))}
      </div>
    </div>
  );
};
