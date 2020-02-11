# TSI-C - Projet JavaScript avancé : Station météo

## Informations

1. Raspberry adresses :
    * piensg009.ensg.eu
    * piensg010.ensg.eu
    * piensg011.ensg.eu
    * piensg018.ensg.eu
2. Connection raspberry :
    * par login/mdp : `ssh pi@piensg009.ensg.eu`
        * mdp : `raspberry`
    * par clé RSA : `ssh -i ~/.ssh/id_rsa_Piensg009 pi@piensg009.ensg.eu`
        * après avoir copié la clé privé de connection dans le dossier `.ssh` de la machine qui veut se connecter
        * génération clé SSH : `ssh-keygen`
3. Les données sensors sont dans : `/dev/shm`
2. La configuration des _fakesondes_ est dans : `fakesonde/config.yaml`


## Brainstorming format des requêtes et données

### Requête

1. Live :
    * paramètres : 
        * capteurs : `String`, required ou _all_
            * _temperature_ : `tem`
            * _humidity_ : `hum`
            * _pressure_ : `pre`
            * _rain_ : `ran`
            * _luminosity_ : `lum`
            * _wind_ : `win`
    * url : `http://<adresse_sonde>/live?<capteurs>
    * exemple : `http://piensg009.ensg.eu/live?capteurs=tem,hum`
        * retournera dans le `req.query` :
        ```json
        {   
            capteurs: "tem,hum"
        }
        ```
    * exemple : `http://piensg009.ensg.eu/live?capteurs=all`
        * retournera dans le `req.query` :
        ```json
        {   
            capteurs: "all"
        }
        ```
1. Archive :
    * paramètres : 
        * start : `Date`, required
        * stop : `Date`, required
        * capteurs : `String`, required ou _all_
            * _temperature_ : `tem`
            * _humidity_ : `hum`
            * _pressure_ : `pre`
            * _rain_ : `ran`
            * _luminosity_ : `lum`
            * _wind_ : `win`
    * url : `http://<adresse_sonde>/archive?<capteurs>

    * exemple : `http://piensg009.ensg.eu/archive?start=2015-08&stop=2015-09&capteurs=tem,hum`
        * retournera dans le `req.query` :
        ```json
        {   
            start: "2015-08",
            stop: "2015-09",
            capteurs: "tem,hum"
        }
        ```
    * exemple : `http://piensg009.ensg.eu/archive?start=2015-08&stop=2015-09&capteurs=all`
        * retournera dans le `req.query` :
            ```json
            {   
                start: "2015-08",
                stop: "2015-09",
                capteurs: "all"
            }
            ```

### Réponses (JSON)

#### Succès de la requête

Le format des données en mode _live_ et en mode _archive_ sera le même. La différence se fait dans les data où le mode _archive_ renverra une liste composée de plusieurs listes tandis que le mode _live_ renverra une liste composée d'une seule liste.

1. Live :
    ```json
    {
        result: {
            id: int, // ex: 9
            metadata: {
                nom: String
                // ex: "Piensg 009"
            },
            coordinate: {
                longitude: float,
                latitude: float,
                date: Date,
                success: boolean
            },
            measurements: {
                temperature: {
                    description: ["Température"],
                    units: ["date", "C"],
                    data: [[Date, float]]
                },
                pressure: {
                    description: ["Pression"],
                    units: ["date", "hP"],
                    data: [[Date, float]]
                },
                humidity: {
                    description: ["Humidité"],
                    units: ["date", "%"],
                    data: [[Date, float]]
                },
                luminosity: {
                    description: ["Luminosité"],
                    units: ["date", "Lux"],
                    data: [[Date, float]]
                },
                wind: {
                    description: ["Direction du vent", "Force moyenne du vent", "Force maxi du vent", "Force mini du vent"],
                    units: ["date", "°", "Kts", "Kts", "Kts"],
                    data: [[Date, float, float, float, float]]
                    // ex: [Date, wind_heading, wind_speed_avg, wind_speed_max, wind_speed_min]
                },
                rain: {
                    description: ["Dates des basculements"],
                    units: ["date"],
                    data: [[Date]]
                    // Liste de dates des dernières pluies ie derniers basculements
                }
            }  
        }
    }
    ```
1. Archive :
    ```json
    {
        result: {
            id: int, // ex: 9
            metadata: {
                nom: String
                // ex: "Piensg 009"
            },
            coordinate: {
                longitude: float,
                latitude: float,
                date: Date,
                success: boolean
            },
            measurements: {
                temperature: {
                    description: ["Température"],
                    units: ["date", "C"],
                    data: [[Date, float]]
                },
                pressure: {
                    description: ["Pression"],
                    units: ["date", "hP"],
                    data: [[Date, float]]
                },
                humidity: {
                    description: ["Humidité"],
                    units: ["date", "%"],
                    data: [[Date, float]]
                },
                luminosity: {
                    description: ["Luminosité"],
                    units: ["date", "Lux"],
                    data: [[Date, float]]
                },
                wind: {
                    description: ["Direction du vent", "Force moyenne du vent", "Force maxi du vent", "Force mini du vent"],
                    units: ["date", "°", "Kts", "Kts", "Kts"],
                    data: [[Date, float, float, float, float]]
                    // ex: [Date, wind_heading, wind_speed_avg, wind_speed_max, wind_speed_min]
                },
                rain: {
                    description: ["Dates des basculements"],
                    units: ["date"],
                    data: [[Date]]
                    // Liste de dates des dernières pluies ie derniers basculements
                }
            }            
        }
    }
    ```

#### Echec de la requête

Le retour en cas d'échec de la requête sera le même pour les deux modes (_live_ et _archive_).
```json
{
    error: {
        type: String,
        message: String
    }
}
```


### Format date

ISO-8601 : https://en.wikipedia.org/wiki/ISO_8601

`yyyy-MM-ddTHH:mm:ss.SSSZ`

You can directly use date from Javascript's new Date().toISOString() : https://www.w3schools.com/jsref/jsref_toisostring.asp