import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

import { useLanguage } from '@/contexts/language-context';
import { useThemeMode } from '@/contexts/theme-context';

export default function AppTabs() {
  const { theme } = useThemeMode();
  const { strings } = useLanguage();
  const tabs = strings.tabs;

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.backgroundSelected}
      labelStyle={{ selected: { color: theme.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{tabs.home}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="scan">
        <NativeTabs.Trigger.Label>{tabs.scan}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="drafts">
        <NativeTabs.Trigger.Label>{tabs.drafts}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/explore.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{tabs.settings}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
