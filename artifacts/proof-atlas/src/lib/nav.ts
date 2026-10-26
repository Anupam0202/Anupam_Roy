export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: "Portfolio", href: "/portfolio/" },
  { label: "Workbench", href: "/workbench/" },
  { label: "Lab", href: "/lab/" },
  { label: "Experience", href: "/experience/" },
  { label: "Credentials", href: "/credentials/" },
  { label: "About", href: "/about/" },
];

export const contactNav: NavItem = { label: "Contact", href: "/contact/" };

export const footerNav: NavItem[] = [
  ...primaryNav,
  contactNav,
  { label: "Sources", href: "/sources/" },
  { label: "Privacy", href: "/privacy/" },
];

/** True when `current` is `href` or inside it (home only matches exactly). */
export function isCurrent(current: string, href: string): boolean {
  const norm = (p: string) => (p.endsWith("/") ? p : `${p}/`);
  if (href === "/") return norm(current) === "/";
  return norm(current).startsWith(href);
}
