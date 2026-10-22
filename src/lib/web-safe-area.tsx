import { useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import { SafeAreaInsetsContext, type EdgeInsets } from 'react-native-safe-area-context';

const zero: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

// Lit les marges de sécurité de l'iPhone (encoche, barre d'accueil) directement depuis le CSS.
function readInsets(): EdgeInsets {
  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;' +
    'padding-top:env(safe-area-inset-top,0px);padding-right:env(safe-area-inset-right,0px);' +
    'padding-bottom:env(safe-area-inset-bottom,0px);padding-left:env(safe-area-inset-left,0px)';
  document.body.appendChild(probe);
  const s = getComputedStyle(probe);
  const insets = {
    top: parseFloat(s.paddingTop) || 0,
    right: parseFloat(s.paddingRight) || 0,
    bottom: parseFloat(s.paddingBottom) || 0,
    left: parseFloat(s.paddingLeft) || 0,
  };
  probe.remove();
  return insets;
}

/**
 * Sur le web (app ajoutée à l'écran d'accueil), la mesure de react-native-safe-area-context
 * peut renvoyer 0 : on fournit nous-mêmes les marges à toute l'app.
 */
export function WebSafeArea({ children }: { children: ReactNode }) {
  const [insets, setInsets] = useState<EdgeInsets>(zero);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const update = () => setInsets(readInsets());
    update();
    // iOS met parfois à jour env() juste après le chargement.
    const t = setTimeout(update, 300);
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  if (Platform.OS !== 'web') return <>{children}</>;
  return <SafeAreaInsetsContext.Provider value={insets}>{children}</SafeAreaInsetsContext.Provider>;
}
