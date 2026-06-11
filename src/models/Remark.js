const mongoose = require('mongoose');

const remarkSchema = new mongoose.Schema({
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: false,
  },
  universityApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UniversityApplication',
    required: false,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  senderDesignation: {
    type: String,
    default: '',
  },
  content: {
    type: String,
    required: [true, 'Please add a comment'],
  },
  attachmentUrl: {
    type: String,
    default: '',
  },
  attachmentName: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

const Remark = mongoose.model('Remark', remarkSchema);
module.exports = Remark;
