export type ScenarioDefinition = {
  id: string
  number: number
  title: string
  content: string
  possiblePrompt: string
  possibleResponses: Array<{
    id: string
    text: string
    contentVersion: number
  }>
}

export const scenarios: ScenarioDefinition[] = [
  {
    id: 'S01',
    number: 1,
    title: 'Miscommunication with Your Partner',
    content:
      'You and your partner have been misunderstanding each other a lot lately. You have tried explaining yourself in different ways and listening to your partner’s perspective, but you still seem to talk past each other. The situation has continued despite your efforts, and you are not sure what else you could try. You feel frustrated, sad, and confused.',
    possiblePrompt:
      "My partner and I keep misunderstanding each other. I've tried explaining myself differently and listening to their side, but we still end up talking past each other. I feel really frustrated, sad, and confused, and I don't know what else to try. What do you think I should do?",
    possibleResponses: [
      {
        id: 'S01-R01',
        text: `Start with one recent, specific misunderstanding rather than trying to solve the whole communication pattern in a single conversation. Take turns describing what you intended to communicate in that moment and what you believed you heard from the other person, keeping the discussion anchored to that one exchange.

Before either of you responds to the substance, paraphrase what the other person meant in your own words. Then ask whether that paraphrase is accurate, and let the speaker correct it until their intended meaning has been captured. If the conversation becomes tense, repetitive, or circular, pause it and agree together on a specific time when you will continue the same discussion.`,
        contentVersion: 2,
      },
      {
        id: 'S01-R02',
        text: `This sounds emotionally exhausting, and it makes sense that the lack of progress would weigh heavily on you. Repeatedly ending up at the same point of misunderstanding can feel painful, discouraging, and disorienting.

You have changed how you explain yourself and made room for your partner’s side, yet the two of you still seem to miss each other’s meaning. That makes this look less like one isolated disagreement and more like a recurring communication pattern that those efforts have not shifted. It sounds as though you are looking for a way out of that stuck cycle without giving up on understanding where your partner is coming from.`,
        contentVersion: 2,
      },
      {
        id: 'S01-R03',
        text: `Feeling worn down, hurt, and unsure of what to do next is understandable in this situation. Repeatedly talking past each other without any sense of progress can be painful, draining, and disorienting.

For the next conversation, focus on one recent, concrete misunderstanding rather than trying to resolve the whole communication pattern at once, and have each person say what they intended to communicate and what they believed they heard. Before either person responds, each should paraphrase the other’s meaning and check whether that paraphrase is accurate. If the exchange becomes tense, repetitive, or circular, pause it and agree on a specific time to continue the conversation.`,
        contentVersion: 2,
      },
      {
        id: 'S01-R04',
        text: `You’ve changed how you explain yourself and made room for your partner’s perspective, yet the two of you still leave conversations with different understandings, which points to a recurring communication gap rather than one isolated disagreement. You seem to be looking for a way beyond that stuck pattern while still understanding what your partner means.

Focus on one recent, concrete misunderstanding instead of trying to resolve the whole pattern at once. Have each person state what they intended to communicate and what they believed they heard from the other. Before responding, each person should paraphrase the other’s meaning and check that it is accurate; if the exchange becomes tense, repetitive, or circular, pause and agree on a specific time to continue.`,
        contentVersion: 2,
      },
      {
        id: 'S01-R05',
        text: `It makes sense that repeatedly missing each other without any real sense of progress would feel painful, draining, and disorienting. Changing how you explain yourself and listening to your partner have still left you both talking past each other, so this seems less like one isolated disagreement and more like a recurring gap you want to move beyond without losing sight of their perspective.

Start with one recent, concrete misunderstanding rather than trying to solve the whole pattern, and have each of you say what you intended to communicate and what you believed you heard. Before responding, each person should paraphrase the other’s meaning and check whether the paraphrase is accurate. If the exchange becomes tense, repetitive, or circular, pause and agree on a specific time to continue.`,
        contentVersion: 2,
      },
    ],
  },
  {
    id: 'S02',
    number: 2,
    title: 'Job Dissatisfaction',
    content:
      'You do not see many opportunities for growth at your current company. At the same time, you know that the current job market is uncertain. You have been considering whether to stay in your current position or begin looking for another job, but you have not decided what to do.',
    possiblePrompt:
      "I don't see many opportunities for growth at my current company, but the job market isn't great right now. I'm not sure if I should stay or start looking for something else. What do you think I should do?",
    possibleResponses: [
      {
        id: 'S02-R01',
        text: `Start by defining what “growth” would mean in concrete terms: a clearer role direction, new skills to learn, greater responsibility, or a realistic path to advancement, then note which of those are missing today. Next, assess whether your company can credibly provide those elements within a reasonable period, and compare staying with beginning an external search.

While remaining employed, test your perception of the market by reviewing relevant openings and preparing a limited, targeted search rather than committing to a move. Set a specific review date after you have gathered enough evidence from both the internal path and the external market. At that point, decide whether to stay for a defined period or shift to a more active search based on that evidence.`,
        contentVersion: 2,
      },
      {
        id: 'S02-R02',
        text: `It is understandable to feel uncertain when you do not have a clear answer right now. You are unsure, and that lack of clarity is your immediate experience at this point.

From your perspective, your current company does not seem to offer many opportunities for further growth. You also see the external job market as not very favorable at the moment. You have not resolved whether to remain where you are or begin looking elsewhere, and that stay-or-search position remains open.`,
        contentVersion: 2,
      },
      {
        id: 'S02-R03',
        text: `It is understandable to feel uncertain when you do not have a clear answer yet. That uncertainty deserves acknowledgment, without needing to be pushed aside.

Define what meaningful growth would mean for you in terms of role direction, learning, responsibility, or advancement, and identify which of those elements is currently missing. Assess whether a realistic internal growth path exists, compare staying with beginning an external search, and test the external market while employed by reviewing relevant openings and preparing a limited, targeted search. Set a specific review date, then use the evidence you gather to decide whether to stay for a defined period or search more actively.`,
        contentVersion: 2,
      },
      {
        id: 'S02-R04',
        text: `You see limited opportunities for growth at your current company, and you do not currently view the external job market as favorable. You remain unsure whether to stay or begin looking elsewhere.

First, define meaningful growth in concrete terms—role direction, learning, responsibility, or advancement—and identify what is currently missing; then assess whether a realistic internal path exists and compare staying with beginning an external search. While employed, test the market by reviewing relevant openings and preparing a limited, targeted search. Set a review date and use the evidence gathered to decide whether to stay for a defined period or search more actively.`,
        contentVersion: 2,
      },
      {
        id: 'S02-R05',
        text: `You don't need to push your uncertainty aside. It makes sense and deserves acknowledgment. You see limited growth at your company, view the external job market as unfavorable, and remain unsure whether to stay or begin looking elsewhere.

First, define meaningful growth in terms of role direction, learning, responsibility, or advancement, and identify which elements are currently missing. Next, assess whether a realistic internal growth path exists, compare staying with beginning an external search, and test the market while employed by reviewing relevant openings and preparing a limited, targeted search. Set a review date and use the evidence gathered to decide whether to stay for a defined period or search more actively.`,
        contentVersion: 2,
      },
    ],
  },
  {
    id: 'S03',
    number: 3,
    title: 'Difficult Task Completed and Praised',
    content:
      'You have just completed a task that was very difficult and required a great deal of effort. During the process, you were not always sure that you would be able to finish it successfully. After you completed it, your supervisor complimented the quality of your work. You feel very happy, proud, and relieved.',
    possiblePrompt:
      "I finally finished this really difficult task, and my supervisor complimented my work! I put so much effort into it and wasn't always sure I could pull it off. I'm so happy, proud, and relieved right now!",
    possibleResponses: [
      {
        id: 'S03-R01',
        text: `Consider making a brief record of the completed task and preserving your supervisor’s feedback in the exact wording they used, rather than relying on a later summary from memory. In that same record, add one or two actions or skills that you can personally verify contributed to completing the work.

If you respond to your supervisor, you could keep it brief: “Thank you; I appreciate the feedback.” Save the record so it is available as a concrete example for a future performance review. It can also be useful to read before a similar task, giving you a clear reference for the actions or skills that helped with this one.`,
        contentVersion: 2,
      },
      {
        id: 'S03-R02',
        text: `That’s wonderful—what a satisfying moment after putting so much of yourself into something that felt genuinely difficult. Finishing it despite those stretches of uncertainty, and then hearing your supervisor recognize the result, makes your happiness and pride feel especially well earned.

There’s something powerful about reaching the other side of a task you were not always sure you could complete. The relief comes together with the knowledge that all that effort led to a finished piece of work that was seen and appreciated. You got to experience both the private satisfaction of having made it through and the added joy of having that achievement acknowledged.`,
        contentVersion: 2,
      },
      {
        id: 'S03-R03',
        text: `That is wonderful news, and I’m genuinely so happy for you! Your happiness, pride, and relief come through so clearly, and this sounds like a deeply joyful moment.

Make a brief record naming the completed task, and preserve your supervisor’s feedback by copying their actual wording rather than paraphrasing it. Add one or two specific actions or skills that you can personally verify contributed to completing the task; if you respond to your supervisor, a simple “Thank you; I appreciate the feedback” is enough. Save this record for your next performance review, or keep it as a reference to consult before you begin a similar task.`,
        contentVersion: 2,
      },
      {
        id: 'S03-R04',
        text: `You put substantial effort into a demanding task while at times being uncertain whether you could complete it, and you ultimately brought the work to completion. After that demanding process, your supervisor noticed the finished result and complimented your work, so the experience includes both completing something difficult and having the outcome recognized.

Make a brief record of the completed task, preserving your supervisor’s feedback in its actual wording rather than paraphrasing it. Add one or two actions or skills that you can personally verify contributed to completing the task. If you respond to your supervisor, use the brief acknowledgment “Thank you; I appreciate the feedback” and save the record for a future performance review or as a reference before a similar task.`,
        contentVersion: 2,
      },
      {
        id: 'S03-R05',
        text: `That’s fantastic—I’m genuinely happy for you, and I can feel the pride and relief in what you shared. You put substantial effort into a very difficult task, kept going even when you were unsure you could complete it, finished it, and then received a compliment from your supervisor.

Make a brief record of the completed task and preserve your supervisor’s feedback in the exact wording they used. Add one or two actions or skills you can personally verify contributed to completing it; if you respond to your supervisor, use the brief acknowledgment “Thank you; I appreciate the feedback.” Save that record for a future performance review or as a reference before taking on a similar task.`,
        contentVersion: 2,
      },
    ],
  },
  {
    id: 'S04',
    number: 4,
    title: 'Waiting and Bored',
    content:
      'You are waiting for someone who has not arrived yet. You have some time to pass and nothing in particular to do. Nothing serious has happened, and you feel a little bored while you wait.',
    possiblePrompt:
      "I'm waiting for someone and have some time to kill. I'm getting a little bored.",
    possibleResponses: [
      {
        id: 'S04-R01',
        text: `Choose one of three brief options: a two-minute category word game, a three-item mental list, or a light hypothetical question. Keep whichever option you pick easy to stop immediately and leave unfinished.

For the category game, start with one food for each letter: A—apple, B—bread, and C—cheese. Stop when the person arrives. If the first choice does not hold your attention, switch to one of the other two.`,
        contentVersion: 2,
      },
      {
        id: 'S04-R02',
        text: `Yeah, a little boredom can still register. It is not intense, but it is fair to call it what it is.

You are waiting for someone, and the available time is not tied to a task. The interval is temporary but open-ended, because it ends when that person arrives. Until then, there is not much in the situation itself occupying that stretch.`,
        contentVersion: 2,
      },
      {
        id: 'S04-R03',
        text: `Yeah, that sounds like a small bit of boredom. It is mild, but still noticeable enough to name.

Choose one brief option: a two-minute category word game, a three-item mental list, or a light hypothetical question. For the category game, start with one food for each letter: A—apple, B—bread, and C—cheese. Stop when the person arrives; if the first option does not hold your attention, switch to one of the other two.`,
        contentVersion: 2,
      },
      {
        id: 'S04-R04',
        text: `You are waiting for someone, and the available time is not tied to a task. The interval is temporary but open-ended, because it ends when that person arrives.

Choose one brief option: a two-minute category word game, a three-item mental list, or a light hypothetical question. For the category game, start with one food for each letter: A—apple, B—bread, and C—cheese. Stop when the person arrives; if the first option does not hold your attention, switch to one of the other two.`,
        contentVersion: 2,
      },
      {
        id: 'S04-R05',
        text: `That sounds like a mild, noticeable bit of boredom. You are waiting for someone in a temporary, open-ended interval that is not tied to a task.

Choose one brief option: a two-minute category word game, a three-item mental list, or a light hypothetical question. For the category game, start with one food for each letter: A—apple, B—bread, and C—cheese. Stop when the person arrives; if the first option does not hold your attention, switch to one of the other two.`,
        contentVersion: 2,
      },
    ],
  },
]

export const scenarioCount = scenarios.length
