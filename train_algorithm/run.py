import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

def get_data_from_csv():
    input_file = "./input/PastHires.csv"
    df = pd.read_csv(input_file, header = 0)


get_data_from_csv()

