const mongoose = require('mongoose');

const scholarshipSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Scholarship title is required'],
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Application deadline is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true
  },
  university: {
    type: String,
    required: [true, 'University is required'],
    trim: true
  },
  fundedBy: {
    type: String,
    required: [true, 'Funding source/type is required'],
    trim: true
  },
  degreeLevels: {
    type: [String],
    required: [true, 'Degree levels are required']
  },
  benefits: {
    type: String,
    required: [true, 'Scholarship benefits are required']
  },
  eligibilityCriteria: {
    type: String,
    required: [true, 'Eligibility criteria is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  studyArea: {
    type: String,
    required: [true, 'Study Area is required'],
    trim: true
  },
  thumbnail: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Scholarship = mongoose.model('Scholarship', scholarshipSchema);
module.exports = Scholarship;
