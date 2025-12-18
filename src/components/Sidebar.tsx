// src/components/Sidebar.tsx
import { Ship, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Rank, Status } from '../types';

interface SidebarProps {
  // We accept these props so the Dashboard can control the filtering
  selectedRanks?: Rank[];
  selectedStatus?: Status[];
  onToggleRank?: (rank: Rank) => void;
  onToggleStatus?: (status: Status) => void;
}

const Sidebar = ({ 
  selectedRanks = [], 
  selectedStatus = [], 
  onToggleRank = () => {}, 
  onToggleStatus = () => {} 
}: SidebarProps) => {

  // Explicitly typed arrays to satisfy TypeScript
  const rankOptions: Rank[] = ['Captain', 'Chief Mate', '2nd Officer', 'Chief Engineer'];
  const statusOptions: Status[] = ['Available', 'Onboard', 'On Leave'];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full shadow-xl z-20 overflow-y-auto">
      {/* Brand */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-700">
        <Ship className="h-8 w-8 text-cyan-400" />
        <span className="text-xl font-bold tracking-wide">CrewDeck</span>
      </div>

      <div className="p-6 flex-1">
        {/* Navigation */}
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Menu</h3>
          <Link to="/" className="block py-2.5 px-4 rounded transition bg-cyan-600/20 text-cyan-300 font-medium hover:bg-cyan-600/30">
            Dashboard
          </Link>
          <div className="block py-2.5 px-4 rounded transition text-slate-400 hover:text-white cursor-pointer">
            All Crew
          </div>
          <div className="block py-2.5 px-4 rounded transition text-slate-400 hover:text-white cursor-pointer">
            Add Employee
          </div>
        </div>

        {/* Filters Section */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-2 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <Filter className="w-3 h-3" /> Filters
          </div>

          {/* Rank Filters */}
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">By Rank</h4>
            {rankOptions.map((rank) => (
              <label key={rank} className="flex items-center gap-3 mb-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="accent-cyan-500 rounded border-slate-600 bg-slate-800"
                  checked={selectedRanks.includes(rank)}
                  onChange={() => onToggleRank(rank)} 
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition">{rank}</span>
              </label>
            ))}
          </div>

          {/* Status Filters */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 mb-3 uppercase">By Status</h4>
            {statusOptions.map((status) => (
              <label key={status} className="flex items-center gap-3 mb-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  className="accent-cyan-500 rounded border-slate-600 bg-slate-800" 
                  checked={selectedStatus.includes(status)}
                  onChange={() => onToggleStatus(status)}
                />
                <span className="text-sm text-slate-300 group-hover:text-white transition">{status}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Admin User Footer */}
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center font-bold text-white">A</div>
          <div>
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-slate-400">HR Director</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;