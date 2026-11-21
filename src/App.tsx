import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  XCircle,
  Sparkles,
  Brain,
  FileText,
  ChevronRight,
  ChevronLeft,
  Award,
  Search,
  Layers,
  Atom,
  Loader2,
  AlertCircle,
  Check,
  Video,
  Globe,
  GraduationCap,
  Mic
} from 'lucide-react';

// Strict Global Male-Only Audio Guard
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.cancel();
}

// ============================================================================
// SAFE REACT CHILD & ERROR BOUNDARY GUARD
// ============================================================================

function safeText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

class StudioErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-200 text-slate-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-100 shadow-sm border border-slate-300 rounded-2xl p-6 space-y-4 text-center">
            <h2 className="text-lg font-bold text-rose-400">Physics Studio View Recovered</h2>
            <p className="text-xs text-slate-600">{this.state.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
            >
              Reload Studio
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// RUNTIME API KEY HELPER (SUPPORTS BOTH CANVAS RUNTIME & VITE ENV)
// ============================================================================

function getGeminiApiKey(): string {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string> })?.env;
    if (metaEnv && typeof metaEnv.VITE_GEMINI_API_KEY === 'string') {
      return metaEnv.VITE_GEMINI_API_KEY;
    }
  } catch {
    // Fallback to empty string so Canvas runtime injects the key automatically
  }
  return '';
}

// ============================================================================
// MULTILINGUAL TRANSLATIONS & SENIOR OLD MALE INDIAN VOICE CONFIGURATION
// ============================================================================

type LangCode = 'en' | 'ta' | 'hi' | 'ml' | 'te' | 'kn';

interface LanguageOption {
  code: LangCode;
  name: string;
  nativeName: string;
  bcp47: string;
  ttsInstruction: string;
}

const LANGUAGES: LanguageOption[] = [
  {
    code: 'en',
    name: 'English (India)',
    nativeName: 'English (IN)',
    bcp47: 'en-IN',
    ttsInstruction:
      'VOICE STYLE: 70-year-old senior Indian male physics professor from Chennai speaking in a deep, seasoned, resonant, authoritative Indian English accent (en-IN). Strictly senior old male Indian voice only—NEVER American or British accent, NEVER female voice. Do NOT say good morning, vanakkam, hello, or any greetings. Speak steadily and read every word completely from start to finish:'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    bcp47: 'ta-IN',
    ttsInstruction:
      'குரல் நடை: 70 வயது மூத்த இந்திய ஆண் இயற்பியல் பேராசிரியர் (Senior Old Male Indian Professor Voice) கம்பீரமான, ஆழமான, அனுபவம் மிக்க குரலில் தெளிவான இந்தியத் தமிழ் உச்சரிப்பில் (ta-IN) பேசுகிறார். ஆண் குரல் மட்டுமே. வணக்கம் அல்லது காலை வணக்கம் போன்ற முகவுரைகளைத் தவிர்த்து, தொடக்கம் முதல் இறுதி வரை ஒவ்வொரு சொல்லையும் முழுமையாக வாசியுங்கள்:'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    bcp47: 'hi-IN',
    ttsInstruction:
      'आवाज़ शैली: 70 वर्षीय वरिष्ठ अनुभवी पुरुष भारतीय भौतिकी प्रोफेसर (Senior Old Male Indian Professor Voice) जो गहरी, गंभीर और प्रभावशाली भारतीय आवाज़ (hi-IN) में बोलते हैं। केवल वरिष्ठ पुरुष भारतीय आवाज़, कोई अमेरिकी लहजा नहीं। नमस्ते या सुप्रभात न कहें। शुरू से अंत तक हर एक शब्द को स्पष्ट और पूरे समय तक बोलें:'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    bcp47: 'ml-IN',
    ttsInstruction:
      'ശബ്ദശൈലി: 70 വയസ്സുള്ള മുതിർന്ന ഇന്ത്യൻ പുരുഷ ഭൗതികശാസ്ത്ര പ്രൊഫസർ (Senior Old Male Indian Professor Voice) ഗംഭീരവും ആഴമുള്ളതുമായ ശബ്ദത്തിൽ വ്യക്തമായ ഇന്ത്യൻ ഉച്ചാരണത്തോടെ (ml-IN) സംസാരിക്കുന്നു. മുതിർന്ന പുരുഷ ശബ്ദം മാത്രം. നമസ്കാരം എന്ന് പറയരുത്. തുടക്കം മുതൽ അവസാനം വരെ എല്ലാ വാക്കുകളും പൂർണ്ണമായി വായിക്കുക:'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    bcp47: 'te-IN',
    ttsInstruction:
      'స్వర శైలి: 70 ఏళ్ల సీనియర్ భారతీయ పురుష భౌతిక శాస్త్ర ప్రొఫెసర్ (Senior Old Male Indian Professor Voice) గంభీరమైన, లోతైన గొంతుతో స్పష్టమైన భారతీయ ఉచ్చారణలో (te-IN) మాట్లాడుతున్నారు. సీనియర్ పురుష గొంతు మాత్రమే. నమస్కారం అని చెప్పకండి. మొదటి నుండి చివరి వరకు ప్రతి పదాన్ని పూర్తిగా చదవండి:'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    bcp47: 'kn-IN',
    ttsInstruction:
      'ಧ್ವನಿ ಶೈಲಿ: 70 ವರ್ಷದ ಹಿರಿಯ ಭಾರತೀಯ ಪುರುಷ ಭೌತಶಾಸ್ತ್ರ ಪ್ರಾಧ್ಯಾಪಕರು (Senior Old Male Indian Professor Voice) ಗಂಭೀರವಾದ, ಆಳವಾದ ಧ್ವನಿಯಲ್ಲಿ ಸ್ಪಷ್ಟವಾದ ಭಾರತೀಯ ಉಚ್ಚಾರಣೆಯೊಂದಿಗೆ (kn-IN) ಮಾತನಾಡುತ್ತಿದ್ದಾರೆ. ಹಿರಿಯ ಪುರುಷ ಧ್ವನಿ ಮಾತ್ರ. ನಮಸ್ಕಾರ ಎಂದು ಹೇಳಬೇಡಿ. ಪ್ರಾರಂಭದಿಂದ ಕೊನೆಯವರೆಗೆ ಪ್ರತಿಯೊಂದು ಪದವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ಓದಿ:'
  }
];

interface UiTranslationSet {
  appSubtitle: string;
  tabStudio: string;
  tabSyllabus: string;
  tabPractice: string;
  tabPast: string;
  syllabusMastery: string;
  studioHeader: string;
  studioSub: string;
  topicLabel: string;
  generateBtn: string;
  generatingBtn: string;
  watchLesson: string;
  fullUnitVideo: string;
  videoBtn: string;
  syllabusHeader: string;
  syllabusSub: string;
  allClass12Label: string;
  volume1Label: string;
  volume2Label: string;
  practiceHeader: string;
  practiceSub: string;
  allTopicsFilter: string;
  questionLabel: string;
  explanationLabel: string;
  pastHeader: string;
  pastSub: string;
  searchPlaceholder: string;
  revealSolution: string;
  hideSolution: string;
  generateWalkthrough: string;
  finalAnswerLabel: string;
  askTutorTitle: string;
  askTutorPlaceholder: string;
  solveBtn: string;
  derivingBtn: string;
}

const ENGLISH_UI_STRINGS: UiTranslationSet = {
  appSubtitle: 'TN Class 12 (+2) Samacheer Kalvi Physics AI',
  tabStudio: 'AI Video Studio',
  tabSyllabus: 'Class 12 Syllabus',
  tabPractice: 'Practice',
  tabPast: 'HSC Board Papers',
  syllabusMastery: 'Class 12 Mastery',
  studioHeader: 'TN Class 12 (+2) State Board Physics AI Video Studio',
  studioSub: 'Narration-driven visuals (updates every 2 spoken points) with Senior Old Male Indian Professor voice.',
  topicLabel: 'TN Class 12 Samacheer Kalvi Physics Unit, Lesson or Topic',
  generateBtn: 'Generate AI Lesson',
  generatingBtn: 'Creating Lesson (Max 5s)...',
  watchLesson: 'Watch AI Video Lesson',
  fullUnitVideo: 'Full Unit Video',
  videoBtn: 'Video',
  syllabusHeader: 'Tamil Nadu Class 12 (+2) Physics Complete Syllabus',
  syllabusSub: 'Every lesson & every individual topic from Tamil Nadu State Board Samacheer Kalvi Higher Secondary Second Year: Volume 1 (Units 1–5) & Volume 2 (Units 6–10).',
  allClass12Label: 'All Class 12',
  volume1Label: 'Volume 1',
  volume2Label: 'Volume 2',
  practiceHeader: 'TN Class 12 Physics Practice Arena',
  practiceSub: 'Tamil Nadu State Board Class 12 (+2) Physics practice questions with worked explanations.',
  allTopicsFilter: 'All Class 12 Physics Topics (Units 1–10)',
  questionLabel: 'Question',
  explanationLabel: 'Explanation',
  pastHeader: 'TN Class 12 (+2) HSC Physics Public Exam Archive',
  pastSub: 'Tamil Nadu HSC (+2) Physics 5-Mark Public Exam questions with step-by-step markscheme solutions.',
  searchPlaceholder: 'Search year or topic...',
  revealSolution: 'Reveal Markscheme Solution',
  hideSolution: 'Hide Markscheme Solution',
  generateWalkthrough: 'Generate Video Walkthrough',
  finalAnswerLabel: 'Final Answer',
  askTutorTitle: 'Ask Avichi PhysNova AI (Class 12)',
  askTutorPlaceholder: 'Ask any TN Class 12 Physics derivation, law, or numerical...',
  solveBtn: 'Derive Step-by-Step',
  derivingBtn: 'Deriving...'
};

const TAMIL_UI_STRINGS: UiTranslationSet = {
  appSubtitle: '12-ஆம் வகுப்பு சமச்சீர் கல்வி இயற்பியல் AI',
  tabStudio: 'AI வீடியோ பாடம்',
  tabSyllabus: '12-ஆம் வகுப்பு பாடத்திட்டம்',
  tabPractice: 'பயிற்சி வினாக்கள்',
  tabPast: 'பொதுத்தேர்வு வினாக்கள்',
  syllabusMastery: 'பாடத்திட்ட தேர்ச்சி',
  studioHeader: 'தமிழ்நாடு அரசு 12-ஆம் வகுப்பு (+2) சமச்சீர் கல்வி இயற்பியல் AI வீடியோ வகுப்பறை',
  studioSub: 'மூத்த இந்திய ஆண் பேராசிரியரின் குரல் விளக்கத்தில் ஒவ்வொரு 2 கருத்துகளுக்கும் ஏற்ப மாறும் நேரடி இயற்பியல் படங்கள்.',
  topicLabel: '12-ஆம் வகுப்பு இயற்பியல் பாடம் அல்லது தலைப்பைத் தேர்ந்தெடுக்கவும்',
  generateBtn: 'AI பாடம் உருவாக்கு',
  generatingBtn: 'பாடம் உருவாகிறது (5 வினாடிகளுக்குள்)...',
  watchLesson: 'AI வீடியோ பாடம் காண்க',
  fullUnitVideo: 'முழு அலகு வீடியோ',
  videoBtn: 'வீடியோ',
  syllabusHeader: 'தமிழ்நாடு அரசு 12-ஆம் வகுப்பு (+2) முழுமையான இயற்பியல் பாடத்திட்டம்',
  syllabusSub: 'தொகுதி 1 (அலகுகள் 1–5) மற்றும் தொகுதி 2 (அலகுகள் 6–10) உள்ள அனைத்துப் பாடங்களும் ஒவ்வொரு தலைப்பும் முழுமையாக.',
  allClass12Label: 'அனைத்து 12-ஆம் வகுப்பு',
  volume1Label: 'தொகுதி 1',
  volume2Label: 'தொகுதி 2',
  practiceHeader: '12-ஆம் வகுப்பு இயற்பியல் பயிற்சி அரங்கம்',
  practiceSub: 'தமிழ்நாடு மாநிலப் பாடத்திட்டம் 12-ஆம் வகுப்பு (+2) இயற்பியல் பயிற்சி வினாக்கள் மற்றும் விரிவான விளக்கங்கள்.',
  allTopicsFilter: 'அனைத்து 12-ஆம் வகுப்பு இயற்பியல் தலைப்புகள் (அலகுகள் 1–10)',
  questionLabel: 'வினா',
  explanationLabel: 'விளக்கம்',
  pastHeader: '12-ஆம் வகுப்பு (+2) இயற்பியல் பொதுத்தேர்வு வினாத்தாள்கள்',
  pastSub: 'தமிழ்நாடு மேல்நிலை இரண்டாம் ஆண்டு (+2) இயற்பியல் 5-மதிப்பெண் பொதுத்தேர்வு வினாக்கள் மற்றும் படிப்படியான தீர்வுகள்.',
  searchPlaceholder: 'ஆண்டு அல்லது தலைப்பைத் தேடுக...',
  revealSolution: 'விடைக்குறிப்பைக் காண்க',
  hideSolution: 'விடைக்குறிப்பை மறைக்க',
  generateWalkthrough: 'வீடியோ விளக்கம் உருவாக்கு',
  finalAnswerLabel: 'இறுதி விடை',
  askTutorTitle: 'Avichi PhysNova AI ஆசிரியரிடம் கேளுங்கள்',
  askTutorPlaceholder: '12-ஆம் வகுப்பு இயற்பியல் விதிகள், சமன்பாடுகள் அல்லது கணக்குகளைக் கேளுங்கள்...',
  solveBtn: 'படிப்படியாகத் தீர்க்கவும்',
  derivingBtn: 'தீர்க்கப்படுகிறது...'
};

// ONLY Tamil switches the entire UI and questions into Tamil; all other languages keep UI in English
function getUiStrings(lang: LangCode): UiTranslationSet {
  return lang === 'ta' ? TAMIL_UI_STRINGS : ENGLISH_UI_STRINGS;
}

// ============================================================================
// COMPLETE TAMIL NADU STATE BOARD (SAMACHEER KALVI) CLASS 12 (+2) PHYSICS
// EVERY SINGLE LESSON (UNITS 1–10) AND EVERY INDIVIDUAL TOPIC COVERED
// ============================================================================

type VolumeFilter = 'all' | 'Volume 1' | 'Volume 2';

interface Topic {
  id: string;
  code: string;
  title: string;
  tamilTitle: string;
  description: string;
  tamilDescription: string;
  subTopics: string[];
  tamilSubTopics: string[];
  keyFormulas: string[];
  difficulty: 'Foundation' | 'Intermediate' | 'Advanced';
  tamilDifficulty: string;
  estimatedMinutes: number;
}

interface Unit {
  id: string;
  grade: '12';
  volume: 'Volume 1' | 'Volume 2';
  tamilVolume: string;
  number: number;
  title: string;
  tamilTitle: string;
  topics: Topic[];
}

interface PracticeQuestion {
  id: string;
  grade: '12';
  topicId: string;
  question: string;
  tamilQuestion: string;
  options: string[];
  tamilOptions: string[];
  correctIndex: number;
  explanation: string;
  tamilExplanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tamilDifficulty: string;
}

interface PastQuestion {
  id: string;
  grade: '12';
  year: number;
  paper: string;
  tamilPaper: string;
  topic: string;
  tamilTopic: string;
  marks: number;
  question: string;
  tamilQuestion: string;
  solutionSteps: string[];
  tamilSolutionSteps: string[];
  finalAnswer: string;
  tamilFinalAnswer: string;
}

const TN_PHYSICS_SYLLABUS: Unit[] = [
  // ==================== VOLUME 1: UNIT 1 ====================
  {
    id: 'tn12-phys-u1',
    grade: '12',
    volume: 'Volume 1',
    tamilVolume: 'தொகுதி 1',
    number: 1,
    title: 'Electrostatics',
    tamilTitle: 'நிலை மின்னியல்',
    topics: [
      {
        id: 'tn12-p-u1-t1',
        code: '1.1',
        title: 'Introduction, Basic Properties of Charges & Coulomb’s Law',
        tamilTitle: 'அறிமுகம், மின்னூட்டங்களின் அடிப்படைப் பண்புகள் மற்றும் கூலூம் விதி',
        description:
          'Historical background of electrostatics, conservation and quantization of electric charge (q = ne), Coulomb’s inverse-square law in scalar and vector forms, permittivity of free space & medium, and superposition principle for multiple point charges.',
        tamilDescription:
          'நிலைமின்னியலின் வரலாற்றுப் பின்னணி, மின்னூட்டத்தின் அழிவின்மை மற்றும் குவாண்டமாக்கல் (q = ne), ஸ்கேலார் மற்றும் வெக்டர் வடிவில் கூலூம் எதிர் இருமடி விதி, வெற்றிடம் மற்றும் ஊடகத்தின் விடுதிறன், மற்றும் பல புள்ளி மின்துகள்களுக்கான மேற்பொருந்துதல் தத்துவம்.',
        subTopics: [
          '1.1.1 Conservation & Quantization of Electric Charge (q = ±ne)',
          '1.1.2 Coulomb’s Law in Scalar and Vector Form & Relative Permittivity (ε_r)',
          '1.1.3 Superposition Principle for Multiple Point Charges'
        ],
        tamilSubTopics: [
          '1.1.1 மின்னூட்டத்தின் அழிவின்மை மற்றும் குவாண்டமாக்கல் (q = ±ne)',
          '1.1.2 ஸ்கேலார் மற்றும் வெக்டர் வடிவில் கூலூம் விதி மற்றும் ஒப்புமை விடுதிறன் (ε_r)',
          '1.1.3 பல புள்ளி மின்துகள்களுக்கான மேற்பொருந்துதல் தத்துவம்'
        ],
        keyFormulas: ['q = ±ne', 'F = (1 / 4πε₀) · (q₁q₂ / r²) r̂', 'ε_r = ε / ε₀ = F_air / F_medium'],
        difficulty: 'Foundation',
        tamilDifficulty: 'அடிப்படை',
        estimatedMinutes: 18
      },
      {
        id: 'tn12-p-u1-t2',
        code: '1.2',
        title: 'Electric Field and Electric Field Lines',
        tamilTitle: 'மின்புலம் மற்றும் மின்புலக் கோடுகள்',
        description:
          'Electric field intensity due to a point charge and system of discrete charges, continuous charge distributions (linear λ, surface σ, volume ρ), and properties of electric field lines.',
        tamilDescription:
          'புள்ளி மின்துகள் மற்றும் மின்துகள்களின் தொகுப்பினால் ஏற்படும் மின்புலச் செறிவு, தொடர் மின்னூட்டப் பரவல்கள் (நீள அடர்த்தி λ, பரப்பு அடர்த்தி σ, பரும அடர்த்தி ρ) மற்றும் மின்புலக் கோடுகளின் பண்புகள்.',
        subTopics: [
          '1.2.1 Electric Field Due to Point Charge & System of Charges',
          '1.2.2 Electric Field Due to Continuous Charge Distributions (λ, σ, ρ)',
          '1.2.3 Rules & Properties of Electric Field Lines'
        ],
        tamilSubTopics: [
          '1.2.1 புள்ளி மின்துகள் மற்றும் மின்துகள்களின் தொகுப்பினால் ஏற்படும் மின்புலம்',
          '1.2.2 தொடர் மின்னூட்டப் பரவல்களால் ஏற்படும் மின்புலம் (λ, σ, ρ)',
          '1.2.3 மின்புலக் கோடுகளின் விதிகள் மற்றும் பண்புகள்'
        ],
        keyFormulas: ['E = F / q₀ = (1 / 4πε₀) · (q / r²) r̂', 'dq = λ dl = σ dA = ρ dV'],
        difficulty: 'Foundation',
        tamilDifficulty: 'அடிப்படை',
        estimatedMinutes: 16
      },
      {
        id: 'tn12-p-u1-t3',
        code: '1.3',
        title: 'Electric Dipole and Its Properties',
        tamilTitle: 'மின் இருமுனை மற்றும் அதன் பண்புகள்',
        description:
          'Electric dipole moment p = 2qa, derivation of electric field at a point on the axial line and equatorial plane, torque τ = p × E experienced by a dipole in uniform electric field, and microwave oven principle.',
        tamilDescription:
          'மின் இருமுனை திருப்புத்திறன் p = 2qa, அச்சுக்கோடு மற்றும் நடுவரைத் தளத்தில் உள்ள புள்ளியில் மின்புலம் வருவித்தல், சீரான மின்புலத்தில் மின் இருமுனை உணரும் திருப்புவிசை τ = p × E மற்றும் நுண்ணலை அடுப்பின் தத்துவம்.',
        subTopics: [
          '1.3.1 Electric Dipole Moment & Electric Field on Axial Line',
          '1.3.2 Electric Field on Equatorial Plane of an Electric Dipole',
          '1.3.3 Torque Experienced by an Electric Dipole in a Uniform Electric Field'
        ],
        tamilSubTopics: [
          '1.3.1 மின் இருமுனை திருப்புத்திறன் மற்றும் அச்சுக்கோட்டில் மின்புலம்',
          '1.3.2 மின் இருமுனையின் நடுவரைத் தளத்தில் மின்புலம்',
          '1.3.3 சீரான மின்புலத்தில் மின் இருமுனை உணரும் திருப்புவிசை'
        ],
        keyFormulas: ['p = 2qa', 'E_axial = 2p / (4πε₀r³)', 'E_eq = -p / (4πε₀r³)', 'τ = p × E = pE sinθ'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      },
      {
        id: 'tn12-p-u1-t4',
        code: '1.4',
        title: 'Electrostatic Potential and Potential Energy',
        tamilTitle: 'நிலைமின்னழுத்தம் மற்றும் நிலைமின்னழுத்த ஆற்றல்',
        description:
          'Electrostatic potential due to a point charge and an electric dipole, equipotential surfaces, relation between electric field and potential (E = -dV/dr), electrostatic potential energy of two/three point charges, and dipole in uniform electric field.',
        tamilDescription:
          'புள்ளி மின்துகள் மற்றும் மின் இருமுனையால் ஏற்படும் நிலைமின்னழுத்தம், சமமின்னழுத்தப் பரப்புகள், மின்புலம் மற்றும் மின்னழுத்தத்திற்கு இடையேயான தொடர்பு (E = -dV/dr), மற்றும் மின்துகள்களின் நிலைமின்னழுத்த ஆற்றல்.',
        subTopics: [
          '1.4.1 Electrostatic Potential Due to Point Charge & Electric Dipole',
          '1.4.2 Equipotential Surfaces & Relation Between E and V (E = -∇V)',
          '1.4.3 Electrostatic Potential Energy of System of Charges & Dipole (U = -p · E)'
        ],
        tamilSubTopics: [
          '1.4.1 புள்ளி மின்துகள் மற்றும் மின் இருமுனையால் ஏற்படும் நிலைமின்னழுத்தம்',
          '1.4.2 சமமின்னழுத்தப் பரப்புகள் மற்றும் E, V இடையேயான தொடர்பு',
          '1.4.3 மின்துகள் தொகுப்பு மற்றும் மின் இருமுனையின் நிலைமின்னழுத்த ஆற்றல்'
        ],
        keyFormulas: ['V = (1 / 4πε₀) · (q / r)', 'V_dipole = (p cosθ) / (4πε₀r²)', 'U = -pE cosθ'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      },
      {
        id: 'tn12-p-u1-t5',
        code: '1.5',
        title: 'Gauss’s Law and Its Applications',
        tamilTitle: 'காஸ் விதி மற்றும் அதன் பயன்பாடுகள்',
        description:
          'Electric flux Φ_E, statement and proof of Gauss’s law, and electric field derivations for an infinitely long charged wire, infinite charged plane sheet, two parallel oppositely charged sheets, and uniformly charged spherical shell.',
        tamilDescription:
          'மின்பாயம் Φ_E, காஸ் விதியின் கூற்று மற்றும் நிரூபணம், முடிவிலா நீளமுடைய மின்னூட்டம் பெற்ற கம்பி, சமதளத் தகடு, இரு இணைத் தகடுகள் மற்றும் சீராக மின்னூட்டம் பெற்ற கோளகக் கூடு ஆகியவற்றால் ஏற்படும் மின்புலம்.',
        subTopics: [
          '1.5.1 Electric Flux & Proof of Gauss’s Law',
          '1.5.2 Electric Field Due to Infinitely Long Charged Wire & Plane Sheet',
          '1.5.3 Electric Field Due to Two Parallel Sheets & Uniformly Charged Spherical Shell'
        ],
        tamilSubTopics: [
          '1.5.1 மின்பாயம் மற்றும் காஸ் விதியின் நிரூபணம்',
          '1.5.2 முடிவிலா நீளமுடைய மின்னூட்டக் கம்பி மற்றும் சமதளத் தகட்டால் ஏற்படும் மின்புலம்',
          '1.5.3 இரு இணைத் தகடுகள் மற்றும் கோளகக் கூட்டினால் ஏற்படும் மின்புலம்'
        ],
        keyFormulas: ['Φ_E = ∮ E · dA = q_enc / ε₀', 'E_wire = λ / (2πε₀r)', 'E_sheet = σ / (2ε₀)', 'E_shell(out) = Q / (4πε₀r²)'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      },
      {
        id: 'tn12-p-u1-t6',
        code: '1.6–1.8',
        title: 'Electrostatics of Conductors, Dielectrics, Capacitors & Van de Graaff Generator',
        tamilTitle: 'கடத்திகள், மின்காப்புப் பொருட்கள், மின்தேக்கிகள் மற்றும் வான் டி கிராப் இயற்றி',
        description:
          'Electrostatic shielding & Faraday cage, polar & non-polar dielectrics, polarization, parallel plate capacitor with & without dielectric, energy stored & energy density, capacitors in series & parallel, corona discharge, lightning arrester, and Van de Graaff generator.',
        tamilDescription:
          'நிலைமின்னியல் தடுப்புறை மற்றும் ஃபாரடே கூண்டு, முனைவுள்ள மற்றும் முனைவற்ற மின்காப்புப் பொருட்கள், இணைத்தட்டு மின்தேக்கி, மின்தேக்கியில் சேமிக்கப்படும் ஆற்றல், தொடர் மற்றும் பக்க இணைப்பு, ஒளிவட்ட மின்னிறக்கம், இடிதாங்கி மற்றும் வான் டி கிராப் இயற்றி.',
        subTopics: [
          '1.6.1 Conductors in Electrostatic Equilibrium, Electrostatic Shielding & Dielectrics',
          '1.7.1 Parallel Plate Capacitor, Dielectric Insertion & Energy Density (u_E = ½ε₀E²)',
          '1.7.2 Capacitors in Series and Parallel Combinations',
          '1.8.1 Corona Discharge, Lightning Arrester & Van de Graaff Generator'
        ],
        tamilSubTopics: [
          '1.6.1 நிலைமின்னியல் சமநிலையில் கடத்திகள், தடுப்புறை மற்றும் மின்காப்புகள்',
          '1.7.1 இணைத்தட்டு மின்தேக்கி, மின்காப்பு புகுத்துதல் மற்றும் ஆற்றல் அடர்த்தி',
          '1.7.2 தொடர் மற்றும் பக்க இணைப்பில் மின்தேக்கிகள்',
          '1.8.1 ஒளிவட்ட மின்னிறக்கம், இடிதாங்கி மற்றும் வான் டி கிராப் இயற்றி'
        ],
        keyFormulas: ['C = ε₀A / d', 'C_dielectric = ε_r C₀', 'u_E = ½ ε₀ E²', '1/C_s = ∑(1/C_i), C_p = ∑C_i'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      }
    ]
  },

  // ==================== VOLUME 1: UNIT 2 ====================
  {
    id: 'tn12-phys-u2',
    grade: '12',
    volume: 'Volume 1',
    tamilVolume: 'தொகுதி 1',
    number: 2,
    title: 'Current Electricity',
    tamilTitle: 'மின்னோட்டவியல்',
    topics: [
      {
        id: 'tn12-p-u2-t1',
        code: '2.1–2.2',
        title: 'Electric Current, Drift Velocity, Mobility & Microscopic Ohm’s Law',
        tamilTitle: 'மின்னோட்டம், இழுப்புத் திசைவேகம், இயக்க எண் மற்றும் ஓம் விதியின் நுண்வடிவம்',
        description:
          'Conventional current, free electron model, drift velocity v_d, relaxation time τ, mobility μ, relation I = n e A v_d, current density J, microscopic Ohm’s law J = σE, macroscopic Ohm’s law V = IR, resistivity, conductivity, and ohmic vs non-ohmic devices.',
        tamilDescription:
          'மரபு மின்னோட்டம், கட்டற்ற எலக்ட்ரான் மாதிரி, இழுப்புத் திசைவேகம் v_d, தளர்வு நேரம் τ, இயக்க எண் μ, I = n e A v_d தொடர்பு, மின்னோட்ட அடர்த்தி J, ஓம் விதியின் நுண்வடிவம் J = σE மற்றும் பயன்பாட்டு வடிவம் V = IR.',
        subTopics: [
          '2.1.1 Electric Current, Drift Velocity (v_d) & Mobility (μ)',
          '2.2.1 Microscopic Form of Ohm’s Law (J = σE) & Macroscopic Ohm’s Law (V = IR)',
          '2.2.2 Resistivity, Conductivity & Ohmic vs Non-Ohmic Materials'
        ],
        tamilSubTopics: [
          '2.1.1 மின்னோட்டம், இழுப்புத் திசைவேகம் (v_d) மற்றும் இயக்க எண் (μ)',
          '2.2.1 ஓம் விதியின் நுண்வடிவம் (J = σE) மற்றும் பயன்பாட்டு வடிவம் (V = IR)',
          '2.2.2 மின்தடை எண், மின்கடத்து எண் மற்றும் ஓம் விதிக்கு உட்படும்/உட்படாத பொருட்கள்'
        ],
        keyFormulas: ['v_d = -(eτ / m) E', 'I = n e A v_d', 'J = σ E', 'R = ρ l / A'],
        difficulty: 'Foundation',
        tamilDifficulty: 'அடிப்படை',
        estimatedMinutes: 20
      },
      {
        id: 'tn12-p-u2-t2',
        code: '2.2.4–2.3',
        title: 'Resistors in Series/Parallel, Colour Code, Temperature Dependence & Joule Heating',
        tamilTitle: 'மின்தடையாக்கிகளின் இணைப்பு, நிறக் குறியீடு, வெப்பநிலை சார்பு மற்றும் ஜூல் வெப்ப விளைவு',
        description:
          'Equivalent resistance in series & parallel, carbon resistor colour coding, temperature coefficient of resistivity α (conductors, semiconductors, alloys, superconductivity), electric energy & power, and Joule’s law of heating.',
        tamilDescription:
          'தொடர் மற்றும் பக்க இணைப்பில் தொகுபயன் மின்தடை, கார்பன் மின்தடையாக்கி நிறக் குறியீடு, மின்தடை எண்ணின் வெப்பநிலை எண் α, மீக்கடத்துத்திறன், மின்திறன் மற்றும் ஜூல் வெப்ப விளைவு விதி.',
        subTopics: [
          '2.2.4 Resistors in Series & Parallel and Carbon Resistor Colour Code',
          '2.2.5 Temperature Dependence of Resistivity & Superconductivity',
          '2.3.1 Electric Power, Energy & Joule’s Law of Heating (H = I²Rt)'
        ],
        tamilSubTopics: [
          '2.2.4 தொடர் மற்றும் பக்க இணைப்பு மின்தடையாக்கிகள் மற்றும் நிறக் குறியீடு',
          '2.2.5 மின்தடை எண்ணின் வெப்பநிலை சார்பு மற்றும் மீக்கடத்துத்திறன்',
          '2.3.1 மின்திறன், மின்னாற்றல் மற்றும் ஜூல் வெப்ப விதி (H = I²Rt)'
        ],
        keyFormulas: ['R_s = ∑R_i, 1/R_p = ∑(1/R_i)', 'ρ_T = ρ₀[1 + α(T - T₀)]', 'H = I² R t = V I t'],
        difficulty: 'Foundation',
        tamilDifficulty: 'அடிப்படை',
        estimatedMinutes: 18
      },
      {
        id: 'tn12-p-u2-t3',
        code: '2.4',
        title: 'Electric Cells, EMF, Internal Resistance & Combination of Cells',
        tamilTitle: 'மின்கலன்கள், மின்னியக்கு விசை, அகமின்தடை மற்றும் மின்கலன்களின் இணைப்பு',
        description:
          'Electromotive force (EMF) ε, terminal potential difference V, determination of internal resistance r using voltmeter, and cells connected in series and in parallel.',
        tamilDescription:
          'மின்னியக்கு விசை (EMF) ε, மின்முனைகளுக்கு இடையேயான மின்னழுத்த வேறுபாடு V, வோல்ட்மீட்டர் மூலம் அகமின்தடை r காணல், மற்றும் மின்கலன்களின் தொடர் மற்றும் பக்க இணைப்பு.',
        subTopics: [
          '2.4.1 EMF, Terminal Voltage & Determination of Internal Resistance (r)',
          '2.4.2 Cells in Series Combination',
          '2.4.3 Cells in Parallel Combination'
        ],
        tamilSubTopics: [
          '2.4.1 மின்னியக்கு விசை, மின்முனை மின்னழுத்தம் மற்றும் அகமின்தடை (r) காணல்',
          '2.4.2 மின்கலன்களின் தொடர் இணைப்பு',
          '2.4.3 மின்கலன்களின் பக்க இணைப்பு'
        ],
        keyFormulas: ['V = ε - I r', 'r = [(ε - V) / V] R', 'I_series = nε / (nr + R)', 'I_parallel = ε / (r/n + R)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 20
      },
      {
        id: 'tn12-p-u2-t4',
        code: '2.5',
        title: 'Kirchhoff’s Rules, Wheatstone Bridge, Meter Bridge & Potentiometer',
        tamilTitle: 'கிர்சாஃப் விதிகள், வீட்ஸ்டோன் சமனச்சுற்று, மீட்டர் சமனச்சுற்று மற்றும் மின்னழுத்தமானி',
        description:
          'Kirchhoff’s First Rule (Current Rule) and Second Rule (Voltage Rule), Wheatstone bridge balance condition P/Q = R/S, meter bridge experiment for unknown resistance & specific resistance, and potentiometer applications (comparing EMFs and internal resistance).',
        tamilDescription:
          'கிர்சாஃப் முதல் விதி (மின்னோட்ட விதி) மற்றும் இரண்டாம் விதி (மின்னழுத்த விதி), வீட்ஸ்டோன் சமனச்சுற்று சமநிலை நிபந்தனை P/Q = R/S, மீட்டர் சமனச்சுற்று மற்றும் மின்னழுத்தமானியின் பயன்பாடுகள்.',
        subTopics: [
          '2.5.1 Kirchhoff’s Current Rule & Voltage Rule',
          '2.5.2 Wheatstone Bridge Balance Condition & Meter Bridge',
          '2.5.3 Potentiometer Principle, Comparison of EMFs & Measurement of Internal Resistance'
        ],
        tamilSubTopics: [
          '2.5.1 கிர்சாஃப் மின்னோட்ட விதி மற்றும் மின்னழுத்த விதி',
          '2.5.2 வீட்ஸ்டோன் சமனச்சுற்று சமநிலை நிபந்தனை மற்றும் மீட்டர் சமனச்சுற்று',
          '2.5.3 மின்னழுத்தமானி தத்துவம், இரு மின்கலன்களின் EMF ஒப்பீடு மற்றும் அகமின்தடை காணல்'
        ],
        keyFormulas: ['∑I = 0, ∑IR = ∑ε', 'P / Q = R / S', 'ε₁ / ε₂ = l₁ / l₂', 'r = R [(l₁ - l₂) / l₂]'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 25
      },
      {
        id: 'tn12-p-u2-t5',
        code: '2.6',
        title: 'Thermoelectric Effect: Seebeck, Peltier & Thomson Effects',
        tamilTitle: 'வெப்ப மின் விளைவு: சீபெக், பெல்டியர் மற்றும் தாம்சன் விளைவுகள்',
        description:
          'Seebeck effect, thermocouple & thermopile, neutral temperature & temperature of inversion, Peltier effect, and positive & negative Thomson effects.',
        tamilDescription:
          'சீபெக் விளைவு, வெப்ப மின்னிரட்டை மற்றும் வெப்ப மின் அடுக்கு, நடுநிலை வெப்பநிலை மற்றும் புரட்டு வெப்பநிலை, பெல்டியர் விளைவு மற்றும் தாம்சன் விளைவுகள்.',
        subTopics: [
          '2.6.1 Seebeck Effect, Neutral & Inversion Temperatures and Thermopile',
          '2.6.2 Peltier Effect & Thomson Effect'
        ],
        tamilSubTopics: [
          '2.6.1 சீபெக் விளைவு, நடுநிலை மற்றும் புரட்டு வெப்பநிலைகள்',
          '2.6.2 பெல்டியர் விளைவு மற்றும் தாம்சன் விளைவு'
        ],
        keyFormulas: ['ε = αT + ½βT²', 'T_n = -α / β', 'T_i = 2T_n - T_c'],
        difficulty: 'Foundation',
        tamilDifficulty: 'அடிப்படை',
        estimatedMinutes: 15
      }
    ]
  },

  // ==================== VOLUME 1: UNIT 3 ====================
  {
    id: 'tn12-phys-u3',
    grade: '12',
    volume: 'Volume 1',
    tamilVolume: 'தொகுதி 1',
    number: 3,
    title: 'Magnetism and Magnetic Effects of Electric Current',
    tamilTitle: 'காந்தவியல் மற்றும் மின்னோட்டத்தின் காந்த விளைவுகள்',
    topics: [
      {
        id: 'tn12-p-u3-t1',
        code: '3.1–3.4',
        title: 'Earth’s Magnetism, Coulomb’s Magnetic Law, Bar Magnet & Magnetic Properties',
        tamilTitle: 'புவி காந்தவியல், காந்தவியலில் கூலூம் விதி, சட்டக் காந்தம் மற்றும் காந்தப் பண்புகள்',
        description:
          'Elements of Earth’s magnetic field (declination, dip, horizontal component), bar magnet dipole moment, axial & equatorial magnetic fields, torque in uniform magnetic field, Coulomb’s inverse-square law in magnetism, hysteresis loop, and diamagnetic, paramagnetic & ferromagnetic materials.',
        tamilDescription:
          'புவி காந்தப்புலத்தின் கூறுகள் (காந்த ஒதுக்கம், காந்தச் சரிவு, கிடைத்தளக் கூறு), சட்டக் காந்தத்தின் அச்சுக்கோடு மற்றும் நடுவரைக் கோட்டில் காந்தப்புலம், காந்தத் தயக்கக் கண்ணி மற்றும் டயா, பாரா, ஃபெர்ரோ காந்தப் பொருட்கள்.',
        subTopics: [
          '3.1.1 Earth’s Magnetic Field Elements & Bar Magnet Axial/Equatorial Field',
          '3.2.1 Coulomb’s Law in Magnetism & Torque on Magnetic Dipole',
          '3.3–3.4 Magnetic Susceptibility, Hysteresis & Dia-, Para-, Ferromagnetism'
        ],
        tamilSubTopics: [
          '3.1.1 புவி காந்தப்புலக் கூறுகள் மற்றும் சட்டக் காந்தத்தின் அச்சு/நடுவரைக் கோட்டு காந்தப்புலம்',
          '3.2.1 காந்தவியலில் கூலூம் விதி மற்றும் காந்த இருமுனை மீதான திருப்புவிசை',
          '3.3–3.4 காந்த ஏற்புத்திறன், தயக்கக் கண்ணி மற்றும் டயா, பாரா, ஃபெர்ரோ காந்தப்பொருட்கள்'
        ],
        keyFormulas: ['p_m = q_m · 2l', 'B_axial = (μ₀/4π) · (2p_m / r³)', 'τ = p_m × B', 'μ_r = 1 + χ_m'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      },
      {
        id: 'tn12-p-u3-t2',
        code: '3.5–3.7',
        title: 'Oersted’s Experiment, Biot–Savart Law & Tangent Law',
        tamilTitle: 'ஒயர்ஸ்டெட் சோதனை, பயோட்–சாவர்ட் விதி மற்றும் டேன்ஜென்ட் விதி',
        description:
          'Right-hand thumb rule, Biot–Savart law in vector form, magnetic field due to an infinitely long straight current-carrying conductor, magnetic field along the axis & center of a circular current-carrying coil, and tangent galvanometer.',
        tamilDescription:
          'வலது கை பெருவிரல் விதி, பயோட்–சாவர்ட் விதி, முடிவிலா நீளமுடைய மின்னோட்டம் பாயும் நேர்க்கடத்தியால் ஏற்படும் காந்தப்புலம், மின்னோட்டம் பாயும் வட்டச் சுருளின் அச்சில் காந்தப்புலம் மற்றும் டேன்ஜென்ட் கால்வனோமீட்டர்.',
        subTopics: [
          '3.5.1 Biot–Savart Law & Magnetic Field Due to Long Straight Conductor',
          '3.6.1 Magnetic Field Along the Axis & at the Center of a Circular Coil',
          '3.7.1 Tangent Law & Tangent Galvanometer'
        ],
        tamilSubTopics: [
          '3.5.1 பயோட்–சாவர்ட் விதி மற்றும் நீண்ட நேர்க்கடத்தியால் ஏற்படும் காந்தப்புலம்',
          '3.6.1 மின்னோட்டம் பாயும் வட்டச் சுருளின் அச்சில் மற்றும் மையத்தில் காந்தப்புலம்',
          '3.7.1 டேன்ஜென்ட் விதி மற்றும் டேன்ஜென்ட் கால்வனோமீட்டர்'
        ],
        keyFormulas: ['dB = (μ₀/4π) · (I dl × r̂ / r²)', 'B_straight = μ₀I / (2πa)', 'B_axis = μ₀NI R² / [2(R² + z²)^(3/2)]'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 25
      },
      {
        id: 'tn12-p-u3-t3',
        code: '3.8',
        title: 'Ampere’s Circuital Law, Solenoid and Toroid',
        tamilTitle: 'ஆம்பியர் சுற்று விதி, வரிச்சுருள் மற்றும் வட்ட வரிச்சுருள் (டோராய்டு)',
        description:
          'Statement and proof of Ampere’s circuital law, magnetic field due to a long straight wire, magnetic field inside a long current-carrying solenoid, and magnetic field inside & outside a toroid.',
        tamilDescription:
          'ஆம்பியர் சுற்று விதியின் கூற்று மற்றும் நிரூபணம், நீண்ட நேர்க்கம்பி, மின்னோட்டம் பாயும் நீண்ட வரிச்சுருள் (Solenoid) மற்றும் வட்ட வரிச்சுருள் (Toroid) ஆகியவற்றின் உட்புறக் காந்தப்புலம்.',
        subTopics: [
          '3.8.1 Ampere’s Circuital Law & Application to Long Straight Wire',
          '3.8.2 Magnetic Field Inside a Long Current-Carrying Solenoid',
          '3.8.3 Magnetic Field Due to a Current-Carrying Toroid'
        ],
        tamilSubTopics: [
          '3.8.1 ஆம்பியர் சுற்று விதி மற்றும் நீண்ட நேர்க்கம்பிக்குப் பயன்படுத்துதல்',
          '3.8.2 மின்னோட்டம் பாயும் நீண்ட வரிச்சுருளின் உள்ளே காந்தப்புலம்',
          '3.8.3 மின்னோட்டம் பாயும் வட்ட வரிச்சுருளால் (டோராய்டு) ஏற்படும் காந்தப்புலம்'
        ],
        keyFormulas: ['∮ B · dl = μ₀ I_enc', 'B_solenoid = μ₀ n I', 'B_toroid = μ₀ N I / (2πr)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 20
      },
      {
        id: 'tn12-p-u3-t4',
        code: '3.9',
        title: 'Lorentz Force, Motion in Magnetic Field & Cyclotron',
        tamilTitle: 'லாரன்ஸ் விசை, காந்தப்புலத்தில் துகளின் இயக்கம் மற்றும் சைக்ளோட்ரான்',
        description:
          'Lorentz force F = q(E + v × B), circular & helical trajectory of a charged particle in uniform magnetic field, cyclotron radius & frequency, and principle, construction, working & limitations of a Cyclotron.',
        tamilDescription:
          'லாரன்ஸ் விசை F = q(E + v × B), சீரான காந்தப்புலத்தில் மின்துகள்களின் வட்ட மற்றும் சுருள்வடிவப் பாதை, மற்றும் சைக்ளோட்ரானின் தத்துவம், அமைப்பு, செயல்படும் விதம் மற்றும் வரம்புகள்.',
        subTopics: [
          '3.9.1 Lorentz Force & Motion of Charged Particle in Uniform Magnetic Field',
          '3.9.2 Cyclotron Principle, Construction, Working & Limitations'
        ],
        tamilSubTopics: [
          '3.9.1 லாரன்ஸ் விசை மற்றும் சீரான காந்தப்புலத்தில் மின்துகளின் இயக்கம்',
          '3.9.2 சைக்ளோட்ரான் தத்துவம், அமைப்பு, செயல்படும் விதம் மற்றும் வரம்புகள்'
        ],
        keyFormulas: ['F = q(E + v × B)', 'r = mv / (qB)', 'f_c = qB / (2πm)', 'K_max = q²B²R² / (2m)'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 24
      },
      {
        id: 'tn12-p-u3-t5',
        code: '3.10–3.11',
        title: 'Force on Current-Carrying Conductor, Torque on Loop & Moving Coil Galvanometer',
        tamilTitle: 'மின்னோட்டம் பாயும் கடத்தி மீதான விசை, கால்வனோமீட்டர், அம்மீட்டர் மற்றும் வோல்ட்மீட்டர்',
        description:
          'Force on a current-carrying conductor in a magnetic field, force between two long parallel current-carrying conductors & definition of 1 Ampere, torque on a current loop, Moving Coil Galvanometer (MCG), figure of merit, and conversion of galvanometer into ammeter & voltmeter.',
        tamilDescription:
          'காந்தப்புலத்தில் மின்னோட்டம் பாயும் கடத்தி உணரும் விசை, இரு இணைக் கடத்திகளுக்கு இடையேயான விசை மற்றும் 1 ஆம்பியர் வரையறை, இயங்கு சுருள் கால்வனோமீட்டர் (MCG), மற்றும் கால்வனோமீட்டரை அம்மீட்டர் மற்றும் வோல்ட்மீட்டராக மாற்றுதல்.',
        subTopics: [
          '3.10.1 Force on Current-Carrying Conductor & Force Between Two Parallel Conductors',
          '3.11.1 Torque on a Current Loop & Moving Coil Galvanometer (MCG)',
          '3.11.2 Conversion of Galvanometer into Ammeter and Voltmeter'
        ],
        tamilSubTopics: [
          '3.10.1 மின்னோட்டம் பாயும் கடத்தி மீதான விசை மற்றும் இரு இணைக் கடத்திகளுக்கு இடையேயான விசை',
          '3.11.1 மின்னோட்டச் சுற்றின் மீதான திருப்புவிசை மற்றும் இயங்கு சுருள் கால்வனோமீட்டர்',
          '3.11.2 கால்வனோமீட்டரை அம்மீட்டர் மற்றும் வோல்ட்மீட்டராக மாற்றுதல்'
        ],
        keyFormulas: ['F = I (l × B)', 'F/L = (μ₀ I₁ I₂) / (2πd)', 'S = (I_g / (I - I_g)) R_g', 'R_h = (V / I_g) - R_g'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      }
    ]
  },

  // ==================== VOLUME 1: UNIT 4 ====================
  {
    id: 'tn12-phys-u4',
    grade: '12',
    volume: 'Volume 1',
    tamilVolume: 'தொகுதி 1',
    number: 4,
    title: 'Electromagnetic Induction and Alternating Current',
    tamilTitle: 'மின்காந்தத் தூண்டல் மற்றும் மாறுதிசை மின்னோட்டம்',
    topics: [
      {
        id: 'tn12-p-u4-t1',
        code: '4.1–4.2',
        title: 'Faraday’s Laws, Lenz’s Law, Motional EMF & Eddy Currents',
        tamilTitle: 'ஃபாரடே விதிகள், லென்ஸ் விதி, இயக்க மின்னியக்கு விசை மற்றும் சுழல் மின்னோட்டங்கள்',
        description:
          'Magnetic flux, Faraday’s first & second laws of electromagnetic induction, Lenz’s law & conservation of energy, Fleming’s right-hand rule, motional EMF from Lorentz force & Faraday’s law, and eddy currents (induction stove, eddy current brake, damping).',
        tamilDescription:
          'காந்தப்பாயம், ஃபாரடே மின்காந்தத் தூண்டல் விதிகள், லென்ஸ் விதி மற்றும் ஆற்றல் அழிவின்மை, ஃப்ளெமிங் வலது கை விதி, இயக்க மின்னியக்கு விசை மற்றும் சுழல் மின்னோட்டங்களின் பயன்பாடுகள்.',
        subTopics: [
          '4.1.1 Magnetic Flux, Faraday’s Laws & Lenz’s Law (Conservation of Energy)',
          '4.1.2 Motional EMF in a Moving Conductor Rod',
          '4.2.1 Eddy Currents & Their Applications (Induction Stove, Brakes, Damping)'
        ],
        tamilSubTopics: [
          '4.1.1 காந்தப்பாயம், ஃபாரடே விதிகள் மற்றும் லென்ஸ் விதி',
          '4.1.2 இயங்கும் கடத்தித் தண்டில் தூண்டப்படும் இயக்க மின்னியக்கு விசை',
          '4.2.1 சுழல் மின்னோட்டங்கள் மற்றும் அவற்றின் பயன்பாடுகள்'
        ],
        keyFormulas: ['Φ_B = B · A = BA cosθ', 'e = -N (dΦ_B / dt)', 'e_motional = B l v'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      },
      {
        id: 'tn12-p-u4-t2',
        code: '4.3',
        title: 'Self-Induction, Mutual Induction & Energy Stored in Inductor',
        tamilTitle: 'தன்மின்தூண்டல், பரிமாற்று மின்தூண்டல் மற்றும் மின்தூண்டியில் சேமிக்கப்படும் ஆற்றல்',
        description:
          'Coefficient of self-induction L, self-inductance of a long solenoid, energy stored in an inductor U_B = ½LI², mutual inductance M between two long coaxial solenoids, and methods of producing induced EMF.',
        tamilDescription:
          'தன்மின்தூண்டல் எண் L, நீண்ட வரிச்சுருளின் தன்மின்தூண்டல் எண், மின்தூண்டியில் சேமிக்கப்படும் ஆற்றல் U_B = ½LI², இரு பொது அச்சு வரிச்சுருள்களுக்கு இடையேயான பரிமாற்று மின்தூண்டல் எண் M.',
        subTopics: [
          '4.3.1 Self-Inductance of a Long Solenoid & Energy Stored in Inductor',
          '4.3.2 Mutual Inductance Between Two Long Coaxial Solenoids'
        ],
        tamilSubTopics: [
          '4.3.1 நீண்ட வரிச்சுருளின் தன்மின்தூண்டல் எண் மற்றும் மின்தூண்டியில் சேமிக்கப்படும் ஆற்றல்',
          '4.3.2 இரு பொது அச்சு வரிச்சுருள்களுக்கு இடையேயான பரிமாற்று மின்தூண்டல் எண்'
        ],
        keyFormulas: ['L = μ₀ n² A l', 'U_B = ½ L I²', 'M = μ₀ n₁ n₂ A l'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      },
      {
        id: 'tn12-p-u4-t3',
        code: '4.4–4.5',
        title: 'AC Generator (Single-Phase & Three-Phase) and Transformer',
        tamilTitle: 'மாறுதிசை மின்னியற்றி (ஒரு கட்டம் & மூன்று கட்டம்) மற்றும் மின்மாற்றி',
        description:
          'Principle, construction & working of single-phase and three-phase AC generators, transformer construction, step-up & step-down turns ratio, efficiency, energy losses in transformers, and long-distance AC power transmission.',
        tamilDescription:
          'ஒரு கட்ட மற்றும் மூன்று கட்ட மாறுதிசை மின்னியற்றிகளின் தத்துவம் மற்றும் செயல்பாடு, ஏற்று மற்றும் இறக்கு மின்மாற்றிகள், மின்மாற்றியின் பயனுறுதிறன், ஆற்றல் இழப்புகள் மற்றும் நீண்ட தொலைவு மின்திறன் அனுப்புகை.',
        subTopics: [
          '4.4.1 Single-Phase & Three-Phase AC Generator Principle and Working',
          '4.5.1 Transformer Principle, Turns Ratio, Efficiency & Energy Losses'
        ],
        tamilSubTopics: [
          '4.4.1 ஒரு கட்ட மற்றும் மூன்று கட்ட மாறுதிசை மின்னியற்றியின் தத்துவம் மற்றும் செயல்பாடு',
          '4.5.1 மின்மாற்றியின் தத்துவம், சுற்று விகிதம், பயனுறுதிறன் மற்றும் ஆற்றல் இழப்புகள்'
        ],
        keyFormulas: ['e = E_m sin(ωt), E_m = N B A ω', 'V_s / V_p = N_s / N_p = I_p / I_s', 'η = (P_out / P_in) × 100%'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 24
      },
      {
        id: 'tn12-p-u4-t4',
        code: '4.6–4.7',
        title: 'Alternating Current, RMS Value, Pure R/L/C & Series RLC Resonance',
        tamilTitle: 'மாறுதிசை மின்னோட்டம், RMS மதிப்பு, R/L/C சுற்றுகள் மற்றும் RLC ஒத்ததிர்வு',
        description:
          'Mean & RMS values of AC (I_rms = I_m / √2), phasor diagrams for pure resistive, inductive (X_L = ωL), and capacitive (X_C = 1/ωC) circuits, series RLC circuit impedance, resonant frequency ω_r, Q-factor, power in AC circuits, power factor cosφ, wattless current, and LC oscillations.',
        tamilDescription:
          'மாறுதிசை மின்னோட்டத்தின் சராசரி மற்றும் RMS மதிப்புகள், மின்தடை (R), மின்தூண்டி (L), மின்தேக்கி (C) சுற்றுகளின் கட்ட வரைபடங்கள், தொடர் RLC ஒத்ததிர்வு அதிர்வெண் ω_r, Q-காரணி, திறன் காரணி cosφ மற்றும் LC அலைவுகள்.',
        subTopics: [
          '4.6.1 Mean & RMS Values of AC and Phasor Diagrams for Pure R, L & C Circuits',
          '4.7.1 Series RLC Circuit, Impedance & Electrical Resonance (Q-Factor)',
          '4.7.2 Power in AC Circuits, Power Factor (cosφ) & LC Oscillations'
        ],
        tamilSubTopics: [
          '4.6.1 AC சராசரி மற்றும் RMS மதிப்புகள் மற்றும் R, L, C சுற்றுகளின் கட்ட வரைபடங்கள்',
          '4.7.1 தொடர் RLC சுற்று, மின்மறுப்பு மற்றும் மின் ஒத்ததிர்வு (Q-காரணி)',
          '4.7.2 AC சுற்றுகளில் திறன், திறன் காரணி (cosφ) மற்றும் LC அலைவுகள்'
        ],
        keyFormulas: ['I_rms = I_m / √2', 'Z = √[R² + (X_L - X_C)²]', 'ω_r = 1 / √(LC)', 'P_avg = V_rms I_rms cosφ'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 28
      }
    ]
  },

  // ==================== VOLUME 1: UNIT 5 ====================
  {
    id: 'tn12-phys-u5',
    grade: '12',
    volume: 'Volume 1',
    tamilVolume: 'தொகுதி 1',
    number: 5,
    title: 'Electromagnetic Waves',
    tamilTitle: 'மின்காந்த அலைகள்',
    topics: [
      {
        id: 'tn12-p-u5-t1',
        code: '5.1',
        title: 'Displacement Current and Maxwell’s Equations',
        tamilTitle: 'இடப்பெயர்ச்சி மின்னோட்டம் மற்றும் மாக்ஸ்வெல் சமன்பாடுகள்',
        description:
          'Inconsistency in Ampere’s circuital law during charging of a capacitor, Maxwell’s displacement current I_d = ε₀ (dΦ_E / dt), Ampere–Maxwell law, and Maxwell’s four fundamental equations in integral form.',
        tamilDescription:
          'மின்தேக்கி மின்னேற்றம் அடையும்போது ஆம்பியர் சுற்று விதியில் ஏற்படும் முரண்பாடு, மாக்ஸ்வெல்லின் இடப்பெயர்ச்சி மின்னோட்டம் I_d = ε₀ (dΦ_E / dt), ஆம்பியர்–மாக்ஸ்வெல் விதி மற்றும் மாக்ஸ்வெல்லின் நான்கு அடிப்படைச் சமன்பாடுகள்.',
        subTopics: [
          '5.1.1 Displacement Current & Generalized Ampere–Maxwell Law',
          '5.1.2 Maxwell’s Four Equations in Integral Form'
        ],
        tamilSubTopics: [
          '5.1.1 இடப்பெயர்ச்சி மின்னோட்டம் மற்றும் ஆம்பியர்–மாக்ஸ்வெல் விதி',
          '5.1.2 தொகையீட்டு வடிவில் மாக்ஸ்வெல்லின் நான்கு சமன்பாடுகள்'
        ],
        keyFormulas: ['I_d = ε₀ (dΦ_E / dt)', '∮ B · dl = μ₀ (I_c + ε₀ dΦ_E/dt)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 18
      },
      {
        id: 'tn12-p-u5-t2',
        code: '5.2–5.3',
        title: 'Production, Properties, Spectrum & Types of Spectra',
        tamilTitle: 'மின்காந்த அலைகளின் பண்புகள், மின்காந்த நிறமாலை மற்றும் நிறமாலை வகைகள்',
        description:
          'Hertz’s experiment, transverse nature & properties of EM waves, speed c = 1/√(μ₀ε₀), Poynting vector, radiation pressure, full EM spectrum (radio, micro, IR, visible, UV, X-rays, gamma rays), and emission & absorption spectra (continuous, line, band) & Fraunhofer lines.',
        tamilDescription:
          'ஹெர்ட்ஸ் சோதனை, மின்காந்த அலைகளின் குறுக்கலைப் பண்புகள், திசைவேகம் c = 1/√(μ₀ε₀), பாயின்டிங் வெக்டர், முழு மின்காந்த நிறமாலை (ரேடியோ முதல் காமா கதிர்கள் வரை), வெளியீடு மற்றும் உட்கவர் நிறமாலைகள் மற்றும் ஃபிரான்ஹோபர் வரிகள்.',
        subTopics: [
          '5.2.1 Production, Transverse Properties, Speed & Poynting Vector of EM Waves',
          '5.2.2 Electromagnetic Spectrum (Radio Waves to Gamma Rays) & Uses',
          '5.3.1 Emission and Absorption Spectra & Fraunhofer Lines'
        ],
        tamilSubTopics: [
          '5.2.1 மின்காந்த அலைகளின் பண்புகள், திசைவேகம் மற்றும் பாயின்டிங் வெக்டர்',
          '5.2.2 மின்காந்த நிறமாலை (ரேடியோ அலைகள் முதல் காமா கதிர்கள் வரை) மற்றும் பயன்கள்',
          '5.3.1 வெளியீடு மற்றும் உட்கவர் நிறமாலைகள் மற்றும் ஃபிரான்ஹோபர் வரிகள்'
        ],
        keyFormulas: ['c = 1 / √(μ₀ ε₀) ≈ 3 × 10⁸ m/s', 'c = E₀ / B₀', 'S = (1 / μ₀) (E × B)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      }
    ]
  },

  // ==================== VOLUME 2: UNIT 6 ====================
  {
    id: 'tn12-phys-u6',
    grade: '12',
    volume: 'Volume 2',
    tamilVolume: 'தொகுதி 2',
    number: 6,
    title: 'Ray Optics',
    tamilTitle: 'கதிர் ஒளியியல்',
    topics: [
      {
        id: 'tn12-p-u6-t1',
        code: '6.1–6.2',
        title: 'Reflection at Spherical Mirrors & Speed of Light (Fizeau’s Method)',
        tamilTitle: 'கோளக ஆடிகளில் எதிரொளிப்பு மற்றும் ஒளியின் திசைவேகம்',
        description:
          'Cartesian sign convention, relation R = 2f, mirror equation 1/f = 1/v + 1/u, lateral magnification m, and Fizeau’s toothed-wheel method to determine speed of light.',
        tamilDescription:
          'கார்டீசியன் குறியீட்டு மரபு, R = 2f தொடர்பு, ஆடிச் சமன்பாடு 1/f = 1/v + 1/u, பக்கவாட்டு உருப்பெருக்கம் m மற்றும் ஒளியின் திசைவேகத்தைக் காணும் ஃபிஸியு பற்சக்கர முறை.',
        subTopics: [
          '6.1.1 Cartesian Sign Convention, R = 2f & Mirror Equation',
          '6.2.1 Fizeau’s Method for Speed of Light & Optical Path'
        ],
        tamilSubTopics: [
          '6.1.1 கார்டீசியன் குறியீட்டு மரபு, R = 2f மற்றும் ஆடிச் சமன்பாடு',
          '6.2.1 ஒளியின் திசைவேகத்தைக் காணும் ஃபிஸியு முறை மற்றும் ஒளியியல் பாதை'
        ],
        keyFormulas: ['1/f = 1/v + 1/u', 'm = h\'/h = -v/u = f / (f - u)', 'd = n · d₀'],
        difficulty: 'Foundation',
        tamilDifficulty: 'அடிப்படை',
        estimatedMinutes: 18
      },
      {
        id: 'tn12-p-u6-t2',
        code: '6.3–6.4',
        title: 'Refraction, Total Internal Reflection (TIR) & Optical Fibers',
        tamilTitle: 'ஒளிவிலகல், முழு அக எதிரொளிப்பு மற்றும் ஒளியிழைகள்',
        description:
          'Snell’s law of refraction, apparent depth, critical angle i_c, total internal reflection (TIR), glittering of diamond, mirage & looming, optical fibers & acceptance angle, and Snell’s window.',
        tamilDescription:
          'ஸ்நெல் ஒளிவிலகல் விதி, தோற்ற ஆழம், மாறுநிலைக் கோணம் i_c, முழு அக எதிரொளிப்பு, வைரம் ஜொலித்தல், கானல்நீர், ஒளியிழைகள் மற்றும் ஏற்புக் கோணம் மற்றும் ஸ்நெல் சாளரம்.',
        subTopics: [
          '6.3.1 Snell’s Law, Apparent Depth & Critical Angle',
          '6.4.1 Total Internal Reflection, Optical Fibers & Acceptance Angle'
        ],
        tamilSubTopics: [
          '6.3.1 ஸ்நெல் விதி, தோற்ற ஆழம் மற்றும் மாறுநிலைக் கோணம்',
          '6.4.1 முழு அக எதிரொளிப்பு, ஒளியிழைகள் மற்றும் ஏற்புக் கோணம்'
        ],
        keyFormulas: ['n₁ sin i = n₂ sin r', 'sin i_c = 1 / n', 'd_apparent = d_real / n', 'sin i_a = √(n₁² - n₂²)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      },
      {
        id: 'tn12-p-u6-t3',
        code: '6.5–6.6',
        title: 'Refraction at Spherical Surface, Lens Maker’s Formula & Thin Lenses',
        tamilTitle: 'கோளகப் பரப்பில் ஒளிவிலகல், லென்ஸ் உருவாக்குபவர் சமன்பாடு மற்றும் லென்ஸ் இணைப்பு',
        description:
          'Equation for refraction at a single spherical surface, derivation of Lens Maker’s formula, thin lens equation, lateral magnification, power of a lens (dioptre), lenses in contact, and silvered lenses.',
        tamilDescription:
          'ஒற்றைக் கோளகப் பரப்பில் ஒளிவிலகல் சமன்பாடு, லென்ஸ் உருவாக்குபவர் சமன்பாடு வருவித்தல், மெல்லிய லென்ஸ் சமன்பாடு, லென்சின் திறன் (டையாப்டர்) மற்றும் தொடுதலில் உள்ள லென்சுகளின் இணைப்பு.',
        subTopics: [
          '6.5.1 Refraction at Single Spherical Surface & Lens Maker’s Formula Derivation',
          '6.6.1 Thin Lens Formula, Power of a Lens & Combination of Lenses in Contact'
        ],
        tamilSubTopics: [
          '6.5.1 கோளகப் பரப்பில் ஒளிவிலகல் மற்றும் லென்ஸ் உருவாக்குபவர் சமன்பாடு வருவித்தல்',
          '6.6.1 மெல்லிய லென்ஸ் சமன்பாடு, லென்சின் திறன் மற்றும் லென்சுகளின் இணைப்பு'
        ],
        keyFormulas: ['(n₂/v) - (n₁/u) = (n₂ - n₁)/R', '1/f = (n - 1)(1/R₁ - 1/R₂)', 'P = 1/f = P₁ + P₂'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      },
      {
        id: 'tn12-p-u6-t4',
        code: '6.7–6.8',
        title: 'Refraction Through a Prism, Dispersion, Rainbow & Rayleigh Scattering',
        tamilTitle: 'முப்பட்டகம் வழியே ஒளிவிலகல், நிறப்பிரிகை, வானவில் மற்றும் ராலே சிதறல்',
        description:
          'Angle of deviation d = i₁ + i₂ - A, angle of minimum deviation δ_m, refractive index of prism material, dispersion of white light, dispersive power ω, primary & secondary rainbows, and Rayleigh scattering (blue sky & red sunset).',
        tamilDescription:
          'திசைமாற்றக் கோணம் d = i₁ + i₂ - A, சிறும திசைமாற்றக் கோணம் δ_m, முப்பட்டகப் பொருளின் ஒளிவிலகல் எண், நிறப்பிரிகை திறன் ω, முதன்மை மற்றும் துணை வானவில், மற்றும் ராலே ஒளிச்சிதறல்.',
        subTopics: [
          '6.7.1 Refraction Through a Prism & Refractive Index Formula at Minimum Deviation',
          '6.7.2 Dispersion, Dispersive Power & Rainbow Formation',
          '6.8.1 Rayleigh Scattering Law & Atmospheric Phenomena'
        ],
        tamilSubTopics: [
          '6.7.1 முப்பட்டகம் வழியே ஒளிவிலகல் மற்றும் சிறும திசைமாற்ற நிலையில் ஒளிவிலகல் எண்',
          '6.7.2 நிறப்பிரிகை, நிறப்பிரிகை திறன் மற்றும் வானவில் தோன்றுதல்',
          '6.8.1 ராலே ஒளிச்சிதறல் விதி மற்றும் வளிமண்டல நிகழ்வுகள்'
        ],
        keyFormulas: ['n = sin[(A + δ_m)/2] / sin(A/2)', 'ω = (n_V - n_R) / (n_Y - 1)', 'I ∝ 1 / λ⁴'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      }
    ]
  },

  // ==================== VOLUME 2: UNIT 7 ====================
  {
    id: 'tn12-phys-u7',
    grade: '12',
    volume: 'Volume 2',
    tamilVolume: 'தொகுதி 2',
    number: 7,
    title: 'Wave Optics',
    tamilTitle: 'அலை ஒளியியல்',
    topics: [
      {
        id: 'tn12-p-u7-t1',
        code: '7.1–7.2',
        title: 'Wavefronts, Huygens’ Principle & Proof of Reflection and Refraction',
        tamilTitle: 'அலைமுகப்புகள், ஹைஜென்ஸ் தத்துவம் மற்றும் எதிரொளிப்பு, ஒளிவிலகல் விதிகளின் நிரூபணம்',
        description:
          'Corpuscular, wave, electromagnetic & quantum theories of light, spherical, cylindrical & plane wavefronts, Huygens’ principle, and geometric proof of laws of reflection and Snell’s law of refraction.',
        tamilDescription:
          'ஒளியின் நுண்துகள், அலை, மின்காந்த மற்றும் குவாண்டம் கொள்கைகள், கோளக, உருளை மற்றும் சமதள அலைமுகப்புகள், ஹைஜென்ஸ் தத்துவம் மற்றும் எதிரொளிப்பு, ஒளிவிலகல் விதிகளின் நிரூபணம்.',
        subTopics: [
          '7.1.1 Wavefronts & Huygens’ Principle',
          '7.2.1 Proof of Laws of Reflection & Refraction Using Huygens’ Principle'
        ],
        tamilSubTopics: [
          '7.1.1 அலைமுகப்புகள் மற்றும் ஹைஜென்ஸ் தத்துவம்',
          '7.2.1 ஹைஜென்ஸ் தத்துவத்தைப் பயன்படுத்தி எதிரொளிப்பு மற்றும் ஒளிவிலகல் விதிகளின் நிரூபணம்'
        ],
        keyFormulas: ['sin i / sin r = v₁ / v₂ = n₂ / n₁'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 20
      },
      {
        id: 'tn12-p-u7-t2',
        code: '7.3',
        title: 'Interference of Light & Young’s Double Slit Experiment (YDSE)',
        tamilTitle: 'ஒளியின் குறுக்கீட்டு விளைவு மற்றும் யங் இரட்டைப் பிளவு ஆய்வு',
        description:
          'Superposition of waves, constructive & destructive interference conditions, coherent & incoherent sources, Young’s double slit experiment (YDSE) derivation of path difference, bright/dark fringe positions, fringe width β, and interference in thin films.',
        tamilDescription:
          'அலைகளின் மேற்பொருந்துதல், ஆக்க மற்றும் அழிவுக் குறுக்கீட்டு நிபந்தனைகள், ஓரியல் மூலங்கள், யங் இரட்டைப் பிளவு ஆய்வில் பட்டை அகலம் β வருவித்தல் மற்றும் மெல்லிய படலங்களில் குறுக்கீட்டு விளைவு.',
        subTopics: [
          '7.3.1 Coherent Sources & Conditions for Constructive and Destructive Interference',
          '7.3.2 Young’s Double Slit Experiment (YDSE) & Fringe Width (β) Derivation',
          '7.3.3 Interference in Thin Films & White Light Fringes'
        ],
        tamilSubTopics: [
          '7.3.1 ஓரியல் மூலங்கள் மற்றும் ஆக்க, அழிவுக் குறுக்கீட்டு விளைவு நிபந்தனைகள்',
          '7.3.2 யங் இரட்டைப் பிளவு ஆய்வு (YDSE) மற்றும் பட்டை அகலம் (β) வருவித்தல்',
          '7.3.3 மெல்லிய படலங்களில் குறுக்கீட்டு விளைவு'
        ],
        keyFormulas: ['I_max = (a₁ + a₂)², I_min = (a₁ - a₂)²', 'β = (λ D) / d', '2μd cos r = nλ'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      },
      {
        id: 'tn12-p-u7-t3',
        code: '7.4',
        title: 'Diffraction at Single Slit, Diffraction Grating & Resolving Power',
        tamilTitle: 'ஒற்றைப் பிளவு விளிம்பு விளைவு, விளிம்பு விளைவு கீற்றணி மற்றும் பிரிதிறன்',
        description:
          'Fresnel vs Fraunhofer diffraction, diffraction at a single slit (central maximum & secondary minima), Fresnel’s distance, plane transmission diffraction grating (N lines/m), and Rayleigh’s criterion & resolving power of microscope and telescope.',
        tamilDescription:
          'ஃபிரெனெல் மற்றும் ஃபிரான்ஹோபர் விளிம்பு விளைவுகள், ஒற்றைப் பிளவில் விளிம்பு விளைவு, ஃபிரெனெல் தொலைவு, சமதள விளிம்பு விளைவு கீற்றணி மற்றும் நுண்ணோக்கி, தொலைநோக்கியின் பிரிதிறன்.',
        subTopics: [
          '7.4.1 Single-Slit Diffraction & Fresnel’s Distance',
          '7.4.2 Plane Transmission Diffraction Grating & Wavelength Determination',
          '7.4.3 Rayleigh’s Criterion & Resolving Power of Optical Instruments'
        ],
        tamilSubTopics: [
          '7.4.1 ஒற்றைப் பிளவு விளிம்பு விளைவு மற்றும் ஃபிரெனெல் தொலைவு',
          '7.4.2 சமதள விளிம்பு விளைவு கீற்றணி மற்றும் அலைநீளம் காணல்',
          '7.4.3 ராலே நிபந்தனை மற்றும் ஒளியியல் கருவிகளின் பிரிதிறன்'
        ],
        keyFormulas: ['a sinθ = nλ (minima)', 'sinθ = N m λ (grating)', 'RP_telescope = a / (1.22λ)'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 25
      },
      {
        id: 'tn12-p-u7-t4',
        code: '7.5–7.6',
        title: 'Polarization, Malus’s Law, Brewster’s Law, Optical Instruments & Eye Defects',
        tamilTitle: 'தளவிளைவு, மாலஸ் விதி, புரூஸ்டர் விதி மற்றும் ஒளியியல் கருவிகள்',
        description:
          'Plane-polarized light, Malus’s law, Brewster’s law & pile of plates, Nicol prism & double refraction, simple microscope, compound microscope, astronomical telescope, and myopia, hypermetropia & astigmatism.',
        tamilDescription:
          'தளவிளைவுற்ற ஒளி, மாலஸ் விதி, புரூஸ்டர் விதி, நிக்கல் பட்டகம், எளிய நுண்ணோக்கி, கூட்டு நுண்ணோக்கி, வானியல் தொலைநோக்கி மற்றும் கிட்டப்பார்வை, தூரப்பார்வை குறைபாடுகள்.',
        subTopics: [
          '7.5.1 Polarization, Malus’s Law, Brewster’s Law & Nicol Prism',
          '7.6.1 Simple Microscope, Compound Microscope & Astronomical Telescope',
          '7.6.2 Defects of Vision: Myopia, Hypermetropia, Presbyopia & Astigmatism'
        ],
        tamilSubTopics: [
          '7.5.1 தளவிளைவு, மாலஸ் விதி, புரூஸ்டர் விதி மற்றும் நிக்கல் பட்டகம்',
          '7.6.1 எளிய நுண்ணோக்கி, கூட்டு நுண்ணோக்கி மற்றும் வானியல் தொலைநோக்கி',
          '7.6.2 பார்வைக் குறைபாடுகள்: கிட்டப்பார்வை, தூரப்பார்வை மற்றும் உருளையாடிப் பார்வை'
        ],
        keyFormulas: ['I = I₀ cos²θ', 'tan i_p = n', 'm_compound = (L / f_o)(1 + D / f_e)', 'm_telescope = f_o / f_e'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 26
      }
    ]
  },

  // ==================== VOLUME 2: UNIT 8 ====================
  {
    id: 'tn12-phys-u8',
    grade: '12',
    volume: 'Volume 2',
    tamilVolume: 'தொகுதி 2',
    number: 8,
    title: 'Dual Nature of Radiation and Matter',
    tamilTitle: 'கதிர்வீச்சு மற்றும் பொருளின் இரட்டைப் பண்பு',
    topics: [
      {
        id: 'tn12-p-u8-t1',
        code: '8.1–8.2',
        title: 'Electron Emission, Photoelectric Effect & Einstein’s Photoelectric Equation',
        tamilTitle: 'எலக்ட்ரான் உமிழ்வு, ஒளிமின் விளைவு மற்றும் ஐன்ஸ்டீனின் ஒளிமின் சமன்பாடு',
        description:
          'Work function φ₀, thermionic, field, photoelectric & secondary emission, Hertz, Hallwachs & Lenard observations, effect of intensity, potential & frequency on photoelectric current, stopping potential V₀, threshold frequency ν₀, Einstein’s photoelectric equation, quantum nature of photons, and photocells.',
        tamilDescription:
          'வெளியேற்று ஆற்றல் φ₀, எலக்ட்ரான் உமிழ்வு வகைகள், ஒளிமின் விளைவு சோதனை விதிகள், நிறுத்து மின்னழுத்தம் V₀, பயன்தொடக்க அதிர்வெண் ν₀, ஐன்ஸ்டீனின் ஒளிமின் சமன்பாடு, ஃபோட்டானின் பண்புகள் மற்றும் ஒளிமின்கலன்கள்.',
        subTopics: [
          '8.1.1 Types of Electron Emission & Photoelectric Effect Experimental Laws',
          '8.2.1 Einstein’s Photoelectric Equation, Photon Properties & Photocells'
        ],
        tamilSubTopics: [
          '8.1.1 எலக்ட்ரான் உமிழ்வு வகைகள் மற்றும் ஒளிமின் விளைவு விதிகள்',
          '8.2.1 ஐன்ஸ்டீனின் ஒளிமின் சமன்பாடு, ஃபோட்டான் பண்புகள் மற்றும் ஒளிமின்கலன்கள்'
        ],
        keyFormulas: ['hν = φ₀ + K_max = hν₀ + eV₀', 'E_photon = hν = hc / λ', 'p_photon = h / λ'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 24
      },
      {
        id: 'tn12-p-u8-t2',
        code: '8.3–8.5',
        title: 'Matter Waves, de Broglie Wavelength, Davisson–Germer & X-Ray Spectra',
        tamilTitle: 'பருப்பொருள் அலைகள், டி பிராக்லி அலைநீளம், டேவிசன்–ஜெர்மர் சோதனை மற்றும் X-கதிர்கள்',
        description:
          'de Broglie hypothesis, de Broglie wavelength of electrons (λ ≈ 12.27 / √V Å), Davisson–Germer electron diffraction experiment, electron microscope, and production & continuous/characteristic X-ray spectra (Moseley’s law).',
        tamilDescription:
          'டி பிராக்லி கருதுகோள், எலக்ட்ரானின் டி பிராக்லி அலைநீளம் (λ ≈ 12.27 / √V Å), டேவிசன்–ஜெர்மர் எலக்ட்ரான் விளிம்பு விளைவு சோதனை, எலக்ட்ரான் நுண்ணோக்கி மற்றும் X-கதிர் நிறமாலைகள்.',
        subTopics: [
          '8.3.1 de Broglie Hypothesis & Electron Wavelength Formula',
          '8.4.1 Davisson–Germer Experiment & Electron Microscope',
          '8.5.1 X-Ray Production, Continuous & Characteristic Spectra and Duane–Hunt Formula'
        ],
        tamilSubTopics: [
          '8.3.1 டி பிராக்லி கருதுகோள் மற்றும் எலக்ட்ரான் அலைநீளச் சமன்பாடு',
          '8.4.1 டேவிசன்–ஜெர்மர் சோதனை மற்றும் எலக்ட்ரான் நுண்ணோக்கி',
          '8.5.1 X-கதிர் உற்பத்தி, தொடர் மற்றும் சிறப்பு X-கதிர் நிறமாலைகள்'
        ],
        keyFormulas: ['λ = h / (mv) = h / √(2mK)', 'λ_electron ≈ 12.27 / √V Å', 'λ_min = hc / (eV)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 24
      }
    ]
  },

  // ==================== VOLUME 2: UNIT 9 ====================
  {
    id: 'tn12-phys-u9',
    grade: '12',
    volume: 'Volume 2',
    tamilVolume: 'தொகுதி 2',
    number: 9,
    title: 'Atomic and Nuclear Physics',
    tamilTitle: 'அணு மற்றும் அணுக்கரு இயற்பியல்',
    topics: [
      {
        id: 'tn12-p-u9-t1',
        code: '9.1–9.3',
        title: 'Cathode Rays, J.J. Thomson, Millikan Oil Drop, Rutherford & Bohr Atom Model',
        tamilTitle: 'கேத்தோடு கதிர்கள், ரூதர்ஃபோர்டு மற்றும் போரின் அணு மாதிரி',
        description:
          'Specific charge (e/m) by J.J. Thomson, Millikan’s oil drop charge quantization, Rutherford alpha-scattering experiment & distance of closest approach, Bohr’s postulates, derivation of radius r_n, velocity v_n & energy E_n of nth orbit, and hydrogen spectral series (Lyman, Balmer, Paschen, Brackett, Pfund).',
        tamilDescription:
          'ஜே.ஜே. தாம்சன் மின்னூட்ட எண் (e/m), மில்லிகன் எண்ணெய்த் துளி ஆய்வு, ரூதர்ஃபோர்டு ஆல்பா சிதறல் ஆய்வு, போர் அணு மாதிரி எடுகோள்கள், n-ஆவது சுற்றுப்பாதையின் ஆரம் r_n மற்றும் ஆற்றல் E_n வருவித்தல் மற்றும் ஹைட்ரஜன் நிறமாலை வரிசைகள்.',
        subTopics: [
          '9.1–9.2 J.J. Thomson (e/m), Millikan Oil Drop & Rutherford Alpha Scattering',
          '9.3.1 Bohr Atom Model: Derivation of Orbit Radius (r_n), Velocity & Energy (E_n)',
          '9.3.2 Spectral Series of Hydrogen Atom (Lyman, Balmer, Paschen, Brackett, Pfund)'
        ],
        tamilSubTopics: [
          '9.1–9.2 ஜே.ஜே. தாம்சன் (e/m), மில்லிகன் ஆய்வு மற்றும் ரூதர்ஃபோர்டு ஆல்பா சிதறல்',
          '9.3.1 போர் அணு மாதிரி: சுற்றுப்பாதை ஆரம் (r_n) மற்றும் ஆற்றல் (E_n) வருவித்தல்',
          '9.3.2 ஹைட்ரஜன் அணுவின் நிறமாலை வரிசைகள் (லைமன், பால்மர், பாஷன், பிராக்கெட், ஃபண்ட்)'
        ],
        keyFormulas: ['r_n = 0.529 (n² / Z) Å', 'E_n = -13.6 (Z² / n²) eV', '1/λ = R (1/n₁² - 1/n₂²)'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      },
      {
        id: 'tn12-p-u9-t2',
        code: '9.4–9.5',
        title: 'Nuclear Structure, Mass Defect, Binding Energy & Nuclear Force',
        tamilTitle: 'அணுக்கரு அமைப்பு, நிறை குறைபாடு, பிணைப்பு ஆற்றல் மற்றும் அணுக்கரு விசை',
        description:
          'Isotopes, isobars, isotones, nuclear radius R = R₀A^(1/3), constant nuclear density, atomic mass unit (1 u = 931.5 MeV), mass defect Δm, binding energy per nucleon curve, and properties of strong nuclear force.',
        tamilDescription:
          'ஐசோடோப்புகள், ஐசோபார்கள், ஐசோடோன்கள், அணுக்கரு ஆரம் R = R₀A^(1/3), மாறாத அணுக்கரு அடர்த்தி, நிறை குறைபாடு Δm, ஒரு நியூக்ளியானுக்கான பிணைப்பு ஆற்றல் வரைபடம் மற்றும் அணுக்கரு விசையின் பண்புகள்.',
        subTopics: [
          '9.4.1 Nuclear Size, Nuclear Density & Classification of Nuclei',
          '9.5.1 Mass Defect, Binding Energy Curve & Properties of Nuclear Force'
        ],
        tamilSubTopics: [
          '9.4.1 அணுக்கரு அளவு, அடர்த்தி மற்றும் அணுக்கருக்களின் வகைப்பாடு',
          '9.5.1 நிறை குறைபாடு, பிணைப்பு ஆற்றல் வரைபடம் மற்றும் அணுக்கரு விசையின் பண்புகள்'
        ],
        keyFormulas: ['R = R₀ A^(1/3) (R₀ = 1.2 fm)', 'Δm = [Z m_p + (A - Z) m_n] - M', 'BE = Δm × 931.5 MeV'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 20
      },
      {
        id: 'tn12-p-u9-t3',
        code: '9.6–9.8',
        title: 'Radioactivity (Alpha, Beta, Gamma), Half-Life, Carbon Dating, Fission & Fusion',
        tamilTitle: 'கதிரியக்கம், அரை ஆயுட்காலம், அணுக்கரு பிளவு மற்றும் அணுக்கரு இணைவு',
        description:
          'Alpha, beta (β⁻, β⁺) & gamma decay, neutrino hypothesis, law of radioactive decay N = N₀e^(-λt), half-life T₁/₂, mean life τ, activity (Becquerel & Curie), carbon-14 dating, nuclear fission, chain reaction & nuclear reactor, and nuclear fusion & proton–proton cycle in stars.',
        tamilDescription:
          'ஆல்பா, பீட்டா மற்றும் காமா சிதைவுகள், நியூட்ரினோ கருதுகோள், கதிரியக்கச் சிதைவு விதி N = N₀e^(-λt), அரை ஆயுட்காலம் T₁/₂, சராசரி ஆயுட்காலம் τ, கார்பன்-14 வயது கணிப்பு, அணுக்கரு பிளவு, அணுக்கரு உலை மற்றும் அணுக்கரு இணைவு.',
        subTopics: [
          '9.6.1 Alpha, Beta & Gamma Decay and Law of Radioactive Decay',
          '9.6.2 Half-Life (T₁/₂), Mean Life (τ), Activity & Carbon Dating',
          '9.7–9.8 Nuclear Fission, Nuclear Reactor, Nuclear Fusion & Stellar Energy'
        ],
        tamilSubTopics: [
          '9.6.1 ஆல்பா, பீட்டா, காமா சிதைவுகள் மற்றும் கதிரியக்கச் சிதைவு விதி',
          '9.6.2 அரை ஆயுட்காலம் (T₁/₂), சராசரி ஆயுட்காலம் (τ) மற்றும் கார்பன் வயது கணிப்பு',
          '9.7–9.8 அணுக்கரு பிளவு, அணுக்கரு உலை, அணுக்கரு இணைவு மற்றும் விண்மீன் ஆற்றல்'
        ],
        keyFormulas: ['N(t) = N₀ e^(-λt)', 'T₁/₂ = 0.693 / λ', 'τ = 1 / λ', '1 Ci = 3.7 × 10¹⁰ Bq'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      }
    ]
  },

  // ==================== VOLUME 2: UNIT 10 ====================
  {
    id: 'tn12-phys-u10',
    grade: '12',
    volume: 'Volume 2',
    tamilVolume: 'தொகுதி 2',
    number: 10,
    title: 'Electronic Devices and Communication Systems',
    tamilTitle: 'மின்னணு சாதனங்கள் மற்றும் தகவல் தொடர்பு அமைப்புகள்',
    topics: [
      {
        id: 'tn12-p-u10-t1',
        code: '10.1–10.2',
        title: 'Energy Band Theory, Intrinsic/Extrinsic Semiconductors & PN Junction Diode',
        tamilTitle: 'ஆற்றல் பட்டைக் கொள்கை, குறைக்கடத்திகள் மற்றும் PN சந்தி டையோடு',
        description:
          'Valence band, conduction band & forbidden energy gap in conductors, semiconductors & insulators, intrinsic & extrinsic (n-type & p-type) semiconductors, barrier potential & depletion region in PN junction, and forward & reverse V–I characteristics.',
        tamilDescription:
          'இணைதிறன் பட்டை, கடத்துப் பட்டை மற்றும் விலக்கப்பட்ட ஆற்றல் இடைவெளி, உள்ளார்ந்த மற்றும் புறவியல் (n-வகை, p-வகை) குறைக்கடத்திகள், PN சந்தி இயக்கத் தடை மின்னழுத்தம் மற்றும் முன்னோக்கு, பின்னோக்கு V–I சிறப்பு வரைபடங்கள்.',
        subTopics: [
          '10.1.1 Band Theory of Solids & Intrinsic / Extrinsic Semiconductors',
          '10.2.1 PN Junction Formation, Depletion Layer & Forward/Reverse Bias V–I Characteristics'
        ],
        tamilSubTopics: [
          '10.1.1 திண்மங்களின் ஆற்றல் பட்டைக் கொள்கை மற்றும் உள்ளார்ந்த/புறவியல் குறைக்கடத்திகள்',
          '10.2.1 PN சந்தி உருவாக்கம், இயக்கத் தடைப் பகுதி மற்றும் V–I சிறப்பு வரைபடங்கள்'
        ],
        keyFormulas: ['n_e · n_h = n_i²', 'V_barrier ≈ 0.7 V (Si), 0.3 V (Ge)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 22
      },
      {
        id: 'tn12-p-u10-t2',
        code: '10.2.3–10.3',
        title: 'Rectifiers, Zener Voltage Regulator, Optoelectronic Devices & BJT Transistor',
        tamilTitle: 'திருத்திகள், ஜீனர் டையோடு, ஒளிமின்னணு சாதனங்கள் மற்றும் டிரான்சிஸ்டர்',
        description:
          'Half-wave & full-wave bridge rectifiers with capacitor filter, Zener breakdown & Zener diode voltage regulator, LED, photodiode & solar cell, NPN/PNP BJT working, CB/CE/CC configurations, relation between α and β, and CE transistor amplifier & switch.',
        tamilDescription:
          'அரை அலை மற்றும் முழு அலை திருத்திகள், ஜீனர் டையோடு மின்னழுத்தச் சீரமைப்பி, LED, ஒளி டையோடு மற்றும் சூரிய மின்கலம், NPN/PNP டிரான்சிஸ்டர் செயல்பாடு, α மற்றும் β தொடர்பு மற்றும் CE பெருக்கி.',
        subTopics: [
          '10.2.3 Half-Wave & Full-Wave Rectifiers and Zener Diode Voltage Regulator',
          '10.2.4 LED, Photodiode & Solar Cell',
          '10.3.1 Bipolar Junction Transistor (BJT) Configurations, α–β Relation & CE Amplifier'
        ],
        tamilSubTopics: [
          '10.2.3 அரை அலை, முழு அலை திருத்திகள் மற்றும் ஜீனர் டையோடு மின்னழுத்தச் சீரமைப்பி',
          '10.2.4 LED, ஒளி டையோடு மற்றும் சூரிய மின்கலம்',
          '10.3.1 டிரான்சிஸ்டர் இணைப்புகள், α–β தொடர்பு மற்றும் CE பெருக்கி'
        ],
        keyFormulas: ['I_E = I_B + I_C', 'β = α / (1 - α)', 'A_v = β (R_C / R_i)'],
        difficulty: 'Advanced',
        tamilDifficulty: 'உயர்நிலை',
        estimatedMinutes: 26
      },
      {
        id: 'tn12-p-u10-t3',
        code: '10.4–10.5',
        title: 'Digital Electronics, Boolean Algebra, De Morgan’s Theorems & Logic Gates',
        tamilTitle: 'டிஜிட்டல் மின்னணுவியல், பூலியன் இயற்கணிதம், டி மார்கன் தேற்றங்கள் மற்றும் தர்க்க வாயில்கள்',
        description:
          'Analog vs digital signals, Boolean algebra laws, De Morgan’s first & second theorems, truth tables & symbols for AND, OR, NOT, NAND, NOR & XOR gates, and universal gates (NAND & NOR).',
        tamilDescription:
          'தொடர் மற்றும் இலக்கமுறை சைகைகள், பூலியன் இயற்கணித விதிகள், டி மார்கனின் முதல் மற்றும் இரண்டாம் தேற்றங்கள், AND, OR, NOT, NAND, NOR, XOR தர்க்க வாயில்கள் மற்றும் பொது வாயில்கள்.',
        subTopics: [
          '10.4.1 Boolean Algebra Laws & De Morgan’s First and Second Theorems',
          '10.5.1 Logic Gates (AND, OR, NOT, NAND, NOR, XOR) & Universal Gates'
        ],
        tamilSubTopics: [
          '10.4.1 பூலியன் இயற்கணித விதிகள் மற்றும் டி மார்கன் தேற்றங்கள்',
          '10.5.1 தர்க்க வாயில்கள் (AND, OR, NOT, NAND, NOR, XOR) மற்றும் பொது வாயில்கள்'
        ],
        keyFormulas: ['(A + B)̅ = Ā · B̅', '(A · B)̅ = Ā + B̅', 'Y_XOR = ĀB + A B̅'],
        difficulty: 'Foundation',
        tamilDifficulty: 'அடிப்படை',
        estimatedMinutes: 20
      },
      {
        id: 'tn12-p-u10-t4',
        code: '10.6–10.8',
        title: 'Communication Systems, AM/FM Modulation, Wave Propagation, Satellite & Fiber Comm.',
        tamilTitle: 'தகவல் தொடர்பு அமைப்புகள், பண்பேற்றம், அலை பரவல், செயற்கைக்கோள் மற்றும் ஒளியிழை தொடர்பு',
        description:
          'Elements of communication system, Amplitude Modulation (AM) modulation index, sidebands & bandwidth, Frequency Modulation (FM) & Phase Modulation (PM), ground wave, sky wave & space wave propagation, radar, satellite communication, optical fiber communication, and Internet & GPS.',
        tamilDescription:
          'தகவல் தொடர்பு அமைப்பின் கூறுகள், வீச்சுப் பண்பேற்றம் (AM) மற்றும் அதிர்வெண் பண்பேற்றம் (FM), தரை அலை, வான் அலை மற்றும் வெளி அலை பரவல், ரேடார், செயற்கைக்கோள் தொடர்பு, ஒளியிழை தொடர்பு மற்றும் GPS.',
        subTopics: [
          '10.6.1 Elements of Communication System & Amplitude / Frequency Modulation (AM & FM)',
          '10.7.1 Ground Wave, Sky Wave (Ionosphere) & Space Wave Propagation',
          '10.8.1 Satellite Communication, Optical Fiber Communication, Radar & GPS'
        ],
        tamilSubTopics: [
          '10.6.1 தகவல் தொடர்பு அமைப்பு மற்றும் வீச்சு/அதிர்வெண் பண்பேற்றம் (AM & FM)',
          '10.7.1 தரை அலை, வான் அலை மற்றும் வெளி அலை பரவல்',
          '10.8.1 செயற்கைக்கோள், ஒளியிழை தொடர்பு, ரேடார் மற்றும் GPS'
        ],
        keyFormulas: ['μ = E_m / E_c = (A_max - A_min)/(A_max + A_min)', 'BW_AM = 2 f_m', 'd_horizon = √(2 R h)'],
        difficulty: 'Intermediate',
        tamilDifficulty: 'நடுத்தரம்',
        estimatedMinutes: 24
      }
    ]
  }
];

const PRACTICE_QUESTIONS: PracticeQuestion[] = [
  {
    id: 'pq-phys-1',
    grade: '12',
    topicId: 'tn12-p-u1-t5',
    question: 'What is the total electric flux through a closed Gaussian surface enclosing an electric dipole? (TN Class 12 Unit 1)',
    tamilQuestion: 'ஒரு மின் இருமுனையை உள்ளடக்கிய மூடிய காஸியன் பரப்பின் வழியே செல்லும் மொத்த மின்பாயம் யாது? (12-ஆம் வகுப்பு அலகு 1)',
    options: ['Zero', 'q / ε₀', '2q / ε₀', 'q / 2ε₀'],
    tamilOptions: ['சுழி (Zero)', 'q / ε₀', '2q / ε₀', 'q / 2ε₀'],
    correctIndex: 0,
    explanation: 'An electric dipole consists of two equal and opposite charges (+q and -q). The net enclosed charge is q_enc = +q - q = 0, so by Gauss’s law Φ_E = q_enc / ε₀ = 0.',
    tamilExplanation: 'ஒரு மின் இருமுனை சமமான மற்றும் எதிரெதிர் மின்னூட்டங்களை (+q மற்றும் -q) கொண்டுள்ளது. மூடிய பரப்பிற்குள் உள்ள நிகர மின்னூட்டம் q_enc = +q - q = 0 என்பதால், காஸ் விதிப்படி Φ_E = q_enc / ε₀ = 0 ஆகும்.',
    difficulty: 'Easy',
    tamilDifficulty: 'எளிது'
  },
  {
    id: 'pq-phys-2',
    grade: '12',
    topicId: 'tn12-p-u2-t4',
    question: 'Kirchhoff’s First Law (Junction Rule) is a direct consequence of conservation of: (TN Class 12 Unit 2)',
    tamilQuestion: 'கிர்சாஃப் முதல் விதி (சந்தி விதி) எதன் அழிவின்மை விதியின் நேரடி விளைவாகும்? (12-ஆம் வகுப்பு அலகு 2)',
    options: ['Electric Charge', 'Energy', 'Linear Momentum', 'Angular Momentum'],
    tamilOptions: ['மின்னூட்டம் (Electric Charge)', 'ஆற்றல் (Energy)', 'நேர்க்கோட்டு உந்தம்', 'கோண உந்தம்'],
    correctIndex: 0,
    explanation: 'Kirchhoff’s current law (∑I = 0 at a junction) states that charge does not accumulate at a junction, which is conservation of electric charge.',
    tamilExplanation: 'கிர்சாஃப் மின்னோட்ட விதி (∑I = 0) ஒரு சந்தியில் மின்னூட்டம் சேருவதில்லை என்பதைக் கூறுகிறது; இது மின்னூட்ட அழிவின்மை விதியாகும்.',
    difficulty: 'Easy',
    tamilDifficulty: 'எளிது'
  },
  {
    id: 'pq-phys-3',
    grade: '12',
    topicId: 'tn12-p-u4-t4',
    question: 'In a series RLC circuit at resonance, the phase difference between applied voltage and current is: (TN Class 12 Unit 4)',
    tamilQuestion: 'ஒத்ததிர்வு நிலையில் உள்ள ஒரு தொடர் RLC சுற்றில், செலுத்தப்படும் மின்னழுத்த வேறுபாட்டிற்கும் மின்னோட்டத்திற்கும் இடையேயான கட்ட வேறுபாடு யாது? (12-ஆம் வகுப்பு அலகு 4)',
    options: ['Zero (0°)', 'π / 2 radians', 'π radians', 'π / 4 radians'],
    tamilOptions: ['சுழி (0°)', 'π / 2 ரேடியன்', 'π ரேடியன்', 'π / 4 ரேடியன்'],
    correctIndex: 0,
    explanation: 'At resonance, inductive reactance equals capacitive reactance (X_L = X_C), so impedance Z = R and voltage is in phase with current (φ = 0°).',
    tamilExplanation: 'ஒத்ததிர்வு நிலையில் மின்தூண்டி மின்மறுப்பும் மின்தேக்கி மின்மறுப்பும் சமமாகும் (X_L = X_C). எனவே மின்னழுத்தமும் மின்னோட்டமும் ஒரே கட்டத்தில் இருக்கும் (φ = 0°).',
    difficulty: 'Easy',
    tamilDifficulty: 'எளிது'
  },
  {
    id: 'pq-phys-4',
    grade: '12',
    topicId: 'tn12-p-u6-t2',
    question: 'The critical angle for total internal reflection from glass (n = 1.5) to air (n = 1) is given by: (TN Class 12 Unit 6)',
    tamilQuestion: 'கண்ணாடியிலிருந்து (n = 1.5) காற்றுக்கு (n = 1) முழு அக எதிரொளிப்பு ஏற்படுவதற்கான மாறுநிலைக் கோணம் யாது? (12-ஆம் வகுப்பு அலகு 6)',
    options: ['sin⁻¹(2/3)', 'sin⁻¹(3/2)', 'cos⁻¹(2/3)', 'tan⁻¹(2/3)'],
    tamilOptions: ['sin⁻¹(2/3)', 'sin⁻¹(3/2)', 'cos⁻¹(2/3)', 'tan⁻¹(2/3)'],
    correctIndex: 0,
    explanation: 'Using sin i_c = n₂ / n₁ = 1 / 1.5 = 2/3, the critical angle is i_c = sin⁻¹(2/3).',
    tamilExplanation: 'sin i_c = n₂ / n₁ = 1 / 1.5 = 2/3 என்பதால், மாறுநிலைக் கோணம் i_c = sin⁻¹(2/3) ஆகும்.',
    difficulty: 'Medium',
    tamilDifficulty: 'நடுத்தரம்'
  },
  {
    id: 'pq-phys-5',
    grade: '12',
    topicId: 'tn12-p-u8-t2',
    question: 'If the de Broglie wavelength of an electron is λ, what is its wavelength if its momentum is doubled? (TN Class 12 Unit 8)',
    tamilQuestion: 'ஒரு எலக்ட்ரானின் டி பிராக்லி அலைநீளம் λ எனில், அதன் உந்தம் இருமடங்காகும்போது புதிய அலைநீளம் யாது? (12-ஆம் வகுப்பு அலகு 8)',
    options: ['λ / 2', '2λ', 'λ / 4', '4λ'],
    tamilOptions: ['λ / 2', '2λ', 'λ / 4', '4λ'],
    correctIndex: 0,
    explanation: 'According to de Broglie relation, λ = h / p. Doubling momentum p gives λ\' = h / (2p) = λ / 2.',
    tamilExplanation: 'டி பிராக்லி சமன்பாடு λ = h / p படி, உந்தம் இருமடங்காகும்போது அலைநீளம் பாதியாகக் குறையும் (λ\' = λ / 2).',
    difficulty: 'Easy',
    tamilDifficulty: 'எளிது'
  },
  {
    id: 'pq-phys-6',
    grade: '12',
    topicId: 'tn12-p-u9-t3',
    question: 'If the half-life of a radioactive nucleus is T₁/₂, what fraction of original nuclei remains undecayed after 3 half-lives? (TN Class 12 Unit 9)',
    tamilQuestion: 'ஒரு கதிரியக்க அணுக்கருவின் அரை ஆயுட்காலம் T₁/₂ எனில், 3 அரை ஆயுட்காலங்களுக்குப் பிறகு சிதையாமல் எஞ்சியிருக்கும் அணுக்கருக்களின் பின்னம் யாது? (12-ஆம் வகுப்பு அலகு 9)',
    options: ['1 / 8', '1 / 4', '1 / 16', '3 / 8'],
    tamilOptions: ['1 / 8', '1 / 4', '1 / 16', '3 / 8'],
    correctIndex: 0,
    explanation: 'After n half-lives, remaining fraction is (1/2)^n. For n = 3, N / N₀ = (1/2)³ = 1/8.',
    tamilExplanation: 'n அரை ஆயுட்காலங்களுக்குப் பிறகு எஞ்சியிருக்கும் அளவு (1/2)^n ஆகும். n = 3 எனில் N / N₀ = (1/2)³ = 1/8.',
    difficulty: 'Medium',
    tamilDifficulty: 'நடுத்தரம்'
  },
  {
    id: 'pq-phys-7',
    grade: '12',
    topicId: 'tn12-p-u10-t3',
    question: 'Which logic gate produces a HIGH (1) output only when both inputs A and B are HIGH (1)? (TN Class 12 Unit 10)',
    tamilQuestion: 'இரு உள்ளீடுகளும் A மற்றும் B உயர்மட்டத்தில் (1) இருக்கும்போது மட்டுமே உயர்மட்ட (1) வெளியீட்டைத் தரும் தர்க்க வாயில் எது? (12-ஆம் வகுப்பு அலகு 10)',
    options: ['AND Gate', 'OR Gate', 'XOR Gate', 'NOR Gate'],
    tamilOptions: ['AND வாயில்', 'OR வாயில்', 'XOR வாயில்', 'NOR வாயில்'],
    correctIndex: 0,
    explanation: 'An AND gate follows Y = A · B, which equals 1 only when A = 1 and B = 1.',
    tamilExplanation: 'AND வாயில் Y = A · B என்ற சமன்பாட்டைப் பின்பற்றுகிறது; A = 1 மற்றும் B = 1 ஆக இருக்கும்போது மட்டுமே Y = 1 கிடைக்கும்.',
    difficulty: 'Easy',
    tamilDifficulty: 'எளிது'
  }
];

const PAST_QUESTIONS: PastQuestion[] = [
  {
    id: 'tn-phys-past-2025-1',
    grade: '12',
    year: 2025,
    paper: 'TN HSC March Public Exam - Physics (5 Marks)',
    tamilPaper: 'தமிழ்நாடு அரசு மார்ச் பொதுத்தேர்வு - இயற்பியல் (5 மதிப்பெண்கள்)',
    topic: 'Unit 1: Electrostatics (1.3 Electric Dipole)',
    tamilTopic: 'அலகு 1: நிலை மின்னியல் (1.3 மின் இருமுனை)',
    marks: 5,
    question: 'Derive an expression for the electric field due to an electric dipole along its axial line.',
    tamilQuestion: 'மின் இருமுனை ஒன்றினால் அதன் அச்சுக்கோட்டில் ஏற்படும் மின்புலத்திற்கான சமன்பாட்டை வருவி.',
    solutionSteps: [
      'Step 1: Consider an electric dipole consisting of charges -q and +q separated by distance 2a along the x-axis with center O.',
      'Step 2: Let point P lie on the axial line at distance r from the center O (r > a) on the +q side.',
      'Step 3: Electric field at P due to +q is E₊ = (1/4πε₀) · [q / (r - a)²] p̂, and due to -q is E₋ = -(1/4πε₀) · [q / (r + a)²] p̂.',
      'Step 4: Net field E_axial = E₊ + E₋ = (q / 4πε₀) [1/(r - a)² - 1/(r + a)²] p̂ = (1/4πε₀) · [4ar / (r² - a²)²] p̂.',
      'Step 5: Since dipole moment p = 2aq, E_axial = (1/4πε₀) · [2pr / (r² - a²)²] p̂. For r ≫ a, E_axial ≈ (1/4πε₀) · (2p / r³) p̂.'
    ],
    tamilSolutionSteps: [
      'படி 1: O வை மையமாகக் கொண்டு 2a தொலைவில் பிரித்து வைக்கப்பட்டுள்ள -q மற்றும் +q மின்னூட்டங்கள் கொண்ட மின் இருமுனையைக் கருதுக.',
      'படி 2: +q மின்னூட்டத்தின் பக்கத்தில் மையம் O விலிருந்து r தொலைவில் அச்சுக்கோட்டில் P என்ற புள்ளியைக் கருதுக.',
      'படி 3: +q மின்னூட்டத்தால் P-ல் ஏற்படும் மின்புலம் E₊ = (1/4πε₀) · [q / (r - a)²] p̂ மற்றும் -q ஆல் ஏற்படும் மின்புலம் E₋ = -(1/4πε₀) · [q / (r + a)²] p̂.',
      'படி 4: மொத்த மின்புலம் E_axial = E₊ + E₋ = (q / 4πε₀) [1/(r - a)² - 1/(r + a)²] p̂ = (1/4πε₀) · [4ar / (r² - a²)²] p̂.',
      'படி 5: p = 2aq என்பதால் E_axial = (1/4πε₀) · [2pr / (r² - a²)²] p̂. r ≫ a எனில் E_axial ≈ (1/4πε₀) · (2p / r³) p̂.'
    ],
    finalAnswer: 'E_axial = (1 / 4πε₀) · [2pr / (r² - a²)²] p̂  (For r ≫ a: 2p / 4πε₀r³)',
    tamilFinalAnswer: 'E_axial = (1 / 4πε₀) · [2pr / (r² - a²)²] p̂  (r ≫ a எனில்: 2p / 4πε₀r³)'
  },
  {
    id: 'tn-phys-past-2025-2',
    grade: '12',
    year: 2025,
    paper: 'TN HSC March Public Exam - Physics (5 Marks)',
    tamilPaper: 'தமிழ்நாடு அரசு மார்ச் பொதுத்தேர்வு - இயற்பியல் (5 மதிப்பெண்கள்)',
    topic: 'Unit 4: Electromagnetic Induction and Alternating Current (4.7 RLC Resonance)',
    tamilTopic: 'அலகு 4: மின்காந்தத் தூண்டல் மற்றும் மாறுதிசை மின்னோட்டம் (4.7 RLC ஒத்ததிர்வு)',
    marks: 5,
    question: 'Obtain an expression for the resonant angular frequency ω_r of a series RLC circuit connected to an AC source.',
    tamilQuestion: 'AC மூலத்துடன் இணைக்கப்பட்டுள்ள தொடர் RLC சுற்றின் ஒத்ததிர்வு கோண அதிர்வெண் ω_r க்கான சமன்பாட்டைப் பெறுக.',
    solutionSteps: [
      'Step 1: In a series RLC circuit, inductive reactance is X_L = ωL and capacitive reactance is X_C = 1 / (ωC).',
      'Step 2: Total impedance of the circuit is Z = √[R² + (X_L - X_C)²].',
      'Step 3: Electrical resonance occurs when current is maximum, which happens when impedance Z is minimum (Z = R).',
      'Step 4: Setting X_L = X_C gives ω_r L = 1 / (ω_r C) ⇒ ω_r² = 1 / (LC) ⇒ ω_r = 1 / √(LC).'
    ],
    tamilSolutionSteps: [
      'படி 1: தொடர் RLC சுற்றில் மின்தூண்டி மின்மறுப்பு X_L = ωL மற்றும் மின்தேக்கி மின்மறுப்பு X_C = 1 / (ωC).',
      'படி 2: சுற்றின் மொத்த மின்மறுப்பு Z = √[R² + (X_L - X_C)²].',
      'படி 3: மின்மறுப்பு Z சிறுமமாக (Z = R) இருக்கும்போது பெரும மின்னோட்டம் பாய்ந்து மின் ஒத்ததிர்வு ஏற்படுகிறது.',
      'படி 4: X_L = X_C எனப் பிரதியிட ω_r L = 1 / (ω_r C) ⇒ ω_r² = 1 / (LC) ⇒ ω_r = 1 / √(LC).'
    ],
    finalAnswer: 'ω_r = 1 / √(LC)  (f_r = 1 / [2π√(LC)])',
    tamilFinalAnswer: 'ω_r = 1 / √(LC)  (f_r = 1 / [2π√(LC)])'
  },
  {
    id: 'tn-phys-past-2024',
    grade: '12',
    year: 2024,
    paper: 'TN HSC Public Exam - Physics (5 Marks)',
    tamilPaper: 'தமிழ்நாடு அரசு பொதுத்தேர்வு - இயற்பியல் (5 மதிப்பெண்கள்)',
    topic: 'Unit 6: Ray Optics (6.5 Lens Maker’s Formula)',
    tamilTopic: 'அலகு 6: கதிர் ஒளியியல் (6.5 லென்ஸ் உருவாக்குபவர் சமன்பாடு)',
    marks: 5,
    question: 'Derive the Lens Maker’s formula for a thin convex lens of refractive index n₂ placed in a medium of refractive index n₁.',
    tamilQuestion: 'n₁ ஒளிவிலகல் எண் கொண்ட ஊடகத்தில் வைக்கப்பட்டுள்ள n₂ ஒளிவிலகல் எண் கொண்ட மெல்லிய குவிலென்சிற்கான லென்ஸ் உருவாக்குபவர் சமன்பாட்டை வருவி.',
    solutionSteps: [
      'Step 1: Consider a point object O on the principal axis of a thin lens with radii of curvature R₁ and R₂.',
      'Step 2: Using spherical refracting surface formula (n₂/v) - (n₁/u) = (n₂ - n₁)/R for the first surface forming intermediate image I₁ at distance v₁: (n₂/v₁) - (n₁/u) = (n₂ - n₁)/R₁.',
      'Step 3: For the second surface, I₁ acts as virtual object forming final image I at distance v: (n₁/v) - (n₂/v₁) = (n₁ - n₂)/R₂.',
      'Step 4: Adding both equations cancels n₂/v₁: (n₁/v) - (n₁/u) = (n₂ - n₁)(1/R₁ - 1/R₂).',
      'Step 5: Dividing by n₁ and setting u = ∞ ⇒ v = f gives (1/f) = (n₂/n₁ - 1)(1/R₁ - 1/R₂).'
    ],
    tamilSolutionSteps: [
      'படி 1: R₁ மற்றும் R₂ வளைவு ஆரங்கள் கொண்ட மெல்லிய லென்சின் முதன்மை அச்சில் O என்ற புள்ளிப் பொருளைக் கருதுக.',
      'படி 2: முதல் கோளகப் பரப்பில் ஒளிவிலகல் ஏற்பட்டு v₁ தொலைவில் I₁ பிம்பம் உருவாகிறது: (n₂/v₁) - (n₁/u) = (n₂ - n₁)/R₁.',
      'படி 3: இரண்டாவது பரப்பிற்கு I₁ மாயப் பொருளாகச் செயல்பட்டு v தொலைவில் இறுதி பிம்பம் I உருவாகிறது: (n₁/v) - (n₂/v₁) = (n₁ - n₂)/R₂.',
      'படி 4: இரு சமன்பாடுகளையும் கூட்ட (n₁/v) - (n₁/u) = (n₂ - n₁)(1/R₁ - 1/R₂) கிடைக்கிறது.',
      'படி 5: n₁ ஆல் வகுத்து u = ∞ ⇒ v = f எனப் பிரதியிட (1/f) = (n₂/n₁ - 1)(1/R₁ - 1/R₂) பெறப்படுகிறது.'
    ],
    finalAnswer: '1/f = (n₂/n₁ - 1)(1/R₁ - 1/R₂)',
    tamilFinalAnswer: '1/f = (n₂/n₁ - 1)(1/R₁ - 1/R₂)'
  },
  {
    id: 'tn-phys-past-2023',
    grade: '12',
    year: 2023,
    paper: 'TN HSC Public Exam - Physics (5 Marks)',
    tamilPaper: 'தமிழ்நாடு அரசு பொதுத்தேர்வு - இயற்பியல் (5 மதிப்பெண்கள்)',
    topic: 'Unit 8: Dual Nature of Radiation and Matter (8.2 Photoelectric Equation)',
    tamilTopic: 'அலகு 8: கதிர்வீச்சு மற்றும் பொருளின் இரட்டைப் பண்பு (8.2 ஒளிமின் சமன்பாடு)',
    marks: 5,
    question: 'State Einstein’s photoelectric equation and explain any three characteristics of photoelectric effect using it.',
    tamilQuestion: 'ஐன்ஸ்டீனின் ஒளிமின் சமன்பாட்டைக் கூறி, அதன் மூலம் ஒளிமின் விளைவின் ஏதேனும் மூன்று சிறப்பியல்புகளை விளக்குக.',
    solutionSteps: [
      'Step 1: Einstein’s photoelectric equation: hν = φ₀ + K_max, where hν is incident photon energy, φ₀ = hν₀ is work function, and K_max = ½mv_max² is maximum kinetic energy.',
      'Step 2: Threshold frequency (ν₀): If ν < ν₀, K_max < 0, so no photoelectrons are emitted regardless of intensity.',
      'Step 3: Effect of frequency: K_max increases linearly with frequency ν above ν₀ for a fixed metal.',
      'Step 4: Effect of intensity: Increasing intensity at fixed frequency increases number of photons per second, increasing photoelectric current without changing K_max.'
    ],
    tamilSolutionSteps: [
      'படி 1: ஐன்ஸ்டீனின் ஒளிமின் சமன்பாடு: hν = φ₀ + K_max; இங்கு hν என்பது படு ஃபோட்டான் ஆற்றல், φ₀ = hν₀ என்பது வெளியேற்று ஆற்றல்.',
      'படி 2: பயன்தொடக்க அதிர்வெண் (ν₀): ν < ν₀ எனில் K_max < 0 ஆவதால், ஒளிச்செறிவு எவ்வளவு அதிகமாக இருப்பினும் எலக்ட்ரான்கள் உமிழப்படாது.',
      'படி 3: அதிர்வெண்ணின் விளைவு: பயன்தொடக்க அதிர்வெண்ணிற்கு மேல் அதிர்வெண் ν அதிகரிக்கும்போது K_max நேர்க்கோட்டில் அதிகரிக்கும்.',
      'படி 4: ஒளிச்செறிவின் விளைவு: மாறாத அதிர்வெண்ணில் ஒளிச்செறிவு அதிகரிக்கும்போது ஒளிமின்சாரம் அதிகரிக்கும்; ஆனால் K_max மாறாது.'
    ],
    finalAnswer: 'K_max = hν - φ₀ = h(ν - ν₀)',
    tamilFinalAnswer: 'K_max = hν - φ₀ = h(ν - ν₀)'
  }
];

// ============================================================================
// HELPER UTILITIES: FAST 4.5S TIMEOUT FETCH & BASE64 DECODING FOR GEMINI TTS
// ============================================================================

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 4500
): Promise<Response> {
  const controller = new AbortController();
  const timerId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    window.clearTimeout(timerId);
  }
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================================================
// NARRATION-DRIVEN SCENE RESOLVER (UPDATES EVERY 2 SPOKEN POINTS & KEYWORDS)
// ============================================================================

type VisualDiagramScene =
  | 'hardware_cyclotron'
  | 'hardware_transformer'
  | 'hardware_vandegraaff'
  | 'hardware_galvanometer'
  | 'hardware_bridge'
  | 'hardware_semiconductor'
  | 'hardware_fiber_optic'
  | 'gauss_shell'
  | 'dipole_axis'
  | 'capacitor_plates'
  | 'drift_current'
  | 'solenoid_field'
  | 'rlc_resonance'
  | 'prism_dispersion'
  | 'interference_fringes'
  | 'bohr_orbit'
  | 'photoelectric_cell';

interface NarrationSceneCue {
  scene: VisualDiagramScene;
  captionEn: string;
  captionTa: string;
  pointPairLabel: string;
}

function splitNarrationIntoTwoPointPairs(narration: string): string[] {
  const units = narration
    .split(/(?<=[.!?।;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (units.length <= 1) {
    const words = narration.trim().split(/\s+/).filter(Boolean);
    if (words.length <= 16) return [narration.trim() || 'Core Physics Principle'];
    const pairs: string[] = [];
    const chunkSize = Math.ceil(words.length / Math.max(2, Math.ceil(words.length / 18)));
    for (let i = 0; i < words.length; i += chunkSize) {
      pairs.push(words.slice(i, i + chunkSize).join(' '));
    }
    return pairs;
  }

  const pairs: string[] = [];
  for (let i = 0; i < units.length; i += 2) {
    const combined = units[i + 1] ? `${units[i]} ${units[i + 1]}` : units[i];
    pairs.push(combined);
  }
  return pairs;
}

function classifySpokenSegmentToDiagram(
  spokenSegment: string,
  lessonTopic: string,
  slideTitle: string,
  pairIndex: number
): NarrationSceneCue {
  const text = `${spokenSegment} ${slideTitle}`.toLowerCase();
  const fallbackTopic = lessonTopic.toLowerCase();

  const hasHardwareKeyword =
    /(hardware|device|apparatus|instrument|machine|setup|equipment|circuit|generator|detector|meter|galvanometer|bridge|transformer|cyclotron|capacitor|diode|transistor|gate|fiber|fibre|telescope|microscope|கருவி|சாதனம்|இயற்றி|மின்மாற்றி|கால்வனோமீட்டர்|சமனச்சுற்று|டையோடு|டிரான்சிஸ்டர்|ஒளியிழை)/.test(
      text
    );

  let scene: VisualDiagramScene = 'gauss_shell';
  let captionEn = 'Electrostatic Field & Gauss Surface';
  let captionTa = 'நிலைமின்புலம் மற்றும் காஸ் பரப்பு';

  if (/(cyclotron|dees|particle accelerator|சைக்ளோட்ரான்)/.test(text)) {
    scene = 'hardware_cyclotron';
    captionEn = 'Hardware: Cyclotron Dee Accelerator';
    captionTa = 'சாதனம்: சைக்ளோட்ரான் துகள் முடுக்கி';
  } else if (/(transformer|primary|secondary|turns ratio|step-up|step-down|மின்மாற்றி)/.test(text)) {
    scene = 'hardware_transformer';
    captionEn = 'Hardware: Laminated Core Transformer';
    captionTa = 'சாதனம்: மின்மாற்றி உள்ளகம் & சுருள்கள்';
  } else if (/(van de graaff|dome|corona|lightning arrester|வான் டி கிராப்)/.test(text)) {
    scene = 'hardware_vandegraaff';
    captionEn = 'Hardware: Van de Graaff HV Generator';
    captionTa = 'சாதனம்: வான் டி கிராப் உயர் மின்னழுத்த இயற்றி';
  } else if (/(galvanometer|ammeter|voltmeter|shunt|moving coil|கால்வனோமீட்டர்|அம்மீட்டர்|வோல்ட்மீட்டர்)/.test(text)) {
    scene = 'hardware_galvanometer';
    captionEn = 'Hardware: Moving Coil Galvanometer';
    captionTa = 'சாதனம்: இயங்கு சுருள் கால்வனோமீட்டர்';
  } else if (/(wheatstone|meter bridge|potentiometer|jockey|null deflection|சமனச்சுற்று|மின்னழுத்தமானி)/.test(text)) {
    scene = 'hardware_bridge';
    captionEn = 'Hardware: Wheatstone / Meter Bridge';
    captionTa = 'சாதனம்: வீட்ஸ்டோன் / மீட்டர் சமனச்சுற்று';
  } else if (
    /(semiconductor|pn junction|diode|zener|rectifier|transistor|bjt|amplifier|logic gate|boolean|குறைக்கடத்தி|டையோடு|டிரான்சிஸ்டர்|தர்க்க வாயில்)/.test(
      text
    )
  ) {
    scene = 'hardware_semiconductor';
    captionEn = 'Hardware: PN Junction & Logic Circuit';
    captionTa = 'சாதனம்: PN சந்தி & மின்னணு சுற்று';
  } else if (/(optical fiber|fibre|acceptance angle|total internal reflection|core|cladding|ஒளியிழை|முழு அக எதிரொளிப்பு)/.test(text)) {
    scene = 'hardware_fiber_optic';
    captionEn = 'Hardware: Optical Fiber Waveguide';
    captionTa = 'சாதனம்: ஒளியிழை தகவல் தொடர்பு';
  } else if (/(dipole|axial|equatorial|torque|இருமுனை|அச்சுக்கோடு|திருப்புவிசை)/.test(text)) {
    scene = 'dipole_axis';
    captionEn = 'Electric Dipole Axial & Equatorial Field';
    captionTa = 'மின் இருமுனை அச்சுக்கோடு & நடுவரைப் புலம்';
  } else if (/(capacitor|dielectric|parallel plate|மின்தேக்கி|மின்காப்பு)/.test(text)) {
    scene = 'capacitor_plates';
    captionEn = 'Parallel Plate Capacitor & Dielectric';
    captionTa = 'இணைத்தட்டு மின்தேக்கி & மின்காப்பு';
  } else if (/(drift|current|ohm|resistivity|electron|மின்னோட்டம்|இழுப்புத் திசைவேகம்|ஓம் விதி)/.test(text)) {
    scene = 'drift_current';
    captionEn = 'Free Electron Drift & Current Density';
    captionTa = 'எலக்ட்ரான் இழுப்புத் திசைவேகம்';
  } else if (/(solenoid|toroid|ampere|biot|magnetic|வரிச்சுருள்|காந்தப்புலம்|ஆம்பியர்)/.test(text)) {
    scene = 'solenoid_field';
    captionEn = 'Solenoid Axial Magnetic Field';
    captionTa = 'வரிச்சுருளின் உட்புற காந்தப்புலம்';
  } else if (/(rlc|resonance|alternating|ac|impedance|phasor|inductor|ஒத்ததிர்வு|மாறுதிசை|மின்மறுப்பு)/.test(text)) {
    scene = 'rlc_resonance';
    captionEn = 'Series RLC Resonance & AC Phasors';
    captionTa = 'தொடர் RLC ஒத்ததிர்வு & AC அலைகள்';
  } else if (/(prism|lens|refraction|dispersion|mirror|ray|முப்பட்டகம்|லென்ஸ்|ஒளிவிலகல்|நிறப்பிரிகை)/.test(text)) {
    scene = 'prism_dispersion';
    captionEn = 'Refraction & Prism Dispersion';
    captionTa = 'முப்பட்டக ஒளிவிலகல் & நிறப்பிரிகை';
  } else if (/(interference|diffraction|young|slit|polarization|wavefront|குறுக்கீட்டு|விளிம்பு விளைவு|தளவிளைவு)/.test(text)) {
    scene = 'interference_fringes';
    captionEn = 'Young’s Double Slit Interference';
    captionTa = 'யங் இரட்டைப் பிளவு குறுக்கீட்டுப் பட்டைகள்';
  } else if (/(bohr|atom|orbit|nucleus|radioactive|fission|fusion|அணு|சுற்றுப்பாதை|அணுக்கரு|கதிரியக்கம்)/.test(text)) {
    scene = 'bohr_orbit';
    captionEn = 'Bohr Quantized Orbit & Nuclear Transition';
    captionTa = 'போர் அணு சுற்றுப்பாதை & ஆற்றல் நிலை';
  } else if (/(photoelectric|photon|einstein|de broglie|work function|ஒளிமின்|ஃபோட்டான்|டி பிராக்லி)/.test(text)) {
    scene = 'photoelectric_cell';
    captionEn = 'Hardware: Photoelectric Cell & Photons';
    captionTa = 'சாதனம்: ஒளிமின்கலன் & ஃபோட்டான் உமிழ்வு';
  } else if (hasHardwareKeyword) {
    if (fallbackTopic.includes('unit 3') || fallbackTopic.includes('magnet')) {
      scene = 'hardware_galvanometer';
      captionEn = 'Hardware: Electromagnetic Measuring Instrument';
      captionTa = 'சாதனம்: மின்காந்த அளவீட்டுக் கருவி';
    } else if (fallbackTopic.includes('unit 4') || fallbackTopic.includes('ac')) {
      scene = 'hardware_transformer';
      captionEn = 'Hardware: AC Induction & Transformer Core';
      captionTa = 'சாதனம்: AC மின்மாற்றி உள்ளகம்';
    } else if (fallbackTopic.includes('unit 10') || fallbackTopic.includes('electronic')) {
      scene = 'hardware_semiconductor';
      captionEn = 'Hardware: Semiconductor & Digital Circuit';
      captionTa = 'சாதனம்: குறைக்கடத்தி மின்னணு சுற்று';
    } else {
      scene = 'hardware_bridge';
      captionEn = 'Hardware: Precision Physics Apparatus';
      captionTa = 'சாதனம்: இயற்பியல் ஆய்வகக் கருவி';
    }
  } else {
    const unitPool: Array<{ scene: VisualDiagramScene; en: string; ta: string }> =
      fallbackTopic.includes('unit 2') || fallbackTopic.includes('current')
        ? [
            { scene: 'drift_current', en: 'Microscopic Electron Drift Model', ta: 'எலக்ட்ரான் இழுப்புத் திசைவேக மாதிரி' },
            { scene: 'hardware_bridge', en: 'Hardware: Wheatstone & Potentiometer', ta: 'சாதனம்: சமனச்சுற்று & மின்னழுத்தமானி' }
          ]
        : fallbackTopic.includes('unit 3') || fallbackTopic.includes('magnet')
        ? [
            { scene: 'solenoid_field', en: 'Magnetic Field Lines & Ampere Loop', ta: 'காந்தப்புலக் கோடுகள் & ஆம்பியர் சுற்று' },
            { scene: 'hardware_cyclotron', en: 'Hardware: Cyclotron & Galvanometer', ta: 'சாதனம்: சைக்ளோட்ரான் & கால்வனோமீட்டர்' }
          ]
        : fallbackTopic.includes('unit 4') || fallbackTopic.includes('ac') || fallbackTopic.includes('induction')
        ? [
            { scene: 'rlc_resonance', en: 'AC Waveforms & RLC Resonance', ta: 'மாறுதிசை மின்னோட்டம் & RLC ஒத்ததிர்வு' },
            { scene: 'hardware_transformer', en: 'Hardware: AC Generator & Transformer', ta: 'சாதனம்: AC மின்னியற்றி & மின்மாற்றி' }
          ]
        : fallbackTopic.includes('unit 6') || fallbackTopic.includes('ray')
        ? [
            { scene: 'prism_dispersion', en: 'Ray Refraction & Dispersion', ta: 'ஒளிக்கதிர் விலகல் & நிறப்பிரிகை' },
            { scene: 'hardware_fiber_optic', en: 'Hardware: Optical Fiber & Lens Setup', ta: 'சாதனம்: ஒளியிழை & லென்ஸ் அமைப்பு' }
          ]
        : fallbackTopic.includes('unit 7') || fallbackTopic.includes('wave')
        ? [
            { scene: 'interference_fringes', en: 'Wave Superposition & Fringes', ta: 'அலை மேற்பொருந்துதல் & குறுக்கீட்டுப் பட்டைகள்' },
            { scene: 'prism_dispersion', en: 'Diffraction Grating & Polarization', ta: 'விளிம்பு விளைவு கீற்றணி & தளவிளைவு' }
          ]
        : fallbackTopic.includes('unit 8') || fallbackTopic.includes('dual')
        ? [
            { scene: 'photoelectric_cell', en: 'Hardware: Photoelectric Tube', ta: 'சாதனம்: ஒளிமின் குழாய் & ஃபோட்டான்கள்' },
            { scene: 'bohr_orbit', en: 'de Broglie Matter Wave Orbit', ta: 'டி பிராக்லி பருப்பொருள் அலை' }
          ]
        : fallbackTopic.includes('unit 9') || fallbackTopic.includes('atom') || fallbackTopic.includes('nuclear')
        ? [
            { scene: 'bohr_orbit', en: 'Bohr Quantized Energy Levels', ta: 'போர் அணு ஆற்றல் நிலைகள்' },
            { scene: 'hardware_cyclotron', en: 'Hardware: Nuclear Reactor & Detector', ta: 'சாதனம்: அணுக்கரு உலை & உணர்வி' }
          ]
        : fallbackTopic.includes('unit 10') || fallbackTopic.includes('electronic')
        ? [
            { scene: 'hardware_semiconductor', en: 'Hardware: PN Junction & Logic Gates', ta: 'சாதனம்: PN சந்தி & தர்க்க வாயில்கள்' },
            { scene: 'hardware_fiber_optic', en: 'Hardware: Satellite & Fiber Link', ta: 'சாதனம்: செயற்கைக்கோள் & ஒளியிழை தொடர்பு' }
          ]
        : [
            { scene: 'gauss_shell', en: 'Gauss Surface & Electric Flux', ta: 'காஸ் பரப்பு & மின்பாயம்' },
            { scene: 'capacitor_plates', en: 'Hardware: Parallel Plate Capacitor', ta: 'சாதனம்: இணைத்தட்டு மின்தேக்கி' }
          ];

    const picked = unitPool[pairIndex % unitPool.length];
    scene = picked.scene;
    captionEn = picked.en;
    captionTa = picked.ta;
  }

  return {
    scene,
    captionEn,
    captionTa,
    pointPairLabel: `Points ${pairIndex * 2 + 1}–${pairIndex * 2 + 2}`
  };
}

// ============================================================================
// INSTANT SYLLABUS-AWARE 4-DIVISION LESSON BUILDER (GUARANTEED <= 5S)
// ============================================================================

function buildInstantSyllabusLesson(
  topicQuery: string,
  isTamilMode: boolean,
  langConfig: LanguageOption
): GeneratedLesson {
  const q = topicQuery.toLowerCase();
  let matchedUnit = TN_PHYSICS_SYLLABUS[0];
  for (const u of TN_PHYSICS_SYLLABUS) {
    if (
      q.includes(`unit ${u.number}`) ||
      q.includes(`அலகு ${u.number}`) ||
      q.includes(u.title.toLowerCase()) ||
      q.includes(u.tamilTitle) ||
      u.topics.some(
        (t) =>
          q.includes(t.code) ||
          q.includes(t.title.toLowerCase().slice(0, 14)) ||
          q.includes(t.tamilTitle.slice(0, 10))
      )
    ) {
      matchedUnit = u;
      break;
    }
  }

  const matchedTopic =
    matchedUnit.topics.find(
      (t) =>
        q.includes(t.code) ||
        q.includes(t.title.toLowerCase().slice(0, 14)) ||
        q.includes(t.tamilTitle.slice(0, 10))
    ) || matchedUnit.topics[0];

  const primaryFormula = matchedTopic.keyFormulas[0] || 'F = qE';
  const secondaryFormula = matchedTopic.keyFormulas[1] || primaryFormula;

  if (isTamilMode) {
    return {
      lessonTitle: `அலகு ${matchedUnit.number}: ${matchedTopic.tamilTitle}`,
      topicSummary: matchedTopic.tamilDescription,
      slides: [
        {
          slideNumber: 1,
          title: 'அடிப்படைக் கோட்பாடு மற்றும் வரையறை',
          visualType: 'field_lines',
          equation: primaryFormula,
          bulletPoints: matchedTopic.tamilSubTopics.slice(0, 3),
          narration: `${matchedUnit.tamilTitle} பாடத்தில் ${matchedTopic.tamilTitle} மிக முக்கியமான அடிப்படைப் பகுதியாகும். இயற்பியல் அளவுகளின் திசை மற்றும் எண்மதிப்பு சமச்சீர் கல்வி பாடத்திட்டத்தில் தெளிவாக வரையறுக்கப்பட்டுள்ளது. இந்த விதி புலக் கோடுகள் மற்றும் ஆற்றல் மாற்றங்களின் அடிப்படைத் தொடர்பை விளக்குகிறது. அலகு மற்றும் பரிமாண வாய்ப்பாடுகள் பொதுத்தேர்வு வினாக்களில் முக்கியப் பங்கு வகிக்கின்றன.`
        },
        {
          slideNumber: 2,
          title: 'கணிதச் சமன்பாடு மற்றும் நிரூபணம்',
          visualType: 'ac_wave',
          equation: secondaryFormula,
          bulletPoints: matchedTopic.keyFormulas,
          narration: `அடிப்படை விதியிலிருந்து முக்கிய சமன்பாடான ${primaryFormula} படிப்படியாக வருவிக்கப்படுகிறது. எல்லை நிபந்தனைகளைப் பிரதியிடும்போது ${secondaryFormula} என்ற துல்லியமான தொடர்பு கிடைக்கிறது. மாறிகளுக்கு இடையேயான நேர்விகித மற்றும் எதிர்விகிதத் தொடர்புகள் வரைபடத்தில் தெளிவாகக் காட்டப்பட்டுள்ளன. அனைத்து கணக்கீடுகளும் SI அலகு முறையில் மட்டுமே செய்யப்பட வேண்டும்.`
        },
        {
          slideNumber: 3,
          title: 'ஆய்வகச் சாதனம் மற்றும் செயல்பாடு',
          visualType: 'ray_optics',
          equation: primaryFormula,
          bulletPoints: [
            `முக்கியச் சாதனம்: ${matchedTopic.tamilTitle} சோதனை அமைப்பு`,
            'துல்லியமான அளவீடு மற்றும் சுழி விலகல் சமநிலை',
            'நடைமுறைப் பயன்பாடுகள் மற்றும் கருவி வடிவமைப்பு'
          ],
          narration: `இந்தத் தத்துவத்தின் அடிப்படையில் இயங்கும் ஆய்வகச் சாதனம் மற்றும் கருவி அமைப்பு இங்கே காட்டப்பட்டுள்ளது. கருவியின் உள்ளமைப்பு மற்றும் உணர்திறன் துல்லியமான அளவீடுகளைப் பெற உதவுகிறது. சமநிலை நிலையில் ஏற்படும் மாற்றங்களைக் கொண்டு தெரியாத இயற்பியல் மதிப்பை எளிதில் கணக்கிடலாம். நவீன மின்னணு மற்றும் தகவல் தொடர்பு சாதனங்களில் இக்கருவி பரவலாகப் பயன்படுகிறது.`
        },
        {
          slideNumber: 4,
          title: 'பொதுத்தேர்வு முக்கியக் குறிப்புகள்',
          visualType: 'formula_board',
          equation: matchedTopic.keyFormulas.join('  |  '),
          bulletPoints: [
            '5-மதிப்பெண் வினாக்களுக்கான முழுமையான படிநிலைகள்',
            'SI அலகுகள் மற்றும் திசைக் குறியீட்டு மரபு',
            'சிறப்பு நேர்வுகள் மற்றும் வரம்புகள்'
          ],
          narration: `பொதுத்தேர்வில் 5-மதிப்பெண் வினாக்களுக்குப் படம் வரைந்து படிப்படியாகச் சமன்பாடுகளை எழுதுவது அவசியம். சிறப்பு நேர்வுகளில் கோணம் சுழி அல்லது தொண்ணூறு டிகிரி எனும்போது சமன்பாடு எளிமைப்படுத்தப்படுகிறது. கணக்கீடுகளில் தசம இலக்கங்களையும் SI அலகுகளையும் தவறாமல் குறிப்பிட வேண்டும். இக்கருத்துகளைத் தெளிவாகப் பயிற்சி செய்தால் முழு மதிப்பெண்கள் பெறலாம்.`
        }
      ],
      quickCheckQuestion: {
        prompt: `${matchedTopic.tamilTitle} தொடர்பான சரியான அடிப்படைச் சமன்பாடு எது?`,
        options: [
          primaryFormula,
          'E = mc² (நிறை-ஆற்றல் சமன்பாடு)',
          'PV = nRT (நல்லியல்பு வாயு விதி)',
          'F = G m₁m₂ / r² (ஈர்ப்பு விதி)'
        ],
        correctIndex: 0,
        explanation: `சமச்சீர் கல்வி 12-ஆம் வகுப்பு அலகு ${matchedUnit.number} படி, ${primaryFormula} என்பதே இத்தலைப்பின் சரியான அடிப்படைச் சமன்பாடாகும்.`
      }
    };
  }

  // English screen content + narration in the selected Indian language
  const narrationByLang: Record<LangCode, [string, string, string, string]> = {
    en: [
      `In Tamil Nadu Class 12 Unit ${matchedUnit.number} ${matchedUnit.title}, ${matchedTopic.title} establishes the core physical law governing field and energy interactions. Every physical quantity is defined strictly in SI units with clear vector direction. These foundational principles connect microscopic particle behavior to macroscopic laboratory measurements. Understanding the boundary conditions prepares you directly for HSC board numericals.`,
      `Starting from the governing physical law, we derive the primary relation ${primaryFormula} step by step. Applying symmetry and standard boundary conditions yields ${secondaryFormula} for practical systems. Notice how the dependent variable scales directly with source strength and inversely with distance or impedance. Always verify dimensional consistency before substituting numerical values.`,
      `Consider the laboratory hardware and apparatus built directly upon ${matchedTopic.title} for precision measurement. The core assembly balances internal sensitivity against external field interference to achieve accurate readings. During operation, energy transfer across the hardware components follows conservation laws without loss. Modern engineering instruments rely on this exact device architecture.`,
      `For the Tamil Nadu HSC 5-mark public examination, always draw a neat labeled diagram before writing the derivation. Pay special attention to limiting cases where angles equal zero or ninety degrees. Avoid sign convention errors by marking reference directions clearly on your answer sheet. Mastering these four divisions guarantees full marks on this topic.`
    ],
    ta: [
      `தமிழ்நாடு சமச்சீர் கல்வி 12-ஆம் வகுப்பு அலகு ${matchedUnit.number} ${matchedUnit.tamilTitle} பாடத்தில், ${matchedTopic.tamilTitle} என்ற தலைப்பு அடிப்படை இயற்பியல் விதிகளைத் தெளிவாக விளக்குகிறது. ஒவ்வொரு இயற்பியல் அளவும் SI அலகுகளிலும் துல்லியமான வெக்டர் திசையிலும் வரையறுக்கப்படுகிறது. இக்கோட்பாடுகள் நுண்ணிய துகள்களின் இயக்கத்தை ஆய்வக அளவீடுகளுடன் இணைக்கின்றன. எல்லை நிபந்தனைகளைப் புரிந்துகொள்வது பொதுத்தேர்வு கணக்குகளுக்கு நேரடியாக உதவும்.`,
      `அடிப்படை இயற்பியல் விதியிலிருந்து தொடங்கி, ${primaryFormula} என்ற முக்கிய சமன்பாட்டை படிப்படியாக வருவிப்போம். சமச்சீர் தன்மை மற்றும் நிலையான எல்லை நிபந்தனைகளைப் பயன்படுத்தும்போது ${secondaryFormula} என்ற தொடர்பு கிடைக்கிறது. சார்ந்த மாறி எவ்வாறு மூல வலிமைக்கு நேர்த்தகவிலும் தொலைவுக்கு எதிர்த்தகவிலும் மாறுகிறது என்பதைக் கவனியுங்கள். எண் மதிப்புகளைப் பிரதியிடும் முன் பரிமாணச் சமநிலையை எப்போதும் சரிபார்க்கவும்.`,
      `இப்போது ${matchedTopic.tamilTitle} தத்துவத்தின் அடிப்படையில் செயல்படும் ஆய்வகக் கருவி மற்றும் சாதன அமைப்பைப் பார்ப்போம். வெளிப்புற புல இடையூறுகளைக் குறைத்து துல்லியமான அளவீடுகளைப் பெறுமாறு இக்கருவி வடிவமைக்கப்பட்டுள்ளது. செயல்பாட்டின் போது ஆற்றல் மாற்றம் ஆற்றல் அழிவின்மை விதிக்கு உட்பட்டு இழப்பின்றி நடைபெறுகிறது. நவீன பொறியியல் கருவிகள் இதே அமைப்பையே பயன்படுத்துகின்றன.`,
      `தமிழ்நாடு மேல்நிலை இரண்டாம் ஆண்டு பொதுத்தேர்வில் 5 மதிப்பெண் வினாக்களுக்கு விடையளிக்கும்போது, வருவித்தலுக்கு முன் தெளிவான பாகங்கள் குறிக்கப்பட்ட படத்தை வரையவும். கோணம் பூஜ்ஜியம் அல்லது தொண்ணூறு டிகிரியாக இருக்கும் சிறப்பு நிலைகளில் கூடுதல் கவனம் செலுத்துங்கள். குறியீட்டு மரபு பிழைகளைத் தவிர்க்க திசைகளை விடைத்தாளில் தெளிவாகக் குறிக்கவும். இந்த நான்கு பகுதிகளையும் நன்கு பயின்றால் முழு மதிப்பெண்கள் நிச்சயம்.`
    ],
    hi: [
      `तमिलनाडु कक्षा 12 इकाई ${matchedUnit.number} ${matchedUnit.title} में ${matchedTopic.title} भौतिक नियमों की मुख्य नींव स्थापित करता है। प्रत्येक भौतिक राशि को SI मात्रकों और स्पष्ट सदिश दिशा में परिभाषित किया गया है। ये सिद्धांत सूक्ष्म कणों के व्यवहार को प्रयोगशाला मापन से जोड़ते हैं। सीमा शर्तों को समझना बोर्ड परीक्षा के प्रश्नों के लिए अत्यंत आवश्यक है।`,
      `मूल भौतिक नियम से प्रारंभ करके हम चरणबद्ध तरीके से मुख्य समीकरण ${primaryFormula} व्युत्पन्न करते हैं। सममिति और मानक शर्तें लागू करने पर व्यावहारिक प्रणालियों के लिए ${secondaryFormula} प्राप्त होता है। यहाँ स्रोत की तीव्रता और दूरी के बीच का सीधा संबंध स्पष्ट दिखाई देता है। संख्यात्मक मान रखने से पहले विमीय शुद्धता की जाँच अवश्य करें।`,
      `अब ${matchedTopic.title} पर आधारित प्रयोगशाला हार्डवेयर और उपकरण की संरचना पर ध्यान दें। यह उपकरण बाहरी हस्तक्षेप को कम करके सटीक मापन सुनिश्चित करता है। संचालन के दौरान उपकरण के घटकों में ऊर्जा संरक्षण के नियम का पूर्ण पालन होता है। आधुनिक वैज्ञानिक यंत्र इसी संरचना पर कार्य करते हैं।`,
      `बोर्ड परीक्षा में पांच अंक के प्रश्नों के लिए निगमन से पहले स्वच्छ नामांकित चित्र अवश्य बनाएं। शून्य और नब्बे डिग्री की विशेष स्थितियों पर विशेष ध्यान दें। उत्तर पुस्तिका में चिह्न परिपाटी और SI मात्रकों को स्पष्ट रूप से लिखें। इन चारों भागों का अभ्यास आपको पूरे अंक दिलाएगा।`
    ],
    ml: [
      `തമിഴ്നാട് ക്ലാസ് 12 യൂണിറ്റ് ${matchedUnit.number} ${matchedUnit.title} എന്ന പാഠഭാഗത്ത് ${matchedTopic.title} അടിസ്ഥാന ഭൗതിക നിയമം വ്യക്തമാക്കുന്നു. എല്ലാ ഭൗതിക അളവുകളും SI യൂണിറ്റുകളിലും കൃത്യമായ ദിശയിലുമാണ് നിർവചിച്ചിരിക്കുന്നത്. സൂക്ഷ്മകണങ്ങളുടെ സ്വഭാവത്തെ പരീക്ഷണശാലാ അളവുകളുമായി ഈ തത്വം ബന്ധിപ്പിക്കുന്നു. ബോർഡ് പരീക്ഷാ ചോദ്യങ്ങൾക്ക് ഈ ആശയങ്ങൾ അത്യന്താപേക്ഷിതമാണ്.`,
      `അടിസ്ഥാന നിയമത്തിൽ നിന്ന് ആരംഭിച്ചു നാം ${primaryFormula} എന്ന പ്രധാന സമവാക്യം ഘട്ടം ഘട്ടമായി രൂപീകരിക്കുന്നു. സമമിതിയും വ്യവസ്ഥകളും പ്രയോഗിക്കുമ്പോൾ ${secondaryFormula} എന്ന കൃത്യമായ ബന്ധം ലഭിക്കുന്നു. ഉറവിടത്തിന്റെ ശക്തിയും ദൂരവും തമ്മിലുള്ള അനുപാതം ഇവിടെ വ്യക്തമാണ്. സംഖ്യകൾ നൽകുന്നതിന് മുമ്പ് യൂണിറ്റുകളുടെ കൃത്യത പരിശോധിക്കുക.`,
      `${matchedTopic.title} എന്ന തത്വത്തിൽ പ്രവർത്തിക്കുന്ന ഹാർഡ്‌വെയർ ഉപകരണത്തിന്റെ ഘടന ഇപ്പോൾ പരിശോധിക്കാം. ബാഹ്യ തടസ്സങ്ങൾ ഒഴിവാക്കി കൃത്യമായ അളവുകൾ നൽകാൻ ഈ ഉപകരണം സഹായിക്കുന്നു. പ്രവർത്തന സമയത്ത് ഉപകരണത്തിലെ ഊർജ്ജ കൈമാറ്റം സംരക്ഷണ നിയമങ്ങൾ പാലിക്കുന്നു. ആധുനിക ശാസ്ത്ര ഉപകരണങ്ങൾ ഈ രൂപകൽപ്പനയാണ് ഉപയോഗിക്കുന്നത്.`,
      `പൊതുപരീക്ഷയിൽ അഞ്ച് മാർക്ക് ചോദ്യങ്ങൾക്ക് വ്യക്തമായ ചിത്രം വരച്ച ശേഷം സമവാക്യങ്ങൾ എഴുതുക. പൂജ്യം ഡിഗ്രി, തൊണ്ണൂറ് ഡിഗ്രി എന്നീ പ്രത്യേക സാഹചര്യങ്ങൾ പ്രത്യേകം ശ്രദ്ധിക്കുക. ഉത്തരക്കടലാസിൽ SI യൂണിറ്റുകളും ചിഹ്നങ്ങളും കൃത്യമായി രേഖപ്പെടുത്തുക. ഈ നാല് ഭാഗങ്ങളും നന്നായി പഠിച്ചാൽ മുഴുവൻ മാർക്കും നേടാം.`
    ],
    te: [
      `తమిళనాడు క్లాస్ 12 యూనిట్ ${matchedUnit.number} ${matchedUnit.title} లో ${matchedTopic.title} ప్రాథమిక భౌతిక సూత్రాన్ని వివరిస్తుంది. ప్రతి భౌతిక రాశిని SI ప్రమాణాలు మరియు స్పష్టమైన దిశలో నిర్వచించారు. ఈ సూత్రాలు సూక్ష్మ కణాల ప్రవర్తనను ప్రయోగశాల కొలతలతో అనుసంధానిస్తాయి. బోర్డు పరీక్షల ప్రశ్నలకు ఈ భావనలు ఎంతో కీలకం.`,
      `ప్రాథమిక నియమం నుండి ప్రారంభించి మనం ${primaryFormula} సమీకరణాన్ని దశలవారీగా రాబడతాము. సౌష్టవం మరియు నిబంధనలను వర్తింపజేసినప్పుడు ${secondaryFormula} అనే ఖచ్చితమైన సంబంధం లభిస్తుంది. మూల బలం మరియు దూరం మధ్య గల అనుపాతం ఇక్కడ స్పష్టంగా కనిపిస్తుంది. గణనలకు ముందు ప్రమాణాల ఖచ్చితత్వాన్ని సరిచూసుకోండి.`,
      `${matchedTopic.title} సూత్రంపై ఆధారపడి పనిచేసే హార్డ్‌వేర్ పరికరం నిర్మాణాన్ని ఇప్పుడు పరిశీలిద్దాం. బాహ్య అంతరాయాలను తగ్గించి ఖచ్చితమైన రీడింగ్‌లను ఇవ్వడానికి ఈ పరికరం రూపొందించబడింది. పనిచేసేటప్పుడు పరికరంలోని భాగాలు శక్తి నిత్యత్వ నియమాన్ని పాటిస్తాయి. ఆధునిక ఇంజనీరింగ్ పరికరాలు ఇదే నిర్మాణాన్ని ఉపయోగిస్తాయి.`,
      `పబ్లిక్ పరీక్షలో ఐదు మార్కుల ప్రశ్నలకు ముందుగా చక్కని పటం గీసి ఉత్పాదన రాయండి. సున్నా మరియు తొంభై డిగ్రీల ప్రత్యేక సందర్భాలను తప్పక వివరించండి. సమాధాన పత్రంలో SI ప్రమాణాలు మరియు గుర్తులను స్పష్టంగా రాయండి. ఈ నాలుగు విభాగాలను సాధన చేస్తే పూర్తి మార్కులు సాధించవచ్చు.`
    ],
    kn: [
      `ತಮಿಳುನಾಡು ಕ್ಲಾಸ್ 12 ಘಟಕ ${matchedUnit.number} ${matchedUnit.title} ರಲ್ಲಿ ${matchedTopic.title} ಮೂಲಭೂತ ಭೌತಶಾಸ್ತ್ರ ನಿಯಮವನ್ನು ಸ್ಥಾಪಿಸುತ್ತದೆ. ಪ್ರತಿಯೊಂದು ಭೌತಿಕ ಪರಿಮಾಣವನ್ನು SI ಏಕಮಾನಗಳು ಮತ್ತು ಸ್ಪಷ್ಟ ದಿಕ್ಕಿನಲ್ಲಿ ವ್ಯಾಖ್ಯಾನಿಸಲಾಗಿದೆ. ಈ ತತ್ವಗಳು ಸೂಕ್ಷ್ಮ ಕಣಗಳ ವರ್ತನೆಯನ್ನು ಪ್ರಯೋಗಾಲಯದ ಅಳತೆಗಳೊಂದಿಗೆ ಜೋಡಿಸುತ್ತವೆ. ಬೋರ್ಡ್ ಪರೀಕ್ಷೆಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಈ ಪರಿಕಲ್ಪನೆಗಳು ಅತ್ಯಗತ್ಯ.`,
      `ಮೂಲ ನಿಯಮದಿಂದ ಪ್ರಾರಂಭಿಸಿ ನಾವು ${primaryFormula} ಸಮೀಕರಣವನ್ನು ಹಂತ ಹಂತವಾಗಿ ಪಡೆಯುತ್ತೇವೆ. ಸಮ್ಮಿತಿ ಮತ್ತು ನಿಯಮಗಳನ್ನು ಅನ್ವಯಿಸಿದಾಗ ${secondaryFormula} ಎಂಬ ನಿಖರ ಸಂಬಂಧ ದೊರೆಯುತ್ತದೆ. ಮೂಲದ ಶಕ್ತಿ ಮತ್ತು ದೂರದ ನಡುವಿನ ಅನುಪಾತ ಇಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿದೆ. ಲೆಕ್ಕಾಚಾರದ ಮೊದಲು ಏಕಮಾನಗಳ ನಿಖರತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.`,
      `${matchedTopic.title} ತತ್ವದ ಮೇಲೆ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಹಾರ್ಡ್‌ವೇರ್ ಉಪಕರಣದ ರಚನೆಯನ್ನು ಈಗ ನೋಡೋಣ. ಬಾಹ್ಯ ಅಡಚಣೆಗಳನ್ನು ತಪ್ಪಿಸಿ ನಿಖರವಾದ ಅಳತೆಗಳನ್ನು ನೀಡಲು ಈ ಉಪಕರಣ ಸಹಾಯ ಮಾಡುತ್ತದೆ. ಕಾರ್ಯಾಚರಣೆಯ ಸಮಯದಲ್ಲಿ ಉಪಕರಣದ ಭಾಗಗಳು ಶಕ್ತಿ ಸಂರಕ್ಷಣಾ ನಿಯಮವನ್ನು ಪಾಲಿಸುತ್ತವೆ. ಆಧುನಿಕ ವೈಜ್ಞಾನಿಕ ಉಪಕರಣಗಳು ಇದೇ ವಿನ್ಯಾಸವನ್ನು ಬಳಸುತ್ತವೆ.`,
      `ಪಬ್ಲಿಕ್ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಐದು ಅಂಕಗಳ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮೊದಲು ಅಂದವಾದ ಚಿತ್ರ ಬರೆದು ಸಮೀಕರಣಗಳನ್ನು ಬರೆಯಿರಿ. ಸೊನ್ನೆ ಮತ್ತು ತೊಂಬತ್ತು ಡಿಗ್ರಿಗಳ ವಿಶೇಷ ಸಂದರ್ಭಗಳನ್ನು ಗಮನಿಸಿ. ಉತ್ತರ ಪತ್ರಿಕೆಯಲ್ಲಿ SI ಏಕಮಾನಗಳು ಮತ್ತು ಚಿಹ್ನೆಗಳನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ನಮೂದಿಸಿ. ಈ ನಾಲ್ಕು ವಿಭಾಗಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿದರೆ ಪೂರ್ಣ ಅಂಕಗಳನ್ನು ಪಡೆಯಬಹುದು.`
    ]
  };

  const chosenNarration = narrationByLang[langConfig.code] || narrationByLang.en;

  return {
    lessonTitle: `Unit ${matchedUnit.number}: ${matchedTopic.title}`,
    topicSummary: matchedTopic.description,
    slides: [
      {
        slideNumber: 1,
        title: 'Core Concept & Physical Definition',
        visualType: 'field_lines',
        equation: primaryFormula,
        bulletPoints: matchedTopic.subTopics.slice(0, 3),
        narration: chosenNarration[0]
      },
      {
        slideNumber: 2,
        title: 'Mathematical Derivation & Governing Laws',
        visualType: 'ac_wave',
        equation: secondaryFormula,
        bulletPoints: matchedTopic.keyFormulas,
        narration: chosenNarration[1]
      },
      {
        slideNumber: 3,
        title: 'Hardware Apparatus & Device Application',
        visualType: 'ray_optics',
        equation: primaryFormula,
        bulletPoints: [
          `Hardware Apparatus: ${matchedTopic.title} Setup`,
          'Precision Calibration & Null/Peak Detection',
          'Practical Engineering & Laboratory Applications'
        ],
        narration: chosenNarration[2]
      },
      {
        slideNumber: 4,
        title: 'HSC Board Exam Takeaways & Special Cases',
        visualType: 'formula_board',
        equation: matchedTopic.keyFormulas.join('  |  '),
        bulletPoints: [
          '5-Mark Derivation Step-by-Step Structure',
          'SI Units, Vector Direction & Sign Convention',
          'Limiting Angle Cases (0° and 90°)'
        ],
        narration: chosenNarration[3]
      }
    ],
    quickCheckQuestion: {
      prompt: `Which fundamental relation governs ${matchedTopic.title} (TN Class 12 Unit ${matchedUnit.number})?`,
      options: [
        primaryFormula,
        'E = mc² (Mass-Energy Equivalence)',
        'PV = nRT (Ideal Gas Equation)',
        'F = G m₁m₂ / r² (Universal Gravitation)'
      ],
      correctIndex: 0,
      explanation: `According to TN State Board Samacheer Kalvi Class 12 Unit ${matchedUnit.number}, ${primaryFormula} is the governing formula for ${matchedTopic.title}.`
    }
  };
}

// ============================================================================
// AI PHYSICS LESSON STUDIO COMPONENT (NARRATION-DRIVEN 2-POINT VISUALS)
// ============================================================================

interface LessonSlide {
  slideNumber: number;
  title: string;
  visualType: 'field_lines' | 'ac_wave' | 'ray_optics' | 'quantum_orbit' | 'formula_board';
  equation: string;
  bulletPoints: string[];
  narration: string;
}

interface GeneratedLesson {
  lessonTitle: string;
  topicSummary: string;
  slides: LessonSlide[];
  quickCheckQuestion: {
    prompt: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

const AiPhysicsStudio: React.FC<{
  initialTopic?: string;
  language: LangCode;
}> = ({ initialTopic, language }) => {
  const isTamilMode = language === 'ta';
  const langConfig = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const ui = getUiStrings(language);

  const [promptTopic, setPromptTopic] = useState(
    initialTopic || 'TN Class 12 Unit 4: Series RLC Resonance, Power Factor & Transformer'
  );
  const [difficultyLevel, setDifficultyLevel] = useState<'Foundation' | 'Intermediate' | 'Exam Mastery'>('Intermediate');
  const [visualTheme, setVisualTheme] = useState<'phys_dark' | 'chalkboard' | 'blueprint'>('phys_dark');

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [slideProgress, setSlideProgress] = useState(0);
  const [spokenCharRatio, setSpokenCharRatio] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioBuffers, setAudioBuffers] = useState<Record<string, AudioBuffer>>({});

  const [quizChoice, setQuizChoice] = useState<number | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const audioFinishedRef = useRef<boolean>(false);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechKeepAliveRef = useRef<number | null>(null);
  const playbackSessionIdRef = useRef<number>(0);
  const lockedWebVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const unlockedAudioCtxRef = useRef<AudioContext | null>(null);
  const activeWebAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const webAudioTimingRef = useRef<{ startTime: number; duration: number } | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const fallbackTimingRef = useRef<{ startMs: number; durationMs: number } | null>(null);
  const audioBufferCacheRef = useRef<Record<string, AudioBuffer>>({});
  const lessonCacheRef = useRef<Record<string, GeneratedLesson>>({});

  const [audioStatusLabel, setAudioStatusLabel] = useState<string>('Ready');

  useEffect(() => {
    if (initialTopic) {
      setPromptTopic(initialTopic);
    }
  }, [initialTopic]);

  const unlockBrowserAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        if (!unlockedAudioCtxRef.current || unlockedAudioCtxRef.current!.state === 'closed') {
          unlockedAudioCtxRef.current = new AudioCtx();
        }
        if (unlockedAudioCtxRef.current.state === 'suspended') {
          unlockedAudioCtxRef.current.resume().catch(() => {});
        }
        const silentBuf = unlockedAudioCtxRef.current.createBuffer(1, 1, 22050);
        const src = unlockedAudioCtxRef.current.createBufferSource();
        src.buffer = silentBuf;
        src.connect(unlockedAudioCtxRef.current.destination);
        src.start(0);
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    } catch {
      // Ignore audio unlock error
    }
  }, []);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    playbackSessionIdRef.current += 1;
    webAudioTimingRef.current = null;
    fallbackTimingRef.current = null;

    if (fallbackTimerRef.current !== null) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    if (speechKeepAliveRef.current !== null) {
      window.clearInterval(speechKeepAliveRef.current);
      speechKeepAliveRef.current = null;
    }
    if (activeWebAudioSourceRef.current) {
      try {
        activeWebAudioSourceRef.current.onended = null;
        activeWebAudioSourceRef.current.stop();
        activeWebAudioSourceRef.current.disconnect();
      } catch {
        // Already stopped
      }
      activeWebAudioSourceRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeUtteranceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // ============================================================================
  // STRICT SENIOR OLD MALE INDIAN VOICE SELECTOR (ZERO AMERICAN ACCENT)
  // ============================================================================
  const selectSeniorOldIndianMaleVoice = useCallback(
    (voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined => {
      const targetBcp = langConfig.bcp47.toLowerCase();
      const targetLangPrefix = langConfig.code.toLowerCase(); void targetLangPrefix;

      const indianMaleKeywords = ['male', 'valluvar', 'mohan', 'midhun', 'madhur', 'hemant', 'ravi', 'prabhat', 'gagan', 'chirag', 'surya', 'kumar', 'arjun', 'vikram', 'karthik', 'suresh', 'rajesh', 'man', 'boy', 'sir', 'professor'];
      const blockedAccentsAndFemaleKeywords = [
        'en-us',
        'en-gb',
        'en-au',
        'en-ca',
        'american',
        'united states',
        'british',
        'uk',
        'heera',
        'swara',
        'neerja',
        'kalpana',
        'pallavi',
        'shruti',
        'female',
        'woman',
        'priya',
        'ananya',
        'lakshmi',
        'veena',
        'lekha',
        'zira',
        'samantha',
        'jenny',
        'aria',
        'guy',
        'davis',
        'mark',
        'david'
      ];

      const isStrictlyIndianMale = (v: SpeechSynthesisVoice) => {
        const name = v.name.toLowerCase();
        const lang = v.lang.toLowerCase();
        if (blockedAccentsAndFemaleKeywords.some((k) => name.includes(k) || lang.includes(k))) {
          return false;
        }
        return true;
      };

      const exactLocaleIndianMale = voices.find(
        (v) =>
          v.lang.toLowerCase() === targetBcp &&
          isStrictlyIndianMale(v) &&
          indianMaleKeywords.some((k) => v.name.toLowerCase().includes(k))
      );
      if (exactLocaleIndianMale) return exactLocaleIndianMale;

      

      const anyIndianLocaleMale = voices.find(
        (v) =>
          (v.lang.toLowerCase().includes('-in') || v.name.toLowerCase().includes('india')) &&
          isStrictlyIndianMale(v) &&
          indianMaleKeywords.some((k) => v.name.toLowerCase().includes(k))
      );
      if (anyIndianLocaleMale) return anyIndianLocaleMale;

      

      return voices.find((v) => v.lang.toLowerCase() === 'en-in' && isStrictlyIndianMale(v)) || voices.find((v) => v.lang.toLowerCase().includes('-in') && isStrictlyIndianMale(v));
    },
    [langConfig.bcp47, langConfig.code]
  );

  useEffect(() => {
    lockedWebVoiceRef.current = null;
  }, [language]);

  const speakSentenceChainFallback = useCallback(
    (fullText: string, sessionId: number, labelSuffix = '') => {
      if (playbackSessionIdRef.current !== sessionId || isMuted) {
        audioFinishedRef.current = true;
        return;
      }

      const wordsList = fullText.trim().split(/\s+/).filter(Boolean);
      const minExpectedDurationMs = Math.max(9500, wordsList.length * 440);

      if (!('speechSynthesis' in window)) {
        fallbackTimingRef.current = { startMs: performance.now(), durationMs: minExpectedDurationMs };
        fallbackTimerRef.current = (window as Window).setTimeout(() => {
          if (playbackSessionIdRef.current === sessionId) {
            audioFinishedRef.current = true;
            fallbackTimingRef.current = null;
          }
        }, minExpectedDurationMs);
        return;
      }

      const rawSentences = fullText
        .split(/(?<=[.!?।,;:])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

      const sentences: string[] = [];
      for (const piece of rawSentences.length > 0 ? rawSentences : [fullText]) {
        if (piece.length <= 110) {
          sentences.push(piece);
        } else {
          const words = piece.split(/\s+/);
          let currentChunk = '';
          for (const w of words) {
            if ((currentChunk + ' ' + w).trim().length > 110 && currentChunk) {
              sentences.push(currentChunk.trim());
              currentChunk = w;
            } else {
              currentChunk = (currentChunk + ' ' + w).trim();
            }
          }
          if (currentChunk) sentences.push(currentChunk);
        }
      }

      fallbackTimingRef.current = { startMs: performance.now(), durationMs: minExpectedDurationMs };

      if (speechKeepAliveRef.current !== null) {
        window.clearInterval(speechKeepAliveRef.current);
      }
      speechKeepAliveRef.current = window.setInterval(() => {
        if (playbackSessionIdRef.current !== sessionId) {
          if (speechKeepAliveRef.current !== null) {
            window.clearInterval(speechKeepAliveRef.current);
            speechKeepAliveRef.current = null;
          }
          return;
        }
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 5000);

      const totalSentences = Math.max(1, sentences.length);

      const speakIndex = (idx: number) => {
        if (playbackSessionIdRef.current !== sessionId || isMuted) return;
        setSpokenCharRatio(Math.min(1, idx / totalSentences));

        if (idx >= sentences.length) {
          setSpokenCharRatio(1);
          const elapsed = performance.now() - (fallbackTimingRef.current?.startMs || performance.now());
          const remaining = Math.max(250, minExpectedDurationMs - elapsed);
          fallbackTimerRef.current = (window as Window).setTimeout(() => {
            if (playbackSessionIdRef.current === sessionId) {
              audioFinishedRef.current = true;
              fallbackTimingRef.current = null;
              setAudioStatusLabel(isTamilMode ? 'பகுதி நிறைவடைந்தது' : 'Division Complete');
            }
          }, remaining);
          if (speechKeepAliveRef.current !== null) {
            window.clearInterval(speechKeepAliveRef.current);
            speechKeepAliveRef.current = null;
          }
          return;
        }

        const chunkText = sentences[idx];
        const utterance = new SpeechSynthesisUtterance(chunkText);
        activeUtteranceRef.current = utterance;

        if (!lockedWebVoiceRef.current) {
          const voices = window.speechSynthesis.getVoices();
          const chosen = selectSeniorOldIndianMaleVoice(voices);
          if (chosen) lockedWebVoiceRef.current = chosen;
        }
        if (lockedWebVoiceRef.current) {
          utterance.voice = lockedWebVoiceRef.current;
        }

        // Force Indian locale & seasoned senior old male Indian professor timbre
        utterance.lang = langConfig.bcp47;
        utterance.pitch = 0.78; // Seasoned senior old male resonance
        utterance.rate = 0.95;  // Deliberate senior Indian professor cadence
        utterance.volume = 1.0;

        let chunkSettled = false;
        const advanceChunk = () => {
          if (chunkSettled) return;
          chunkSettled = true;
          window.clearTimeout(chunkSafetyTimer);
          if (playbackSessionIdRef.current === sessionId) {
            window.setTimeout(() => speakIndex(idx + 1), 100);
          }
        };

        const chunkWords = chunkText.split(/\s+/).filter(Boolean).length;
        const maxChunkMs = Math.max(5000, chunkWords * 650);
        const chunkSafetyTimer = window.setTimeout(advanceChunk, maxChunkMs);

        utterance.onstart = () => {
          if (playbackSessionIdRef.current === sessionId) {
            setSpokenCharRatio(Math.min(0.98, (idx + 0.15) / totalSentences));
            setAudioStatusLabel(
              isTamilMode
                ? `${labelSuffix} • மூத்த இந்திய ஆண் குரல்`
                : `${labelSuffix} • Senior Male Indian Voice`
            );
          }
        };

        utterance.onend = advanceChunk;
        utterance.onerror = advanceChunk;

        utterance.lang = langConfig.bcp47;
        const chosenMale = getBoldMaleIndianVoice(langConfig.bcp47);
        if (chosenMale) utterance.voice = chosenMale;
        utterance.pitch = 0.72;
        utterance.rate = 0.94;
        if (utterance.voice && /male|valluvar|mohan|midhun|madhur|hemant|ravi|prabhat|gagan/i.test(utterance.voice.name) && !/female|pallavi|shruti|sohana|swara|heera|neerja|kalpana|vani|sapna|zira|samantha|jenny|aria/i.test(utterance.voice.name)) {
          window.speechSynthesis.speak(utterance);
        }
      };

      const startChain = () => {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
          window.setTimeout(() => speakIndex(0), 140);
        } else {
          speakIndex(0);
        }
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        startChain();
      } else {
        window.speechSynthesis.addEventListener('voiceschanged', () => startChain(), { once: true });
        window.setTimeout(startChain, 220);
      }
    },
    [isMuted, isTamilMode, langConfig.bcp47, selectSeniorOldIndianMaleVoice]
  );

  const sanitizeTextForTts = useCallback((raw: string): string => {
    return raw
      .replace(/⇒/g, ' implies ')
      .replace(/→/g, ' gives ')
      .replace(/≠/g, ' not equal to ')
      .replace(/≤/g, ' less than or equal to ')
      .replace(/≥/g, ' greater than or equal to ')
      .replace(/∮/g, ' closed integral ')
      .replace(/∑/g, ' sum of ')
      .replace(/√/g, ' square root of ')
      .replace(/ω/g, ' omega ')
      .replace(/λ/g, ' lambda ')
      .replace(/Φ/g, ' flux ')
      .replace(/°/g, ' degree ')
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  const fetchSingleSlideAudioBuffer = useCallback(
    async (textToSpeak: string, lang: LanguageOption): Promise<AudioBuffer | null> => {
      try {
        const cleanLocalText = sanitizeTextForTts(textToSpeak).replace(/\s+/g, ' ').trim();
        if (cleanLocalText) {
          const parts = cleanLocalText.split(/(?<=[.!?।])\s+/).map(s => s.trim()).filter(Boolean);
          const chunks = parts.length > 0 ? parts : [cleanLocalText];
          const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!unlockedAudioCtxRef.current || unlockedAudioCtxRef.current.state === 'closed') {
            unlockedAudioCtxRef.current = new AudioCtx();
          }
          if (unlockedAudioCtxRef.current.state === 'suspended') {
            await unlockedAudioCtxRef.current.resume();
          }
          const ctx = unlockedAudioCtxRef.current!;
          const fetchOne = async (chunk: string, timeoutMs: number): Promise<AudioBuffer | null> => {
            const controller = new AbortController();
            const t = window.setTimeout(() => controller.abort(), timeoutMs);
            try {
              const res = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: chunk, bcp47: lang.bcp47 }),
                signal: controller.signal,
              });
              if (!res.ok) return null;
              const buf = await res.arrayBuffer();
              if (buf.byteLength <= 300) return null;
              return await ctx.decodeAudioData(buf.slice(0));
            } catch {
              return null;
            } finally {
              window.clearTimeout(t);
            }
          };
          // Fetch sentences one-by-one (no burst throttling!) with strict 1.5s per-sentence limit so total load is always < 4.5s
          const validBuffers: AudioBuffer[] = [];
          const startTime = performance.now();
          for (const chunk of chunks) {
            if (performance.now() - startTime > 3800 && validBuffers.length > 0) break;
            const b = await fetchOne(chunk, 1800);
            if (b) validBuffers.push(b);
          }
          if (validBuffers.length > 0) {
            const totalLength = validBuffers.reduce((sum, b) => sum + b.length, 0);
            const combined = ctx.createBuffer(1, totalLength, validBuffers[0].sampleRate);
            const channel = combined.getChannelData(0);
            let offset = 0;
            for (const b of validBuffers) {
              channel.set(b.getChannelData(0), offset);
              offset += b.length;
            }
            return combined;
          }
        }
      } catch (err) {
        console.error('Local Male TTS failed:', err);
      }
      return null;
      try {
        const apiKey = getGeminiApiKey();
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

        // Strictly locked to deep senior male voice 'Charon' across all languages & all 4 divisions
        const singleSeniorMaleVoiceName = 'Charon';
        const ttsCleanText = sanitizeTextForTts(textToSpeak);

        const payload = {
          contents: [
            {
              parts: [
                {
                  text: `${lang.ttsInstruction}\n\nTarget Language & Accent: ${lang.name} (${lang.bcp47}) spoken strictly in a Senior Old Male Indian Professor Voice (Zero American accent). Read every word completely without stopping early:\n${ttsCleanText}`
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: singleSeniorMaleVoiceName }
              }
            }
          },
          model: 'gemini-2.5-flash-preview-tts'
        };

        // Strict 4.5-second max timeout so voice loading never exceeds 5 seconds
        const response = await fetchWithTimeout(
          apiUrl,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          },
          4500
        );

        if (!response.ok) return null;

        const result = await response.json();
        const part = result?.candidates?.[0]?.content?.parts?.[0];
        const audioData = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType;

        if (audioData && mimeType && mimeType.startsWith('audio/')) {
          const rateMatch = mimeType.match(/rate=(\d+)/);
          const sampleRate = rateMatch ? parseInt(rateMatch[1], 10) : 24000;
          const pcmBuffer = base64ToArrayBuffer(audioData);
          const pcm16 = new Int16Array(pcmBuffer);

          const durationSec = pcm16.length / sampleRate;
          if (durationSec < 4.5) {
            return null;
          }

          const AudioCtx =
            window.AudioContext ||
            (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          if (!unlockedAudioCtxRef.current || unlockedAudioCtxRef.current!.state === 'closed') { unlockedAudioCtxRef.current = new AudioCtx(); } const ctx = unlockedAudioCtxRef.current!;

          const audioBuffer = ctx.createBuffer(1, pcm16.length, sampleRate);
          const channelData = audioBuffer.getChannelData(0);
          for (let i = 0; i < pcm16.length; i++) {
            channelData[i] = pcm16[i] / 32768.0;
          }
          return audioBuffer;
        }
        return null;
      } catch {
        return null;
      }
    },
    [sanitizeTextForTts]
  );

  const playDecodedBuffer = useCallback(
    async (buffer: AudioBuffer, sessionId: number, divisionLabel: string) => {
      if (playbackSessionIdRef.current !== sessionId || isMuted) return;

      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!unlockedAudioCtxRef.current || unlockedAudioCtxRef.current!.state === 'closed') { unlockedAudioCtxRef.current = new AudioCtx(); } const ctx = unlockedAudioCtxRef.current!;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      if (playbackSessionIdRef.current !== sessionId || isMuted) return;

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 1.02;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.55;

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      activeWebAudioSourceRef.current = source;
      const effectiveDuration = Math.max(buffer.duration, 5.0);
      webAudioTimingRef.current = {
        startTime: ctx.currentTime,
        duration: effectiveDuration
      };

      setAudioStatusLabel(
        isTamilMode
          ? `${divisionLabel} • மூத்த இந்திய ஆண் குரல்`
          : `${divisionLabel} • Senior Male Indian Voice`
      );

      source.onended = () => {
        if (playbackSessionIdRef.current === sessionId) {
          audioFinishedRef.current = true;
          webAudioTimingRef.current = null;
          setSpokenCharRatio(1);
          setAudioStatusLabel(isTamilMode ? 'பகுதி நிறைவடைந்தது' : 'Division Complete');
        }
      };

      source.start(0);
    },
    [isMuted, isTamilMode]
  );

  const playSlideAudio = useCallback(
    async (
      slideIndex: number,
      textToSpeak?: string,
      preloadedBufferMap?: Record<string, AudioBuffer>
    ) => {
      stopAllAudio();
      audioFinishedRef.current = false;
      setSpokenCharRatio(0);

      if (!textToSpeak || isMuted) {
        audioFinishedRef.current = true;
        setAudioStatusLabel(isMuted ? (isTamilMode ? 'ஒலி நிறுத்தப்பட்டது' : 'Muted') : 'Ready');
        return;
      }

      const sessionId = playbackSessionIdRef.current;
      const divisionLabel = isTamilMode ? `பகுதி ${slideIndex + 1}/4` : `Div ${slideIndex + 1}/4`;
      const cacheKey = `${language}-${slideIndex}-${textToSpeak.slice(0, 32)}`;
      const existingBuffer =
        preloadedBufferMap?.[cacheKey] ||
        audioBufferCacheRef.current[cacheKey] ||
        audioBuffers[cacheKey];

      if (existingBuffer) {
        await playDecodedBuffer(existingBuffer, sessionId, divisionLabel);
        return;
      }

      setIsAudioLoading(true);
      setAudioStatusLabel(
        isTamilMode
          ? `மூத்த இந்திய ஆண் குரல் (${divisionLabel})...`
          : `Loading Senior Male Voice (${divisionLabel})...`
      );
      const fetchedBuffer = await Promise.race([
        fetchSingleSlideAudioBuffer(textToSpeak, langConfig),
        new Promise<null>((resolve) => window.setTimeout(() => resolve(null), 4200))
      ]);
      setIsAudioLoading(false);

      if (playbackSessionIdRef.current !== sessionId || isMuted) return;

      if (fetchedBuffer) {
        audioBufferCacheRef.current[cacheKey] = fetchedBuffer;
        setAudioBuffers((prev) => ({ ...prev, [cacheKey]: fetchedBuffer }));
        await playDecodedBuffer(fetchedBuffer, sessionId, divisionLabel);
      } else {
        speakSentenceChainFallback(textToSpeak, sessionId, divisionLabel);
      }
    },
    [
      audioBuffers,
      fetchSingleSlideAudioBuffer,
      isMuted,
      isTamilMode,
      langConfig,
      language,
      playDecodedBuffer,
      speakSentenceChainFallback,
      stopAllAudio
    ]
  );

  void 0; // @ts-ignore
  const prebufferRemainingDivisions = useCallback(
    async (slides: LessonSlide[], activeLang: LanguageOption) => {
      // Pre-buffer divisions 2, 3, and 4 concurrently in parallel (within 4.5s window)
      await Promise.all(
        slides.slice(1).map(async (slide, offsetIdx) => {
          const idx = offsetIdx + 1;
          if (!slide?.narration) return;
          const cacheKey = `${activeLang.code}-${idx}-${slide.narration.slice(0, 32)}`;
          if (audioBufferCacheRef.current[cacheKey]) return;

          const buf = await fetchSingleSlideAudioBuffer(slide.narration, activeLang);
          if (buf) {
            audioBufferCacheRef.current[cacheKey] = buf;
            setAudioBuffers((prev) => ({ ...prev, [cacheKey]: buf }));
          }
        })
      );
    },
    [fetchSingleSlideAudioBuffer]
  );

  const handleGenerateLesson = async () => {
    if (!promptTopic.trim()) return;

    unlockBrowserAudio();

    const normalizedTopic = promptTopic.trim();
    const lessonCacheKey = `${language}-${difficultyLevel}-${normalizedTopic.toLowerCase()}`;

    setErrorMsg(null);
    setQuizChoice(null);
    stopAllAudio();

    const cachedLesson = lessonCacheRef.current[lessonCacheKey];
    if (cachedLesson) {
      setLesson(cachedLesson);
      setIsGenerating(false);
      setGenerationStep('');
      setCurrentSlideIdx(0);
      setSlideProgress(0);
      setSpokenCharRatio(0);
      setIsPlaying(true);
      playSlideAudio(0, cachedLesson.slides[0]?.narration);
      // single active stream priority
      return;
    }

    setIsGenerating(true);
    setIsPlaying(false);
    setCurrentSlideIdx(0);
    setSlideProgress(0);
    setSpokenCharRatio(0);

    try {
      setGenerationStep(
        isTamilMode
          ? '4-பகுதி தமிழ் இயற்பியல் வீடியோ பாடம் உருவாக்கப்படுகிறது (அதிகபட்சம் 5 வினாடிகள்)...'
          : `Generating 4-division physics video (max 5s) + ${langConfig.name} Senior Male Voice...`
      );

      const apiKey = getGeminiApiKey();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;

      const languageInstruction = isTamilMode
        ? 'CRITICAL TAMIL-ONLY RULE: Write EVERY SINGLE FIELD (lessonTitle, topicSummary, slide titles, bulletPoints, narration, quickCheckQuestion prompt, options, and explanation) 100% in clear Tamil (தமிழ்) script.'
        : `CRITICAL BILINGUAL RULE: Keep ALL visual on-screen fields (lessonTitle, topicSummary, slide titles, bulletPoints, equation, quickCheckQuestion prompt, options, and explanation) strictly in ENGLISH. Write ONLY the "narration" field of each of the 4 divisions in ${langConfig.name} (${langConfig.nativeName}).`;

      const systemPrompt = `You are a 70-year-old senior Indian male physics professor teaching TN Class 12 (+2) Samacheer Kalvi Physics.
Create a concise 4-division video lesson on "${normalizedTopic}" (${difficultyLevel} level).
RULES:
1. No greetings ("Good morning", "Vanakkam", "Hello"). Start immediately with physics.
2. Division 1: Core Concept; Division 2: Laws & Derivations; Division 3: Hardware/Apparatus & Applications; Division 4: HSC 5-Mark Exam Takeaways.
3. Each division 'narration' MUST be 4 crisp sentences (45-58 words) so Sentences 1-2 drive Scene A and Sentences 3-4 drive Scene B.
4. ${languageInstruction}
5. visualType: one of "field_lines", "ac_wave", "ray_optics", "quantum_orbit", "formula_board".`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Generate a 4-division TN Class 12 Physics video lesson for: "${normalizedTopic}".`
              }
            ]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          thinkingConfig: { thinkingBudget: 0 },
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              lessonTitle: { type: 'STRING' },
              topicSummary: { type: 'STRING' },
              slides: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    slideNumber: { type: 'INTEGER' },
                    title: { type: 'STRING' },
                    visualType: {
                      type: 'STRING',
                      enum: ['field_lines', 'ac_wave', 'ray_optics', 'quantum_orbit', 'formula_board']
                    },
                    equation: { type: 'STRING' },
                    bulletPoints: {
                      type: 'ARRAY',
                      items: { type: 'STRING' }
                    },
                    narration: { type: 'STRING' }
                  },
                  required: ['slideNumber', 'title', 'visualType', 'equation', 'bulletPoints', 'narration']
                }
              },
              quickCheckQuestion: {
                type: 'OBJECT',
                properties: {
                  prompt: { type: 'STRING' },
                  options: {
                    type: 'ARRAY',
                    items: { type: 'STRING' }
                  },
                  correctIndex: { type: 'INTEGER' },
                  explanation: { type: 'STRING' }
                },
                required: ['prompt', 'options', 'correctIndex', 'explanation']
              }
            },
            required: ['lessonTitle', 'topicSummary', 'slides', 'quickCheckQuestion']
          }
        }
      };

      // Strict 4.5-second hard deadline so AI video generation always finishes within 5 seconds max
      const response = await fetchWithTimeout(
        apiUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        },
        4500
      );

      if (!response.ok) {
        throw new Error(`Gemini service returned status ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Empty response received from Gemini.');
      }

      const parsedRaw = JSON.parse(rawText);
      const parsedLesson: GeneratedLesson = {
        lessonTitle: safeText(parsedRaw?.lessonTitle) || normalizedTopic,
        topicSummary: safeText(parsedRaw?.topicSummary),
        slides: Array.isArray(parsedRaw?.slides)
          ? parsedRaw.slides.map((s: Record<string, unknown>, idx: number) => ({
              slideNumber: Number(s?.slideNumber) || idx + 1,
              title: safeText(s?.title) || `Division ${idx + 1}`,
              visualType: [
                'field_lines',
                'ac_wave',
                'ray_optics',
                'quantum_orbit',
                'formula_board'
              ].includes(String(s?.visualType))
                ? (s?.visualType as LessonSlide['visualType'])
                : 'formula_board',
              equation: safeText(s?.equation),
              bulletPoints: Array.isArray(s?.bulletPoints)
                ? s.bulletPoints.map((bp: unknown) => safeText(bp)).filter(Boolean)
                : [],
              narration: safeText(s?.narration) || safeText(s?.title)
            }))
          : [],
        quickCheckQuestion: {
          prompt: safeText(parsedRaw?.quickCheckQuestion?.prompt),
          options: Array.isArray(parsedRaw?.quickCheckQuestion?.options)
            ? parsedRaw.quickCheckQuestion.options.map((o: unknown) => safeText(o))
            : [],
          correctIndex: Number(parsedRaw?.quickCheckQuestion?.correctIndex) || 0,
          explanation: safeText(parsedRaw?.quickCheckQuestion?.explanation)
        }
      };

      lessonCacheRef.current[lessonCacheKey] = parsedLesson;
      setLesson(parsedLesson);
      setIsGenerating(false);
      setGenerationStep('');

      setCurrentSlideIdx(0);
      setSlideProgress(0);
      setSpokenCharRatio(0);
      setIsPlaying(true);
      playSlideAudio(0, parsedLesson.slides[0]?.narration);
      // single active stream priority
    } catch {
      // If network/API exceeds 4.5 seconds, seamlessly deliver the syllabus-accurate 4-division lesson within 5s
      const instantLesson = buildInstantSyllabusLesson(normalizedTopic, isTamilMode, langConfig);
      lessonCacheRef.current[lessonCacheKey] = instantLesson;
      setLesson(instantLesson);
      setIsGenerating(false);
      setGenerationStep('');

      setCurrentSlideIdx(0);
      setSlideProgress(0);
      setSpokenCharRatio(0);
      setIsPlaying(true);
      playSlideAudio(0, instantLesson.slides[0]?.narration);
      // single active stream priority
    }
  };

  useEffect(() => {
    if (!isPlaying || !lesson || currentSlideIdx >= lesson.slides.length - 1) return;
    const nextNarration = lesson.slides[currentSlideIdx + 1]?.narration;
    if (!nextNarration) return;
    const nextKey = `${language}-${currentSlideIdx + 1}-${nextNarration.slice(0, 32)}`;
    if (!audioBufferCacheRef.current[nextKey]) {
      fetchSingleSlideAudioBuffer(nextNarration, langConfig).then((buf) => {
        if (buf) audioBufferCacheRef.current[nextKey] = buf;
      });
    }
  }, [isPlaying, currentSlideIdx, lesson, language, langConfig, fetchSingleSlideAudioBuffer]);

  useEffect(() => {
    if (!isPlaying || !lesson) return;

    const interval = setInterval(() => {
      if (
        webAudioTimingRef.current &&
        unlockedAudioCtxRef.current &&
        webAudioTimingRef.current.duration > 0
      ) {
        const elapsed =
          unlockedAudioCtxRef.current.currentTime - webAudioTimingRef.current.startTime;
        const ratio = Math.min(0.99, Math.max(0, elapsed / webAudioTimingRef.current.duration));
        setSlideProgress(ratio * 100);
        setSpokenCharRatio(ratio);
        return;
      }

      if (!audioFinishedRef.current && fallbackTimingRef.current && fallbackTimingRef.current.durationMs > 0) {
        const elapsedMs = performance.now() - fallbackTimingRef.current.startMs;
        const ratio = Math.min(0.99, Math.max(0, elapsedMs / fallbackTimingRef.current.durationMs));
        setSlideProgress(ratio * 100);
        return;
      }

      if (!audioFinishedRef.current && !isMuted) {
        setSlideProgress((prev) => (prev >= 99 ? 99 : prev + 0.35));
        return;
      }

      setSlideProgress(100);
      setSpokenCharRatio(1);
      if (currentSlideIdx < lesson.slides.length - 1) {
        const nextIdx = currentSlideIdx + 1;
        setCurrentSlideIdx(nextIdx);
        setSlideProgress(0);
        setSpokenCharRatio(0);
        playSlideAudio(nextIdx, lesson.slides[nextIdx]?.narration);
      } else {
        setIsPlaying(false);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, lesson, currentSlideIdx, isMuted, playSlideAudio]);

  const togglePlayPause = () => {
    if (!lesson) return;
    unlockBrowserAudio();
    if (isPlaying) {
      setIsPlaying(false);
      stopAllAudio();
      setAudioStatusLabel(isTamilMode ? 'இடைநிறுத்தப்பட்டது' : 'Paused');
    } else {
      if (slideProgress >= 100 && currentSlideIdx === lesson.slides.length - 1) {
        setCurrentSlideIdx(0);
        setSlideProgress(0);
        setSpokenCharRatio(0);
        playSlideAudio(0, lesson.slides[0]?.narration);
      } else {
        playSlideAudio(currentSlideIdx, lesson.slides[currentSlideIdx]?.narration);
      }
      setIsPlaying(true);
    }
  };

  const handleSelectSlide = (idx: number) => {
    if (!lesson) return;
    unlockBrowserAudio();
    setCurrentSlideIdx(idx);
    setSlideProgress(0);
    setSpokenCharRatio(0);
    stopAllAudio();
    if (isPlaying) {
      playSlideAudio(idx, lesson.slides[idx]?.narration);
    }
  };

  // Pre-warm ONLY Division 1
  useEffect(() => {
    if (!lesson || !lesson.slides?.[0]?.narration) return;
    const txt = lesson.slides[0].narration;
    const cKey = `${language}-0-${txt.slice(0, 32)}`;
    if (!audioBufferCacheRef.current[cKey]) {
      fetchSingleSlideAudioBuffer(txt, langConfig).then((buf) => {
        if (buf) audioBufferCacheRef.current[cKey] = buf;
      });
    }
  }, [lesson, language, langConfig, fetchSingleSlideAudioBuffer]);

  useEffect(() => {
    if (!lesson || !lesson.slides?.[0]?.narration) return;
    const firstNarration = lesson.slides[0].narration;
    const firstKey = `${language}-0-${firstNarration.slice(0, 32)}`;
    if (!audioBufferCacheRef.current[firstKey]) {
      fetchSingleSlideAudioBuffer(firstNarration, langConfig).then((buf) => {
        if (buf) audioBufferCacheRef.current[firstKey] = buf;
      });
    }
  }, [lesson, language, langConfig, fetchSingleSlideAudioBuffer]);

  useEffect(() => {
    if (!lesson) return;
    stopAllAudio();
    const updatedLesson = buildInstantSyllabusLesson(promptTopic || lesson.lessonTitle, language === 'ta', langConfig);
    setLesson(updatedLesson);
    if (isPlaying) {
      window.setTimeout(() => {
        playSlideAudio(currentSlideIdx, updatedLesson.slides[currentSlideIdx]?.narration);
      }, 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  // ============================================================================
  // NARRATION-DRIVEN 2-POINT VISUAL CANVAS RENDERER
  // Visual changes ONLY when narration transitions to the next 2 spoken points
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationTime = 0;

    const render = () => {
      animationTime += 0.035;

      const parent = canvas.parentElement;
      if (parent) {
        const rect = parent.getBoundingClientRect();
        if (canvas.width !== rect.width || canvas.height !== rect.height) {
          canvas.width = rect.width;
          canvas.height = rect.height;
        }
      }

      const w = canvas.width;
      const h = canvas.height;

      const bgMap = {
        phys_dark: '#cbd5e1',
        chalkboard: '#133126',
        blueprint: '#0a2240'
      };
      const gridMap = {
        phys_dark: 'rgba(14, 165, 233, 0.14)',
        chalkboard: 'rgba(2, 132, 199, 0.10)',
        blueprint: 'rgba(56, 189, 248, 0.14)'
      };
      const accentMap = {
        phys_dark: '#0284c7',
        chalkboard: '#fbbf24',
        blueprint: '#38bdf8'
      };

      ctx.fillStyle = bgMap[visualTheme];
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = gridMap[visualTheme];
      ctx.lineWidth = 1;
      const step = 32;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      const currentSlide = lesson?.slides[currentSlideIdx];
      const isCompact = w < 640;
      const vizCenterX = isCompact ? w * 0.5 : w * 0.72;
      const vizCenterY = isCompact ? h * 0.72 : h * 0.50;
      const vizRadius = isCompact ? Math.min(w, h) * 0.21 : Math.min(w * 0.21, h * 0.32);

      if (!currentSlide) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.strokeStyle = accentMap[visualTheme];
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.stroke();

        for (let k = 0; k < 3; k++) {
          ctx.save();
          ctx.rotate(animationTime * 0.7 + (k * Math.PI) / 3);
          ctx.beginPath();
          ctx.ellipse(0, 0, 76, 26, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        ctx.fillStyle = '#0f172a';
        ctx.font = '600 18px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          isTamilMode
            ? 'Avichi PhysNova AI தமிழ் வீடியோ வகுப்பறை தயார்'
            : 'Avichi PhysNova AI Video Studio Ready',
          0,
          -88
        );
        ctx.fillStyle = '#94a3b8';
        ctx.font = '13px Inter, system-ui, sans-serif';
        ctx.fillText(
          isTamilMode
            ? 'ஏதேனும் 12-ஆம் வகுப்பு பாடத்தைத் தேர்ந்தெடுத்து "AI பாடம் உருவாக்கு" அழுத்தவும்'
            : 'Select any Class 12 Physics unit or topic above & click "Generate AI Lesson"',
          0,
          96
        );
        ctx.restore();
      } else {
        // Resolve active 2-point narration pair from real-time speech ratio
        const twoPointPairs = splitNarrationIntoTwoPointPairs(currentSlide.narration);
        const totalPairs = Math.max(1, twoPointPairs.length);
        const effectiveRatio = Math.max(spokenCharRatio, slideProgress / 100);
        const activePairIndex = Math.min(
          totalPairs - 1,
          Math.floor(effectiveRatio * totalPairs)
        );
        const activeSpokenChunk = twoPointPairs[activePairIndex] || currentSlide.narration;

        const cue = classifySpokenSegmentToDiagram(
          activeSpokenChunk,
          lesson?.lessonTitle || promptTopic,
          currentSlide.title,
          activePairIndex
        );

        ctx.fillStyle = accentMap[visualTheme];
        ctx.font = 'bold 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(
          isTamilMode
            ? `பகுதி ${currentSlideIdx + 1} / ${lesson.slides.length}  •  கருத்துகள் ${activePairIndex * 2 + 1}–${activePairIndex * 2 + 2}`
            : `DIVISION ${currentSlideIdx + 1} OF ${lesson.slides.length}  •  ${cue.pointPairLabel.toUpperCase()}`,
          28,
          34
        );

        ctx.fillStyle = '#0f172a';
        ctx.font = `bold ${isCompact ? 17 : 21}px Inter, system-ui, sans-serif`;
        const titleTrimmed =
          currentSlide.title.length > 42 ? currentSlide.title.slice(0, 39) + '...' : currentSlide.title;
        ctx.fillText(titleTrimmed, 28, 62);

        const eqBoxW = isCompact ? w - 56 : w * 0.44;
        ctx.fillStyle = 'rgba(2, 132, 199, 0.10)';
        ctx.beginPath();
        ctx.roundRect(28, 78, eqBoxW, 44, 10);
        ctx.fill();
        ctx.strokeStyle = accentMap[visualTheme];
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#b45309';
        ctx.font = `600 ${isCompact ? 13 : 15}px monospace`;
        ctx.fillText(currentSlide.equation, 42, 105);

        const bullets = currentSlide.bulletPoints || [];
        bullets.forEach((bp, idx) => {
          const threshold = (idx + 1) / (bullets.length + 1);
          const alpha = effectiveRatio >= threshold * 0.65 ? 1 : 0.4;
          ctx.fillStyle = `rgba(15, 23, 42, ${alpha})`;
          ctx.font = `${isCompact ? 12 : 13.5}px Inter, system-ui, sans-serif`;
          const yPos = 148 + idx * 30;
          if (!isCompact || yPos < h * 0.46) {
            const truncated = bp.length > 52 ? bp.slice(0, 49) + '...' : bp;
            ctx.fillText(`•  ${truncated}`, 30, yPos);
          }
        });

        // Draw Schematic Frame & Caption Badge on Right Side
        ctx.save();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.fillStyle = 'rgba(241, 245, 249, 0.90)';
        ctx.lineWidth = 1.2;
        const cardW = vizRadius * 2.45;
        const cardH = vizRadius * 2.25;
        ctx.beginPath();
        ctx.roundRect(vizCenterX - cardW / 2, vizCenterY - cardH / 2, cardW, cardH, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = accentMap[visualTheme];
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          isTamilMode ? cue.captionTa : cue.captionEn,
          vizCenterX,
          vizCenterY - cardH / 2 + 20
        );
        ctx.restore();

        // Render the exact Hardware or Physics Concept Diagram matching the 2 spoken points
        ctx.save();
        ctx.translate(vizCenterX, vizCenterY + 8);
        const scene = cue.scene;

        if (scene === 'hardware_cyclotron') {
          // Two D-shaped hollow electrodes ("Dees") + spiral particle trajectory
          const rDee = vizRadius * 0.78;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(-6, 0, rDee, Math.PI * 0.5, Math.PI * 1.5);
          ctx.closePath();
          ctx.stroke();

          ctx.beginPath();
          ctx.arc(6, 0, rDee, -Math.PI * 0.5, Math.PI * 0.5);
          ctx.closePath();
          ctx.stroke();

          // Spiral path
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let t = 0; t < 28; t += 0.25) {
            const rad = (t / 28) * (rDee * 0.85);
            const ang = t + animationTime * 1.6;
            const px = Math.cos(ang) * rad;
            const py = Math.sin(ang) * rad;
            if (t === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        } else if (scene === 'hardware_transformer') {
          // Laminated iron core + primary & secondary coils
          const cw = vizRadius * 1.25;
          const ch = vizRadius * 1.05;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);
          ctx.strokeRect(-cw / 2 + 16, -ch / 2 + 16, cw - 32, ch - 32);

          // Primary windings (left)
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.5;
          for (let k = -3; k <= 3; k++) {
            ctx.beginPath();
            ctx.ellipse(-cw / 2 + 8, k * 8, 12, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          // Secondary windings (right)
          ctx.strokeStyle = '#34d399';
          for (let k = -4; k <= 4; k++) {
            ctx.beginPath();
            ctx.ellipse(cw / 2 - 8, k * 6.5, 12, 3.5, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (scene === 'hardware_vandegraaff') {
          // Hollow metallic sphere dome + insulating column + moving belt
          const rDome = vizRadius * 0.45;
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, -vizRadius * 0.35, rDome, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(-14, -vizRadius * 0.05, 28, vizRadius * 0.82);

          // Moving positive charges ascending on belt
          ctx.fillStyle = '#f59e0b';
          for (let b = 0; b < 4; b++) {
            const offset = ((animationTime * 22 + b * 14) % (vizRadius * 0.7));
            ctx.beginPath();
            ctx.arc(-5, vizRadius * 0.7 - offset, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (scene === 'hardware_galvanometer') {
          // Permanent horseshoe poles N-S + suspended rectangular coil + pointer needle
          ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 2;
          ctx.fillRect(-vizRadius * 0.85, -vizRadius * 0.4, 24, vizRadius * 0.8);
          ctx.strokeRect(-vizRadius * 0.85, -vizRadius * 0.4, 24, vizRadius * 0.8);

          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.strokeStyle = '#38bdf8';
          ctx.fillRect(vizRadius * 0.85 - 24, -vizRadius * 0.4, 24, vizRadius * 0.8);
          ctx.strokeRect(vizRadius * 0.85 - 24, -vizRadius * 0.4, 24, vizRadius * 0.8);

          // Coil & deflecting pointer
          ctx.strokeStyle = '#fbbf24';
          ctx.strokeRect(-18, -22, 36, 44);
          const defl = Math.sin(animationTime * 1.4) * 0.55;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.sin(defl) * vizRadius * 0.7, -Math.cos(defl) * vizRadius * 0.7);
          ctx.stroke();
        } else if (scene === 'hardware_bridge') {
          // Wheatstone diamond bridge + galvanometer null detector
          const d = vizRadius * 0.68;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -d);
          ctx.lineTo(d, 0);
          ctx.lineTo(0, d);
          ctx.lineTo(-d, 0);
          ctx.closePath();
          ctx.stroke();

          // Center Galvanometer
          ctx.strokeStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(0, -d);
          ctx.lineTo(0, d);
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('G', 0, 4);
        } else if (scene === 'hardware_semiconductor') {
          // PN Junction depletion layer + digital square waveform
          const pw = vizRadius * 0.75;
          const ph = vizRadius * 0.48;
          ctx.strokeStyle = '#fb7185';
          ctx.strokeRect(-pw, -ph - 10, pw - 8, ph);
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(8, -ph - 10, pw - 8, ph);

          // Digital square pulse below
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          const startX = -vizRadius * 0.8;
          const baseY = vizRadius * 0.55;
          for (let s = 0; s < 4; s++) {
            const sx = startX + s * (vizRadius * 0.4);
            const high = (s + Math.floor(animationTime)) % 2 === 0;
            const sy = high ? baseY - 22 : baseY;
            if (s === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
            ctx.lineTo(sx + vizRadius * 0.4, sy);
          }
          ctx.stroke();
        } else if (scene === 'hardware_fiber_optic') {
          // Core-cladding waveguide + total internal reflection zig-zag beam
          const fw = vizRadius * 0.9;
          const fh = vizRadius * 0.36;
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.strokeRect(-fw, -fh, fw * 2, fh * 2);

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(-fw, 0);
          ctx.lineTo(-fw * 0.45, -fh + 4);
          ctx.lineTo(0, fh - 4);
          ctx.lineTo(fw * 0.45, -fh + 4);
          ctx.lineTo(fw, 0);
          ctx.stroke();
        } else if (scene === 'dipole_axis') {
          const sep = vizRadius * 0.45;
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, 0, vizRadius * 0.88, vizRadius * 0.52, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(-sep, 0, 9, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.arc(sep, 0, 9, 0, Math.PI * 2);
          ctx.fill();
        } else if (scene === 'capacitor_plates') {
          const pw = vizRadius * 0.48;
          ctx.strokeStyle = '#fb7185';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(-pw, -vizRadius * 0.55);
          ctx.lineTo(-pw, vizRadius * 0.55);
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(pw, -vizRadius * 0.55);
          ctx.lineTo(pw, vizRadius * 0.55);
          ctx.stroke();

          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5;
          for (let y = -2; y <= 2; y++) {
            const yy = y * (vizRadius * 0.2);
            ctx.beginPath();
            ctx.moveTo(-pw + 8, yy);
            ctx.lineTo(pw - 8, yy);
            ctx.stroke();
          }
        } else if (scene === 'drift_current') {
          const wBox = vizRadius * 0.85;
          const hBox = vizRadius * 0.46;
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.strokeRect(-wBox, -hBox, wBox * 2, hBox * 2);

          ctx.fillStyle = '#38bdf8';
          for (let e = 0; e < 7; e++) {
            const ex = -wBox + 14 + (((e * 28 + animationTime * 28) % (wBox * 2 - 28)));
            const ey = ((e % 3) - 1) * (hBox * 0.5);
            ctx.beginPath();
            ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (scene === 'solenoid_field') {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 2;
          for (let f = -1; f <= 1; f++) {
            ctx.beginPath();
            ctx.moveTo(-vizRadius * 0.85, f * 14);
            ctx.lineTo(vizRadius * 0.85, f * 14);
            ctx.stroke();
          }
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.5;
          for (let c = -3; c <= 3; c++) {
            ctx.beginPath();
            ctx.ellipse(c * (vizRadius * 0.2), 0, 8, vizRadius * 0.48, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        } else if (scene === 'rlc_resonance') {
          ctx.strokeStyle = 'rgba(255,255,255,0.25)';
          ctx.beginPath();
          ctx.moveTo(-vizRadius * 0.85, 0);
          ctx.lineTo(vizRadius * 0.85, 0);
          ctx.stroke();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = -50; i <= 50; i++) {
            const px = (i / 50) * (vizRadius * 0.85);
            const py = -Math.sin((i / 50) * Math.PI * 2 - animationTime * 1.4) * (vizRadius * 0.55);
            if (i === -50) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
        } else if (scene === 'prism_dispersion') {
          const pSize = vizRadius * 0.65;
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -pSize);
          ctx.lineTo(pSize, pSize * 0.8);
          ctx.lineTo(-pSize, pSize * 0.8);
          ctx.closePath();
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-vizRadius * 0.9, 10);
          ctx.lineTo(-pSize * 0.45, 0);
          ctx.stroke();

          ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#a855f7'].forEach((col, cIdx) => {
            ctx.strokeStyle = col;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pSize * 0.45, 0);
            ctx.lineTo(vizRadius * 0.9, -18 + cIdx * 10);
            ctx.stroke();
          });
        } else if (scene === 'interference_fringes') {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-vizRadius * 0.45, -vizRadius * 0.65);
          ctx.lineTo(-vizRadius * 0.45, -18);
          ctx.moveTo(-vizRadius * 0.45, -8);
          ctx.lineTo(-vizRadius * 0.45, 8);
          ctx.moveTo(-vizRadius * 0.45, 18);
          ctx.lineTo(-vizRadius * 0.45, vizRadius * 0.65);
          ctx.stroke();

          for (let b = -3; b <= 3; b++) {
            ctx.fillStyle = b % 2 === 0 ? '#fbbf24' : 'rgba(251, 191, 36, 0.2)';
            ctx.fillRect(vizRadius * 0.55, b * 14 - 5, 10, 10);
          }
        } else if (scene === 'bohr_orbit') {
          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.arc(0, 0, 9, 0, Math.PI * 2);
          ctx.fill();

          [0.45, 0.78].forEach((scale, idx) => {
            const r = vizRadius * scale;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();

            const ang = animationTime * (1.6 - idx * 0.5);
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(Math.cos(ang) * r, Math.sin(ang) * r, 5, 0, Math.PI * 2);
            ctx.fill();
          });
        } else if (scene === 'photoelectric_cell') {
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, vizRadius * 0.65, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(-10, 0, vizRadius * 0.42, Math.PI * 0.65, Math.PI * 1.35);
          ctx.stroke();

          const ex = -vizRadius * 0.35 + ((animationTime * 32) % (vizRadius * 0.75));
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(ex, 0, 4.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const rRing = vizRadius * 0.65;
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.38)';
          ctx.beginPath();
          ctx.arc(0, 0, rRing, 0, Math.PI * 2);
          ctx.stroke();

          for (let a = 0; a < 8; a++) {
            const ang = (a * Math.PI) / 4 + animationTime * 0.2;
            const x1 = Math.cos(ang) * (rRing * 0.45);
            const y1 = Math.sin(ang) * (rRing * 0.45);
            const x2 = Math.cos(ang) * (rRing * 0.95);
            const y2 = Math.sin(ang) * (rRing * 0.95);
            ctx.strokeStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(0, 0, 10, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [lesson, currentSlideIdx, slideProgress, spokenCharRatio, visualTheme, isTamilMode, promptTopic]);

  const activeNarrationPairs = lesson?.slides[currentSlideIdx]
    ? splitNarrationIntoTwoPointPairs(lesson.slides[currentSlideIdx].narration)
    : [];
  const activePairIdx =
    activeNarrationPairs.length > 0
      ? Math.min(
          activeNarrationPairs.length - 1,
          Math.floor(Math.max(spokenCharRatio, slideProgress / 100) * activeNarrationPairs.length)
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col xl:flex-row gap-4 items-stretch xl:items-end">
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-1.5">
              {ui.topicLabel}
            </label>
            <div className="relative">
              <Sparkles className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={promptTopic}
                onChange={(e) => setPromptTopic(e.target.value)}
                placeholder={
                  isTamilMode
                    ? 'எ.கா., 12-ஆம் வகுப்பு அலகு 1.5 காஸ் விதி மற்றும் கோளகக் கூடு...'
                    : 'e.g., TN Class 12 Unit 1.5 Gauss’s Law & Spherical Shell...'
                }
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-200/80 border border-slate-200 dark:border-slate-400 rounded-xl text-sm text-slate-900 dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-1.5">
                {isTamilMode ? 'நிலை' : 'Level'}
              </label>
              <select
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value as 'Foundation' | 'Intermediate' | 'Exam Mastery')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-400 rounded-xl text-sm text-slate-800 dark:text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Foundation">{isTamilMode ? 'அடிப்படை' : 'Foundation'}</option>
                <option value="Intermediate">{isTamilMode ? 'நடுத்தரம்' : 'Intermediate'}</option>
                <option value="Exam Mastery">{isTamilMode ? 'பொதுத்தேர்வு தேர்ச்சி' : 'Public Exam Mastery'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-600 mb-1.5">
                {isTamilMode ? 'பலகை வடிவம்' : 'Board Style'}
              </label>
              <select
                value={visualTheme}
                onChange={(e) => setVisualTheme(e.target.value as 'phys_dark' | 'chalkboard' | 'blueprint')}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-400 rounded-xl text-sm text-slate-800 dark:text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="phys_dark">{isTamilMode ? 'இருண்ட இயற்பியல் பலகை' : 'Physics Dark'}</option>
                <option value="chalkboard">{isTamilMode ? 'கரும்பலகை' : 'Chalkboard'}</option>
                <option value="blueprint">{isTamilMode ? 'வரைபட நீலம்' : 'Blueprint'}</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateLesson}
            disabled={isGenerating || !promptTopic.trim()}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{ui.generatingBtn}</span>
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                <span>{ui.generateBtn}</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-600 font-medium">
            {isTamilMode ? 'அனைத்து 10 அலகுகள் விரைவுத் தேர்வு:' : 'All 10 Units Quick Presets:'}
          </span>
          {(isTamilMode
            ? [
                'அலகு 1: நிலை மின்னியல் (1.1–1.8 அனைத்து தலைப்புகள்)',
                'அலகு 2: மின்னோட்டவியல் (2.1–2.6 அனைத்து தலைப்புகள்)',
                'அலகு 3: காந்தவியல் & மின்னோட்ட விளைவுகள் (3.1–3.11)',
                'அலகு 4: மின்காந்தத் தூண்டல் & AC (4.1–4.7)',
                'அலகு 5: மின்காந்த அலைகள் (5.1–5.3)',
                'அலகு 6: கதிர் ஒளியியல் (6.1–6.8)',
                'அலகு 7: அலை ஒளியியல் (7.1–7.6)',
                'அலகு 8: கதிர்வீச்சு & பொருளின் இரட்டைப் பண்பு (8.1–8.5)',
                'அலகு 9: அணு & அணுக்கரு இயற்பியல் (9.1–9.8)',
                'அலகு 10: மின்னணு சாதனங்கள் & தகவல் தொடர்பு (10.1–10.8)'
              ]
            : [
                'Unit 1: Electrostatics (1.1–1.8 All Topics)',
                'Unit 2: Current Electricity (2.1–2.6 All Topics)',
                'Unit 3: Magnetism & Magnetic Effects (3.1–3.11 All Topics)',
                'Unit 4: EMI & Alternating Current (4.1–4.7 All Topics)',
                'Unit 5: Electromagnetic Waves (5.1–5.3 All Topics)',
                'Unit 6: Ray Optics (6.1–6.8 All Topics)',
                'Unit 7: Wave Optics (7.1–7.6 All Topics)',
                'Unit 8: Dual Nature of Radiation & Matter (8.1–8.5 All Topics)',
                'Unit 9: Atomic & Nuclear Physics (9.1–9.8 All Topics)',
                'Unit 10: Electronic Devices & Communication (10.1–10.8 All Topics)'
              ]
          ).map((preset) => (
            <button
              type="button"
              key={preset}
              onClick={() =>
                setPromptTopic(
                  isTamilMode
                    ? `12-ஆம் வகுப்பு சமச்சீர் கல்வி இயற்பியல் ${preset}`
                    : `TN Class 12 Physics ${preset}`
                )
              }
              className="text-xs px-3 py-1 rounded-full bg-slate-100 hover:bg-amber-50 dark:bg-slate-200 dark:hover:bg-amber-900/40 text-slate-700 dark:text-slate-700 hover:text-amber-600 dark:hover:text-amber-300 transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>

        {isGenerating && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3 text-sm text-amber-700 dark:text-amber-300">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>{safeText(generationStep)}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-center justify-between gap-3 text-sm text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{safeText(errorMsg)}</span>
            </div>
            <button
              type="button"
              onClick={handleGenerateLesson}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 cursor-pointer"
            >
              {isTamilMode ? 'மீண்டும் முயற்சி' : 'Retry'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-200 rounded-2xl overflow-hidden border border-slate-300 shadow-xl">
        <div className="relative w-full h-[380px] sm:h-[440px]">
          <canvas ref={canvasRef} className="w-full h-full block" />

          {lesson && lesson.slides[currentSlideIdx] && (
            <div className="absolute bottom-4 left-4 right-4 bg-slate-100/95 shadow-sm backdrop-blur-md border border-slate-400/70 rounded-xl px-4 py-2.5 text-center space-y-1">
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-amber-400">
                <span>
                  {isTamilMode
                    ? `கருத்துகள் ${activePairIdx * 2 + 1}–${activePairIdx * 2 + 2} (குரலுக்கு ஏற்ப படம் மாறுகிறது)`
                    : `Points ${activePairIdx * 2 + 1}–${activePairIdx * 2 + 2} (Narration-Synced Visual)`}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-medium">
                {activeNarrationPairs[activePairIdx] || lesson.slides[currentSlideIdx].narration}
              </p>
            </div>
          )}
        </div>

        <div className="bg-slate-100 shadow-sm border-t border-slate-300 px-4 py-3 space-y-3">
          {lesson && (
            <div className="grid grid-cols-4 gap-2">
              {lesson.slides.map((s, idx) => {
                let fill = 0;
                if (idx < currentSlideIdx) fill = 100;
                else if (idx === currentSlideIdx) fill = slideProgress;

                return (
                  <button
                    type="button"
                    key={s.slideNumber}
                    onClick={() => handleSelectSlide(idx)}
                    className="group text-left focus:outline-none cursor-pointer"
                  >
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-1">
                      <div
                        className="h-full bg-amber-500 transition-all duration-100"
                        style={{ width: `${fill}%` }}
                      />
                    </div>
                    <p
                      className={`text-[11px] truncate ${
                        idx === currentSlideIdx
                          ? 'text-amber-400 font-semibold'
                          : 'text-slate-600 group-hover:text-slate-800'
                      }`}
                    >
                      {isTamilMode ? `பகுதி ${idx + 1}: ${s.title}` : `Div ${idx + 1}: ${s.title}`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlayPause}
                disabled={!lesson}
                className="p-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white transition-colors cursor-pointer"
                title={isPlaying ? (isTamilMode ? 'இடைநிறுத்து' : 'Pause') : (isTamilMode ? 'இயக்கு' : 'Play')}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => handleSelectSlide(Math.max(0, currentSlideIdx - 1))}
                disabled={!lesson || currentSlideIdx === 0}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-700 disabled:opacity-40 text-slate-800 transition-colors cursor-pointer"
                title={isTamilMode ? 'முந்தைய பகுதி' : 'Previous Division'}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectSlide(Math.min((lesson?.slides.length || 1) - 1, currentSlideIdx + 1))
                }
                disabled={!lesson || currentSlideIdx === (lesson?.slides.length || 1) - 1}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-700 disabled:opacity-40 text-slate-800 transition-colors cursor-pointer"
                title={isTamilMode ? 'அடுத்த பகுதி' : 'Next Division'}
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectSlide(0)}
                disabled={!lesson}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-700 disabled:opacity-40 text-slate-800 transition-colors cursor-pointer"
                title={isTamilMode ? 'மீண்டும் தொடங்கு' : 'Restart Lesson'}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200/80 border border-slate-400 text-[11px] text-slate-700">
                {isAudioLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                ) : (
                  <Mic className={`w-3 h-3 ${isMuted ? 'text-rose-400' : 'text-emerald-400'}`} />
                )}
                <span className="truncate max-w-[180px] sm:max-w-[260px]">
                  {isMuted ? (isTamilMode ? 'ஒலி நிறுத்தப்பட்டது' : 'Audio Muted') : audioStatusLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  unlockBrowserAudio();
                  const nextMute = !isMuted;
                  setIsMuted(nextMute);
                  if (nextMute) {
                    stopAllAudio();
                  } else if (lesson && isPlaying) {
                    playSlideAudio(currentSlideIdx, lesson.slides[currentSlideIdx]?.narration);
                  }
                }}
                className="p-2 rounded-xl bg-slate-200 hover:bg-slate-700 text-slate-800 transition-colors cursor-pointer"
                title={isMuted ? 'Unmute Senior Male Indian Voice' : 'Mute Voice'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {lesson && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-900">{lesson.lessonTitle}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-600">
                  {isTamilMode ? 'AI இயற்பியல் பாடக் குறிப்புகள் (4 பகுதிகள்)' : 'AI Generated Physics Notes (4 Divisions)'}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-700 leading-relaxed">
              {lesson.topicSummary}
            </p>
            <div className="space-y-2 pt-2">
              {lesson.slides.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSlide(idx)}
                  className={`p-3 rounded-xl border text-sm cursor-pointer transition-all ${
                    idx === currentSlideIdx
                      ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                      : 'bg-slate-50 dark:bg-slate-200/80 border-slate-200/70 dark:border-slate-300 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-slate-900">
                    <span>
                      {isTamilMode ? `பகுதி ${idx + 1}. ${s.title}` : `Division ${idx + 1}. ${s.title}`}
                    </span>
                    <code className="text-xs px-2 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-amber-700 dark:text-amber-300">
                      {s.equation}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Brain className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-900">
                    {isTamilMode ? 'பாடப் புரிதல் வினா' : 'Lesson Mastery Check'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-600">
                    {isTamilMode ? 'உங்கள் இயற்பியல் அறிவை உடனடியாகச் சோதிக்கவும்' : 'Test your physics concept immediately'}
                  </p>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-800 dark:text-slate-800">
                {lesson.quickCheckQuestion.prompt}
              </p>

              <div className="space-y-2">
                {lesson.quickCheckQuestion.options.map((opt, idx) => {
                  const isSelected = quizChoice === idx;
                  const isCorrect = idx === lesson.quickCheckQuestion.correctIndex;
                  let btnStyle =
                    'border-slate-200 dark:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-200 text-slate-700 dark:text-slate-700';

                  if (quizChoice !== null) {
                    if (isCorrect) {
                      btnStyle =
                        'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-medium';
                    } else if (isSelected) {
                      btnStyle =
                        'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200';
                    }
                  }

                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setQuizChoice(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {quizChoice !== null && isCorrect && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      {quizChoice !== null && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {quizChoice !== null && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-200/80 border border-slate-200 dark:border-slate-400 text-xs text-slate-600 dark:text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-900">
                  {ui.explanationLabel}:{' '}
                </span>
                {lesson.quickCheckQuestion.explanation}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

function PhysNovaStudioContent() {
  const [language, setLanguage] = useState<LangCode>('en');
  const [activeTab, setActiveTab] = useState<'studio' | 'syllabus' | 'practice' | 'past'>('studio');
  const [selectedVolume, setSelectedVolume] = useState<VolumeFilter>('all');
  const [studioTopic, setStudioTopic] = useState<string | undefined>(undefined);
  const [completedTopics, setCompletedTopics] = useState<Record<string, boolean>>({
    'tn12-p-u1-t1': true
  });

  const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});

  const [expandedSolutions, setExpandedSolutions] = useState<Record<string, boolean>>({});
  const [searchPast, setSearchPast] = useState('');

  const [tutorQuestion, setTutorQuestion] = useState('');
  const [tutorAnswer, setTutorAnswer] = useState<string | null>(null);
  const [isTutorThinking, setIsTutorThinking] = useState(false);

  const isTamilMode = language === 'ta';
  const ui = getUiStrings(language);
  const langConfig = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const launchLessonForTopic = (topicTitle: string) => {
    setStudioTopic(topicTitle);
    setActiveTab('studio');
  };

  const toggleTopicComplete = (id: string) => {
    setCompletedTopics((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredUnits =
    selectedVolume === 'all'
      ? TN_PHYSICS_SYLLABUS
      : TN_PHYSICS_SYLLABUS.filter((u) => u.volume === selectedVolume);
  const totalTopicsCount = TN_PHYSICS_SYLLABUS.reduce((acc, u) => acc + u.topics.length, 0);
  const completedCount = Object.values(completedTopics).filter(Boolean).length;
  const masteryPercentage = Math.round((completedCount / totalTopicsCount) * 100);

  const filteredPractice =
    selectedTopicFilter === 'all'
      ? PRACTICE_QUESTIONS
      : PRACTICE_QUESTIONS.filter((q) => q.topicId === selectedTopicFilter);

  const filteredPastQuestions = PAST_QUESTIONS.filter(
    (pq) =>
      pq.topic.toLowerCase().includes(searchPast.toLowerCase()) ||
      pq.tamilTopic.toLowerCase().includes(searchPast.toLowerCase()) ||
      pq.question.toLowerCase().includes(searchPast.toLowerCase()) ||
      pq.tamilQuestion.toLowerCase().includes(searchPast.toLowerCase()) ||
      pq.year.toString().includes(searchPast)
  );

  const handleAskTutor = async () => {
    if (!tutorQuestion.trim()) return;
    setIsTutorThinking(true);
    setTutorAnswer(null);
    try {
      const apiKey = getGeminiApiKey();
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: tutorQuestion }]
          }
        ],
        systemInstruction: {
          parts: [
            {
              text: isTamilMode
                ? 'You are Avichi PhysNova AI Tutor for Tamil Nadu State Board Class 12 (+2) Samacheer Kalvi Physics. Respond 100% in clear Tamil (தமிழ்) script with step-by-step physical explanations, laws, derivations, and SI numericals.'
                : `You are Avichi PhysNova AI Tutor for Tamil Nadu State Board Class 12 (+2) Samacheer Kalvi Physics. Provide concise, crystal-clear step-by-step physical explanations, laws, derivations, and SI numericals in English (with key explanation summary in ${langConfig.name} if helpful).`
            }
          ]
        }
      };

      const res = await fetchWithTimeout(
        apiUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        },
        4500
      );
      const data = await res.json();
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      setTutorAnswer(
        reply ||
          (isTamilMode
            ? 'விடையை உருவாக்க முடியவில்லை. தயவுசெய்து உங்கள் வினாவை மீண்டும் கேளுங்கள்.'
            : 'Could not generate a response. Please rephrase your physics question.')
      );
    } catch {
      setTutorAnswer(
        isTamilMode
          ? 'இணைய இணைப்புச் சிக்கல். தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
          : 'Connection issue while reaching Gemini AI. Please try again.'
      );
    } finally {
      setIsTutorThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-200 text-slate-900 dark:text-slate-900 font-sans">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-100/95 shadow-sm backdrop-blur-md border-b border-slate-200 dark:border-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-slate-900 shadow-md shadow-amber-500/25">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                  Avichi PhysNova
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                  {ui.appSubtitle}
                </span>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 bg-slate-100 dark:bg-slate-200/80 p-1 rounded-xl overflow-x-auto">
            {[
              { id: 'studio', label: ui.tabStudio, icon: Video },
              { id: 'syllabus', label: ui.tabSyllabus, icon: Layers },
              { id: 'practice', label: ui.tabPractice, icon: Brain },
              { id: 'past', label: ui.tabPast, icon: FileText }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'studio' | 'syllabus' | 'practice' | 'past')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-100 shadow-sm text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-600 hover:text-slate-900 dark:hover:text-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-200 border border-slate-200 dark:border-slate-400 rounded-xl px-2.5 py-1.5">
              <Globe className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LangCode)}
                aria-label="Select Lesson & Senior Male Indian Voice Language"
                className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-800 focus:outline-none cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white dark:bg-slate-100 shadow-sm">
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden xl:flex items-center gap-2.5">
              <div className="text-right">
                <p className="text-[10px] font-medium text-slate-500 dark:text-slate-600">{ui.syllabusMastery}</p>
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {completedCount}/{totalTopicsCount} ({masteryPercentage}%)
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'studio' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-900">{ui.studioHeader}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-600">{ui.studioSub}</p>
              </div>
            </div>

            <AiPhysicsStudio initialTopic={studioTopic} language={language} />
          </div>
        )}

        {activeTab === 'syllabus' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-900">{ui.syllabusHeader}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-600">{ui.syllabusSub}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-100 shadow-sm p-1.5 rounded-2xl border border-slate-200 dark:border-slate-300 shadow-sm">
                {[
                  {
                    vol: 'all' as VolumeFilter,
                    title: ui.allClass12Label,
                    badge: isTamilMode ? `10 அலகுகள் • ${totalTopicsCount} தலைப்புகள்` : `10 Units • ${totalTopicsCount} Topics`
                  },
                  {
                    vol: 'Volume 1' as VolumeFilter,
                    title: ui.volume1Label,
                    badge: isTamilMode ? 'அலகுகள் 1–5' : 'Units 1–5'
                  },
                  {
                    vol: 'Volume 2' as VolumeFilter,
                    title: ui.volume2Label,
                    badge: isTamilMode ? 'அலகுகள் 6–10' : 'Units 6–10'
                  }
                ].map((v) => {
                  const active = selectedVolume === v.vol;
                  return (
                    <button
                      type="button"
                      key={v.vol}
                      onClick={() => setSelectedVolume(v.vol)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        active
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-500/20'
                          : 'text-slate-600 dark:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-200'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>{v.title}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${
                          active
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-700'
                        }`}
                      >
                        {v.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-2xl p-6 shadow-sm space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-300 pb-4">
                    <div className="flex items-start gap-3">
                      <span className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center justify-center shrink-0">
                        {unit.number < 10 ? `0${unit.number}` : unit.number}
                      </span>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-900">
                            {isTamilMode
                              ? `அலகு ${unit.number}: ${unit.tamilTitle}`
                              : `Unit ${unit.number}: ${unit.title}`}
                          </h2>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-orange-50 dark:bg-orange-950/70 text-orange-600 dark:text-orange-300 border border-orange-200/70 dark:border-orange-800">
                            {isTamilMode
                              ? `${unit.tamilVolume} • ${unit.topics.length} தலைப்புகள்`
                              : `${unit.volume} • ${unit.topics.length} Topics`}
                          </span>
                        </div>
                        {!isTamilMode && (
                          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-0.5">
                            {unit.tamilTitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        launchLessonForTopic(
                          isTamilMode
                            ? `12-ஆம் வகுப்பு சமச்சீர் கல்வி இயற்பியல் அலகு ${unit.number}: ${unit.tamilTitle}`
                            : `TN State Board Class 12 Physics (${unit.volume}) Unit ${unit.number}: ${unit.title} (Complete Lesson Overview)`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{ui.fullUnitVideo}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unit.topics.map((topic) => {
                      const isDone = !!completedTopics[topic.id];
                      const activeSubTopics = isTamilMode ? topic.tamilSubTopics : topic.subTopics;
                      return (
                        <div
                          key={topic.id}
                          className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-200/80 border border-slate-200/80 dark:border-slate-300 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                                    {isTamilMode ? `தலைப்பு ${topic.code}` : `Topic ${topic.code}`}
                                  </span>
                                  <span className="text-[11px] text-slate-600">
                                    {isTamilMode
                                      ? `${topic.tamilDifficulty} • ~${topic.estimatedMinutes} நிமிடம்`
                                      : `${topic.difficulty} • ~${topic.estimatedMinutes} min`}
                                  </span>
                                </div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-900 mt-1.5">
                                  {isTamilMode ? topic.tamilTitle : topic.title}
                                </h3>
                                {!isTamilMode && (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                    {topic.tamilTitle}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleTopicComplete(topic.id)}
                                className={`p-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                    : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-amber-500'
                                }`}
                                title={isTamilMode ? 'முடிந்ததாகக் குறி' : 'Mark Topic Complete'}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-xs text-slate-600 dark:text-slate-700 leading-relaxed">
                              {isTamilMode ? topic.tamilDescription : topic.description}
                            </p>

                            <div className="space-y-1.5">
                              {activeSubTopics.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex items-center justify-between gap-2 text-[11px] text-slate-700 dark:text-slate-700 bg-white dark:bg-slate-100/95 shadow-sm px-2.5 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-400/60"
                                >
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                    <span>{sub}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      launchLessonForTopic(
                                        isTamilMode
                                          ? `12-ஆம் வகுப்பு இயற்பியல் அலகு ${unit.number} (${unit.tamilTitle}) - ${sub}`
                                          : `TN Class 12 Physics Unit ${unit.number} (${unit.title}) - ${sub}`
                                      )
                                    }
                                    className="px-2 py-0.5 rounded bg-amber-50 hover:bg-amber-600 dark:bg-amber-950/80 dark:hover:bg-amber-600 text-[10px] text-amber-600 hover:text-white dark:text-amber-300 dark:hover:text-slate-900 font-semibold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                                  >
                                    <Play className="w-2.5 h-2.5" />
                                    <span>{ui.videoBtn}</span>
                                  </button>
                                </div>
                              ))}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                              {topic.keyFormulas.map((f, i) => (
                                <code
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded bg-amber-50/80 dark:bg-slate-200 border border-amber-200/60 dark:border-slate-400 text-amber-700 dark:text-amber-300"
                                >
                                  {f}
                                </code>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2.5 border-t border-slate-200/70 dark:border-slate-300 flex items-center justify-between">
                            <span className="text-[11px] text-slate-500 dark:text-slate-600">
                              {isTamilMode ? `சமச்சீர் கல்வி ${topic.code}` : `Samacheer Kalvi ${topic.code}`}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                launchLessonForTopic(
                                  isTamilMode
                                    ? `12-ஆம் வகுப்பு இயற்பியல் அலகு ${unit.number} (${unit.tamilTitle}) தலைப்பு ${topic.code}: ${topic.tamilTitle}`
                                    : `TN Class 12 Physics Unit ${unit.number} (${unit.title}) Topic ${topic.code}: ${topic.title}`
                                )
                              }
                              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Play className="w-3 h-3" />
                              <span>{ui.watchLesson}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'practice' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-900">{ui.practiceHeader}</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-600">{ui.practiceSub}</p>
                </div>

                <select
                  value={selectedTopicFilter}
                  onChange={(e) => setSelectedTopicFilter(e.target.value)}
                  className="px-3.5 py-2 bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-xl text-sm text-slate-800 dark:text-slate-800 max-w-xs"
                >
                  <option value="all">{ui.allTopicsFilter}</option>
                  {TN_PHYSICS_SYLLABUS.flatMap((u) =>
                    u.topics.map((t) => ({
                      id: t.id,
                      label: `${t.code}: ${isTamilMode ? t.tamilTitle : t.title}`
                    }))
                  ).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                {filteredPractice.map((pq, index) => {
                  const chosen = userAnswers[pq.id];
                  const hasAnswered = chosen !== undefined;
                  const activeOptions = isTamilMode ? pq.tamilOptions : pq.options;

                  return (
                    <div
                      key={pq.id}
                      className="bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-2xl p-6 shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {ui.questionLabel} {index + 1}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-200 text-slate-600 dark:text-slate-600 font-medium">
                          {isTamilMode ? pq.tamilDifficulty : pq.difficulty}
                        </span>
                      </div>

                      <p className="text-base font-medium text-slate-900 dark:text-slate-900">
                        {isTamilMode ? pq.tamilQuestion : pq.question}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeOptions.map((opt, optIdx) => {
                          const isThisSelected = chosen === optIdx;
                          const isThisCorrect = optIdx === pq.correctIndex;

                          let style =
                            'border-slate-200 dark:border-slate-300 hover:border-amber-400 text-slate-700 dark:text-slate-700';
                          if (hasAnswered) {
                            if (isThisCorrect) {
                              style =
                                'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
                            } else if (isThisSelected) {
                              style =
                                'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200';
                            }
                          }

                          return (
                            <button
                              type="button"
                              key={optIdx}
                              onClick={() =>
                                setUserAnswers((prev) => ({ ...prev, [pq.id]: optIdx }))
                              }
                              className={`px-4 py-3 rounded-xl border text-left text-sm transition-all flex items-center justify-between cursor-pointer ${style}`}
                            >
                              <span>{opt}</span>
                              {hasAnswered && isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                              {hasAnswered && isThisSelected && !isThisCorrect && (
                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {hasAnswered && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-200/80 border border-slate-200 dark:border-slate-400 text-sm text-slate-700 dark:text-slate-700">
                          <span className="font-bold text-slate-900 dark:text-slate-900">
                            {ui.explanationLabel}:{' '}
                          </span>
                          {isTamilMode ? pq.tamilExplanation : pq.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-2xl p-6 shadow-sm space-y-4 sticky top-24">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-600 text-white">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-900">{ui.askTutorTitle}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-600">
                      {isTamilMode ? 'தமிழில் படிப்படியான விளக்கம்' : 'Step-by-Step Class 12 Physics Tutor'}
                    </p>
                  </div>
                </div>

                <textarea
                  rows={3}
                  value={tutorQuestion}
                  onChange={(e) => setTutorQuestion(e.target.value)}
                  placeholder={ui.askTutorPlaceholder}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-400 rounded-xl text-sm text-slate-900 dark:text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <button
                  type="button"
                  onClick={handleAskTutor}
                  disabled={isTutorThinking || !tutorQuestion.trim()}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isTutorThinking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{ui.derivingBtn}</span>
                    </>
                  ) : (
                    <span>{ui.solveBtn}</span>
                  )}
                </button>

                {tutorAnswer && (
                  <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/60 text-xs sm:text-sm text-slate-800 dark:text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {tutorAnswer}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'past' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-900">{ui.pastHeader}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-600">{ui.pastSub}</p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchPast}
                  onChange={(e) => setSearchPast(e.target.value)}
                  placeholder={ui.searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredPastQuestions.map((item) => {
                const isOpen = !!expandedSolutions[item.id];
                const activeSteps = isTamilMode ? item.tamilSolutionSteps : item.solutionSteps;
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-100 shadow-sm border border-slate-200 dark:border-slate-300 rounded-2xl p-6 shadow-sm space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-xs font-bold">
                          {item.year}
                        </span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-600">
                          {isTamilMode ? item.tamilPaper : item.paper}
                        </span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-700">
                          {isTamilMode ? item.tamilTopic : item.topic}
                        </span>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800">
                        {isTamilMode ? `[${item.marks} மதிப்பெண்கள்]` : `[${item.marks} Marks]`}
                      </span>
                    </div>

                    <p className="text-base text-slate-900 dark:text-slate-900 leading-relaxed">
                      {isTamilMode ? item.tamilQuestion : item.question}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSolutions((prev) => ({
                            ...prev,
                            [item.id]: !prev[item.id]
                          }))
                        }
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-800 transition-colors cursor-pointer"
                      >
                        {isOpen ? ui.hideSolution : ui.revealSolution}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          launchLessonForTopic(isTamilMode ? item.tamilTopic : item.topic)
                        }
                        className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-xs font-semibold text-amber-600 dark:text-amber-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{ui.generateWalkthrough}</span>
                      </button>
                    </div>

                    {isOpen && (
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-200/80 border border-slate-200 dark:border-slate-400 space-y-2.5">
                        {activeSteps.map((st, idx) => (
                          <p
                            key={idx}
                            className="text-sm text-slate-700 dark:text-slate-700 leading-relaxed"
                          >
                            {st}
                          </p>
                        ))}
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-400">
                          <span className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">
                            {ui.finalAnswerLabel}:{' '}
                          </span>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-900">
                            {isTamilMode ? item.tamilFinalAnswer : item.finalAnswer}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


const INDIAN_LANG_MAP: Record<string, string> = {
  ta: "ta-IN", Tamil: "ta-IN", "ta-IN": "ta-IN",
  te: "te-IN", Telugu: "te-IN", "te-IN": "te-IN",
  ml: "ml-IN", Malayalam: "ml-IN", "ml-IN": "ml-IN",
  hi: "hi-IN", Hindi: "hi-IN", "hi-IN": "hi-IN",
  en: "en-IN", English: "en-IN", "en-IN": "en-IN",
  kn: "kn-IN", Kannada: "kn-IN", "kn-IN": "kn-IN"
};
const getBoldMaleIndianVoice = (lang: string): SpeechSynthesisVoice | null => {
  if (typeof window === "undefined" || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  const target = (INDIAN_LANG_MAP[lang] || lang || "en-IN").toLowerCase();
  const male = ["male", "valluvar", "mohan", "midhun", "madhur", "hemant", "ravi", "prabhat", "chirag", "gagan"];
  const female = ["female", "pallavi", "shruti", "sohana", "swara", "kalpana", "heera", "neerja", "vani", "sapna"];
  const isMale = (v: SpeechSynthesisVoice) => !female.some(f => v.name.toLowerCase().includes(f)) && male.some(m => v.name.toLowerCase().includes(m));
  return (
    voices.find(v => v.lang.toLowerCase() === target && isMale(v)) ||
    voices.find(v => v.lang.toLowerCase() === target && !female.some(f => v.name.toLowerCase().includes(f))) ||
    voices.find(v => v.lang.toLowerCase() === "en-in" && isMale(v)) ||
    voices.find(v => v.lang.toLowerCase().endsWith("-in")) ||
    voices[0] ||
    null
  );
};

export default function App() {
  return (
    <StudioErrorBoundary>
      <PhysNovaStudioContent />
    </StudioErrorBoundary>
  );
}