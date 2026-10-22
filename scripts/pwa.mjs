// Après `expo export --platform web` : rend la version web installable sur l'écran d'accueil
// (iPhone : Safari > Partager > Sur l'écran d'accueil) et compatible avec GitHub Pages.
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const base = '/Surcharge';
const file = 'dist/index.html';
let html = readFileSync(file, 'utf8');

html = html.replace(
  /<meta name="viewport"[^>]*>/,
  '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">',
);
html = html.replace(
  '</head>',
  [
    `<link rel="manifest" href="${base}/manifest.webmanifest">`,
    `<link rel="apple-touch-icon" href="${base}/apple-touch-icon.png">`,
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="apple-mobile-web-app-title" content="Surcharge">',
    '<meta name="theme-color" content="#0E0F12">',
    '<style>html,body{background:#0E0F12}</style>',
    '</head>',
  ].join('\n'),
);
html = html.replace(/<html lang="[^"]*"/, '<html lang="fr"');
writeFileSync(file, html);

// GitHub Pages renvoie 404.html pour les chemins inconnus : on y sert l'app pour que les liens profonds marchent.
copyFileSync(file, 'dist/404.html');
writeFileSync('dist/.nojekyll', '');
console.log('PWA prête dans dist/');
