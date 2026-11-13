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


## Phase 2 : NLP.js (13 novembre 2026)

Le [workflow NLP.js - Phase 2](.github/workflows/nlp-phase2.yml) compare quatre configurations :
1. modèle initial, score minimal 0,70 ;
2. même modèle, seuil conservateur 0,85 et marge de 0,15 par rapport à l'intention suivante ;
3. entraînement enrichi automatiquement avec trois formulations de politesse par phrase, score minimal 0,70 ;
4. même enrichissement, seuil conservateur 0,85 et marge 0,15.

**Limites méthodologiques importantes** :
- Les 40 questions de [validation](data/validation-40.json), dont 10 rejets, sont distinctes des exemples d'entraînement.
- Le corpus historique de 100 questions a déjà été examiné dans la phase 1. Il ne doit donc plus être présenté comme un test final totalement aveugle.
- Les enrichissements ajoutent uniquement des débuts de phrase simples aux 60 phrases d'entraînement. Ils ne correspondent pas à 180 exemples indépendants supplémentaires.
- L'ajout de contexte conversationnel n'est pas encore développé. Ce second test évalue la reconnaissance d'une question isolée.
- Si une configuration est choisie en fonction de ces 40 questions, une nouvelle évaluation totalement inédite sera indispensable.

Le fichier `results/nlp-phase2.csv` est exporté comme artefact GitHub Actions, avec chaque prédiction. Un workflow vert garantit seulement l'exécution technique : **consulter les chiffres et les erreurs** avant toute conclusion.

### Résultats effectivement mesurés

[GitHub Actions, exécution n° 43442142577](https://github.com/chaoli22000bzh/diagcore-chat-lab/actions/runs/43442142577), workflow réussi, quatre configurations exécutées sans erreur d'évaluation.

| Configuration | Validation 40 : correctes / erreurs / refus valides | Historique 100 : correctes / erreurs / refus valides |
|---|---|---|
| NLP.js initial | 23 / 3 / 14 | 51 / 15 / 34 |
| NLP.js initial prudent | 21 / 2 / 17 | 45 / 4 / 51 |
| NLP.js + ajouts automatiques | 22 / 12 / 6 | 51 / 29 / 20 |
| NLP.js + ajouts automatiques prudent | 21 / 7 / 12 | 50 / 17 / 33 |

Attention : « correctes » comprend les rejets corrects des questions hors sujet ; « erreurs » comprend les mauvaises intentions annoncées ; « refus valides » concerne les questions qui méritaient une intention mais ont été rejetées.

**Décision technique :** rejeter l'ajout mécanique de salutations comme stratégie d'entraînement. La version prudente limite fortement les mauvaises intentions, mais elle ne comprend pas assez de questions pour être proposée aux élèves. Aucune version n'est validée pour l'intégration à DiagCore.

**Prochaine piste, à expérimenter séparément :** intentions précisément définies, exemples indépendants couvrant plusieurs formulations réelles, distinction questions multiples / ambiguïtés / négations, puis reconnaissance contextuelle. Il faudra une nouvelle validation avant toute conclusion.
