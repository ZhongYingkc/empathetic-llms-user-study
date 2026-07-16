export type ScenarioDefinition = {
  number: number
  title: string
  content: string
  possiblePrompt: string
  possibleResponses: string[]
}

const designPlaceholder = {
  title: 'Miscommunication with your partner',
  content:
    'You and your partner have been misunderstanding each other a lot lately. You have tried explaining yourself in different ways and listening to your partner’s perspective, but you still seem to talk past each other. The situation has continued despite your efforts, and you are not sure what else you could try. You feel frustrated, sad, and confused.',
  possiblePrompt:
    'Honestly, today was rough. A project I really cared about fell apart, and I feel kind of defeated.',
  possibleResponse:
    'Feeling frustrated, sad, and confused is understandable after you have made repeated efforts that have not resolved the misunderstanding. It sounds as though the difficulty is reciprocal—you feel unheard while also struggling to understand your partner—and, after trying many approaches, you may feel stuck between wanting to be understood and wanting a shared way to understand each other. Rather than revisiting the whole pattern, choose one recent misunderstanding as a concrete starting point and have each person separate what they intended to communicate from what they believed they heard. Then, before explaining or defending anything, each person can paraphrase the other’s meaning and ask whether that reflection is accurate. If the exchange becomes tense, circular, or repetitive, pause it and agree on a specific time to continue the same conversation.',
}

export const scenarios: ScenarioDefinition[] = Array.from(
  { length: 4 },
  (_, index) => ({
    number: index + 1,
    title: designPlaceholder.title,
    content: designPlaceholder.content,
    possiblePrompt: designPlaceholder.possiblePrompt,
    possibleResponses: Array.from(
      { length: 5 },
      () => designPlaceholder.possibleResponse,
    ),
  }),
)

export const scenarioCount = scenarios.length
