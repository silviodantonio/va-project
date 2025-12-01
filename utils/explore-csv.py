import csv
import sys
from collections import defaultdict

# Constants
csv_filename = sys.argv[1]

csv_file = open(csv_filename, newline='')
csv_reader = csv.DictReader(csv_file)

# Will store all the possible values for each attribute
values = defaultdict(set)

rows_n = 0
for row in csv_reader:
    rows_n += 1
    for attribute in row:
            values[attribute].add(row[attribute])

print(f'Number of rows: {rows_n}\n')
for attribute, values_set in values.items():
    print(f'Number of values in {attribute}: {len(values_set)}')

for attribute, values_set in values.items():
    print(f'Values for {attribute}: {values_set}')