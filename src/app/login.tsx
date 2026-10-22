import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { Button, Card, Input, Muted, Screen } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import { colors, space } from '@/lib/theme';

export default function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        return;
      }
      const name = username.trim().toLowerCase();
      if (!/^[a-z0-9_.]{3,30}$/.test(name)) {
        Alert.alert('Pseudo invalide', '3 à 30 caractères : lettres, chiffres, « _ » ou « . ».');
        return;
      }
      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', name)
        .maybeSingle();
      if (taken) {
        Alert.alert('Pseudo déjà pris', 'Choisis-en un autre.');
        return;
      }
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username: name } },
      });
      if (error) throw error;
      if (!data.session) {
        Alert.alert('Vérifie tes e-mails', 'Clique sur le lien de confirmation puis connecte-toi.');
        setMode('signin');
      }
    } catch (e) {
      Alert.alert('Oups', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen>
        <View style={{ marginTop: space.xl * 2, marginBottom: space.lg, gap: space.xs }}>
          <Text style={{ color: colors.accent, fontSize: 40, fontWeight: '900' }}>Suivi Muscu</Text>
          <Muted>Tes séances, tes charges, tes potes.</Muted>
        </View>
        <Card style={{ gap: space.md }}>
          {mode === 'signup' && (
            <Input
              label="Pseudo"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="leo_muscu"
            />
          )}
          <Input
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholder="toi@exemple.fr"
          />
          <Input
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="6 caractères minimum"
          />
          <Button
            title={mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
            onPress={submit}
            loading={loading}
            disabled={!email || password.length < 6}
          />
        </Card>
        <Button
          variant="ghost"
          title={mode === 'signin' ? "Pas de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
          onPress={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
        />
      </Screen>
    </KeyboardAvoidingView>
  );
}
