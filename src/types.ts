export type Gender = 'male' | 'female' | 'neutral';

export interface Person {
  id: string;
  name: string;
  birthYear: string;
  deathYear: string;
  photo: string | null;
  gender: Gender;
  notes: string;
  x: number;
  y: number;
}

export type RelationshipType = 'parent-child' | 'spouse';

export interface Relationship {
  id: string;
  type: RelationshipType;
  from: string; // parent or spouse1
  to: string;   // child or spouse2
}

export interface FamilyTreeData {
  nodes: Person[];
  edges: Relationship[];
}
