import { WorkoutLog, ExerciseSession, ExercisePR } from '../types';

export function computeEstimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight;
  // Epley formula
  return Math.round(weight * (1 + reps / 30));
}

// TODO: Replace mock data with real workout log persistence.
const mockDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

const commonExercises = [
  { id: 'bench_press', name: 'Bench Press', mg: ['chest', 'triceps', 'shoulders'] },
  { id: 'squat', name: 'Barbell Squat', mg: ['quads', 'glutes', 'hamstrings'] },
  { id: 'deadlift', name: 'Deadlift', mg: ['back', 'glutes', 'hamstrings'] },
  { id: 'overhead_press', name: 'Overhead Press', mg: ['shoulders', 'triceps'] },
  { id: 'barbell_row', name: 'Barbell Row', mg: ['back', 'biceps'] },
];

export const MOCK_WORKOUTS: WorkoutLog[] = [];
let workoutIdCounter = 1;

// Generate ~20 mock workouts over last 60 days
for (let i = 60; i >= 0; i -= 3) {
  const isUpper = i % 2 === 0;
  const exList = isUpper ? [commonExercises[0], commonExercises[3], commonExercises[4]] : [commonExercises[1], commonExercises[2]];
  
  const wId = `w_mock_${workoutIdCounter++}`;
  
  const isPR = Math.random() > 0.8;
  const date = mockDate(i);
  
  const exercisesData = exList.map(ex => {
     // small progression
     const baseWeight = ex.id === 'bench_press' ? 60 : ex.id === 'squat' ? 80 : ex.id === 'deadlift' ? 100 : ex.id === 'overhead_press' ? 40 : 50;
     const progressionValue = Math.floor((60 - i) / 10) * 2.5; // +2.5kg every 10 days
     
     const weight = baseWeight + progressionValue + (isPR ? 2.5 : 0);
     
     return {
       id: ex.id,
       name: ex.name,
       sets: [
         { reps: Math.floor(Math.random() * 2) + 4, weight: weight, completedAt: date }, // top set
         { reps: Math.floor(Math.random() * 2) + 6, weight: weight - 10, completedAt: date }, // backoff
         { reps: Math.floor(Math.random() * 2) + 6, weight: weight - 10, completedAt: date },
       ]
     };
  });
  
  MOCK_WORKOUTS.push({
     id: wId,
     date,
     name: isUpper ? 'Upper Body Power' : 'Lower Body Strength',
     durationMin: Math.floor(Math.random() * 15) + 45,
     totalVolumeKg: exercisesData.reduce((acc, ex) => acc + ex.sets.reduce((sAcc, s) => sAcc + s.weight * s.reps, 0), 0),
     setsCompleted: exercisesData.length * 3,
     muscleGroups: Array.from(new Set(exList.flatMap(e => e.mg))),
     exercises: exercisesData,
     isPR
  });
}

// Ensure reverse chronological
MOCK_WORKOUTS.reverse();

export function getAllWorkouts(user: any): WorkoutLog[] {
  // TODO: Use real user data
  return MOCK_WORKOUTS;
}

export function getWorkoutsInMonth(user: any, year: number, month: number): WorkoutLog[] {
  return getAllWorkouts(user).filter(w => {
    const d = new Date(w.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function getExerciseSessions(user: any, exerciseId: string): ExerciseSession[] {
  const sessions: ExerciseSession[] = [];
  const allWorkouts = getAllWorkouts(user).slice().reverse(); // old to new for progression
  
  let bestWeight = 0;
  
  allWorkouts.forEach(w => {
     const ex = w.exercises.find(e => e.id === exerciseId);
     if (ex) {
       let topW = 0;
       let bestRepAtTopW = 0;
       let sessionVol = 0;
       
       ex.sets.forEach(s => {
         sessionVol += s.reps * s.weight;
         if (s.weight > topW) {
           topW = s.weight;
           bestRepAtTopW = s.reps;
         } else if (s.weight === topW && s.reps > bestRepAtTopW) {
           bestRepAtTopW = s.reps;
         }
       });
       
       const isPR = topW > bestWeight;
       if (isPR) bestWeight = topW;
       
       const est1RM = computeEstimated1RM(topW, bestRepAtTopW);
       
       sessions.push({
         date: w.date,
         workoutId: w.id,
         sets: ex.sets,
         topWeight: topW,
         totalVolumeKg: sessionVol,
         isPR,
         est1RM
       });
     }
  });
  
  return sessions.reverse(); // Return newest first
}

export function getExercisePRs(user: any, exerciseId: string): ExercisePR[] {
  const sessions = getExerciseSessions(user, exerciseId);
  const prs: ExercisePR[] = [];
  sessions.forEach(s => {
     if (s.isPR) {
       let repForPR = 0;
       s.sets.forEach(set => {
         if (set.weight === s.topWeight && set.reps > repForPR) repForPR = set.reps;
       });
       prs.push({
         date: s.date,
         workoutId: s.workoutId,
         weight: s.topWeight,
         reps: repForPR
       });
     }
  });
  return prs;
}

export function getAllExercisesForUser(user: any): { id: string; name: string; sessionCount: number; lastUsed: Date }[] {
  const exerMap = new Map();
  getAllWorkouts(user).forEach(w => {
     w.exercises.forEach(ex => {
       if (!exerMap.has(ex.id)) {
         exerMap.set(ex.id, { id: ex.id, name: ex.name, sessionCount: 0, lastUsed: new Date(w.date) });
       }
       const current = exerMap.get(ex.id);
       current.sessionCount++;
       const d = new Date(w.date);
       if (d > current.lastUsed) current.lastUsed = d;
     });
  });
  return Array.from(exerMap.values());
}
