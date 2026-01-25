
import React from 'react';
import type { Paper, CodeMap, PaperFilter } from '../types';
import { ASPECT_COLORS, DEFAULT_COLORS } from '../constants';

interface PaperDetailPageProps {
  paper: Paper;
  onBack: () => void;
  codeMap: Record<number, CodeMap>;
  onCodeTagClick: (codeId: number) => void;
  sourceFilter: PaperFilter | null;
}

const getYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};


const PaperDetailPage: React.FC<PaperDetailPageProps> = ({ paper, onBack, codeMap, onCodeTagClick, sourceFilter }) => {
    
    const codesByDimension = React.useMemo(() => {
        const grouped: Record<string, CodeMap[]> = {};
        paper.codes.forEach(codeId => {
            const code = codeMap[codeId];
            if (code) {
                if (!grouped[code.dimension]) {
                    grouped[code.dimension] = [];
                }
                grouped[code.dimension].push(code);
            }
        });
        return grouped;
    }, [paper.codes, codeMap]);

    const dimensionsByAspect = React.useMemo(() => {
        const aspectOrder = ['Usage Context', 'Interaction', 'Technology', 'Ecosystem'];
        const grouped: Record<string, string[]> = {};
        
        Object.keys(codesByDimension).forEach(dimension => {
            const codesInDim = codesByDimension[dimension];
            if (codesInDim.length > 0) {
                const aspect = codesInDim[0].aspect;
                if (!grouped[aspect]) {
                    grouped[aspect] = [];
                }
                grouped[aspect].push(dimension);
            }
        });
        
        // Sort dimensions within each aspect
        for (const aspect in grouped) {
            grouped[aspect].sort();
        }

        // Return aspects in a predefined order
        const orderedGrouped: Record<string, string[]> = {};
        aspectOrder.forEach(aspect => {
            if (grouped[aspect]) {
                orderedGrouped[aspect] = grouped[aspect];
            }
        });

        // Add any aspects that weren't in the predefined order
        Object.keys(grouped).forEach(aspect => {
          if (!orderedGrouped[aspect]) {
            orderedGrouped[aspect] = grouped[aspect];
          }
        });

        return orderedGrouped;
    }, [codesByDimension]);

    const backButtonText = sourceFilter ? 'Back to List' : 'Back to Explorer';
    
    let youtubeId: string | null = null;
    let embeddedUrl: string | null = null;
    if (paper.sourceType === 'video') {
        const allUrls = [paper.url, ...paper.additionalResources].filter(Boolean);
        for (const url of allUrls) {
            const id = getYouTubeId(url);
            if (id) {
                youtubeId = id;
                embeddedUrl = url;
                break;
            }
        }
    }

    const filteredAdditionalResources = paper.additionalResources.filter(link => link && link !== embeddedUrl);

    return (
      <div className="w-full h-full flex flex-col text-gray-200">
        <div className="flex-shrink-0 mb-4">
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

        <div className="flex-grow overflow-y-auto pr-4 -mr-2 space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-white mb-2">{paper.title}</h2>
                 {paper.authors && (
                    <p className="text-gray-400 text-lg mb-2">By {paper.authors}</p>
                )}
                <div className="flex items-center text-gray-400 text-lg space-x-4 mb-4 flex-wrap">
                    <span>{paper.venue || 'N/A'}</span>
                    <span>&bull;</span>
                    <span>{paper.year || 'N/A'}</span>
                    {paper.url && paper.sourceType === 'paper' && (
                        <>
                            <span>&bull;</span>
                            <a href={paper.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-300 hover:underline">
                                View Paper
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                </svg>
                            </a>
                        </>
                    )}
                </div>
            </div>

            {paper.sourceType === 'video' && youtubeId && (
                <div className="border-t border-gray-700 pt-8">
                    <div className="bg-black rounded-lg overflow-hidden shadow-lg" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>
            )}

            {paper.sourceType === 'paper' && (
              <div className="border-t border-gray-700 pt-8">
                  <h3 className="text-xl font-semibold text-gray-300 mb-3">Abstract</h3>
                  {paper.abstract ? (
                      <p className="text-lg text-gray-300 whitespace-pre-wrap leading-relaxed">{paper.abstract}</p>
                  ) : (
                      <p className="text-gray-500 italic">No abstract available for this paper.</p>
                  )}
              </div>
            )}

            <div className="border-t border-gray-700 pt-8">
                <h3 className="text-xl font-semibold text-gray-300 mb-4">Coded Tags</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {Object.entries(dimensionsByAspect).map(([aspect, dimensions]) => {
                        const colors = ASPECT_COLORS[aspect] || DEFAULT_COLORS;
                        return (
                            <div key={aspect} className={`p-4 rounded-lg border ${colors.container}`}>
                                <h4 className={`text-lg font-semibold mb-3 ${colors.title}`}>{aspect}</h4>
                                <div className="space-y-3">
                                    {(dimensions as string[]).map(dimension => (
                                        <div key={dimension} className="flex flex-row items-start gap-x-3">
                                            <p className="text-lg font-medium text-gray-400 shrink-0 whitespace-nowrap pt-0.5">{dimension}</p>
                                            <span className="text-gray-500 shrink-0 pt-0.5">-</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {codesByDimension[dimension].map(code => (
                                                    <button
                                                        key={code.id}
                                                        onClick={() => onCodeTagClick(code.id)}
                                                        className={`px-2.5 py-1 text-lg font-medium rounded-full ${colors.tag} transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                                                    >
                                                        <span className="opacity-60 mr-0.5">#</span>{code.code}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {filteredAdditionalResources.length > 0 && (
              <div className="border-t border-gray-700 pt-8">
                  <h3 className="text-xl font-semibold text-gray-300 mb-3">Additional Resources</h3>
                   <ul className="list-disc list-inside space-y-2 text-lg">
                      {filteredAdditionalResources.map((link, index) => (
                          <li key={index}>
                              <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 hover:underline break-all">
                                  Resource {index + 1}
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 inline-block" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                  </svg>
                              </a>
                          </li>
                      ))}
                  </ul>
              </div>
            )}
        </div>
      </div>
    );
};
export default PaperDetailPage;
