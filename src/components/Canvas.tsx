import React, { useRef, useState, useEffect } from 'react';
import { LayoutData } from '../types';
import { NodeCard } from './NodeCard';
import { NODE_WIDTH, NODE_HEIGHT } from '../utils/layout';

interface CanvasProps {
  layout: LayoutData;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddRelation: (id: string, type: string) => void;
  fitScreenTrigger: number;
}

export const Canvas: React.FC<CanvasProps> = ({
  layout,
  selectedId,
  onSelect,
  onAddRelation,
  fitScreenTrigger,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle Pan
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      
      let clientX, clientY;
      if ('touches' in e) {
        if (e.touches.length === 1) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else {
          return; // Handled by pinch zoom
        }
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      setDragStart({ x: clientX - transform.x, y: clientY - transform.y });
      onSelect(null);
    }
  };

  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length === 2) {
      // Pinch to zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);

      if (lastTouchDistance !== null) {
        const delta = distance - lastTouchDistance;
        const scaleFactor = delta * 0.01;
        let newScale = transform.scale * (1 + scaleFactor);
        newScale = Math.max(0.1, Math.min(newScale, 3));

        // Zoom towards center of pinch
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
      return;
    }

    if (isDragging) {
      let clientX, clientY;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      setTransform((prev) => ({
        ...prev,
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastTouchDistance(null);
  };

  // Handle Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = -e.deltaY * 0.001;
    let newScale = transform.scale * (1 + scaleFactor);
    newScale = Math.max(0.1, Math.min(newScale, 3)); // Clamp scale

    // Zoom towards mouse pointer
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
      const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

      setTransform({ x: newX, y: newY, scale: newScale });
    }
  };

  // Fit to screen
  useEffect(() => {
    if (layout.nodes.length === 0 || !containerRef.current) return;

    const minX = Math.min(...layout.nodes.map((n) => n.x));
    const maxX = Math.max(...layout.nodes.map((n) => n.x + n.width));
    const minY = Math.min(...layout.nodes.map((n) => n.y));
    const maxY = Math.max(...layout.nodes.map((n) => n.y + n.height));

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
  }, [layout, fitScreenTrigger]);

  // Render edges
  const renderEdges = () => {
    const paths: React.ReactNode[] = [];

    layout.families.forEach((fam) => {
      // Draw lines from spouses to family dummy node
      fam.spouses.forEach((spouseId) => {
        const spouseNode = layout.nodes.find((n) => n.id === spouseId);
        if (spouseNode) {
          const startX = spouseNode.x + NODE_WIDTH / 2;
          const startY = spouseNode.y + NODE_HEIGHT / 2;
          const endX = fam.x;
          const endY = fam.y;

          // Spouse line (horizontal-ish)
          const path = `M ${startX} ${startY} C ${startX} ${endY}, ${endX} ${startY}, ${endX} ${endY}`;
          paths.push(
            <path
              key={`spouse-${spouseId}-${fam.id}`}
              d={path}
              fill="none"
              stroke="var(--color-gold-400)"
              strokeWidth="3"
              strokeDasharray="6 6"
              className="opacity-60"
            />
          );
        }
      });

      // Draw lines from family dummy node to children
      fam.children.forEach((childId) => {
        const childNode = layout.nodes.find((n) => n.id === childId);
        if (childNode) {
          const startX = fam.x;
          const startY = fam.y;
          const endX = childNode.x + NODE_WIDTH / 2;
          const endY = childNode.y;

          // Parent-child line (vertical-ish)
          const path = `M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`;
          paths.push(
            <path
              key={`child-${fam.id}-${childId}`}
              d={path}
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
      className="w-full h-screen overflow-hidden cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchMove={handleMouseMove}
      onTouchEnd={handleMouseUp}
      onTouchCancel={handleMouseUp}
      onWheel={handleWheel}
    >
      <div
        style={{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          width: 0,
          height: 0,
        }}
        className="relative transition-transform duration-75 ease-out"
      >
        <svg className="absolute top-0 left-0 overflow-visible pointer-events-none">
          {renderEdges()}
        </svg>

        {layout.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute"
            style={{
              left: node.x,
              top: node.y,
              width: node.width,
              height: node.height,
            }}
          >
            <NodeCard
              person={node}
              isSelected={selectedId === node.id}
              onClick={onSelect}
              onAddRelation={onAddRelation}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
