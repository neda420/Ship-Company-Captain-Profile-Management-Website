import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationHistory } from '../hooks/useNavigationHistory';
import { 
  FileText, 
  Camera, 
  Upload, 
  Search, 
  User, 
  Download, 
  Eye,
  AlertTriangle,
  AlertCircle,
  Star,
  Filter,
  ArrowRight,
  Calendar,
  Clock,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { useCaptains } from '../context/CaptainsContext';
import { uploadFile } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { cn } from '../lib/utils';

// Document types list (same as Profile page)
interface DocumentType {
  label: string;
  key: keyof CaptainProfile['documents'];
  expiryDateKey?: keyof CaptainProfile['expiryDates'];
  isImportant?: boolean;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { label: 'Passport Scan', key: 'passportScan', expiryDateKey: 'passportExpiryDate', isImportant: true },
  { label: 'Visa Document', key: 'visaDocument', expiryDateKey: 'visaExpiryDate' },
  { label: 'Passport Photo', key: 'passportPhoto', isImportant: true },
  { label: 'Certificate of Competency (CoC)', key: 'certificateOfCompetency', expiryDateKey: 'cocExpiryDate', isImportant: true },
  { label: 'Flag State Endorsement', key: 'flagStateEndorsement', expiryDateKey: 'flagStateEndorsementExpiryDate', isImportant: true },
  { label: 'GMDSS Certificate', key: 'gmdssCertificate', isImportant: true },
  { label: 'Basic Safety Training Certificate', key: 'basicSafetyTrainingCertificate' },
  { label: 'Advanced Fire Fighting Certificate', key: 'advancedFireFightingCertificate' },
  { label: 'Medical Care Onboard Certificate', key: 'medicalCareOnboardCertificate' },
  { label: 'Ship Security Officer Certificate', key: 'shipSecurityOfficerCertificate' },
  { label: 'ECDIS Certificate', key: 'ecdisCertificate', isImportant: true },
  { label: 'Bridge Resource Management Certificate', key: 'bridgeResourceManagementCertificate' },
  { label: 'Medical Certificate (ENG1)', key: 'medicalCertificateENG1', expiryDateKey: 'medicalCertificateExpiryDate', isImportant: true },
  { label: 'Drug & Alcohol Test Results', key: 'drugAlcoholTestResults' },
  { label: 'Vaccination Record', key: 'vaccinationRecord' },
  { label: "Seaman's Discharge Book Scans", key: 'seamanDischargeBookScans' },
  { label: 'Reference Letters', key: 'referenceLetters' },
  { label: 'Current CV / Resume', key: 'currentCVResume', isImportant: true },
  { label: 'Employment Contract (SEA)', key: 'employmentContractSEA', isImportant: true },
  { label: 'Signed Code of Conduct', key: 'signedCodeOfConduct' },
  { label: 'Signed NDA', key: 'signedNDA' },
];

const Documents = () => {
  const { goBack, canGoBack } = useNavigationHistory();
  const { captains, updateCaptain, reloadCaptains } = useCaptains();
  const { showSuccess, showError } = useToast();
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentTypeSearch, setDocumentTypeSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'important' | 'with_expiry'>('all');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, Record<string, { file: File; url: string }>>>({});

  const formatDate = (date: string) => {
    if (!date || date === 'N/A') return date;
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isExpiringSoon = (date: string, days: number = 90) => {
    if (!date || date === 'N/A') return false;
    const expiry = new Date(date);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays > 0 && diffDays <= days;
  };

  const isExpired = (date: string) => {
    if (!date || date === 'N/A') return false;
    return new Date(date) < new Date();
  };

  const handleDocumentUpload = async (captainId: string, docTypeKey: string, file: File) => {
    const objectUrl = URL.createObjectURL(file);

    setUploadedFiles(prev => ({
      ...prev,
      [captainId]: {
        ...prev[captainId],
        [docTypeKey]: { file, url: objectUrl }
      }
    }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('docKey', docTypeKey);
      const res = await uploadFile<{ fileUrl: string }>(`/captains/${captainId}/documents`, formData);

      // Reload captains to get updated documents from database
      await reloadCaptains();
      
      // Clean up object URL
      URL.revokeObjectURL(objectUrl);
      
      // Show success notification
      const docType = DOCUMENT_TYPES.find(d => d.key === docTypeKey);
      const captain = captains.find(c => c.id === captainId);
      if (docType && captain) {
        showSuccess(`${docType.label} uploaded successfully for ${captain.fullName}!`);
      } else {
        showSuccess('Document uploaded successfully!');
      }
    } catch (err: any) {
      console.error('Failed to upload document', err);
      // Clean up object URL on error
      URL.revokeObjectURL(objectUrl);
      const errorMessage = err?.details?.sqlMessage || err?.details?.error || err?.message || 'Failed to upload document. Please try again.';
      showError(errorMessage);
    }
  };

  const handleDocumentReplace = (captainId: string, docTypeKey: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const oldFile = uploadedFiles[captainId]?.[docTypeKey];
        if (oldFile?.url) {
          URL.revokeObjectURL(oldFile.url);
        }
        handleDocumentUpload(captainId, docTypeKey, file);
      }
    };
    input.click();
  };

  // Get all captains with a specific document type
  const getCaptainsWithDocument = (docType: DocumentType) => {
    return captains.map(captain => {
      const fileUrl = captain.documents[docType.key];
      const expiryDate = docType.expiryDateKey ? captain.expiryDates[docType.expiryDateKey] : null;
      
      return {
        captain,
        fileUrl,
        expiryDate,
        hasDocument: !!fileUrl,
        isExpired: expiryDate ? isExpired(expiryDate) : false,
        isExpiringSoon: expiryDate ? isExpiringSoon(expiryDate) : false,
      };
    });
  };

  // Filter document types
  const filteredDocumentTypes = useMemo(() => {
    let types = DOCUMENT_TYPES;

    // Filter by category
    if (filterCategory === 'important') {
      types = types.filter(t => t.isImportant);
    } else if (filterCategory === 'with_expiry') {
      types = types.filter(t => t.expiryDateKey);
    }

    // Filter by search term
    if (documentTypeSearch) {
      types = types.filter(t =>
        t.label.toLowerCase().includes(documentTypeSearch.toLowerCase())
      );
    }

    // Sort by label alphabetically
    types.sort((a, b) => a.label.localeCompare(b.label));

    return types;
  }, [filterCategory, documentTypeSearch]);

  // Filter captains when a document type is selected
  const filteredCaptains = useMemo(() => {
    if (!selectedDocumentType) return [];

    const captains = getCaptainsWithDocument(selectedDocumentType);

    let filtered = captains;
    if (searchTerm) {
      filtered = captains.filter(item =>
        item.captain.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.captain.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.captain.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by captain name alphabetically
    filtered.sort((a, b) => a.captain.fullName.localeCompare(b.captain.fullName));

    return filtered;
  }, [selectedDocumentType, searchTerm]);

  // Count documents by type
  const getDocumentCounts = () => {
    const counts: Record<string, { total: number; uploaded: number }> = {};

    DOCUMENT_TYPES.forEach(docType => {
      const captains = getCaptainsWithDocument(docType);
      counts[docType.label] = {
        total: captains.length,
        uploaded: captains.filter(c => c.hasDocument).length,
      };
    });

    return counts;
  };

  const documentCounts = getDocumentCounts();

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-4 sm:space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
              All Documents
            </h1>
            <p className="text-sm sm:text-base text-slate-600">
              View and manage all captains' documents by type
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button 
              className="gap-2 bg-emerald-500 hover:bg-emerald-600 w-full sm:w-auto" 
              size="sm"
            >
              <Camera className="w-4 h-4" />
              Scan Document
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 w-full sm:w-auto" 
              size="sm"
            >
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        </div>

        {!selectedDocumentType ? (
          /* Document Types Grid */
          <>
            {/* Search and Filter Section */}
            <div className="glass rounded-xl p-4 sm:p-6 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search document types by name..."
                  value={documentTypeSearch}
                  onChange={(e) => setDocumentTypeSearch(e.target.value)}
                  className="pl-10"
                />
                {documentTypeSearch && (
                  <button
                    onClick={() => setDocumentTypeSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-5 h-5 text-slate-600 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700">Filter:</span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={filterCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory('all')}
                    className="text-xs sm:text-sm"
                  >
                    All Documents ({filteredDocumentTypes.length})
                  </Button>
                  <Button
                    variant={filterCategory === 'important' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory('important')}
                    className="text-xs sm:text-sm text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Important ({DOCUMENT_TYPES.filter(t => t.isImportant).length})
                  </Button>
                  <Button
                    variant={filterCategory === 'with_expiry' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterCategory('with_expiry')}
                    className="text-xs sm:text-sm"
                  >
                    <Clock className="w-3 h-3 mr-1" />
                    With Expiry Dates ({DOCUMENT_TYPES.filter(t => t.expiryDateKey).length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Types Grid */}
            {filteredDocumentTypes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {filteredDocumentTypes.map((docType, index) => {
                const count = documentCounts[docType.label];
                const uploadedCount = count.uploaded;
                const totalCount = count.total;
                const percentage = totalCount > 0 ? Math.round((uploadedCount / totalCount) * 100) : 0;

                return (
                  <motion.button
                    key={docType.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                    onClick={() => setSelectedDocumentType(docType)}
                    className="glass rounded-xl p-4 sm:p-5 text-left hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                        docType.isImportant ? "bg-emerald-100" : "bg-slate-100"
                      )}>
                        <FileText className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6",
                          docType.isImportant ? "text-emerald-600" : "text-slate-600"
                        )} />
                      </div>
                      {docType.isImportant && (
                        <Star className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
                      {docType.label}
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Uploaded</span>
                        <span className="font-semibold text-slate-900">
                          {uploadedCount} / {totalCount}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all",
                            percentage === 100 ? "bg-emerald-500" : 
                            percentage >= 50 ? "bg-blue-500" : 
                            "bg-orange-500"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>View all</span>
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.button>
                );
              })}
              </div>
            ) : (
              <div className="glass rounded-xl p-12 text-center">
                <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-2">No document types found</p>
                <p className="text-sm text-slate-400 mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDocumentTypeSearch('');
                    setFilterCategory('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        ) : (
          /* Captains List for Selected Document Type */
          <div className="space-y-4 sm:space-y-6">
            {/* Back Button and Header */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDocumentType(null);
                  setSearchTerm('');
                }}
                className="gap-2"
              >
                <ArrowRight className="w-4 h-4 rotate-180" />
                Back to Document Types
              </Button>
            </div>

            <div className="glass rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">
                    {selectedDocumentType.label}
                  </h2>
                  <p className="text-sm text-slate-600">
                    View all captains with this document type
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDocumentType.isImportant && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      <Star className="w-3 h-3 mr-1" />
                      Important
                    </Badge>
                  )}
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Search by captain name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Captains List */}
              <div className="space-y-3">
                {filteredCaptains.length > 0 ? (
                  filteredCaptains.map((item, index) => (
                    <motion.div
                      key={item.captain.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Link
                          to={`/profile/${item.captain.id}`}
                          className="flex-shrink-0"
                        >
                          <img
                            src={item.captain.avatarUrl}
                            alt={item.captain.fullName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm hover:scale-105 transition-transform"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/profile/${item.captain.id}`}
                            className="block"
                          >
                            <h3 className="font-semibold text-slate-900 hover:text-emerald-600 transition-colors truncate">
                              {item.captain.fullName}
                            </h3>
                            <p className="text-sm text-slate-500 truncate">
                              {item.captain.title} • {item.captain.location}
                            </p>
                          </Link>
                          {item.expiryDate && item.expiryDate !== 'N/A' && (
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className={cn(
                                "w-3 h-3",
                                item.isExpired && "text-red-600",
                                item.isExpiringSoon && "text-orange-600",
                                !item.isExpired && !item.isExpiringSoon && "text-slate-400"
                              )} />
                              <span className={cn(
                                "text-xs font-medium",
                                item.isExpired && "text-red-600",
                                item.isExpiringSoon && "text-orange-600",
                                !item.isExpired && !item.isExpiringSoon && "text-slate-500"
                              )}>
                                Expires: {formatDate(item.expiryDate)}
                              </span>
                              {item.isExpired && (
                                <Badge variant="outline" className="text-red-600 border-red-300 text-[10px]">
                                  Expired
                                </Badge>
                              )}
                              {item.isExpiringSoon && !item.isExpired && (
                                <Badge variant="outline" className="text-orange-600 border-orange-300 text-[10px]">
                                  Expiring Soon
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {item.hasDocument || uploadedFiles[item.captain.id]?.[selectedDocumentType?.key || ''] ? (
                          <>
                            <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">
                              Uploaded
                            </Badge>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const fileUrl = uploadedFiles[item.captain.id]?.[selectedDocumentType?.key || '']?.url || item.fileUrl;
                                if (fileUrl) window.open(fileUrl, '_blank');
                              }}
                              title="View Document"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              onClick={() => {
                                const fileUrl = uploadedFiles[item.captain.id]?.[selectedDocumentType?.key || '']?.url || item.fileUrl;
                                if (fileUrl) {
                                  const link = document.createElement('a');
                                  link.href = fileUrl;
                                  link.download = `${item.captain.fullName}-${selectedDocumentType?.label || 'document'}`;
                                  link.click();
                                }
                              }}
                              title="Download Document"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => selectedDocumentType && handleDocumentReplace(item.captain.id, selectedDocumentType.key)}
                              title="Replace Document"
                            >
                              <Upload className="w-4 h-4" />
                              <span className="hidden sm:inline">Replace</span>
                            </Button>
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="text-slate-500">
                              Not Uploaded
                            </Badge>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => selectedDocumentType && handleDocumentReplace(item.captain.id, selectedDocumentType.key)}
                            >
                              <Upload className="w-4 h-4" />
                              <span className="hidden sm:inline">Upload</span>
                            </Button>
                          </>
                        )}
                        <Link to={`/profile/${item.captain.id}`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            View Profile
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 mb-2">No captains found</p>
                    {searchTerm && (
                      <p className="text-sm text-slate-400">
                        Try adjusting your search terms
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Documents;
