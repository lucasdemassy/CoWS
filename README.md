# CoWS

*a Connected Weather Station*


## Continuous integration

This project works with **Github Actions** in order to allow all developers' working copies to merge to a shared mainline easily and automatically.


### Workflows
There are two workflows running for different git events. Their first steps are similar :
1. ##### build <br>
This action generate the jsdoc documentation thanks to  running in a NodeJS v12 environment. Next the html documentation is upload as a Github artifact and ready to deploy to a website.

2. ##### test <br>
Run the `npm start` & `npm test` commands in three different node versions (8.x, 10.x, 12.x). These 3 tests run simultaneously thanks to the strategy option `max-parallel`.



- <u>NodeJS CI</u> *(./.github/worflows/nodejs.yml)* <br> This workflow runs when an user **push on the master branch**. Several automatize actions happen when this event is triggered :

  3. ##### deploy <br>
  If the *build* and *test* actions have succeed, the workflow push the documentation artifact on the `gh-pages` branch linked to Github Page. This results in publishing the documentation on a website available [here](https://lucasdemassy.github.io/CoWS/).


- <u>NodeJS CI other branches</u> *(./.github/worflows/nodejs_other_branches.yml)* <br> This workflow runs when an user **push on a branch except the master and gh-pages ones**. Several automatize actions happen when this event is triggered :

  3. ##### deploy <br>
  If the *build* and *test* actions have succeed, the workflow push the documentation artifact on a new branch. This branch name starts by `gh-pages-` followed by the name of the branch. <br> The user can now access the documentation only by cloning the git repository and inspect the new branch. This step avoid to publish non-official documentation on the website but still can consult the documentation as a static-website.

![Branch rule](/images/Github_actions_CI.png)

### Branch protection rule
There is a rule to protect the `master` branch. This rule prevents merging from branches which didn't succeed the <u>NodeJS CI other branches</u> workflow.

![Branch rule](/images/master_rule_pull-request.png)

## install weatherStation on the raspberry

`cd weatherStation`

install dependencies :`npm install`

run the server : `npm start`

run test: `npm test`

## SSH:
Accès à la station météo sur la Raspberry Pi : `ssh pi@piensg011` avec le mot de passe : raspberry

Le dossier courant de la raspberryPi contient le projet courant nommé 'cows'

Pour redémarrer le serveur : `sudo systemctl restart site.service`

Pour obetnir le statut actuel du service : `sudo systemctl status site.service`

Pour redémarrer la simulation d'acquisition de données météorologiques toutes les 20 minutes : `sudo systemctl restart transf.service`

## Application FRONT

Pour utiliser l'application web de visualisation des données vous aurez besoin d'un server http.

Par exemple :
`npm install http-server -g`

Puis le lancer dans le dossier de votre clone du dépôt git:
`http-server`

Une fois le server lancé : se rendre à l'URL localhost:8080 (si votre port est le 80) pour lancer l'application.

Vous aurez alors le choix d'utiliser le mode d'acquisition de données ARCHIVE ou LIVE.

Dans les deux modes d'acquisition vous pourrez en cliquant directement sur les onglets près de la carte visualiser les données requettées par défaut par l'application (ARCHIVE le 1er Février 2020 entre minuit et 16h et LIVE sur la station PIENSG 11).

Pour choisir une nouvelle acquisition cliquer sur un des marqueurs de la carte et le selectionner comme station active. La nouvelle requête sera alors envoyée au serveur et les données correspondantes s'afficheront.

## ARCHIVE

Le mode ARCHIVE vous permet de choisir une période d'acquisition et les capteurs à requetter.

Si le calendrier fonctionne sous votre navigateur (ex: Chrome) :
 Choisir les dates grâce au calendrier et remplir les horaires.


Sinon (ex: Firefox) :
 Rentrer les dates sous le format ANNEE-MM-JJTHH:MM, par exemple 2020-02-01T16:00 pour le 1er Février 2020 à 16h.



## LIVE

Le mode LIVE vous permet de visionner les dernières acquisitions de chaque capteur et de choisir ceux à requetter.
