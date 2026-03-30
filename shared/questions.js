export const QUESTIONS = [
  { id: 'q2', text: "Your name", type: 'text', scored: false, isName: true },
  { id: 'q3', text: "Will there be a neon sign?", type: 'yesno', scored: true },
  { id: 'q4', text: "Will there be a photo booth?", type: 'yesno', scored: true },
  { id: 'q5', text: "Will there be a sweetheart table?", type: 'yesno', scored: true },
  { id: 'q6', text: "Will there be a choreographed first dance?", type: 'yesno', scored: true },
  { id: 'q7', text: "Will the best man speech be over/under 5.5 minutes?", type: 'overunder', scored: true },
  { id: 'q8', text: "Will the maid of honor speech be over/under 5.5 minutes?", type: 'overunder', scored: true },
  { id: 'q9', text: "Will the best man tell the bride she looks beautiful AND thank both parents tonight?", type: 'yesno', scored: true },
  { id: 'q10', text: "Will the bride or groom's job be mentioned in maid of honor/best man speech?", type: 'yesno', scored: true },
  { id: 'q11', text: "Will there be a bouquet toss?", type: 'yesno', scored: true },
  { id: 'q12', text: "What will the cake flavor be?", type: 'choice', options: ['Vanilla', 'Chocolate', 'Fruit', 'Other'], scored: true },
  { id: 'q13', text: "Will Mr. Brightside be played?", type: 'yesno', scored: true },
  { id: 'q14', text: "Will the bride do a dress change before the after party?", type: 'yesno', scored: true },
  { id: 'q15', text: "Tie breaker — what time will the bride leave the after party?", hint: "Price is Right rules", type: 'time', scored: false },
];

export const SURVEY_QUESTIONS = QUESTIONS.filter(q => !q.isName);

// Assign display numbers starting from 1 for survey questions only
SURVEY_QUESTIONS.forEach((q, i) => { q.number = i + 1; });

export const SCORED_QUESTIONS = QUESTIONS.filter(q => q.scored);
export const QUESTION_MAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
export const TOTAL_SCORED = SCORED_QUESTIONS.length;
