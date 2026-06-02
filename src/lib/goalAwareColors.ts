import { GoalV2 } from '../types';

type TrendDirection = 'up' | 'down' | 'flat';
type Semantic = 'positive' | 'negative' | 'neutral';

/**
 * Returns whether a given trend direction is positive, negative, or neutral
 * for a specific metric and user goal.
 *
 * Example: weight going down is POSITIVE for someone with lose-body-fat goal,
 * NEGATIVE for gain-muscle goal, NEUTRAL for stay-consistent.
 */
export function getMetricSemantic(
  metric: 'weight' | 'volume' | 'strength' | 'cardio',
  direction: TrendDirection,
  goals: GoalV2[] | null | undefined
): Semantic {
  if (direction === 'flat') return 'neutral';
  const primaryGoal = goals?.[0];

  if (metric === 'weight') {
    if (primaryGoal === 'lose-body-fat') {
      return direction === 'down' ? 'positive' : 'negative';
    }
    if (primaryGoal === 'gain-muscle' || primaryGoal === 'build-strength') {
      return direction === 'up' ? 'positive' : 'negative';
    }
    // stay-consistent, cardio, sport — flat is best
    return 'neutral';
  }

  if (metric === 'volume' || metric === 'strength') {
    return direction === 'up' ? 'positive' : 'negative';
  }

  if (metric === 'cardio') {
    return direction === 'up' ? 'positive' : 'negative';
  }

  return 'neutral';
}

/**
 * Returns Tailwind color classes for the semantic.
 */
export function getSemanticColors(semantic: Semantic): {
  text: string;
  bg: string;
  iconStroke: string;
} {
  switch (semantic) {
    case 'positive':
      return {
        text: 'text-semantic-green text-green-500', // ensure tailwind classes get picked up just in case semantic-* are missing
        bg: 'bg-semantic-green/10 bg-green-500/10',
        iconStroke: 'text-semantic-green text-green-500',
      };
    case 'negative':
      return {
        text: 'text-semantic-red text-red-500',
        bg: 'bg-semantic-red/10 bg-red-500/10',
        iconStroke: 'text-semantic-red text-red-500',
      };
    case 'neutral':
      return {
        text: 'text-ink-muted-48',
        bg: 'bg-black/5 dark:bg-white/5',
        iconStroke: 'text-ink-muted-48',
      };
  }
}
