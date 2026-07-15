type QuestionnaireDefinition = {
  number: number
  name: string
  eyebrow: string
  title: string
  scaleMax: number
  items: Array<{
    id: string
    prompt: string
  }>
}

const relationshipStructuresItems = [
  'It helps to turn to people in times of need.',
  'I usually discuss my problems and concerns with others.',
  'I talk things over with people.',
  'I find it easy to depend on others.',
  "I don't feel comfortable opening up to others.",
  'I prefer not to show others how I feel deep down.',
  'I often worry that other people do not really care for me.',
  "I'm afraid that other people may abandon me.",
  "I worry that others won't care about me as much as I care about them.",
]

const basicEmpathyItems = [
  "My friends' emotions don't affect me much.",
  'After being with a friend who is sad about something, I usually feel sad.',
  "I can understand my friend's happiness when she/he does well at something.",
  'I get frightened when I watch characters in a good scary movie.',
  "I get caught up in other people's feelings easily.",
  'I find it hard to know when my friends are frightened.',
  "I don't become sad when I see other people crying.",
  "Other people's feelings don't bother me at all.",
  'When someone is feeling down I can usually understand how they feel.',
  'I can usually work out when my friends are scared.',
  'I often become sad when watching sad things on TV or in films.',
  'I can often understand how people are feeling even before they tell me.',
  'Seeing a person who has been angered has no effect on my feelings.',
  'I can usually work out when people are cheerful.',
  'I tend to feel scared when I am with friends who are afraid.',
  'I can usually realise quickly when a friend is angry.',
  "I often get swept up in my friend's feelings.",
  "My friend's unhappiness doesn't make me feel anything.",
  "I am not usually aware of my friend's feelings.",
  'I have trouble figuring out when my friends are happy.',
]

const emotionRegulationItems = [
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
]

const createItems = (questionnaireNumber: number, prompts: string[]) =>
  prompts.map((prompt, itemIndex) => ({
    id: `questionnaire-${questionnaireNumber}-item-${itemIndex + 1}`,
    prompt,
  }))

export const questionnaires: QuestionnaireDefinition[] = [
  {
    number: 1,
    name: 'Relationship Structures Questionnaire',
    eyebrow: 'PRE-STUDY QUESTIONNAIRE',
    title: 'QUESTIONNAIRE 1',
    scaleMax: 5,
    items: createItems(1, relationshipStructuresItems),
  },
  {
    number: 2,
    name: 'Basic Empathy Scale',
    eyebrow: 'PRE-STUDY QUESTIONNAIRE',
    title: 'QUESTIONNAIRE 2',
    scaleMax: 7,
    items: createItems(2, basicEmpathyItems),
  },
  {
    number: 3,
    name: 'Emotion Regulation Questionnaire',
    eyebrow: 'PRE-STUDY QUESTIONNAIRE',
    title: 'QUESTIONNAIRE 3',
    scaleMax: 7,
    items: createItems(3, emotionRegulationItems),
  },
]

export const questionnaireCount = questionnaires.length

