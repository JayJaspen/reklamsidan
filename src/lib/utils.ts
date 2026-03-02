import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const SWEDISH_COUNTIES = [
  'Blekinge län',
  'Dalarnas län',
  'Gävleborgs län',
  'Gotlands län',
  'Hallands län',
  'Jämtlands län',
  'Jönköpings län',
  'Kalmar län',
  'Kronobergs län',
  'Norrbottens län',
  'Skåne län',
  'Stockholms län',
  'Södermanlands län',
  'Uppsala län',
  'Värmlands län',
  'Västerbottens län',
  'Västernorrlands län',
  'Västmanlands län',
  'Västra Götalands län',
  'Örebro län',
  'Östergötlands län',
  'E-handlare',
] as const

export const AGE_GROUPS = [
  { value: '18-25', label: '18–25 år' },
  { value: '26-35', label: '26–35 år' },
  { value: '36-45', label: '36–45 år' },
  { value: '46-55', label: '46–55 år' },
  { value: '56-65', label: '56–65 år' },
  { value: '65+',   label: '65+ år' },
] as const

export const BILLING_RATES = {
  favorit_b2c:  3,  // kr exkl. moms
  intresse_b2c: 3,
  generell_b2c: 1,
  favorit_b2b:  5,
  intresse_b2b: 5,
  generell_b2b: 3,
} as const

/** Beräknar ålder baserat på födelseår */
export function getAge(birthYear: number): number {
  return new Date().getFullYear() - birthYear
}

/** Kontrollerar att en person är minst 18 år */
export function isAdult(birthYear: number): boolean {
  return getAge(birthYear) >= 18
}

/** Formatera belopp i SEK */
export function formatSEK(amount: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    minimumFractionDigits: 0,
  }).format(amount)
}

/** Validera organisationsnummer (10 siffror, luhn-kompatibelt) */
export function isValidOrgNumber(orgNr: string): boolean {
  const digits = orgNr.replace(/\D/g, '')
  return digits.length === 10
}

/** Formatera organisationsnummer: 556XXX-XXXX */
export function formatOrgNumber(orgNr: string): string {
  const digits = orgNr.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 6)}-${digits.slice(6)}`
  }
  return orgNr
}

/** Åldersgrupp för ett födelseår */
export function getAgeGroup(birthYear: number): string {
  const age = getAge(birthYear)
  if (age <= 25) return '18-25'
  if (age <= 35) return '26-35'
  if (age <= 45) return '36-45'
  if (age <= 55) return '46-55'
  if (age <= 65) return '56-65'
  return '65+'
}
