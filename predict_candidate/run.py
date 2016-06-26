from sklearn.externals import joblib




def importAlgorithms():
    nb_model = joblib.load("algorithms/naive_bayes")
    rf_model = joblib.load("algorithms/random_forest")
    lr_model = joblib.load("algorithms/logistic_regression")
    sgd_model = joblib.load("algorithms/stochastic_gradient")
    lr_cv_model = joblib.load("algorithms/logistic_regression_cv")
    dt_model = joblib.load("algorithms/decision_tree")


def getInput():
    print("Enter the details of the candidate:\n")

    print("Enter the experience in years rounded off to an integer:")
    exp = raw_input()
    print("") 
    
    print("Has the candidate studied in a top-tier school?(y/n):")
    tt_school = raw_input()
    tt_school = tt_school.lower()
    print("")
    
    print("Has the candidate worked on a pet project?(y/n):")
    pet_project = raw_input()
    pet_project = pet_project.lower()
    print("")

    print("Any recognitions?(y/n):")
    recog = raw_input()
    recog = recog.lower()
    print("")
    
    print("Any certifications?(y/n):")
    cert = raw_input()
    cert = cert.lower()
    print("")

    return exp, tt_school, pet_project, recog, cert


importAlgorithms()
exp, tt_school, pet_project, recog, cert = getInput()


