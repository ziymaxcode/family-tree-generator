import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Person, Relationship, FamilyTreeData, LayoutData } from './types';
import { loadTree, saveTree, exportTree, importTree } from './utils/storage';
import { getLayout } from './utils/layout';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { EditPanel } from './components/EditPanel';

export default function App() {
  const [data, setData] = useState<FamilyTreeData>({ nodes: [], edges: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitScreenTrigger, setFitScreenTrigger] = useState(0);

  // Load data on mount
  useEffect(() => {
    setData(loadTree());
  }, []);

  // Save data on change
  useEffect(() => {
    if (data.nodes.length > 0) {
      saveTree(data);
    }
  }, [data]);

  const layout: LayoutData = useMemo(() => {
    if (data.nodes.length === 0) return { nodes: [], families: [] };
    return getLayout(data.nodes, data.edges);
  }, [data]);

  const handleAddPerson = () => {
    const newPerson: Person = {
      id: uuidv4(),
      name: 'New Person',
      birthYear: '',
      deathYear: '',
      photo: null,
      gender: 'neutral',
      notes: '',
    };
    setData((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newPerson],
    }));
    setSelectedId(newPerson.id);
  };

  const handleAddRelation = (sourceId: string, type: string) => {
    const newPerson: Person = {
      id: uuidv4(),
      name: 'New Person',
      birthYear: '',
      deathYear: '',
      photo: null,
      gender: type.includes('father') || type.includes('son') ? 'male' : type.includes('mother') || type.includes('daughter') ? 'female' : 'neutral',
      notes: '',
    };

    const newEdges = [...data.edges];

    if (type === 'add-father' || type === 'add-mother') {
      newEdges.push({ id: uuidv4(), type: 'parent-child', from: newPerson.id, to: sourceId });
    } else if (type === 'add-son' || type === 'add-daughter') {
      newEdges.push({ id: uuidv4(), type: 'parent-child', from: sourceId, to: newPerson.id });
    } else if (type === 'add-spouse') {
      newEdges.push({ id: uuidv4(), type: 'spouse', from: sourceId, to: newPerson.id });
    } else if (type === 'add-sibling') {
      // Find parents of sourceId
      const parents = data.edges.filter((e) => e.type === 'parent-child' && e.to === sourceId).map((e) => e.from);
      if (parents.length > 0) {
        parents.forEach((p) => {
          newEdges.push({ id: uuidv4(), type: 'parent-child', from: p, to: newPerson.id });
        });
      } else {
        // If no parents, maybe just add a dummy parent or just add the person.
        // For simplicity, we just add the person without edges if no parents exist.
        // Or better, create a dummy parent.
        const dummyParent: Person = {
          id: uuidv4(),
          name: 'Unknown Parent',
          birthYear: '',
          deathYear: '',
          photo: null,
          gender: 'neutral',
          notes: '',
        };
        setData((prev) => ({
          nodes: [...prev.nodes, dummyParent, newPerson],
          edges: [
            ...prev.edges,
            { id: uuidv4(), type: 'parent-child', from: dummyParent.id, to: sourceId },
            { id: uuidv4(), type: 'parent-child', from: dummyParent.id, to: newPerson.id },
          ],
        }));
        setSelectedId(newPerson.id);
        return;
      }
    }

    setData((prev) => ({
      nodes: [...prev.nodes, newPerson],
      edges: newEdges,
    }));
    setSelectedId(newPerson.id);
  };

  const handleSavePerson = (updatedPerson: Person) => {
    setData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === updatedPerson.id ? updatedPerson : n)),
    }));
  };

  const handleDeletePerson = (id: string) => {
    setData((prev) => ({
      nodes: prev.nodes.filter((n) => n.id !== id),
      edges: prev.edges.filter((e) => e.from !== id && e.to !== id),
    }));
    setSelectedId(null);
  };

  const handleImport = async () => {
    try {
      const importedData = await importTree();
      setData(importedData);
      setFitScreenTrigger((prev) => prev + 1);
    } catch (e) {
      alert(e);
    }
  };

  const selectedPerson = data.nodes.find((n) => n.id === selectedId) || null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-parchment font-sans text-sepia-900">
      {/* Background Texture */}
      <div className="absolute inset-0 pointer-events-none opacity-5 mix-blend-multiply bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]" />

      {data.nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h1 className="font-serif text-4xl text-sepia-800 mb-4">Family Tree Builder</h1>
            <p className="text-sepia-800/60">Start by adding yourself — click + Add Person below</p>
          </div>
        </div>
      ) : (
        <Canvas
          layout={layout}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddRelation={handleAddRelation}
          fitScreenTrigger={fitScreenTrigger}
        />
      )}

      <Toolbar
        onAddPerson={handleAddPerson}
        onFitScreen={() => setFitScreenTrigger((prev) => prev + 1)}
        onExport={() => exportTree(data)}
        onImport={handleImport}
      />

      <EditPanel
        person={selectedPerson}
        onSave={handleSavePerson}
        onDelete={handleDeletePerson}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}
