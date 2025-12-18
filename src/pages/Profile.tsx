import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationHistory } from '../hooks/useNavigationHistory';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  FileText, 
  Edit2,
  Camera,
  Upload,
  Save,
  X,
  Calendar,
  MapPin,
  User,
  Briefcase,
  Heart,
  Clock,
  FileCheck,
  Download,
  Eye,
  Search,
  AlertTriangle,
  AlertCircle,
  Star,
  Filter
} from 'lucide-react';
import { useCaptains } from '../context/CaptainsContext';
import type { CaptainProfile } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';

// Document categories
type DocumentCategory = 'expiring' | 'soon_expired' | 'important' | 'other';

interface DocumentItem {
  label: string;
  key: keyof CaptainProfile['documents'];
  category: DocumentCategory;
  expiryDateKey?: keyof CaptainProfile['expiryDates'];
  isImportant?: boolean;
}

const DOCUMENT_LIST: DocumentItem[] = [
  { label: 'Passport Scan', key: 'passportScan', category: 'important', expiryDateKey: 'passportExpiryDate', isImportant: true },
  { label: 'Visa Document', key: 'visaDocument', category: 'other', expiryDateKey: 'visaExpiryDate' },
  { label: 'Passport Photo', key: 'passportPhoto', category: 'important', isImportant: true },
  { label: 'Certificate of Competency (CoC)', key: 'certificateOfCompetency', category: 'important', expiryDateKey: 'cocExpiryDate', isImportant: true },
  { label: 'Flag State Endorsement', key: 'flagStateEndorsement', category: 'important', expiryDateKey: 'flagStateEndorsementExpiryDate', isImportant: true },
  { label: 'GMDSS Certificate', key: 'gmdssCertificate', category: 'important', isImportant: true },
  { label: 'Basic Safety Training Certificate', key: 'basicSafetyTrainingCertificate', category: 'other' },
  { label: 'Advanced Fire Fighting Certificate', key: 'advancedFireFightingCertificate', category: 'other' },
  { label: 'Medical Care Onboard Certificate', key: 'medicalCareOnboardCertificate', category: 'other' },
  { label: 'Ship Security Officer Certificate', key: 'shipSecurityOfficerCertificate', category: 'other' },
  { label: 'ECDIS Certificate', key: 'ecdisCertificate', category: 'important', isImportant: true },
  { label: 'Bridge Resource Management Certificate', key: 'bridgeResourceManagementCertificate', category: 'other' },
  { label: 'Medical Certificate (ENG1)', key: 'medicalCertificateENG1', category: 'important', expiryDateKey: 'medicalCertificateExpiryDate', isImportant: true },
  { label: 'Drug & Alcohol Test Results', key: 'drugAlcoholTestResults', category: 'other' },
  { label: 'Vaccination Record', key: 'vaccinationRecord', category: 'other' },
  { label: "Seaman's Discharge Book Scans", key: 'seamanDischargeBookScans', category: 'other' },
  { label: 'Reference Letters', key: 'referenceLetters', category: 'other' },
  { label: 'Current CV / Resume', key: 'currentCVResume', category: 'important', isImportant: true },
  { label: 'Employment Contract (SEA)', key: 'employmentContractSEA', category: 'important', isImportant: true },
  { label: 'Signed Code of Conduct', key: 'signedCodeOfConduct', category: 'other' },
  { label: 'Signed NDA', key: 'signedNDA', category: 'other' },
];

const Profile = () => {
  const { id } = useParams();
  const { goBack, canGoBack } = useNavigationHistory();
  const { captains, updateCaptain } = useCaptains();
  const profileIndex = captains.findIndex(c => c.id === id);
  const profile = profileIndex !== -1 ? captains[profileIndex] : null;
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { file: File; url: string }>>({});
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUploadFiles, setBulkUploadFiles] = useState<File[]>([]);
  const [fileMappings, setFileMappings] = useState<Record<string, string>>({});

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Employee not found</p>
      </div>
    );
  }

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20, filter: 'blur(4px)' },
    visible: { 
      opacity: 1, 
      x: 0, 
      filter: 'blur(0)',
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      x: -20, 
      filter: 'blur(4px)',
      transition: { duration: 0.2 }
    }
  };

  const formatDate = (date: string) => {
    if (!date || date === 'N/A') return date;
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
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

  const getDocumentCategory = (doc: DocumentItem): DocumentCategory => {
    // Check if expired
    if (doc.expiryDateKey && profile.expiryDates[doc.expiryDateKey]) {
      const expiryDate = profile.expiryDates[doc.expiryDateKey];
      if (isExpired(expiryDate)) {
        return 'expiring';
      }
      if (isExpiringSoon(expiryDate, 90)) {
        return 'soon_expired';
      }
    }
    
    // Check if important
    if (doc.isImportant) {
      return 'important';
    }
    
    return 'other';
  };

  const categorizedDocuments = useMemo(() => {
    const categorized: Record<DocumentCategory, DocumentItem[]> = {
      expiring: [],
      soon_expired: [],
      important: [],
      other: [],
    };

    DOCUMENT_LIST.forEach(doc => {
      const category = getDocumentCategory(doc);
      categorized[category].push(doc);
    });

    return categorized;
  }, [profile]);

  const filteredDocuments = useMemo(() => {
    let docs = DOCUMENT_LIST;

    // Filter by search term
    if (searchTerm) {
      docs = docs.filter(doc => 
        doc.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      docs = docs.filter(doc => getDocumentCategory(doc) === selectedCategory);
    }

    // Sort documents by name/label alphabetically
    docs.sort((a, b) => a.label.localeCompare(b.label));

    return docs;
  }, [searchTerm, selectedCategory, profile]);

  const FieldDisplay = ({ label, value, icon: Icon, isExpiring }: { 
    label: string; 
    value: string | boolean | undefined; 
    icon?: any;
    isExpiring?: boolean;
  }) => (
    <div className="space-y-1">
      <label className="text-xs sm:text-sm font-medium text-slate-500 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {isEditMode ? (
        <Input 
          defaultValue={String(value || '')}
          type={typeof value === 'boolean' ? 'checkbox' : 'text'}
          className={cn(
            "text-sm sm:text-base",
            isExpiring && "border-red-300 focus:ring-red-500"
          )}
        />
      ) : (
        <p className={cn(
          "text-sm sm:text-base font-medium text-slate-900",
          isExpiring && "text-red-600 font-semibold"
        )}>
          {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || 'N/A')}
        </p>
      )}
    </div>
  );

  const handleDocumentUpload = (docKey: keyof typeof profile.documents, file: File) => {
    // Create object URL for preview
    const objectUrl = URL.createObjectURL(file);
    
    // Store the file in state for immediate UI update
    setUploadedFiles(prev => ({
      ...prev,
      [docKey]: { file, url: objectUrl }
    }));

    // Update the profile's documents
    if (profile && id) {
      updateCaptain(id, {
        documents: {
          ...profile.documents,
          [docKey]: objectUrl,
        },
      });
    }
  };

  const handleDocumentReplace = (docKey: keyof typeof profile.documents) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Revoke old URL if exists
        const oldFile = uploadedFiles[docKey];
        if (oldFile?.url) {
          URL.revokeObjectURL(oldFile.url);
        }
        handleDocumentUpload(docKey, file);
      }
    };
    input.click();
  };

  // Match filename to document type based on keywords
  const matchFileToDocumentType = (fileName: string): string | null => {
    const lowerName = fileName.toLowerCase();
    
    // Create a mapping of keywords to document keys
    const keywordMap: Record<string, string> = {
      'passport': 'passportScan',
      'visa': 'visaDocument',
      'photo': 'passportPhoto',
      'coc': 'certificateOfCompetency',
      'certificate of competency': 'certificateOfCompetency',
      'flag state': 'flagStateEndorsement',
      'flag': 'flagStateEndorsement',
      'gmdss': 'gmdssCertificate',
      'basic safety': 'basicSafetyTrainingCertificate',
      'bst': 'basicSafetyTrainingCertificate',
      'fire fighting': 'advancedFireFightingCertificate',
      'aff': 'advancedFireFightingCertificate',
      'medical care': 'medicalCareOnboardCertificate',
      'security officer': 'shipSecurityOfficerCertificate',
      'sso': 'shipSecurityOfficerCertificate',
      'ecdis': 'ecdisCertificate',
      'bridge resource': 'bridgeResourceManagementCertificate',
      'brm': 'bridgeResourceManagementCertificate',
      'eng1': 'medicalCertificateENG1',
      'medical certificate': 'medicalCertificateENG1',
      'drug': 'drugAlcoholTestResults',
      'alcohol': 'drugAlcoholTestResults',
      'vaccination': 'vaccinationRecord',
      'discharge': 'seamanDischargeBookScans',
      'seaman': 'seamanDischargeBookScans',
      'reference': 'referenceLetters',
      'cv': 'currentCVResume',
      'resume': 'currentCVResume',
      'contract': 'employmentContractSEA',
      'sea': 'employmentContractSEA',
      'code of conduct': 'signedCodeOfConduct',
      'nda': 'signedNDA',
    };

    // Try to match filename with keywords
    for (const [keyword, docKey] of Object.entries(keywordMap)) {
      if (lowerName.includes(keyword)) {
        return docKey;
      }
    }

    return null;
  };

  const handleBulkUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        setBulkUploadFiles(files);
        
        // Auto-match files to document types
        const mappings: Record<string, string> = {};
        files.forEach((file) => {
          const matchedKey = matchFileToDocumentType(file.name);
          if (matchedKey) {
            mappings[file.name] = matchedKey;
          } else {
            // If no match, use first available document type or let user choose
            mappings[file.name] = '';
          }
        });
        setFileMappings(mappings);
        setIsBulkUploadOpen(true);
      }
    };
    input.click();
  };

  const handleBulkUploadConfirm = () => {
    bulkUploadFiles.forEach((file) => {
      const docKey = fileMappings[file.name] as keyof typeof profile.documents;
      if (docKey && DOCUMENT_LIST.find(d => d.key === docKey)) {
        // Revoke old URL if exists
        const oldFile = uploadedFiles[docKey];
        if (oldFile?.url) {
          URL.revokeObjectURL(oldFile.url);
        }
        handleDocumentUpload(docKey, file);
      }
    });
    
    setBulkUploadFiles([]);
    setFileMappings({});
    setIsBulkUploadOpen(false);
  };

  const DocumentItem = ({ doc }: { doc: DocumentItem }) => {
    const existingFileUrl = profile.documents[doc.key];
    const uploadedFile = uploadedFiles[doc.key];
    const fileUrl = uploadedFile?.url || existingFileUrl;
    const category = getDocumentCategory(doc);
    const expiryDateKey = doc.expiryDateKey;
    const expiryDate = expiryDateKey ? profile.expiryDates[expiryDateKey] : null;
    const isExpiredDoc = expiryDate ? isExpired(expiryDate) : false;
    const isSoonExpired = expiryDate ? isExpiringSoon(expiryDate, 90) : false;

    const getCategoryBadge = () => {
      if (isExpiredDoc) {
        return <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50">Expired</Badge>;
      }
      if (isSoonExpired) {
        return <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">Expiring Soon</Badge>;
      }
      if (category === 'important') {
        return <Badge variant="outline" className="text-emerald-600 border-emerald-300 bg-emerald-50">Important</Badge>;
      }
      return null;
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-slate-200 hover:bg-slate-50 hover:shadow-sm transition-all"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            isExpiredDoc && "bg-red-100",
            isSoonExpired && "bg-orange-100",
            category === 'important' && !isExpiredDoc && !isSoonExpired && "bg-emerald-100",
            !isExpiredDoc && !isSoonExpired && category !== 'important' && "bg-slate-100"
          )}>
            <FileText className={cn(
              "w-5 h-5",
              isExpiredDoc && "text-red-600",
              isSoonExpired && "text-orange-600",
              category === 'important' && !isExpiredDoc && !isSoonExpired && "text-emerald-600",
              !isExpiredDoc && !isSoonExpired && category !== 'important' && "text-slate-600"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-900 truncate">{doc.label}</span>
              {getCategoryBadge()}
            </div>
            {expiryDate && expiryDate !== 'N/A' && (
              <p className={cn(
                "text-xs",
                isExpiredDoc && "text-red-600 font-semibold",
                isSoonExpired && "text-orange-600",
                !isExpiredDoc && !isSoonExpired && "text-slate-500"
              )}>
                Expires: {formatDate(expiryDate)}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {fileUrl ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => window.open(fileUrl, '_blank')}
                title="View Document"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = fileUrl;
                  link.download = doc.label;
                  link.click();
                }}
                title="Download Document"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => handleDocumentReplace(doc.key)}
                title="Replace Document"
              >
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Replace</span>
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => handleDocumentReplace(doc.key)}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </Button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Back Button */}
      <button
        onClick={goBack}
        className="inline-flex items-center gap-2 text-sm sm:text-base text-slate-600 hover:text-slate-900 mb-4 sm:mb-6 transition font-medium group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
        <span className="hidden sm:inline">{canGoBack ? 'Back' : 'Back to Dashboard'}</span>
        <span className="sm:hidden">Back</span>
      </button>

      {/* Hero Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 w-full sm:w-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex-shrink-0"
            >
              <img 
                src={profile.avatarUrl} 
                alt={profile.fullName} 
                className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            </motion.div>
            <div className="text-center sm:text-left flex-1 sm:flex-none">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
                {profile.fullName}
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 mb-3 sm:mb-4">
                {profile.title}
              </p>
              <div className="flex justify-center sm:justify-start gap-2">
                <Badge 
                  variant={profile.status === 'Available' ? 'available' : 'onboard'}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1"
                >
                  {profile.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            {isEditMode ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditMode(false)}
                  className="gap-2 flex-1 sm:flex-none"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
                <Button 
                  onClick={() => setIsEditMode(false)}
                  className="gap-2 bg-emerald-500 hover:bg-emerald-600 flex-1 sm:flex-none"
                  size="sm"
                >
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Save Changes</span>
                  <span className="sm:hidden">Save</span>
                </Button>
              </>
            ) : (
              <Button 
                variant="outline"
                onClick={() => setIsEditMode(true)}
                className="gap-2 w-full sm:w-auto"
                size="sm"
              >
                <Edit2 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Animated Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="glass rounded-lg p-1 h-auto w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="personal" className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
            <User className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Personal Identity</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
            <Briefcase className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Professional</span>
          </TabsTrigger>
          <TabsTrigger value="medical" className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
            <Heart className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Medical</span>
          </TabsTrigger>
          <TabsTrigger value="expiry" className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
            <Clock className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Expiry Dates</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="px-3 sm:px-6 py-2 text-xs sm:text-sm whitespace-nowrap">
            <FileCheck className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Identity Tab */}
        <AnimatePresence mode="wait">
          <TabsContent value="personal" className="mt-4 sm:mt-6">
            <motion.div
              key="personal"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Personal Identity Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <FieldDisplay 
                  label="Full Legal Name" 
                  value={profile.personalIdentity.fullLegalName}
                  icon={User}
                />
                <FieldDisplay 
                  label="Date of Birth" 
                  value={formatDate(profile.personalIdentity.dateOfBirth)}
                  icon={Calendar}
                />
                <FieldDisplay 
                  label="Place of Birth" 
                  value={profile.personalIdentity.placeOfBirth}
                  icon={MapPin}
                />
                <FieldDisplay 
                  label="Nationality" 
                  value={profile.personalIdentity.nationality}
                />
                <FieldDisplay 
                  label="Permanent Home Address" 
                  value={profile.personalIdentity.permanentHomeAddress}
                  icon={MapPin}
                />
                <FieldDisplay 
                  label="Emergency Contact Name" 
                  value={profile.personalIdentity.emergencyContactName}
                />
                <FieldDisplay 
                  label="Emergency Contact Relationship" 
                  value={profile.personalIdentity.emergencyContactRelationship}
                />
                <FieldDisplay 
                  label="Emergency Contact Phone Number" 
                  value={profile.personalIdentity.emergencyContactPhoneNumber}
                  icon={Phone}
                />
                <FieldDisplay 
                  label="Emergency Contact Email" 
                  value={profile.personalIdentity.emergencyContactEmail}
                  icon={Mail}
                />
                <FieldDisplay 
                  label="Shirt Size" 
                  value={profile.personalIdentity.shirtSize}
                />
                <FieldDisplay 
                  label="Pant Size" 
                  value={profile.personalIdentity.pantSize}
                />
                <FieldDisplay 
                  label="Shoe Size" 
                  value={profile.personalIdentity.shoeSize}
                />
                <FieldDisplay 
                  label="Hat Size" 
                  value={profile.personalIdentity.hatSize}
                />
              </div>
            </motion.div>
          </TabsContent>

          {/* Professional & Operational Tab */}
          <TabsContent value="professional" className="mt-4 sm:mt-6">
            <motion.div
              key="professional"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Professional & Operational Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FieldDisplay 
                  label="CoC Number" 
                  value={profile.professionalInfo.cocNumber}
                />
                <FieldDisplay 
                  label="Issuing Country" 
                  value={profile.professionalInfo.issuingCountry}
                />
                <FieldDisplay 
                  label="Capacity (Rank)" 
                  value={profile.professionalInfo.capacity}
                />
                <FieldDisplay 
                  label="License Limitations" 
                  value={profile.professionalInfo.licenseLimitations}
                />
                <FieldDisplay 
                  label="Total Sea Time" 
                  value={profile.professionalInfo.totalSeaTime}
                />
                <FieldDisplay 
                  label="Time in Rank" 
                  value={profile.professionalInfo.timeInRank}
                />
                <div className="sm:col-span-2">
                  <label className="text-xs sm:text-sm font-medium text-slate-500 mb-2 block">
                    Vessel Types Flown
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profile.professionalInfo.vesselTypesFlown.map((type, idx) => (
                      <Badge key={idx} variant="secondary">{type}</Badge>
                    ))}
                  </div>
                </div>
                <FieldDisplay 
                  label="Bank IBAN" 
                  value={profile.professionalInfo.bankIBAN}
                />
                <FieldDisplay 
                  label="Bank SWIFT" 
                  value={profile.professionalInfo.bankSWIFT}
                />
                <FieldDisplay 
                  label="Currency Preference" 
                  value={profile.professionalInfo.currencyPreference}
                />
                <FieldDisplay 
                  label="Nearest Airport" 
                  value={profile.professionalInfo.nearestAirport}
                  icon={MapPin}
                />
              </div>
            </motion.div>
          </TabsContent>

          {/* Medical Information Tab */}
          <TabsContent value="medical" className="mt-4 sm:mt-6">
            <motion.div
              key="medical"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Medical Information
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FieldDisplay 
                  label="Blood Type" 
                  value={profile.medicalInfo.bloodType}
                />
                <FieldDisplay 
                  label="Known Allergies" 
                  value={profile.medicalInfo.knownAllergies}
                />
                <FieldDisplay 
                  label="Dietary Restrictions" 
                  value={profile.medicalInfo.dietaryRestrictions}
                />
                <FieldDisplay 
                  label="Corrective Lenses Required" 
                  value={profile.medicalInfo.correctiveLensesRequired}
                />
              </div>
            </motion.div>
          </TabsContent>

          {/* Expiry Date Tracking Tab */}
          <TabsContent value="expiry" className="mt-4 sm:mt-6">
            <motion.div
              key="expiry"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass rounded-xl p-4 sm:p-6 space-y-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-emerald-500" />
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Expiry Date Tracking
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FieldDisplay 
                  label="Passport Expiry Date" 
                  value={formatDate(profile.expiryDates.passportExpiryDate)}
                  icon={Calendar}
                  isExpiring={isExpiringSoon(profile.expiryDates.passportExpiryDate)}
                />
                <FieldDisplay 
                  label="Visa Expiry Date" 
                  value={formatDate(profile.expiryDates.visaExpiryDate)}
                  icon={Calendar}
                  isExpiring={isExpiringSoon(profile.expiryDates.visaExpiryDate)}
                />
                <FieldDisplay 
                  label="Certificate of Competency (CoC) Expiry Date" 
                  value={formatDate(profile.expiryDates.cocExpiryDate)}
                  icon={Calendar}
                  isExpiring={isExpiringSoon(profile.expiryDates.cocExpiryDate)}
                />
                <FieldDisplay 
                  label="Flag State Endorsement Expiry Date" 
                  value={formatDate(profile.expiryDates.flagStateEndorsementExpiryDate)}
                  icon={Calendar}
                  isExpiring={isExpiringSoon(profile.expiryDates.flagStateEndorsementExpiryDate)}
                />
                <FieldDisplay 
                  label="Medical Certificate (ENG1) Expiry Date" 
                  value={formatDate(profile.expiryDates.medicalCertificateExpiryDate)}
                  icon={Calendar}
                  isExpiring={isExpiringSoon(profile.expiryDates.medicalCertificateExpiryDate)}
                />
                <FieldDisplay 
                  label="STCW Training Expiry Date" 
                  value={formatDate(profile.expiryDates.stcwTrainingExpiryDate)}
                  icon={Calendar}
                  isExpiring={isExpiringSoon(profile.expiryDates.stcwTrainingExpiryDate)}
                />
              </div>
            </motion.div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4 sm:mt-6">
            <motion.div
              key="documents"
              variants={tabContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="space-y-6"
            >
              {/* Header with Actions */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1">
                    Document Management
                  </h3>
                  <p className="text-sm text-slate-600">
                    Search, filter, and manage all captain documents
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button 
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600" 
                    size="sm"
                    onClick={() => {
                      // In a real app, this would open camera/scanning interface
                      alert('Camera/Scanning feature would open here');
                    }}
                  >
                    <Camera className="w-4 h-4" />
                    Scan
                  </Button>
                  <Button 
                    variant="outline" 
                    className="gap-2" 
                    size="sm"
                    onClick={handleBulkUpload}
                  >
                    <Upload className="w-4 h-4" />
                    Bulk Upload
                  </Button>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="glass rounded-xl p-4 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder="Search documents..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Category Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="w-5 h-5 text-slate-500" />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('all')}
                        className="text-xs"
                      >
                        All ({DOCUMENT_LIST.length})
                      </Button>
                      <Button
                        variant={selectedCategory === 'expiring' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('expiring')}
                        className="text-xs text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Expired ({categorizedDocuments.expiring.length})
                      </Button>
                      <Button
                        variant={selectedCategory === 'soon_expired' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('soon_expired')}
                        className="text-xs text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Expiring Soon ({categorizedDocuments.soon_expired.length})
                      </Button>
                      <Button
                        variant={selectedCategory === 'important' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory('important')}
                        className="text-xs text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Important ({categorizedDocuments.important.length})
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents List - Grouped by Category */}
              <div className="space-y-6">
                {/* Expired Documents */}
                {selectedCategory === 'all' && categorizedDocuments.expiring.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <h4 className="text-base font-bold text-slate-900">Expired Documents</h4>
                      <Badge variant="outline" className="text-red-600 border-red-300">
                        {categorizedDocuments.expiring.length}
                      </Badge>
                    </div>
                    <div className="glass rounded-xl p-4 sm:p-6 space-y-2">
                      {filteredDocuments
                        .filter(doc => getDocumentCategory(doc) === 'expiring')
                        .map((doc) => (
                          <DocumentItem key={doc.key} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Soon Expired Documents */}
                {selectedCategory === 'all' && categorizedDocuments.soon_expired.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <h4 className="text-base font-bold text-slate-900">Expiring Soon (Within 90 Days)</h4>
                      <Badge variant="outline" className="text-orange-600 border-orange-300">
                        {categorizedDocuments.soon_expired.length}
                      </Badge>
                    </div>
                    <div className="glass rounded-xl p-4 sm:p-6 space-y-2">
                      {filteredDocuments
                        .filter(doc => getDocumentCategory(doc) === 'soon_expired')
                        .map((doc) => (
                          <DocumentItem key={doc.key} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Important Documents */}
                {selectedCategory === 'all' && categorizedDocuments.important.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-base font-bold text-slate-900">Important Documents</h4>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                        {categorizedDocuments.important.length}
                      </Badge>
                    </div>
                    <div className="glass rounded-xl p-4 sm:p-6 space-y-2">
                      {filteredDocuments
                        .filter(doc => getDocumentCategory(doc) === 'important')
                        .map((doc) => (
                          <DocumentItem key={doc.key} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Other Documents */}
                {selectedCategory === 'all' && categorizedDocuments.other.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-slate-600" />
                      <h4 className="text-base font-bold text-slate-900">Other Documents</h4>
                      <Badge variant="outline">
                        {categorizedDocuments.other.length}
                      </Badge>
                    </div>
                    <div className="glass rounded-xl p-4 sm:p-6 space-y-2">
                      {filteredDocuments
                        .filter(doc => getDocumentCategory(doc) === 'other')
                        .map((doc) => (
                          <DocumentItem key={doc.key} doc={doc} />
                        ))}
                    </div>
                  </div>
                )}

                {/* Filtered View (when category is selected) */}
                {selectedCategory !== 'all' && (
                  <div className="glass rounded-xl p-4 sm:p-6 space-y-2">
                    {filteredDocuments.length > 0 ? (
                      filteredDocuments.map((doc) => (
                        <DocumentItem key={doc.key} doc={doc} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-slate-500">No documents found in this category</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bulk Upload Documents</DialogTitle>
            <DialogDescription>
              Review and confirm the document type for each file. Files are automatically matched by filename.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {bulkUploadFiles.map((file) => {
              const currentMapping = fileMappings[file.name] || '';
              const matchedDoc = DOCUMENT_LIST.find(d => d.key === currentMapping);
              
              return (
                <div key={file.name} className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <select
                    value={currentMapping}
                    onChange={(e) => {
                      setFileMappings(prev => ({
                        ...prev,
                        [file.name]: e.target.value
                      }));
                    }}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[250px]"
                  >
                    <option value="">Select document type...</option>
                    {DOCUMENT_LIST.map((doc) => (
                      <option key={doc.key} value={doc.key}>
                        {doc.label}
                      </option>
                    ))}
                  </select>
                  {matchedDoc && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                      Matched
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBulkUploadFiles([]);
                setFileMappings({});
                setIsBulkUploadOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUploadConfirm}
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={bulkUploadFiles.length === 0 || Object.values(fileMappings).some(v => !v)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload {bulkUploadFiles.length} File{bulkUploadFiles.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
