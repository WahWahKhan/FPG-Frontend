export interface Category {
  title: string;
  id: string;
  slug: string;
  image?: string;
  subCategories: SubCategory[];
  description : string
}

export interface SubCategory {
  title: string;
  id: string;
  image?: string;
  slug: string;
  category: string;
  description: string;
  // Tiny base64 preview (utils/swell/blurPlaceholders.ts) shown blurred while the image loads
  blurDataURL?: string;
}

export interface Product extends SubCategory {
  price: number;
}
