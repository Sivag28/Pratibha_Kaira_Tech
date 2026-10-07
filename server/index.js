import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import mongoose from 'mongoose'
import Registration from './models/Registration.js'

const app = express()
const port = Number(process.env.PORT) || 5000
const competitionFormats = {
  singing: ['Solo', 'Duet'],
  dance: ['Solo', 'Group'],
  cooking: ['Individual'],
  art: ['Individual'],
  instrumental: ['Solo', 'Ensemble'],
  storytelling: ['Individual'],
}

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '10kb' }))

function parseDateOfBirth(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const birthDate = new Date(Date.UTC(year, month - 1, day))
  return birthDate.toISOString().slice(0, 10) === value ? birthDate : null
}

function calculateAge(birthDate) {
  const today = new Date()
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear()
  const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth()
  if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())) age -= 1
  return age
}

function getAgeGroup(age) {
  if (age < 5) return null
  if (age <= 8) return '5-8'
  if (age <= 12) return '9-12'
  if (age <= 17) return '13-17'
  return '18+'
}

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' })
})

app.get('/api/registrations/counts', async (_request, response, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return response.status(503).json({ message: 'Registration counts are temporarily unavailable.' })
    }

    const groupedCounts = await Registration.aggregate([
      { $group: { _id: '$competition', count: { $sum: 1 } } },
    ])
    const counts = Object.fromEntries(Object.keys(competitionFormats).map((competition) => [competition, 0]))
    groupedCounts.forEach(({ _id, count }) => {
      if (Object.hasOwn(counts, _id)) counts[_id] = count
    })

    return response.json({
      counts,
      total: Object.values(counts).reduce((sum, count) => sum + count, 0),
    })
  } catch (error) {
    return next(error)
  }
})

app.post('/api/registrations', async (request, response, next) => {
  try {
    const { fullName, dateOfBirth, district, school, email, phone, competition, format, consent } = request.body ?? {}
    const birthDate = parseDateOfBirth(dateOfBirth)
    if (!birthDate || birthDate > new Date()) {
      return response.status(400).json({ message: 'Enter a valid date of birth.' })
    }

    const age = calculateAge(birthDate)
    const ageGroup = getAgeGroup(age)
    if (!ageGroup) return response.status(400).json({ message: 'Participants must be at least 5 years old.' })
    if (!consent) return response.status(400).json({ message: 'Parent or guardian approval is required.' })
    if (!Object.hasOwn(competitionFormats, competition) || !competitionFormats[competition].includes(format)) {
      return response.status(400).json({ message: 'Choose a valid format for the selected competition.' })
    }
    if (mongoose.connection.readyState !== 1) {
      return response.status(503).json({ message: 'The database is not connected. Please try again after the server reconnects.' })
    }

    const registration = await Registration.create({
      fullName,
      dateOfBirth: birthDate,
      age,
      ageGroup,
      district,
      school,
      email,
      phone,
      competition,
      format,
      consent,
    })

    return response.status(201).json({
      message: 'Registration complete.',
      registrationId: registration._id.toString(),
    })
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return response.status(400).json({ message: 'Please check the registration details and try again.' })
    }
    return next(error)
  }
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ message: 'Something went wrong while saving your registration. Please try again.' })
})

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing. Add your MongoDB Atlas connection string to .env.')
  }
  await mongoose.connect(process.env.MONGODB_URI)
  app.listen(port, () => console.log(`Registration API listening on http://localhost:${port}`))
}

startServer().catch((error) => {
  console.error(`Unable to start the registration API: ${error.message}`)
  process.exitCode = 1
})
