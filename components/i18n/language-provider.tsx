"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getLocaleDirection,
  getLocaleFromValue,
  localeCookieName,
  type Locale,
  type LocaleDirection,
} from "@/lib/i18n";
import { hasArabicText, translateArabicText } from "@/lib/i18n/dom-translations";

interface LanguageContextValue {
  direction: LocaleDirection;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  translate: (value: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const translatableAttributes = ["aria-label", "aria-description", "alt", "placeholder", "title"] as const;
const originalTextNodes = new WeakMap<Text, string>();
const originalAttributes = new WeakMap<Element, Map<string, string>>();

function preserveBoundaryWhitespace(originalValue: string, translatedValue: string): string {
  const leadingWhitespace = originalValue.match(/^\s*/u)?.[0] ?? "";
  const trailingWhitespace = originalValue.match(/\s*$/u)?.[0] ?? "";

  return `${leadingWhitespace}${translatedValue}${trailingWhitespace}`;
}

function shouldSkipElement(element: Element): boolean {
  if (element.closest("[data-no-translate]")) {
    return true;
  }

  return ["CANVAS", "CODE", "NOSCRIPT", "PRE", "SCRIPT", "STYLE", "SVG"].includes(element.tagName);
}

function translateTextNode(node: Text, locale: Locale): void {
  const parentElement = node.parentElement;

  if (!parentElement || shouldSkipElement(parentElement)) {
    return;
  }

  if (locale === "ar") {
    const originalValue = originalTextNodes.get(node);

    if (originalValue !== undefined && node.nodeValue !== originalValue) {
      node.nodeValue = originalValue;
    }

    return;
  }

  const currentValue = node.nodeValue ?? "";

  if (!hasArabicText(currentValue)) {
    return;
  }

  const translatedValue = translateArabicText(currentValue);

  if (translatedValue === currentValue) {
    return;
  }

  originalTextNodes.set(node, currentValue);
  node.nodeValue = preserveBoundaryWhitespace(currentValue, translatedValue);
}

function translateElementAttributes(element: Element, locale: Locale): void {
  if (shouldSkipElement(element)) {
    return;
  }

  let elementOriginalAttributes = originalAttributes.get(element);

  for (const attributeName of translatableAttributes) {
    const currentValue = element.getAttribute(attributeName);

    if (currentValue === null) {
      continue;
    }

    if (locale === "ar") {
      const originalValue = elementOriginalAttributes?.get(attributeName);

      if (originalValue !== undefined && currentValue !== originalValue) {
        element.setAttribute(attributeName, originalValue);
      }

      continue;
    }

    if (!hasArabicText(currentValue)) {
      continue;
    }

    const translatedValue = translateArabicText(currentValue);

    if (translatedValue === currentValue) {
      continue;
    }

    if (!elementOriginalAttributes) {
      elementOriginalAttributes = new Map<string, string>();
      originalAttributes.set(element, elementOriginalAttributes);
    }

    elementOriginalAttributes.set(attributeName, currentValue);
    element.setAttribute(attributeName, translatedValue);
  }
}

function translateDocument(locale: Locale): void {
  const body = document.body;

  if (!body) {
    return;
  }

  const textWalker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let currentNode = textWalker.nextNode();

  while (currentNode) {
    translateTextNode(currentNode as Text, locale);
    currentNode = textWalker.nextNode();
  }

  translateElementAttributes(body, locale);

  for (const element of Array.from(body.querySelectorAll("*"))) {
    translateElementAttributes(element, locale);
  }
}

function writeLocaleCookie(locale: Locale): void {
  document.cookie = `${localeCookieName}=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function LanguageProvider({ children, initialLocale }: { children: ReactNode; initialLocale: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocaleFromValue(initialLocale));
  const direction = getLocaleDirection(locale);

  const setLocale = useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    writeLocaleCookie(nextLocale);
  }, []);

  const translate = useCallback(
    (value: string) => {
      return locale === "en" ? translateArabicText(value) : value;
    },
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    document.documentElement.dataset.locale = locale;
    translateDocument(locale);

    let animationFrameId = 0;
    const observer = new MutationObserver(() => {
      window.cancelAnimationFrame(animationFrameId);
      animationFrameId = window.requestAnimationFrame(() => translateDocument(locale));
    });

    observer.observe(document.body, {
      attributeFilter: [...translatableAttributes],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      observer.disconnect();
    };
  }, [direction, locale]);

  const contextValue = useMemo<LanguageContextValue>(
    () => ({
      direction,
      locale,
      setLocale,
      translate,
    }),
    [direction, locale, setLocale, translate],
  );

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider.");
  }

  return context;
}
