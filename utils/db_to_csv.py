import sqlite3 as sqlite
import csv

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
    db_to_csv('../data/vehicle-accidents.db', 'select * from accidents', (), 'accidents.csv')