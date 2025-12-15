import sqlite3 as sqlite
import csv

REGIONI = [
    'Abruzzo',
    'Basilicata',
    'Calabria',
    'Campania',
    'Emilia-Romagna',
    'Friuli-Venezia Giulia',
    'Lazio',
    'Liguria',
    'Lombardia',
    'Marche',
    'Molise',
    'Piemonte',
    'Puglia',
    'Sardegna',
    'Sicilia',
    'Toscana',
    'Trentino Alto Adige / Südtirol',
    'Umbria',
    "Valle d'Aosta / Vallée d'Aoste",
    'Veneto',
]

# Remove all totals and remove aggregates for geographical zone.
remove_totals_query = """\
select * from accidents
where area_desc <> 'Italy' and 
      area_desc <> 'Nord-ovest' and 
      area_desc <> 'Nord-est' and 
      area_desc <> 'Centro (I)' and 
      area_desc <> 'Sud' and 
      area_desc <> 'Isole' and 
      road_type_desc <> 'Total' and 
      road_section_desc <> 'Total' and 
      accident_type_desc <> 'Total' and 
      vehicle_type_desc <> 'Total' and
      month_desc <> 'Total'
"""

regions_only_query = """\
select * from accidents
where road_type_desc <> 'Total' and
      road_section_desc <> 'Total' and
      accident_type_desc <> 'Total' and
      vehicle_type_desc <> 'Total' and
      month_desc <> 'Total' and (
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? or
      area_desc = ? )
"""

# Keep accidents for Italy but removes totals for
# road type, road section, accident type ...
totals_only_query = """\
select * from accidents
where area_code = 'Italy' and
      road_type_desc <> 'Total' and
      road_section_desc <> 'Total' and
      accident_type_desc <> 'Total' and
      vehicle_type_desc <> 'Total' and
      month_desc <> 'Total'
"""

def db_to_csv(database, query_string, query_params, csv_out):
    """Exports the results of the given query to a CSV file.  Query is expected
    to be a tuple containing the sql query and parameters."""

    connection = sqlite.connect(database)
    cursor = connection.cursor()

    query_result = cursor.execute(query_string, query_params)

    query_columns = [description[0] for description in cursor.description]


    # open csv file
    try:
        f = open(csv_out, 'w', newline='')
    except OSError:
        print('Error opening CSV file')

    csv_writer = csv.writer(f)

    # write query_columns as first line in csv
    csv_writer.writerow(query_columns)

    # get each line of the query result
    for line in query_result:
        csv_writer.writerow(line)

    f.close()
    connection.close()

if __name__ == '__main__':
    db_to_csv('../data/vehicle-accidents.db', 'select * from accidents', (), 'accidents_all.csv')

    db_to_csv('../data/vehicle-accidents.db', totals_only_query, (), 'accidents_italy.csv')
    db_to_csv('../data/vehicle-accidents.db', remove_totals_query, (), 'accidents.csv')
    db_to_csv('../data/vehicle-accidents.db', regions_only_query, REGIONI, 'accidents_region.csv')