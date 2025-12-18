import { motion } from 'framer-motion';
import EmployeeTable from '../components/EmployeeTable';
import { useCaptains } from '../context/CaptainsContext';

const Employees = () => {
  const { captains } = useCaptains();
  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 sm:space-y-6"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
            All Employees
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            View and manage all employee records
          </p>
        </div>
        <EmployeeTable employees={captains} />
      </motion.div>
    </div>
  );
};

export default Employees;
