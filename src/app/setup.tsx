import { Body, Card, Muted, Screen, Title } from '@/components/ui';

// Affiché tant que les clés Supabase ne sont pas renseignées dans .env.
export default function Setup() {
  return (
    <Screen>
      <Title>Configuration requise</Title>
      <Card>
        <Body>Il manque la connexion à Supabase.</Body>
        <Muted>
          Copie le fichier .env.example en .env, renseigne EXPO_PUBLIC_SUPABASE_URL et
          EXPO_PUBLIC_SUPABASE_ANON_KEY, puis relance « npx expo start ». Tout est expliqué dans le
          README.
        </Muted>
      </Card>
    </Screen>
  );
}
