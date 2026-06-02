import { Goal, ActivityLevel, BodyType, TrainingLocation, FitnessLevel, PreferredTime } from './types';

export const GOALS: { id: Goal; title: string; arabic: string; icon: string }[] = [
  { id: 'lose-weight', title: 'Lose Weight', arabic: 'تخسيس الوزن', icon: 'monitor_weight' },
  { id: 'build-muscle', title: 'Build Muscle', arabic: 'بناء عضلات', icon: 'fitness_center' },
  { id: 'stay-fit', title: 'Stay Fit', arabic: 'البقاء بلياقة', icon: 'favorite' },
  { id: 'athletic-performance', title: 'Athletic Performance', arabic: 'أداء رياضي', icon: 'speed' },
];

export const ACTIVITY_LEVELS: { id: ActivityLevel; title: string; description: string }[] = [
  { id: 'sedentary', title: 'Sedentary', description: 'Little to no exercise, desk job environment.' },
  { id: 'moderately-active', title: 'Moderately Active', description: 'Regular exercise or an active workplace.' },
  { id: 'very-active', title: 'Very Active', description: 'Intense physical activity or high-performance training.' },
];

export const BODY_TYPES: { id: BodyType; title: string; icon: string }[] = [
  { id: 'ectomorph', title: 'Ectomorph', icon: 'accessibility_new' },
  { id: 'mesomorph', title: 'Mesomorph', icon: 'fitness_center' },
  { id: 'endomorph', title: 'Endomorph', icon: 'monitor_weight' },
];

export const TRAINING_LOCATIONS: { id: TrainingLocation; title: string; description: string; icon: string }[] = [
  { id: 'full-gym', title: 'Full Gym', description: 'Access to all machines and racks', icon: 'fitness_center' },
  { id: 'home-equipment', title: 'Home with Equipment', description: 'Dumbbells, kettlebells, or bands', icon: 'home_repair_service' },
  { id: 'bodyweight-only', title: 'Bodyweight Only', description: 'No equipment needed, train anywhere', icon: 'accessibility_new' },
];

export const COACHES = [
  {
    id: 'khaled',
    name: 'Khaled',
    arabicName: 'خالد',
    tag: 'Direct & Structured',
    arabicTag: 'مباشر ومنظم',
    description: 'Direct, structured, performance-focused.',
    arabicDescription: 'مباشر، منظم، يركز على الأداء.',
    speech: "I'll keep you focused, structured, and honest — without overcomplicating the plan.",
    arabicSpeech: 'هخليك مركز ومنظم وصادق مع نفسك — من غير ما نعقد الخطة.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxcqV6oQe27M3TT1d7GaaMR17o4ffPu5JcV1ZF2jh_HtxMSTwpD5jxPfe5gWGTh4wKXj0ZJ8TdTMgkrN1WSl8NNatN-RjXAIWJERazHlV6V3rWbbFSNd-mXsvQQMD2QuSjXuYKjNwLiVGI6bDUJfnbPMVd4KxFDm2pZIAZowMxB7Hnove4yLFMl6fmqcLBHEiwcrGnFfCcLYzsqH41Q4Jnv3zQYbW_KGgwuvDEA3OI1-cTRW5eYseKIo5CPp-9MgU9vM5CRL3_cUo',
  },
  {
    id: 'maya',
    name: 'Maya',
    arabicName: 'مايا',
    tag: 'Calm & Habit-Focused',
    arabicTag: 'هادئة ومركّزة على العادات',
    description: 'Supportive, calm, habit-focused.',
    arabicDescription: 'داعمة، هادئة، تركز على العادات.',
    speech: "I'll help you stay consistent without guilt. We'll build habits that actually fit your life.",
    arabicSpeech: 'هساعدك تبقى ملتزم من غير ندم. هنبني عادات بتناسب حياتك فعلاً.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZhIrMax9QRnk6qL3kq3W9G8nJZGopz9Mtolp8zJu28T0TMGAyj04iWipfd6xQdfKdCH4eGL71a5b1I0ICjn-ODUIHMGhhzS5_iCVTRX2Z_Yop_Du0MUMETW8rsvYzir7zO9OzgO777e9XQDTE3AlBGcQOnZjJYtvh0zSiOrQeV3iu9Ht7cgMBxM7catSCXfCOHCkn7uATMNRR3UWM55-1G4tg_Sj8pqtci65I760sUSnpBkXXFnWlFnO_qesWKVrEtzprKjTC93U',
  },
  {
    id: 'nour',
    name: 'Nour',
    arabicName: 'نور',
    tag: 'Energetic & Motivating',
    arabicTag: 'نشيطة ومُحفّزة',
    description: 'Energetic, motivating, high-accountability.',
    arabicDescription: 'نشيطة، مُحفّزة، مسؤوليتها عالية.',
    speech: "I'll bring the energy, but I'll still keep the plan realistic.",
    arabicSpeech: 'هجيب الحماس، بس الخطة هتفضل واقعية.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCRamdtGzoKKOSIbq_kV1chFjf_kXCOM-QSBbKzEnX7i0-QqU3FpvI3LYLsaY04XNCOFe9vUJ1Uhc07akk3y9hNtqXiMXKnNnj4I_ji34ErNMMuw9cK0DNOBVZ5i0zOtwH_MBZUYGIaK2N7egtgOc3P5qNvJAB4qnOg_ZnXuVoKaiew2N-kZHN1CEWwx_Fyn0hlY6GJozR0twvL8eIcuHdsDNL_TDdBFEcEupPy56cruS4y7bMzFHh7FCAV6JHoPGfIbFbqNL0s3I0',
  },
  {
    id: 'omar',
    name: 'Omar',
    arabicName: 'عمر',
    tag: 'Data-Driven',
    arabicTag: 'مدفوع بالبيانات',
    description: 'Data-driven, precise.',
    arabicDescription: 'مدفوع بالبيانات، دقيق.',
    speech: "I'll use your data to keep your plan precise, balanced, and easy to adjust.",
    arabicSpeech: 'هستخدم بياناتك عشان خطتك تفضل دقيقة، متوازنة، وسهلة التعديل.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9LZ_m4CZ4EPyhTRiFoAs7-ZnI2BS72CJiKyAq5dJ4sfyzXmMkUfdb6Wbr5xhXC2Klp7eQVa68hmcGQxPZyCJKYPrGidhHrPxFHhy8JnYvmKAlwT59H3J77lNUhC2Ly-vV4afIzxRMrazQen02EhSE6xQifFgexEyWV57rLSOCwCer1jswhTdaGqLacUbi0wdRybUDt14sKjTvckuQXz_NWTHDQMSiT5QyiMon2pAtjuRK1iJi1nvaQZ5_M9srexizgG1rfPLQXPw',
  },
];
