export type GuidelinesContent = {
  purpose: string
  requestSteps: string[]
  eventTypes: string[]
  eventTypesNote: string
  spaceRules: { label: string; value: string }[]
  requirementsIntro: string
  requirementsSteps: string[]
  coorganiserSteps: string[]
  conduct: string
}

export const DEFAULT_GUIDELINES: GuidelinesContent = {
  purpose:
    'Our space is designed to host events that foster community, learning, and collaboration. To ensure all gatherings align with our mission, please review the guidelines below.',
  requestSteps: [
    'Contact us at suihubathens@sui.io with a brief overview of your event needs (date, attendance estimate, operational needs, etc.).',
    'Submit requests at least 3 weeks in advance to ensure on-time preparation.',
    'The review process takes about a week.',
  ],
  eventTypes: [
    'Community meetups',
    'Educational workshops',
    'Hackathons / bootcamps',
    'Panel discussions / speaker panels',
  ],
  eventTypesNote: 'Private events or commercial use of SuiHub Athens is not permitted.',
  spaceRules: [
    { label: 'Capacity', value: '70 people seated max, 60 optimal (2nd floor)' },
    { label: 'Networking / Catering', value: 'Ground floor, Terrace (approval required)' },
    { label: 'Food & beverage', value: 'Up to the organizer' },
    {
      label: 'AV equipment',
      value:
        '2 handheld microphones, 1 on-ear microphone, audio surround system, acoustic panels, recording capabilities (confirm in advance)',
    },
    {
      label: 'Decorations / Branding',
      value: 'No adhesives or materials that could damage walls or floors',
    },
    {
      label: 'Pets',
      value:
        'Service animals always permitted; exotic or aggressive animals prohibited. Attendees bringing pets accept full liability.',
    },
  ],
  requirementsIntro: 'Our space is given free of charge, but certain guidelines must be followed:',
  requirementsSteps: [
    'The event must be open to all Sui employees who are based at SuiHub Athens.',
    'Each event agenda must include an introduction or presentation about Sui to ensure attendees gain insights into our community.',
  ],
  coorganiserSteps: [
    'Provide a point of contact for the event.',
    'Manage guest check-in.',
    'Availability to support event setup.',
  ],
  conduct:
    'We expect all event organisers and attendees to uphold a respectful, inclusive, and safe environment. Harassment or discriminatory behaviour will not be tolerated.',
}
