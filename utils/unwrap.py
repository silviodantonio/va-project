import csv
import sys

def process_csv(input_file, output_file):
    """
    Processa un file CSV e duplica le righe in base al valore dell'ottava colonna.
    
    Args:
        input_file: percorso del file CSV in input
        output_file: percorso del file CSV in output
    """
    
    with open(input_file, 'r', newline='', encoding='utf-8') as infile, \
         open(output_file, 'w', newline='', encoding='utf-8') as outfile:
        
        reader = csv.reader(infile)
        writer = csv.writer(outfile)
        
        # Legge l'header se presente
        try:
            header = next(reader)
            writer.writerow(header)
        except StopIteration:
            print("Il file CSV è vuoto.")
            return
        
        total_input_rows = 0
        total_output_rows = 0
        
        # Processa ogni riga
        for row_num, row in enumerate(reader, start=2):  # start=2 per considerare l'header
            total_input_rows += 1
            
            # Controlla se la riga ha almeno 8 colonne
            if len(row) < 8:
                print(f"Warning: Riga {row_num} ha solo {len(row)} colonne invece di 8. Verrà saltata.")
                continue
            
            try:
                # Ottiene l'ottava colonna (indice 7)
                count = int(row[7])
                
                if count > 1:
                    # Duplica la riga 'count' volte
                    for _ in range(count):
                        writer.writerow(row)
                        total_output_rows += 1
                else:
                    # Scrive la riga normalmente (una volta)
                    writer.writerow(row)
                    total_output_rows += 1
                    
            except ValueError:
                print(f"Warning: Riga {row_num} - l'ottava colonna non è un numero valido: '{row[7]}'. Verrà scritta una volta.")
                writer.writerow(row)
                total_output_rows += 1
        
        print(f"Elaborazione completata!")
        print(f"Righe in input: {total_input_rows}")
        print(f"Righe in output: {total_output_rows}")
        print(f"File salvato come: {output_file}")


    # Esempio di utilizzo
    
    # Uso: python script.py <input_file.csv> <output_file.csv>
