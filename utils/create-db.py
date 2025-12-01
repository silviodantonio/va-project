import sqlite3
import csv

db_connection = sqlite3.connect('vehicle-accidents.db')
cursor = db_connection.cursor()

cursor.execute("""
    CREATE TABLE vehicle_accidents(
        freq_code TEXT,
        freq_desc TEXT,
        area_code TEXT,
        area_desc TEXT,
        data_type_code INTEGER,
        data_type_desc TEXT,
        road_type_code INTEGER,
        road_type_desc TEXT,
        road_section_code INTEGER,
        road_section_desc TEXT,
        accident_type_code INTEGER,
        accident_type_desc TEXT,
        vehicle_type_code INTEGER,
        vehicle_type_desc TEXT,
        month_code INTEGER,
        month_desc TEXT,
        year INTEGER,
        observations INTEGER,
        obs_status_code INTEGER,
        obs_status_desc TEXT)
""")

csv_file = open('vehicle-accidents.csv', newline='')
csv_reader = csv.DictReader(csv_file)

cursor.executemany("""
    INSERT INTO vehicle_accidents VALUES(
        :freq_code,
        :freq_desc,
        :area_code,
        :area_desc,
        :data_type_code,
        :data_type_desc,
        :road_type_code,
        :road_type_desc,
        :road_section_code,
        :road_section_desc,
        :accident_type_code,
        :accident_type_desc,
        :vehicle_type_code,
        :vehicle_type_desc,
        :month_code,
        :month_desc,
        :year,
        :observations,
        :obs_status_code,
        :obs_status_desc)
""", csv_reader)
db_connection.commit()

csv_file.close()
db_connection.close()
