//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.get('/', (req, res) => {
  res.redirect('/start')
})

router.get('/start', (req, res) => {
  res.render('start')
})

router.get('/destination', (req, res) => {
  const error = req.session.data._destinationError
  delete req.session.data._destinationError
  const errorList = error ? [{ text: error, href: '#destination' }] : []

  res.render('destination', { error, errorList })
})

router.post('/destination-answer', (req, res) => {
  const destination = req.session.data.destination

  if (!['moon', 'mars'].includes(destination)) {
    req.session.data._destinationError = 'Select a destination'
    return res.redirect('/destination')
  }

  delete req.session.data._destinationError
  res.redirect(`/journey/${destination}`)
})

router.get('/journey/moon', (req, res) => {
  if (req.session.data.destination !== 'moon') {
    return res.redirect(req.session.data.destination === 'mars' ? '/journey/mars' : '/destination')
  }

  res.render('destination-journey', { destinationName: 'the Moon' })
})

router.get('/journey/mars', (req, res) => {
  if (req.session.data.destination !== 'mars') {
    return res.redirect(req.session.data.destination === 'moon' ? '/journey/moon' : '/destination')
  }

  res.render('destination-journey', { destinationName: 'Mars' })
})

router.post('/journey-answer', (req, res) => {
  if (!['moon', 'mars'].includes(req.session.data.destination)) {
    return res.redirect('/destination')
  }

  res.redirect('/name')
})

router.get('/name', (req, res) => {
  if (!['moon', 'mars'].includes(req.session.data.destination)) {
    return res.redirect('/destination')
  }

  const error = req.session.data._nameError
  delete req.session.data._nameError
  const errorList = error ? [{ text: error, href: '#full-name' }] : []

  res.render('name', {
    error,
    errorList,
    backHref: `/journey/${req.session.data.destination}`
  })
})

router.post('/name-answer', (req, res) => {
  const fullName = req.session.data['full-name']

  if (!fullName || !fullName.trim()) {
    req.session.data._nameError = 'Enter your full name'
    return res.redirect('/name')
  }

  delete req.session.data._nameError
  res.redirect('/address')
})

router.get('/address', (req, res) => {
  if (!req.session.data['full-name']) {
    return res.redirect('/name')
  }

  const errors = req.session.data._addressErrors || {}
  delete req.session.data._addressErrors
  const errorList = Object.entries(errors).map(([field, text]) => ({
    text,
    href: `#${field}`
  }))

  res.render('address', { errors, errorList })
})

router.post('/address-answer', (req, res) => {
  const requiredFields = [
    ['address-line-1', 'Enter address line 1'],
    ['town-or-city', 'Enter a town or city'],
    ['postcode', 'Enter a postcode']
  ]
  const errors = {}

  requiredFields.forEach(([field, message]) => {
    const value = req.session.data[field]
    if (!value || !value.trim()) {
      errors[field] = message
    }
  })

  if (Object.keys(errors).length) {
    req.session.data._addressErrors = errors
    return res.redirect('/address')
  }

  delete req.session.data._addressErrors
  res.redirect('/check-answers')
})

router.get('/check-answers', (req, res) => {
  const requiredFields = ['destination', 'full-name', 'address-line-1', 'town-or-city', 'postcode']
  const hasAllRequiredAnswers = requiredFields.every(field => {
    const value = req.session.data[field]
    return typeof value === 'string' && value.trim()
  })

  if (!hasAllRequiredAnswers) {
    if (!req.session.data.destination) return res.redirect('/destination')
    if (!req.session.data['full-name']) return res.redirect('/name')
    return res.redirect('/address')
  }

  res.render('check-answers')
})

router.post('/submit-application', (req, res) => {
  if (req.session.data._applicationSubmitted) return res.redirect('/confirmation')

  const requiredFields = ['destination', 'full-name', 'address-line-1', 'town-or-city', 'postcode']
  const hasAllRequiredAnswers = requiredFields.every(field => {
    const value = req.session.data[field]
    return typeof value === 'string' && value.trim()
  })

  if (!hasAllRequiredAnswers) return res.redirect('/check-answers')

  req.session.data._applicationSubmitted = true
  res.redirect('/confirmation')
})

router.get('/confirmation', (req, res) => {
  if (!req.session.data._applicationSubmitted) return res.redirect('/check-answers')

  res.render('confirmation')
})
