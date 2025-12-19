import numpy as np
from matplotlib import pyplot as plt

PCA_FILE = 'accidents_region_pca.csv'

data = np.loadtxt(
    PCA_FILE,
    delimiter=',', 
    # Use the following columns of numeric values: road_type_code,
    # road_section_code, accident_type_code, vehile_type_code, month_code,
    # observations, x_pca, y_pca
    usecols=(2, 4, 6, 8, 10, 13, 14, 15),
    # Skip first row since it contains column labels
    skiprows=1
)

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
    '#000e32'
]

vehicle_accidents = [[] for i in range(10)]
print(vehicle_accidents)

for row in data:
    vehicle_code = int(row[3])
    # Sometimes i get some "-1", I don't know why
    if vehicle_code < 0: vehicle_code = 1
    print(vehicle_code)
    vehicle_accidents[vehicle_code].append(row)

plt.plot(data[:,-2:-1],data[:,-1:],
        'o', markersize=3,
        color='blue',
        alpha=0.5,
        label='PCA')
plt.xlabel('X')
plt.ylabel('Y')
plt.legend()

plt.figure()
for i in range(10):
    data = np.array(vehicle_accidents[i])
    plt.plot(data[:,6:7],data[:,-1:],
            'o', markersize=3,
            color=colors[i],
            alpha=0.5,
            label=f'Vehicle type {i}')

plt.xlabel('X')
plt.ylabel('X')
plt.legend()

plt.show()
