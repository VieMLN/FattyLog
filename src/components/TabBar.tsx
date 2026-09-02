import React from 'react';
import { ActiveTab } from '../types';
import { Utensils, CheckSquare, BarChart3 } from 'lucide-react';

/**
 * Props for the bottom navigation TabBar component.
 */
interface TabBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

/**
 * Fixed bottom navigation bar for switching between Kalorien, Habits, and Statistik views.
 */
export const TabBar: React.FC<TabBarProps> = ({ activeTab, onSelectTab }) => {
  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { key: 'calories', label: 'Kalorien', icon: <Utensils className="w-4 h-4" /> },
    { key: 'habits', label: 'Habits', icon: <CheckSquare className="w-4 h-4" /> },
    { key: 'stats', label: 'Statistik', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <nav
      id="main-tab-bar"
      className="bg-white border-t border-slate-200 sticky bottom-0 z-20 flex shadow-xs"
      aria-label="Hauptnavigation"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            id={`tab-btn-${tab.key}`}
            onClick={() => onSelectTab(tab.key)}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 relative transition-colors ${
              isActive
                ? 'text-blue-600 font-bold'
                : 'text-slate-400 hover:text-slate-600 font-semibold'
            }`}
            aria-selected={isActive}
            role="tab"
          >
            {isActive && (
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
            <div className="mb-0.5">{tab.icon}</div>
            <span className="text-[11px] leading-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

