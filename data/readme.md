# Informations about data

Data is taken from ISTAT website ([source](https://esploradati.istat.it/databrowser/#/en/dw/categories/IT1,Z0810HEA,1.0/HEA_ROAD/IT1,41_271_DF_DCIS_VEICOLIINCID1_1,1.0)).

The original CSV file format has been used to build the `vehicle-accidents.db` database with sqlite.
Original attribute names have been changed for better clarity.
Some values have been cleaned up and redundand attributes removed.

## Attributes of `accidents` table

- area_code (text)
- area_desc (text)
- road_type_code (int)
- road_type_desc (text)
- road_section_code (int)
- road_section_desc (text)
- accident_type_code (int)
- accident_type_desc (text)
- vehicle_type_code (int)
- vehicle_type_desc (text)
- month_code (int)
- month_desc (text)
- year (int)
- observations (int)

## Macro-areas

- Nord-ovest
    - Piemonte
    - Valle d'Aosta / Vallée d'Aoste
    - Liguria
    - Lombardia
- Nord-est
    - Trentino Alto Adige / Südtirol
    - Provincia Autonoma di Bolzano / Bozen
    - Provincia Autonoma di Trento
    - Veneto
    - Friuli-Venezia Giulia
    - Emilia-Romagna
- Centro
    - Toscana
    - Umbria
    - Marche
    - Lazio
- Sud
    - Abruzzo
    - Molise
    - Campania
    - Puglia
    - Basilicata
    - Calabria
- Isole
    - Sicilia
    - Sardegna