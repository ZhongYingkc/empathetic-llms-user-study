export const routes = {
  home: '/',
  questionnaire: '/questionnaire',
  scenarioIntroduction: '/scenario-introduction',
  scenario: '/scenario',
  rate: '/rate',
  end: '/end',
} as const

export const questionnairePath = (questionnaireNumber: number) =>
  `${routes.questionnaire}/${questionnaireNumber}`

export const scenarioPath = (scenarioNumber: number) =>
  `${routes.scenario}/${scenarioNumber}`

export const ratePath = (scenarioNumber: number, responseNumber: number) =>
  `${routes.rate}/${scenarioNumber}/${responseNumber}`
