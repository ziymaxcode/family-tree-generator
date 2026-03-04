import React, { useState } from 'react';
import { Person } from '../types';
import { motion } from 'motion/react';
import { Plus, User, Heart, Baby, Users } from 'lucide-react';
import clsx from 'clsx';

interface NodeCardProps {
  person: Person;
  isSelected: boolean;
  onClick: (id: string) => void;
  onAddRelation: (id: string, relationType: string) => void;
}

export const NodeCard: React.FC<NodeCardProps> = ({ person, isSelected, onClick, onAddRelation }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleRelationClick = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    setShowMenu(false);
    onAddRelation(person.id, type);
  };

  const genderColor = {
    male: 'bg-blue-50/80 border-blue-200 text-blue-900',
    female: 'bg-rose-50/80 border-rose-200 text-rose-900',
    neutral: 'bg-sepia-100/80 border-sepia-200 text-sepia-900',
  }[person.gender];

  return (
    <div className="relative group">
      <motion.div
        layoutId={`node-${person.id}`}
        onClick={() => onClick(person.id)}
        className={clsx(
          'w-[280px] h-[120px] rounded-2xl p-4 cursor-pointer transition-all duration-300 backdrop-blur-sm border shadow-sm flex items-center gap-4 relative overflow-hidden',
          genderColor,
          isSelected ? 'ring-4 ring-forest-600/50 shadow-xl scale-105 z-20' : 'hover:shadow-md hover:-translate-y-1 z-10'
        )}
      >
        {/* Decorative corner motif */}
        <div className="absolute -top-6 -right-6 w-24 h-24 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0 C70 30, 100 50, 100 50 C100 50, 70 70, 50 100 C30 70, 0 50, 0 50 C0 50, 30 30, 50 0 Z" />
          </svg>
        </div>

        {/* Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-white/50 border-2 border-white/80 shadow-inner flex-shrink-0 flex items-center justify-center">
          {person.photo ? (
            <img src={person.photo} alt={person.name} className="w-full h-full object-cover" />
          ) : (
            <User size={24} className="text-sepia-800/50" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0">
          <h3 className="font-serif text-xl font-semibold truncate text-sepia-900 leading-tight">
            {person.name}
          </h3>
          <p className="text-xs font-sans font-medium text-sepia-800/70 mt-1">
            {person.birthYear} — {person.deathYear || 'Present'}
          </p>
          {person.notes && (
            <p className="text-[10px] font-sans text-sepia-800/50 mt-2 truncate max-w-[150px]">
              {person.notes}
            </p>
          )}
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddClick}
          className={clsx(
            "absolute -bottom-3 -right-3 w-10 h-10 rounded-full bg-white shadow-md border border-sepia-200 flex items-center justify-center text-forest-600 hover:bg-forest-50 transition-colors z-30",
            showMenu ? "rotate-45" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <Plus size={20} />
        </button>
      </motion.div>

      {/* Context Menu */}
      {showMenu && (
        <div className="absolute top-full right-0 mt-4 w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-sepia-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={(e) => handleRelationClick(e, 'add-father')}
              className="flex items-center gap-3 px-3 py-2 text-sm text-sepia-800 hover:bg-sepia-50 rounded-lg transition-colors text-left"
            >
              <User size={16} className="text-blue-600" /> Add Father
            </button>
            <button
              onClick={(e) => handleRelationClick(e, 'add-mother')}
              className="flex items-center gap-3 px-3 py-2 text-sm text-sepia-800 hover:bg-sepia-50 rounded-lg transition-colors text-left"
            >
              <User size={16} className="text-rose-600" /> Add Mother
            </button>
            <div className="h-px bg-sepia-100 my-1" />
            <button
              onClick={(e) => handleRelationClick(e, 'add-spouse')}
              className="flex items-center gap-3 px-3 py-2 text-sm text-sepia-800 hover:bg-sepia-50 rounded-lg transition-colors text-left"
            >
              <Heart size={16} className="text-red-500" /> Add Spouse
            </button>
            <div className="h-px bg-sepia-100 my-1" />
            <button
              onClick={(e) => handleRelationClick(e, 'add-son')}
              className="flex items-center gap-3 px-3 py-2 text-sm text-sepia-800 hover:bg-sepia-50 rounded-lg transition-colors text-left"
            >
              <Baby size={16} className="text-blue-600" /> Add Son
            </button>
            <button
              onClick={(e) => handleRelationClick(e, 'add-daughter')}
              className="flex items-center gap-3 px-3 py-2 text-sm text-sepia-800 hover:bg-sepia-50 rounded-lg transition-colors text-left"
            >
              <Baby size={16} className="text-rose-600" /> Add Daughter
            </button>
            <div className="h-px bg-sepia-100 my-1" />
            <button
              onClick={(e) => handleRelationClick(e, 'add-sibling')}
              className="flex items-center gap-3 px-3 py-2 text-sm text-sepia-800 hover:bg-sepia-50 rounded-lg transition-colors text-left"
            >
              <Users size={16} className="text-forest-600" /> Add Sibling
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
