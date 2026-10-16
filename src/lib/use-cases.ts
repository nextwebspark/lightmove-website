export interface UseCase {
  id: string;
  label: string;
  time: string;
  title: string;
  body: string;
  points: string[];
  /** Sample call, alternating speakers; `agent: true` lines are the LightMove agent. */
  lines: { agent: boolean; text: string }[];
}

export const USE_CASES: UseCase[] = [
  {
    id: 'clinics',
    label: 'Clinics',
    time: '09:14',
    title: 'Bookings without the hold music',
    body: 'Patients book, move and cancel visits any hour. Your front desk gets a tidy list instead of a voicemail backlog.',
    points: ['Books straight into your calendar', 'Answers opening hours and prices', 'Passes anyone in pain to reception'],
    lines: [
      { agent: false, text: 'Hi, can I move my Thursday physio to next week?' },
      { agent: true, text: 'Of course. I have Tuesday at 10:30 or Wednesday at 2. Which suits you?' },
      { agent: false, text: 'Tuesday, please.' },
      { agent: true, text: 'Done. You are booked for Tuesday at 10:30. See you then.' },
    ],
  },
  {
    id: 'trades',
    label: 'Trades',
    time: '12:47',
    title: 'Never miss a job while you are on the tools',
    body: 'The agent takes the details, checks how urgent it is and books a call-back, so you can finish the job in front of you.',
    points: ['Captures address and the problem', 'Flags emergencies straight away', 'Books a call-back slot'],
    lines: [
      { agent: false, text: 'My boiler stopped working this morning.' },
      { agent: true, text: 'Sorry to hear that. Is there any smell of gas, or is it just no heat?' },
      { agent: false, text: 'Just no heat.' },
      { agent: true, text: 'Thanks. Can I take your address and a good time for the engineer to ring you back?' },
    ],
  },
  {
    id: 'restaurants',
    label: 'Restaurants',
    time: '18:02',
    title: 'Tables booked while the kitchen is busy',
    body: 'Take reservations and answer the usual questions at peak hours without pulling staff off the floor.',
    points: ['Takes bookings and party sizes', 'Answers menu and allergy questions', 'Handles changes and cancellations'],
    lines: [
      { agent: false, text: 'Have you a table for four on Saturday around eight?' },
      { agent: true, text: 'I can do 7:45 or 8:30 for four. Would either work?' },
      { agent: false, text: '8:30 is perfect.' },
      { agent: true, text: 'Lovely. What name should I put that under?' },
    ],
  },
  {
    id: 'estate-agents',
    label: 'Estate agents',
    time: '20:31',
    title: 'Viewings booked after hours',
    body: 'Buyers ring in the evening. The agent answers questions on a listing and books the viewing before they call someone else.',
    points: ['Answers questions on listings', 'Books viewings into your diary', 'Qualifies buyers and renters'],
    lines: [
      { agent: false, text: 'Is the house on Ennis Road still available?' },
      { agent: true, text: 'It is. Would you like to book a viewing? I have Thursday evening or Saturday morning.' },
      { agent: false, text: 'Saturday morning.' },
      { agent: true, text: 'Great, 10 o’clock on Saturday. Can I take a mobile number for the agent?' },
    ],
  },
];
