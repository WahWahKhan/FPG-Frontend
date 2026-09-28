import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

const transformTitle = (fullTitle: string) => {
  // Handle specific cases from your product catalog
  
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

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    console.log('Starting optimized getCategories...');
    const startTime = Date.now();

    // Single API call to get ALL categories (this is what worked in diagnostics!)
    const allCategoriesResponse = await swell.get('/categories', { 
      limit: 1000
    });

    console.log(`Fetched ${allCategoriesResponse.results.length} categories in ${Date.now() - startTime}ms`);

    const allCategories = allCategoriesResponse.results;
    
    // Build hierarchy in memory (super fast)
    const categoryMap = new Map();
    const rootCategories: any[] = [];
    
    // Create all category objects
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

    console.log(`Total processing time: ${Date.now() - startTime}ms`);
    // _app.tsx fetches this on every page load for the nav menu. Let Vercel's
    // CDN hold it for 5 min and serve a stale copy while refreshing, so
    // visitors don't wait on a cold function + Swell (measured 2.6s uncached).
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.status(200).json({ categories: cleanCategories });
    
  } catch (err: any) {
    console.error('Error in getCategories:', err);
    res.status(500).json({ 
      message: err.message || 'Failed to fetch categories',
      error: 'API_ERROR'
    });
  }
};

export default handler;