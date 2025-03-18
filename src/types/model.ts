
export type ModelCategory = 'display' | 'holder' | 'marker' | 'promotional' | 'other';

export interface ThreeDModel {
  id: string;
  name: string;
  description: string | null;
  category: ModelCategory;
  stl_file_path: string;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
  customizable: boolean;
  default_options: Record<string, any>;
}

export interface UserCustomization {
  id: string;
  user_id: string;
  model_id: string;
  customization_options: Record<string, any>;
  created_at: string;
  updated_at: string;
}
