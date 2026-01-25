import type { CodeMap, AspectData } from '../types';

// A more robust CSV parser that handles quoted fields with commas and escaped quotes.
const parseCsvLine = (line: string): string[] => {
    const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
    const result: string[] = [];
    let match;
    // This regex will find all fields, and we extract the first capturing group
    while (match = regex.exec(line)) {
        let value = match[1];
        // If the field is quoted, remove the surrounding quotes and un-escape double quotes
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
        }
        result.push(value);
    }
    // If the line ends with a comma, the regex might miss the last empty field
    if (line.endsWith(',')) {
        result.push('');
    }
    return result;
};


export interface PaperMetadata {
  id: number;
  title: string;
  url: string;
  venue: string;
  year: number | null;
  abstract: string | null;
  authors: string | null;
  additionalResources: string[];
  sourceType: 'paper' | 'video';
}

export const parsePaperCodesCsv = (csvString: string): Map<number, Set<number>> => {
    const paperCodes = new Map<number, Set<number>>();
    const lines = csvString.trim().split(/\r?\n/);
    const header = parseCsvLine(lines[0]).map(s => s.trim());
    const codeIds = header.slice(1).map(Number);

    lines.slice(1).forEach(line => {
        if (!line.trim()) return;
        const values = parseCsvLine(line);
        if (values.length < 2) return;
        const paperId = parseInt(values[0].trim(), 10);
        if (isNaN(paperId)) return;

        const codes = new Set<number>();
        values.slice(1).forEach((val, index) => {
            if (val.trim() === '1' && codeIds[index]) {
                codes.add(codeIds[index]);
            }
        });
        paperCodes.set(paperId, codes);
    });
    return paperCodes;
};

export const parseMetadataCsv = (csvString: string): Map<number, PaperMetadata> => {
    const metadataMap = new Map<number, PaperMetadata>();
    const lines = csvString.trim().split(/\r?\n/);
    
    // Title,Link,Additional Resource 1,Additional Resource 2,Additional Resource 3,Venue,Year,Abstract,Authors
    lines.slice(1).forEach((line, index) => {
        if (!line.trim()) return;
        const values = parseCsvLine(line).map(s => s.trim());
        if (values.length < 1) return;
        const [title, link, res1, res2, res3, venue, yearStr, abstract, authors] = values;
        
        const id = index + 1; // Assuming row order corresponds to paper ID
        
        const year = yearStr && yearStr.trim() && !isNaN(parseInt(yearStr, 10)) ? parseInt(yearStr, 10) : null;

        const additionalResources = [res1, res2, res3].filter(res => res && res.length > 0);
        
        const isVideoVenue = venue.toLowerCase() === 'video';
        const hasNoVenue = !venue.trim();
        const hasVideoLink = [link, ...additionalResources].some(l => l.includes('youtube.com') || l.includes('youtu.be'));

        const sourceType = (isVideoVenue || (hasNoVenue && hasVideoLink)) ? 'video' : 'paper';

        metadataMap.set(id, {
            id,
            title,
            url: link,
            venue,
            year,
            abstract: abstract || null,
            authors: authors || null,
            additionalResources,
            sourceType,
        });
    });
    return metadataMap;
};

export const parseMappingCsv = (csvString: string): CodeMap[] => {
  const lines = csvString.trim().split(/\r?\n/);
  // Header: ID,Aspect,New Aspect,Dimension,New Dimension,Code,New Code
  const mapping = lines.slice(1).map(line => {
    if (!line.trim()) return null;
    const [id, _aspect, newAspect, _dimension, newDimension, _code, newCode] = parseCsvLine(line).map(s => s.trim());
    return {
      id: parseInt(id, 10),
      aspect: newAspect,
      dimension: newDimension,
      code: newCode,
    };
  }).filter((item): item is CodeMap => item !== null && !isNaN(item.id));

  return mapping;
};

export const groupCodesByAspect = (codes: CodeMap[]): AspectData => {
  return codes.reduce((acc, code) => {
    if (!acc[code.aspect]) {
      acc[code.aspect] = [];
    }
    acc[code.aspect].push(code);
    return acc;
  }, {} as AspectData);
};

export const groupDimensionsByAspect = (codes: CodeMap[]): { [aspect: string]: string[] } => {
  const aspectDimensions: { [aspect: string]: Set<string> } = codes.reduce((acc, code) => {
    if (!acc[code.aspect]) {
      acc[code.aspect] = new Set();
    }
    acc[code.aspect].add(code.dimension);
    return acc;
  }, {} as { [aspect: string]: Set<string> });

  const result: { [aspect: string]: string[] } = {};
  for (const aspect in aspectDimensions) {
    result[aspect] = Array.from(aspectDimensions[aspect]).sort();
  }
  return result;
};