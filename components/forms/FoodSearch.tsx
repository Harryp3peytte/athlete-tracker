'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { searchFood, calculateNutrition, type FoodItem } from '@/lib/foodDatabase';

interface FoodLine {
  food: FoodItem | null;
  customName: string;
  grams: number;
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

interface FoodSearchProps {
  onTotalsChange: (totals: { description: string; calories: number; proteins: number; carbs: number; fats: number }) => void;
}

function emptyLine(): FoodLine {
  return { food: null, customName: '', grams: 0, calories: 0, proteins: 0, carbs: 0, fats: 0 };
}

export default function FoodSearch({ onTotalsChange }: FoodSearchProps) {
  const [lines, setLines] = useState<FoodLine[]>([emptyLine()]);

  // Update parent whenever lines change
  useEffect(() => {
    const filledLines = lines.filter(l => l.calories > 0 || l.customName);
    const description = filledLines.map(l => l.food?.name || l.customName).filter(Boolean).join(' + ');
    const totals = {
      description,
      calories: filledLines.reduce((s, l) => s + l.calories, 0),
      proteins: filledLines.reduce((s, l) => s + l.proteins, 0),
      carbs: filledLines.reduce((s, l) => s + l.carbs, 0),
      fats: filledLines.reduce((s, l) => s + l.fats, 0),
    };
    onTotalsChange(totals);
  }, [lines, onTotalsChange]);

  const updateLine = (index: number, updates: Partial<FoodLine>) => {
    setLines(prev => prev.map((l, i) => i === index ? { ...l, ...updates } : l));
  };

  const selectFood = (index: number, food: FoodItem) => {
    const grams = food.defaultPortionG;
    const n = calculateNutrition(food, grams);
    updateLine(index, { food, customName: food.name, grams, ...n });
  };

  const updateGrams = (index: number, grams: number) => {
    const line = lines[index];
    if (line.food && grams > 0) {
      const n = calculateNutrition(line.food, grams);
      updateLine(index, { grams, ...n });
    } else {
      updateLine(index, { grams });
    }
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (index: number) => {
    if (lines.length <= 1) { setLines([emptyLine()]); return; }
    setLines(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => (
        <FoodLineInput
          key={idx}
          line={line}
          onSelectFood={(food) => selectFood(idx, food)}
          onCustomNameChange={(name) => updateLine(idx, { customName: name, food: null })}
          onGramsChange={(g) => updateGrams(idx, g)}
          onCaloriesChange={(v) => updateLine(idx, { calories: v })}
          onProteinsChange={(v) => updateLine(idx, { proteins: v })}
          onCarbsChange={(v) => updateLine(idx, { carbs: v })}
          onFatsChange={(v) => updateLine(idx, { fats: v })}
          onRemove={() => removeLine(idx)}
          showRemove={lines.length > 1}
        />
      ))}

      <button type="button" onClick={addLine} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: '#2AC956' }}>
        <Plus size={14} /> Ajouter un aliment
      </button>

      {/* Totals */}
      {lines.some(l => l.calories > 0) && (
        <div className="glass-subtle rounded-xl px-4 py-3 flex justify-between text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>Total</span>
          <div className="flex gap-3">
            <span style={{ color: '#FF9F0A' }}>{lines.reduce((s, l) => s + l.calories, 0)} kcal</span>
            <span style={{ color: '#2AC956' }}>{lines.reduce((s, l) => s + l.proteins, 0).toFixed(1)}g P</span>
            <span style={{ color: '#64D2FF' }}>{lines.reduce((s, l) => s + l.carbs, 0).toFixed(1)}g G</span>
            <span style={{ color: '#FF9F0A' }}>{lines.reduce((s, l) => s + l.fats, 0).toFixed(1)}g L</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FoodLineInput({ line, onSelectFood, onCustomNameChange, onGramsChange, onCaloriesChange, onProteinsChange, onCarbsChange, onFatsChange, onRemove, showRemove }: {
  line: FoodLine;
  onSelectFood: (food: FoodItem) => void;
  onCustomNameChange: (name: string) => void;
  onGramsChange: (g: number) => void;
  onCaloriesChange: (v: number) => void;
  onProteinsChange: (v: number) => void;
  onCarbsChange: (v: number) => void;
  onFatsChange: (v: number) => void;
  onRemove: () => void;
  showRemove: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoodItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (val: string) => {
    setQuery(val);
    onCustomNameChange(val);
    const found = searchFood(val);
    setResults(found);
    setShowDropdown(found.length > 0);
  };

  const handleSelect = (food: FoodItem) => {
    setQuery(food.name);
    setShowDropdown(false);
    onSelectFood(food);
  };

  return (
    <div className="glass-subtle rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        {/* Food search */}
        <div className="flex-1 relative" ref={wrapperRef}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.25)' }} />
            <input
              className="input-field pl-9 text-sm"
              placeholder="Rechercher un aliment..."
              value={query}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            />
          </div>
          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute z-40 mt-1 w-full max-h-48 overflow-y-auto rounded-xl"
              style={{
                background: 'rgba(15,23,42,0.95)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
            >
              {results.map((food, i) => (
                <button
                  key={i}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm flex justify-between items-center transition-colors hover:bg-white/[0.06]"
                  onClick={() => handleSelect(food)}
                >
                  <span>{food.name}</span>
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {Math.round(food.caloriesPer100g * food.defaultPortionG / 100)} kcal / {food.defaultPortionG}g
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Grams */}
        <div className="w-20">
          <input
            type="number"
            className="input-field text-sm text-center"
            placeholder="g"
            value={line.grams || ''}
            onChange={e => onGramsChange(parseFloat(e.target.value) || 0)}
          />
        </div>
        {showRemove && (
          <button type="button" onClick={onRemove} className="p-1 transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* Macro fields (editable) */}
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className="text-[10px] block mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>kcal</label>
          <input type="number" className="input-field text-xs text-center py-1.5" value={line.calories || ''} onChange={e => onCaloriesChange(parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-[10px] block mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Prot (g)</label>
          <input type="number" step="0.1" className="input-field text-xs text-center py-1.5" value={line.proteins || ''} onChange={e => onProteinsChange(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-[10px] block mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Gluc (g)</label>
          <input type="number" step="0.1" className="input-field text-xs text-center py-1.5" value={line.carbs || ''} onChange={e => onCarbsChange(parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <label className="text-[10px] block mb-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>Lip (g)</label>
          <input type="number" step="0.1" className="input-field text-xs text-center py-1.5" value={line.fats || ''} onChange={e => onFatsChange(parseFloat(e.target.value) || 0)} />
        </div>
      </div>

      {line.food && (
        <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Estimation pour {line.grams}g de {line.food.name}
        </div>
      )}
    </div>
  );
}
