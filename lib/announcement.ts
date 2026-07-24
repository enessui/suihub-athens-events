export type AnnouncementContent = {
  message: string
  url: string
  enabled: boolean
  bgColor: string
  textColor: string
}

export const DEFAULT_ANNOUNCEMENT: AnnouncementContent = {
  message: 'Sui Basecamp 2026  ·  October 7–8  ·  Marina Bay Sands, Singapore',
  url: 'https://www.sui.io/basecamp',
  enabled: true,
  bgColor: '#4da2ff',
  textColor: '#ffffff',
}
