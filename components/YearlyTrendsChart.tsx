import React, { useMemo, useState } from 'react';
import type { Paper, CodeMap } from '../types';
import { ResponsiveContainer, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Area } from 'recharts';

interface YearlyTrendsChartProps {
  papers: Paper[];
  selectedDimensionIds: number[];
  codeMap: Record<number, CodeMap>;
  binSize: number;
  onDataPointClick: (codeId: number | null, yearBin: number) => void;
  showTotalPapers: boolean;
}

const COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b',
  '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
];
const TOTAL_COLOR = '#9ca3af';

const YearlyTrendsChart: React.FC<YearlyTrendsChartProps> = ({ papers, selectedDimensionIds, codeMap, binSize, onDataPointClick, showTotalPapers }) => {
  const [hoveredLineKey, setHoveredLineKey] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const yearlyCounts: { [year: number]: { total: number, [key: number]: number } } = {};
    const validPapers = papers.filter(p => p.year !== null);
    if (validPapers.length === 0) return [];
    
    const minYear = Math.min(...validPapers.map(p => p.year!));
    const maxYear = Math.max(...validPapers.map(p => p.year!));

    for (let p of validPapers) {
      const year = p.year!;
      const binStart = Math.floor((year - minYear) / binSize) * binSize + minYear;

      if (!yearlyCounts[binStart]) {
        yearlyCounts[binStart] = { total: 0 };
        selectedDimensionIds.forEach(id => yearlyCounts[binStart][id] = 0);
      }
      
      yearlyCounts[binStart].total++;
      
      selectedDimensionIds.forEach(id => {
        if (p.codes.has(id)) {
          yearlyCounts[binStart][id]++;
        }
      });
    }
    
    // Fill in empty years/bins
    for (let y = minYear; y <= maxYear; y += binSize) {
        const binStart = y;
        if (!yearlyCounts[binStart]) {
            yearlyCounts[binStart] = { total: 0 };
            selectedDimensionIds.forEach(id => yearlyCounts[binStart][id] = 0);
        }
    }

    // Format for chart
    return Object.entries(yearlyCounts)
      .map(([year, counts]) => {
        const binStart = parseInt(year, 10);
        const binEnd = binStart + binSize - 1;
        const yearLabel = binSize > 1 ? `${binStart}-${binEnd}` : `${binStart}`;
        return { year: binStart, yearLabel, ...counts };
      })
      .sort((a, b) => a.year - b.year);

  }, [papers, selectedDimensionIds, binSize]);

  const sortedDimensionIds = useMemo(() => {
    if (!hoveredLineKey || hoveredLineKey === 'total') {
      return selectedDimensionIds;
    }
    const hoveredId = parseInt(hoveredLineKey, 10);
    if (!selectedDimensionIds.includes(hoveredId)) {
      return selectedDimensionIds;
    }
    
    // Bring the hovered line to the end of the array so it's rendered last (on top)
    return [
      ...selectedDimensionIds.filter(id => id !== hoveredId),
      hoveredId,
    ];
  }, [selectedDimensionIds, hoveredLineKey]);
  
  const CustomTooltip = ({ active, payload, label, hoveredLineKey }: any) => {
    if (active && payload && payload.length) {
        const yearBinStart = payload[0].payload.year;
        const yearBinEnd = yearBinStart + binSize - 1;
        const yearLabel = binSize > 1 ? `${yearBinStart}-${yearBinEnd}` : `${yearBinStart}`;
      return (
        <div className="bg-gray-700 p-3 rounded-md border border-gray-600 shadow-lg">
          <p className="font-bold text-white">{`Year Bin: ${yearLabel}`}</p>
           <p className="text-gray-400 text-sm mt-1">{`Number of Systems:`}</p>
          {payload.sort((a: any, b: any) => b.value - a.value).map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className={`text-sm transition-all ${entry.dataKey === hoveredLineKey ? 'font-bold' : ''}`}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const formatYAxis = (tickItem: number) => {
    return Number.isInteger(tickItem) ? tickItem.toString() : '';
  }

  const renderTotalPapersDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (!payload || payload.total <= 0) return null;

    const isFocused = hoveredLineKey === 'total';

    const handleClick = () => {
      onDataPointClick(null, payload.year);
    };

    return (
      <g
        onClick={handleClick}
        onMouseEnter={() => setHoveredLineKey('total')}
        onMouseLeave={() => setHoveredLineKey(null)}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={cx} cy={cy} r="12" fill="transparent" />
        <circle
          cx={cx}
          cy={cy}
          r={isFocused ? 8 : 5}
          fill={TOTAL_COLOR}
          stroke="white"
          strokeWidth="2"
          style={{ transition: 'r 0.2s ease-in-out' }}
        />
      </g>
    );
  };

  const renderCustomActiveDot = (props: any) => {
    const { cx, cy, stroke, payload, dataKey } = props;
    if (!payload) return null;

    const value = payload[dataKey];
    if (value === undefined || value <= 0) {
      return null;
    }

    const overlappingKeys = selectedDimensionIds.filter(id => payload[id.toString()] === value);
    let finalCx = cx;

    if (overlappingKeys.length > 1) {
      const sortedOverlappingIds = [...overlappingKeys].sort((a, b) => a - b);
      const myIndex = sortedOverlappingIds.indexOf(parseInt(dataKey, 10));
      
      const dotSpacing = 12; // pixels to separate dots
      const totalWidth = (sortedOverlappingIds.length - 1) * dotSpacing;
      const offset = myIndex * dotSpacing - totalWidth / 2;
      
      finalCx = cx + offset;
    }

    const isFocused = hoveredLineKey === dataKey;
    
    const handleClick = () => {
      onDataPointClick(parseInt(dataKey, 10), payload.year);
    };

    return (
      <g
        onClick={handleClick}
        onMouseEnter={() => setHoveredLineKey(dataKey)}
        onMouseLeave={() => setHoveredLineKey(null)}
        style={{ cursor: 'pointer' }}
      >
        <circle cx={finalCx} cy={cy} r="12" fill="transparent" />
        <circle
          cx={finalCx}
          cy={cy}
          r={isFocused ? 8 : 5}
          fill={stroke}
          stroke="white"
          strokeWidth="2"
          style={{ transition: 'r 0.2s ease-in-out, cx 0.2s ease-in-out' }}
        />
      </g>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h3 className="text-xl font-bold mb-4 text-white">Yearly Publication Trends</h3>
      {selectedDimensionIds.length === 0 && !showTotalPapers ? (
        <div className="flex items-center justify-center h-full text-gray-500">
            Select dimensions, or enable "Total Systems" in the sidebar.
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 50 }}>
            <defs>
              {showTotalPapers && (
                <linearGradient key="total-grad" id="color-total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TOTAL_COLOR} stopOpacity={0.7}/>
                  <stop offset="95%" stopColor={TOTAL_COLOR} stopOpacity={0}/>
                </linearGradient>
              )}
              {selectedDimensionIds.map((id) => {
                const originalIndex = selectedDimensionIds.indexOf(id);
                const color = COLORS[originalIndex % COLORS.length];
                return (
                  <linearGradient key={id} id={`color-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.7}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="yearLabel" 
              stroke="#9ca3af" 
              tick={{ fontSize: 12 }} 
              angle={-45} 
              textAnchor="end" 
              height={70} 
              interval="preserveStartEnd"
              label={{ value: `Year Bin (${binSize}-year)`, position: 'insideBottom', offset: -25, fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af" 
              tick={{ fontSize: 12 }} 
              allowDecimals={false}
              tickFormatter={formatYAxis}
              label={{ value: 'Number of Systems Coded', angle: -90, position: 'insideLeft', fill: '#9ca3af', dy: 70, dx: -10 }}
            />
            <Tooltip content={<CustomTooltip hoveredLineKey={hoveredLineKey} />} cursor={{ stroke: 'rgba(107, 114, 128, 0.5)', strokeWidth: 1 }}/>
            <Legend wrapperStyle={{fontSize: "12px", bottom: 0}}/>
            {showTotalPapers && (
              <Area 
                key="total"
                type="monotone"
                dataKey="total"
                name="Total Systems"
                stroke={TOTAL_COLOR}
                strokeWidth={hoveredLineKey === 'total' ? 3 : 2}
                fillOpacity={1} 
                fill="url(#color-total)"
                dot={false}
                activeDot={renderTotalPapersDot}
                onMouseEnter={() => setHoveredLineKey('total')}
                onMouseLeave={() => setHoveredLineKey(null)}
                style={{
                  transition: 'opacity 0.2s ease-in-out, stroke-width 0.2s ease-in-out',
                  opacity: (hoveredLineKey !== null && hoveredLineKey !== 'total') ? 0.2 : 1
                }}
              />
            )}
            {
              sortedDimensionIds.map((id) => {
                const originalIndex = selectedDimensionIds.indexOf(id);
                const color = COLORS[originalIndex % COLORS.length];
                const isHovered = hoveredLineKey === id.toString();
                return (
                  <Area 
                    key={id} 
                    type="monotone" 
                    dataKey={id.toString()} 
                    name={codeMap[id]?.code || `ID ${id}`} 
                    stroke={color} 
                    strokeWidth={isHovered ? 3 : 2}
                    fillOpacity={1} 
                    fill={`url(#color-${id})`} 
                    activeDot={renderCustomActiveDot}
                    onMouseEnter={() => setHoveredLineKey(id.toString())}
                    onMouseLeave={() => setHoveredLineKey(null)}
                    style={{
                      transition: 'opacity 0.2s ease-in-out, stroke-width 0.2s ease-in-out',
                      opacity: (hoveredLineKey !== null && !isHovered) ? 0.2 : 1
                    }}
                  />
                )
              })
            }
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
            No data available for the selected dimensions.
        </div>
      )}
    </div>
  );
};

export default YearlyTrendsChart;