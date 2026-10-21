import type { NavigationDestination } from '@kyralabs/m3e-react';

/** Primary destinations: text buttons in the top app bar (expanded), the navigation bar below. */
export interface NavLink extends NavigationDestination {
  href: string;
  /** "Say hello": the filled button in the top app bar. */
  isPrimary?: boolean;
  /**
   * Only in the top app bar, from large windows (1200dp): the navigation bar holds at most five
   * destinations (M3), and the expanded app bar has no room for more.
   */
  isWide?: boolean;
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
  { ...link('pingogram', 'Pingogram', 'devices', ''), isWide: true },
  { ...link('m3exp-web', 'M3 Expressive Web', 'layers', ''), isWide: true },
  link('developer', 'Developer', 'code', ''),
  { ...link('contact', 'Say hello', 'mail', ''), isPrimary: true },
];

export const privacyNav: NavLink[] = [
  link('about', 'About', 'info', '/'),
  link('spenzia', 'Spenzia', 'account_balance_wallet', '/'),
  { ...link('pingogram', 'Pingogram', 'devices', '/'), isWide: true },
  { ...link('m3exp-web', 'M3 Expressive Web', 'layers', '/'), isWide: true },
  link('developer', 'Developer', 'code', '/'),
  { ...link('contact', 'Say hello', 'mail', '/'), isPrimary: true },
];
