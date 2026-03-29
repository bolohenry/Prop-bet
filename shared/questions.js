export const QUESTIONS = [
  { id: 'q2', number: 1, text: "Your name", type: 'text', scored: false },
  { id: 'q3', number: 2, text: "Will there be a neon sign?", type: 'yesno', scored: true },
  { id: 'q4', number: 3, text: "Will there be a photo booth?", type: 'yesno', scored: true },
  { id: 'q5', number: 4, text: "Will there be a sweetheart table?", type: 'yesno', scored: true },
  { id: 'q6', number: 5, text: "Will there be a choreographed first dance?", type: 'yesno', scored: true },
  { id: 'q7', number: 6, text: "Will the best man speech be over/under 5.5 minutes?", type: 'overunder', scored: true },
  { id: 'q8', number: 7, text: "Will the maid of honor speech be over/under 5.5 minutes?", type: 'overunder', scored: true },
  { id: 'q9', number: 8, text: "Will the best man tell the bride she looks beautiful AND thank both parents tonight?", type: 'yesno', scored: true },
  { id: 'q10', number: 9, text: "Will the bride or groom's job be mentioned in maid of honor/best man speech?", type: 'yesno', scored: true },
  { id: 'q11', number: 10, text: "Will there be a bouquet toss?", type: 'yesno', scored: true },
  { id: 'q12', number: 11, text: "What will the cake flavor be?", type: 'choice', options: ['Vanilla', 'Chocolate', 'Fruit', 'Other'], scored: true },
  { id: 'q13', number: 12, text: "Will Mr. Brightside be played?", type: 'yesno', scored: true },
  { id: 'q14', number: 13, text: "Will the bride do a dress change before the after party?", type: 'yesno', scored: true },
  { id: 'q15', number: 14, text: "Tie breaker — what time will the bride leave the after party?", hint: "Price is Right rules", type: 'time', scored: false },
];

export const SCORED_QUESTIONS = QUESTIONS.filter(q => q.scored);
export const QUESTION_MAP = Object.fromEntries(QUESTIONS.map(q => [q.id, q]));
