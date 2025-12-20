import numpy as np
from matplotlib import pyplot as plt

PCA_FILE = 'accidents_region_pca.csv'

cat_colors = [
    '#e41a1c',
    '#377eb8',
    '#4daf4a',
    '#984ea3',
    '#ff7f00',
    '#ffff33',
    '#a65628',
    '#f781bf',
    '#999999'
]

# Thanks colorbrewer (PuBu color scale)
colors = [
    '#fff7fb',
    '#ece7f2',
    '#d0d1e6',
    '#a6bddb',
    '#74a9cf',
    '#3690c0',
    '#0570b0',
    '#045a8d',
    '#023858',
]

csv_data = np.loadtxt(
    PCA_FILE,
    delimiter=',', 
    # Use the following columns of numeric values: road_type_code,
    # road_section_code, accident_type_code, vehile_type_code, month_code,
    # observations, x_pca, y_pca
    # usecols=(2, 4, 6, 8, 10, 13, 14, 15),
    # Skip first row since it contains column labels
    skiprows=1
)

# Plot standard PCA
plt.plot(csv_data[:,-2:-1],csv_data[:,-1:],
        'o', markersize=3,
        color='blue',
        alpha=0.5,
        label='PCA')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()


# Plot PCA with road_sections

attr_column = 1 # Index of column of the attribute road_section
text_labels = [
    "crossroad",
    "traffic circle",
    "level crossing",
    "straight stretch",
    "bend",
    "bottleneck",
    "tunnel",
]

n_values = len(text_labels)
accident_type = [[] for i in range(n_values)]

for row in csv_data:
    accident_type_code = int(attr_column) - 1
    accident_type[accident_type_code].append(row)

plt.figure()
for i in range(n_values):
    data = np.array(accident_type[i])
    plt.plot(data[:,-2:-1],data[:,-1:],
            'o', markersize=3,
            color=cat_colors[i],
            alpha=0.5,
            label=f'{text_labels[i]}')

plt.xlabel('X')
plt.ylabel('Y')
plt.legend()

plt.show()