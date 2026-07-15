export const questionnaireItems = [
  'When I want to feel more positive emotion (such as joy or amusement), I change what I’m thinking about.',
  'I keep my emotions to myself.',
  'When I want to feel less negative emotion (such as sadness or anger), I change what I’m thinking about.',
  'When I am feeling positive emotions, I am careful not to express them.',
  'When I’m faced with a stressful situation, I make myself think about it in a way that helps me stay calm.',
  'I control my emotions by not expressing them.',
  'When I want to feel more positive emotion, I change the way I’m thinking about the situation.',
  'I control my emotions by changing the way I think about the situation I’m in.',
  'When I am feeling negative emotions, I make sure not to express them.',
  'When I want to feel less negative emotion, I change the way I’m thinking about the situation.',
] as const

export const questionnaires = [1, 2, 3].map((number) => ({
  number,
  eyebrow: 'PRE-STUDY QUESTIONNAIRE',
  title: `QUESTIONNAIRE ${number}`,
  items: questionnaireItems.map((prompt, itemIndex) => ({
    id: `questionnaire-${number}-item-${itemIndex + 1}`,
    prompt,
  })),
}))

export const questionnaireCount = questionnaires.length

