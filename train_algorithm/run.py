from __future__ import division
from sklearn.cross_validation import train_test_split
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.linear_model import SGDClassifier
from sklearn.linear_model import LogisticRegressionCV
from sklearn import tree
from sklearn import metrics
from sklearn.externals.six import StringIO  

import pydot 
import numpy as np
import pandas as pd


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
    #d = {'BS': 0, 'MS': 1, 'MCA': 1, 'PhD': 2}
    #df['Level of Education'] = df['Level of Education'].map(d)    
    return df

def print_class_distribution(df):
    num_obs = len(df)
    num_true = len(df.loc[df['Hired'] == 1])
    num_false = len(df.loc[df['Hired'] == 0])
    print("Number of True cases:  {0} ({1}%)".format(num_true, (num_true/num_obs) * 100))
    print("Number of False cases: {0} ({1}%)".format(num_false, (num_false/num_obs) * 100))
    print("")


def split_data(df):
    feature_col_names = ['Years Experience','Top-tier school','had/has a pet project?','recognizations?','Certifications?']
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

def run_logistic_regression(X_train,X_test,y_train,y_test):
    # create LogisticRegression model and train it with the data

    #tune it with the appropriate regularization hyperparameter
    C_start = 0.01
    C_end = 5
    C_inc = 0.01
    C_values, recall_scores = [], []

    C_val = C_start
    best_recall_score = 0
    while (C_val < C_end):
        C_values.append(C_val)
        lr_model_loop = LogisticRegression(C=C_val, class_weight="balanced", random_state=42)
        lr_model_loop.fit(X_train, y_train.ravel())
        lr_predict_loop_test = lr_model_loop.predict(X_test)
        recall_score = metrics.recall_score(y_test, lr_predict_loop_test)
        recall_scores.append(recall_score)
        if (recall_score > best_recall_score):
            best_recall_score = recall_score
            best_lr_predict_test = lr_predict_loop_test
        
        C_val = C_val + C_inc

    best_score_C_val = C_values[recall_scores.index(best_recall_score)]    

    # Uses the class_weight=balanced and uses the best C_val computed
    lr_model =LogisticRegression( class_weight="balanced", C=best_score_C_val, random_state=42)
    lr_model.fit(X_train, y_train.ravel())
    return lr_model


def run_stochastic_gradient_descent():
    # create Stochastic Gradient Descent Classifier and train the data
    sgd_model = SGDClassifier(n_iter=500, loss='modified_huber', penalty='elasticnet', random_state=42)
    sgd_model = sgd_model.fit(X_train, y_train.ravel())
    return sgd_model


def run_logistic_regression_with_cross_validation():
    #splits the data into cv folds and iterates Cs times to find the best c_value
    lr_cv_model = LogisticRegressionCV(n_jobs=-1, random_state=42, Cs=3, cv=5, refit=False, class_weight="balanced")  
    # setting number of jobs to -1 which uses all cores to parallelize
    lr_cv_model.fit(X_train, y_train.ravel())
    return lr_cv_model

def run_decision_tree():
    dt_model = tree.DecisionTreeClassifier()
    dt_model = dt_model.fit(X_train, y_train.ravel())
    return dt_model

def create_decision_tree_png(model,features):
    dot_data = StringIO()  
    tree.export_graphviz(dt_model, out_file=dot_data, feature_names=features)  
    graph = pydot.graph_from_dot_data(dot_data.getvalue())  
    graph.write_png('./graphs/decision_tree_graph.png')



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
lr_model = run_logistic_regression(X_train,X_test,y_train,y_test)
print("Logistic-regression model:")
print_accuracy_score_for_model(lr_model,X_test,y_test)
print_confusion_matrix_classification_report(lr_model,X_test,y_test)

#Stochastic Gradient Descent Classifier
sgd_model = run_stochastic_gradient_descent()
print("Stochastic-gradient model:")
print_accuracy_score_for_model(sgd_model,X_test,y_test)
print_confusion_matrix_classification_report(sgd_model,X_test,y_test)

# Logistic regression with cross validation
lr_cv_model = run_logistic_regression_with_cross_validation()
print("Logistic-regression model with cross validation:")
print_accuracy_score_for_model(lr_cv_model,X_test,y_test)
print_confusion_matrix_classification_report(lr_cv_model,X_test,y_test)

# Decision tress classifier
dt_model = run_decision_tree()
print("Decision Tree Classifier model:")
print_accuracy_score_for_model(dt_model,X_test,y_test)
print_confusion_matrix_classification_report(dt_model,X_test,y_test)
features = ['Years Experience','Top-tier school','had/has a pet project?','recognizations?','Certifications?']
create_decision_tree_png(dt_model,features)
