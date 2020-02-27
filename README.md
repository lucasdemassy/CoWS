# CoWS

*a Connected Weather Station*





### install weatherStation on the raspberry

`cd weatherStation`

install depedencies :`npm install`

run the server : `npm start`

run test: `npm test`

### SSH:
Accès à la station météo sur la Raspberry Pi : `ssh pi@piensg011` avec le mot de passe : raspberry

Le dossier courant de la raspberryPi contient le projet courant nommé 'cows'

Pour redémarrer le serveur : `sudo systemctl restart site.service`

Pour obetnir le statut actuel du service : `sudo systemctl status site.service`

Pour redémarrer la simulation d'acquisition de données météorologiques toutes les 20 minutes : `sudo systemctl restart transf.service`

### Application FRONT

Pour utiliser l'application web de visualisation des données vous aurez besoin d'un server http. 

Par exemple :
`npm install http-server -g`

Puis le lancer dans le dossier de votre clone du dépôt git:
`http-server`

Une fois le server lancé : se rendre à l'URL localhost:8080 (si votre port est le 80) pour lancer l'application.

Vous aurez alors le choix d'utiliser le mode d'acquisition de données ARCHIVE ou LIVE. 

Dans les deux modes d'acquisition vous pourrez en cliquant directement sur les onglets près de la carte visualiser les données requettées par défaut par l'application (ARCHIVE le 1er Février 2020 entre minuit et 16h et LIVE sur la station PIENSG 11).

Pour choisir une nouvelle acquisition cliquer sur un des marqueurs de la carte et le selectionner comme station active. La nouvelle requête sera alors envoyée au serveur et les données correspondantes s'afficheront.

### ARCHIVE

Le mode ARCHIVE vous permet de choisir une période d'acquisition et les capteurs à requetter. 

Si le calendrier fonctionne sous votre navigateur (ex: Chrome) : 
 Choisir les dates grâce au calendrier et remplir les horaires. 


Sinon (ex: Firefox) : 
 Rentrer les dates sous le format ANNEE-MM-JJTHH:MM, par exemple 2020-02-01T16:00 pour le 1er Février 2020 à 16h. 



### LIVE

Le mode LIVE vous permet de visionner les dernières acquisitions de chaque capteur et de choisir ceux à requetter.


