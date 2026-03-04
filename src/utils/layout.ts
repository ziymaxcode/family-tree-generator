import dagre from 'dagre';
import { Person, Relationship, LayoutData, LayoutNode, LayoutFamily } from '../types';

export const NODE_WIDTH = 280;
export const NODE_HEIGHT = 120;
export const DUMMY_SIZE = 1;

export function getLayout(nodes: Person[], edges: Relationship[]): LayoutData {
  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: 'TB',
    nodesep: 80,
    ranksep: 100,
    edgesep: 40,
    marginx: 100,
    marginy: 100,
  });
  g.setDefaultEdgeLabel(() => ({}));

  // Add all person nodes
  nodes.forEach((n) => {
    g.setNode(n.id, { width: NODE_WIDTH, height: NODE_HEIGHT, type: 'person', data: n });
  });

  const familiesMap = new Map<string, { spouses: Set<string>; children: Set<string> }>();
  let familyCounter = 0;

  // Group by spouse relationships
  edges
    .filter((e) => e.type === 'spouse')
    .forEach((e) => {
      // Find if either spouse is already in a family
      let foundFamId: string | null = null;
      for (const [famId, fam] of familiesMap.entries()) {
        if (fam.spouses.has(e.from) || fam.spouses.has(e.to)) {
          foundFamId = famId;
          break;
        }
      }

      if (foundFamId) {
        const fam = familiesMap.get(foundFamId)!;
        fam.spouses.add(e.from);
        fam.spouses.add(e.to);
      } else {
        const famId = `fam_${familyCounter++}`;
        familiesMap.set(famId, { spouses: new Set([e.from, e.to]), children: new Set() });
      }
    });

  // Find children for families
  edges
    .filter((e) => e.type === 'parent-child')
    .forEach((e) => {
      const parentId = e.from;
      const childId = e.to;
      let foundFam = false;
      for (const fam of familiesMap.values()) {
        if (fam.spouses.has(parentId)) {
          fam.children.add(childId);
          foundFam = true;
          break;
        }
      }
      if (!foundFam) {
        // Parent is single, create a single-parent family
        const famId = `fam_${familyCounter++}`;
        familiesMap.set(famId, { spouses: new Set([parentId]), children: new Set([childId]) });
      }
    });

  // Add dummy nodes and edges for families
  familiesMap.forEach((fam, famId) => {
    g.setNode(famId, { width: DUMMY_SIZE, height: DUMMY_SIZE, type: 'family' });
    fam.spouses.forEach((s) => {
      g.setEdge(s, famId, { weight: 10, minlen: 1 });
    });
    fam.children.forEach((c) => {
      g.setEdge(famId, c, { weight: 1, minlen: 1 });
    });
  });

  dagre.layout(g);

  const layoutNodes: LayoutNode[] = [];
  const layoutFamilies: LayoutFamily[] = [];

  g.nodes().forEach((v) => {
    const node = g.node(v) as any;
    if (node.type === 'person') {
      layoutNodes.push({
        ...(node.data as Person),
        x: node.x - NODE_WIDTH / 2,
        y: node.y - NODE_HEIGHT / 2,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
      });
    } else if (node.type === 'family') {
      const famData = familiesMap.get(v)!;
      layoutFamilies.push({
        id: v,
        x: node.x,
        y: node.y,
        spouses: Array.from(famData.spouses),
        children: Array.from(famData.children),
      });
    }
  });

  return { nodes: layoutNodes, families: layoutFamilies };
}
