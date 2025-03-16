
export interface RecentPokemonRelease {
  id: string;
  name: string;
  release_date: string;
  image_url?: string;
  logo_url?: string;
  popularity: number;
  created_at: string;
  updated_at: string;
}

export interface UpcomingPokemonRelease {
  id: string;
  name: string;
  release_date: string;
  image_url?: string;
  type: string;
  created_at: string;
  updated_at: string;
}

export type RecentReleaseFormData = Omit<RecentPokemonRelease, 'id' | 'created_at' | 'updated_at'>;
export type UpcomingReleaseFormData = Omit<UpcomingPokemonRelease, 'id' | 'created_at' | 'updated_at'>;
