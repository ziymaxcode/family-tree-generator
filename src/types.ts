export type Gender = 'male' | 'female' | 'neutral';

export interface Person {
  id: string;
  name: string;
  birthYear: string;
  deathYear: string;
  photo: string | null;
  gender: Gender;
  notes: string;
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

export interface LayoutNode extends Person {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutFamily {
  id: string;
  x: number;
  y: number;
  spouses: string[];
  children: string[];
}

export interface LayoutData {
  nodes: LayoutNode[];
  families: LayoutFamily[];
}
