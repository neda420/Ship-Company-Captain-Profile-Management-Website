import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Ship, AlertCircle, AlertTriangle, Upload, Eye, Download, FileText } from 'lucide-react';
import EmployeeTable from '../components/EmployeeTable';
import { useCaptains } from '../context/CaptainsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';

const Dashboard = () => {
  const navigate = useNavigate();
  const { captains } = useCaptains();
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Helper function to check if a date is expired
  const isExpired = (date: string) => {
    if (!date || date === 'N/A') return false;
    return new Date(date) < new Date();
  };

  // Helper function to check if a date is expiring soon (within 90 days)
  const isExpiringSoon = (date: string, days: number = 90) => {
    if (!date || date === 'N/A') return false;
    const expiry = new Date(date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= days;
  };

  // Calculate expired documents count
  const getExpiredDocumentsCount = () => {
    let count = 0;
    captains.forEach(captain => {
      Object.values(captain.expiryDates || {}).forEach(date => {
        if (isExpired(date)) {
          count++;
        }
      });
    });
    return count;
  };

  // Calculate expiring soon documents count
  const getExpiringSoonDocumentsCount = () => {
    let count = 0;
    captains.forEach(captain => {
      Object.values(captain.expiryDates || {}).forEach(date => {
        if (isExpiringSoon(date) && !isExpired(date)) {
          count++;
        }
      });
    });
    return count;
  };

  const handleStatClick = (statType: string, modalType?: string) => {
    if (modalType) {
      setOpenModal(modalType);
      setSearchTerm('');
    } else if (statType === 'Onboard' || statType === 'Available') {
      setOpenModal(statType.toLowerCase());
      setSearchTerm('');
    }
  };

  // Get employees by status
  const getEmployeesByStatus = useMemo(() => {
    return (status: string) => {
      return captains.filter(c => c.status === status);
    };
  }, [captains]);

  // Filter employees by search
  const getFilteredEmployees = (employees: typeof captains) => {
    if (!searchTerm) return employees;
    const lowerSearch = searchTerm.toLowerCase();
    return employees.filter(emp =>
      emp.fullName.toLowerCase().includes(lowerSearch) ||
      emp.location.toLowerCase().includes(lowerSearch) ||
      emp.title.toLowerCase().includes(lowerSearch) ||
      emp.email.toLowerCase().includes(lowerSearch)
    );
  };

  // Get expired documents with captain info
  const getExpiredDocuments = useMemo(() => {
    const expired: Array<{
      captain: typeof captains[0];
      documentType: string;
      expiryDate: string;
      expiryDateKey: string;
      documentKey: string;
    }> = [];

    captains.forEach(captain => {
      Object.entries(captain.expiryDates || {}).forEach(([key, date]) => {
        if (isExpired(date)) {
          // Find document type label
          const docTypeMap: Record<string, string> = {
            passportExpiryDate: 'Passport',
            visaExpiryDate: 'Visa Document',
            cocExpiryDate: 'Certificate of Competency (CoC)',
            flagStateEndorsementExpiryDate: 'Flag State Endorsement',
            medicalCertificateExpiryDate: 'Medical Certificate (ENG1)',
            stcwTrainingExpiryDate: 'STCW Training',
          };
          
          expired.push({
            captain,
            documentType: docTypeMap[key] || key,
            expiryDate: date,
            expiryDateKey: key,
            documentKey: key.replace('ExpiryDate', '').replace('expiryDate', ''),
          });
        }
      });
    });

    return expired;
  }, [captains]);

  // Get expiring soon documents with captain info
  const getExpiringSoonDocuments = useMemo(() => {
    const expiring: Array<{
      captain: typeof captains[0];
      documentType: string;
      expiryDate: string;
      expiryDateKey: string;
      documentKey: string;
      daysUntilExpiry: number;
    }> = [];

    captains.forEach(captain => {
      Object.entries(captain.expiryDates || {}).forEach(([key, date]) => {
        if (isExpiringSoon(date) && !isExpired(date)) {
          const expiry = new Date(date);
          const today = new Date();
          const diffTime = expiry.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const docTypeMap: Record<string, { label: string; docKey: string }> = {
            passportExpiryDate: { label: 'Passport', docKey: 'passportScan' },
            visaExpiryDate: { label: 'Visa Document', docKey: 'visaDocument' },
            cocExpiryDate: { label: 'Certificate of Competency (CoC)', docKey: 'certificateOfCompetency' },
            flagStateEndorsementExpiryDate: { label: 'Flag State Endorsement', docKey: 'flagStateEndorsement' },
            medicalCertificateExpiryDate: { label: 'Medical Certificate (ENG1)', docKey: 'medicalCertificateENG1' },
            stcwTrainingExpiryDate: { label: 'STCW Training', docKey: 'stcwTrainingExpiryDate' },
          };
          
          const docInfo = docTypeMap[key] || { label: key, docKey: key };
          expiring.push({
            captain,
            documentType: docInfo.label,
            expiryDate: date,
            expiryDateKey: key,
            documentKey: docInfo.docKey,
            daysUntilExpiry: diffDays,
          });
        }
      });
    });

    return expiring;
  }, [captains]);

  const handleDocumentUpload = (captainId: string, docKey: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const objectUrl = URL.createObjectURL(file);
        const captainIndex = captains.findIndex(c => c.id === captainId);
        if (captainIndex !== -1) {
          const updatedCaptains = [...captains];
          updatedCaptains[captainIndex] = {
            ...updatedCaptains[captainIndex],
            documents: {
              ...updatedCaptains[captainIndex].documents,
              [docKey]: objectUrl,
            },
          };
          localStorage.setItem('captains', JSON.stringify(updatedCaptains));
          window.location.reload();
        }
      }
    };
    input.click();
  };

  const formatDate = (date: string) => {
    if (!date || date === 'N/A') return date;
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Filter expired documents by search
  const filteredExpiredDocs = useMemo(() => {
    if (!searchTerm) return getExpiredDocuments;
    const lowerSearch = searchTerm.toLowerCase();
    return getExpiredDocuments.filter(item =>
      item.captain.fullName.toLowerCase().includes(lowerSearch) ||
      item.documentType.toLowerCase().includes(lowerSearch) ||
      item.captain.location.toLowerCase().includes(lowerSearch)
    );
  }, [getExpiredDocuments, searchTerm]);

  // Filter expiring soon documents by search
  const filteredExpiringSoonDocs = useMemo(() => {
    if (!searchTerm) return getExpiringSoonDocuments;
    const lowerSearch = searchTerm.toLowerCase();
    return getExpiringSoonDocuments.filter(item =>
      item.captain.fullName.toLowerCase().includes(lowerSearch) ||
      item.documentType.toLowerCase().includes(lowerSearch) ||
      item.captain.location.toLowerCase().includes(lowerSearch)
    );
  }, [getExpiringSoonDocuments, searchTerm]);

  const stats = [
    { 
      label: 'Total Employees', 
      value: captains.length, 
      icon: Users,
      color: 'from-navy-500 to-navy-600',
      filterType: null,
      onClick: () => navigate('/employees')
    },
    { 
      label: 'Onboard', 
      value: captains.filter(c => c.status === 'Onboard').length, 
      icon: Ship,
      color: 'from-blue-500 to-blue-600',
      filterType: 'Onboard',
      onClick: () => handleStatClick('Onboard', 'onboard')
    },
    { 
      label: 'Available', 
      value: captains.filter(c => c.status === 'Available').length, 
      icon: Users,
      color: 'from-emerald-500 to-emerald-600',
      filterType: 'Available',
      onClick: () => handleStatClick('Available', 'available')
    },
    { 
      label: 'Expiring Soon', 
      value: getExpiringSoonDocumentsCount(), 
      icon: AlertCircle,
      color: 'from-amber-500 to-amber-600',
      filterType: null,
      onClick: () => handleStatClick('', 'expiring-soon')
    },
    { 
      label: 'Expired Docs', 
      value: getExpiredDocumentsCount(), 
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      filterType: null,
      onClick: () => handleStatClick('', 'expired')
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
          Employee Management
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Manage your crew and track their information
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.button
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={stat.onClick}
              className="glass rounded-xl p-4 sm:p-6 shadow-lg relative overflow-hidden group cursor-pointer w-full text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">{stat.value}</p>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">{stat.label}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Employee Table */}
      <div className="employee-table-container">
        <EmployeeTable employees={captains} />
      </div>

      {/* Expired Documents Modal */}
      <Dialog open={openModal === 'expired'} onOpenChange={(open) => {
        if (!open) {
          setOpenModal(null);
          setSearchTerm('');
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Expired Documents ({getExpiredDocuments.length})
            </DialogTitle>
            <DialogDescription>
              Documents that have expired. Click to update or view details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search by captain name, document type, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredExpiredDocs.length > 0 ? (
                filteredExpiredDocs.map((item, index) => {
                  const docUrl = item.captain.documents[item.documentKey as keyof typeof item.captain.documents];
                  return (
                    <motion.div
                      key={`${item.captain.id}-${item.expiryDateKey}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <img
                          src={item.captain.avatarUrl}
                          alt={item.captain.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <Link to={`/profile/${item.captain.id}`} className="block">
                            <h4 className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                              {item.captain.fullName}
                            </h4>
                            <p className="text-sm text-slate-600">{item.captain.title} • {item.captain.location}</p>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <FileText className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-600">{item.documentType}</span>
                            <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                              Expired: {formatDate(item.expiryDate)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {docUrl ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => window.open(docUrl, '_blank')}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              const link = document.createElement('a');
                              link.href = docUrl;
                              link.download = `${item.documentType}-${item.captain.fullName}`;
                              link.click();
                            }}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentUpload(item.captain.id, item.documentKey)}
                          className="gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {docUrl ? 'Replace' : 'Upload'}
                        </Button>
                        <Link to={`/profile/${item.captain.id}`}>
                          <Button variant="outline" size="sm">View Profile</Button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchTerm ? 'No expired documents found matching your search' : 'No expired documents'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Expiring Soon Documents Modal */}
      <Dialog open={openModal === 'expiring-soon'} onOpenChange={(open) => {
        if (!open) {
          setOpenModal(null);
          setSearchTerm('');
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Expiring Soon Documents ({getExpiringSoonDocuments.length})
            </DialogTitle>
            <DialogDescription>
              Documents expiring within 90 days. Click to update or view details.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search by captain name, document type, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredExpiringSoonDocs.length > 0 ? (
                filteredExpiringSoonDocs.map((item, index) => {
                  const docUrl = item.captain.documents[item.documentKey as keyof typeof item.captain.documents];
                  return (
                    <motion.div
                      key={`${item.captain.id}-${item.expiryDateKey}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 border border-amber-200 rounded-lg bg-amber-50/50 hover:bg-amber-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <img
                          src={item.captain.avatarUrl}
                          alt={item.captain.fullName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="flex-1 min-w-0">
                          <Link to={`/profile/${item.captain.id}`} className="block">
                            <h4 className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                              {item.captain.fullName}
                            </h4>
                            <p className="text-sm text-slate-600">{item.captain.title} • {item.captain.location}</p>
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <FileText className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-600">{item.documentType}</span>
                            <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                              Expires: {formatDate(item.expiryDate)} ({item.daysUntilExpiry} days)
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {docUrl ? (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => window.open(docUrl, '_blank')}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => {
                              const link = document.createElement('a');
                              link.href = docUrl;
                              link.download = `${item.documentType}-${item.captain.fullName}`;
                              link.click();
                            }}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDocumentUpload(item.captain.id, item.documentKey)}
                          className="gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {docUrl ? 'Replace' : 'Upload'}
                        </Button>
                        <Link to={`/profile/${item.captain.id}`}>
                          <Button variant="outline" size="sm">View Profile</Button>
                        </Link>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchTerm ? 'No expiring documents found matching your search' : 'No documents expiring soon'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboard Employees Modal */}
      <Dialog open={openModal === 'onboard'} onOpenChange={(open) => {
        if (!open) {
          setOpenModal(null);
          setSearchTerm('');
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-600" />
              Onboard Employees ({getEmployeesByStatus('Onboard').length})
            </DialogTitle>
            <DialogDescription>
              Employees currently onboard vessels.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search by name, location, title, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {getFilteredEmployees(getEmployeesByStatus('Onboard')).length > 0 ? (
                getFilteredEmployees(getEmployeesByStatus('Onboard')).map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        src={employee.avatarUrl}
                        alt={employee.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${employee.id}`} className="block">
                          <h4 className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                            {employee.fullName}
                          </h4>
                          <p className="text-sm text-slate-600">{employee.title} • {employee.location}</p>
                          <p className="text-xs text-slate-500">{employee.email}</p>
                        </Link>
                      </div>
                    </div>
                    <Link to={`/profile/${employee.id}`}>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchTerm ? 'No onboard employees found matching your search' : 'No employees currently onboard'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Available Employees Modal */}
      <Dialog open={openModal === 'available'} onOpenChange={(open) => {
        if (!open) {
          setOpenModal(null);
          setSearchTerm('');
        }
      }}>
        <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              Available Employees ({getEmployeesByStatus('Available').length})
            </DialogTitle>
            <DialogDescription>
              Employees available for assignment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Input
              placeholder="Search by name, location, title, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {getFilteredEmployees(getEmployeesByStatus('Available')).length > 0 ? (
                getFilteredEmployees(getEmployeesByStatus('Available')).map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 border border-emerald-200 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        src={employee.avatarUrl}
                        alt={employee.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="flex-1 min-w-0">
                        <Link to={`/profile/${employee.id}`} className="block">
                          <h4 className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors">
                            {employee.fullName}
                          </h4>
                          <p className="text-sm text-slate-600">{employee.title} • {employee.location}</p>
                          <p className="text-xs text-slate-500">{employee.email}</p>
                        </Link>
                      </div>
                    </div>
                    <Link to={`/profile/${employee.id}`}>
                      <Button variant="outline" size="sm">View Profile</Button>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">
                    {searchTerm ? 'No available employees found matching your search' : 'No employees currently available'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
