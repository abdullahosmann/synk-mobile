import { ExerciseLite, SubstitutionContext } from '../types';

export function getSubstitutions(
  originalExercise: ExerciseLite,
  context: SubstitutionContext,
  userExerciseDatabase: ExerciseLite[]
): ExerciseLite[] {
  // 1. Filter the database to exercises sharing the same primary muscle as originalExercise
  let alternatives = userExerciseDatabase.filter(ex => ex.primaryMuscle === originalExercise.primaryMuscle);

  // 2. Filter to exercises whose equipment array has at least one overlap with context.availableEquipment
  // (If availableEquipment includes "All" or is fully encompassing, we allow based on context values)
  if (!context.availableEquipment.includes('bodyweight' as any) && context.availableEquipment.length > 0) {
     // A slightly permissive check to simplify if they pass 'all'
     // we assume the caller handles resolving 'all' to the actual list before calling
  }
  
  alternatives = alternatives.filter(ex => 
    ex.equipment.some(eq => context.availableEquipment.includes(eq))
  );

  // 3. Filter out excludeIds
  if (context.excludeIds && context.excludeIds.length > 0) {
    alternatives = alternatives.filter(ex => !context.excludeIds!.includes(ex.id));
  }

  // 4. Filter to preserveType if specified
  if (context.preserveType && context.preserveType !== 'either') {
    alternatives = alternatives.filter(ex => ex.category === context.preserveType || ex.category === originalExercise.category);
  }

  // Also don't suggest the original exercise
  alternatives = alternatives.filter(ex => ex.id !== originalExercise.id);

  // 5. Rank by overlap score
  const scoredAlts = alternatives.map(ex => {
    let score = 3; // +3 for shared primary muscle

    // +1 for each shared secondary muscle
    const sharedSecondary = ex.secondaryMuscles.filter(m => originalExercise.secondaryMuscles.includes(m));
    score += sharedSecondary.length;

    // +1 if same category
    if (ex.category === originalExercise.category) {
      score += 1;
    }

    // +1 if equipment overlap is full (all original equipment available or all ex equipment available) 
    // simpler: if all equipment of this alternative is available
    const fullyAvailable = ex.equipment.every(eq => context.availableEquipment.includes(eq));
    if (fullyAvailable) {
      score += 1;
    }

    // -1 if exercise is "advanced" and maybe user is not stringently handled, we do -1 if advanced just as a mild penalty 
    // to default to more accessible movements unless it's a perfect match
    if (ex.difficulty === 'advanced' && originalExercise.difficulty !== 'advanced') {
       score -= 1; 
    }

    return { exercise: ex, score };
  });

  // Sort by score desc
  scoredAlts.sort((a, b) => b.score - a.score);

  // 6. Return top 5
  return scoredAlts.slice(0, 5).map(sa => sa.exercise);
}
