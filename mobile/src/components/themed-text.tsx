import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, ThemeColor, Typography } from '@/constants/theme';
import { useLanguage } from '@/contexts/language-context';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const { isRtl } = useLanguage();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'], textAlign: isRtl ? 'right' : 'left', writingDirection: isRtl ? 'rtl' : 'ltr' },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: Fonts.sansMedium,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    fontWeight: Typography.fontWeight.medium,
  },
  smallBold: {
    fontFamily: Fonts.sansBold,
    fontSize: Typography.fontSize.sm,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    fontWeight: Typography.fontWeight.bold,
  },
  default: {
    fontFamily: Fonts.sans,
    fontSize: Typography.fontSize.base,
    lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
    fontWeight: Typography.fontWeight.regular,
  },
  title: {
    fontFamily: Fonts.sansHeavy,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.heavy,
    lineHeight: Typography.fontSize.xl * Typography.lineHeight.tight,
  },
  subtitle: {
    fontFamily: Fonts.sansHeavy,
    fontSize: Typography.fontSize.xxl,
    lineHeight: Typography.fontSize.xxl * Typography.lineHeight.tight,
    fontWeight: Typography.fontWeight.heavy,
  },
  link: {
    fontFamily: Fonts.sansMedium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    fontSize: Typography.fontSize.sm,
  },
  linkPrimary: {
    fontFamily: Fonts.sansMedium,
    lineHeight: Typography.fontSize.sm * Typography.lineHeight.relaxed,
    fontSize: Typography.fontSize.sm,
    color: '#3c87f7',
  },
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
