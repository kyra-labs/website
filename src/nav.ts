import type { NavigationDestination } from '@kyralabs/m3e-react';

/** Primary destinations: text buttons in the top app bar (expanded), the navigation bar below. */
export interface NavLink extends NavigationDestination {
  href: string;
  /** "Say hello": the filled button in the top app bar. */
  isPrimary?: boolean;
}

const link = (key: string, label: string, icon: string, prefix: string): NavLink => ({
  key,
  label,
  icon,
  href: `${prefix}#${key}`,
});

export const homeNav: NavLink[] = [
  link('about', 'About', 'info', ''),
  link('antecedent', 'Antecedent', 'history', ''),
  link('spenzia', 'Spenzia', 'account_balance_wallet', ''),
  link('developer', 'Developer', 'code', ''),
  { ...link('contact', 'Say hello', 'mail', ''), isPrimary: true },
];

export const privacyNav: NavLink[] = [
  link('about', 'About', 'info', '/'),
  link('spenzia', 'Spenzia', 'account_balance_wallet', '/'),
  link('developer', 'Developer', 'code', '/'),
  { ...link('contact', 'Say hello', 'mail', '/'), isPrimary: true },
];
