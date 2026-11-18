/** Turns a Firestore/network failure into a short, specific French message instead of a generic "try again". */
export function describeActionError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code
  if (code === 'permission-denied') return 'Envoi impossible, réessayez plus tard.'
  if (code === 'unavailable' || code === 'deadline-exceeded') return 'Connexion instable — vérifiez votre réseau et réessayez.'
  return 'Une erreur est survenue — réessayez.'
}
