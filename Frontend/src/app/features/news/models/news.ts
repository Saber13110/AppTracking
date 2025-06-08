export interface NewsArticle {
  id: number;
  title: string;
  content: string;
  image?: string;
  imageUrl?: string;
  date?: string | Date;
  category?: string;
  summary?: string;
  slug: string;
}
