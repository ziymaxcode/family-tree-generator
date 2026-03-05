import React, { useRef, useState, useEffect } from 'react';
import { FamilyTreeData, Person } from '../types';
import { NodeCard } from './NodeCard';

export const NODE_WIDTH = 280;
export const NODE_HEIGHT = 120;

interface CanvasProps {
  data: FamilyTreeData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddRelation: (id: string, type: string) => void;
  onNodeDrag: (id: string, x: number, y: number) => void;
  fitScreenTrigger: number;
  exportRef: React.RefObject<HTMLDivElement | null>;
}

export const Canvas: React.FC<CanvasProps> = ({
  data,
  selectedId,
  onSelect,
  onAddRelation,
  onNodeDrag,
  fitScreenTrigger,
  exportRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [nodeDragStart, setNodeDragStart] = useState({ mouseX: 0, mouseY: 0, nodeX: 0, nodeY: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      onSelect(null);
    }
  };

  const handleNodePointerDown = (e: React.PointerEvent, node: Person) => {
    e.stopPropagation();
    setDraggingNodeId(node.id);
    setNodeDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      nodeX: node.x,
      nodeY: node.y,
    });
    onSelect(node.id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (draggingNodeId) {
      const deltaX = (e.clientX - nodeDragStart.mouseX) / transform.scale;
      const deltaY = (e.clientY - nodeDragStart.mouseY) / transform.scale;
      onNodeDrag(draggingNodeId, nodeDragStart.nodeX + deltaX, nodeDragStart.nodeY + deltaY);
    } else if (isPanning) {
      setTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    }
  };

  const handlePointerUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
    setLastTouchDistance(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

      if (lastTouchDistance !== null) {
        const delta = distance - lastTouchDistance;
        const scaleFactor = delta * 0.01;
        let newScale = transform.scale * (1 + scaleFactor);
        newScale = Math.max(0.1, Math.min(newScale, 3));

        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const mouseX = centerX - rect.left;
          const mouseY = centerY - rect.top;

          const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
          const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

          setTransform({ x: newX, y: newY, scale: newScale });
        }
      }
      setLastTouchDistance(distance);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = -e.deltaY * 0.001;
    let newScale = transform.scale * (1 + scaleFactor);
    newScale = Math.max(0.1, Math.min(newScale, 3));

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
      const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

      setTransform({ x: newX, y: newY, scale: newScale });
    }
  };

  useEffect(() => {
    if (data.nodes.length === 0 || !containerRef.current) return;

    const minX = Math.min(...data.nodes.map((n) => n.x));
    const maxX = Math.max(...data.nodes.map((n) => n.x + NODE_WIDTH));
    const minY = Math.min(...data.nodes.map((n) => n.y));
    const maxY = Math.max(...data.nodes.map((n) => n.y + NODE_HEIGHT));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const containerWidth = containerRef.current.clientWidth;
    const containerHeight = containerRef.current.clientHeight;

    const scaleX = containerWidth / (contentWidth + 200);
    const scaleY = containerHeight / (contentHeight + 200);
    const newScale = Math.min(scaleX, scaleY, 1);

    const centerX = minX + contentWidth / 2;
    const centerY = minY + contentHeight / 2;

    const newX = containerWidth / 2 - centerX * newScale;
    const newY = containerHeight / 2 - centerY * newScale;

    setTransform({ x: newX, y: newY, scale: newScale });
  }, [fitScreenTrigger]); // Only run on fitScreenTrigger

  const renderEdges = () => {
    const familiesMap = new Map<string, { spouses: Set<string>; children: Set<string> }>();
    let familyCounter = 0;

    data.edges.filter(e => e.type === 'spouse').forEach(e => {
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
        familiesMap.set(`fam_${familyCounter++}`, { spouses: new Set([e.from, e.to]), children: new Set() });
      }
    });

    data.edges.filter(e => e.type === 'parent-child').forEach(e => {
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
        familiesMap.set(`fam_${familyCounter++}`, { spouses: new Set([parentId]), children: new Set([childId]) });
      }
    });

    const paths: React.ReactNode[] = [];

    familiesMap.forEach((fam, famId) => {
      const spouseNodes = Array.from(fam.spouses).map(id => data.nodes.find(n => n.id === id)).filter(Boolean) as Person[];
      if (spouseNodes.length === 0) return;

      const famX = spouseNodes.reduce((sum, n) => sum + n.x, 0) / spouseNodes.length + NODE_WIDTH / 2;
      const famY = spouseNodes.reduce((sum, n) => sum + n.y, 0) / spouseNodes.length + NODE_HEIGHT / 2;

      spouseNodes.forEach(spouse => {
        const startX = spouse.x + NODE_WIDTH / 2;
        const startY = spouse.y + NODE_HEIGHT / 2;
        paths.push(
          <path
            key={`spouse-${spouse.id}-${famId}`}
            d={`M ${startX} ${startY} L ${famX} ${famY}`}
            fill="none"
            stroke="var(--color-gold-400)"
            strokeWidth="3"
            strokeDasharray="6 6"
            className="opacity-60"
          />
        );
      });

      fam.children.forEach(childId => {
        const childNode = data.nodes.find(n => n.id === childId);
        if (childNode) {
          const endX = childNode.x + NODE_WIDTH / 2;
          const endY = childNode.y;
          paths.push(
            <path
              key={`child-${famId}-${childId}`}
              d={`M ${famX} ${famY} C ${famX} ${famY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`}
              fill="none"
              stroke="var(--color-forest-600)"
              strokeWidth="4"
              strokeLinecap="round"
              className="opacity-80"
            />
          );
        }
      });
    });

    return paths;
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => setLastTouchDistance(null)}
      onWheel={handleWheel}
    >
      <div
        ref={exportRef}
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
        }}
        className="relative w-full h-full transition-transform duration-75 ease-out"
      >
        <svg className="absolute top-0 left-0 w-full h-full overflow-visible pointer-events-none">
          {renderEdges()}
        </svg>

        {data.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute touch-none"
            style={{
              left: node.x,
              top: node.y,
              width: NODE_WIDTH,
              height: NODE_HEIGHT,
              cursor: draggingNodeId === node.id ? 'grabbing' : 'grab',
            }}
            onPointerDown={(e) => handleNodePointerDown(e, node)}
          >
            <NodeCard
              person={node}
              isSelected={selectedId === node.id}
              onAddRelation={onAddRelation}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
