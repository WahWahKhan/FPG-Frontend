// /utils/swell/fetchSeriesDetails.ts
// Extracted from /pages/api/getSeriesDetails.ts
// Used by both the API route and getServerSideProps in [id].tsx
// DO NOT modify getSeriesDetails.ts — it remains intact and still handles API requests

import swell from "utils/swell/swellinit";

export type ISeries = {
  name: string;
  description: string;
  images: string[];
};

export const fetchSeriesDetails = async (id: string): Promise<ISeries | null> => {
  try {
    const series = await swell.get('/categories/{id}', { id });

    if (series !== null) {
      return {
        name: series.name,
        description: series.description ?? "",
        images: Array.isArray(series.images) && series.images.length > 0
          ? series.images.map((image: any) => image.file.url)
          : ["https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"]
      };
    }

    return null;
  } catch (err: any) {
    console.error('fetchSeriesDetails error:', err.message);
    return null;
  }
};