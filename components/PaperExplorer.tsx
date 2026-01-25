import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Paper, CodeMap, AspectData } from '../types';
import { ASPECT_COLORS, DEFAULT_COLORS } from '../constants';

interface PaperExplorerProps {
  papers: Paper[];
  allCodes: CodeMap[];
  codeMap: Record<number, CodeMap>;
  aspects: AspectData;
  dimensionsByAspect: { [key: string]: string[] };
  searchText: string;
  setSearchText: (text: string) => void;
  selectedCodes: number[];
  setSelectedCodes: (codes: number[]) => void;
  onPaperSelect: (paper: Paper) => void;
  onCodeTagClick: (codeId: number) => void;
}


const DimensionFilter: React.FC<{
  dimension: string;
  allCodes: CodeMap[];
  selectedCodes: number[];
  onCodeToggle: (codeId: number) => void;
}> = ({ dimension, allCodes, selectedCodes, onCodeToggle }) => {
    const [searchText, setSearchText] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const codesForDimension = useMemo(() => allCodes.filter(c => c.dimension === dimension), [allCodes, dimension]);
    
    const filteredCodes = useMemo(() => 
        codesForDimension.filter(c => c.code.toLowerCase().includes(searchText.toLowerCase())),
        [codesForDimension, searchText]
    );

    const selectedCount = useMemo(() => 
        codesForDimension.filter(c => selectedCodes.includes(c.id)).length,
        [codesForDimension, selectedCodes]
    );
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(prev => !prev)}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                className="flex items-center gap-2 px-3 py-1.5 border border-dashed border-gray-600 rounded-lg hover:border-gray-400 transition-colors bg-gray-900/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-base font-medium text-gray-300">{dimension}</span>
                {selectedCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {selectedCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute z-20 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl">
                    <div className="p-2 border-b border-gray-700">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder={`Search ${dimension}...`}
                                value={searchText}
                                autoFocus
                                onChange={e => setSearchText(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-md py-1.5 pl-8 pr-2 text-sm text-white focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>
                    <div role="listbox" className="max-h-60 overflow-y-auto p-2">
                        {filteredCodes.length > 0 ? filteredCodes.map(code => (
                            <label key={code.id} role="option" aria-selected={selectedCodes.includes(code.id)} className="flex items-center px-2 py-1.5 rounded-md hover:bg-gray-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedCodes.includes(code.id)}
                                    onChange={() => onCodeToggle(code.id)}
                                    className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="ml-3 text-base text-gray-300">{code.code}</span>
                            </label>
                        )) : (
                            <div className="px-2 py-1.5 text-sm text-gray-500 text-center">No results found.</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};


const PaperExplorer: React.FC<PaperExplorerProps> = ({
  papers,
  allCodes,
  codeMap,
  aspects,
  dimensionsByAspect,
  searchText,
  setSearchText,
  selectedCodes,
  setSelectedCodes,
  onPaperSelect,
  onCodeTagClick,
}) => {
  const [selectedAspect, setSelectedAspect] = useState<string>('Usage Context');

  const aspectNames = useMemo(() => ['Usage Context', 'Interaction', 'Technology', 'Ecosystem'], []);

  const filteredPapers = useMemo(() => {
    return papers.filter(paper => {
      const titleMatch = paper.title.toLowerCase().includes(searchText.toLowerCase());
      const codesMatch = selectedCodes.every(codeId => paper.codes.has(codeId));
      return titleMatch && codesMatch;
    }).sort((a,b) => (b.year || 0) - (a.year || 0));
  }, [papers, searchText, selectedCodes]);

  const handleCodeToggle = (codeId: number) => {
    const newSelection = selectedCodes.includes(codeId)
      ? selectedCodes.filter(id => id !== codeId)
      : [...selectedCodes, codeId];
    setSelectedCodes(newSelection);
  };
  
  const clearFilters = () => {
      setSearchText('');
      setSelectedCodes([]);
  }

  return (
    <div className="w-full h-full flex flex-col text-gray-200">
      <h3 className="text-2xl font-bold text-white mb-4">System Explorer</h3>
      
      {/* Filter Controls */}
      <div className="flex-shrink-0 space-y-4 mb-4 border-b border-gray-700 pb-4">
        <input 
            type="text"
            placeholder="Search by title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-base"
        />
        <div>
            <div className="flex bg-gray-700 rounded-lg p-1">
                {aspectNames.map(name => (
                    <button
                        key={name}
                        onClick={() => setSelectedAspect(name)}
                        className={`flex-1 py-2 px-1 text-center text-base font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800
                            ${selectedAspect === name 
                                ? 'bg-blue-600 text-white shadow' 
                                : 'text-gray-300 hover:bg-gray-600/50'
                            }`
                        }
                    >
                        {name}
                    </button>
                ))}
            </div>
        </div>
        
        {selectedAspect && (
            <div className="flex flex-wrap gap-2 pt-2">
                {(dimensionsByAspect[selectedAspect] || []).map(dimension => (
                     <DimensionFilter
                        key={dimension}
                        dimension={dimension}
                        allCodes={allCodes}
                        selectedCodes={selectedCodes}
                        onCodeToggle={handleCodeToggle}
                     />
                ))}
            </div>
        )}
        
        {selectedCodes.length > 0 &&
            <div className="flex items-center flex-wrap gap-2 p-3 bg-gray-900/50 border border-gray-700 rounded-md">
                <span className="text-base font-medium text-gray-400 mr-2">Active Filters:</span>
                {selectedCodes.map(id => {
                    const code = codeMap[id];
                    if (!code) return null;
                    const colors = ASPECT_COLORS[code.aspect] || DEFAULT_COLORS;
                    return (
                        <span key={id} className={`flex items-center px-2.5 py-1 text-base font-medium rounded-full ${colors.tag}`}>
                            {code.code}
                            <button onClick={() => handleCodeToggle(id)} className="ml-1.5 -mr-1 p-0.5 opacity-70 hover:opacity-100 focus:outline-none rounded-full hover:bg-black/20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </span>
                    )
                })}
                <button onClick={clearFilters} className="ml-auto text-sm text-blue-400 hover:underline">Clear All</button>
            </div>
        }
      </div>

      {/* Paper List */}
      <div className="flex-grow overflow-y-auto pr-2">
        <div className="mb-2 text-base text-gray-400">{filteredPapers.length} of {papers.length} papers shown</div>
        <div className="space-y-4">
          {filteredPapers.map(paper => {
              const paperCodes = Array.from(paper.codes).map((id: number) => codeMap[id]).filter((c): c is CodeMap => !!c);
              return (
                <div key={paper.id} className="bg-gray-900/50 p-4 rounded-lg shadow-md border border-gray-700">
                  <button
                    onClick={() => onPaperSelect(paper)}
                    className="text-left text-2xl font-semibold text-blue-400 hover:text-blue-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md -ml-1 p-1"
                  >
                    {paper.title}
                  </button>

                  <div className="text-base text-gray-400 mt-1 mb-3">
                    <span>{paper.venue || 'N/A'}</span>
                    <span className="mx-2">&#8226;</span>
                    <span>{paper.year || 'N/A'}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                      {paperCodes.map(code => {
                        const colors = ASPECT_COLORS[code.aspect] || DEFAULT_COLORS;
                        return (
                             <button
                                key={code.id}
                                onClick={() => onCodeTagClick(code.id)}
                                className={`px-2 py-0.5 text-base font-medium rounded-full ${colors.tag} transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                            >
                                <span className="opacity-60 mr-0.5">#</span>{code.code}
                            </button>
                        )
                      })}
                  </div>
                </div>
              )
          })}
        </div>
      </div>
    </div>
  );
};

export default PaperExplorer;