import type { AppLocale } from "@/i18n/routing";
import { accountOverrides } from "@/messages/overrides/account";
import { adminOverrides } from "@/messages/overrides/admin";
import { authOverrides } from "@/messages/overrides/auth";
import { homeOverrides } from "@/messages/overrides/home";
import { matchesOverrides } from "@/messages/overrides/matches";
import { seatsOverrides } from "@/messages/overrides/seats";
import { sharedOverrides } from "@/messages/overrides/shared";

type MessageValue = unknown;
type MessageTree = Record<string, MessageValue>;
type LocaleOverride = Record<AppLocale, MessageTree>;

const overrideSets: LocaleOverride[] = [
  sharedOverrides,
  homeOverrides,
  authOverrides,
  matchesOverrides,
  seatsOverrides,
  accountOverrides,
  adminOverrides,
];

function isRecord(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeMessages(base: MessageValue | undefined, override: MessageValue | undefined): MessageValue | undefined {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(override)) {
    return override;
  }

  if (isRecord(base) && isRecord(override)) {
    const merged: MessageTree = { ...base };

    for (const [key, value] of Object.entries(override)) {
      merged[key] = mergeMessages(base[key], value) as MessageValue;
    }

    return merged;
  }

  return override;
}

export function getLocaleMessages(locale: AppLocale, baseMessages: MessageTree) {
  return overrideSets.reduce(
    (messages, overrides) => mergeMessages(messages, overrides[locale]) as MessageTree,
    baseMessages,
  );
}
