from __future__ import division
from sklearn.cross_validation import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn import metrics

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
    df['Top-tier school'] = df['Top-tier school'].map(d)
    df['had/has a pet project?'] = df['had/has a pet project?'].map(d)
    df['recognizations?'] = df['recognizations?'].map(d)
    df['Certifications?'] = df['Certifications?'].map(d)
    d = {'BS': 0, 'MS': 1, 'MCA': 1, 'PhD': 2}
    df['Level of Education'] = df['Level of Education'].map(d)    
    return df

def print_class_distribution(df):
    num_obs = len(df)
    num_true = len(df.loc[df['Hired'] == 1])
    num_false = len(df.loc[df['Hired'] == 0])
    print("Number of True cases:  {0} ({1}%)".format(num_true, (num_true/num_obs) * 100))
    print("Number of False cases: {0} ({1}%)".format(num_false, (num_false/num_obs) * 100))
    print("")


def split_data(df):
    feature_col_names = ['Years Experience','Level of Education','Top-tier school','had/has a pet project?','recognizations?','Certifications?']
    predicted_class_names = ['Hired']

    X = df[feature_col_names].values     # predictor feature columns
    y = df[predicted_class_names].values # predicted class (1=true, 0=false)
    split_test_size = 0.30

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=split_test_size, random_state=42) 
    return X_train, X_test, y_train, y_test

def print_train_test_split_percentage(X_train,df):
    print("{0:0.2f}% in training set".format((len(X_train)/len(df.index)) * 100))
    print("{0:0.2f}% in test set".format((len(X_test)/len(df.index)) * 100))
    print("")


def print_train_test_class_dist(y_train,y_test):
    print("Training True  : {0} ({1:0.2f}%)".format(len(y_train[y_train[:] == 1]), (len(y_train[y_train[:] == 1])/len(y_train) * 100.0)))
    print("Training False : {0} ({1:0.2f}%)".format(len(y_train[y_train[:] == 0]), (len(y_train[y_train[:] == 0])/len(y_train) * 100.0)))
    print("")
    print("Test True      : {0} ({1:0.2f}%)".format(len(y_test[y_test[:] == 1]), (len(y_test[y_test[:] == 1])/len(y_test) * 100.0)))
    print("Test False     : {0} ({1:0.2f}%)".format(len(y_test[y_test[:] == 0]), (len(y_test[y_test[:] == 0])/len(y_test) * 100.0)))
    print("")

def predict_testdata(model,X_test):
    model_predict_test = model.predict(X_test)
    return model_predict_test


def print_accuracy_score_for_model(model, X_test, y_test):
    # training metrics
    model_predict_test = predict_testdata(model,X_test)
    print("Accuracy: {0:.4f}".format(metrics.accuracy_score(y_test, model_predict_test)))
    print("")

def print_confusion_matrix_classification_report(model,X_test,y_test):
    print("Confusion Matrix")
    # Note the use of labels for set 1=True to upper left and 0=False to lower right  
    model_predict_test = model.predict(X_test)
    print("{0}".format(metrics.confusion_matrix(y_test, model_predict_test, labels=[1, 0])))
    print("")

    print("Classification Report")
    print(metrics.classification_report(y_test, model_predict_test, labels=[1,0]))
    print("")


def run_naive_bayes(X_train,y_train):
    # create Gaussian Naive Bayes model object and train it with the data
    nb_model = GaussianNB()
    nb_model.fit(X_train, y_train.ravel())
    return nb_model

def run_random_forest(X_train,y_train):
    # create RandomForrestClassifier and train it with data
    rf_model = RandomForestClassifier(random_state=42)      
    rf_model.fit(X_train, y_train.ravel()) 
    return rf_model;

def run_logistic_regression(X_train,y_train):
    # create LogisticRegression model and train it with the data
    lr_model =LogisticRegression(C=0.7, random_state=42)
    lr_model.fit(X_train, y_train.ravel())
    return lr_model

data_frame = get_data_from_csv()
clean_data_frame = clean_up_data(data_frame)

print_class_distribution(clean_data_frame)

X_train, X_test, y_train, y_test = split_data(clean_data_frame)

print_train_test_split_percentage(X_train,clean_data_frame)

print_train_test_class_dist(y_train,y_test)

#Naive-bayes model
nb_model = run_naive_bayes(X_train,y_train)
print("Naive-Bayes model:")
print_accuracy_score_for_model(nb_model,X_test,y_test)
print_confusion_matrix_classification_report(nb_model,X_test,y_test)

#Random-forest classifier
rf_model = run_random_forest(X_train,y_train)
print("Random-forest model:")
print_accuracy_score_for_model(rf_model,X_test,y_test)
print_confusion_matrix_classification_report(rf_model,X_test,y_test)

#Logistic Regression model
lr_model = run_logistic_regression(X_train,y_train)
print("Logistic-regression model:")
print_accuracy_score_for_model(lr_model,X_test,y_test)
print_confusion_matrix_classification_report(lr_model,X_test,y_test)
