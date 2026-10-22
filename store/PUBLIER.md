# Publier Surcharge sur l'App Store et Google Play

L'app est prête techniquement : identifiants `com.leobriand.surcharge`, icône, `eas.json`, suppression de compte dans l'app, politique de confidentialité. Les builds et l'envoi aux stores passent par **EAS** (service d'Expo) : pas besoin de Mac ni d'Android Studio.

## Ce que toi seul peux faire (comptes et paiements)

| Compte | Prix | Délai |
|---|---|---|
| [Expo](https://expo.dev/signup) | Gratuit (30 builds/mois) | Immédiat |
| [Apple Developer Program](https://developer.apple.com/programs/enroll/) | 99 €/an | 1 à 2 jours (vérification d'identité) |
| [Google Play Console](https://play.google.com/console/signup) | 25 $ une fois | Quelques jours (vérification d'identité) |

⚠️ **Google Play, compte personnel récent** : avant de pouvoir publier en production, Google exige un **test fermé avec au moins 12 testeurs pendant 14 jours** d'affilée. Tes potes de salle sont parfaits pour ça.

## iPhone : TestFlight puis App Store

```bash
npx eas-cli@latest login
npx eas-cli@latest init                       # relie le projet à ton compte Expo
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios      # envoie le build sur App Store Connect
```

EAS te demande tes identifiants Apple et crée seul les certificats. Une fois le build sur App Store Connect :

1. **TestFlight** : ajoute-toi comme testeur interne → tu installes l'app sur ton iPhone via l'app TestFlight (quelques minutes). Tu peux inviter jusqu'à 10 000 testeurs externes par lien (petite vérification Apple d'environ 24 h).
2. **App Store** : remplis la fiche (textes dans [`fiche-store.md`](fiche-store.md)), ajoute des captures d'écran 6,9" (iPhone 16 Pro Max) et soumets. Revue Apple : 1 à 3 jours en général.

Pour la revue Apple, crée un compte de démo (ex. `demo@surcharge.app`) avec un programme et 2 ou 3 séances, et donne ses identifiants dans « Informations pour la revue ».

## Android : Google Play

```bash
npx eas-cli@latest build --platform android --profile production   # fichier .aab
npx eas-cli@latest submit --platform android                        # piste « internal »
```

La première fois, Google demande d'envoyer le `.aab` à la main dans la Play Console (Tests internes → Créer une version). `eas submit` a besoin d'une clé de compte de service Google : suis le lien que la commande affiche.

Puis : Test interne → Test fermé (12 testeurs, 14 jours) → Production.

Pour juste installer l'app sur un Android sans passer par le store : `npx eas-cli@latest build --platform android --profile preview` produit un `.apk` installable directement.

## Formulaires à remplir dans les stores

- **Politique de confidentialité** : https://claude.ai/artifact/LCWnpYijKkNYwe6mDrbsVh (à partager publiquement depuis le menu « Share » de la page avant de soumettre, ou à recopier sur ton propre site).
- **Suppression de compte** : dans l'app, Profil → Supprimer mon compte. Google demande aussi une URL : la politique de confidentialité l'explique.
- **Apple « App Privacy » / Google « Sécurité des données »** : données collectées = adresse e-mail, nom d'utilisateur, contenu créé par l'utilisateur (séances, commentaires). Liées à l'identité, non utilisées pour le suivi publicitaire, non partagées avec des tiers, chiffrées en transit, suppression possible.
- **Classification du contenu** : contenu généré par les utilisateurs (commentaires) → l'app permet de supprimer ses propres commentaires.
- **Chiffrement (Apple)** : déjà déclaré dans `app.json` (`ITSAppUsesNonExemptEncryption: false`), uniquement HTTPS standard.

## Mettre à jour l'app plus tard

Change `version` dans `app.json` pour une nouvelle version visible, relance `build` puis `submit`. Le numéro de build s'incrémente tout seul.
