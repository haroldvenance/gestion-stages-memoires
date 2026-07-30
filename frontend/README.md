# Frontend — Plateforme de Gestion des Stages et Mémoires Académiques

Interface React (Vite + Tailwind CSS v4) pour les trois espaces de la
plateforme : étudiant, encadreur et administration.

## 1. Installation

```bash
npm install
npm run dev
```

L'application est disponible sur `http://localhost:5173`. En développement,
les appels `/api/...` sont automatiquement redirigés vers le backend Django
sur `http://localhost:8000` (voir `vite.config.js`). Démarrez donc le
backend en parallèle (voir le `README.md` du dossier backend).

## 2. Tests

```bash
npm run test          # Vitest, une seule passe
npm run test:watch    # mode watch
```

## 3. Build de production

```bash
npm run build     # génère ./dist
npm run preview   # sert le build localement pour vérification
```

Déployez le contenu de `dist/` sur un hébergeur statique (Netlify, Vercel,
Nginx…). Si le frontend n'est pas servi depuis le même domaine que l'API,
adaptez `baseURL` dans `src/api/client.js`.

## 4. Comptes de démonstration

Si vous avez exécuté `python manage.py seed_demo` côté backend :

| Rôle       | Identifiant | Mot de passe     |
|------------|-------------|-------------------|
| Admin      | `admin`     | `Admin1234!`      |
| Encadreur  | `kamga`     | `Encadreur1234!`  |
| Étudiant   | `25S07401`  | `Etudiant1234!`   |

## 5. Identité visuelle

- **Typographies** : Sora (titres) / Inter (interface), chargées localement
  via `@fontsource` — aucune dépendance à un CDN externe.
- **Palette** : encre navy (`--color-ink`), bleu académique
  (`--color-academic`), parchemin (`--color-parchment`), sceau or
  (`--color-gold`) — cf. `src/index.css`.
- **Signature** : les statuts de dossier sont affichés comme des « tampons »
  (`StatusStamp`), et un sceau stylisé (`Seal.jsx`) rappelle l'identité de
  la faculté sur l'écran de connexion.

## 6. Structure

```
src/
  api/            client axios + rafraîchissement JWT automatique, endpoints groupés
  context/        AuthContext (session, utilisateur courant)
  components/     UI partagée (Card, Button, StatusStamp, ChatPanel, DashboardLayout…)
  routes/         garde d'authentification par rôle
  pages/
    etudiant/     tableau de bord, demande, documents, messagerie, soutenance
    encadreur/    tableau de bord, demandes reçues, étudiants, messagerie, soutenances
    admin/        tableau de bord, demandes, quotas, soutenances, entreprises, comptes, statistiques, audit
```
