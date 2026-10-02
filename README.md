# Undercover Z

Le jeu de l'intrus, édition manga. Les civils reçoivent tous le même perso,
l'undercover en reçoit un proche, et Mr. White n'a rien du tout. À vous de
trouver qui n'est pas à sa place — à voix haute, ou en dessinant **un seul
trait chacun**.

Le jeu est en ligne ici : <https://undercover-z.github.io/undercover-z/>

---

## À quoi sert chaque fichier

| Fichier | Rôle |
|---|---|
| `index.html` | L'accueil : connexion, inscription, règles du jeu |
| `setup.html` | La préparation : où jouer, mode, mangas, joueurs et intrus |
| `partie.html` | L'écran de jeu : distribution, tours, dessin, vote, fin |
| `mots.js` | **La banque des 100 duos de persos** — le fichier à modifier le plus souvent |
| `jeu.js` | Les règles, et rien que les règles. Aucun HTML, aucun réseau |
| `partie.js` | La couture réseau : local aujourd'hui, en ligne demain |
| `config.js` | Les clés Supabase (à remplir pour le mode en ligne) |
| `supabase.sql` | La base de données du mode en ligne, à coller une fois dans Supabase |
| `manifest.json` | Permet d'installer le jeu sur l'écran d'accueil d'un téléphone |
| `.claude/` | Un petit serveur de test local. Aucun effet sur le site |

## Ajouter ou corriger des duos

Tout se passe dans `mots.js`, et le format est documenté en haut du fichier.
Un duo s'écrit toujours dans cet ordre :

```js
[ "perso des CIVILS", "perso de l'INFILTRÉ", "pourquoi ils se ressemblent" ]
```

Deux sections : `PUR_MANGA` (les deux persos viennent du même manga) et
`CROSSOVER` (chaque perso est suivi de la clé de son manga). Une clé de manga
inconnue affiche un avertissement dans la console du navigateur au lieu de
casser le jeu.

## Ajouter les images des persos

Rien à écrire dans le code : les chemins sont calculés depuis le nom.

```
img/persos/<manga>/<perso-en-minuscules-sans-accent>.jpg
```

Par exemple, Barbe Blanche (One Piece) va dans
`img/persos/onepiece/barbe-blanche.jpg`. Format carré, environ 400 pixels,
moins de 100 ko. Un perso sans image garde son nom et une silhouette.

## Les règles du jeu, en bref

- Une manche = de 1 à 3 tours (un indice ou un trait chacun par tour), puis un vote.
- Un civil parle toujours en premier : Mr. White n'a aucun mot, le faire
  commencer serait injouable pour lui.
- Les intrus ne gagnent que s'il ne reste **qu'un seul civil**. Éliminer un
  innocent ne met donc pas fin à la partie tant qu'il reste deux civils.
- Mr. White éliminé a droit à une tentative : s'il devine le perso des civils,
  les intrus gagnent sur le fil.
- Le nombre d'intrus est limité à la moitié des joueurs moins un, sinon la
  partie serait finie avant de commencer.

## Tester en local

Un double-clic sur `index.html` suffit pour le mode local. Pour servir le
site comme en ligne (utile pour le mode en ligne et les chemins d'images) :

```
powershell -File .claude\serve.ps1 -Root . -Port 8765
```

Puis <http://localhost:8765>.

## Mettre à jour le site

Le site se met à jour tout seul à chaque envoi sur la branche `main` :

```
git add .
git commit -m "ce que j'ai change"
git push
```

Compter une minute avant que GitHub Pages publie la nouvelle version.

## Ce qui n'est pas encore fait

- **Le mode en ligne** : la base de données et les règles de sécurité sont
  écrites (`supabase.sql`), il reste à brancher l'inscription réelle, les
  salons et la synchronisation des parties.
- **Les images des persos** : les emplacements sont prêts, les images non.
- **Les pubs** : les trois emplacements sont en place dans les pages. AdSense
  demande un nom de domaine à soi, les pages légales et un bandeau de
  consentement.
