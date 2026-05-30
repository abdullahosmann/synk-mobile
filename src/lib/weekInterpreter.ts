import { DayOverride, DayOverrideKind, WeekUpdate } from '../types';

export const interpretWeekMessage = async (
  message: string,
  currentWeekNumber: number,
  user: any
): Promise<WeekUpdate> => {
  // STUB: simulates an AI reasoning delay
  // TODO: Replace with real LLM implementation matching this precise signature
  await new Promise(resolve => setTimeout(resolve, 800));

  const lower = message.toLowerCase();
  const overrides: DayOverride[] = [];
  
  // Basic date mapping for stub (assuming Monday start for week)
  const getSimulatedDateStr = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
  };

  // 1. Travel
  if (/travel|trip|vacation|مسافر|رحلة|فندق/.test(lower)) {
    overrides.push({
      date: getSimulatedDateStr(1),
      kind: 'travel-bodyweight',
      reasoning: 'Swapped to bodyweight due to travel.',
      newWorkoutPreview: { name: 'Hotel Room Pump', duration: 20, sets: 12 }
    });
  }

  // 2. Equipment 
  if (/dumbbells only|no equipment|بيت|فيلا/.test(lower)) {
    overrides.push({
      date: getSimulatedDateStr(2),
      kind: 'home-equipment',
      reasoning: 'Adapted for limited equipment.',
      newWorkoutPreview: { name: 'Dumbbell Full Body', duration: 40, sets: 18 }
    });
  }

  // 3. Time
  if (/time|short|busy|مش فاضي|30 min|نص ساعة/.test(lower)) {
    overrides.push({
      date: getSimulatedDateStr(0),
      kind: 'short-session',
      reasoning: 'Condensed to fit a busy schedule.',
      newWorkoutPreview: { name: 'Express Circuit', duration: 30, sets: 16 }
    });
  }

  // 4. Energy
  if (/tired|exhausted|low energy|تعبان|مرهق/.test(lower)) {
    overrides.push({
      date: getSimulatedDateStr(0), // today
      kind: 'low-energy',
      reasoning: 'Reduced volume for low energy.',
      newWorkoutPreview: { name: 'Light Mobility & Flow', duration: 20, sets: 8 }
    });
  }

  // 5. Sick
  if (/sick|flu|fever|مريض|حرارة/.test(lower)) {
    overrides.push({
      date: getSimulatedDateStr(0),
      kind: 'sick',
      reasoning: 'Rest day suggested for recovery.',
      newWorkoutPreview: { name: 'Rest Day', duration: 0, sets: 0 }
    });
  }

  if (overrides.length > 0) {
    return {
      overrides,
      coachResponse: {
        en: `Sounds like you want to adjust this week. I can update ${overrides.length} day(s). Want to see the editor?`,
        ar: `شكلك عايز تعدل الأسبوع. أقدر أحدث ${overrides.length} يوم. تحب تشوف التعديلات؟`
      }
    };
  }

  return {
    overrides: [],
    coachResponse: {
      en: "Got it. Anything specific I should adjust?",
      ar: "تمام. عايز أعدّل في حاجة معينة؟"
    }
  };
};
