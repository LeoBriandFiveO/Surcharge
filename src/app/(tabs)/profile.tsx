import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Text, View } from 'react-native';

import { Avatar, Body, Button, Card, Input, Muted, Row, Screen, Stat, Subtitle, Title } from '@/components/ui';
import { Alert } from '@/lib/alert';
import { useAuth, useUserId } from '@/lib/auth';
import { PRIVACY_URL } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/theme';
import type { Profile } from '@/lib/types';

export default function ProfileScreen() {
  const userId = useUserId();
  const { profile, refreshProfile } = useAuth();
  const [following, setFollowing] = useState<Profile[]>([]);
  const [followers, setFollowers] = useState<Profile[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      supabase.from('follows').select('profiles!follows_following_id_fkey(id, username, display_name)').eq('follower_id', userId),
      supabase.from('follows').select('profiles!follows_follower_id_fkey(id, username, display_name)').eq('following_id', userId),
    ]);
    setFollowing(((a.data ?? []) as unknown as { profiles: Profile }[]).map((r) => r.profiles));
    setFollowers(((b.data ?? []) as unknown as { profiles: Profile }[]).map((r) => r.profiles));
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function search(text: string) {
    setQuery(text);
    const q = text.trim().replace(/[%_,()]/g, '');
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
      .neq('id', userId)
      .limit(20);
    setResults(data ?? []);
  }

  async function toggleFollow(target: Profile) {
    const isFollowing = following.some((p) => p.id === target.id);
    const { error } = isFollowing
      ? await supabase.from('follows').delete().match({ follower_id: userId, following_id: target.id })
      : await supabase.from('follows').insert({ following_id: target.id });
    if (error) Alert.alert('Erreur', error.message);
    load();
  }

  async function saveName() {
    if (displayName === null) return;
    await supabase.from('profiles').update({ display_name: displayName.trim() || null }).eq('id', userId);
    setDisplayName(null);
    refreshProfile();
  }

  function deleteAccount() {
    Alert.alert(
      'Supprimer ton compte ?',
      'Ton profil, tes programmes, tes séances, tes commentaires et tes abonnements seront définitivement effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer définitivement',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.rpc('delete_my_account');
            if (error) {
              Alert.alert('Erreur', error.message);
              return;
            }
            await supabase.auth.signOut();
          },
        },
      ],
    );
  }

  const name = profile?.display_name ?? profile?.username ?? '';

  function PersonRow({ p }: { p: Profile }) {
    const isFollowing = following.some((f) => f.id === p.id);
    return (
      <Row style={{ paddingVertical: 4 }}>
        <Avatar name={p.display_name ?? p.username} size={36} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>{p.display_name ?? p.username}</Body>
          <Muted style={{ fontSize: 12 }}>@{p.username}</Muted>
        </View>
        <Button
          variant={isFollowing ? 'secondary' : 'primary'}
          title={isFollowing ? 'Suivi ✓' : 'Suivre'}
          onPress={() => toggleFollow(p)}
          style={{ minHeight: 36 }}
        />
      </Row>
    );
  }

  return (
    <Screen>
      <Title>Profil</Title>
      <Card index={0}>
        <Row>
          <Avatar name={name || '?'} size={56} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontSize: 20, fontWeight: '800' }}>{name}</Body>
            <Muted>@{profile?.username}</Muted>
          </View>
        </Row>
        <Row>
          <Stat label="Abonnements" value={String(following.length)} />
          <Stat label="Abonnés" value={String(followers.length)} />
        </Row>
        {displayName === null ? (
          <Button variant="ghost" title="Modifier mon nom affiché" onPress={() => setDisplayName(profile?.display_name ?? '')} />
        ) : (
          <Row>
            <View style={{ flex: 1 }}>
              <Input value={displayName} onChangeText={setDisplayName} placeholder="Nom affiché" />
            </View>
            <Button title="OK" onPress={saveName} />
          </Row>
        )}
      </Card>

      <Subtitle>Trouver des amis</Subtitle>
      <Muted>Suis tes amis pour voir leurs séances dans ton fil. Ils doivent te suivre pour voir les tiennes.</Muted>
      <Input value={query} onChangeText={search} placeholder="Rechercher un pseudo…" autoCapitalize="none" autoCorrect={false} />
      {results.length > 0 && (
        <Card>
          {results.map((p) => (
            <PersonRow key={p.id} p={p} />
          ))}
        </Card>
      )}
      {query.trim().length >= 2 && results.length === 0 && <Muted>Personne trouvé.</Muted>}

      {following.length > 0 && (
        <>
          <Subtitle>Je suis</Subtitle>
          <Card>
            {following.map((p) => (
              <PersonRow key={p.id} p={p} />
            ))}
          </Card>
        </>
      )}

      {followers.filter((p) => !following.some((f) => f.id === p.id)).length > 0 && (
        <>
          <Subtitle>Ils te suivent</Subtitle>
          <Card>
            {followers
              .filter((p) => !following.some((f) => f.id === p.id))
              .map((p) => (
                <PersonRow key={p.id} p={p} />
              ))}
          </Card>
        </>
      )}

      <Button variant="danger" title="Se déconnecter" onPress={() => supabase.auth.signOut()} />
      <Button variant="danger" title="Supprimer mon compte" onPress={deleteAccount} />
      <Muted style={{ textAlign: 'center', fontSize: 12 }}>
        <Text style={{ color: colors.muted, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(PRIVACY_URL)}>
          Politique de confidentialité
        </Text>
      </Muted>
    </Screen>
  );
}
