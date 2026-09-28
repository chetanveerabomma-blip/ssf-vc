import React from "react";
import { clsx } from "clsx";

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
}

export interface NBTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const NBTabs: React.FC<NBTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className,
}) => {
  return (
    <div className={clsx("inline-flex border-[3px] border-black bg-white p-1 rounded-[4px] shadow-[4px_4px_0px_#0A0A0A]", className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 font-heading text-xs font-black uppercase tracking-wider rounded-[2px] transition-all",
              isActive
                ? "bg-[#FFD93D] text-black border-2 border-black shadow-[2px_2px_0px_#0A0A0A] -translate-y-0.5"
                : "text-gray-600 hover:text-black hover:bg-gray-100"
            )}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="bg-black text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
