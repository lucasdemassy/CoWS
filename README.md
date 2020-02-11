# CoWS

Connected Weather Station

install depedencies :`npm install`

run test: `npm test`

### install weatherStation on the raspberry

`cd weatherStation`
`npm install`
run the server : `npm start`

### (DEV) Querying the local server at the following URLs:
- localhost:3000/archive
- localhost:3000/live

### Pluie:
Unité de mesure de la pluie mm/m².
À chaque basculement: 2.571mL sont tombés sur un disque de rayon 50mm c'est-à-dire une précipitation de 0.32mm/m²

### SSH:
ssh pi@piensg011
mdp : raspberry

http://172.31.43.64/live?capteurs=all

Le dossier courant de la raspberryPi contient le projet courant `cows`

Pour redémarrer le service site (weatherStation app)
sudo systemctl restart site.service

sudo systemctl status site.service

### Doc:
- NPM ink-docstrap
- NPM jsdoc
- https://samwize.com/2014/01/31/the-best-documentation-generator-for-node/
