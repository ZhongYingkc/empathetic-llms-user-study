export type RatingItem = {
  id: string
  prompt: string
  min: number
  max: number
}

const ratingPrompts = [
  'The system considered my mental state.',
  'The system seemed emotionally intelligent.',
  'The system expressed emotions.',
  'The system sympathized with me.',
  'The system showed interest in me.',
  'The system supported me in coping with an emotional situation.',
  'The system understood my goals.',
  'The system understood my needs.',
  'I trusted the system.',
  'The system understood my intentions.',
  'I am satisfied with this response.',
  'I would feel comfortable receiving this type of response.',
  'This response would make me more willing to interact with the system.',
]

export const ratingItems: RatingItem[] = ratingPrompts.map(
  (prompt, index) => ({
    id: `rating-item-${index + 1}`,
    prompt,
    min: 0,
    max: 100,
  }),
)

export const responseCount = 5

