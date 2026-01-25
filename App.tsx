
import React, { useState, useEffect, useMemo } from 'react';
import { parsePaperCodesCsv, parseMetadataCsv, parseMappingCsv, groupCodesByAspect, groupDimensionsByAspect } from './services/dataParser';
import type { Paper, CodeMap, AspectData, PaperFilter } from './types';
import { View } from './types';
import Sidebar from './components/Sidebar';
import YearlyTrendsChart from './components/YearlyTrendsChart';
import CooccurrenceHeatmap from './components/CooccurrenceHeatmap';
import PaperListViewer from './components/PaperListViewer';
import PaperDetailPage from './components/PaperDetailPage';
import Spinner from './components/Spinner';
import PaperExplorer from './components/PaperExplorer';
import DistributionView from './components/DistributionView';
import AboutPage from './components/AboutPage';

import paperDataUrl from './assets/paper_data.csv?url';
import metadataUrl from './assets/new_paper_metadata.csv?url';
import mappingUrl from './assets/new_code_mapping.csv?url';

const App: React.FC = () => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [codeMap, setCodeMap] = useState<Record<number, CodeMap>>({});
  const [allCodes, setAllCodes] = useState<CodeMap[]>([]);
  const [aspects, setAspects] = useState<AspectData>({});
  const [dimensionsByAspect, setDimensionsByAspect] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<View>(View.EXPLORER);

  // State for Yearly Trends
  const [selectedTrendDimensions, setSelectedTrendDimensions] = useState<number[]>([]);
  const [yearBinSize, setYearBinSize] = useState<number>(3);
  const [showTotalPapers, setShowTotalPapers] = useState<boolean>(false);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<'all' | 'paper' | 'video'>('all');

  // State for Co-occurrence
  const [selectedCoDimension1, setSelectedCoDimension1] = useState<string>('');
  const [selectedCoDimension2, setSelectedCoDimension2] = useState<string>('');
  // Filtering for Co-occurrence
  const [coocSearchText, setCoocSearchText] = useState<string>('');
  const [coocSelectedCodes, setCoocSelectedCodes] = useState<number[]>([]);
  
  // State for Explorer
  const [explorerSearchText, setExplorerSearchText] = useState<string>('');
  const [explorerSelectedCodes, setExplorerSelectedCodes] = useState<number[]>([]);

  // State for navigation
  const [paperFilter, setPaperFilter] = useState<PaperFilter | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [codesRes, metadataRes, mappingRes] = await Promise.all([
          fetch(paperDataUrl),
          fetch(metadataUrl),
          fetch(mappingUrl)
        ]);

        if (!codesRes.ok || !metadataRes.ok || !mappingRes.ok) {
          throw new Error('Failed to fetch data files.');
        }

        const [paperCodesCsv, metadataCsv, codeMappingCsv] = await Promise.all([
            codesRes.text(),
            metadataRes.text(),
            mappingRes.text()
        ]);
        
        const paperCodes = parsePaperCodesCsv(paperCodesCsv);
        const metadataMap = parseMetadataCsv(metadataCsv);
        const parsedMapping = parseMappingCsv(codeMappingCsv);
        
        const filteredMapping = parsedMapping.filter(
          code => code.code !== 'Other' && code.code !== 'NA'
        );

        const mergedPapers: Paper[] = [];
        metadataMap.forEach((meta, id) => {
            const codes = paperCodes.get(id);
            if (codes) {
                mergedPapers.push({
                    ...meta,
                    codes
                });
            }
        });

        const groupedAspects = groupCodesByAspect(filteredMapping);
        const groupedDimensions = groupDimensionsByAspect(filteredMapping);
        
        const map: Record<number, CodeMap> = {};
        filteredMapping.forEach(m => map[m.id] = m);

        setPapers(mergedPapers);
        setCodeMap(map);
        setAllCodes(filteredMapping);
        setAspects(groupedAspects);
        setDimensionsByAspect(groupedDimensions);
      } catch (e) {
        setError('Failed to load or parse data.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  
  const displayPapers = useMemo(() => {
    if (sourceTypeFilter === 'all') return papers;
    return papers.filter(p => p.sourceType === sourceTypeFilter);
  }, [papers, sourceTypeFilter]);

  const cooccurrencePapers = useMemo(() => {
    return displayPapers.filter(paper => {
      const titleMatch = !coocSearchText || paper.title.toLowerCase().includes(coocSearchText.toLowerCase());
      const codesMatch = coocSelectedCodes.length === 0 || coocSelectedCodes.every(codeId => paper.codes.has(codeId));
      return titleMatch && codesMatch;
    });
  }, [displayPapers, coocSearchText, coocSelectedCodes]);

  const handleCellClick = (codeId1: number, codeId2: number) => {
    setPaperFilter({ type: 'cooccurrence', codeId1, codeId2 });
  };

  const handleTrendDataPointClick = (codeId: number | null, yearBin: number) => {
    setPaperFilter({ type: 'trend', codeId, yearBin, binSize: yearBinSize });
  };

  const handlePaperSelect = (paper: Paper) => {
    setSelectedPaper(paper);
  };
  
  const handleViewChange = (view: View) => {
    setCurrentView(view);
    setPaperFilter(null);
    setSelectedPaper(null);
  };
  
  const handleBack = () => {
    if (selectedPaper) {
      // From Detail -> List/Explorer
      setSelectedPaper(null);
    } else if (paperFilter) {
      // From List -> Chart/Main View
      setPaperFilter(null);
    }
  };

  const handleCodeTagClick = (codeId: number) => {
    if (currentView === View.EXPLORER) {
      setCurrentView(View.EXPLORER);
      setExplorerSelectedCodes(prev => {
          if (prev.includes(codeId)) return prev;
          return [...prev, codeId];
      });
      setPaperFilter(null);
      setSelectedPaper(null);
    } else {
      // We are in TRENDS or CO_OCCURRENCE or DISTRIBUTION view.
      // Set a filter to show a paper list without changing the main view.
      setPaperFilter({ type: 'code', codeId, originView: currentView });
      setSelectedPaper(null);
    }
  };

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>;
    if (error) return <div className="flex items-center justify-center h-full text-red-400">{error}</div>;

    if (selectedPaper) {
      return <PaperDetailPage 
        paper={selectedPaper}
        onBack={handleBack}
        codeMap={codeMap}
        onCodeTagClick={handleCodeTagClick}
        sourceFilter={paperFilter}
      />;
    }

    if (paperFilter) {
      // When filtering from list view, we act on the currently active set of papers for that view
      // For Co-occurrence, we should ideally respect the filters applied there too, 
      // but usually drill-down respects the visual context. 
      // Let's use displayPapers (source filtered only) for broader context in drill down,
      // or should we use cooccurrencePapers? 
      // Generally, drill down from a cell implies "papers in this cell".
      // If the heatmap is filtered, the cell count is filtered. So the list should probably also be filtered.
      // However, keeping it simple: reuse displayPapers for now as per previous logic, 
      // unless we want strict consistency.
      // Let's stick to displayPapers for drill-down to avoid confusion if filters are hidden.
      
      let filteredPapers: Paper[];
      
      // If we are coming from Co-occurrence, we might want to respect the cooc filters.
      const basePapers = (paperFilter.type === 'cooccurrence' && currentView === View.CO_OCCURRENCE) 
        ? cooccurrencePapers 
        : displayPapers;

      if (paperFilter.type === 'cooccurrence') {
        filteredPapers = basePapers.filter(p => 
          p.codes.has(paperFilter.codeId1) && p.codes.has(paperFilter.codeId2)
        );
      } else if (paperFilter.type === 'trend') {
        const validPapers = displayPapers.filter(p => p.year !== null);
        const minYear = validPapers.length > 0 ? Math.min(...validPapers.map(p => p.year!)) : 0;
        const { codeId, yearBin, binSize } = paperFilter;

        filteredPapers = validPapers.filter(p => {
            const paperBinStart = Math.floor((p.year! - minYear) / binSize) * binSize + minYear;
            const hasCode = codeId === null || p.codes.has(codeId);
            return paperBinStart === yearBin && hasCode;
        });
      } else { // code filter
        filteredPapers = displayPapers.filter(p => p.codes.has(paperFilter.codeId));
      }
      
      return <PaperListViewer 
        papers={filteredPapers} 
        filter={paperFilter} 
        onBack={handleBack}
        codeMap={codeMap}
        onPaperSelect={handlePaperSelect}
        onCodeTagClick={handleCodeTagClick}
        sourceTypeFilter={sourceTypeFilter}
      />;
    }

    switch (currentView) {
      case View.TRENDS:
        return <YearlyTrendsChart 
          papers={displayPapers} 
          selectedDimensionIds={selectedTrendDimensions} 
          codeMap={codeMap} 
          binSize={yearBinSize}
          onDataPointClick={handleTrendDataPointClick}
          showTotalPapers={showTotalPapers}
        />;
      case View.CO_OCCURRENCE:
        return <CooccurrenceHeatmap 
          papers={cooccurrencePapers} 
          allCodes={allCodes} 
          selectedDimension1={selectedCoDimension1} 
          selectedDimension2={selectedCoDimension2} 
          onCellClick={handleCellClick} 
        />;
      case View.EXPLORER:
        return <PaperExplorer 
          papers={displayPapers}
          allCodes={allCodes}
          codeMap={codeMap}
          aspects={aspects}
          dimensionsByAspect={dimensionsByAspect}
          searchText={explorerSearchText}
          setSearchText={setExplorerSearchText}
          selectedCodes={explorerSelectedCodes}
          setSelectedCodes={setExplorerSelectedCodes}
          onPaperSelect={handlePaperSelect}
          onCodeTagClick={handleCodeTagClick}
        />;
      case View.DISTRIBUTION:
        return <DistributionView
          papers={displayPapers}
          allCodes={allCodes}
          codeMap={codeMap}
          onCodeClick={handleCodeTagClick}
        />;
      case View.ABOUT:
        return <AboutPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen md:h-screen bg-gray-900 text-gray-200 flex flex-col md:flex-row">
      <Sidebar
        aspects={aspects}
        currentView={currentView}
        setCurrentView={handleViewChange}
        selectedTrendDimensions={selectedTrendDimensions}
        setSelectedTrendDimensions={setSelectedTrendDimensions}
        yearBinSize={yearBinSize}
        setYearBinSize={setYearBinSize}
        dimensionsByAspect={dimensionsByAspect}
        selectedCoDimension1={selectedCoDimension1}
        setSelectedCoDimension1={setSelectedCoDimension1}
        selectedCoDimension2={selectedCoDimension2}
        setSelectedCoDimension2={setSelectedCoDimension2}
        codeMap={codeMap}
        papers={displayPapers}
        allCodes={allCodes}
        showTotalPapers={showTotalPapers}
        setShowTotalPapers={setShowTotalPapers}
        sourceTypeFilter={sourceTypeFilter}
        setSourceTypeFilter={setSourceTypeFilter}
        coocSearchText={coocSearchText}
        setCoocSearchText={setCoocSearchText}
        coocSelectedCodes={coocSelectedCodes}
        setCoocSelectedCodes={setCoocSelectedCodes}
      />
      <main className="flex-1 p-4 md:p-8 overflow-auto">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-4 md:p-6 w-full h-full min-h-[600px]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
