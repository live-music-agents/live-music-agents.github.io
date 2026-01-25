
import React from 'react';
import type { Paper, CodeMap, PaperFilter } from '../types';
import { View } from '../types';
import { ASPECT_COLORS, DEFAULT_COLORS } from '../constants';

interface PaperListViewerProps {
  papers: Paper[];
  filter: PaperFilter;
  onBack: () => void;
  codeMap: Record<number, CodeMap>;
  onPaperSelect: (paper: Paper) => void;
  onCodeTagClick: (codeId: number) => void;
  sourceTypeFilter: 'all' | 'paper' | 'video';
}

const PaperListViewer: React.FC<PaperListViewerProps> = ({ papers, filter, onBack, codeMap, onPaperSelect, onCodeTagClick, sourceTypeFilter }) => {
  let descriptionElement: React.ReactNode;
  let backButtonText: string;
  
  let resourceType: string;
  if (sourceTypeFilter === 'all') {
    resourceType = papers.length === 1 ? 'system' : 'systems';
  } else if (sourceTypeFilter === 'paper') {
    resourceType = papers.length === 1 ? 'paper' : 'papers';
  } else { // video
    resourceType = papers.length === 1 ? 'video' : 'videos';
  }
  const title = `Showing ${papers.length} ${resourceType}`;

  if (filter.type === 'cooccurrence') {
      const code1Info = codeMap[filter.codeId1];
      const code2Info = codeMap[filter.codeId2];
      
      const code1Colors = code1Info ? (ASPECT_COLORS[code1Info.aspect] || DEFAULT_COLORS) : DEFAULT_COLORS;
      const code2Colors = code2Info ? (ASPECT_COLORS[code2Info.aspect] || DEFAULT_COLORS) : DEFAULT_COLORS;
      
      descriptionElement = (
          <div className="inline-flex items-center justify-center gap-2 flex-wrap">
            <span>with</span>
            {code1Info ? (
                <button onClick={() => onCodeTagClick(filter.codeId1)} className={`px-2 py-0.5 text-base font-medium rounded-md ${code1Colors.tag} transition-transform hover:scale-105`}>
                    <span className="opacity-60 mr-0.5">#</span>{code1Info.code}
                </button>
            ) : `"${`Code ${filter.codeId1}`}"`}
            <span>and</span>
            {code2Info ? (
                <button onClick={() => onCodeTagClick(filter.codeId2)} className={`px-2 py-0.5 text-base font-medium rounded-md ${code2Colors.tag} transition-transform hover:scale-105`}>
                    <span className="opacity-60 mr-0.5">#</span>{code2Info.code}
                </button>
            ) : `"${`Code ${filter.codeId2}`}"`}
          </div>
      );
      backButtonText = 'Back to Heatmap';
  } else if (filter.type === 'trend') {
      const yearBinEnd = filter.yearBin + filter.binSize - 1;
      const yearRange = filter.binSize > 1 && filter.yearBin !== yearBinEnd ? `${filter.yearBin}-${yearBinEnd}` : `${filter.yearBin}`;
      
      if (filter.codeId === null) {
          descriptionElement = `for "Total Systems" in year bin ${yearRange}`;
      } else {
          const codeInfo = codeMap[filter.codeId];
          const codeColors = codeInfo ? (ASPECT_COLORS[codeInfo.aspect] || DEFAULT_COLORS) : DEFAULT_COLORS;

          descriptionElement = (
              <div className="inline-flex items-center justify-center gap-2 flex-wrap">
                <span>for</span>
                {codeInfo ? (
                    <button onClick={() => onCodeTagClick(filter.codeId as number)} className={`px-2 py-0.5 text-base font-medium rounded-md ${codeColors.tag} transition-transform hover:scale-105`}>
                        <span className="opacity-60 mr-0.5">#</span>{codeInfo.code}
                    </button>
                ) : `"${`Code ${filter.codeId}`}"`}
                <span>in year bin {yearRange}</span>
              </div>
          );
      }
      backButtonText = 'Back to Trends Chart';
  } else { // code filter
      const codeInfo = codeMap[filter.codeId];
      const codeColors = codeInfo ? (ASPECT_COLORS[codeInfo.aspect] || DEFAULT_COLORS) : DEFAULT_COLORS;
      
      descriptionElement = (
          <div className="inline-flex items-center justify-center gap-2 flex-wrap">
            <span>with tag</span>
            {codeInfo ? (
                <button onClick={() => onCodeTagClick(filter.codeId)} className={`px-2 py-0.5 text-base font-medium rounded-md ${codeColors.tag} transition-transform hover:scale-105`}>
                    <span className="opacity-60 mr-0.5">#</span>{codeInfo.code}
                </button>
            ) : `"${`Code ${filter.codeId}`}"`}
          </div>
      );
      backButtonText = filter.originView === View.TRENDS ? 'Back to Trends Chart' : 'Back to Heatmap';
  }

  return (
    <div className="w-full h-full flex flex-col text-gray-200">
      <div className="flex items-center mb-4">
        <button
          onClick={onBack}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {backButtonText}
        </button>
      </div>
      <div className="mb-4 text-center">
        <h3 className="text-xl font-bold text-white">
          {title}
        </h3>
        <div className="text-gray-400 mt-1 h-6 flex items-center justify-center">
          {descriptionElement}
        </div>
      </div>
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="space-y-4">
          {papers.sort((a,b) => (b.year || 0) - (a.year || 0)).map(paper => (
            <div key={paper.id} className="bg-gray-900/50 p-4 rounded-lg shadow-md border border-gray-700">
              <div className="flex justify-between items-start">
                  <button
                    onClick={() => onPaperSelect(paper)}
                    className="text-left text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md -ml-1 p-1"
                  >
                    {paper.title}
                  </button>
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open publication link"
                      className="ml-4 flex-shrink-0 p-2 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-gray-700"
                      aria-label="Open publication link in new tab"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  )}
              </div>

              <div className="text-base text-gray-400 mt-1">
                <span>{paper.venue || 'N/A'}</span>
                <span className="mx-2">&#8226;</span>
                <span>{paper.year || 'N/A'}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaperListViewer;
