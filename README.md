# Suivi Muscu 🏋️

Application mobile (Android et iPhone) pour suivre tes séances de musculation :

- **Programmes** : crée tes séances types (Push, Pull, Jambes…) avec, pour chaque exercice, le nombre de séries, ta fourchette de répétitions et l'incrément de charge.
- **À la salle** : lance une séance, l'app te dit pour chaque exercice **quelle charge et combien de reps faire**, calculé à partir de tes séances précédentes. Tu valides chaque série d'un tap, un minuteur de repos se lance (vibration à la fin).
- **Progression automatique** (double progression) :
  - tu montes d'abord les reps dans ta fourchette (ex. 8 → 12) ;
  - quand toutes tes séries atteignent le max, la charge augmente de l'incrément (ex. +2,5 kg) et tu repars au min de la fourchette ;
  - si tu rates deux séances de suite à la même charge, l'app propose un deload de 10 %.
  - Les séries d'échauffement plus légères sont ignorées dans le calcul.
- **Progrès** : historique, volume du mois, 1RM estimé et graphique par exercice.
- **Social façon Strava** : suis tes amis, vois leurs séances dans ton fil, donne des 💪 et commente. Chaque séance peut être partagée ou privée.

Stack : [Expo](https://expo.dev) (React Native, SDK 58, Expo Router) + [Supabase](https://supabase.com) (comptes, base Postgres, règles de sécurité).

## Installation (≈ 15 minutes)

### 1. Créer la base Supabase (gratuit)

1. Crée un compte sur [supabase.com](https://supabase.com) puis un nouveau projet.
2. Dans **SQL Editor** → **New query**, colle tout le contenu de [`supabase/schema.sql`](supabase/schema.sql) et clique **Run**.
3. Dans **Authentication** → **Sign In / Providers** → **Email**, désactive **Confirm email** si tu veux pouvoir te connecter sans valider d'e-mail (plus simple pour commencer).
4. Dans **Project Settings** → **API** (ou **API Keys**), récupère l'**URL du projet** et la clé **anon / publishable**.

### 2. Configurer l'app sur ton ordinateur

Il te faut [Node.js](https://nodejs.org) 20 ou plus.

```bash
git clone https://github.com/LeoBriandFiveO/suivi-muscu.git
cd suivi-muscu
npm install
cp .env.example .env    # puis remplis les deux valeurs Supabase dans .env
```

### 3. Lancer l'app sur ton téléphone

1. Installe **Expo Go** sur ton téléphone (App Store ou Google Play).
2. Sur l'ordinateur : `npx expo start`
3. Scanne le QR code affiché : avec l'appareil photo sur iPhone, depuis Expo Go sur Android.

Le téléphone et l'ordinateur doivent être sur le même Wi-Fi. Sinon : `npx expo start --tunnel`.

### 4. Avoir l'app installée « pour de vrai » (sans ordinateur à la salle)

Expo Go a besoin que l'ordinateur tourne. Pour une vraie app installée :

```bash
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview   # fichier .apk à installer directement
```

Pense à ajouter tes deux variables `EXPO_PUBLIC_SUPABASE_*` dans les variables d'environnement EAS (`npx eas-cli@latest env:create`) ou dans `eas.json`. Sur iPhone, une installation hors Expo Go demande un compte Apple Developer (99 €/an) ; Expo Go reste gratuit.

## Inviter des amis

Tes amis installent l'app (Expo Go + ton lien, ou l'APK), créent un compte, puis vous vous suivez depuis l'onglet **Profil** en cherchant vos pseudos. Tu vois dans ton fil les séances partagées des personnes que tu suis.

## Développement

```bash
npm test           # tests de l'algorithme de progression
npm run typecheck  # vérification TypeScript
```

Code :

- `src/lib/progression.ts` : calcul des charges et reps suggérées
- `src/app/workout/[id].tsx` : écran de séance en cours
- `src/app/(tabs)/` : onglets Séance, Fil, Progrès, Profil
- `supabase/schema.sql` : tables et règles de visibilité (je vois mes données + les séances publiques des gens que je suis)
