import { FamilyTreeData, Person } from '../types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'family_tree_data';

export const createDefaultTree = (): FamilyTreeData => {
  const youId = uuidv4();
  const you: Person = {
    id: youId,
    name: 'You',
    birthYear: '1990',
    deathYear: 'Present',
    photo: null,
    gender: 'neutral',
    notes: 'Start building your family tree from here.',
    x: 0,
    y: 0,
  };
  return {
    nodes: [you],
    edges: [],
  };
};

export const loadTree = (): FamilyTreeData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      // Ensure existing nodes have x and y
      const parsed = JSON.parse(data) as FamilyTreeData;
      parsed.nodes = parsed.nodes.map(n => ({
        ...n,
        x: n.x ?? 0,
        y: n.y ?? 0,
      }));
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load tree from local storage', e);
  }
  return createDefaultTree();
};

export const saveTree = (data: FamilyTreeData) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save tree to local storage', e);
  }
};
