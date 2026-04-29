import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CSSProperties, ReactNode } from "react";

const palette = {
  background: "#f5f8fb",
  border: "#dfe7f0",
  danger: "#dc2626",
  ink: "#17181f",
  muted: "#6b7280",
  primary: "#0f766e",
  primarySoft: "#ccfbf1",
  surface: "#fffbfd",
  warning: "#d97706",
};

type SceneDefinition = {
  body: string;
  duration: number;
  kicker: string;
  start: number;
  title: string;
  visual: "hero" | "access" | "attendance" | "report" | "users" | "client" | "audit";
};

const scenes: SceneDefinition[] = [
  {
    body: "منصة عربية لإدارة محطات الطعوم، الفرق الميدانية، العملاء، والتقارير في دورة واحدة واضحة.",
    duration: 150,
    kicker: "EcoPest إيكوبست",
    start: 0,
    title: "تشغيل ميداني أدق لمحطات الطعوم",
    visual: "hero",
  },
  {
    body: "الفني يفتح المحطة عبر QR أو من المحطات النشطة القريبة من موقعه فقط داخل نطاق 100 متر.",
    duration: 210,
    kicker: "وصول QR + موقع",
    start: 150,
    title: "المحطات الصحيحة تظهر في اللحظة الصحيحة",
    visual: "access",
  },
  {
    body: "تسجيل حضور وانصراف لكل محطة مع GPS ودقة القياس، ولا يمكن إرسال التقرير قبل حضور المحطة نفسها.",
    duration: 210,
    kicker: "حضور لكل محطة",
    start: 360,
    title: "إثبات زيارة واضح قبل أي تقرير",
    visual: "attendance",
  },
  {
    body: "تقارير فحص منظمة، حالات مراجعة، ملاحظات وصور، مع مزامنة من تطبيق الموبايل إلى لوحة الإدارة.",
    duration: 210,
    kicker: "تقارير ومراجعة",
    start: 570,
    title: "التقرير يتحول إلى سجل قابل للمراجعة",
    visual: "report",
  },
  {
    body: "إدارة المستخدمين أصبحت شاشة كثيفة: بحث، فلاتر، جدول، تعديل مباشر، تفعيل، أدوار، وأكواد دخول.",
    duration: 210,
    kicker: "مدير النظام",
    start: 780,
    title: "تحكم احترافي في الفريق والعملاء",
    visual: "users",
  },
  {
    body: "العميل ينشئ حسابه من بوابة العملاء، يطلب فحصًا، ويتابع المحطات والتقارير المرتبطة به.",
    duration: 180,
    kicker: "بوابة العملاء",
    start: 990,
    title: "تجربة عميل مباشرة وواضحة",
    visual: "client",
  },
  {
    body: "كل حركة لها سجل تدقيق وتصدير، من حضور الفني إلى تحديث المستخدمين ومراجعة التقارير.",
    duration: 180,
    kicker: "تدقيق وتصدير",
    start: 1170,
    title: "قرارات الإدارة مبنية على أثر موثق",
    visual: "audit",
  },
];

const textBase: CSSProperties = {
  direction: "rtl",
  fontFamily: "Tajawal, Arial, sans-serif",
  letterSpacing: 0,
};

function enterProgress(frame: number, duration: number): number {
  return interpolate(frame, [0, 22, duration - 18, duration], [0, 1, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function softMove(frame: number, from = 34): number {
  return interpolate(frame, [0, 28], [from, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function Shell({ children, scene }: { children: ReactNode; scene: SceneDefinition }) {
  const frame = useCurrentFrame();
  const progress = enterProgress(frame, scene.duration);
  const y = softMove(frame);

  return (
    <AbsoluteFill
      style={{
        ...textBase,
        backgroundColor: palette.background,
        opacity: progress,
        padding: 76,
        transform: `translateY(${y}px)`,
      }}
    >
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <Img src={staticFile("brand/ecopest-lockup.png")} style={{ height: 72, objectFit: "contain", width: 260 }} />
        <div style={{ color: palette.primary, fontSize: 24, fontWeight: 700 }}>إدارة محطات الطعوم</div>
      </div>
      <div style={{ display: "grid", gap: 56, gridTemplateColumns: "minmax(0, 0.82fr) minmax(0, 1.18fr)", height: "100%", paddingTop: 78 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ color: palette.primary, fontSize: 30, fontWeight: 700 }}>{scene.kicker}</div>
          <h1 style={{ color: palette.ink, fontSize: 76, fontWeight: 800, lineHeight: 1.12, margin: "18px 0 0" }}>{scene.title}</h1>
          <p style={{ color: palette.muted, fontSize: 34, fontWeight: 400, lineHeight: 1.65, margin: "34px 0 0" }}>{scene.body}</p>
        </div>
        <div style={{ alignItems: "center", display: "flex", justifyContent: "center" }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
}

function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: palette.surface,
        border: `3px solid ${palette.border}`,
        borderRadius: 22,
        boxShadow: "0 24px 60px rgba(15, 23, 42, 0.12)",
        padding: 28,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function MiniPill({ children, tone = "primary" }: { children: ReactNode; tone?: "primary" | "warning" | "danger" }) {
  const color = tone === "danger" ? palette.danger : tone === "warning" ? palette.warning : palette.primary;
  const background = tone === "danger" ? "#fee2e2" : tone === "warning" ? "#fef3c7" : palette.primarySoft;

  return (
    <span style={{ backgroundColor: background, borderRadius: 999, color, display: "inline-flex", fontSize: 22, fontWeight: 700, padding: "8px 16px" }}>
      {children}
    </span>
  );
}

function HeroVisual() {
  const frame = useCurrentFrame();
  const lift = interpolate(frame, [0, 60], [30, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "relative", transform: `translateY(${lift}px)`, width: 760 }}>
      <Card style={{ minHeight: 520 }}>
        <Img src={staticFile("brand/ecopest-mark.png")} style={{ display: "block", height: 150, margin: "0 auto 24px", objectFit: "contain", width: 150 }} />
        <div style={{ color: palette.ink, fontSize: 44, fontWeight: 800, textAlign: "center" }}>لوحة موحدة للفرق والعملاء</div>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(3, 1fr)", marginTop: 42 }}>
          {["محطات", "تقارير", "حضور"].map((item, index) => (
            <div key={item} style={{ backgroundColor: index === 1 ? palette.primarySoft : "#eef2f7", borderRadius: 18, padding: 24, textAlign: "center" }}>
              <div style={{ color: palette.primary, fontSize: 52, fontWeight: 800 }}>{["128", "54", "31"][index]}</div>
              <div style={{ color: palette.muted, fontSize: 22, fontWeight: 700 }}>{item}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function QrPattern() {
  const cells = [
    [1, 1, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 1, 0],
    [1, 1, 1, 0, 1, 1, 1],
    [0, 0, 0, 1, 0, 1, 0],
    [1, 0, 1, 1, 1, 0, 1],
    [0, 1, 0, 1, 0, 1, 0],
    [1, 0, 1, 0, 1, 1, 1],
  ];

  return (
    <div style={{ backgroundColor: palette.surface, border: `2px solid ${palette.border}`, borderRadius: 18, display: "grid", gap: 8, gridTemplateColumns: "repeat(7, 1fr)", padding: 18, width: 240 }}>
      {cells.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div key={`${rowIndex}-${colIndex}`} style={{ aspectRatio: "1", backgroundColor: cell ? palette.ink : "#eef2f7", borderRadius: 5 }} />
        )),
      )}
    </div>
  );
}

function AccessVisual() {
  const frame = useCurrentFrame();
  const scan = interpolate(frame % 90, [0, 45, 90], [0, 1, 0]);

  return (
    <div style={{ display: "grid", gap: 28, gridTemplateColumns: "330px 1fr", width: 820 }}>
      <Card style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 28, minHeight: 560 }}>
        <div style={{ border: `5px solid ${palette.ink}`, borderRadius: 40, height: 450, padding: 28, position: "relative", width: 260 }}>
          <QrPattern />
          <div style={{ backgroundColor: palette.primary, height: 5, left: 32, position: "absolute", right: 32, top: 120 + scan * 170 }} />
          <div style={{ bottom: 30, color: palette.primary, fontSize: 24, fontWeight: 800, position: "absolute", right: 32 }}>QR المحطة</div>
        </div>
      </Card>
      <Card style={{ minHeight: 560 }}>
        <div style={{ color: palette.ink, fontSize: 34, fontWeight: 800 }}>المحطات القريبة</div>
        <div style={{ color: palette.muted, fontSize: 22, marginTop: 8 }}>داخل نطاق 100 متر</div>
        <div style={{ display: "grid", gap: 18, marginTop: 32 }}>
          {[
            ["ST-021", "مخزن المواد", "42 م"],
            ["ST-024", "مدخل الإنتاج", "78 م"],
            ["ST-031", "خارج النطاق", "180 م"],
          ].map(([id, name, distance], index) => (
            <div
              key={id}
              style={{
                alignItems: "center",
                backgroundColor: index === 2 ? "#f8fafc" : palette.primarySoft,
                border: `2px solid ${index === 2 ? palette.border : "#5eead4"}`,
                borderRadius: 18,
                display: "flex",
                justifyContent: "space-between",
                opacity: index === 2 ? 0.42 : 1,
                padding: 20,
              }}
            >
              <div>
                <div style={{ color: palette.primary, fontSize: 20, fontWeight: 800 }}>{id}</div>
                <div style={{ color: palette.ink, fontSize: 27, fontWeight: 800 }}>{name}</div>
              </div>
              <MiniPill tone={index === 2 ? "danger" : "primary"}>{distance}</MiniPill>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AttendanceVisual() {
  const frame = useCurrentFrame();
  const pulse = interpolate(Math.sin(frame / 9), [-1, 1], [0.92, 1.04]);

  return (
    <Card style={{ minHeight: 570, width: 800 }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: palette.primary, fontSize: 24, fontWeight: 800 }}>ST-021</div>
          <div style={{ color: palette.ink, fontSize: 42, fontWeight: 800 }}>حضور المحطة</div>
        </div>
        <MiniPill>GPS دقيق</MiniPill>
      </div>
      <div style={{ backgroundColor: "#eef2f7", borderRadius: 24, height: 210, marginTop: 34, position: "relative" }}>
        <div style={{ backgroundColor: palette.primary, borderRadius: 999, height: 132, left: 318, opacity: 0.2, position: "absolute", top: 38, transform: `scale(${pulse})`, width: 132 }} />
        <div style={{ backgroundColor: palette.primary, border: `8px solid ${palette.surface}`, borderRadius: 999, height: 62, left: 353, position: "absolute", top: 73, width: 62 }} />
        <div style={{ color: palette.muted, fontSize: 23, fontWeight: 700, position: "absolute", right: 32, top: 32 }}>نطاق المحطة 100م</div>
        <div style={{ bottom: 32, color: palette.primary, fontSize: 26, fontWeight: 800, position: "absolute", right: 32 }}>المسافة المسجلة: 37 م</div>
      </div>
      <div style={{ display: "grid", gap: 18, marginTop: 28 }}>
        {["تسجيل حضور", "فتح تقرير المحطة", "تسجيل انصراف"].map((item, index) => (
          <div key={item} style={{ alignItems: "center", display: "flex", gap: 18 }}>
            <div style={{ backgroundColor: index === 1 ? palette.primary : palette.primarySoft, borderRadius: 999, color: index === 1 ? palette.surface : palette.primary, display: "grid", fontSize: 24, fontWeight: 800, height: 48, placeItems: "center", width: 48 }}>
              {index + 1}
            </div>
            <div style={{ color: palette.ink, fontSize: 28, fontWeight: 800 }}>{item}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ReportVisual() {
  return (
    <Card style={{ minHeight: 570, width: 820 }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <div style={{ color: palette.ink, fontSize: 40, fontWeight: 800 }}>نموذج فحص المحطة</div>
        <MiniPill tone="warning">بانتظار المراجعة</MiniPill>
      </div>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1fr 1fr", marginTop: 30 }}>
        {["نشاط قوارض", "استهلاك طعم", "نظافة الموقع", "بحاجة متابعة"].map((label, index) => (
          <div key={label} style={{ backgroundColor: index < 2 ? palette.primarySoft : "#eef2f7", borderRadius: 18, color: index < 2 ? palette.primary : palette.muted, fontSize: 26, fontWeight: 800, padding: 20 }}>
            {label}
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 240px", marginTop: 30 }}>
        <div style={{ backgroundColor: "#eef2f7", borderRadius: 20, color: palette.muted, fontSize: 25, lineHeight: 1.5, padding: 24 }}>
          ملاحظات الفني: تم تبديل الطعم وتنظيف محيط المحطة. يوصى بمراجعة خلال 7 أيام.
        </div>
        <div style={{ backgroundColor: palette.primarySoft, borderRadius: 20, color: palette.primary, display: "grid", fontSize: 28, fontWeight: 800, minHeight: 170, placeItems: "center" }}>
          صورة مرفقة
        </div>
      </div>
    </Card>
  );
}

function UsersVisual() {
  return (
    <Card style={{ minHeight: 570, width: 860 }}>
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "1.4fr 0.7fr 0.7fr 0.6fr" }}>
        {["بحث المستخدمين", "الدور", "الحالة", "تطبيق"].map((item, index) => (
          <div key={item} style={{ backgroundColor: index === 3 ? palette.primary : "#eef2f7", borderRadius: 14, color: index === 3 ? palette.surface : palette.muted, fontSize: 22, fontWeight: 800, padding: 16 }}>
            {item}
          </div>
        ))}
      </div>
      <div style={{ border: `2px solid ${palette.border}`, borderRadius: 18, marginTop: 26, overflow: "hidden" }}>
        {[
          ["أحمد علي", "فني", "نشط"],
          ["شركة النيل", "عميل", "نشط"],
          ["منى حسن", "مشرف", "غير نشط"],
          ["إدارة التشغيل", "مدير", "نشط"],
        ].map((row, index) => (
          <div key={row[0]} style={{ alignItems: "center", backgroundColor: index % 2 === 0 ? palette.surface : "#f8fafc", borderTop: index ? `2px solid ${palette.border}` : undefined, display: "grid", gridTemplateColumns: "1.4fr 0.7fr 0.7fr", padding: 20 }}>
            <div style={{ color: palette.ink, fontSize: 26, fontWeight: 800 }}>{row[0]}</div>
            <RoleBadgeMini>{row[1]}</RoleBadgeMini>
            <MiniPill tone={row[2] === "نشط" ? "primary" : "danger"}>{row[2]}</MiniPill>
          </div>
        ))}
      </div>
      <div style={{ color: palette.primary, fontSize: 28, fontWeight: 800, marginTop: 28 }}>صفوف قابلة للتوسيع للتعديل المباشر</div>
    </Card>
  );
}

function RoleBadgeMini({ children }: { children: ReactNode }) {
  return <div style={{ color: palette.ink, fontSize: 24, fontWeight: 700 }}>{children}</div>;
}

function ClientVisual() {
  return (
    <Card style={{ minHeight: 570, width: 820 }}>
      <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <div style={{ color: palette.ink, fontSize: 40, fontWeight: 800 }}>بوابة العميل</div>
        <MiniPill>تسجيل فوري</MiniPill>
      </div>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(4, 1fr)", marginTop: 34 }}>
        {["محطات", "طلبات", "مكتمل", "تقارير"].map((label, index) => (
          <div key={label} style={{ backgroundColor: "#eef2f7", borderRadius: 18, padding: 18, textAlign: "center" }}>
            <div style={{ color: palette.primary, fontSize: 38, fontWeight: 800 }}>{[6, 2, 8, 14][index]}</div>
            <div style={{ color: palette.muted, fontSize: 18, fontWeight: 700 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gap: 18, marginTop: 30 }}>
        {["طلب فحص جديد", "محطة مرتبطة", "تقرير مستلم"].map((item, index) => (
          <div key={item} style={{ alignItems: "center", backgroundColor: index === 0 ? palette.primarySoft : "#f8fafc", border: `2px solid ${palette.border}`, borderRadius: 18, display: "flex", justifyContent: "space-between", padding: 22 }}>
            <div style={{ color: palette.ink, fontSize: 28, fontWeight: 800 }}>{item}</div>
            <MiniPill tone={index === 2 ? "warning" : "primary"}>{["جديد", "نشط", "مراجعة"][index]}</MiniPill>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AuditVisual() {
  return (
    <Card style={{ minHeight: 570, width: 840 }}>
      <div style={{ color: palette.ink, fontSize: 40, fontWeight: 800 }}>سجل تدقيق وتصدير</div>
      <div style={{ display: "grid", gap: 18, marginTop: 34 }}>
        {[
          ["attendance.clock_in", "فني", "ST-021"],
          ["report.submit", "فني", "تقرير فحص"],
          ["user.role_change", "مدير", "تحديث دور"],
          ["export.csv", "مشرف", "تصدير حضور"],
        ].map((row, index) => (
          <div key={row[0]} style={{ alignItems: "center", backgroundColor: index === 3 ? palette.primarySoft : "#f8fafc", border: `2px solid ${palette.border}`, borderRadius: 18, display: "grid", gridTemplateColumns: "1.2fr 0.6fr 0.8fr", padding: 20 }}>
            <div style={{ color: palette.primary, direction: "ltr", fontSize: 24, fontWeight: 800, textAlign: "left" }}>{row[0]}</div>
            <div style={{ color: palette.ink, fontSize: 24, fontWeight: 800 }}>{row[1]}</div>
            <div style={{ color: palette.muted, fontSize: 24, fontWeight: 700 }}>{row[2]}</div>
          </div>
        ))}
      </div>
      <div style={{ alignItems: "center", display: "flex", gap: 18, marginTop: 30 }}>
        <MiniPill>CSV</MiniPill>
        <div style={{ color: palette.muted, fontSize: 26, fontWeight: 700 }}>جاهز للتقارير الإدارية والتحليل</div>
      </div>
    </Card>
  );
}

function SceneVisual({ visual }: { visual: SceneDefinition["visual"] }) {
  if (visual === "hero") return <HeroVisual />;
  if (visual === "access") return <AccessVisual />;
  if (visual === "attendance") return <AttendanceVisual />;
  if (visual === "report") return <ReportVisual />;
  if (visual === "users") return <UsersVisual />;
  if (visual === "client") return <ClientVisual />;
  return <AuditVisual />;
}

function ProgressRail() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const width = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: "clamp" });

  return (
    <div style={{ backgroundColor: "#dbe5ee", bottom: 0, height: 10, left: 0, position: "absolute", right: 0 }}>
      <div style={{ backgroundColor: palette.primary, height: "100%", width: `${width}%` }} />
    </div>
  );
}

function Fonts() {
  return (
    <style>
      {`
        @font-face { font-family: Tajawal; src: url("${staticFile("fonts/Tajawal-Regular.ttf")}") format("truetype"); font-weight: 400; }
        @font-face { font-family: Tajawal; src: url("${staticFile("fonts/Tajawal-Bold.ttf")}") format("truetype"); font-weight: 700; }
        @font-face { font-family: Tajawal; src: url("${staticFile("fonts/Tajawal-ExtraBold.ttf")}") format("truetype"); font-weight: 800; }
      `}
    </style>
  );
}

export const EcoPestPromo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: palette.background }}>
      <Fonts />
      <Audio src={staticFile("audio/ecopest-bed.wav")} volume={0.28} />
      {scenes.map((scene) => (
        <Sequence durationInFrames={scene.duration} from={scene.start} key={scene.visual}>
          <Shell scene={scene}>
            <SceneVisual visual={scene.visual} />
          </Shell>
        </Sequence>
      ))}
      <ProgressRail />
    </AbsoluteFill>
  );
};
