# DiagCore Chat Lab

Laboratoire autonome de reconnaissance de questions rédigées en français. Ce dépôt est **indépendant de DiagCore V1.3** et des cours DHCP, DNS, Messagerie et Incidents : rien n'y est modifié.

## Objectif

Comparer équitablement **Fuse.js 7.5.0**, **MiniSearch 7.2.0** et **NLP.js 5.0.0-alpha.5**, sur un incident fictif d'accès à un dossier partagé, sans API d'IA payante.

Le jeu comporte :
- **60 phrases d'entraînement** : six par intention, regroupées dans [data/entrainement-60.json](data/entrainement-60.json).
- **100 questions de test distinctes** : 80 questions relevant de dix intentions et 20 questions volontairement hors sujet ou ambiguës, dans [data/questions-100.json](data/questions-100.json).

Il s'agit de phrases rédigées pour l'expérience, pas de questions réellement collectées auprès d'élèves. Les résultats ne seront donc pas une preuve de robustesse en classe.

## Deux possibilités de test

### Test automatique via GitHub Actions (recommandé)

Le workflow [Comparatif 100 questions](.github/workflows/benchmark.yml) installe les bibliothèques officielles dans Node.js et exécute automatiquement 100 questions par bibliothèque.

1. Ouvrir l'onglet **Actions** du dépôt.
2. Sélectionner **Comparatif 100 questions**.
3. Le workflow peut se déclencher à chaque modification du script ou des données. Pour le lancer explicitement : **Run workflow**, branche **main**.
4. Consulter les résultats dans les logs de l'étape « Exécuter les 300 interprétations » et télécharger l'artefact **rapport-diagcore-100-questions** contenant les résultats détaillés JSON et CSV.

Si une bibliothèque ne se charge pas, son absence est indiquée comme erreur technique : aucun score fictif n'est attribué.

### Test interactif dans le navigateur

La page [index.html](index.html) compare aussi les trois bibliothèques via des scripts publics de CDN. Elle affiche les résultats et permet de saisir une question personnelle.

Une fois GitHub Pages activé à partir de **main**, dossier **/**, l'URL est :

https://chaoli22000bzh.github.io/diagcore-chat-lab/

Les CDN ne sont utilisés **que pour ce laboratoire**. Une future intégration pédagogique devra héberger les scripts choisis localement pour ne pas dépendre d'un service extérieur.

**Attention :** l'import NLP.js depuis esm.sh dans le navigateur est expérimental. Le workflow GitHub Actions reste la référence pour tester ses modules officiels.

## Critères de comparaison

- Questions correctement comprises : intention attendue, ou rejet correct d'une question ambiguë / hors sujet.
- **Fausse intention annoncée :** erreur la plus problématique pédagogiquement.
- Demandes de reformulation sur une question valide : acceptable, mais à minimiser.
- Temps de traitement et simplicité d'intégration.

Les seuils de rejet initiaux sont fixés dans le code, **sans calibration sur les 100 questions de test**. Les changer après lecture des scores invaliderait une comparaison strictement indépendante : il faudrait alors créer un nouveau jeu de validation.

Un score élevé ne dispense pas d'un second essai avec des questions réellement inédites.

## Bibliothèques

- [Fuse.js](https://github.com/krisk/Fuse), Apache-2.0
- [MiniSearch](https://github.com/lucaong/minisearch), MIT
- [NLP.js](https://github.com/axa-group/nlp.js), MIT

La présence d'une licence à la création du dépôt n'est pas requise pour utiliser le laboratoire. Si du code tiers est copié et redistribué dans le dépôt, il faut respecter sa propre licence et ses mentions.

## Limites / statut

- Les fichiers, données et scripts du banc ont été publiés sur `main`.
- **Aucun classement n'est annoncé tant que l'exécution des trois bibliothèques n'a pas été constatée.**
- Pas de simulation de bibliothèque, pas de réponse générée par IA, pas de modification de DiagCore ou des cours.
