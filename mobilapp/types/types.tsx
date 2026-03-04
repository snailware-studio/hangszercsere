export type ProfileData = {
  id: number;
  name: string;
  profile_url: string;
  bio: string | null;
  location: string;
  rating: number | null;
  join_date: string;
  status: "active" | string;
  total_listings: number;
  active_listings: number;
  total_sold: number;
  rating_count: number;
  total_reviews: number;
  last_login: string;
};