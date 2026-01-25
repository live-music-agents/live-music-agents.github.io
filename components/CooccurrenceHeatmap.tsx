
import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Paper, CodeMap } from '../types';

interface CooccurrenceHeatmapProps {
  papers: Paper[];
  allCodes: CodeMap[];
  selectedDimension1: string;
  selectedDimension2: string;
  onCellClick: (codeId1: number, codeId2: number) => void;
}

const CooccurrenceHeatmap: React.FC<CooccurrenceHeatmapProps> = ({ papers, allCodes, selectedDimension1, selectedDimension2, onCellClick }) => {
  const [hoveredCell, setHoveredCell] = useState<{ x: string, y: string, count: number, total: number, percent: number } | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ i: number, j: number } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPanPosition, setStartPanPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const { matrix, normalizedMatrix, dims1, dims2, rowTotals, maxCount } = useMemo(() => {
    const dims1 = allCodes.filter(c => c.dimension === selectedDimension1).sort((a, b) => a.id - b.id);
    const dims2 = allCodes.filter(c => c.dimension === selectedDimension2).sort((a, b) => a.id - b.id);
    
    if (dims1.length === 0 || dims2.length === 0) {
      return { matrix: {}, normalizedMatrix: {}, dims1: [], dims2: [], rowTotals: {}, maxCount: 0 };
    }
    
    const isSymmetric = selectedDimension1 === selectedDimension2;

    const matrix: Record<number, Record<number, number>> = {};
    const rowTotals: Record<number, number> = {};

    dims1.forEach(d1 => {
      matrix[d1.id] = {};
      rowTotals[d1.id] = 0;
      dims2.forEach(d2 => {
        matrix[d1.id][d2.id] = 0;
      });
    });

    for (const paper of papers) {
      const paperCodes = paper.codes;
      
      dims1.forEach(d1 => {
        if (paperCodes.has(d1.id)) {
            rowTotals[d1.id]++;
        }
      });

      const paperDims1 = dims1.filter(d => paperCodes.has(d.id));
      const paperDims2 = isSymmetric ? paperDims1 : dims2.filter(d => paperCodes.has(d.id));

      for (const d1 of paperDims1) {
        for (const d2 of paperDims2) {
           if (isSymmetric) {
            if (d1.id <= d2.id) {
              matrix[d1.id][d2.id]++;
            }
          } else {
            matrix[d1.id][d2.id]++;
          }
        }
      }
    }
    
    if (isSymmetric) {
      dims1.forEach(d1 => {
        dims1.forEach(d2 => {
          if (d1.id < d2.id) {
            matrix[d2.id][d1.id] = matrix[d1.id][d2.id];
          }
        });
      });
    }

    const normalizedMatrix: Record<number, Record<number, number>> = {};
    let maxCount = 0;

    dims1.forEach(d1 => {
        normalizedMatrix[d1.id] = {};
        
        // Calculate the sum of co-occurrences for the current row (d1)
        const rowSumOfCooccurrences = dims2.reduce((sum, d2) => {
            if (isSymmetric && d1.id === d2.id) {
                return sum; // Exclude diagonal from sum in symmetric case
            }
            return sum + (matrix[d1.id]?.[d2.id] || 0);
        }, 0);

        dims2.forEach(d2 => {
            const count = matrix[d1.id]?.[d2.id] || 0;
            
            const isDiagonal = isSymmetric && d1.id === d2.id;
            
            if (!isDiagonal && count > maxCount) {
                maxCount = count;
            }

            if (isDiagonal) {
                normalizedMatrix[d1.id][d2.id] = 0; // Keep diagonal at 0 for visualization
            } else {
                normalizedMatrix[d1.id][d2.id] = rowSumOfCooccurrences > 0 ? count / rowSumOfCooccurrences : 0;
            }
        });
    });

    return { matrix, normalizedMatrix, dims1, dims2, rowTotals, maxCount };
  }, [papers, allCodes, selectedDimension1, selectedDimension2]);
  
    const yLabelWidth = 300;
    const xLabelHeight = 250;
    const cellSize = 90;

    const svgWidth = dims2.length * cellSize + yLabelWidth;
    const svgHeight = dims1.length * cellSize + xLabelHeight;
    
    const centerAndFit = () => {
        if (containerRef.current && dims1.length > 0 && dims2.length > 0) {
            const rect = containerRef.current.getBoundingClientRect();
            
            const boxWidth = dims2.length * cellSize;
            const boxHeight = dims1.length * cellSize;
            
            if (boxWidth <= 0 || boxHeight <= 0) return;

            // Use 90% of the container for a bit of padding
            const scaleX = (rect.width * 0.9) / boxWidth;
            const scaleY = (rect.height * 0.9) / boxHeight;
            const newScale = Math.min(scaleX, scaleY, 1); // Cap at 1 to avoid enlarging past native size

            // Calculate translation to center the BOX, not the entire SVG
            const newX = (rect.width / 2) - ((yLabelWidth + boxWidth / 2) * newScale);
            const newY = (rect.height / 2) - ((boxHeight / 2) * newScale);
            
            setTransform({ scale: newScale, x: newX, y: newY });
        }
    };
    
    useEffect(() => {
        const timeoutId = setTimeout(centerAndFit, 0); // Allow container to render
        return () => clearTimeout(timeoutId);
    }, [selectedDimension1, selectedDimension2, svgWidth, svgHeight]);

  const getColor = (value: number) => { 
    if (value <= 0) return 'rgb(31, 41, 55)';
    // Linear scale for counts is often better than sqrt when comparing absolute numbers,
    // but sqrt still helps seeing low numbers against high peaks. 
    // Let's stick to sqrt for better visibility of smaller counts.
    const scaledValue = Math.sqrt(value);
    
    const colors = [
        { r: 254, g: 240, b: 163 }, 
        { r: 253, g: 184, b: 99 },  
        { r: 227, g: 74,  b: 51 },  
        { r: 120, g: 4,   b: 108 }   
    ];
    const segment = (colors.length - 1) * scaledValue;
    const index = Math.floor(segment);
    const fraction = segment - index;

    if (index >= colors.length - 1) {
        return `rgb(${colors[colors.length - 1].r}, ${colors[colors.length - 1].g}, ${colors[colors.length - 1].b})`;
    }

    const r = Math.floor(colors[index].r + (colors[index + 1].r - colors[index].r) * fraction);
    const g = Math.floor(colors[index].g + (colors[index + 1].g - colors[index].g) * fraction);
    const b = Math.floor(colors[index].b + (colors[index + 1].b - colors[index].b) * fraction);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const getTextColor = (value: number) => {
    return value > 0.5 ? '#FFFFFF' : '#000000';
  };

  if (!dims1.length || !dims2.length) {
    return (
        <div className="flex items-center justify-center h-full text-gray-500">
            Please select dimensions for both axes to generate the heatmap.
        </div>
    );
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const scaleAmount = 1 - e.deltaY * 0.001;
    const newScale = Math.min(Math.max(0.2, transform.scale * scaleAmount), 5);
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const svgMouseX = (mouseX - transform.x) / transform.scale;
    const svgMouseY = (mouseY - transform.y) / transform.scale;

    const newX = mouseX - svgMouseX * newScale;
    const newY = mouseY - svgMouseY * newScale;

    setTransform({ scale: newScale, x: newX, y: newY });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsPanning(true);
    setStartPanPosition({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltipPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    }

    if (isPanning) {
        const x = e.clientX - startPanPosition.x;
        const y = e.clientY - startPanPosition.y;
        setTransform(prev => ({ ...prev, x, y }));
    }
  };

  const handleMouseUpOrLeave = () => {
    setIsPanning(false);
  };
  
  const handleZoom = (direction: 'in' | 'out') => {
      if (!containerRef.current) return;
      const scaleFactor = 1.2;
      const oldScale = transform.scale;
      const newScale = direction === 'in' ? oldScale * scaleFactor : oldScale / scaleFactor;
      const clampedScale = Math.min(Math.max(0.2, newScale), 5);
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const svgCenterX = (centerX - transform.x) / oldScale;
      const svgCenterY = (centerY - transform.y) / oldScale;

      const newX = centerX - svgCenterX * clampedScale;
      const newY = centerY - svgCenterY * clampedScale;
      
      setTransform({ scale: clampedScale, x: newX, y: newY });
  };

  const renderWrappedYLabel = (d1: CodeMap, i: number) => {
    const fullLabel = `${d1.code} (${rowTotals[d1.id]})`;
    const yPos = i * cellSize + (cellSize / 2);
    const xPos = yLabelWidth - 10;
    const maxChars = 26;

    if (fullLabel.length <= maxChars) {
      return (
        <text key={d1.id} x={xPos} y={yPos} textAnchor="end" dominantBaseline="middle" fill="#9ca3af" fontSize="16">
          <title>{d1.code} ({rowTotals[d1.id]} papers)</title>
          {fullLabel}
        </text>
      )
    }

    let breakPoint = fullLabel.lastIndexOf(' ', maxChars);
    if (breakPoint === -1) breakPoint = maxChars;

    const line1 = fullLabel.substring(0, breakPoint);
    const line2 = fullLabel.substring(breakPoint + 1);

    return (
        <text key={d1.id} textAnchor="end" dominantBaseline="middle" fill="#9ca3af" fontSize="16">
           <title>{d1.code} ({rowTotals[d1.id]} papers)</title>
           <tspan x={xPos} y={yPos} dy="-0.6em">{line1}</tspan>
           <tspan x={xPos} y={yPos} dy="1em">{line2}</tspan>
        </text>
    )
  };
  
  const renderWrappedXLabel = (d2: CodeMap, i: number) => {
    const label = d2.code;
    const maxChars = 18;
    let line1 = label;
    let line2 = '';
    if (label.length > maxChars) {
        let breakPoint = label.lastIndexOf(' ', maxChars);
        if (breakPoint === -1) breakPoint = maxChars;
        line1 = label.substring(0, breakPoint);
        line2 = label.substring(breakPoint + 1);
    }
  
    return (
      <g key={d2.id} transform={`translate(${yLabelWidth + i * cellSize + (cellSize / 2)}, ${dims1.length * cellSize + 10})`}>
        <text transform="rotate(-40)" textAnchor="end" fill="#9ca3af" fontSize="16">
            <title>{d2.code}</title>
            <tspan x={0} dy="0.5em">{line1}</tspan>
            {line2 && <tspan x={0} dy="1.2em">{line2}</tspan>}
        </text>
      </g>
    )
  };

  const isSymmetric = selectedDimension1 === selectedDimension2;

  return (
    <div className="w-full h-full flex flex-col">
        <h3 className="text-2xl font-bold mb-1 text-white">Co-occurrence Heatmap</h3>
        <p className="text-sm text-gray-500 mb-2">Note: Row sums may exceed the total number of systems because multiple codes can be assigned within a single dimension.</p>
        <p className="text-base text-gray-400 mb-2">Use scroll to zoom, and click & drag to pan.</p>
        
        <div className="flex-grow flex overflow-hidden">
            <div className="flex items-center justify-center p-2" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                <p className="font-semibold text-gray-300 whitespace-nowrap text-lg">{selectedDimension1}</p>
            </div>

            <div className="flex-grow flex flex-col overflow-hidden">
                <div className="text-center p-2">
                    <p className="font-semibold text-gray-300 text-lg">{selectedDimension2}</p>
                </div>
                
                <div 
                    ref={containerRef}
                    className="flex-grow overflow-hidden relative bg-gray-900/50 rounded-md"
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                    style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
                >
                    <div style={{
                        width: svgWidth,
                        height: svgHeight,
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        transformOrigin: '0 0'
                    }}>
                        <svg width={svgWidth} height={svgHeight}>
                            {/* Y-axis labels */}
                            {dims1.map(renderWrappedYLabel)}

                            {/* X-axis labels */}
                            {dims2.map(renderWrappedXLabel)}
                            
                            {/* Heatmap cells */}
                            <g transform={`translate(${yLabelWidth}, 0)`}>
                                {dims1.map((d1, i) => (
                                    <g key={d1.id}>
                                        {dims2.map((d2, j) => {
                                            const count = matrix[d1.id]?.[d2.id] || 0;
                                            const total = rowTotals[d1.id] || 0;
                                            const percent = normalizedMatrix[d1.id]?.[d2.id] || 0;
                                            
                                            // New intensity calculation based on maxCount across the grid
                                            const intensity = maxCount > 0 ? (count / maxCount) : 0;
                                            
                                            const isDiagonal = isSymmetric && d1.id === d2.id;
                                            const isHovered = hoveredCoords?.i === i && hoveredCoords?.j === j;

                                            return (
                                                <g key={d2.id}
                                                    onClick={() => { if (count > 0 && !isDiagonal) onCellClick(d1.id, d2.id); }}
                                                    onMouseEnter={() => {
                                                        if (count > 0 && !isDiagonal) {
                                                            setHoveredCell({ x: d2.code, y: d1.code, count, total, percent });
                                                            setHoveredCoords({ i, j });
                                                        }
                                                    }}
                                                    onMouseLeave={() => {
                                                        setHoveredCell(null);
                                                        setHoveredCoords(null);
                                                    }}
                                                    className={(count > 0 && !isDiagonal) ? "cursor-pointer" : ""}
                                                >
                                                    <rect
                                                        x={j * cellSize + 1}
                                                        y={i * cellSize + 1}
                                                        width={cellSize - 2}
                                                        height={cellSize - 2}
                                                        fill={isDiagonal ? 'transparent' : getColor(intensity)}
                                                        rx="3"
                                                        ry="3"
                                                        stroke={isHovered ? "white" : (isDiagonal ? '#282828' : '#3E3E3E')}
                                                        strokeWidth={isHovered ? 2 : 1}
                                                        style={{ transition: 'all 150ms ease-in-out' }}
                                                    />
                                                    {!isDiagonal && count > 0 && (
                                                      <text
                                                          x={j * cellSize + cellSize / 2}
                                                          y={i * cellSize + cellSize / 2}
                                                          textAnchor="middle"
                                                          dominantBaseline="central"
                                                          fontSize="16"
                                                          fill={getTextColor(intensity)}
                                                          className="pointer-events-none font-semibold"
                                                      >
                                                          {count}
                                                      </text>
                                                    )}
                                                </g>
                                            );
                                        })}
                                    </g>
                                ))}
                            </g>
                        </svg>
                    </div>
                     {/* Zoom Controls */}
                    <div className="absolute bottom-4 right-4 flex flex-col space-y-1 bg-gray-800/80 p-1.5 rounded-lg border border-gray-600 shadow-lg">
                        <button onClick={() => handleZoom('in')} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md" title="Zoom In">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={() => handleZoom('out')} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md" title="Zoom Out">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                        </button>
                        <button onClick={centerAndFit} className="p-1.5 text-gray-300 hover:bg-gray-700 rounded-md" title="Reset View">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                        </button>
                    </div>
                    {hoveredCell && !isPanning && (
                        <div className="absolute pointer-events-none bg-gray-800 p-3 rounded-md border border-gray-600 shadow-lg text-base max-w-xs" style={{ top: tooltipPosition.y + 15, left: tooltipPosition.x + 15 }}>
                            <p><span className="font-bold text-white">{hoveredCell.y}</span></p>
                            <p><span className="text-gray-400">& </span><span className="font-bold text-white">{hoveredCell.x}</span></p>
                            <div className="mt-2 pt-2 border-t border-gray-600">
                                <p className="text-gray-300">Co-occurrence count: <span className="font-semibold text-white">{hoveredCell.count}</span></p>
                                <p className="text-gray-300">Total systems with <span className="font-semibold italic text-white">'{hoveredCell.y}'</span>: <span className="font-semibold text-white">{hoveredCell.total}</span></p>
                                <p className="text-gray-300">Share of co-occurrences for '{hoveredCell.y}': <span className="font-semibold text-white">{(hoveredCell.percent * 100).toFixed(1)}%</span></p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default CooccurrenceHeatmap;
