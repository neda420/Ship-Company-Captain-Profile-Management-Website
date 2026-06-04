import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Eye,
  MapPin,
  Filter,
  Mail
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { CaptainProfile, Status } from '../types';

type SortField = 'name' | 'location' | 'status' | 'title';
type SortDirection = 'asc' | 'desc';

interface EmployeeTableProps {
  employees: CaptainProfile[];
  initialStatusFilter?: string | null;
}

const EmployeeTable = ({ employees, initialStatusFilter }: EmployeeTableProps) => {
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [locationFilter, setLocationFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>(initialStatusFilter as Status || 'all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get unique values for filters
  const locations = useMemo(() => {
    return Array.from(new Set(employees.map(emp => emp.location)));
  }, [employees]);

  const statuses: Status[] = ['Available', 'Onboard', 'On Leave', 'Active'];
  const teams = ['Deck', 'Engine', 'Catering'];

  // Sorting logic
  const sortedEmployees = useMemo(() => {
    const sorted = [...employees].sort((a, b) => {
      let aValue: string;
      let bValue: string;

      switch (sortField) {
        case 'name':
          aValue = a.fullName;
          bValue = b.fullName;
          break;
        case 'location':
          aValue = a.location;
          bValue = b.location;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

    return sorted;
  }, [employees, sortField, sortDirection]);

  // Filtering logic
  const filteredEmployees = useMemo(() => {
    return sortedEmployees.filter(emp => {
      const matchesSearch = 
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.title.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesLocation = !locationFilter || emp.location.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
      const matchesTeam = teamFilter === 'all' || emp.title.toLowerCase().includes(teamFilter.toLowerCase());

      return matchesSearch && matchesLocation && matchesStatus && matchesTeam;
    });
  }, [sortedEmployees, searchTerm, locationFilter, statusFilter, teamFilter]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusVariant = (status: Status) => {
    switch (status) {
      case 'Available':
        return 'available';
      case 'Onboard':
        return 'onboard';
      case 'Active':
        return 'active';
      default:
        return 'secondary';
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 text-slate-400" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1 text-emerald-500" />
      : <ArrowDown className="w-4 h-4 ml-1 text-emerald-500" />;
  };

  // Stagger animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters and Search */}
      <div className="glass rounded-xl p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-600 flex-shrink-0" />
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Search */}
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              // When search is cleared, reset to show all employees
              if (!e.target.value) {
                setLocationFilter('');
                setStatusFilter('all');
                setTeamFilter('all');
              }
            }}
            className="w-full"
          />

          {/* Location Search */}
          <Input
            placeholder="Search by location..."
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full"
          />

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Status | 'all')}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <option value="all">All Status</option>
            {statuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Team Filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
          >
            <option value="all">All Teams</option>
            {teams.map(team => (
              <option key={team} value={team}>{team}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Name
                    <SortIcon field="name" />
                  </button>
                </th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left">
                  <button
                    onClick={() => handleSort('title')}
                    className="flex items-center font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Rank
                    <SortIcon field="title" />
                  </button>
                </th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left">
                  <button
                    onClick={() => handleSort('location')}
                    className="flex items-center font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Location
                    <SortIcon field="location" />
                  </button>
                </th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-left">
                  <button
                    onClick={() => handleSort('status')}
                    className="flex items-center font-semibold text-sm text-slate-700 hover:text-slate-900 transition-colors"
                  >
                    Status
                    <SortIcon field="status" />
                  </button>
                </th>
                <th className="px-4 xl:px-6 py-3 xl:py-4 text-right">
                  <span className="font-semibold text-sm text-slate-700">Actions</span>
                </th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredEmployees.map((employee) => (
                <motion.tr
                  key={employee.id}
                  variants={rowVariants}
                  whileHover={{ 
                    scale: 1.01,
                    transition: { duration: 0.2 }
                  }}
                  className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group"
                >
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={employee.avatarUrl}
                        alt={employee.fullName}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 truncate">{employee.fullName}</p>
                        <p className="text-xs text-slate-500 truncate">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <p className="text-sm text-slate-700">{employee.title}</p>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{employee.location}</span>
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4">
                    <Badge variant={getStatusVariant(employee.status)} className="text-xs">
                      {employee.status}
                    </Badge>
                  </td>
                  <td className="px-4 xl:px-6 py-3 xl:py-4 text-right">
                    <Link to={`/profile/${employee.id}`}>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <Eye className="w-4 h-4" />
                        <span className="hidden xl:inline">View</span>
                      </Button>
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-slate-500">No employees found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredEmployees.map((employee) => (
            <motion.div
              key={employee.id}
              variants={rowVariants}
              whileHover={{ scale: 1.01 }}
              className="glass rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <img
                    src={employee.avatarUrl}
                    alt={employee.fullName}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 truncate">{employee.fullName}</h3>
                    <p className="text-sm text-slate-500 truncate">{employee.title}</p>
                  </div>
                </div>
                <Badge variant={getStatusVariant(employee.status)} className="flex-shrink-0">
                  {employee.status}
                </Badge>
              </div>
              
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{employee.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{employee.location}</span>
                </div>
              </div>

              <Link to={`/profile/${employee.id}`} className="block">
                <Button variant="outline" className="w-full gap-2">
                  <Eye className="w-4 h-4" />
                  View Profile
                </Button>
              </Link>
            </motion.div>
          ))}
        </motion.div>
        {filteredEmployees.length === 0 && (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-slate-500">No employees found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeTable;
