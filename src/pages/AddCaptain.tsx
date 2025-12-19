import { useState, useRef, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNavigationHistory } from '../hooks/useNavigationHistory';
import {
  UserPlus,
  Save,
  X,
  User,
  Briefcase,
  Heart,
  Clock,
  FileCheck,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Upload,
  Camera,
  FileText,
  Trash2,

  CheckCircle,
  AlertCircle,
  Anchor,
  Award
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useCaptains } from '../context/CaptainsContext';
import { api, uploadFile } from '../lib/api';
import { useToast } from '../context/ToastContext';
import type { CaptainProfile, Status } from '../types';

// Document types list
const DOCUMENT_TYPES = [
  { label: 'Passport Scan', key: 'passportScan' },
  { label: 'Visa Document', key: 'visaDocument' },
  { label: 'Passport Photo', key: 'passportPhoto' },
  { label: 'Certificate of Competency (CoC)', key: 'certificateOfCompetency' },
  { label: 'Flag State Endorsement', key: 'flagStateEndorsement' },
  { label: 'GMDSS Certificate', key: 'gmdssCertificate' },
  { label: 'Basic Safety Training Certificate', key: 'basicSafetyTrainingCertificate' },
  { label: 'Advanced Fire Fighting Certificate', key: 'advancedFireFightingCertificate' },
  { label: 'Medical Care Onboard Certificate', key: 'medicalCareOnboardCertificate' },
  { label: 'Ship Security Officer Certificate', key: 'shipSecurityOfficerCertificate' },
  { label: 'ECDIS Certificate', key: 'ecdisCertificate' },
  { label: 'Bridge Resource Management Certificate', key: 'bridgeResourceManagementCertificate' },
  { label: 'Medical Certificate (ENG1)', key: 'medicalCertificateENG1' },
  { label: 'Drug & Alcohol Test Results', key: 'drugAlcoholTestResults' },
  { label: 'Vaccination Record', key: 'vaccinationRecord' },
  { label: "Seaman's Discharge Book Scans", key: 'seamanDischargeBookScans' },
  { label: 'Reference Letters', key: 'referenceLetters' },
  { label: 'Current CV / Resume', key: 'currentCVResume' },
  { label: 'Employment Contract (SEA)', key: 'employmentContractSEA' },
  { label: 'Signed Code of Conduct', key: 'signedCodeOfConduct' },
  { label: 'Signed NDA', key: 'signedNDA' },
];

// FieldInput component moved outside to prevent recreation on each render
interface FieldInputProps {
  label: string;
  section: string;
  field: string;
  type?: string;
  required?: boolean;
  icon?: any;
  value: string;
  onChange: (value: string) => void;
}

const FieldInput = memo(({
  label,
  section,
  field,
  type = 'text',
  required = false,
  icon: Icon,
  value,
  onChange
}: FieldInputProps) => {
  return (
    <div className="space-y-1">
      <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />}
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="text-sm sm:text-base"
      />
    </div>
  );
});

FieldInput.displayName = 'FieldInput';

const AddCaptain = () => {
  const navigate = useNavigate();
  const { goBack, canGoBack } = useNavigationHistory();
  const { addCaptain } = useCaptains();
  const { showSuccess, showError, showWarning } = useToast();
  const [activeTab, setActiveTab] = useState('personal');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState<Partial<CaptainProfile>>({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    team: '',
    status: 'Available' as Status,
    avatarUrl: '',
    personalIdentity: {
      fullLegalName: '',
      dateOfBirth: '',
      placeOfBirth: '',
      nationality: '',
      permanentHomeAddress: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhoneNumber: '',
      emergencyContactEmail: '',
      shirtSize: '',
      pantSize: '',
      shoeSize: '',
      hatSize: '',
    },
    professionalInfo: {
      cocNumber: '',
      issuingCountry: '',
      capacity: '',
      licenseLimitations: '',
      totalSeaTime: '',
      timeInRank: '',
      vesselTypesFlown: [],
      bankIBAN: '',
      bankSWIFT: '',
      currencyPreference: '',
      nearestAirport: '',
    },
    medicalInfo: {
      bloodType: '',
      knownAllergies: '',
      dietaryRestrictions: '',
      correctiveLensesRequired: false,
    },
    expiryDates: {
      passportExpiryDate: '',
      visaExpiryDate: '',
      cocExpiryDate: '',
      flagStateEndorsementExpiryDate: '',
      medicalCertificateExpiryDate: '',
      stcwTrainingExpiryDate: '',
    },
    documents: {},
    licenses: [],
    seaServiceHistory: [],
    skills: [],
  });

  const [vesselTypeInput, setVesselTypeInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, { file: File; url: string }[]>>({});
  const [isDragging, setIsDragging] = useState(false);

  const handleInputChange = useCallback((section: string, field: string, value: any) => {
    if (section === 'fullName' || section === 'title' || section === 'email' ||
      section === 'phone' || section === 'location' || section === 'team' || section === 'status' ||
      section === 'avatarUrl') {
      setFormData(prev => ({
        ...prev,
        [section]: value,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev[section as keyof typeof prev] as any),
          [field]: value,
        },
      }));
    }
  }, []);

  const handleArrayAdd = (section: string, field: string, value: string) => {
    if (!value.trim()) return;
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: [
          ...((prev[section as keyof typeof prev] as any)?.[field] || []),
          value.trim(),
        ],
      },
    }));
  };

  const handleArrayRemove = (section: string, field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: ((prev[section as keyof typeof prev] as any)?.[field] || []).filter((_: any, i: number) => i !== index),
      },
    }));
  };

  const handleFileUpload = (files: FileList | File[], docTypeKey: string) => {
    if (!files || files.length === 0 || !docTypeKey) return;

    // Check if this document type is already uploaded
    if (uploadedDocuments[docTypeKey] && uploadedDocuments[docTypeKey].length > 0) {
      const docType = DOCUMENT_TYPES.find(d => d.key === docTypeKey);
      const confirmReplace = window.confirm(
        `A ${docType?.label || 'document'} has already been uploaded for this captain. Do you want to replace it?`
      );
      if (!confirmReplace) {
        return;
      }
      // Clear existing files for this document type
      uploadedDocuments[docTypeKey].forEach(fileData => {
        if (fileData.url) {
          URL.revokeObjectURL(fileData.url);
        }
      });
    }

    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => ({
      file,
      url: URL.createObjectURL(file), // Create preview URL
    }));

    setUploadedDocuments(prev => ({
      ...prev,
      [docTypeKey]: newFiles, // Replace instead of append to prevent duplicates
    }));

    // Update formData documents - store all file URLs for this document type
    setFormData(prev => {
      const newUrls = newFiles.map(f => f.url);
      return {
        ...prev,
        documents: {
          ...prev.documents,
          [docTypeKey]: newUrls.join(','),
        },
      };
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent, docTypeKey: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!docTypeKey) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files, docTypeKey);
    }
  };

  const handleRemoveDocument = (docTypeKey: string, index: number) => {
    // Revoke object URL to prevent memory leaks
    const fileToRemove = uploadedDocuments[docTypeKey]?.[index];
    if (fileToRemove?.url) {
      URL.revokeObjectURL(fileToRemove.url);
    }

    setUploadedDocuments(prev => {
      const updated = { ...prev };
      if (updated[docTypeKey]) {
        updated[docTypeKey] = updated[docTypeKey].filter((_, i) => i !== index);
        if (updated[docTypeKey].length === 0) {
          delete updated[docTypeKey];
        }
      }
      return updated;
    });

    // Update formData
    setFormData(prev => {
      const updatedDocs = { ...prev.documents || {} };
      if (updatedDocs[docTypeKey]) {
        const urls = (updatedDocs[docTypeKey] as string).split(',').filter((_, i) => i !== index);
        if (urls.length > 0) {
          updatedDocs[docTypeKey] = urls.join(',');
        } else {
          delete updatedDocs[docTypeKey];
        }
      }
      return { ...prev, documents: updatedDocs };
    });
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.title || !formData.team) {
      showWarning('Please fill in all required fields (Name, Email, Title, Team)');
      return;
    }

    try {
      console.log('[AddCaptain] Submitting captain data:', {
        fullName: formData.fullName,
        title: formData.title,
        email: formData.email,
        team: formData.team,
        hasPersonalIdentity: !!formData.personalIdentity,
        hasProfessionalInfo: !!formData.professionalInfo,
        hasMedicalInfo: !!formData.medicalInfo,
        hasExpiryDates: !!formData.expiryDates,
      });

      // Create in backend with all data
      const created = await api.post<{ id: number }>('/captains', {
        fullName: formData.fullName!,
        title: formData.title!,
        avatarUrl: formData.avatarUrl || '/avatars/default.jpg',
        status: formData.status || 'Available',
        email: formData.email!,
        phone: formData.phone || '',
        location: formData.location || '',
        team: formData.team!,
        linkedInUrl: formData.linkedInUrl || null,
        personalIdentity: formData.personalIdentity,
        professionalInfo: formData.professionalInfo,
        medicalInfo: formData.medicalInfo,
        expiryDates: formData.expiryDates,
      });

      const captainId = String(created.id);

      // Upload avatar file if present
      if (avatarFile) {
        const formDataUpload = new FormData();
        formDataUpload.append('avatar', avatarFile);
        const res = await uploadFile<{ avatarUrl: string }>(`/captains/${captainId}/avatar`, formDataUpload);
        formData.avatarUrl = res.avatarUrl;
      }

      // Upload documents (only one file per document type - prevent duplicates)
      for (const [docKey, files] of Object.entries(uploadedDocuments)) {
        if (files.length > 0) {
          // Only upload the first file (or latest if multiple selected)
          const fileData = files[files.length - 1];
          const formDataUpload = new FormData();
          formDataUpload.append('file', fileData.file);
          formDataUpload.append('docKey', docKey);
          formDataUpload.append('replace', 'false'); // New upload, not replacement
          try {
            await uploadFile<{ fileUrl: string }>(`/captains/${captainId}/documents`, formDataUpload);
          } catch (err: any) {
            console.error(`Failed to upload document ${docKey}:`, err);
            if (err.message?.includes('already exists')) {
              // If duplicate, try to replace
              formDataUpload.set('replace', 'true');
              try {
                await uploadFile<{ fileUrl: string }>(`/captains/${captainId}/documents`, formDataUpload);
              } catch (replaceErr) {
                console.error(`Failed to replace document ${docKey}:`, replaceErr);
              }
            }
          }
        }
      }

      showSuccess('Captain profile created successfully!');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: any) {
      console.error('Failed to create captain', err);
      console.error('Error details:', err?.details);
      console.error('Full error object:', err);

      // Try to extract a meaningful error message
      let errorMessage = 'Failed to create captain';

      if (err?.details) {
        errorMessage = err.details.sqlMessage || err.details.error || err.details.message || errorMessage;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      // If we still don't have a good message, show the full error
      if (errorMessage === 'Failed to create captain' && err) {
        errorMessage = `Failed to create captain: ${JSON.stringify(err)}`;
      }

      alert(errorMessage);
    }
  };

  // Helper function to get field value
  const getFieldValue = useCallback((section: string, field: string): string => {
    if (section === 'fullName' || section === 'title' || section === 'email' ||
      section === 'phone' || section === 'location' || section === 'team' || section === 'avatarUrl') {
      return (formData[section as keyof typeof formData] as string) || '';
    } else {
      return (formData[section as keyof typeof formData] as any)?.[field] || '';
    }
  }, [formData]);

  // Helper function to create onChange handler for a specific field
  const createFieldChangeHandler = useCallback((section: string, field: string) => {
    return (value: string) => handleInputChange(section, field, value);
  }, [handleInputChange]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">
            Add New Captain
          </h1>
          <p className="text-sm sm:text-base text-slate-600">
            Create a new captain profile with complete information
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="gap-2 flex-1 sm:flex-none"
            size="sm"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
          <Button
            onClick={async () => {
              // Validate required fields
              if (!formData.fullName || !formData.email || !formData.title || !formData.team) {
                showWarning('Please fill in all required fields (Name, Email, Title, Team)');
                return;
              }

              try {
                const payload = {
                  ...formData,
                  seaService: formData.seaServiceHistory,
                };

                await addCaptain(payload);
                showSuccess('Captain created successfully');
                navigate('/');
              } catch (err: any) {
                console.error('Failed to create captain:', err);
                const errorMessage = err.details?.sqlMessage || err.message || 'Failed to create captain';
                showError(errorMessage);
              }
            }}
            className="gap-2 bg-emerald-500 hover:bg-emerald-600 flex-1 sm:flex-none"
            size="sm"
          >
            <Save className="w-4 h-4" />
            Save Captain
          </Button>
        </div>
      </motion.div>

      {/* Basic Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass rounded-xl p-4 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-3 mb-4">
          <UserPlus className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">Basic Information</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FieldInput label="Full Name" section="fullName" field="fullName" required icon={User} value={getFieldValue('fullName', 'fullName')} onChange={createFieldChangeHandler('fullName', 'fullName')} />
          <FieldInput label="Title/Rank" section="title" field="title" required icon={Briefcase} value={getFieldValue('title', 'title')} onChange={createFieldChangeHandler('title', 'title')} />
          <FieldInput label="Email" section="email" field="email" type="email" required icon={Mail} value={getFieldValue('email', 'email')} onChange={createFieldChangeHandler('email', 'email')} />
          <FieldInput label="Phone" section="phone" field="phone" type="tel" icon={Phone} value={getFieldValue('phone', 'phone')} onChange={createFieldChangeHandler('phone', 'phone')} />
          <FieldInput label="Location" section="location" field="location" icon={MapPin} value={getFieldValue('location', 'location')} onChange={createFieldChangeHandler('location', 'location')} />
          <FieldInput label="Team" section="team" field="team" required icon={User} value={getFieldValue('team', 'team')} onChange={createFieldChangeHandler('team', 'team')} />
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-slate-700">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as Status }))}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Available">Available</option>
              <option value="Onboard">Onboard</option>
              <option value="On Leave">On Leave</option>
              <option value="Active">Active</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1">
              <Camera className="w-3 h-3" />
              Profile Picture
            </label>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                {avatarPreview || formData.avatarUrl ? (
                  <img
                    src={avatarPreview || (formData.avatarUrl as string)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-5 h-5 text-slate-400" />
                )}
              </div>
              <div>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const objectUrl = URL.createObjectURL(file);
                    setAvatarPreview(objectUrl);
                    setAvatarFile(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  Browse
                </Button>
                <p className="text-[11px] text-slate-500 mt-1">
                  JPG or PNG, recommended 400x400px.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs for Detailed Information */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="glass rounded-lg p-1 h-auto w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="personal" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <User className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <Briefcase className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Professional</span>
          </TabsTrigger>
          <TabsTrigger value="medical" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <Heart className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Medical</span>
          </TabsTrigger>
          <TabsTrigger value="expiry" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <Clock className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Expiry Dates</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <FileCheck className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <FileText className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Certificates</span>
          </TabsTrigger>
          <TabsTrigger value="seaService" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <Anchor className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Sea Service</span>
          </TabsTrigger>
          <TabsTrigger value="skills" className="px-3 sm:px-6 py-2 text-xs sm:text-sm">
            <Award className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Skills</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Identity Tab */}
        <TabsContent value="personal" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Personal Identity</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <FieldInput label="Full Legal Name" section="personalIdentity" field="fullLegalName" icon={User} value={getFieldValue('personalIdentity', 'fullLegalName')} onChange={createFieldChangeHandler('personalIdentity', 'fullLegalName')} />
              <FieldInput label="Date of Birth" section="personalIdentity" field="dateOfBirth" type="date" icon={Calendar} value={getFieldValue('personalIdentity', 'dateOfBirth')} onChange={createFieldChangeHandler('personalIdentity', 'dateOfBirth')} />
              <FieldInput label="Place of Birth" section="personalIdentity" field="placeOfBirth" icon={MapPin} value={getFieldValue('personalIdentity', 'placeOfBirth')} onChange={createFieldChangeHandler('personalIdentity', 'placeOfBirth')} />
              <FieldInput label="Nationality" section="personalIdentity" field="nationality" value={getFieldValue('personalIdentity', 'nationality')} onChange={createFieldChangeHandler('personalIdentity', 'nationality')} />
              <div className="sm:col-span-2 lg:col-span-3">
                <FieldInput label="Permanent Home Address" section="personalIdentity" field="permanentHomeAddress" icon={MapPin} value={getFieldValue('personalIdentity', 'permanentHomeAddress')} onChange={createFieldChangeHandler('personalIdentity', 'permanentHomeAddress')} />
              </div>
              <FieldInput label="Emergency Contact Name" section="personalIdentity" field="emergencyContactName" value={getFieldValue('personalIdentity', 'emergencyContactName')} onChange={createFieldChangeHandler('personalIdentity', 'emergencyContactName')} />
              <FieldInput label="Emergency Contact Relationship" section="personalIdentity" field="emergencyContactRelationship" value={getFieldValue('personalIdentity', 'emergencyContactRelationship')} onChange={createFieldChangeHandler('personalIdentity', 'emergencyContactRelationship')} />
              <FieldInput label="Emergency Contact Phone" section="personalIdentity" field="emergencyContactPhoneNumber" type="tel" icon={Phone} value={getFieldValue('personalIdentity', 'emergencyContactPhoneNumber')} onChange={createFieldChangeHandler('personalIdentity', 'emergencyContactPhoneNumber')} />
              <FieldInput label="Emergency Contact Email" section="personalIdentity" field="emergencyContactEmail" type="email" icon={Mail} value={getFieldValue('personalIdentity', 'emergencyContactEmail')} onChange={createFieldChangeHandler('personalIdentity', 'emergencyContactEmail')} />
              <FieldInput label="Shirt Size" section="personalIdentity" field="shirtSize" value={getFieldValue('personalIdentity', 'shirtSize')} onChange={createFieldChangeHandler('personalIdentity', 'shirtSize')} />
              <FieldInput label="Pant Size" section="personalIdentity" field="pantSize" value={getFieldValue('personalIdentity', 'pantSize')} onChange={createFieldChangeHandler('personalIdentity', 'pantSize')} />
              <FieldInput label="Shoe Size" section="personalIdentity" field="shoeSize" value={getFieldValue('personalIdentity', 'shoeSize')} onChange={createFieldChangeHandler('personalIdentity', 'shoeSize')} />
              <FieldInput label="Hat Size" section="personalIdentity" field="hatSize" value={getFieldValue('personalIdentity', 'hatSize')} onChange={createFieldChangeHandler('personalIdentity', 'hatSize')} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Professional Tab */}
        <TabsContent value="professional" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <Briefcase className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Professional Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="CoC Number" section="professionalInfo" field="cocNumber" value={getFieldValue('professionalInfo', 'cocNumber')} onChange={createFieldChangeHandler('professionalInfo', 'cocNumber')} />
              <FieldInput label="Issuing Country" section="professionalInfo" field="issuingCountry" value={getFieldValue('professionalInfo', 'issuingCountry')} onChange={createFieldChangeHandler('professionalInfo', 'issuingCountry')} />
              <FieldInput label="Capacity (Rank)" section="professionalInfo" field="capacity" value={getFieldValue('professionalInfo', 'capacity')} onChange={createFieldChangeHandler('professionalInfo', 'capacity')} />
              <FieldInput label="License Limitations" section="professionalInfo" field="licenseLimitations" value={getFieldValue('professionalInfo', 'licenseLimitations')} onChange={createFieldChangeHandler('professionalInfo', 'licenseLimitations')} />
              <FieldInput label="Total Sea Time" section="professionalInfo" field="totalSeaTime" value={getFieldValue('professionalInfo', 'totalSeaTime')} onChange={createFieldChangeHandler('professionalInfo', 'totalSeaTime')} />
              <FieldInput label="Time in Rank" section="professionalInfo" field="timeInRank" value={getFieldValue('professionalInfo', 'timeInRank')} onChange={createFieldChangeHandler('professionalInfo', 'timeInRank')} />
              <div className="sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-slate-700 mb-2 block">
                  Vessel Types Flown
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={vesselTypeInput}
                    onChange={(e) => setVesselTypeInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleArrayAdd('professionalInfo', 'vesselTypesFlown', vesselTypeInput);
                        setVesselTypeInput('');
                      }
                    }}
                    placeholder="Type and press Enter"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      handleArrayAdd('professionalInfo', 'vesselTypesFlown', vesselTypeInput);
                      setVesselTypeInput('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.professionalInfo?.vesselTypesFlown || []).map((type, idx) => (
                    <Badge key={idx} variant="secondary" className="gap-2">
                      {type}
                      <button
                        onClick={() => handleArrayRemove('professionalInfo', 'vesselTypesFlown', idx)}
                        className="ml-1 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
              <FieldInput label="Bank IBAN" section="professionalInfo" field="bankIBAN" value={getFieldValue('professionalInfo', 'bankIBAN')} onChange={createFieldChangeHandler('professionalInfo', 'bankIBAN')} />
              <FieldInput label="Bank SWIFT" section="professionalInfo" field="bankSWIFT" value={getFieldValue('professionalInfo', 'bankSWIFT')} onChange={createFieldChangeHandler('professionalInfo', 'bankSWIFT')} />
              <FieldInput label="Currency Preference" section="professionalInfo" field="currencyPreference" value={getFieldValue('professionalInfo', 'currencyPreference')} onChange={createFieldChangeHandler('professionalInfo', 'currencyPreference')} />
              <FieldInput label="Nearest Airport" section="professionalInfo" field="nearestAirport" icon={MapPin} value={getFieldValue('professionalInfo', 'nearestAirport')} onChange={createFieldChangeHandler('professionalInfo', 'nearestAirport')} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Medical Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Blood Type" section="medicalInfo" field="bloodType" value={getFieldValue('medicalInfo', 'bloodType')} onChange={createFieldChangeHandler('medicalInfo', 'bloodType')} />
              <FieldInput label="Known Allergies" section="medicalInfo" field="knownAllergies" value={getFieldValue('medicalInfo', 'knownAllergies')} onChange={createFieldChangeHandler('medicalInfo', 'knownAllergies')} />
              <FieldInput label="Dietary Restrictions" section="medicalInfo" field="dietaryRestrictions" value={getFieldValue('medicalInfo', 'dietaryRestrictions')} onChange={createFieldChangeHandler('medicalInfo', 'dietaryRestrictions')} />
              <div className="space-y-1">
                <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  Corrective Lenses Required
                </label>
                <select
                  value={formData.medicalInfo?.correctiveLensesRequired ? 'yes' : 'no'}
                  onChange={(e) => handleInputChange('medicalInfo', 'correctiveLensesRequired', e.target.value === 'yes')}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Certificates Tab */}
        <TabsContent value="certificates" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Certificates</h3>
            </div>

            {/* Add Certificate Form */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700">Add New Certificate</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Name</label>
                  <Input id="cert-name" placeholder="Certificate Name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Number</label>
                  <Input id="cert-number" placeholder="Certificate Number" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Issuing Authority</label>
                  <Input id="cert-authority" placeholder="Authority" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Issue Date</label>
                  <Input id="cert-issue" type="date" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Expiry Date</label>
                  <Input id="cert-expiry" type="date" />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const nameEl = document.getElementById('cert-name') as HTMLInputElement;
                      const numberEl = document.getElementById('cert-number') as HTMLInputElement;
                      const authEl = document.getElementById('cert-authority') as HTMLInputElement;
                      const issueEl = document.getElementById('cert-issue') as HTMLInputElement;
                      const expiryEl = document.getElementById('cert-expiry') as HTMLInputElement;

                      if (nameEl.value) {
                        const newCert = {
                          certificateName: nameEl.value,
                          certificateNumber: numberEl.value,
                          issuingAuthority: authEl.value,
                          issueDate: issueEl.value,
                          expiryDate: expiryEl.value
                        };
                        setFormData(prev => ({
                          ...prev,
                          certificates: [...(prev.certificates || []), newCert]
                        }));
                        // Clear inputs
                        nameEl.value = ''; numberEl.value = ''; authEl.value = ''; issueEl.value = ''; expiryEl.value = '';
                      }
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    Add Certificate
                  </Button>
                </div>
              </div>
            </div>

            {/* Certificates List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Added Certificates</h4>
              {(!formData.certificates || formData.certificates.length === 0) && (
                <p className="text-sm text-slate-500 italic">No certificates added yet.</p>
              )}
              {formData.certificates?.map((cert, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-slate-200 gap-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm flex-1">
                    <div><span className="font-medium">Name:</span> {cert.certificateName}</div>
                    <div><span className="font-medium">No:</span> {cert.certificateNumber}</div>
                    <div><span className="font-medium">Issued:</span> {cert.issueDate}</div>
                    <div><span className="font-medium">Expires:</span> {cert.expiryDate}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        certificates: prev.certificates?.filter((_, i) => i !== idx)
                      }));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Sea Service Tab */}
        <TabsContent value="seaService" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <Anchor className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Sea Service History</h3>
            </div>

            {/* Add Sea Service Form */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700">Add Sea Service Record</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Vessel Name</label>
                  <Input id="sea-vessel" placeholder="Vessel Name" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Vessel Type</label>
                  <Input id="sea-type" placeholder="Type" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Rank</label>
                  <Input id="sea-rank" placeholder="Rank" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Start Date</label>
                  <Input id="sea-start" type="date" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">End Date</label>
                  <Input id="sea-end" type="date" />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={() => {
                      const vesselEl = document.getElementById('sea-vessel') as HTMLInputElement;
                      const typeEl = document.getElementById('sea-type') as HTMLInputElement;
                      const rankEl = document.getElementById('sea-rank') as HTMLInputElement;
                      const startEl = document.getElementById('sea-start') as HTMLInputElement;
                      const endEl = document.getElementById('sea-end') as HTMLInputElement;

                      if (vesselEl.value && startEl.value) {
                        const newService = {
                          vesselName: vesselEl.value,
                          vesselType: typeEl.value,
                          rank: rankEl.value,
                          startDate: startEl.value,
                          endDate: endEl.value
                        };
                        setFormData(prev => ({
                          ...prev,
                          seaServiceHistory: [...(prev.seaServiceHistory || []), newService]
                        }));
                        // Clear inputs
                        vesselEl.value = ''; typeEl.value = ''; rankEl.value = ''; startEl.value = ''; endEl.value = '';
                      }
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    Add Record
                  </Button>
                </div>
              </div>
            </div>

            {/* Sea Service List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-700">Added Records</h4>
              {(!formData.seaServiceHistory || formData.seaServiceHistory.length === 0) && (
                <p className="text-sm text-slate-500 italic">No sea service records added yet.</p>
              )}
              {formData.seaServiceHistory?.map((service, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-slate-200 gap-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm flex-1">
                    <div><span className="font-medium">Vessel:</span> {service.vesselName}</div>
                    <div><span className="font-medium">Type:</span> {service.vesselType}</div>
                    <div><span className="font-medium">Rank:</span> {service.rank}</div>
                    <div><span className="font-medium">Start:</span> {service.startDate}</div>
                    <div><span className="font-medium">End:</span> {service.endDate}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        seaServiceHistory: prev.seaServiceHistory?.filter((_, i) => i !== idx)
                      }));
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Skills</h3>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (skillInput.trim()) {
                        setFormData(prev => ({
                          ...prev,
                          skills: [...(prev.skills || []), { name: skillInput.trim(), proficiencyLevel: 'Intermediate' }]
                        }));
                        setSkillInput('');
                      }
                    }
                  }}
                  placeholder="Add a skill (e.g. Navigation, First Aid)"
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (skillInput.trim()) {
                      setFormData(prev => ({
                        ...prev,
                        skills: [...(prev.skills || []), { name: skillInput.trim(), proficiencyLevel: 'Intermediate' }]
                      }));
                      setSkillInput('');
                    }
                  }}
                  className="bg-emerald-500"
                >
                  Add Skill
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(formData.skills || []).map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="gap-2 p-2">
                    {skill.name}
                    {/* Simple proficiency toggle for now - could be a select */}
                    <span className="text-xs text-slate-500 border-l pl-2 ml-1">{skill.proficiencyLevel}</span>
                    <button
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          skills: prev.skills?.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {(formData.skills || []).length === 0 && (
                  <p className="text-sm text-slate-500 italic">No skills added yet.</p>
                )}
              </div>
            </div>
          </motion.div>
        </TabsContent>

        {/* Expiry Dates Tab */}
        <TabsContent value="expiry" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-xl p-4 sm:p-6 space-y-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Expiry Date Tracking</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FieldInput label="Passport Expiry Date" section="expiryDates" field="passportExpiryDate" type="date" icon={Calendar} value={getFieldValue('expiryDates', 'passportExpiryDate')} onChange={createFieldChangeHandler('expiryDates', 'passportExpiryDate')} />
              <FieldInput label="Visa Expiry Date" section="expiryDates" field="visaExpiryDate" type="date" icon={Calendar} value={getFieldValue('expiryDates', 'visaExpiryDate')} onChange={createFieldChangeHandler('expiryDates', 'visaExpiryDate')} />
              <FieldInput label="CoC Expiry Date" section="expiryDates" field="cocExpiryDate" type="date" icon={Calendar} value={getFieldValue('expiryDates', 'cocExpiryDate')} onChange={createFieldChangeHandler('expiryDates', 'cocExpiryDate')} />
              <FieldInput label="Flag State Endorsement Expiry" section="expiryDates" field="flagStateEndorsementExpiryDate" type="date" icon={Calendar} value={getFieldValue('expiryDates', 'flagStateEndorsementExpiryDate')} onChange={createFieldChangeHandler('expiryDates', 'flagStateEndorsementExpiryDate')} />
              <FieldInput label="Medical Certificate (ENG1) Expiry" section="expiryDates" field="medicalCertificateExpiryDate" type="date" icon={Calendar} value={getFieldValue('expiryDates', 'medicalCertificateExpiryDate')} onChange={createFieldChangeHandler('expiryDates', 'medicalCertificateExpiryDate')} />
              <FieldInput label="STCW Training Expiry Date" section="expiryDates" field="stcwTrainingExpiryDate" type="date" icon={Calendar} value={getFieldValue('expiryDates', 'stcwTrainingExpiryDate')} onChange={createFieldChangeHandler('expiryDates', 'stcwTrainingExpiryDate')} />
            </div>
          </motion.div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <FileCheck className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg sm:text-xl font-bold text-slate-900">Document Uploads</h3>
            </div>

            {/* Document Upload Section */}
            <div className="glass rounded-xl p-4 sm:p-6 space-y-6">
              <div>
                <h4 className="text-base font-semibold text-slate-900 mb-4">Upload Documents</h4>

                {/* Document Type Selection */}
                <div className="space-y-3 mb-4">
                  <label className="text-sm font-medium text-slate-700 block">
                    Select Document Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Choose a document type...</option>
                    {DOCUMENT_TYPES.map((docType) => {
                      const isUploaded = uploadedDocuments[docType.key] && uploadedDocuments[docType.key].length > 0;
                      return (
                        <option
                          key={docType.key}
                          value={docType.key}
                          disabled={isUploaded}
                        >
                          {docType.label} {isUploaded && '(Already uploaded)'}
                        </option>
                      );
                    })}
                  </select>
                  {selectedDocType && uploadedDocuments[selectedDocType] && uploadedDocuments[selectedDocType].length > 0 && (
                    <p className="text-sm text-amber-600 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      This document type has already been uploaded. Uploading again will replace the existing file.
                    </p>
                  )}
                </div>

                {/* File Upload */}
                {selectedDocType && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-slate-700 block">
                      Upload Files (Multiple files allowed)
                    </label>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          multiple
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files, selectedDocType)}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, selectedDocType)}
                          className={`flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg transition-colors ${isDragging
                            ? 'border-emerald-500 bg-emerald-50 border-solid'
                            : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50'
                            }`}
                        >
                          <Upload className="w-5 h-5 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">
                            Click to upload or drag and drop
                          </span>
                        </div>
                      </label>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.multiple = true;
                          input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
                          input.onchange = (e) => {
                            const target = e.target as HTMLInputElement;
                            if (target.files) {
                              handleFileUpload(target.files, selectedDocType);
                            }
                          };
                          input.click();
                        }}
                        className="gap-2"
                        size="sm"
                      >
                        <Camera className="w-4 h-4" />
                        Browse Files
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Supported formats: PDF, JPG, PNG, DOC, DOCX (Multiple files can be selected)
                    </p>
                  </div>
                )}
              </div>

              {/* Uploaded Documents List - Categorized by Document Type */}
              {Object.keys(uploadedDocuments).length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-200">
                  <h4 className="text-base font-semibold text-slate-900">Uploaded Documents</h4>

                  <div className="space-y-4">
                    {Object.entries(uploadedDocuments).map(([docTypeKey, files]) => {
                      const docType = DOCUMENT_TYPES.find(d => d.key === docTypeKey);
                      return (
                        <motion.div
                          key={docTypeKey}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <FileText className="w-5 h-5 text-emerald-500" />
                              <h5 className="font-semibold text-slate-900">
                                {docType?.label || docTypeKey}
                              </h5>
                              <Badge variant="secondary" className="text-xs">
                                {files.length} file{files.length > 1 ? 's' : ''}
                              </Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {files.map((fileItem, index) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-slate-50 transition-colors border border-slate-200"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                    <FileText className="w-5 h-5 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                      {fileItem.file.name}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB •
                                      {new Date().toLocaleDateString()}
                                    </p>
                                  </div>
                                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveDocument(docTypeKey, index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {Object.keys(uploadedDocuments).length === 0 && (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-lg">
                  <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">No documents uploaded yet</p>
                  <p className="text-sm text-slate-400">
                    Select a document type and upload files to get started
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AddCaptain;

