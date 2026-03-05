import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Person, FamilyTreeData } from './types';
import { loadTree, saveTree } from './utils/storage';
import { Canvas, NODE_WIDTH, NODE_HEIGHT } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { EditPanel } from './components/EditPanel';
import * as htmlToImage from 'html-to-image';

export default function App() {
  const [data, setData] = useState<FamilyTreeData>({ nodes: [], edges: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fitScreenTrigger, setFitScreenTrigger] = useState(0);
  const exportRef = useRef<HTMLDivElement>(null);

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

  const handleAddPerson = () => {
    const newPerson: Person = {
      id: uuidv4(),
      name: 'New Person',
      birthYear: '',
      deathYear: '',
      photo: null,
      gender: 'neutral',
      notes: '',
      x: 0,
      y: 0,
    };
    setData((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newPerson],
    }));
    setSelectedId(newPerson.id);
  };

  const handleAddRelation = (sourceId: string, type: string) => {
    const sourceNode = data.nodes.find(n => n.id === sourceId);
    const baseX = sourceNode ? sourceNode.x : 0;
    const baseY = sourceNode ? sourceNode.y : 0;

    let newX = baseX;
    let newY = baseY;

    if (type === 'add-father') { newX = baseX - 160; newY = baseY - 200; }
    else if (type === 'add-mother') { newX = baseX + 160; newY = baseY - 200; }
    else if (type === 'add-spouse') { newX = baseX + 320; newY = baseY; }
    else if (type === 'add-son' || type === 'add-daughter') { newX = baseX + (Math.random() * 100 - 50); newY = baseY + 200; }
    else if (type === 'add-sibling') { newX = baseX + 320; newY = baseY; }

    const newPerson: Person = {
      id: uuidv4(),
      name: 'New Person',
      birthYear: '',
      deathYear: '',
      photo: null,
      gender: type.includes('father') || type.includes('son') ? 'male' : type.includes('mother') || type.includes('daughter') ? 'female' : 'neutral',
      notes: '',
      x: newX,
      y: newY,
    };

    const newEdges = [...data.edges];

    if (type === 'add-father' || type === 'add-mother') {
      newEdges.push({ id: uuidv4(), type: 'parent-child', from: newPerson.id, to: sourceId });
    } else if (type === 'add-son' || type === 'add-daughter') {
      newEdges.push({ id: uuidv4(), type: 'parent-child', from: sourceId, to: newPerson.id });
    } else if (type === 'add-spouse') {
      newEdges.push({ id: uuidv4(), type: 'spouse', from: sourceId, to: newPerson.id });
    } else if (type === 'add-sibling') {
      const parents = data.edges.filter((e) => e.type === 'parent-child' && e.to === sourceId).map((e) => e.from);
      if (parents.length > 0) {
        parents.forEach((p) => {
          newEdges.push({ id: uuidv4(), type: 'parent-child', from: p, to: newPerson.id });
        });
      } else {
        const dummyParent: Person = {
          id: uuidv4(),
          name: 'Unknown Parent',
          birthYear: '',
          deathYear: '',
          photo: null,
          gender: 'neutral',
          notes: '',
          x: baseX + 160,
          y: baseY - 200,
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

  const handleNodeDrag = (id: string, x: number, y: number) => {
    setData((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
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

  const handleExportImage = async () => {
    if (!exportRef.current || data.nodes.length === 0) return;

    // Calculate bounding box
    const minX = Math.min(...data.nodes.map((n) => n.x));
    const maxX = Math.max(...data.nodes.map((n) => n.x + NODE_WIDTH));
    const minY = Math.min(...data.nodes.map((n) => n.y));
    const maxY = Math.max(...data.nodes.map((n) => n.y + NODE_HEIGHT));

    const width = maxX - minX + 200;
    const height = maxY - minY + 200;

    const originalTransform = exportRef.current.style.transform;
    // Reset transform to capture the full bounding box
    exportRef.current.style.transform = `translate(${-minX + 100}px, ${-minY + 100}px) scale(1)`;

    try {
      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        width,
        height,
        pixelRatio: 2,
        backgroundColor: '#F4F0E6', // parchment background
      });
      const link = document.createElement('a');
      link.download = 'family-tree.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image', err);
      alert('Failed to export image. Please try again.');
    } finally {
      exportRef.current.style.transform = originalTransform;
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
          data={data}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAddRelation={handleAddRelation}
          onNodeDrag={handleNodeDrag}
          fitScreenTrigger={fitScreenTrigger}
          exportRef={exportRef}
        />
      )}

      <Toolbar
        onAddPerson={handleAddPerson}
        onFitScreen={() => setFitScreenTrigger((prev) => prev + 1)}
        onExportImage={handleExportImage}
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
