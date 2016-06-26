from sklearn.externals import joblib




def importAlgorithms():
    nb_model = joblib.load("algorithms/naive_bayes")
    rf_model = joblib.load("algorithms/random_forest")
    lr_model = joblib.load("algorithms/logistic_regression")
    sgd_model = joblib.load("algorithms/stochastic_gradient")
    lr_cv_model = joblib.load("algorithms/logistic_regression_cv")
    dt_model = joblib.load("algorithms/decision_tree")

importAlgorithms()
