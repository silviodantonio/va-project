import csv
import sys

def process_csv(input_file, output_file):
    with open(input_file, 'r', newline='', encoding='utf-8') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:

        reader = csv.reader(infile)
        writer = csv.writer(outfile)

        header = next(reader)
        writer.writerow(header)

        total_input_rows = 0
        total_output_rows = 0
        sum_col8 = 0

        for row_num, row in enumerate(reader, start=2):
            total_input_rows += 1

            if len(row) < 8:
                print(f"Warning: Riga {row_num} ha solo {len(row)} colonne")
                continue

            try:
                count = int(row[7])
                sum_col8 += count

                for _ in range(max(count, 1)):
                    writer.writerow(row)
                    total_output_rows += 1

            except ValueError:
                print(f"Warning: Riga {row_num} colonna 8 non numerica: {row[7]}")
                writer.writerow(row)
                total_output_rows += 1

        print("Elaborazione completata")
        print(f"Righe input: {total_input_rows}")
        print(f"Righe output: {total_output_rows}")
        print(f"Somma colonna 8: {sum_col8}")
        print(f"File output: {output_file}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python unwrap.py <input.csv> <output.csv>")
        sys.exit(1)

    process_csv(sys.argv[1], sys.argv[2])
