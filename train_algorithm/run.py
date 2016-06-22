from __future__ import division

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def get_data_from_csv():
    input_file = "./input/PastHires.csv"
    df = pd.read_csv(input_file, header = 0)
    return df


def clean_up_data(df):
    d = {'Y': 1, 'N': 0}
    df['Hired'] = df['Hired'].map(d)
    df['Employed?'] = df['Employed?'].map(d)
    df['Top-tier school'] = df['Top-tier school'].map(d)
    df['Interned'] = df['Interned'].map(d)
    d = {'BS': 0, 'MS': 1, 'PhD': 2}
    df['Level of Education'] = df['Level of Education'].map(d)    
    return df

def print_class_distribution(df):
    num_obs = len(df)
    num_true = len(df.loc[df['Hired'] == 1])
    num_false = len(df.loc[df['Hired'] == 0])
    print("Number of True cases:  {0} ({1}%)".format(num_true, (num_true/num_obs) * 100))
    print("Number of False cases: {0} ({1}%)".format(num_false, (num_false/num_obs) * 100))


data_frame = get_data_from_csv()
clean_data_frame = clean_up_data(data_frame)

print_class_distribution(clean_data_frame)
