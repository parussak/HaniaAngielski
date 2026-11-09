export function firebaseMessage(error: unknown) {
  const code=(error as {code?:string})?.code;
  const messages: Record<string,string>={
    'auth/invalid-credential':'Nieprawidłowy e-mail lub hasło.',
    'auth/invalid-email':'Sprawdź adres e-mail.',
    'auth/wrong-password':'Obecne hasło jest nieprawidłowe.',
    'auth/requires-recent-login':'Potwierdź dostęp obecnym hasłem lub zaloguj się ponownie.',
    'auth/user-token-expired':'Zaloguj się ponownie, aby kontynuować.',
    'auth/invalid-new-email':'Sprawdź nowy adres e-mail.',
    'auth/email-already-in-use':'Ten adres ma już konto. Zaloguj się lub użyj odzyskiwania hasła.',
    'auth/weak-password':'Wybierz dłuższe hasło (co najmniej 8 znaków).',
    'auth/too-many-requests':'Za dużo prób. Odczekaj chwilę i spróbuj ponownie.',
    'auth/operation-not-allowed':'W projekcie Firebase trzeba włączyć logowanie E-mail/hasło.',
    'auth/network-request-failed':'Brak połączenia z kontem. Sprawdź internet; lokalne postępy są zachowane.',
    'auth/unauthorized-domain':'Dodaj adres tej strony w Firebase → Authentication → Authorized domains.',
    'permission-denied':'Nie udało się uzyskać dostępu do wyników. Sprawdź reguły Firestore i zaloguj się ponownie.',
    'unavailable':'Chmura jest chwilowo niedostępna. Postępy pozostają na tym urządzeniu.',
    'deadline-exceeded':'Połączenie trwa zbyt długo. Postępy pozostają na tym urządzeniu.',
  };
  return messages[code??'']??(error instanceof Error && !code?error.message:'Nie udało się połączyć z Firebase. Sprawdź konfigurację projektu i połączenie. Postępy na urządzeniu są zachowane.');
}
