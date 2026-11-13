import type { FrequentlyAskedQuestion } from './seo/jsonld';

/** Rendered by the home page FAQ and published as FAQPage structured data, so the two never drift. */
export const FAQS: readonly FrequentlyAskedQuestion[] = [
  {
    question: 'Does it sound robotic?',
    answer:
      'Agents use natural, modern voices and reply quickly enough for a normal back-and-forth. Try the demo at the top of this page and judge for yourself.',
  },
  {
    question: 'Can I keep my existing number?',
    answer:
      'Yes. Forward your number to LightMove or connect your SIP trunk. Your customers keep calling the number they know.',
  },
  {
    question: "What happens when the agent can't help?",
    answer:
      'You decide. It can transfer the call to a person, take a message or book a callback, and every call comes with a summary.',
  },
  {
    question: 'Do I need technical skills?',
    answer:
      'No. Describe the job in plain words and the builder drafts the workflow. Or let our team build and test it for you.',
  },
  {
    question: 'How does pay as you go work?',
    answer:
      'There is no monthly commitment. You buy credit in advance and calls are charged at €0.12 a minute, by the second, excluding VAT. New workspaces get €5 of free credit, about 40 minutes of calls. Top-ups start at €20.',
  },
];
