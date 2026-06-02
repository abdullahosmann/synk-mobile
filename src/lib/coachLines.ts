import { UserProfile } from "../types";

export function getCoachLineForDay(
  user: UserProfile,
  context: {
    hour: number;
    isRestDay: boolean;
    hasPendingAdaptation: boolean;
    todaysWorkoutMuscleGroups?: string[];
    streak?: number;
    recentPRs?: number;
    volumeDelta?: number;
    lastSessionRPE?: number;
  }
): { en: string; ar: string } {
  const {
    hour,
    isRestDay,
    hasPendingAdaptation,
    todaysWorkoutMuscleGroups,
    streak = 0,
    recentPRs = 0,
    volumeDelta = 0,
    lastSessionRPE = 0,
  } = context;

  const coachName = user.coach ? user.coach.charAt(0).toUpperCase() + user.coach.slice(1) : "Coach";
  const coachNameAr = user.coach === "nora" ? "نورا" : user.coach === "sara" ? "سارة" : user.coach === "omar" ? "عمر" : "خالد";

  function hash(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const hashVal = hash((user.username || user.name || "user") + todayStr);

  type StringPair = { en: string; ar: string };
  let pool: StringPair[] = [];

  if (hasPendingAdaptation) {
    pool = [
      { en: "Your coach has an update for you", ar: "مدربك عنده تعديل ليك" },
      { en: "{coachName} adjusted something — take a look", ar: "{coachNameAr} عدّل حاجة — شوفها" },
      { en: "Plan update ready when you are", ar: "في تعديل في الخطة لما تكون فاضي" }
    ];
  } else if (isRestDay) {
    pool = [
      { en: "Today's a rest day — recover well", ar: "النهارده يوم راحة — استشفي كويس" },
      { en: "Rest is where you grow. Take it", ar: "الراحة هي اللي بتكبّرك. خدها" },
      { en: "Off day. Walk, sleep, eat well", ar: "يوم راحة. مشي، نوم، أكل كويس" }
    ];
  } else if (recentPRs > 0) {
    pool = [
      { en: "PR last session — let's stack another", ar: "كسرت رقمك آخر مرة — يلا نكسره تاني" },
      { en: "You're on a PR streak. Push smart", ar: "ماشي تكسر أرقام. اضغط بذكاء" },
      { en: "Great work recently. Keep it up", ar: "يوم جديد وإنجاز جديد. يلا مكملين" } // fallback 3rd item
    ];
  } else if (streak >= 7) {
    pool = [
      { en: "{streak} days in. You're consistent now", ar: "{streak} يوم على الترتيب. انت ثابت دلوقتي" },
      { en: "Showing up is the whole game", ar: "الحضور هو اللعبة كلها" },
      { en: "Consistency builds champions", ar: "الاستمرارية بتعمل أبطال" }
    ];
  } else if (lastSessionRPE >= 9) {
    pool = [
      { en: "Last session was heavy. Keep form clean today", ar: "آخر تمرين كان تقيل. خلي الشكل تمام النهارده" },
      { en: "Body's still recovering — train smart", ar: "جسمك لسه بيستشفي — درّب بذكاء" },
      { en: "Don't overload today. Move well", ar: "متحملش بزيادة النهارده. اتحرك صح" }
    ];
  } else if (volumeDelta > 10) {
    pool = [
      { en: "Volume up {X}% this week. Keep going", ar: "حجم تمرينك زاد {X}% — كمل" },
      { en: "You're moving in the right direction", ar: "ماشي صح" },
      { en: "The work is adding up. You're getting stronger", ar: "شغلك بيبان. انت بتتحسن" }
    ];
  } else if (todaysWorkoutMuscleGroups && todaysWorkoutMuscleGroups.length > 0) {
    const isPush = todaysWorkoutMuscleGroups.some(g => g.toLowerCase().includes("chest") || g.toLowerCase().includes("shoulder"));
    const isPull = todaysWorkoutMuscleGroups.some(g => g.toLowerCase().includes("back"));
    const isLegs = todaysWorkoutMuscleGroups.some(g => g.toLowerCase().includes("leg") || g.toLowerCase().includes("quad") || g.toLowerCase().includes("ham"));
    
    if (isPush) {
      pool = [
        { en: "Push day. Control the lower", ar: "يوم دفع. انزل بتحكم" },
        { en: "Big press today. Lock it out", ar: "شيلة تقيلة النهارده. اثبت صح" },
        { en: "Protect your shoulders. Warm up well", ar: "حافظ على كتفك. سخن كويس" }
      ];
    } else if (isPull) {
      pool = [
        { en: "Pull day. Lead with the elbows", ar: "يوم سحب. اسحب بالكوع" },
        { en: "Squeeze at the top today", ar: "شد ضهرك للاخر النهارده" },
        { en: "Strong back, strong body", ar: "ضهر قوي يعني جسم قوي" }
      ];
    } else if (isLegs) {
      pool = [
        { en: "Leg day. The one everyone respects", ar: "يوم رجل. اليوم اللي بيحترمه الكل" },
        { en: "Dig deep today. It's legs", ar: "هات اخرك النهارده. يوم رجل" },
        { en: "Don't skip the deep squats", ar: "متنساش تنزل للاخر في السكوات" }
      ];
    }
  }

  // Fallback Time of day
  if (pool.length === 0) {
    if (hour >= 6 && hour < 12) {
      pool = [
        { en: "Today is all yours", ar: "النهارده يومك" },
        { en: "Fresh day. Let's go", ar: "يوم جديد. يلا" },
        { en: "One good session is all I need", ar: "تمرين كويس واحد كفاية" }
      ];
    } else if (hour >= 12 && hour < 18) {
      pool = [
        { en: "Halfway through, keep pushing", ar: "نص اليوم خلص، كمل" },
        { en: "Don't lose the day", ar: "متضيعش اليوم" },
        { en: "Afternoon grind. Let's get it", ar: "وقت الشغل. يلا بينا" }
      ];
    } else if (hour >= 18 && hour < 22) {
      pool = [
        { en: "Strong finish to the day", ar: "يلا نقفل اليوم بقوة" },
        { en: "Late session? Show up anyway", ar: "تمرين متأخر؟ اطلع برضه" },
        { en: "Leave the day's stress here", ar: "طَلّع ضغط اليوم الف هنا" }
      ];
    } else {
      pool = [
        { en: "Burning the midnight oil?", ar: "بتسهر على التمرين؟" },
        { en: "Late night gains", ar: "عضلات اخر الليل" },
        { en: "Get it done, then sleep", ar: "اخلص وادخل نام" }
      ];
    }
  }

  const selectedStr = pool[hashVal % pool.length];
  
  const substitute = (text: string) => {
    return text
      .replace("{coachName}", coachName)
      .replace("{coachNameAr}", coachNameAr)
      .replace("{streak}", streak.toString())
      .replace("{X}", volumeDelta.toString());
  };

  return {
    en: substitute(selectedStr.en),
    ar: substitute(selectedStr.ar)
  };
}
