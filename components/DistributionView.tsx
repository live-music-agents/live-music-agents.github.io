
import React, { useMemo, useState } from 'react';
import type { Paper, CodeMap } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell } from 'recharts';

interface DistributionViewProps {
  papers: Paper[];
  allCodes: CodeMap[];
  codeMap: Record<number, CodeMap>;
  onCodeClick: (codeId: number) => void;
}

const DIMENSION_ORDER: Record<string, number> = {
    // Usage Context
    'Use Purpose': 1,
    'Target User': 2,
    'Musical Context': 3,
    'Value Emphasis': 4,
    'Outcome Emphasis': 5,
    'User Role': 6,
    'Agent Role': 7,
    'Participant Topology': 8,

    // Interaction
    'Input Modality': 9,
    'Output Modality': 10,
    'Input Musical Element': 11,
    'Output Musical Element': 12,
    'Musical Outcome': 13,
    'Planning': 14,
    'Temporal Structure': 15,
    'Data Alignment': 16,
    'Interface': 17,
    'Control Mode': 18,
    'Control Scope': 19,
    'System Initiative': 20,
    'Agency Framing': 21,

    // Technology
    'Model': 22,
    'Learning Algorithm': 23,
    'Inference Objective': 24,
    'Adaptation': 25,
    'Technical Emphasis': 26,
    'Infrastructure': 27,
    'Runtime Requirements': 28,
    'Integration': 29,

    // Ecosystem
    'Sociocultural Factors': 30,
    'Policy Considerations': 31,
    'Economic Consequences': 32,
    'Musical-Societal Consequences': 33,
};

const DistributionView: React.FC<DistributionViewProps> = ({ papers, allCodes, codeMap, onCodeClick }) => {
  const [selectedAspect, setSelectedAspect] = useState<string>('Usage Context');
  const [selectedDimension, setSelectedDimension] = useState<string | null>(null);
  
  const aspectNames = ['Usage Context', 'Interaction', 'Technology', 'Ecosystem'];
  const totalPapers = papers.length;

  const COLORS: Record<string, string> = {
    'Usage Context': '#8b5cf6', // violet-500
    'Interaction': '#ec4899',   // pink-500
    'Technology': '#3b82f6',    // blue-500
    'Ecosystem': '#22c55e',     // green-500
  };

  // Calculate Aspect Coverage stats for the menu
  const aspectStats = useMemo(() => {
      const stats: Record<string, number> = {};
      aspectNames.forEach(aspect => {
          const aspectCodeIds = new Set(allCodes.filter(c => c.aspect === aspect).map(c => c.id));
          const count = papers.filter(p => {
              for (const codeId of Array.from(p.codes)) {
                  if (aspectCodeIds.has(codeId)) return true;
              }
              return false;
          }).length;
          stats[aspect] = count;
      });
      return stats;
  }, [papers, allCodes]);

  const chartData = useMemo(() => {
      if (selectedDimension) {
          // CODE VIEW: Show codes for the selected dimension
          const codesInDim = allCodes.filter(c => c.dimension === selectedDimension);
          
          const data = codesInDim.map(code => {
              const count = papers.filter(p => p.codes.has(code.id)).length;
              return {
                  id: code.id,
                  name: code.code, 
                  count: count,
                  total: totalPapers,
                  percent: (count / totalPapers) * 100,
                  type: 'code'
              };
          });
          return data.sort((a, b) => b.count - a.count);
      } else {
          // DIMENSION VIEW: Show dimensions for the selected aspect
          const dimensionsInAspect = (Array.from(
              new Set(allCodes.filter(c => c.aspect === selectedAspect).map(c => c.dimension))
          ) as string[]).sort();
          
          const data: Array<{ name: string; count: number; total: number; percent: number; type: 'dimension' }> = dimensionsInAspect.map(dim => {
              const dimCodeIds = new Set(allCodes.filter(c => c.dimension === dim).map(c => c.id));
              // Count papers that have at least one code in this dimension
              const count = papers.filter(p => {
                  for (const codeId of Array.from(p.codes)) {
                      if (dimCodeIds.has(codeId)) return true;
                  }
                  return false;
              }).length;
              
              return {
                  name: dim, 
                  count: count,
                  total: totalPapers,
                  percent: (count / totalPapers) * 100,
                  type: 'dimension'
              };
          });
          
          return data.sort((a, b) => {
              const orderA = DIMENSION_ORDER[a.name] ?? 999;
              const orderB = DIMENSION_ORDER[b.name] ?? 999;
              return orderA - orderB;
          });
      }
  }, [papers, allCodes, selectedAspect, selectedDimension, totalPapers]);

  const handleBarClick = (data: any) => {
      if (data.type === 'dimension') {
          setSelectedDimension(data.name);
      } else if (data.type === 'code') {
          onCodeClick(data.id);
      }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-4 rounded-md border border-gray-600 shadow-lg text-base z-50">
          <p className="font-bold text-white mb-2 text-lg">{data.name}</p>
          <p className="text-gray-300">Count: <span className="text-white font-mono font-bold">{data.count}</span> / {totalPapers}</p>
          <p className="text-gray-300">Coverage: <span className="text-white font-mono font-bold">{data.percent.toFixed(1)}%</span></p>
          <p className="text-sm text-gray-500 mt-2 italic">
              {data.type === 'dimension' ? 'Click to see codes' : 'Click to see papers'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
      <div className="w-full h-full flex flex-col overflow-hidden">
          {/* Header & Aspect Menu */}
          <div className="flex flex-col space-y-4 p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-lg">
              <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-white">Frequency Analysis</h3>
              </div>
              
              <div className="flex bg-gray-700 rounded-lg p-1 overflow-x-auto no-scrollbar">
                  {aspectNames.map(name => {
                      const isActive = selectedAspect === name;
                      const coverage = ((aspectStats[name] / totalPapers) * 100).toFixed(0);
                      const activeClass = isActive ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-600/50';
                      
                      return (
                          <button
                              key={name}
                              onClick={() => {
                                  setSelectedAspect(name);
                                  setSelectedDimension(null);
                              }}
                              className={`flex-1 flex flex-col items-center justify-center py-3 px-6 rounded-md transition-all duration-200 min-w-[140px] ${activeClass}`}
                          >
                              <span className="font-bold text-base whitespace-nowrap">{name}</span>
                              <span className="text-sm opacity-70">{coverage}% Coverage</span>
                          </button>
                      );
                  })}
              </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex items-center px-4 py-3 bg-gray-900/30 border-b border-gray-700 min-h-[50px]">
              {selectedDimension ? (
                  <div className="flex items-center gap-2 text-lg">
                      <button 
                          onClick={() => setSelectedDimension(null)}
                          className="text-blue-400 hover:text-blue-300 hover:underline flex items-center transition-colors font-medium"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                          </svg>
                          All {selectedAspect} Dimensions
                      </button>
                      <span className="text-gray-500 text-xl">/</span>
                      <span className="text-white font-bold">{selectedDimension}</span>
                  </div>
              ) : (
                  <div className="text-lg text-gray-400">
                      Showing dimensions for <span className="text-white font-bold">{selectedAspect}</span>. Click a bar to drill down.
                  </div>
              )}
          </div>

          {/* Chart Area */}
          <div className="flex-grow w-full min-h-0 bg-gray-900/50 p-4 rounded-b-lg border-t-0">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 160 }}
                  >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                      <XAxis 
                          dataKey="name" 
                          interval={0} 
                          angle={-35} 
                          textAnchor="end" 
                          stroke="#9ca3af" 
                          fontSize={16}
                          fontWeight={500}
                          height={180}
                          tickMargin={48}
                          dy={10}
                          tickFormatter={(value) => value.length > 25 ? value.substring(0, 25) + '...' : value}
                      />
                      <YAxis 
                          stroke="#9ca3af" 
                          fontSize={14} 
                          label={{ value: 'Number of Systems', angle: -90, position: 'insideLeft', fill: '#9ca3af', dy: 60, fontSize: 16 }} 
                          domain={[0, totalPapers]}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      
                      <Bar 
                          dataKey="count" 
                          barSize={45}
                          radius={[4, 4, 0, 0]}
                          background={{ fill: '#2d3748', radius: [4, 4, 0, 0] }}
                          onClick={handleBarClick}
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                          {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[selectedAspect] || '#8884d8'} />
                          ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>
  );
};

export default DistributionView;
