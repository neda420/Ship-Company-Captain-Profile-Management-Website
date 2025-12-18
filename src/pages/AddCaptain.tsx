import { useState } from 'react';
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
  CheckCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useCaptains } from '../context/CaptainsContext';
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

const AddCaptain = () => {
  const navigate = useNavigate();
  const { goBack, canGoBack } = useNavigationHistory();
  const { addCaptain } = useCaptains();
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState<Partial<CaptainProfile>>({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
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

  const handleInputChange = (section: string, field: string, value: any) => {
    if (section === 'fullName' || section === 'title' || section === 'email' || 
        section === 'phone' || section === 'location' || section === 'status' || 
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
  };

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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, docTypeKey: string) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !docTypeKey) return;

    const fileArray = Array.from(files);
    const newFiles = fileArray.map(file => ({
      file,
      url: URL.createObjectURL(file), // Create preview URL
    }));

    setUploadedDocuments(prev => ({
      ...prev,
      [docTypeKey]: [...(prev[docTypeKey] || []), ...newFiles],
    }));

    // Update formData documents - store all file URLs for this document type
    setFormData(prev => {
      const existingUrls = (prev.documents?.[docTypeKey] as string)?.split(',').filter(Boolean) || [];
      const newUrls = newFiles.map(f => f.url);
      return {
        ...prev,
        documents: {
          ...prev.documents,
          [docTypeKey]: [...existingUrls, ...newUrls].join(','),
        },
      };
    });

    // Reset input
    event.target.value = '';
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

  const handleSubmit = () => {
    // Validate required fields
    if (!formData.fullName || !formData.email || !formData.title) {
      alert('Please fill in all required fields (Name, Email, Title)');
      return;
    }

    // Create new captain profile
    const newCaptain: CaptainProfile = {
      id: Date.now().toString(),
      fullName: formData.fullName!,
      title: formData.title!,
      email: formData.email!,
      phone: formData.phone || '',
      location: formData.location || '',
      status: formData.status || 'Available',
      avatarUrl: formData.avatarUrl || '/avatars/default.jpg',
      personalIdentity: formData.personalIdentity!,
      professionalInfo: formData.professionalInfo!,
      medicalInfo: formData.medicalInfo!,
      expiryDates: formData.expiryDates!,
      documents: formData.documents || {},
      licenses: formData.licenses || [],
      seaServiceHistory: formData.seaServiceHistory || [],
      skills: formData.skills || [],
      physicalSpecs: {
        heightCm: 0,
        weightKg: 0,
        bloodType: formData.medicalInfo?.bloodType || '',
        shoeSize: parseInt(formData.personalIdentity?.shoeSize || '0'),
        coverallSize: '',
      },
    };

    // Save to context (which persists to localStorage)
    addCaptain(newCaptain);
    alert('Captain profile created successfully!');
    navigate('/');
  };

  const FieldInput = ({ 
    label, 
    section, 
    field, 
    type = 'text', 
    required = false,
    icon: Icon 
  }: { 
    label: string; 
    section: string; 
    field: string; 
    type?: string;
    required?: boolean;
    icon?: any;
  }) => {
    let value = '';
    if (section === 'fullName' || section === 'title' || section === 'email' || 
        section === 'phone' || section === 'location' || section === 'avatarUrl') {
      value = (formData[section as keyof typeof formData] as string) || '';
    } else {
      value = (formData[section as keyof typeof formData] as any)?.[field] || '';
    }
    
    return (
      <div className="space-y-1">
        <label className="text-xs sm:text-sm font-medium text-slate-700 flex items-center gap-1">
          {Icon && <Icon className="w-3 h-3" />}
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <Input
          type={type}
          value={value}
          onChange={(e) => handleInputChange(section, field, e.target.value)}
          required={required}
          className="text-sm sm:text-base"
        />
      </div>
    );
  };

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
            onClick={handleSubmit}
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
          <FieldInput label="Full Name" section="fullName" field="fullName" required icon={User} />
          <FieldInput label="Title/Rank" section="title" field="title" required icon={Briefcase} />
          <FieldInput label="Email" section="email" field="email" type="email" required icon={Mail} />
          <FieldInput label="Phone" section="phone" field="phone" type="tel" icon={Phone} />
          <FieldInput label="Location" section="location" field="location" icon={MapPin} />
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
          <FieldInput label="Avatar URL" section="avatarUrl" field="avatarUrl" type="url" />
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
              <FieldInput label="Full Legal Name" section="personalIdentity" field="fullLegalName" icon={User} />
              <FieldInput label="Date of Birth" section="personalIdentity" field="dateOfBirth" type="date" icon={Calendar} />
              <FieldInput label="Place of Birth" section="personalIdentity" field="placeOfBirth" icon={MapPin} />
              <FieldInput label="Nationality" section="personalIdentity" field="nationality" />
              <div className="sm:col-span-2 lg:col-span-3">
                <FieldInput label="Permanent Home Address" section="personalIdentity" field="permanentHomeAddress" icon={MapPin} />
              </div>
              <FieldInput label="Emergency Contact Name" section="personalIdentity" field="emergencyContactName" />
              <FieldInput label="Emergency Contact Relationship" section="personalIdentity" field="emergencyContactRelationship" />
              <FieldInput label="Emergency Contact Phone" section="personalIdentity" field="emergencyContactPhoneNumber" type="tel" icon={Phone} />
              <FieldInput label="Emergency Contact Email" section="personalIdentity" field="emergencyContactEmail" type="email" icon={Mail} />
              <FieldInput label="Shirt Size" section="personalIdentity" field="shirtSize" />
              <FieldInput label="Pant Size" section="personalIdentity" field="pantSize" />
              <FieldInput label="Shoe Size" section="personalIdentity" field="shoeSize" />
              <FieldInput label="Hat Size" section="personalIdentity" field="hatSize" />
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
              <FieldInput label="CoC Number" section="professionalInfo" field="cocNumber" />
              <FieldInput label="Issuing Country" section="professionalInfo" field="issuingCountry" />
              <FieldInput label="Capacity (Rank)" section="professionalInfo" field="capacity" />
              <FieldInput label="License Limitations" section="professionalInfo" field="licenseLimitations" />
              <FieldInput label="Total Sea Time" section="professionalInfo" field="totalSeaTime" />
              <FieldInput label="Time in Rank" section="professionalInfo" field="timeInRank" />
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
              <FieldInput label="Bank IBAN" section="professionalInfo" field="bankIBAN" />
              <FieldInput label="Bank SWIFT" section="professionalInfo" field="bankSWIFT" />
              <FieldInput label="Currency Preference" section="professionalInfo" field="currencyPreference" />
              <FieldInput label="Nearest Airport" section="professionalInfo" field="nearestAirport" icon={MapPin} />
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
              <FieldInput label="Blood Type" section="medicalInfo" field="bloodType" />
              <FieldInput label="Known Allergies" section="medicalInfo" field="knownAllergies" />
              <FieldInput label="Dietary Restrictions" section="medicalInfo" field="dietaryRestrictions" />
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
              <FieldInput label="Passport Expiry Date" section="expiryDates" field="passportExpiryDate" type="date" icon={Calendar} />
              <FieldInput label="Visa Expiry Date" section="expiryDates" field="visaExpiryDate" type="date" icon={Calendar} />
              <FieldInput label="CoC Expiry Date" section="expiryDates" field="cocExpiryDate" type="date" icon={Calendar} />
              <FieldInput label="Flag State Endorsement Expiry" section="expiryDates" field="flagStateEndorsementExpiryDate" type="date" icon={Calendar} />
              <FieldInput label="Medical Certificate (ENG1) Expiry" section="expiryDates" field="medicalCertificateExpiryDate" type="date" icon={Calendar} />
              <FieldInput label="STCW Training Expiry Date" section="expiryDates" field="stcwTrainingExpiryDate" type="date" icon={Calendar} />
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
                    {DOCUMENT_TYPES.map((docType) => (
                      <option key={docType.key} value={docType.key}>
                        {docType.label}
                      </option>
                    ))}
                  </select>
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
                          onChange={(e) => handleFileUpload(e, selectedDocType)}
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors">
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
                            const event = e as unknown as React.ChangeEvent<HTMLInputElement>;
                            handleFileUpload(event, selectedDocType);
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

