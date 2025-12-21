import numpy as np
from sklearn.decomposition import PCA
from sklearn import preprocessing

IN_FILE = '../data/accidents_regions_complete.csv'
OUT_FILE = 'accidents_region_pca_reduced.csv'

def append_pca_columns(pca_data, in_file, out_file):
    """Append to each line of in_file two columns: x_pca and y_pca.
    Values for these columns are taken from pca_data. The result is written on
    out_file. Expects CSV file format"""

    f_in=open(in_file,'r')
    f_out=open(out_file, 'w')

    # Add labels for PCA axis
    csv_labels = f_in.readline().rstrip('\n')
    csv_labels += ',x_pca,y_pca\n'
    print(f"NEW LABELS: {csv_labels}")
    f_out.write(csv_labels)

    # append x_pca and y_pca values to each line
    for i in range(len(pca_data)):
        in_line = f_in.readline().rstrip('\n')
        f_out.write(f'{in_line},{pca_data[i,0]},{pca_data[i,1]}\n')

    f_in.close()
    f_out.close()

# Get data from CSV
accidents_data = np.loadtxt(
    IN_FILE, 
    delimiter=',', 
    # Use only the following columns of integer values: road_type_code,
    # road_section_code, accident_type_code, vehile_type_code, month_code,
    # observations 
    usecols=(0, 3, 4, 6, 7),
    # Skip first row since it contains column labels
    skiprows=1
)

# Compute PCA
d_std = preprocessing.StandardScaler().fit_transform(accidents_data)
pca = PCA(n_components=2)
accidents_data_pca = pca.fit_transform(d_std)

append_pca_columns(accidents_data_pca, IN_FILE, OUT_FILE)
