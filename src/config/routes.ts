export const routes = {
  home: '/',
  questionnaire: '/questionnaire',
  scenarioIntroduction: '/scenario-introduction',
  rate: '/rate',
  end: '/end',
} as const

export const questionnairePath = (questionnaireNumber: number) =>
  `${routes.questionnaire}/${questionnaireNumber}`
