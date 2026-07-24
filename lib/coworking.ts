export type CoworkingContent = {
  hoursWeekdays: string
  hoursNote: string
  joinIntro: string
  registerUrl: string
  joinNote: string
  amenities: string[]
  whoIntro: string
  faq: { q: string; a: string }[]
}

export const DEFAULT_COWORKING: CoworkingContent = {
  hoursWeekdays: 'Monday – Friday | 10:00 AM – 7:00 PM',
  hoursNote: "We're closed on weekends and public holidays.",
  joinIntro: "Access is completely free. The only requirement is a quick registration so we can give you future updates.",
  registerUrl: 'https://tr.ee/CCVVf4yyQw',
  joinNote: "Once registered, you're welcome to drop in any time during our open hours. No booking needed.",
  amenities: [
    'Open desk seating',
    'Unlimited free coffee',
    'Snacks',
    'High-speed Wi-Fi',
    'A focused, community-driven atmosphere',
  ],
  whoIntro: "Whether you're a freelancer, student, remote worker, founder, or just need a change of scenery, you're welcome here. Our coworking space is designed to be inclusive, quiet, and productive.",
  faq: [
    { q: 'Do I need to book in advance?', a: 'No, just register once via the link above, then drop in whenever you like.' },
    { q: 'Is there a cost?', a: "Nope, it's completely free." },
    { q: 'Can I come every day?', a: "Absolutely. You're welcome as often as you'd like during open hours." },
    { q: 'What should I bring?', a: "Just yourself and your laptop. We've got the Wi-Fi and coffee covered." },
  ],
}
