import { BRAND } from "@/lib/brand";
import {
  pestTypeLabels as sharedPestTypeLabels,
  pestTypeLabelsEnglish as sharedPestTypeLabelsEnglish,
  roleLabels as sharedRoleLabels,
  roleLabelsEnglish as sharedRoleLabelsEnglish,
  statusOptionLabels as sharedStatusOptionLabels,
  statusOptionLabelsEnglish as sharedStatusOptionLabelsEnglish,
} from "@ecopest/shared/constants";

export const pestTypeLabels = sharedPestTypeLabels;
export const pestTypeLabelsEnglish = sharedPestTypeLabelsEnglish;
export const statusOptionLabels = sharedStatusOptionLabels;
export const statusOptionLabelsEnglish = sharedStatusOptionLabelsEnglish;
export const roleLabels = sharedRoleLabels;
export const roleLabelsEnglish = sharedRoleLabelsEnglish;

export const supportedLocales = ["ar", "en"] as const;
export type Locale = (typeof supportedLocales)[number];
export type LocaleDirection = "ltr" | "rtl";

export function getPestTypeLabels(locale: Locale): typeof sharedPestTypeLabels {
  return locale === "en" ? sharedPestTypeLabelsEnglish : sharedPestTypeLabels;
}

export function getStatusOptionLabels(locale: Locale): typeof sharedStatusOptionLabels {
  return locale === "en" ? sharedStatusOptionLabelsEnglish : sharedStatusOptionLabels;
}

export function getRoleLabels(locale: Locale): typeof sharedRoleLabels {
  return locale === "en" ? sharedRoleLabelsEnglish : sharedRoleLabels;
}

export const defaultLocale: Locale = "ar";
export const localeCookieName = "ecopest_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && supportedLocales.includes(value as Locale);
}

export function getLocaleFromValue(value: unknown): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getLocaleDirection(locale: Locale): LocaleDirection {
  return locale === "ar" ? "rtl" : "ltr";
}

const ar = {
  appName: BRAND.name,
  appNameArabic: BRAND.nameArabic,
  appTitle: "إدارة محطات الطعوم",
  brandTagline: BRAND.taglineArabic,
  brand: {
    name: BRAND.name,
    nameArabic: BRAND.nameArabic,
    tagline: BRAND.tagline,
    taglineArabic: BRAND.taglineArabic,
  },
  actions: {
    backToLogin: "العودة لتسجيل الدخول",
    login: "تسجيل الدخول",
    logout: "تسجيل الخروج",
    retry: "إعادة المحاولة",
  },
  auth: {
    email: "البريد الإلكتروني",
    emailPlaceholder: "name@company.com",
    genericLoginError: "بيانات تسجيل الدخول غير صحيحة. تحقق من البريد الإلكتروني وكلمة المرور.",
    inactiveAccount: "تم حظر هذا الحساب من الإدارة. تواصل مع المدير لإعادة التفعيل.",
    invalidEmail: "أدخل بريدًا إلكترونيًا صحيحًا.",
    loginTitle: "تسجيل دخول الفريق",
    loginSubtitle: "استخدم حساب الشركة للمتابعة.",
    missingProfile: "تعذر تسجيل الدخول. تحقق من البيانات وحاول مرة أخرى.",
    password: "كلمة المرور",
    passwordPlaceholder: "••••••••",
    passwordRequired: "كلمة المرور مطلوبة.",
    rateLimited: "تم إيقاف المحاولات مؤقتًا. حاول لاحقًا.",
    sessionExpired: "انتهت الجلسة. سجل الدخول مرة أخرى.",
    signingIn: "جار تسجيل الدخول...",
    logoutError: "تعذر تسجيل الخروج. حاول مرة أخرى.",
    staffClientNoticeLead: "لو حسابك عميل، استخدم ",
    staffClientNoticeLink: "صفحة دخول العملاء",
    staffClientNoticeTrail: ".",
    portalRoleMismatch:
      "هذا الحساب غير مسموح له بالدخول من هذه الصفحة. تم إنهاء الجلسة الحالية، سجل الدخول بالحساب الصحيح.",
  },
  common: {
    language: "اللغة",
    chooseLanguage: "اختيار اللغة",
    languageArabic: "العربية",
    languageEnglish: "الإنجليزية",
  },
  dashboard: {
    managerTitle: "لوحة المدير",
    supervisorTitle: "لوحة المشرف",
    phaseBadge: "المرحلة الأولى",
    protectedRoute: "مسار محمي",
    authReady: "تم تفعيل الدخول الآمن",
    securityReady: "الصلاحيات تعمل حسب الدور",
    placeholderBody: "هذه الصفحة جاهزة للتحقق من الصلاحيات وسيتم استكمال أدواتها في المراحل التالية.",
  },
  insights: {
    title: "تقرير شامل",
    subtitle: "قراءة إدارية كاملة لبيانات التشغيل المتاحة للمدير من المحطات والتقارير والعملاء والفريق والسجل.",
    generate: "توليد التقرير الكامل",
    generating: "جار توليد التقرير...",
    generatedAt: "آخر تحديث",
    fullReport: "التقرير التنفيذي",
    alerts: "تنبيهات",
    recommendations: "إجراءات مقترحة",
    dataCoverage: "نطاق البيانات المقروءة",
    dataQuality: "جودة البيانات",
    unavailable: "تعذر توليد التقرير الآن.",
    sourceGemini: "مدعوم بواسطة Gemini",
    sourceFallback: "تقرير محلي احتياطي",
    missingKey: "المفتاح GEMINI_API_KEY غير مضبوط، لذلك تم عرض تقرير محلي بدل Gemini.",
    dataTruncated: "تم تقليم البيانات",
  },
  errors: {
    accessDenied: "ليست لديك صلاحية للوصول إلى هذه الصفحة.",
    accessDeniedTitle: "وصول غير مصرح",
    accountDisabled: "تم تعطيل حسابك. يرجى التواصل مع المدير لإعادة تفعيله.",
    accountDisabledContact: "إذا كنت تعتقد أن هذا خطأ، تواصل مع دعم الشركة.",
    accountDisabledTitle: "الحساب معطل",
    unexpected: "حدث خطأ غير متوقع. حاول مرة أخرى.",
  },
  scan: {
    title: "مسح رمز المحطة",
    subtitle: "افتح رابط المحطة من رمز QR للانتقال إلى نموذج الفحص.",
    loginCta: "تسجيل دخول الفني",
    phaseNotice: "سيتم تفعيل نموذج الفحص في المرحلة الثالثة.",
    technicianQrOnlyNote:
      "لتسجيل زيارة صحيحة، امسح رمز QR المثبت على المحطة. لا تُعرض محطات «قريبة» عمدًا حتى لا يُفتح تقرير لمحطة بلا مسح.",
  },
  theme: {
    dark: "الوضع الداكن",
    light: "الوضع الفاتح",
  },
  legal: {
    allRightsReserved: "جميع الحقوق محفوظة.",
    copyright: "حقوق النشر",
    privacy: "سياسة الخصوصية",
    terms: "شروط الاستخدام",
  },
  validation: {
    requiredEmail: "البريد الإلكتروني مطلوب.",
  },
  stations: {
    coordinates: "إحداثيات المحطات",
    coordinatesDescription: "عرض إحداثيات GPS للمحطات وفتح الموقع في تطبيق خرائط خارجي عند الحاجة.",
    withCoordinates: "لديها إحداثيات",
    withoutCoordinates: "بدون إحداثيات",
    stationsWithCoords: "المحطات ذات الإحداثيات",
    openInGoogleMaps: "فتح في خرائط Google",
    openLocationInGoogleMaps: "فتح الموقع في خرائط Google",
    googleMapsExternalHint: "يفتح رابطًا خارجيًا في المتصفح أو تطبيق الخرائط على الجهاز.",
    noGpsSaved: "لا توجد إحداثيات GPS",
    coordinatesPageError: "تعذر تحميل صفحة إحداثيات المحطات",
    manualLatLngHint:
      "يمكن إدخال خط العرض والطول يدويًا (مثلًا من تطبيق خرائط على الهاتف) أو تركهما فارغين إن لم تكن الإحداثيات متاحة.",
    managerAddsGpsLater: "يمكن للمدير لاحقًا إضافة إحداثيات GPS من نموذج المحطة عند الحاجة.",
    needsCoordinates: "محطات تحتاج تحديد إحداثيات",
    setCoordinates: "تحديد الإحداثيات",
    details: "التفاصيل",
    emptyCoordinatesStateTitle: "لا توجد محطات بإحداثيات محفوظة",
    emptyCoordinatesStateBody:
      "أضف خط العرض والطول من نموذج المحطة حتى تظهر هنا ويمكن فتحها في خرائط Google.",
    coordinatesTableHint: "انقر «فتح في خرائط Google» للعرض في المتصفح أو التطبيق.",
    stationDetailNoGpsBody:
      "يمكنك إضافتها من «تعديل المحطة» ثم فتح الموقع من هنا في خرائط Google. وصف الموقع النصي الحالي:",
  },
} as const;

const en = {
  appName: BRAND.name,
  appNameArabic: BRAND.nameArabic,
  appTitle: "Bait Station Field Management",
  brandTagline: BRAND.tagline,
  brand: {
    name: BRAND.name,
    nameArabic: BRAND.nameArabic,
    tagline: BRAND.tagline,
    taglineArabic: BRAND.taglineArabic,
  },
  actions: {
    backToLogin: "Back to login",
    login: "Sign in",
    logout: "Sign out",
    retry: "Try again",
  },
  auth: {
    email: "Email",
    emailPlaceholder: "name@company.com",
    genericLoginError: "Invalid sign-in details. Check your email and password.",
    inactiveAccount: "This account has been blocked by an administrator. Contact your manager to reactivate it.",
    invalidEmail: "Enter a valid email address.",
    loginTitle: "Team sign in",
    loginSubtitle: "Use your company account to continue.",
    missingProfile: "Unable to sign in. Check your details and try again.",
    password: "Password",
    passwordPlaceholder: "Password",
    passwordRequired: "Password is required.",
    rateLimited: "Attempts are paused temporarily. Try again later.",
    sessionExpired: "Your session has expired. Sign in again.",
    signingIn: "Signing in...",
    logoutError: "Unable to sign out. Try again.",
    staffClientNoticeLead: "If you have a client account, use the ",
    staffClientNoticeLink: "client sign-in page",
    staffClientNoticeTrail: ".",
    portalRoleMismatch:
      "This account is not allowed to sign in from this page. Your session was ended—sign in with the correct account.",
  },
  common: {
    language: "Language",
    chooseLanguage: "Choose language",
    languageArabic: "Arabic",
    languageEnglish: "English",
  },
  dashboard: {
    managerTitle: "Manager dashboard",
    supervisorTitle: "Supervisor dashboard",
    phaseBadge: "Phase one",
    protectedRoute: "Protected route",
    authReady: "Secure sign-in is active",
    securityReady: "Permissions follow the user role",
    placeholderBody: "This page is ready for permission checks and will receive its tools in the next phases.",
  },
  insights: {
    title: "Full Gemini report",
    subtitle: "A complete manager report from stations, reports, clients, team data, and audit activity.",
    generate: "Generate full report",
    generating: "Generating report...",
    generatedAt: "Last updated",
    fullReport: "Executive report",
    alerts: "Alerts",
    recommendations: "Recommended actions",
    dataCoverage: "Data coverage",
    dataQuality: "Data quality",
    unavailable: "Unable to generate the report right now.",
    sourceGemini: "Powered by Gemini",
    sourceFallback: "Local fallback report",
    missingKey: "GEMINI_API_KEY is not configured, so a local report is shown instead of Gemini.",
    dataTruncated: "Data was truncated",
  },
  errors: {
    accessDenied: "You do not have permission to access this page.",
    accessDeniedTitle: "Unauthorized access",
    accountDisabled: "Your account has been disabled. Please contact the manager to reactivate it.",
    accountDisabledContact: "If you believe this is an error, contact company support.",
    accountDisabledTitle: "Account Disabled",
    unexpected: "An unexpected error occurred. Try again.",
  },
  scan: {
    title: "Scan station code",
    subtitle: "Open the station link from the QR code to continue to the inspection form.",
    loginCta: "Technician sign in",
    phaseNotice: "The inspection form will be enabled in phase three.",
    technicianQrOnlyNote:
      "To record a valid visit, scan the QR code on the station. Nearby station lists are hidden on purpose to avoid reports without a scan.",
  },
  theme: {
    dark: "Dark mode",
    light: "Light mode",
  },
  legal: {
    allRightsReserved: "All rights reserved.",
    copyright: "Copyright",
    privacy: "Privacy Policy",
    terms: "Terms of Use",
  },
  validation: {
    requiredEmail: "Email is required.",
  },
  stations: {
    coordinates: "Station coordinates",
    coordinatesDescription: "View saved GPS coordinates and open a location in an external maps app when needed.",
    withCoordinates: "Has coordinates",
    withoutCoordinates: "Missing coordinates",
    stationsWithCoords: "Stations with coordinates",
    openInGoogleMaps: "Open in Google Maps",
    openLocationInGoogleMaps: "Open location in Google Maps",
    googleMapsExternalHint: "Opens an external link in the browser or your device maps app.",
    noGpsSaved: "No GPS coordinates on file",
    coordinatesPageError: "Unable to load the station coordinates page",
    manualLatLngHint:
      "Enter latitude and longitude manually (for example from a phone maps app) or leave both empty if unavailable.",
    managerAddsGpsLater: "A manager can add GPS coordinates later from the station form when needed.",
    needsCoordinates: "Stations that need coordinates",
    setCoordinates: "Set coordinates",
    details: "Details",
    emptyCoordinatesStateTitle: "No stations with saved coordinates",
    emptyCoordinatesStateBody:
      "Add latitude and longitude from the station form so they appear here and can be opened in Google Maps.",
    coordinatesTableHint: "Use “Open in Google Maps” to view it in the browser or app.",
    stationDetailNoGpsBody:
      "Add them from “Edit station”, then open the location here in Google Maps. Current text location:",
  },
} as const;

export const i18n = {
  ...ar,
  ar,
  en,
} as const;

export type I18nMessages = typeof ar | typeof en;

export function getI18nMessages(locale: Locale): I18nMessages {
  return locale === "en" ? en : ar;
}
