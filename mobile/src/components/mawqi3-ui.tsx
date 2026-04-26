// Mawqi3 mobile UI primitives for field-first screens and shared interaction feedback.
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts, Radius, Shadow, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';
import type { StatusOption } from '@/lib/sync/types';

type FeedbackVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';
type SyncState = 'synced' | 'pending' | 'failed' | 'syncing';
type ToastVariant = 'success' | 'warning' | 'error' | 'info';

interface LoadingButtonProps extends PressableProps {
  children: ReactNode;
  loading?: boolean;
  selected?: boolean;
}

interface CardProps {
  accessibilityLabel?: string;
  children: ReactNode;
  disabled?: boolean;
  onPress?: PressableProps['onPress'];
  style?: StyleProp<ViewStyle>;
  variant?: FeedbackVariant;
}

interface ToastMessage {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const statusColors: Record<StatusOption, { background: string; text: string }> = {
  station_ok: { background: '#dcfce7', text: '#166534' },
  station_replaced: { background: '#dbeafe', text: '#1d4ed8' },
  bait_changed: { background: '#fef3c7', text: '#92400e' },
  bait_ok: { background: '#ccfbf1', text: '#0f766e' },
  station_excluded: { background: '#fee2e2', text: '#991b1b' },
  station_substituted: { background: '#f3e8ff', text: '#7e22ce' },
};

function usePressScale(activeScale: number) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.spring(scale, {
      friction: 8,
      tension: 180,
      toValue: activeScale,
      useNativeDriver: true,
    }).start();
  }, [activeScale, scale]);

  const pressOut = useCallback(() => {
    Animated.spring(scale, {
      friction: 8,
      tension: 180,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return { pressIn, pressOut, scale };
}

function variantColor(variant: FeedbackVariant, theme: ReturnType<typeof useTheme>): string {
  if (variant === 'success') {
    return theme.successStrong;
  }

  if (variant === 'warning') {
    return theme.warningStrong;
  }

  if (variant === 'danger') {
    return theme.dangerStrong;
  }

  if (variant === 'info') {
    return theme.accent;
  }

  return theme.border;
}

function callHandler(
  handler: ((event: GestureResponderEvent) => void) | null | undefined,
  event: GestureResponderEvent,
): void {
  if (handler) {
    handler(event);
  }
}

export function BrandHeader({ compact = false, subtitle }: { compact?: boolean; subtitle?: string }) {
  const theme = useTheme();
  const { isRtl, strings } = useLanguage();
  const brandSubtitle = subtitle ?? strings.brandTagline;

  return (
    <View style={[styles.brandRow, compact && styles.brandRowCompact, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
      <View
        style={[
          styles.brandMark,
          compact && styles.brandMarkCompact,
          { backgroundColor: theme.primarySoft, borderColor: theme.primaryLight },
        ]}>
        <ThemedText style={[styles.brandLetter, compact && styles.brandLetterCompact, { color: theme.primary }]}>م</ThemedText>
      </View>
      <View style={styles.brandCopy}>
        <View style={[styles.wordmarkRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
          <ThemedText type="smallBold" style={[styles.brandNameArabic, compact && styles.brandNameCompact]}>
            {strings.appNameArabic}
          </ThemedText>
          <ThemedText type="smallBold" themeColor="textSecondary" style={compact && styles.brandNameCompact}>
            {strings.appName}
          </ThemedText>
        </View>
        {compact ? null : (
          <ThemedText type="small" themeColor="textSecondary">
            {brandSubtitle}
          </ThemedText>
        )}
      </View>
    </View>
  );
}

export function ScreenShell({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const { direction } = useLanguage();

  return (
    <ThemedView style={[styles.shell, { direction }]}>
      <View style={[styles.content, { backgroundColor: theme.background }]}>{children}</View>
    </ThemedView>
  );
}

export function Card({ accessibilityLabel, children, disabled, onPress, style, variant = 'default' }: CardProps) {
  const theme = useTheme();
  const { pressIn, pressOut, scale } = usePressScale(0.98);
  const accentColor = variantColor(variant, theme);
  const cardStyle = [
    styles.card,
    Shadow.sm,
    {
      backgroundColor: theme.surfaceCard,
      borderColor: variant === 'default' ? theme.border : accentColor,
    },
    style,
  ];

  if (!onPress) {
    return (
      <Animated.View style={[cardStyle, { transform: [{ scale }] }]}>
        <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
        {children}
      </Animated.View>
    );
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={cardStyle}>
        <View style={[styles.cardAccent, { backgroundColor: accentColor }]} />
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function PrimaryButton({ children, disabled, loading = false, onPressIn, onPressOut, ...props }: LoadingButtonProps) {
  const theme = useTheme();
  const { pressIn, pressOut, scale } = usePressScale(0.96);
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPressIn={(event) => {
          pressIn();
          callHandler(onPressIn, event);
        }}
        onPressOut={(event) => {
          pressOut();
          callHandler(onPressOut, event);
        }}
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: isDisabled ? theme.backgroundSelected : theme.primary,
            opacity: isDisabled ? 0.68 : 1,
          },
          pressed && !isDisabled ? styles.pressed : null,
        ]}
        {...props}>
        {loading ? <ActivityIndicator color={theme.onPrimary} /> : null}
        <ThemedText style={[styles.buttonText, { color: theme.onPrimary }]}>{children}</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export function SecondaryButton({
  children,
  disabled,
  loading = false,
  selected = false,
  onPressIn,
  onPressOut,
  ...props
}: LoadingButtonProps) {
  const theme = useTheme();
  const { pressIn, pressOut, scale } = usePressScale(0.96);
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={[styles.secondaryButtonWrap, { transform: [{ scale }] }]}>
      <Pressable
        accessibilityRole="button"
        disabled={isDisabled}
        onPressIn={(event) => {
          pressIn();
          callHandler(onPressIn, event);
        }}
        onPressOut={(event) => {
          pressOut();
          callHandler(onPressOut, event);
        }}
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            backgroundColor: selected ? theme.primarySoft : theme.surfaceCard,
            borderColor: selected ? theme.primary : theme.border,
            opacity: isDisabled ? 0.62 : 1,
          },
          pressed && !isDisabled ? styles.pressed : null,
        ]}
        {...props}>
        {loading ? <ActivityIndicator color={theme.primary} /> : null}
        <ThemedText type="smallBold" style={{ color: selected ? theme.primary : theme.text }}>
          {children}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

export function IconButton({
  disabled,
  icon,
  label,
  loading = false,
  onPressIn,
  onPressOut,
  ...props
}: Omit<LoadingButtonProps, 'children'> & { icon: string; label: string }) {
  const theme = useTheme();
  const { pressIn, pressOut, scale } = usePressScale(0.94);
  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        disabled={isDisabled}
        onPressIn={(event) => {
          pressIn();
          callHandler(onPressIn, event);
        }}
        onPressOut={(event) => {
          pressOut();
          callHandler(onPressOut, event);
        }}
        style={({ pressed }) => [
          styles.iconButton,
          {
            backgroundColor: theme.primary,
            opacity: isDisabled ? 0.62 : 1,
          },
          pressed && !isDisabled ? styles.pressed : null,
        ]}
        {...props}>
        {loading ? (
          <ActivityIndicator color={theme.onPrimary} />
        ) : (
          <ThemedText style={[styles.iconButtonText, { color: theme.onPrimary }]}>{icon}</ThemedText>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function StatTile({
  icon,
  label,
  trend = 'neutral',
  value,
}: {
  icon?: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  value: string;
}) {
  const theme = useTheme();
  const trendColor = trend === 'up' ? theme.successStrong : trend === 'down' ? theme.dangerStrong : theme.textSecondary;

  return (
    <Card style={styles.statTile}>
      <View style={styles.statHeader}>
        {icon ? <ThemedText style={styles.statIcon}>{icon}</ThemedText> : null}
        <SyncIndicator status={trend === 'neutral' ? 'pending' : trend === 'up' ? 'synced' : 'failed'} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="subtitle" style={{ color: trendColor }}>
        {value}
      </ThemedText>
    </Card>
  );
}

export function StatusBadge({ status }: { status: StatusOption }) {
  const { statusOptionLabels } = useLanguage();
  const colors = statusColors[status];

  return (
    <View style={[styles.statusBadge, { backgroundColor: colors.background }]}>
      <ThemedText type="smallBold" style={{ color: colors.text }}>
        {statusOptionLabels[status]}
      </ThemedText>
    </View>
  );
}

export function SyncIndicator({ status }: { status: SyncState }) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(1)).current;
  const color =
    status === 'synced'
      ? theme.successStrong
      : status === 'failed'
        ? theme.dangerStrong
        : status === 'syncing'
          ? theme.warningStrong
          : theme.warningStrong;

  useEffect(() => {
    if (status !== 'syncing') {
      opacity.setValue(1);
      return undefined;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { duration: 520, toValue: 0.35, useNativeDriver: true }),
        Animated.timing(opacity, { duration: 520, toValue: 1, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [opacity, status]);

  return <Animated.View style={[styles.syncDot, { backgroundColor: color, opacity }]} />;
}

export function SkeletonLoader({
  borderRadius = Radius.md,
  height,
  width,
}: {
  borderRadius?: number;
  height: number;
  width: ViewStyle['width'];
}) {
  const theme = useTheme();
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { duration: 760, toValue: 0.85, useNativeDriver: true }),
        Animated.timing(opacity, { duration: 760, toValue: 0.35, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [opacity]);

  return <Animated.View style={[styles.skeleton, { backgroundColor: theme.border, borderRadius, height, opacity, width }]} />;
}

export function EmptyState({
  actionLabel,
  icon = '·',
  onAction,
  subtitle,
  title,
}: {
  actionLabel?: string;
  icon?: string;
  onAction?: () => void;
  subtitle: string;
  title: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.primarySoft }]}>
        <ThemedText style={[styles.emptyIconText, { color: theme.primary }]}>{icon}</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.emptyTitle}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.emptySubtitle}>
        {subtitle}
      </ThemedText>
      {actionLabel && onAction ? <PrimaryButton onPress={onAction}>{actionLabel}</PrimaryButton> : null}
    </View>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const translateY = useRef(new Animated.Value(-96)).current;
  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      setToast({ id: Date.now(), message, variant });
      Animated.timing(translateY, { duration: 180, toValue: 0, useNativeDriver: true }).start();
    },
    [translateY],
  );
  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }

    const timeout = setTimeout(() => {
      Animated.timing(translateY, { duration: 180, toValue: -96, useNativeDriver: true }).start(() => setToast(null));
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toast, translateY]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastBanner toast={toast} translateY={translateY} /> : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);

  if (!value) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return value;
}

function ToastBanner({ toast, translateY }: { toast: ToastMessage; translateY: Animated.Value }) {
  const theme = useTheme();
  const color =
    toast.variant === 'success'
      ? theme.successStrong
      : toast.variant === 'warning'
        ? theme.warningStrong
        : toast.variant === 'error'
          ? theme.dangerStrong
          : theme.accent;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        Shadow.md,
        {
          backgroundColor: theme.surfaceCard,
          borderColor: color,
          transform: [{ translateY }],
        },
      ]}>
      <View style={[styles.toastDot, { backgroundColor: color }]} />
      <ThemedText type="smallBold" style={styles.toastText}>
        {toast.message}
      </ThemedText>
    </Animated.View>
  );
}

export function BottomSheet({
  children,
  onDismiss,
  title,
  visible,
}: {
  children: ReactNode;
  onDismiss: () => void;
  title?: string;
  visible: boolean;
}) {
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(320)).current;
  const backdropOpacity = translateY.interpolate({
    inputRange: [0, 320],
    outputRange: [0.34, 0],
  });

  useEffect(() => {
    Animated.timing(translateY, {
      duration: 220,
      toValue: visible ? 0 : 320,
      useNativeDriver: true,
    }).start();
  }, [translateY, visible]);

  return (
    <Modal animationType="none" onRequestClose={onDismiss} transparent visible={visible}>
      <View style={styles.bottomSheetRoot}>
        <Pressable accessibilityRole="button" onPress={onDismiss} style={StyleSheet.absoluteFill}>
          <Animated.View style={[styles.bottomSheetBackdrop, { opacity: backdropOpacity }]} />
        </Pressable>
        <Animated.View
          style={[
            styles.bottomSheet,
            Shadow.md,
            {
              backgroundColor: theme.surfaceCard,
              borderColor: theme.border,
              transform: [{ translateY }],
            },
          ]}>
          {title ? <ThemedText type="title">{title}</ThemedText> : null}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    borderWidth: 1,
    gap: Spacing.md,
    maxHeight: '82%',
    padding: Spacing.lg,
    width: '100%',
  },
  bottomSheetBackdrop: {
    backgroundColor: '#020617',
    flex: 1,
  },
  bottomSheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  brandCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  brandLetter: {
    fontFamily: Fonts.sansHeavy,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.heavy,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.tight,
  },
  brandLetterCompact: {
    fontSize: Typography.fontSize.lg,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.tight,
  },
  brandMark: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    height: TouchTarget,
    justifyContent: 'center',
    width: TouchTarget,
  },
  brandMarkCompact: {
    height: 44,
    width: 44,
  },
  brandNameArabic: {
    fontSize: Typography.fontSize.md,
  },
  brandNameCompact: {
    fontSize: Typography.fontSize.base,
  },
  brandRow: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  brandRowCompact: {
    gap: Spacing.sm,
  },
  button: {
    alignItems: 'center',
    borderRadius: Radius.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: TouchTarget,
    minWidth: TouchTarget,
    paddingHorizontal: Spacing.lg,
  },
  buttonText: {
    fontFamily: Fonts.sansBold,
    fontSize: 17,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    overflow: 'hidden',
    padding: Spacing.md,
    position: 'relative',
  },
  cardAccent: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  content: {
    flex: 1,
    gap: Spacing.md,
    maxWidth: 800,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    width: '100%',
  },
  emptyIcon: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  emptyIconText: {
    fontFamily: Fonts.sansHeavy,
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.heavy,
  },
  emptyState: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  emptySubtitle: {
    maxWidth: 320,
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
  },
  iconButton: {
    alignItems: 'center',
    borderRadius: Radius.full,
    height: TouchTarget,
    justifyContent: 'center',
    width: TouchTarget,
  },
  iconButtonText: {
    fontFamily: Fonts.sansBold,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.tight,
  },
  pressed: {
    opacity: 0.84,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
    minHeight: TouchTarget,
    minWidth: TouchTarget,
    paddingHorizontal: Spacing.md,
  },
  secondaryButtonWrap: {
    flex: 1,
  },
  shell: {
    alignItems: 'center',
    flex: 1,
  },
  skeleton: {
    overflow: 'hidden',
  },
  statHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statIcon: {
    fontSize: Typography.fontSize.lg,
    lineHeight: Typography.fontSize.lg * Typography.lineHeight.tight,
  },
  statTile: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 124,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  syncDot: {
    borderRadius: Radius.full,
    height: 10,
    width: 10,
  },
  toast: {
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
    left: Spacing.md,
    minHeight: TouchTarget,
    paddingHorizontal: Spacing.md,
    position: 'absolute',
    right: Spacing.md,
    top: Spacing.lg,
    zIndex: 50,
  },
  toastDot: {
    borderRadius: Radius.full,
    height: 10,
    width: 10,
  },
  toastText: {
    flex: 1,
  },
  wordmarkRow: {
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
});
