import { useEffect, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  Clock3,
  CookingPot,
  Drama,
  Guitar,
  Heart,
  Menu,
  Mic2,
  Palette,
  Sparkles,
  Trophy,
  UsersRound,
  X,
} from 'lucide-react'
import Swal from 'sweetalert2'

const API_BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
  || (import.meta.env.DEV ? '' : 'https://pratibha-kaira-tech.onrender.com')

const competitions = [
  {
    id: 'singing',
    name: 'Singing',
    detail: 'Find your voice',
    description: 'Share a favourite song, perform a melody you love, or sing with a friend. Bring your own accompaniment or perform a cappella.',
    icon: Mic2,
    color: 'lavender',
    formats: 'Solo · Duet',
  },
  {
    id: 'dance',
    name: 'Dance',
    detail: 'Move your way',
    description: 'Bring a solo routine or gather a group and make the stage your own. Choose any dance style that feels right to you.',
    icon: Drama,
    color: 'peach',
    formats: 'Solo · Group',
  },
  {
    id: 'cooking',
    name: 'Cooking',
    detail: 'Make a little magic',
    description: 'Show us a dish you love to make and the story behind it. Participants prepare and present their creation individually.',
    icon: CookingPot,
    color: 'butter',
    formats: 'Individual',
  },
  {
    id: 'art',
    name: 'Art & craft',
    detail: 'Make ideas visible',
    description: 'Turn your imagination into something you can share. Create a piece of art or craft and tell us what inspired it.',
    icon: Palette,
    color: 'mint',
    formats: 'Individual',
  },
  {
    id: 'instrumental',
    name: 'Instrumental',
    detail: 'Let the music speak',
    description: 'Play an instrument you love, on your own or as an ensemble. All instruments and musical styles are welcome.',
    icon: Guitar,
    color: 'blue',
    formats: 'Solo · Ensemble',
  },
  {
    id: 'storytelling',
    name: 'Storytelling',
    detail: 'Stories belong on stage',
    description: 'Bring a story to life with your voice, expression, and imagination. Choose an original tale or a favourite story.',
    icon: Sparkles,
    color: 'rose',
    formats: 'Individual',
  },
]

const ageGroups = [
  { id: '5-8', label: 'Little stars', years: '5–8 years' },
  { id: '9-12', label: 'Rising stars', years: '9–12 years' },
  { id: '13-17', label: 'Young achievers', years: '13–17 years' },
  { id: '18+', label: 'Open category', years: '18 years & above' },
]

const sweetAlertClasses = {
  popup: 'festival-swal-popup',
  title: 'festival-swal-title',
  htmlContainer: 'festival-swal-content',
  confirmButton: 'festival-swal-confirm',
  cancelButton: 'festival-swal-cancel',
}

const initialForm = {
  fullName: '',
  dateOfBirth: '',
  district: '',
  school: '',
  email: '',
  phone: '',
  competition: '',
  format: '',
  consent: false,
}

function getAge(dateString) {
  if (!dateString) return null
  const today = new Date()
  const birthDate = new Date(`${dateString}T00:00:00Z`)
  if (Number.isNaN(birthDate.getTime()) || birthDate > today) return null
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear()
  const monthDifference = today.getUTCMonth() - birthDate.getUTCMonth()
  if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < birthDate.getUTCDate())) age -= 1
  return age
}

function getAgeGroup(age) {
  if (age === null || age < 5) return ''
  if (age <= 8) return '5-8'
  if (age <= 12) return '9-12'
  if (age <= 17) return '13-17'
  return '18+'
}

function getRegistrationProgress(form, age) {
  const selectedCompetition = competitions.find((item) => item.id === form.competition)
  const checks = [
    form.fullName.trim().length >= 2,
    age !== null && age >= 5,
    Boolean(form.district.trim()),
    /^\S+@\S+\.\S+$/.test(form.email.trim()),
    form.phone.trim().length >= 7,
    Boolean(selectedCompetition),
    Boolean(selectedCompetition?.formats.split(' · ').includes(form.format)),
    form.consent,
  ]
  const completed = checks.filter(Boolean).length
  return { completed, total: checks.length, percent: Math.round((completed / checks.length) * 100) }
}

async function requestRegistrationCounts() {
  const response = await fetch(`${API_BASE_URL}/api/registrations/counts`)
  const result = await response.json().catch(() => ({}))
  if (!response.ok || !result.counts || typeof result.counts !== 'object') {
    throw new Error(result.message || 'Registration counts are unavailable right now.')
  }
  const counts = Object.fromEntries(competitions.map(({ id }) => {
    const count = result.counts[id]
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new Error('The server returned invalid registration counts.')
    }
    return [id, count]
  }))
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  if (result.total !== total) throw new Error('The server returned inconsistent registration counts.')
  return { counts, total }
}

function Brand({ onClick }) {
  return (
    <a className="brand" href="#home" onClick={onClick} aria-label="Pratibha home">
      <span className="brand-mark"><Sparkles size={17} strokeWidth={1.8} /></span>
      <span>pratibha<span className="brand-period">.</span></span>
    </a>
  )
}

function App() {
  const [form, setForm] = useState(initialForm)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showMobileRegister, setShowMobileRegister] = useState(false)
  const [submission, setSubmission] = useState({ status: 'idle', message: '' })
  const [registrationCounts, setRegistrationCounts] = useState({ status: 'loading', counts: {}, total: 0 })
  const age = getAge(form.dateOfBirth)
  const ageGroup = getAgeGroup(age)
  const selectedCompetition = competitions.find((item) => item.id === form.competition)
  const registrationProgress = getRegistrationProgress(form, age)

  useEffect(() => {
    const revealItems = document.querySelectorAll('[data-reveal]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('reveal-visible'))
      return undefined
    }

    const observer = new IntersectionObserver((entries, activeObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible')
          activeObserver.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' })

    revealItems.forEach((item) => {
      item.classList.add('reveal-item')
      observer.observe(item)
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let isActive = true
    requestRegistrationCounts()
      .then((result) => {
        if (isActive) setRegistrationCounts({ status: 'loaded', counts: result.counts, total: result.total })
      })
      .catch(() => {
        if (isActive) setRegistrationCounts((current) => ({ ...current, status: 'unavailable' }))
      })
    return () => { isActive = false }
  }, [])

  useEffect(() => {
    const registrationSection = document.getElementById('register')
    if (!registrationSection) return undefined

    let registrationIsVisible = false
    const updateVisibility = () => {
      setShowMobileRegister(window.scrollY > 520 && !registrationIsVisible)
    }
    const observer = new IntersectionObserver(([entry]) => {
      registrationIsVisible = entry.isIntersecting
      updateVisibility()
    }, { threshold: 0.08 })

    observer.observe(registrationSection)
    window.addEventListener('scroll', updateVisibility, { passive: true })
    updateVisibility()

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', updateVisibility)
    }
  }, [])

  function updateForm(event) {
    const { name, value, checked, type } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'competition' ? { format: '' } : {}),
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    if (!formElement.checkValidity()) {
      const invalidField = formElement.querySelector(':invalid')
      await Swal.fire({
        icon: 'info',
        title: 'A little more to go',
        text: invalidField?.validationMessage || 'Please complete the required fields.',
        confirmButtonText: 'Review form',
        customClass: sweetAlertClasses,
      })
      invalidField?.focus()
      return
    }
    if (age !== null && age < 5) {
      setSubmission({ status: 'error', message: 'Participants must be at least 5 years old.' })
      await Swal.fire({
        icon: 'warning',
        title: 'Age requirement',
        text: 'Participants must be at least 5 years old to register.',
        confirmButtonText: 'Review date of birth',
        customClass: sweetAlertClasses,
      })
      return
    }
    setSubmission({ status: 'loading', message: '' })
    Swal.fire({
      title: 'Saving your spot…',
      text: 'Please wait while we submit your registration.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      customClass: sweetAlertClasses,
      didOpen: () => Swal.showLoading(),
    })
    try {
      const response = await fetch(`${API_BASE_URL}/api/registrations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, age, ageGroup }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(result.message || 'We could not complete your registration.')
      Swal.close()
      setSubmission({
        status: 'success',
        message: `You're on the list, ${form.fullName.split(' ')[0]}! Your registration ID is ${result.registrationId}.`,
      })
      await Swal.fire({
        icon: 'success',
        title: 'You’re registered!',
        text: `Your registration ID is ${result.registrationId}. We’ve saved your details.`,
        confirmButtonText: 'Lovely',
        customClass: sweetAlertClasses,
      })
      setForm(initialForm)
      requestRegistrationCounts()
        .then((counts) => setRegistrationCounts({ status: 'loaded', counts: counts.counts, total: counts.total }))
        .catch(() => setRegistrationCounts((current) => ({ ...current, status: 'unavailable' })))
    } catch (error) {
      Swal.close()
      const message = error instanceof TypeError
        ? 'We couldn’t reach the registration server. Make sure the backend is running on port 5000, then try again.'
        : error.message
      setSubmission({ status: 'error', message })
      await Swal.fire({
        icon: 'error',
        title: 'Registration not saved',
        text: message,
        confirmButtonText: 'Try again',
        customClass: sweetAlertClasses,
      })
    }
  }

  async function openCompetition(competition) {
    const result = await Swal.fire({
      icon: 'info',
      title: competition.name,
      text: `${competition.description}\n\nFormats: ${competition.formats}\nAge groups: 5–8, 9–12, 13–17, and 18+ years.`,
      showCancelButton: true,
      confirmButtonText: 'Choose this competition',
      cancelButtonText: 'Keep exploring',
      customClass: sweetAlertClasses,
    })
    if (result.isConfirmed) selectCompetition(competition.id)
  }

  function selectCompetition(id) {
    setForm((current) => ({ ...current, competition: id, format: '' }))
    setSubmission({ status: 'idle', message: '' })
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div id="home" className="page-shell min-h-screen bg-cream text-ink">
      <div className="announcement">
        <Sparkles size={14} />
        <span>Make room for a little extraordinary</span>
        <span className="announcement-separator">·</span>
        <span>2026 registrations are open</span>
        <a href="#register" aria-label="Register now"><ArrowRight size={15} /></a>
      </div>

      <header className="site-header">
        <div className="nav-wrap">
          <Brand onClick={() => setMobileMenuOpen(false)} />
          <nav className={mobileMenuOpen ? 'nav-links nav-links-open' : 'nav-links'} aria-label="Main navigation">
            <a href="#competitions" onClick={() => setMobileMenuOpen(false)}>Competitions</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How it works</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>About</a>
            <a className="nav-cta" href="#register" onClick={() => setMobileMenuOpen(false)}>
              Register now <ArrowUpRight size={15} />
            </a>
          </nav>
          <button className="menu-toggle" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMobileMenuOpen((open) => !open)}>
            {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero section-wrap">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-line" /> THE STATEWIDE YOUTH FESTIVAL · 2026</div>
            <h1>Every talent<br />deserves <span>a stage.</span></h1>
            <p className="hero-description">A joyful gathering of young minds, big ideas and brilliant performances. Your moment starts right here.</p>
            <div className="hero-actions">
              <a className="button-primary" href="#competitions">Explore competitions <ArrowRight size={17} /></a>
              <a className="button-link" href="#register">I know what I want <ArrowDown size={15} /></a>
            </div>
            <div className="hero-note"><span className="note-sparkle"><Sparkles size={15} /></span> For curious kids, brave beginners & future stars</div>
          </div>

          <div className="hero-art" aria-label="Illustration of a festival stage">
            <div className="art-sun" />
            <div className="art-spark art-spark-one">✳</div>
            <div className="art-spark art-spark-two">✦</div>
            <div className="art-stage">
              <div className="stage-curtain stage-curtain-left" />
              <div className="stage-curtain stage-curtain-right" />
              <div className="stage-glow" />
              <div className="stage-person">
                <div className="person-head" />
                <div className="person-body" />
                <div className="person-arm" />
                <div className="person-mic"><Mic2 size={22} /></div>
              </div>
              <div className="stage-floor" />
            </div>
            <div className="hero-sticker">
              <span className="sticker-icon"><Heart size={16} fill="currentColor" /></span>
              <span>made for<br /><strong>your moment</strong></span>
            </div>
            <div className="art-caption"><span className="caption-dot" /> ONE STATE. MANY SPOTLIGHTS.</div>
          </div>
          <a className="scroll-cue" href="#competitions"><span>SCROLL TO EXPLORE</span><ArrowDown size={15} /></a>
        </section>

        <section className="quick-facts" aria-label="Festival highlights" data-reveal>
          <div className="facts-wrap">
            <div className="fact"><span className="fact-icon"><Trophy size={19} /></span><span><strong>6 ways to shine</strong><small>Pick what you love</small></span></div>
            <div className="fact"><span className="fact-icon"><UsersRound size={19} /></span><span><strong>Every age welcome</strong><small>Age-wise categories</small></span></div>
            <div className="fact"><span className="fact-icon"><Sparkles size={19} /></span><span><strong>Made for everyone</strong><small>All experience levels</small></span></div>
            <div className="fact"><span className="fact-icon"><Clock3 size={19} /></span><span><strong>Quick & easy</strong><small>Register in a few minutes</small></span></div>
          </div>
        </section>

        <section id="competitions" className="competitions-section section-wrap" data-reveal>
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE SOMETHING FOR EVERYONE</div>
              <h2>What makes you<br />come <span>alive?</span></h2>
            </div>
            <div className="competition-intro">
              <p>Follow your curiosity. Whether you love the spotlight or making things with your hands, there’s a place for you here.</p>
              <span className={`live-count-summary ${registrationCounts.status === 'loaded' ? 'live-count-ready' : ''}`}>
                <span className="live-count-dot" />
                {registrationCounts.status === 'loading'
                  ? 'Checking registrations…'
                  : registrationCounts.status === 'unavailable'
                    ? 'Live registrations temporarily unavailable'
                    : registrationCounts.total === 0
                      ? 'Be the first to register'
                      : `${registrationCounts.total.toLocaleString()} ${registrationCounts.total === 1 ? 'participant' : 'participants'} registered`}
              </span>
            </div>
          </div>
          <div className="competition-grid">
            {competitions.map(({ id, name, detail, icon: Icon, color, formats }, index) => (
              <button className={`competition-card ${color} ${form.competition === id ? 'competition-card-selected' : ''}`} key={id} onClick={() => openCompetition(competitions[index])} aria-label={`View ${name} competition details`} aria-pressed={form.competition === id}>
                <div className="card-topline"><span className="card-number">0{index + 1}</span><span className={`category-registration-count ${registrationCounts.status}`} aria-label={registrationCounts.status === 'loaded' ? `${registrationCounts.counts[id]} registered in ${name}` : undefined}>{registrationCounts.status === 'loading' ? 'Checking…' : registrationCounts.status === 'unavailable' ? 'Count unavailable' : `${registrationCounts.counts[id].toLocaleString()} registered`}</span><span className="card-arrow"><ArrowUpRight size={17} /></span></div>
                <div className="competition-icon"><Icon size={25} strokeWidth={1.6} /></div>
                <h3>{name}</h3>
                <p>{detail}</p>
                <div className="card-bottom"><span>{formats}</span><span className="tiny-arrow"><ArrowRight size={14} /></span></div>
              </button>
            ))}
          </div>
          <div className="age-note"><span className="age-note-icon"><UsersRound size={17} /></span><span>Every competition has age-wise groups, so everyone gets a fair chance to shine.</span><a href="#register">See age groups <ArrowRight size={14} /></a></div>
        </section>

        <section id="how-it-works" className="journey-section" data-reveal>
          <div className="journey-wrap section-wrap">
            <div className="journey-heading">
              <div>
                <div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT CHAPTER</div>
                <h2>Three little steps.<br /><span>One big memory.</span></h2>
              </div>
              <p>From your first idea to your festival moment, we’ll help you find your way.</p>
            </div>
            <div className="steps" aria-label="Three steps to join the festival">
              <a className="step" href="#competitions">
                <span className="step-top"><span className="step-number">STEP 01</span><span className="step-icon"><Sparkles size={21} /></span></span>
                <span className="step-copy"><strong>Choose your thing</strong><span>Pick the competition that feels most like you.</span></span>
                <span className="step-action">Explore competitions <ArrowUpRight size={15} /></span>
              </a>
              <a className="step" href="#register">
                <span className="step-top"><span className="step-number">STEP 02</span><span className="step-icon"><UsersRound size={21} /></span></span>
                <span className="step-copy"><strong>Tell us about you</strong><span>We’ll match your age group from your birthday.</span></span>
                <span className="step-action">Find your age group <ArrowUpRight size={15} /></span>
              </a>
              <a className="step" href="#register">
                <span className="step-top"><span className="step-number">STEP 03</span><span className="step-icon"><Trophy size={21} /></span></span>
                <span className="step-copy"><strong>Get ready to shine</strong><span>We’ll be in touch with what happens next.</span></span>
                <span className="step-action">Save your spot <ArrowUpRight size={15} /></span>
              </a>
            </div>
          </div>
        </section>

        <section id="register" className="register-section section-wrap" data-reveal>
          <div className="register-aside">
            <div className="eyebrow"><span className="eyebrow-line" /> SAVE YOUR SPOT</div>
            <h2>Your stage<br />is <span>waiting.</span></h2>
            <p>A parent or guardian can help younger participants fill this out. It only takes a couple of minutes.</p>
            <div className="age-groups">
              <h3>Age groups</h3>
              {ageGroups.map((group) => (
                <div className={`age-group-row ${ageGroup === group.id ? 'age-group-active' : ''}`} key={group.id}>
                  <span>{group.label}</span><span>{group.years}</span>{ageGroup === group.id && <Check size={15} />}
                </div>
              ))}
              <small>Your group is matched automatically from your date of birth.</small>
            </div>
            <div className="register-decoration"><Sparkles size={27} /><span>There’s no “too early”<br />for your first big moment.</span></div>
          </div>
          <div className="form-card">
            <div className="form-card-heading">
              <div><span className="form-kicker">2026 FESTIVAL</span><h3>Let’s get you registered</h3></div>
              <span className="form-time"><Clock3 size={13} /> A few minutes</span>
            </div>
            <div className="registration-progress" aria-live="polite">
              <div className="progress-copy"><span><strong>{registrationProgress.completed} of {registrationProgress.total}</strong> required details complete</span><span>{registrationProgress.percent}%</span></div>
              <div className="progress-track" role="progressbar" aria-label="Registration form completion" aria-valuemin="0" aria-valuemax={registrationProgress.total} aria-valuenow={registrationProgress.completed}>
                <span style={{ width: `${registrationProgress.percent}%` }} />
              </div>
              <p>{registrationProgress.completed === registrationProgress.total ? 'You’re all set—submit when you’re ready.' : 'Your progress updates as you fill in the required details.'}</p>
            </div>
            {submission.status === 'success' && (
              <div className="form-message success-message" role="status"><CircleCheck size={19} /><span>{submission.message}</span></div>
            )}
            {submission.status === 'error' && (
              <div className="form-message error-message" role="alert"><X size={18} /><span>{submission.message}</span></div>
            )}
            <form noValidate onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="field full-field">
                  <span>Participant’s full name <b>*</b></span>
                  <input name="fullName" value={form.fullName} onChange={updateForm} placeholder="As you’d like it on your certificate" required minLength="2" maxLength="80" autoComplete="name" />
                </label>
                <label className="field">
                  <span>Date of birth <b>*</b></span>
                  <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateForm} required max={new Date().toISOString().split('T')[0]} />
                </label>
                <div className="field age-field">
                  <span>Age group</span>
                  <div className="age-display">{ageGroup ? <><span>{ageGroups.find((group) => group.id === ageGroup)?.label}</span><small>{ageGroups.find((group) => group.id === ageGroup)?.years}</small></> : age !== null ? <span className="age-ineligible">5 years minimum</span> : <span className="placeholder">Added automatically</span>}<ChevronDown size={16} /></div>
                </div>
                <label className="field">
                  <span>District <b>*</b></span>
                  <input name="district" value={form.district} onChange={updateForm} placeholder="Your district" required maxLength="80" autoComplete="address-level2" />
                </label>
                <label className="field">
                  <span>School / organisation <small>Optional</small></span>
                  <input name="school" value={form.school} onChange={updateForm} placeholder="Where you learn or create" maxLength="100" autoComplete="organization" />
                </label>
                <label className="field">
                  <span>Email address <b>*</b></span>
                  <input name="email" type="email" value={form.email} onChange={updateForm} placeholder="you@example.com" required maxLength="254" autoComplete="email" />
                </label>
                <label className="field">
                  <span>Phone number <b>*</b></span>
                  <input name="phone" type="tel" value={form.phone} onChange={updateForm} placeholder="A number we can reach you on" required minLength="7" maxLength="20" autoComplete="tel" />
                </label>
                <label className="field">
                  <span>Competition <b>*</b></span>
                  <select name="competition" value={form.competition} onChange={updateForm} required>
                    <option value="">Choose your competition</option>
                    {competitions.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="field">
                  <span>Performance format <b>*</b></span>
                  <select name="format" value={form.format} onChange={updateForm} required disabled={!selectedCompetition}>
                    <option value="">{selectedCompetition ? 'Choose a format' : 'Choose a competition first'}</option>
                    {selectedCompetition?.formats.split(' · ').map((format) => <option key={format} value={format}>{format}</option>)}
                  </select>
                </label>
              </div>
              <label className="consent">
                <input type="checkbox" name="consent" checked={form.consent} onChange={updateForm} required />
                <span className="custom-check"><Check size={13} /></span>
                <span>I confirm the details are correct and, if the participant is under 18, a parent or guardian has approved this registration.</span>
              </label>
              <button className="submit-button" type="submit" disabled={submission.status === 'loading'}>
                {submission.status === 'loading' ? 'Saving your spot…' : 'Complete registration'} <ArrowRight size={17} />
              </button>
              <p className="privacy-note"><span className="privacy-dot" /> Your details are only used to manage festival registration.</p>
            </form>
          </div>
        </section>

        <section id="about" className="closing-banner section-wrap" data-reveal>
          <span className="closing-icon"><Sparkles size={22} /></span>
          <div><h2>Whatever your thing is,<br />there’s room for it here.</h2><p>Come as you are. Leave a little more confident.</p></div>
          <a className="closing-cta" href="#register">Save your spot <ArrowRight size={16} /></a>
          <div className="closing-flower flower-one">✳</div><div className="closing-flower flower-two">✦</div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-wrap section-wrap">
          <Brand />
          <span>Big dreams start somewhere small.</span>
          <span className="footer-copyright">© 2026 Pratibha Festival</span>
        </div>
      </footer>
      <a
        className={`mobile-register-cta ${showMobileRegister ? 'mobile-register-visible' : ''}`}
        href="#register"
        aria-hidden={!showMobileRegister}
        tabIndex={showMobileRegister ? 0 : -1}
      >
        <span><strong>Ready when you are</strong><small>Registration takes a few minutes</small></span>
        <span className="mobile-register-action">Register <ArrowRight size={16} /></span>
      </a>
    </div>
  )
}

export default App
