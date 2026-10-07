import mongoose from 'mongoose'

const registrationSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    dateOfBirth: { type: Date, required: true },
    age: { type: Number, required: true, min: 5 },
    ageGroup: { type: String, required: true, enum: ['5-8', '9-12', '13-17', '18+'] },
    district: { type: String, required: true, trim: true, maxlength: 80 },
    school: { type: String, trim: true, maxlength: 100, default: '' },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, required: true, trim: true, minlength: 7, maxlength: 20 },
    competition: {
      type: String,
      required: true,
      enum: ['singing', 'dance', 'cooking', 'art', 'instrumental', 'storytelling'],
    },
    format: { type: String, required: true, enum: ['Solo', 'Duet', 'Group', 'Individual', 'Ensemble'] },
    consent: { type: Boolean, required: true, validate: (value) => value === true },
  },
  { timestamps: true },
)

export default mongoose.model('Registration', registrationSchema)
