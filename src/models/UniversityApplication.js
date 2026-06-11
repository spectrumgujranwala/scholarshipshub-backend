const mongoose = require('mongoose');

const universityApplicationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  universityName: {
    type: String,
    required: [true, 'University name is required'],
  },
  programName: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['Pending', 'Applied', 'Interview', 'Accepted', 'Rejected', 'Withdrawn'],
    default: 'Pending',
  },
  appliedDate: {
    type: Date,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const UniversityApplication = mongoose.model('UniversityApplication', universityApplicationSchema);
module.exports = UniversityApplication;
