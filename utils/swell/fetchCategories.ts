// /utils/swell/fetchCategories.ts
// Extracted from /pages/api/getCategories.ts
// Used by both the API route and getServerSideProps in catalogue.tsx
// DO NOT modify getCategories.ts — it remains intact and still calls this logic internally

import swell from "utils/swell/swellinit";

const transformTitle = (fullTitle: string) => {
  // Hose categories
  if (fullTitle.includes('4-Wire Braided Hose') && fullTitle.includes('EN 857 R4')) {
    return { shortTitle: '4-Wire Braided Hose', subtitle: 'EN 857 R4' };
  }
  if (fullTitle.includes('1-Wire Braided Hose') && fullTitle.includes('1SC EN 857')) {
    return { shortTitle: '1-Wire Braided Hose', subtitle: '1SC EN 857' };
  }
  if (fullTitle.includes('2-Wire Braided Hose') && (fullTitle.includes('2SC EN 857') || fullTitle.includes('EN 857'))) {
    return { shortTitle: '2-Wire Braided Hose', subtitle: '2SC EN 857' };
  }
  if (fullTitle.includes('Suction Hose') && !fullTitle.includes('(')) {
    return { shortTitle: 'Suction Hose', subtitle: '' };
  }

  // Valve categories
  if (fullTitle.includes('Balancing Valves')) {
    return { shortTitle: 'Balancing Valves', subtitle: '' };
  }
  if (fullTitle.includes('Flow Control Valves')) {
    return { shortTitle: 'Flow Control Valves', subtitle: '' };
  }
  if (fullTitle.includes('In-Line Valves')) {
    return { shortTitle: 'In-Line Valves', subtitle: '' };
  }
  if (fullTitle.includes('Solenoid Diverter Valves')) {
    return { shortTitle: 'Solenoid Diverter Valves', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic Accumulators')) {
    return { shortTitle: 'Hydraulic Accumulators', subtitle: '' };
  }
  if (fullTitle.includes('Directional Control Valves')) {
    return { shortTitle: 'Directional Control Valves', subtitle: '' };
  }
  if (fullTitle.includes('Ball Valves')) {
    return { shortTitle: 'Ball Valves', subtitle: '' };
  }

  // Function categories
  if (fullTitle.includes('Live Third Function')) {
    return { shortTitle: 'Live Third Function', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic Soft Ride Functions')) {
    return { shortTitle: 'Hydraulic Soft Ride Functions', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic 3rd & 4th Functions')) {
    return { shortTitle: 'Hydraulic 3rd & 4th Functions', subtitle: '' };
  }
  if (fullTitle.includes('Hydraulic 3rd Functions')) {
    return { shortTitle: 'Hydraulic 3rd Functions', subtitle: '' };
  }

  // Fitting categories
  if (fullTitle.includes('JIC') && fullTitle.includes('Joint Industrial Council')) {
    return { shortTitle: 'JIC', subtitle: '(Joint Industrial Council)' };
  }
  if (fullTitle.includes('BSP') && fullTitle.includes('British Standard Pipe')) {
    return { shortTitle: 'BSP', subtitle: '(British Standard Pipe)' };
  }
  if (fullTitle.includes('ORFS') && (fullTitle.includes('ORing Flat Seal') || fullTitle.includes('O-Ring Flat Seal'))) {
    return { shortTitle: 'ORFS', subtitle: '(O-Ring Flat Seal)' };
  }
  if (fullTitle.includes('Metric Light')) {
    return { shortTitle: 'Metric Light', subtitle: '' };
  }
  if (fullTitle.includes('Ferrules')) {
    return { shortTitle: 'Ferrules', subtitle: '' };
  }

  // Generic pattern matching for parentheses
  const parenthesesMatch = fullTitle.match(/^([^(]+)\s*\((.+)\)$/);
  if (parenthesesMatch) {
    const beforeParens = parenthesesMatch[1].trim();
    const insideParens = parenthesesMatch[2].trim();
    if (beforeParens.length <= 10 && beforeParens.match(/^[A-Z0-9\s-&]+$/)) {
      return { shortTitle: beforeParens, subtitle: `(${insideParens})` };
    }
  }

  return { shortTitle: fullTitle, subtitle: '' };
};

export const fetchCategories = async (): Promise<any[]> => {
  const allCategoriesResponse = await swell.get('/categories', {
    limit: 1000
  });

  const allCategories = allCategoriesResponse.results;

  // Build hierarchy in memory
  const categoryMap = new Map();
  const rootCategories: any[] = [];

  allCategories.forEach((cat: any) => {
    const { shortTitle, subtitle } = transformTitle(cat.name);

    const categoryObj = {
      title: cat.name,
      shortTitle,
      subtitle,
      id: cat.id,
      slug: cat.slug,
      description: cat.description,
      parent_id: cat.parent_id,
      date_created: cat.date_created,
      image: cat.images && cat.images[0] ? cat.images[0].file.url : null,
      subCategories: []
    };

    categoryMap.set(cat.id, categoryObj);

    if (!cat.parent_id) {
      rootCategories.push(categoryObj);
    }
  });

  // Build the hierarchy
  allCategories.forEach((cat: any) => {
    if (cat.parent_id && categoryMap.has(cat.parent_id)) {
      const parent = categoryMap.get(cat.parent_id);
      const child = categoryMap.get(cat.id);
      if (parent && child) {
        parent.subCategories.push(child);
      }
    }
  });

  // Sort by creation date
  rootCategories.sort((a, b) =>
    new Date(a.date_created).getTime() - new Date(b.date_created).getTime()
  );

  // Clean up response (remove internal fields)
  const cleanCategories = rootCategories.map(category => {
    const clean = (cat: any): any => {
      const { parent_id, date_created, ...cleanCat } = cat;
      if (cleanCat.subCategories && cleanCat.subCategories.length > 0) {
        cleanCat.subCategories = cleanCat.subCategories.map(clean);
      }
      return cleanCat;
    };
    return clean(category);
  });

  return cleanCategories;
};