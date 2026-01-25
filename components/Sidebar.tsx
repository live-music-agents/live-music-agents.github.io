
import React, { useState, useMemo } from 'react';
import type { AspectData, CodeMap, Paper } from '../types';
import { View } from '../types';
import { ASPECT_COLORS, DEFAULT_COLORS } from '../constants';

interface SidebarProps {
  aspects: AspectData;
  codeMap: Record<number, CodeMap>;
  currentView: View;
  setCurrentView: (view: View) => void;
  selectedTrendDimensions: number[];
  setSelectedTrendDimensions: (ids: number[]) => void;
  yearBinSize: number;
  setYearBinSize: (size: number) => void;
  showTotalPapers: boolean;
  setShowTotalPapers: (show: boolean) => void;
  dimensionsByAspect: { [key: string]: string[] };
  selectedCoDimension1: string;
  setSelectedCoDimension1: (dim: string) => void;
  selectedCoDimension2: string;
  setSelectedCoDimension2: (dim: string) => void;
  papers: Paper[];
  allCodes: CodeMap[];
  sourceTypeFilter: 'all' | 'paper' | 'video';
  setSourceTypeFilter: (filter: 'all' | 'paper' | 'video') => void;
  
  // Co-occurrence Filter Props
  coocSearchText?: string;
  setCoocSearchText?: (text: string) => void;
  coocSelectedCodes?: number[];
  setCoocSelectedCodes?: (codes: number[]) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  aspects,
  currentView,
  setCurrentView,
  selectedTrendDimensions,
  setSelectedTrendDimensions,
  yearBinSize,
  setYearBinSize,
  showTotalPapers,
  setShowTotalPapers,
  dimensionsByAspect,
  selectedCoDimension1,
  setSelectedCoDimension1,
  selectedCoDimension2,
  setSelectedCoDimension2,
  papers,
  allCodes,
  sourceTypeFilter,
  setSourceTypeFilter,
  coocSearchText = '',
  setCoocSearchText = (_: string) => {},
  coocSelectedCodes = [],
  setCoocSelectedCodes = (_: number[]) => {}
}) => {
  const [selectedTrendAspect, setSelectedTrendAspect] = useState<string>('');
  const [selectedTrendDimension, setSelectedTrendDimension] = useState<string>('');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [activeCooccurrencePreset, setActiveCooccurrencePreset] = useState<string | null>(null);

  // Local state for Co-occurrence Filters
  const [filterAspect, setFilterAspect] = useState<string>('');
  const [filterDimension, setFilterDimension] = useState<string>('');

  const aspectNames = Object.keys(aspects);

  // Memoized codes for Trend view selector
  const codesForSelectedDimension = useMemo(() => {
    if (!selectedTrendDimension) return [];
    
    const codesInDimension = allCodes.filter(c => c.dimension === selectedTrendDimension);
    
    const codesWithCounts = codesInDimension.map(code => {
        const count = papers.filter(p => p.codes.has(code.id)).length;
        return { ...code, count };
    });

    return codesWithCounts.sort((a, b) => b.count - a.count);
  }, [allCodes, selectedTrendDimension, papers]);

  // Memoized codes for Co-occurrence Filter selector
  const codesForFilterDimension = useMemo(() => {
    if (!filterDimension) return [];
    
    const codesInDimension = allCodes.filter(c => c.dimension === filterDimension);
    
    const codesWithCounts = codesInDimension.map(code => {
        const count = papers.filter(p => p.codes.has(code.id)).length;
        return { ...code, count };
    });

    return codesWithCounts.sort((a, b) => b.count - a.count);
  }, [allCodes, filterDimension, papers]);


  const handleDimensionToggle = (id: number) => {
    setActivePreset(null);
    const newSelection = selectedTrendDimensions.includes(id)
      ? selectedTrendDimensions.filter(dId => dId !== id)
      : [...selectedTrendDimensions, id];
    setSelectedTrendDimensions(newSelection);
  };
  
  const clearTrendSelection = () => {
    setActivePreset(null);
    setSelectedTrendDimensions([]);
  }

  const handleSelectAll = () => {
    setActivePreset(null);
    const allCodeIds = codesForSelectedDimension.map(c => c.id);
    setSelectedTrendDimensions(allCodeIds);
  };
  
  const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActivePreset(null);
    const newDimension = e.target.value;
    setSelectedTrendDimension(newDimension);

    if (!newDimension) {
      setSelectedTrendDimensions([]);
      return;
    }

    const codesInDimension = allCodes.filter(c => c.dimension === newDimension);
    const codeCounts = codesInDimension.map(code => {
      const count = papers.filter(p => p.codes.has(code.id)).length;
      return { id: code.id, count };
    });

    const top3Ids = codeCounts
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
      .map(c => c.id);

    setSelectedTrendDimensions(top3Ids);
  };

  // Handlers for Co-occurrence Filters
  const handleFilterDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterDimension(e.target.value);
  }

  const handleFilterCodeToggle = (id: number) => {
      const newSelection = coocSelectedCodes.includes(id)
        ? coocSelectedCodes.filter(c => c !== id)
        : [...coocSelectedCodes, id];
      setCoocSelectedCodes(newSelection);
  }

  const clearCoocFilters = () => {
      setCoocSelectedCodes([]);
      setCoocSearchText('');
  }

  const handleSwapDimensions = () => {
    const temp = selectedCoDimension1;
    setSelectedCoDimension1(selectedCoDimension2);
    setSelectedCoDimension2(temp);
  }

  const applyPreset = (
    presetName: string,
    aspect: string,
    dimension: string,
    codeIds: number[],
    binSize: number
  ) => {
    setActivePreset(presetName);
    setSelectedTrendAspect(aspect);
    setSelectedTrendDimension(dimension);
    setSelectedTrendDimensions(codeIds);
    setYearBinSize(binSize);
  };

  const handleTopMusicalContexts = () => {
    const dimensionName = 'Musical Context';
    const aspectName = 'Usage Context';
    
    const codesInDimension = allCodes.filter(c => c.dimension === dimensionName && c.code !== 'Non-specific');
    
    const codeCounts = codesInDimension.map(code => {
        const count = papers.filter(p => p.codes.has(code.id)).length;
        return { id: code.id, count };
    });

    const top4Ids = codeCounts
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map(c => c.id);
        
    applyPreset('top-contexts', aspectName, dimensionName, top4Ids, 3);
  };
  
  const handleEmergingMusicalContexts = () => {
      const dimensionName = 'Musical Context';
      const aspectName = 'Usage Context';
      
      const targetCodes = ["Live coding", "Traditional music", "Virtuosic practice"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && c.code !== 'Non-specific' && targetCodes.includes(c.code))
          .map(c => c.id);
          
      applyPreset('emerging-contexts', aspectName, dimensionName, codeIds, 3);
  };

  const handleTargetUserTrends = () => {
      const dimensionName = 'Target User';
      const aspectName = 'Usage Context';
      
      const targetCodes = ["Musicians", "Novice users", "Audience"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && targetCodes.includes(c.code))
          .map(c => c.id);
          
      applyPreset('target-users', aspectName, dimensionName, codeIds, 3);
  };

  const handleAIModelUsage = () => {
      const dimensionName = 'Model';
      const aspectName = 'Technology';
  
      const targetCodes = ["Task-specific DNN", "Classical ML", "Shallow neural network", "Generative AI"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && targetCodes.includes(c.code))
          .map(c => c.id);
      
      applyPreset('ai-models', aspectName, dimensionName, codeIds, 3);
  };

  const handleAdaptationTrends = () => {
      const dimensionName = 'Adaptation';
      const aspectName = 'Technology';
      
      const targetCodes = ["Offline adaptation", "Online adaptation", "Continual adaptation"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && targetCodes.includes(c.code))
          .map(c => c.id);
      
      applyPreset('adaptation-trends', aspectName, dimensionName, codeIds, 3);
  };

  const handleIntegrationTrends = () => {
      const dimensionName = 'Integration';
      const aspectName = 'Technology';
      
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && c.code !== 'NA')
          .map(c => c.id);
      
      applyPreset('integration-trends', aspectName, dimensionName, codeIds, 3);
  };

  const handleEmergingInterfaces = () => {
      const dimensionName = 'Interface';
      const aspectName = 'Interaction';
      
      const targetCodes = ["Programming interface", "Embodied agent", "DJ gear", "XR Interface"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && targetCodes.includes(c.code))
          .map(c => c.id);
      
      applyPreset('emerging-interfaces', aspectName, dimensionName, codeIds, 3);
  };

  const handleTopPlanningMethods = () => {
      const dimensionName = 'Planning';
      const aspectName = 'Interaction';
      
      const targetCodes = ["User configuration", "Tailoring", "Score"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && targetCodes.includes(c.code))
          .map(c => c.id);
      
      applyPreset('planning-methods', aspectName, dimensionName, codeIds, 3);
  };

  const handleTemporalStructureTrends = () => {
      const dimensionName = 'Temporal Structure';
      const aspectName = 'Interaction';
      
      const targetCodes = ["Dense parallel", "Sparse parallel", "Hybrid", "Turn-taking"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && targetCodes.includes(c.code))
          .map(c => c.id);
      
      applyPreset('temporal-structure', aspectName, dimensionName, codeIds, 3);
  };

  const handleSocioculturalTrends = () => {
      const dimensionName = 'Sociocultural Factors';
      const aspectName = 'Ecosystem';
      
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && c.code !== 'NA')
          .map(c => c.id);
      
      applyPreset('sociocultural-trends', aspectName, dimensionName, codeIds, 3);
  };

  const handleEmergingPolicyConsiderations = () => {
      const dimensionName = 'Policy Considerations';
      const aspectName = 'Ecosystem';
      
      const targetCodes = ["Data privacy", "Integrity", "Personality rights"];
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && targetCodes.includes(c.code))
          .map(c => c.id);
      
      applyPreset('policy-considerations', aspectName, dimensionName, codeIds, 3);
  };

  const handleEmergingEconomicConsequences = () => {
      const dimensionName = 'Economic Consequences';
      const aspectName = 'Ecosystem';
      
      const codeIds = allCodes
          .filter(c => c.dimension === dimensionName && c.code !== 'NA')
          .map(c => c.id);
      
      applyPreset('economic-consequences', aspectName, dimensionName, codeIds, 3);
  };
  
  const handleCoPreset = (presetName: string, dim1: string, dim2: string, filterCode?: string) => {
    setActiveCooccurrencePreset(presetName);
    setSelectedCoDimension1(dim1);
    setSelectedCoDimension2(dim2);
    
    if (filterCode) {
        const code = allCodes.find(c => c.code === filterCode);
        if (code) {
            setCoocSelectedCodes([code.id]);
        } else {
            setCoocSelectedCodes([]);
        }
    } else {
        setCoocSelectedCodes([]);
    }
  };


  return (
    <aside className="w-full md:w-96 lg:w-[500px] bg-gray-800 p-6 flex-shrink-0 shadow-lg md:h-screen md:overflow-y-auto no-scrollbar">
      <h1 className="text-3xl font-bold text-white mb-8 leading-snug">
        A Design Space for<br />Live Music Agents
      </h1>
      
      <div className="flex gap-3 mb-8">
        <button 
          onClick={() => setCurrentView(View.ABOUT)}
          className={`flex-1 text-center py-2 px-2 rounded text-sm font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${currentView === View.ABOUT ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
          </svg>
          About
        </button>
        <a 
          href="#" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-center py-2 px-2 rounded text-sm font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd" />
            <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z" />
          </svg>
          Paper
        </a>
        <a 
          href="https://docs.google.com/forms/d/e/1FAIpQLSdsJ8EVET8af8LkLAAhbOpM385IupkmNEQr7pAskKkMm1asSA/viewform?usp=dialog" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-center py-2 px-2 rounded text-sm font-medium transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Yours
        </a>
      </div>

      <hr className="border-gray-700 mb-6" />

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-300 mb-3">View</h2>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCurrentView(View.EXPLORER)}
            className={`px-3 py-2.5 text-base font-medium rounded-md transition-colors ${currentView === View.EXPLORER ? 'bg-blue-600 text-white shadow' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
          >
            Explorer
          </button>
          <button
            onClick={() => setCurrentView(View.DISTRIBUTION)}
            className={`px-3 py-2.5 text-base font-medium rounded-md transition-colors ${currentView === View.DISTRIBUTION ? 'bg-blue-600 text-white shadow' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
          >
            Frequency
          </button>
          <button
            onClick={() => setCurrentView(View.TRENDS)}
            className={`px-3 py-2.5 text-base font-medium rounded-md transition-colors ${currentView === View.TRENDS ? 'bg-blue-600 text-white shadow' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
          >
            Trends
          </button>
          <button
            onClick={() => setCurrentView(View.CO_OCCURRENCE)}
            className={`px-3 py-2.5 text-base font-medium rounded-md transition-colors ${currentView === View.CO_OCCURRENCE ? 'bg-blue-600 text-white shadow' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-700 border border-gray-700'}`}
          >
            Co-occurrence
          </button>
        </div>
      </div>
      
      <hr className="border-gray-700" />

      <div className="mt-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-300 mb-3">Source Type</h3>
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setSourceTypeFilter('all')}
              className={`w-1/3 py-2 text-base font-medium rounded-md transition-colors ${sourceTypeFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}
            >
              All
            </button>
            <button
              onClick={() => setSourceTypeFilter('paper')}
              className={`w-1/3 py-2 text-base font-medium rounded-md transition-colors ${sourceTypeFilter === 'paper' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}
            >
              Papers
            </button>
            <button
              onClick={() => setSourceTypeFilter('video')}
              className={`w-1/3 py-2 text-base font-medium rounded-md transition-colors ${sourceTypeFilter === 'video' ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:bg-gray-600'}`}
            >
              Videos
            </button>
          </div>
        </div>

        {currentView === View.DISTRIBUTION && (
            <div className="text-gray-400 text-base italic">
                The Frequency view provides a snapshot of how frequently different dimensions and codes appear in the dataset.
            </div>
        )}

        {currentView === View.TRENDS && (
          <div>
            <h3 className="text-base font-semibold text-gray-300 mb-3 border-t border-gray-700 pt-6 mt-6">Trends View</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 items-center gap-x-4 p-3 rounded-lg bg-gray-900/50 border border-gray-700">
                <label htmlFor="show-total-papers" className="flex items-center justify-between cursor-pointer">
                  <span className="text-base text-gray-300">Total Systems</span>
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="show-total-papers"
                      checked={showTotalPapers}
                      onChange={(e) => setShowTotalPapers(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </div>
                </label>
                
                <div className="flex items-center justify-between">
                    <label className="text-base font-medium text-gray-400">Year Bin</label>
                    <div className="flex items-center space-x-2">
                        <button
                        onClick={() => setYearBinSize(Math.max(1, yearBinSize - 1))}
                        className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={yearBinSize <= 1}
                        aria-label="Decrease year bin size"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                        </svg>
                        </button>
                        <span className="font-mono text-base text-white w-8 text-center">{yearBinSize}</span>
                        <button
                        onClick={() => setYearBinSize(Math.min(10, yearBinSize + 1))}
                        className="p-1 bg-gray-700 hover:bg-gray-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={yearBinSize >= 10}
                        aria-label="Increase year bin size"
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        </button>
                    </div>
                </div>
              </div>
              
              <div>
                  <label className="block text-base font-medium text-gray-400 mb-2">Select Aspect</label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-gray-700/50">
                      {aspectNames.map(name => (
                          <button
                              key={name}
                              onClick={() => {
                                  setActivePreset(null);
                                  setSelectedTrendAspect(name);
                                  setSelectedTrendDimension('');
                                  setSelectedTrendDimensions([]);
                              }}
                              className={`py-2 px-1 text-center text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800
                                  flex items-center justify-center whitespace-nowrap
                                  ${selectedTrendAspect === name 
                                      ? 'bg-gray-600 text-white shadow-md' 
                                      : 'text-gray-300 hover:bg-gray-700/80'
                                  }`
                              }
                          >
                              <span className="leading-tight">{name}</span>
                          </button>
                      ))}
                  </div>
              </div>
               {selectedTrendAspect && (
                  <div>
                      <label htmlFor="dimensionSelect" className="block text-base font-medium text-gray-400 mb-1">Select Dimension</label>
                      <select
                          id="dimensionSelect"
                          value={selectedTrendDimension}
                          onChange={handleDimensionChange}
                          className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-base"
                          disabled={!selectedTrendAspect}
                      >
                          <option value="">Select a dimension</option>
                          {(dimensionsByAspect[selectedTrendAspect] || []).map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                  </div>
               )}
               {selectedTrendDimension && (
                  <div>
                      <div className="flex justify-between items-center mb-2">
                          <h3 className="text-base font-medium text-gray-400">Select Codes</h3>
                          <div className="flex items-center space-x-2">
                              <button onClick={handleSelectAll} className="text-sm text-blue-400 hover:text-blue-300">Select All</button>
                              <button onClick={clearTrendSelection} className="text-sm text-blue-400 hover:text-blue-300">Clear</button>
                          </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto bg-gray-900/50 p-3 rounded-md space-y-2 border border-gray-700">
                      {codesForSelectedDimension.map(dim => (
                          <div key={dim.id} className="flex items-center">
                          <input
                              type="checkbox"
                              id={`dim-${dim.id}`}
                              checked={selectedTrendDimensions.includes(dim.id)}
                              onChange={() => handleDimensionToggle(dim.id)}
                              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor={`dim-${dim.id}`} className="ml-3 text-base text-gray-300">
                              {dim.code} <span className="text-gray-500">({dim.count})</span>
                          </label>
                          </div>
                      ))}
                      </div>
                  </div>
              )}
              {selectedTrendAspect && (
                <div className="mt-6 border-t border-gray-700 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <label className="text-base font-medium text-gray-400">Presets for {selectedTrendAspect}</label>
                        <div className="group relative flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-300 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 border border-gray-600 rounded shadow-xl text-base text-gray-200 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                                Presets provide example configurations to help users understand how the Trends view can be used.
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                        {selectedTrendAspect === 'Usage Context' && (
                            <>
                                <button
                                    onClick={handleTopMusicalContexts}
                                    title="Selects the 4 most frequently studied musical contexts."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'top-contexts'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Top 4 Musical Contexts
                                </button>
                                <button
                                    onClick={handleEmergingMusicalContexts}
                                    title="Selects Live coding, Traditional music, and Virtuosic practice to highlight emerging research areas."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'emerging-contexts'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Emerging Musical Contexts
                                </button>
                                <button
                                    onClick={handleTargetUserTrends}
                                    title="Compares Musicians, Novice users, and Audience."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'target-users'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Target User Trends
                                </button>
                            </>
                        )}
                        {selectedTrendAspect === 'Interaction' && (
                            <>
                                <button
                                    onClick={handleEmergingInterfaces}
                                    title="Highlights newer interface types like Embodied agents, XR, and Live coding interfaces."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'emerging-interfaces'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Emerging Interfaces
                                </button>
                                <button
                                    onClick={handleTopPlanningMethods}
                                    title="Compares User configuration, Tailoring, and Score planning methods."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'planning-methods'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Top Planning Methods
                                </button>
                                <button
                                    onClick={handleTemporalStructureTrends}
                                    title="Compares different temporal structures like Dense parallel and Turn-taking."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'temporal-structure'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Temporal Structure Trends
                                </button>
                            </>
                        )}
                        {selectedTrendAspect === 'Technology' && (
                            <>
                                <button
                                    onClick={handleAIModelUsage}
                                    title="Comparison of AI Model Architectures like Task-specific DNN and Generative AI."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'ai-models'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    AI Model Usage
                                </button>
                                <button
                                    onClick={handleAdaptationTrends}
                                    title="Compares Offline, Online, and Continual adaptation strategies."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'adaptation-trends'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Adaptation Trends
                                </button>
                                <button
                                    onClick={handleIntegrationTrends}
                                    title="Trends in how systems are integrated into workflows."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'integration-trends'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Integration Trends
                                </button>
                            </>
                        )}
                        {selectedTrendAspect === 'Ecosystem' && (
                            <>
                                <button
                                    onClick={handleSocioculturalTrends}
                                    title="Overview of sociocultural factors influencing system design."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'sociocultural-trends'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Sociocultural Trends
                                </button>
                                <button
                                    onClick={handleEmergingPolicyConsiderations}
                                    title="Trends in policy factors like Data privacy and Copyright."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'policy-considerations'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Policy Considerations
                                </button>
                                <button
                                    onClick={handleEmergingEconomicConsequences}
                                    title="Trends in economic consequences like Job replacement."
                                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                                    activePreset === 'economic-consequences'
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                                >
                                    Economic Consequences
                                </button>
                            </>
                        )}
                         {selectedTrendAspect !== 'Usage Context' && selectedTrendAspect !== 'Technology' && selectedTrendAspect !== 'Interaction' && selectedTrendAspect !== 'Ecosystem' && (
                            <p className="text-sm text-gray-500 italic">No presets available for this aspect.</p>
                        )}
                    </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === View.CO_OCCURRENCE && (
          <div>
            <h3 className="text-base font-semibold text-gray-300 mb-3 border-t border-gray-700 pt-6 mt-6">Co-occurrence View</h3>
            <div className="space-y-4">
              <div>
                  <label htmlFor="dimension-select-1" className="block text-base font-medium text-gray-400 mb-1">
                      Vertical Axis (Rows)
                  </label>
                  <select
                      id="dimension-select-1"
                      value={selectedCoDimension1}
                      onChange={(e) => {
                        setSelectedCoDimension1(e.target.value)
                        setActiveCooccurrencePreset(null)
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                      <option value="" disabled>Select a dimension</option>
                      {Object.entries(dimensionsByAspect).map(([aspect, dimensions]) => (
                          <optgroup key={aspect} label={aspect}>
                              {(dimensions as string[]).map(dim => <option key={dim} value={dim}>{dim}</option>)}
                          </optgroup>
                      ))}
                  </select>
              </div>
               <div className="text-center">
                  <button
                    onClick={handleSwapDimensions}
                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-full transition-transform duration-200 ease-in-out transform hover:rotate-180 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Swap dimensions"
                    disabled={!selectedCoDimension1 || !selectedCoDimension2}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 12l-3-3m3 3l3-3m7 3V4m0 12l-3-3m3 3l3-3" />
                    </svg>
                  </button>
              </div>
              <div>
                  <label htmlFor="dimension-select-2" className="block text-base font-medium text-gray-400 mb-1">
                      Horizontal Axis (Columns)
                  </label>
                  <select
                      id="dimension-select-2"
                      value={selectedCoDimension2}
                      onChange={(e) => {
                        setSelectedCoDimension2(e.target.value)
                        setActiveCooccurrencePreset(null)
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-base"
                  >
                      <option value="" disabled>Select a dimension</option>
                      {Object.entries(dimensionsByAspect).map(([aspect, dimensions]) => (
                          <optgroup key={aspect} label={aspect}>
                              {(dimensions as string[]).map(dim => <option key={dim} value={dim}>{dim}</option>)}
                          </optgroup>
                      ))}
                  </select>
              </div>

              {/* Data Filtering Section (Moved up) */}
              <div className="pt-6 border-t border-gray-700 mt-6">
                  <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-base font-semibold text-gray-300">Filter Data</h3>
                      <div className="group relative flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-300 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 border border-gray-600 rounded shadow-xl text-base text-gray-200 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                              Filter the dataset used for the heatmap. Selecting codes here restricts the analysis to only those systems that contain <em>all</em> the selected filter codes.
                          </div>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-base font-medium text-gray-400 mb-2">Filter by Code</label>
                          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-gray-700/50 mb-2">
                              {aspectNames.map(name => (
                                  <button
                                      key={name}
                                      onClick={() => {
                                          setFilterAspect(name);
                                          setFilterDimension('');
                                      }}
                                      className={`py-2 px-1 text-center text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800
                                          flex items-center justify-center whitespace-nowrap
                                          ${filterAspect === name 
                                              ? 'bg-gray-600 text-white shadow-md' 
                                              : 'text-gray-300 hover:bg-gray-700/80'
                                          }`
                                      }
                                  >
                                      <span className="leading-tight">{name}</span>
                                  </button>
                              ))}
                          </div>
                          
                          {filterAspect && (
                              <div className="mb-2">
                                  <select
                                      value={filterDimension}
                                      onChange={handleFilterDimensionChange}
                                      className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-blue-500 focus:border-blue-500 text-base"
                                  >
                                      <option value="">Select a dimension</option>
                                      {(dimensionsByAspect[filterAspect] || []).map(name => <option key={name} value={name}>{name}</option>)}
                                  </select>
                              </div>
                          )}
                          
                          {filterDimension && (
                              <div className="max-h-40 overflow-y-auto bg-gray-900/50 p-2 rounded-md space-y-2 border border-gray-700">
                                {codesForFilterDimension.map(dim => (
                                    <div key={dim.id} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={`filter-dim-${dim.id}`}
                                        checked={coocSelectedCodes.includes(dim.id)}
                                        onChange={() => handleFilterCodeToggle(dim.id)}
                                        className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor={`filter-dim-${dim.id}`} className="ml-3 text-base text-gray-300 cursor-pointer select-none">
                                        {dim.code} <span className="text-gray-500">({dim.count})</span>
                                    </label>
                                    </div>
                                ))}
                              </div>
                          )}
                          
                          {/* Active Filters Display */}
                          {(coocSelectedCodes.length > 0 || coocSearchText) && (
                              <div className="mt-4 pt-4 border-t border-gray-700">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-sm font-medium text-gray-400">Active Filters:</span>
                                      <button onClick={clearCoocFilters} className="text-xs text-blue-400 hover:underline">Clear All</button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                      {coocSelectedCodes.map(id => {
                                          const code = allCodes.find(c => c.id === id);
                                          if (!code) return null;
                                          const colors = ASPECT_COLORS[code.aspect] || DEFAULT_COLORS;
                                          return (
                                              <span key={id} className={`flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${colors.tag}`}>
                                                  {code.code}
                                                  <button onClick={() => handleFilterCodeToggle(id)} className="ml-1 -mr-0.5 p-0.5 opacity-70 hover:opacity-100 rounded-full hover:bg-black/20">
                                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                      </svg>
                                                  </button>
                                              </span>
                                          )
                                      })}
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Selection Presets Section (Moved down) */}
              <div className="pt-6 border-t border-gray-700 mt-6">
                <div className="flex items-center gap-2 mb-2">
                    <label className="text-base font-medium text-gray-400">Selection Presets</label>
                    <div className="group relative flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-300 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="absolute left-0 bottom-full mb-2 w-64 p-3 bg-gray-900 border border-gray-600 rounded shadow-xl text-base text-gray-200 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-relaxed">
                            Presets automatically configure the vertical and horizontal axes to explore meaningful relationships between dimensions.
                        </div>
                    </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={() => handleCoPreset('purpose-preference', 'Use Purpose', 'Value Emphasis')}
                    title="Explore the relationship between why a system is used and what users prefer."
                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                      activeCooccurrencePreset === 'purpose-preference'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Use Purpose & User Preference
                  </button>
                   <button
                    onClick={() => handleCoPreset('user-agent-roles', 'User Role', 'Agent Role')}
                    title="Analyze how the user's role corresponds to the AI agent's role in the interaction."
                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                      activeCooccurrencePreset === 'user-agent-roles'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    User Role & Agent Role
                  </button>
                  <button
                    onClick={() => handleCoPreset('target-user-role', 'Target User', 'User Role')}
                    title="Investigate the connection between the intended user group and the specific role they play."
                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                      activeCooccurrencePreset === 'target-user-role'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Target User & User Role
                  </button>
                  <button
                    onClick={() => handleCoPreset('value-adaptation', 'Value Emphasis', 'Adaptation')}
                    title="Compare how different user value emphases align with system adaptation strategies."
                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                      activeCooccurrencePreset === 'value-adaptation'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Value Emphasis & Adaptation
                  </button>
                  <button
                    onClick={() => handleCoPreset('learning-adaptation-pers', 'Learning Algorithm', 'Adaptation', 'Personalization')}
                    title="Examine learning algorithms and adaptation specifically for systems emphasizing Personalization."
                    className={`w-full text-left py-2 px-3 text-base rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
                      activeCooccurrencePreset === 'learning-adaptation-pers'
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Learning Alg. & Adaptation (filtered by Personalization)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
