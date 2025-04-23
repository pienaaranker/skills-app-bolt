export type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Skill = Database['public']['Tables']['skills']['Row'];
export type Curriculum = Database['public']['Tables']['curricula']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];

export interface Module {
  title: string;
  description: string;
  steps: Step[];
}

export interface Step {
  title: string;
  description: string;
  resources: Resource[];
  completed: boolean;
}

export interface Resource {
  title: string;
  url: string;
  type: 'article' | 'video' | 'tutorial' | 'documentation' | 'other';
}