import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';

export type LogoProps = {
  variant: 'mark' | 'full' | 'full-en';
  color?: 'primary' | 'white' | 'dark';
  size?: number;
};

const logoColors: Record<NonNullable<LogoProps['color']>, string> = {
  primary: '#0f766e',
  white: '#ffffff',
  dark: '#020617',
};

function LogoMark({ color, size }: { color: string; size: number }) {
  const strokeWidth = Math.max(2.25, size * 0.06);
  const innerStrokeWidth = Math.max(2, size * 0.052);

  return (
    <View style={[styles.mark, { height: size, width: size }]}>
      <View
        style={[
          styles.pinLoop,
          {
            borderColor: color,
            borderRadius: size * 0.27,
            borderWidth: strokeWidth,
            height: size * 0.66,
            left: size * 0.17,
            top: size * 0.08,
            width: size * 0.66,
          },
        ]}
      />
      <View
        style={[
          styles.pinPoint,
          {
            borderBottomColor: color,
            borderBottomWidth: strokeWidth,
            borderRightColor: color,
            borderRightWidth: strokeWidth,
            borderRadius: size * 0.06,
            height: size * 0.3,
            left: size * 0.35,
            top: size * 0.58,
            width: size * 0.3,
          },
        ]}
      />
      <View
        style={[
          styles.meemBase,
          {
            backgroundColor: color,
            height: innerStrokeWidth,
            left: size * 0.27,
            top: size * 0.58,
            width: size * 0.46,
          },
        ]}
      />
      <View
        style={[
          styles.meemStem,
          {
            backgroundColor: color,
            height: size * 0.18,
            left: size * 0.27,
            top: size * 0.42,
            width: innerStrokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.meemStem,
          {
            backgroundColor: color,
            height: size * 0.18,
            left: size * 0.7,
            top: size * 0.42,
            width: innerStrokeWidth,
          },
        ]}
      />
      <View
        style={[
          styles.meemSquare,
          {
            backgroundColor: color,
            borderRadius: size * 0.02,
            height: size * 0.12,
            left: size * 0.44,
            top: size * 0.45,
            width: size * 0.12,
          },
        ]}
      />
    </View>
  );
}

export function Logo({ color = 'primary', size = 48, variant }: LogoProps) {
  const resolvedColor = logoColors[color];

  if (variant === 'mark') {
    return <LogoMark color={resolvedColor} size={size} />;
  }

  const isEnglish = variant === 'full-en';
  const wordmarkSize = size * 0.62;

  return (
    <View style={[styles.lockup, { gap: Spacing.two, minHeight: size }]}>
      <LogoMark color={resolvedColor} size={size} />
      {isEnglish ? (
        <Text style={[styles.wordmark, styles.wordmarkLatin, { color: resolvedColor, fontSize: wordmarkSize, lineHeight: size }]}>
          Mawqi3
        </Text>
      ) : (
        <Text style={[styles.wordmark, styles.wordmarkArabic, { color: resolvedColor, fontSize: wordmarkSize, lineHeight: size }]}>
          موقعي
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  mark: {
    position: 'relative',
  },
  meemBase: {
    borderRadius: 999,
    position: 'absolute',
  },
  meemSquare: {
    position: 'absolute',
  },
  meemStem: {
    borderRadius: 999,
    position: 'absolute',
  },
  pinLoop: {
    position: 'absolute',
  },
  pinPoint: {
    position: 'absolute',
    transform: [{ rotate: '45deg' }],
  },
  superscript: {
    fontFamily: Fonts.sans,
    fontWeight: '800',
    lineHeight: 20,
  },
  wordmark: {
    fontFamily: Fonts.sans,
    fontWeight: '800',
    includeFontPadding: false,
    letterSpacing: 0,
  },
  wordmarkArabic: {
    writingDirection: 'rtl',
  },
  wordmarkLatin: {
    writingDirection: 'ltr',
  },
});
