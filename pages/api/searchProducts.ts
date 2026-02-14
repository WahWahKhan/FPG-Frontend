import { NextApiRequest, NextApiResponse } from "next";
import swell from "utils/swell/swellinit";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images?: Array<{
    file: {
      url: string;
    };
  }>;
}

interface TransformedProduct {
  id: string;
  name: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  slug: string;
  description?: string;
  image: string;
}

interface ProductResponse {
  products: TransformedProduct[];
  total?: number;
  message: string;
}

interface SearchRequestBody {
  query: string;
  searchType?: 'partNumber' | 'general';
}

const transformTitle = (fullTitle: string): { shortTitle: string; subtitle: string } => {
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

// NEW: Enhanced search logic to handle product variants
const createSearchVariants = (query: string): string[] => {
  const variants: string[] = [];
  const cleanQuery = query.toLowerCase().replace(/^fpg-?/i, '');
  
  // Add the original query
  variants.push(cleanQuery);
  
  // Handle variant patterns like "2j9-08" -> "2j9"
  // Remove common variant suffixes (anything after a dash that looks like a size/variant)
  const dashMatch = cleanQuery.match(/^([a-z0-9]+)-([0-9]{1,3}[a-z]?|[a-z]{1,2})$/i);
  if (dashMatch) {
    const basePartNumber = dashMatch[1];
    variants.push(basePartNumber);
    console.log(`Generated base part number variant: ${basePartNumber} from ${cleanQuery}`);
  }
  
  // Handle underscore variants like "2j9_08" -> "2j9"
  const underscoreMatch = cleanQuery.match(/^([a-z0-9]+)_([0-9]{1,3}[a-z]?|[a-z]{1,2})$/i);
  if (underscoreMatch) {
    const basePartNumber = underscoreMatch[1];
    variants.push(basePartNumber);
    console.log(`Generated underscore variant: ${basePartNumber} from ${cleanQuery}`);
  }
  
  // Handle dot variants like "2j9.08" -> "2j9"
  const dotMatch = cleanQuery.match(/^([a-z0-9]+)\.([0-9]{1,3}[a-z]?|[a-z]{1,2})$/i);
  if (dotMatch) {
    const basePartNumber = dotMatch[1];
    variants.push(basePartNumber);
    console.log(`Generated dot variant: ${basePartNumber} from ${cleanQuery}`);
  }
  
  // Handle space variants like "2j9 08" -> "2j9"
  const spaceMatch = cleanQuery.match(/^([a-z0-9]+)\s+([0-9]{1,3}[a-z]?|[a-z]{1,2})$/i);
  if (spaceMatch) {
    const basePartNumber = spaceMatch[1];
    variants.push(basePartNumber);
    console.log(`Generated space variant: ${basePartNumber} from ${cleanQuery}`);
  }
  
  // Remove duplicates and return
  const uniqueVariants = [...new Set(variants)];
  return uniqueVariants;
};

const handler = async (req: NextApiRequest, res: NextApiResponse<ProductResponse>) => {
  try {
    
    const { query, searchType }: SearchRequestBody = req.body;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ 
        message: "Search query must be at least 2 characters long",
        products: []
      });
    }
    
    // Generate search variants to handle product variations
    const searchVariants = createSearchVariants(query);
    
    // Search categories instead of individual products
    const categoriesResponse = await swell.get('/categories', { 
      limit: 1000,
      expand: ['images']
    });

    if (!categoriesResponse.results || categoriesResponse.results.length === 0) {
      return res.status(200).json({
        products: [],
        message: `No categories found`
      });
    }

    // Filter categories that match any of the search variants
    const matchingCategories = categoriesResponse.results
      .filter((category: Category) => {
        const categoryName = category.name.toLowerCase();
        
        // Check if any search variant matches the category
        return searchVariants.some(variant => {
          if (searchType === 'partNumber') {
            // For part number searches, look for FPG- prefix matches or direct matches
            return categoryName.includes(`fpg-${variant}`) || 
                   categoryName.includes(variant) ||
                   categoryName.startsWith(`fpg-${variant}`) ||
                   categoryName.startsWith(variant);
          }
          
          return categoryName.includes(variant);
        });
      })
      .filter((category: Category) => {
        const hiddenPrefixes = [
          'build-my-hose',
          'hydraulic-hoses-custom-hose-assembly',
          'burder-tubes'  // ADD THIS - catches Forklift Tubes, Loader Tubes, etc.
        ];
        const categorySlug = category.slug?.toLowerCase() || '';
        
        const isHidden = hiddenPrefixes.some(prefix => categorySlug.startsWith(prefix));
        
        if (isHidden) {
        }
        
        return !isHidden;
      })

      .map((category: Category): TransformedProduct => {
        const { shortTitle, subtitle } = transformTitle(category.name);
        
        return {
          id: category.id,
          name: category.name,
          title: category.name,
          shortTitle,
          subtitle,
          slug: category.slug,
          description: category.description,
          image: category.images && category.images[0] ? 
            category.images[0].file.url : 
            "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
        };
      })
      .sort((a: TransformedProduct, b: TransformedProduct) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Prioritize matches with any of our search variants
        const aMatchScore = searchVariants.reduce((score, variant) => {
          if (aName.includes(`fpg-${variant}`)) return score + 3;
          if (aName.startsWith(`fpg-${variant}`)) return score + 2;
          if (aName.includes(variant)) return score + 1;
          return score;
        }, 0);
        
        const bMatchScore = searchVariants.reduce((score, variant) => {
          if (bName.includes(`fpg-${variant}`)) return score + 3;
          if (bName.startsWith(`fpg-${variant}`)) return score + 2;
          if (bName.includes(variant)) return score + 1;
          return score;
        }, 0);
        
        if (aMatchScore !== bMatchScore) {
          return bMatchScore - aMatchScore; // Higher score first
        }
        
        return aName.localeCompare(bName);
      });

    res.status(200).json({
      products: matchingCategories,
      total: matchingCategories.length,
      message: matchingCategories.length > 0 ? 
        `Found ${matchingCategories.length} products matching "${query}"` : 
        `No products found matching "${query}"`
    });

  } catch (err: unknown) {
    console.error('Error in searchProducts:', err);
    
    const errorMessage = err instanceof Error ? err.message : 'Failed to search products';
    
    res.status(500).json({
      message: errorMessage,
      products: []
    });
  }
};

export default handler;