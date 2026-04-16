import type { MissionCategory } from './types';

export type CategoryDetail = {
  title: string;
  cardTitle: string;
  cardSummary: string;
  definition: string;
  meaning: string;
  examples: string[];
  guidingQuestion: string;
};

export const CATEGORY_DETAILS: Record<MissionCategory, CategoryDetail> = {
  build: {
    title: 'Build',
    cardTitle: 'What you can actively grow',
    cardSummary: 'Places where steady effort tends to produce direct improvement.',
    definition: 'Things you can actively work on in your life where effort directly correlates with improvement.',
    meaning:
      'Use Build for skills, habits, strength, knowledge, or capacities that get stronger when you practice them on purpose.',
    examples: ['A craft you want to improve', 'A habit you want to strengthen', 'A skill you want to practice consistently'],
    guidingQuestion: 'What action, repeated this week, would make me a little stronger here?',
  },
  shape: {
    title: 'Shape',
    cardTitle: 'What you can steadily influence',
    cardSummary: 'Parts of life that respond to gentle structure, design, and attention.',
    definition: 'Parts of your life you may not control instantly, but you can gradually influence through structure and care.',
    meaning:
      'Use Shape for routines, environments, boundaries, systems, or relationships where thoughtful adjustments make better outcomes more likely over time.',
    examples: ['A morning routine you want to refine', 'A workspace you want to make calmer', 'A relationship dynamic you want to handle more intentionally'],
    guidingQuestion: 'What condition can I change so the life I want becomes easier to live?',
  },
  workWith: {
    title: 'Work With',
    cardTitle: 'What you can meet with steadiness',
    cardSummary: 'Realities you cannot fully control, but can relate to more wisely.',
    definition: 'Experiences, emotions, or realities you may not be able to remove, but can learn to meet with patience, acceptance, and skill.',
    meaning:
      'Use Work With for uncertainty, discomfort, grief, difficult feelings, other people, or constraints that call for steadiness more than force.',
    examples: ['An emotion that keeps surfacing', 'A setback you cannot undo right now', 'A limitation that asks for patience instead of control'],
    guidingQuestion: 'If this does not disappear this week, how do I want to show up in relationship to it?',
  },
};

export const FRAMEWORK_BLURB =
  'Haven is a private weekly reflection framework for noticing what to build, what to shape, and what to work with in your life.';

export const FRAMEWORK_DESCRIPTION =
  'It helps you translate a messy week into three practical lanes: direct effort, steady influence, and wise response.';

export const STOIC_INSPIRATION =
  'This framework is inspired by the Stoic dichotomy of control: learning to tell the difference between what is up to you, what you can influence, and what must be met with clarity and character.';
