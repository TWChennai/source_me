from sklearn.externals import joblib

def importAlgorithms():
    nb_model = joblib.load("algorithms/naive_bayes")
    rf_model = joblib.load("algorithms/random_forest")
    lr_model = joblib.load("algorithms/logistic_regression")
    sgd_model = joblib.load("algorithms/stochastic_gradient")
    lr_cv_model = joblib.load("algorithms/logistic_regression_cv")
    dt_model = joblib.load("algorithms/decision_tree")
    return nb_model,rf_model,lr_model,sgd_model,lr_cv_model,dt_model

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


def map_yn_value(yn_var):
    return 1 if yn_var=='y' else 0


def map_to_numericals(exp, tt_school, pet_project, recog, cert):
    exp = int(exp)
    tt_school = map_yn_value(tt_school)
    pet_project = map_yn_value(pet_project)
    recog = map_yn_value(recog)
    cert = map_yn_value(cert)
    return exp, tt_school, pet_project, recog, cert

def generate_predictor_list(exp,tt_school,pet_project,recog,cert):
    predictor_list = []
    predictor_list.append(exp)
    predictor_list.append(tt_school)
    predictor_list.append(pet_project)
    predictor_list.append(recog)
    predictor_list.append(cert)
    return predictor_list


nb_model,rf_model,lr_model,sgd_model,lr_cv_model,dt_model = importAlgorithms()
exp, tt_school, pet_project, recog, cert = getInput()
exp, tt_school, pet_project, recog, cert = map_to_numericals(exp,tt_school,pet_project,recog,cert)
predictor_list = generate_predictor_list(exp,tt_school,pet_project,recog,cert)



