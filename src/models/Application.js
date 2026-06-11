const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'under_review', 'shortlisted', 'accepted', 'rejected'],
    default: 'draft',
  },
  completionPercentage: {
    type: Number,
    default: 0,
  },
  // 1. Applicant Information
  applicantInfo: {
    firstName: String,
    lastName: String,
    dob: Date,
    gender: String,
    nationality: String,
    cnic: String,
    photo: String, // Firebase URL
  },
  // 2. Contact Details
  contactDetails: {
    phone: String,
    alternatePhone: String,
    email: String,
    address: String,
    city: String,
    country: String,
  },
  // 3. Parents / Guardian Information
  guardianInfo: {
    fatherName: String,
    motherName: String,
    guardianPhone: String,
    guardianEmail: String,
    occupation: String,
  },
  // 4. Academic Background
  academicBackground: [{
    degree: String,
    institution: String,
    field: String,
    year: String,
    cgpa: String,
  }],
  // 5. Program Information
  programInfo: {
    programType: { type: String, enum: ['PhD', 'Postdoctoral'] },
    proposedField: String,
    supervisorName: String,
    intakeYear: String,
  },
  // 6. Research & Professional Experience
  researchExperience: {
    publications: [{
      title: String,
      journalType: { type: String, enum: ['International', 'Local'] }
    }],
    workExperience: String,
    researchStatement: String,
  },
  // 7. English Language Proficiency
  englishProficiency: {
    testType: String,
    score: String,
    dateOfTest: Date,
    expiryDate: Date,
    certificateUrl: String,
  },
  // 8. Funding Information
  fundingInfo: {
    fundingType: String,
    details: String,
  },
  // 9. Referees Section
  referees: [{
    name: String,
    designation: String,
    institution: String,
    email: String,
    phone: String,
    relation: String,
  }],
  // 10. Document Upload Module
  documents: {
    cv: String,
    sop: String,
    transcript: String,
    passport: String,
    englishCert: String,
    others: [String],
  },
  // 11. Declaration & Final Submission
  declaration: {
    isAgreed: { type: Boolean, default: false },
    signature: String,
    date: Date,
  },
  profileStrength: {
    type: Number,
    default: 0,
  },
  submittedAt: Date,
}, {
  timestamps: true,
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;
