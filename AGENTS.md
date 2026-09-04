# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# MedNexus Design System — Apple Fitness × Hospital Ops

Merges the **Apple Fitness** visual language (rings, frosted cards, blurred chrome, motion) with **MedNexus** domain (bed occupancy, pharmacy, clinical memory, analytics). Keeps existing navy/blue dark theme, 5-tab structure, and component library.

---

## 1. Color Tokens

```ts
// src/constants/theme.ts — MedNexus navy/blue dark-first (source of truth)
export const Colors = {
  dark: {
    background: "#0A0E1A",
    backgroundDim: "#0D1220",
    card: "#131A2A",
    cardElevated: "#182033",
    backgroundElement: "#182033",
    border: "#1E293B",
    primary: "#38BDF8",        // cyan-blue accent
    primaryDim: "#0EA5E9",
    gradientStart: "#38BDF8",
    gradientMid: "#3B82F6",
    gradientEnd: "#2563EB",
    accent: "#38BDF8",
    success: "#34D399",
    warning: "#FBBF24",
    critical: "#F87171",
    info: "#A78BFA",
    confidence: "#A78BFA",
    text: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
    tabActive: "#38BDF8",
    tabInactive: "#64748B",
    glass: "rgba(19, 26, 42, 0.72)",
  },
  light: { /* … */ },
} as const;
```

**Fitness ring colors (immutable, theme-invariant) — used ONLY for capacity rings:**

```ts
export const RingColors = {
  beds:       { color: "#FA114F", track: "rgba(250,17,79,0.22)", label: "#FF375F" },   // Move pink
  icu:        { color: "#92E82A", track: "rgba(146,232,42,0.22)", label: "#92E82A" },   // Exercise green
  er:         { color: "#1EE4E1", track: "rgba(30,228,225,0.22)", label: "#1EE4E1" },   // Stand cyan
} as const;
```

> Never recolor rings for light/dark. Only surfaces/labels swap.

---

## 2. Typography

SF Pro on iOS (system font), Inter fallback on Android/web. Tabular numerals on all live values.

```ts
// src/theme/typography.ts
import { Platform, type TextStyle } from "react-native";

const f = (ios: TextStyle["fontWeight"], inter: string) =>
  Platform.OS === "ios" ? { fontWeight: ios } : { fontFamily: inter };

const TABULAR: TextStyle = { fontVariant: ["tabular-nums"] };

export const typography = {
  largeTitle: { color: "#FFFFFF", ...f("800", "Inter-ExtraBold"), fontSize: 40, lineHeight: 44, letterSpacing: -1 },
  date:       { color: "#FFFFFF", ...f("800", "Inter-ExtraBold"), fontSize: 32, lineHeight: 35, letterSpacing: -0.6 },
  header:     { color: "#FFFFFF", ...f("800", "Inter-ExtraBold"), fontSize: 26, lineHeight: 30, letterSpacing: -0.5 },
  section:    { color: "#FFFFFF", ...f("800", "Inter-ExtraBold"), fontSize: 22, lineHeight: 26, letterSpacing: -0.4 },
  title3:     { color: "#FFFFFF", ...f("700", "Inter-Bold"),      fontSize: 20, lineHeight: 25, letterSpacing: -0.3 },
  body:       { color: "#FFFFFF", ...f("600", "Inter-SemiBold"),  fontSize: 17, lineHeight: 24, letterSpacing: -0.2 },
  bodyReg:    { color: "#FFFFFF", ...f("400", "Inter-Regular"),   fontSize: 17, lineHeight: 26, letterSpacing: -0.2 },
  ringValue:  { ...TABULAR, color: "#FFFFFF", ...f("800", "Inter-ExtraBold"), fontSize: 19, lineHeight: 21 },
  tileValue:  { ...TABULAR, color: "#FFFFFF", ...f("800", "Inter-ExtraBold"), fontSize: 22, lineHeight: 24 },
  cardTitle:  { color: "#FFFFFF", ...f("600", "Inter-SemiBold"),  fontSize: 15, lineHeight: 20, letterSpacing: -0.2 },
  footnote:   { color: "rgba(235,235,245,0.60)", ...f("400", "Inter-Regular"), fontSize: 13, lineHeight: 18 },
  eyebrow:    { ...f("700", "Inter-Bold"), fontSize: 12, lineHeight: 15, letterSpacing: 0.4, textTransform: "uppercase" as const },
  button:     { color: "#FFFFFF", ...f("600", "Inter-SemiBold"),  fontSize: 17, lineHeight: 17, letterSpacing: -0.2 },
  tab:        { ...f("500", "Inter-Regular"), fontSize: 10, lineHeight: 10 },
  badge:      { color: "#FFFFFF", ...f("700", "Inter-Bold"), fontSize: 10, lineHeight: 10, letterSpacing: 0.5, textTransform: "uppercase" as const },
} satisfies Record<string, TextStyle>;
```

**Load Inter on non-iOS** (in `app/_layout.tsx`):

```tsx
import { useFonts } from "expo-font";
const [loaded] = useFonts({
  "Inter-Regular":  require("../assets/fonts/Inter-Regular.ttf"),
  "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
  "Inter-Bold":     require("../assets/fonts/Inter-Bold.ttf"),
  "Inter-ExtraBold":require("../assets/fonts/Inter-ExtraBold.ttf"),
});
if (!loaded) return null;
```

---

## 3. Signature Components

### 3.1 Capacity Rings (replaces RingGauge)

`src/components/CapacityRings.tsx` — three staggered rings (Beds / ICU / ER) using `react-native-svg` + `react-native-reanimated`.

```tsx
import { useEffect } from "react";
import Svg, { Circle } from "react-native-svg";
import Animated, { useSharedValue, useAnimatedProps, withTiming, withDelay, Easing } from "react-native-reanimated";
import { RingColors } from "@/constants/theme";

const ACircle = Animated.createAnimatedComponent(Circle);

function Ring({ progress, color, track, r, cx, cy, sw, delay }: RingProps) {
  const C = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(Math.min(progress, 1), { duration: 1000, easing: Easing.out(Easing.ease) }));
  }, [progress]);
  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - p.value) }));
  return (
    <>
      <Circle cx={cx} cy={cy} r={r} stroke={track} strokeWidth={sw} fill="none" />
      <ACircle cx={cx} cy={cy} r={r} stroke={color} strokeWidth={sw} fill="none"
        strokeLinecap="round" strokeDasharray={C} animatedProps={animatedProps}
        transform={`rotate(-90 ${cx} ${cy})`} />
    </>
  );
}

export function CapacityRings({
  bedsPct, icuPct, erValue, size = 130, lineWidth = 14
}: { bedsPct: number; icuPct: number; erValue: number; size?: number; lineWidth?: number }) {
  const c = size / 2;
  const radii = [c - lineWidth/2 - 2, c - lineWidth*1.5 - 5, c - lineWidth*2.5 - 8];
  const cfg = [RingColors.beds, RingColors.icu, RingColors.er];
  const vals = [bedsPct/100, icuPct/100, Math.min(erValue/100, 1)];
  return (
    <Svg width={size} height={size}>
      {cfg.map((rc, i) => (
        <Ring key={i} progress={vals[i]} color={rc.color} track={rc.track}
          r={radii[i]} cx={c} cy={c} sw={lineWidth} delay={i*80} />
      ))}
    </Svg>
  );
}
```

**Ring Legend (inline with rings):**

```tsx
// src/components/RingLegend.tsx
import { View, Text } from "react-native";
import { typography } from "@/theme/typography";
import { RingColors, Colors } from "@/constants/theme";

const items = [
  { key: "beds", label: "Beds", value: "87%", goal: "/200" },
  { key: "icu",  label: "ICU",  value: "72%", goal: "/30"  },
  { key: "er",   label: "ER",   value: "12",   goal: "queue" },
] as const;

export function RingLegend({ bedsPct, icuPct, erValue }: { bedsPct: number; icuPct: number; erValue: number }) {
  const vals = { beds: bedsPct, icu: icuPct, er: erValue };
  return (
    <View style={{ flex: 1, gap: 14 }}>
      {items.map((it) => {
        const rc = RingColors[it.key];
        const v = vals[it.key as keyof typeof vals];
        return (
          <View key={it.key}>
            <Text style={[typography.eyebrow, { color: rc.label }]}>{it.label}</Text>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <Text style={typography.ringValue}>{typeof v === "number" ? `${v}%` : v}</Text>
              <Text style={{ ...typography.footnote, color: Colors.dark.textSecondary }}>{it.goal}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
```

**Hero Card (rings + legend):**

```tsx
// src/components/CapacityHeroCard.tsx
import { View } from "react-native";
import { Card } from "@/components/ui";
import { CapacityRings } from "./CapacityRings";
import { RingLegend } from "./RingLegend";
import { Colors } from "@/constants/theme";

export function CapacityHeroCard({ bedsPct, icuPct, erValue }: CapacityHeroProps) {
  return (
    <Card style={{ flexDirection: "row", alignItems: "center", gap: 20, padding: 22 }}>
      <CapacityRings bedsPct={bedsPct} icuPct={icuPct} erValue={erValue} size={130} />
      <RingLegend bedsPct={bedsPct} icuPct={icuPct} erValue={erValue} />
    </Card>
  );
}
```

---

### 3.2 Metric Tile (replaces MetricCard for dashboard grid)

`src/components/MetricTile.tsx`

```tsx
import { View, Text } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { typography } from "@/theme/typography";
import { Colors } from "@/constants/theme";

export function MetricTile({
  icon, tint, label, value, unit, sub, spark,
}: {
  icon: string; tint: string; label: string; value: string;
  unit?: string; sub: string; spark?: number[];
}) {
  const c = Colors.dark;
  return (
    <View style={{ flex: 1, minWidth: 160, padding: 14, borderRadius: 14, backgroundColor: c.card }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Ionicons name={icon} size={16} color={tint} />
        <Text style={{ ...typography.footnote, color: c.textSecondary, fontSize: 12 }}>{label}</Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2, marginTop: 8 }}>
        <Text style={typography.tileValue}>{value}</Text>
        {unit && <Text style={{ ...typography.footnote, color: c.textSecondary }}>{unit}</Text>}
      </View>
      <Text style={{ ...typography.footnote, color: c.textMuted, marginTop: 2 }}>{sub}</Text>
      {spark && <Sparkline data={spark} height={22} width="100%" color={tint} style={{ marginTop: 8 }} />}
    </View>
  );
}
```

---

### 3.3 Frosted Resource Card (Fitness+ style — for Analytics / Smart Allocation)

`src/components/FrostedCard.tsx`

```tsx
import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Ionicons from "@expo/vector-icons/Ionicons";
import { typography } from "@/theme/typography";
import { Colors } from "@/constants/theme";

export function FrostedCard({
  badge, type, title, meta, gradient, children, action,
}: {
  badge: string; type: string; title: string; meta: string;
  gradient: [string, string]; children?: React.ReactNode; action?: React.ReactNode;
}) {
  const c = Colors.dark;
  return (
    <View style={{ width: 168 }}>
      <View style={{ height: 200, borderRadius: 16, overflow: "hidden" }}>
        <LinearGradient colors={gradient} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:1}} />
        <BlurView intensity={28} tint="dark"
          style={{position:"absolute",top:12,left:12,borderRadius:6,overflow:"hidden"}}>
          <Text style={[typography.badge,{paddingHorizontal:8,paddingVertical:4}]}>{badge}</Text>
        </BlurView>
        <BlurView intensity={36} tint="light"
          style={{position:"absolute",bottom:14,left:14,width:34,height:34,borderRadius:17,overflow:"hidden",
            alignItems:"center",justifyContent:"center"}}>
          <Ionicons name="play" size={14} color="#FFF" style={{marginLeft:2}} />
        </BlurView>
      </View>
      <Text style={[typography.eyebrow,{color:RingColors.beds.label,marginTop:10}]}>{type}</Text>
      <Text style={[typography.cardTitle,{marginTop:3}]}>{title}</Text>
      <Text style={[typography.footnote,{marginTop:2}]}>{meta}</Text>
      {children}
      {action}
    </View>
  );
}
```

---

### 3.4 Buttons (AFPrimary / AFTinted)

`src/components/AFButton.tsx`

```tsx
import { Pressable, Text } from "react-native";
import { typography } from "@/theme/typography";
import { Colors } from "@/constants/theme";

export function AFPrimaryButton({ title, onPress, style }: { title: string; onPress: () => void; style?: any }) {
  const c = Colors.dark;
  return (
    <Pressable onPress={onPress}
      style={({ pressed }) => [styles.base, { backgroundColor: pressed ? "#D80E45" : RingColors.beds.color,
        transform: [{ scale: pressed ? 0.98 : 1 }] }, style]}>
      <Text style={typography.button}>{title}</Text>
    </Pressable>
  );
}

export function AFTintedButton({ title, onPress, style }: { title: string; onPress: () => void; style?: any }) {
  const c = Colors.dark;
  return (
    <Pressable onPress={onPress} style={[styles.tinted, style]}>
      <Text style={{ ...typography.button, fontSize: 15, color: RingColors.beds.color }}>{title}</Text>
    </Pressable>
  );
}

const styles = {
  base: { borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  tinted: { backgroundColor: "rgba(250,17,79,0.18)", borderRadius: 12, paddingVertical: 12, paddingHorizontal: 22, alignSelf: "flex-start" },
};
```

---

## 4. Bottom Tab Bar (Fitness-style blurred)

`src/components/tab-bar.tsx` — replace `FloatingTabBar` with this:

```tsx
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/theme";

export default function TabBar({ state, descriptors, navigation }) {
  const c = Colors.dark;
  return (
    <Tabs
      tabBar={(props) => (
        <BlurView intensity={50} tint="dark" style={{ flex: 1 }}>
          <DefaultTabBar
            {...props}
            activeTintColor={c.tabActive}
            inactiveTintColor={c.tabInactive}
            labelStyle={{ fontSize: 10 }}
            style={{ position: "absolute", borderTopWidth: 0.5, borderTopColor: c.border, backgroundColor: "transparent" }}
          />
        </BlurView>
      )}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.background } }}
    >
      <Tabs.Screen name="dashboard" options={{
        title: "Dashboard",
        tabBarIcon: ({ color }) => <Ionicons name="ellipse-outline" size={24} color={color} />,
      }} />
      <Tabs.Screen name="memory" options={{
        title: "Memory",
        tabBarIcon: ({ color }) => <Ionicons name="library-outline" size={24} color={color} />,
      }} />
      <Tabs.Screen name="assistant" options={{
        title: "Assistant",
        tabBarIcon: ({ color }) => <Ionicons name="sparkles-outline" size={24} color={color} />,
      }} />
      <Tabs.Screen name="analytics" options={{
        title: "Analytics",
        tabBarIcon: ({ color }) => <Ionicons name="analytics-outline" size={24} color={color} />,
      }} />
      <Tabs.Screen name="more" options={{
        title: "More",
        tabBarIcon: ({ color }) => <Ionicons name="more-horizontal" size={24} color={color} />,
      }} />
    </Tabs>
  );
}
```

---

## 5. Motion & Haptics

```tsx
// Ring sweep: staggered 80ms, 1000ms ease-out
p.value = withDelay(i * 80, withTiming(Math.min(progress, 1), { duration: 1000, easing: Easing.out(Easing.ease) }));

// Ring close → success haptic
import * as Haptics from "expo-haptics";
if (progress >= 1) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Card press scale
style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.97 : 1 }] })}

// Tab / segment change
Haptics.selectionAsync();

// Start Workout / Apply action
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

// Live HUD value updates
liveValue.value = withTiming(next, { duration: 300 });

// Fitness+ shelf parallax
Animated.scrollEvent([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useAnimatedProps: true });
```

**Reduce Motion gate:**

```tsx
import { AccessibilityInfo } from "react-native";
const [reduceMotion, setReduceMotion] = useState(false);
useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
}, []);
// If reduceMotion: skip withDelay, use 250ms crossfade, static "closed" checkmark
```

---

## 6. Icon Library (Ionicons + SF Symbols via expo-symbols)

| Purpose | Ionicons | SF Symbol |
|---------|----------|-----------|
| Dashboard (tab) | `ellipse-outline` | `circle.circle` |
| Memory (tab) | `library-outline` | `doc.text.magnifyingglass` |
| Assistant (tab) | `sparkles-outline` | `sparkles` |
| Analytics (tab) | `analytics-outline` | `chart.xyaxis.line` |
| More (tab) | `more-horizontal` | `ellipsis.circle` |
| Beds / Occupancy | `bed-outline` | `bed.double` |
| ICU | `pulse-outline` | `waveform.path.ecg` |
| ER Queue | `people-outline` | `figure.wave.circle` |
| Blood Bank | `drop-outline` | `drop.fill` |
| Pharmacy | `medkit-outline` | `pills.fill` |
| Theatre | `time-outline` | `calendar.badge.clock` |
| Staff | `person-outline` | `person.2.fill` |
| Forecast Up | `trending-up` | `arrow.up.right` |
| Forecast Down | `trending-down` | `arrow.down.right` |
| Search | `search-outline` | `magnifyingglass` |
| Play / Start | `play-circle` | `play.fill` |
| Dismiss | `close-outline` | `xmark.circle` |
| Apply / Confirm | `checkmark-outline` | `checkmark.circle.fill` |
| Settings | `settings-outline` | `gearshape` |
| Notifications | `notifications-outline` | `bell.fill` |

---

## 7. Platform Notes

- **Font**: iOS → system (SF Pro); Android/web → Inter (bundled). Never substitute on iOS.
- **Tabular figures**: `fontVariant: ['tabular-nums']` on ring values, metric tiles, analytics bars, in-workout HUD.
- **Status bar**: `<StatusBar style="light" />` (dark-first).
- **Blur**: `expo-blur` `BlurView` for tab bar + frosted cards. Fallback solid `#131A2A` when Reduce Transparency.
- **Safe area**: Wrap screens in `SafeAreaView`; pad scroll content by tab bar height + bottom inset.
- **Dynamic Type**: RN respects system scale. Set `allowFontScaling={false}` on ring legend, HUD, tab labels, frosted badges.
- **SVG**: `react-native-svg` for rings; animate via `reanimated` `useAnimatedProps` on `strokeDashoffset`.
- **Ring colors sacred**: Never branch on `useColorScheme()`. Only surfaces/labels swap for light (iPad).
- **Accessibility**: Announce rings as "Bed occupancy, 174 of 200 beds". Keep text labels beside rings. Differentiate by radius, not color alone.
- **Reduce Motion**: Gate ring sweep, particle burst, card scale, shelf parallax. Fallback: 250ms crossfade to final values.

---

## 8. Migration Checklist (from current codebase)

| Current | Target | Status |
|---------|--------|--------|
| `RingGauge` (3 separate) | `CapacityRings` (single SVG, 3 rings) | ⬜ |
| `MetricCard` (dashboard grid) | `MetricTile` (icon + value + sparkline) | ⬜ |
| `Card` (analytics/resources) | `FrostedCard` (gradient + blur overlays) | ⬜ |
| `GradientButton` | `AFPrimaryButton` / `AFTintedButton` | ⬜ |
| `FloatingTabBar` | Blurred `TabBar` (above) | ⬜ |
| Theme colors | Keep navy/blue; add `RingColors` constant | ⬜ |
| Typography | Add `typography.ts` + Inter load | ⬜ |
| Haptics | Add `expo-haptics` calls per §5 | ⬜ |
| Reduce Motion | Gate all motion per §7 | ⬜ |

---

## 9. File Structure (additions)

```
src/
├── theme/
│   ├── colors.ts          # RingColors + MedNexus Colors (single source)
│   └── typography.ts      # shared TextStyle tokens
├── components/
│   ├── CapacityRings.tsx
│   ├── RingLegend.tsx
│   ├── CapacityHeroCard.tsx
│   ├── MetricTile.tsx
│   ├── FrostedCard.tsx
│   ├── AFButton.tsx
│   └── tab-bar.tsx        # replaces FloatingTabBar
├── app/
│   ├── _layout.tsx        # + useFonts(Inter)
│   └── (tabs)/_layout.tsx # uses new tab-bar
└── assets/fonts/          # Inter-{Regular,SemiBold,Bold,ExtraBold}.ttf
```