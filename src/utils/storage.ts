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
      return JSON.parse(data);
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

export const exportTree = (data: FamilyTreeData) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  const exportFileDefaultName = 'family-tree.json';

  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const importTree = (): Promise<FamilyTreeData> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) {
        reject('No file selected');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.nodes && data.edges) {
            resolve(data);
          } else {
            reject('Invalid file format');
          }
        } catch (err) {
          reject('Failed to parse JSON');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
};
