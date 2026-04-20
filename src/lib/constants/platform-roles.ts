export const PLATFORM_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  FUNCTIONAL_LEAD: 'Domain Experte',
  DOMAIN_EXPERT: 'Domain Experte',
  USER: 'Mitarbeiter',
  MEMBER: 'Mitarbeiter',
}

export const PLATFORM_ROLE_BADGE: Record<string, {
  label: string
  bg: string
  text: string
}> = {
  ADMIN: {
    label: 'Admin',
    bg: 'bg-red-50',
    text: 'text-red-800',
  },
  FUNCTIONAL_LEAD: {
    label: 'Domain Experte',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  DOMAIN_EXPERT: {
    label: 'Domain Experte',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
  },
  USER: {
    label: 'Mitarbeiter',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
  MEMBER: {
    label: 'Mitarbeiter',
    bg: 'bg-green-50',
    text: 'text-green-800',
  },
}
