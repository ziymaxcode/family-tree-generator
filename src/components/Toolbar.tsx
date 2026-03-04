import React from 'react';
import { Plus, Maximize, Download, Upload } from 'lucide-react';

interface ToolbarProps {
  onAddPerson: () => void;
  onFitScreen: () => void;
  onExport: () => void;
  onImport: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onAddPerson,
  onFitScreen,
  onExport,
  onImport,
}) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-md shadow-lg rounded-full py-3 px-6 flex items-center gap-6 border border-sepia-200 z-50">
      <button
        onClick={onAddPerson}
        className="flex flex-col items-center gap-1 text-sepia-800 hover:text-forest-600 transition-colors group"
      >
        <div className="p-2 bg-sepia-100 rounded-full group-hover:bg-forest-600 group-hover:text-white transition-colors">
          <Plus size={20} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider">Add Person</span>
      </button>

      <div className="w-[1px] h-8 bg-sepia-200"></div>

      <button
        onClick={onFitScreen}
        className="flex flex-col items-center gap-1 text-sepia-800 hover:text-forest-600 transition-colors group"
      >
        <div className="p-2 bg-sepia-100 rounded-full group-hover:bg-forest-600 group-hover:text-white transition-colors">
          <Maximize size={20} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider">Fit Screen</span>
      </button>

      <div className="w-[1px] h-8 bg-sepia-200"></div>

      <button
        onClick={onExport}
        className="flex flex-col items-center gap-1 text-sepia-800 hover:text-forest-600 transition-colors group"
      >
        <div className="p-2 bg-sepia-100 rounded-full group-hover:bg-forest-600 group-hover:text-white transition-colors">
          <Download size={20} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider">Export</span>
      </button>

      <button
        onClick={onImport}
        className="flex flex-col items-center gap-1 text-sepia-800 hover:text-forest-600 transition-colors group"
      >
        <div className="p-2 bg-sepia-100 rounded-full group-hover:bg-forest-600 group-hover:text-white transition-colors">
          <Upload size={20} />
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wider">Import</span>
      </button>
    </div>
  );
};
