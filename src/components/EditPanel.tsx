import React, { useState, useRef, useEffect } from 'react';
import { Person } from '../types';
import { X, Camera, Trash2 } from 'lucide-react';

interface EditPanelProps {
  person: Person | null;
  onSave: (person: Person) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const EditPanel: React.FC<EditPanelProps> = ({ person, onSave, onDelete, onClose }) => {
  const [formData, setFormData] = useState<Person | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(person);
  }, [person]);

  if (!formData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => prev ? { ...prev, [name]: value } : null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => prev ? { ...prev, photo: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) onSave(formData);
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 bg-white/95 backdrop-blur-xl shadow-2xl border-l border-sepia-200 z-50 flex flex-col transform transition-transform duration-300 ease-in-out overflow-y-auto">
      <div className="flex items-center justify-between p-6 border-b border-sepia-200">
        <h2 className="font-serif text-2xl text-sepia-900 font-medium">Edit Profile</h2>
        <button onClick={onClose} className="p-2 hover:bg-sepia-100 rounded-full text-sepia-800 transition-colors">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 flex-1 flex flex-col gap-6">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="w-32 h-32 rounded-full border-2 border-dashed border-sepia-200 flex items-center justify-center bg-sepia-100 overflow-hidden relative group cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            {formData.photo ? (
              <img src={formData.photo} alt={formData.name} className="w-full h-full object-cover" />
            ) : (
              <Camera size={32} className="text-sepia-800 opacity-50" />
            )}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium uppercase tracking-wider">Change Photo</span>
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-sepia-800 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-sepia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-sepia-800 mb-1">Birth Year</label>
              <input
                type="text"
                name="birthYear"
                value={formData.birthYear}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-sepia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent font-sans"
              />
            </div>
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider text-sepia-800 mb-1">Death Year</label>
              <input
                type="text"
                name="deathYear"
                value={formData.deathYear}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-white border border-sepia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent font-sans"
                placeholder="Present"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-sepia-800 mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-white border border-sepia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent font-sans"
            >
              <option value="neutral">Neutral</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium uppercase tracking-wider text-sepia-800 mb-1">Notes / Bio</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-white border border-sepia-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest-600 focus:border-transparent font-sans resize-none"
            />
          </div>
        </div>

        <div className="mt-auto pt-6 flex flex-col gap-3">
          <button
            type="submit"
            className="w-full py-3 bg-forest-600 hover:bg-forest-700 text-white rounded-lg font-medium transition-colors shadow-md"
          >
            Save Changes
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this person? Their connections will be removed.')) {
                onDelete(formData.id);
              }
            }}
            className="w-full py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={18} />
            Delete Person
          </button>
        </div>
      </form>
    </div>
  );
};
