import numpy as np
from matplotlib import pyplot as plt

PCA_FILE = 'accidents_region_pca_reduced.csv'

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
    skiprows=1
)

# # Plot standard PCA
# plt.plot(csv_data[:,-2:-1],csv_data[:,-1:],
#         'o', markersize=3,
#         color='blue',
#         alpha=0.5,
#         label='PCA')
# plt.xlabel('X')
# plt.ylabel('Y')
# plt.legend()

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
    accident_type_code = int(row[attr_column]) - 1
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

# Plot PCA over accident type

attr_column = 2 # Index of column of the attribute road_section
text_labels = [
    "between vehicles",
    "vehicle-pedestrian accident",
    "single vehicle",
]

n_values = len(text_labels)
accident_type = [[] for i in range(n_values)]

for row in csv_data:
    accident_type_code = int(row[attr_column]) - 1
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

# Plot PCA with deadliness

attr_column = 3 # Index of column of the attribute road_section
text_labels = [
    'injured',
    'deadly',
]

n_values = len(text_labels)
accident_type = [[] for i in range(n_values)]

for row in csv_data:
    accident_type_code = int(row[attr_column])
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

# # Plot PCA with hours (paired)

# attr_column = 4 # Index of column of the attribute road_section
# text_labels = [
#     "1",
#     "2",
#     "3",
#     "4",
#     "5",
#     "6",
#     "7",
#     "8",
#     "9",
#     "10",
#     "11",
#     "12",
#     "13",
#     "14",
#     "15",
#     "16",
#     "17",
#     "18",
#     "19",
#     "20",
#     "21",
#     "22",
#     "23",
#     "24",
# ]

# hour_colors = [
#   "#a6cee3",
#   "#a6cee3",
#   "#1f78b4",
#   "#1f78b4",
#   "#b2df8a",
#   "#b2df8a",
#   "#33a02c",
#   "#33a02c",
#   "#fb9a99",
#   "#fb9a99",
#   "#e31a1c",
#   "#e31a1c",
#   "#fdbf6f",
#   "#fdbf6f",
#   "#ff7f00",
#   "#ff7f00",
#   "#cab2d6",
#   "#cab2d6",
#   "#6a3d9a",
#   "#6a3d9a",
#   "#ffff99",
#   "#ffff99",
#   "#b15928",
#   "#b15928"
# ]

# n_values = len(text_labels)
# accident_type = [[] for i in range(n_values)]

# for row in csv_data:
#     accident_type_code = int(row[attr_column]) - 1
#     accident_type[accident_type_code].append(row)

# plt.figure()
# for i in range(n_values):
#     data = np.array(accident_type[i])
#     plt.plot(data[:,-2:-1],data[:,-1:],
#             'o', markersize=3,
#             color=hour_colors[i],
#             alpha=0.5,
#             label=f'{text_labels[i]}')

# plt.xlabel('X')
# plt.ylabel('Y')
# plt.legend()

plt.show()