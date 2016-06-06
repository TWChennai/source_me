const GitHubApi = require("github");
const _ = require('lodash');
const async = require('async');
const Table = require('cli-table');
const json2xls = require('json2xls');
const fs = require('fs');

const scores = {
    forked_repository_count: 1,
    wikis_contributed: 3,
    //open_sourcing_private_repo_count : 5,
    push_count: 8,
    pull_request_reviewed: 8,
    own_repository_count: 10,
    languages_known: 10,
    releases_made: 15,
    pull_request_made: 30
};

const github = new GitHubApi({
    debug: true,
    protocol: "https",
    host: "api.github.com",
    timeout: 5000,
    version: '3.0.0',
    headers: {
        "user-agent": "My-Cool-GitHub-App"
    }
});

github.authenticate({
    type: "oauth",
    key: process.env.client_id,
    secret: process.env.client_secret
});


var getTopDevelopersInChennai = function (next) {
    // TODO Because of the limitations of the search api , we need to use something similar to split the developer search based
    // on the repos count to avoid getting search results more than 1000 .
    // TODO For some reason some developer profiles are duplicate. Should fix it .
    var developersInLocation = _.times(10, function (page) {
        return (function (callback) {
                github.search.users({
                        q: 'location:chennai+repos:>10+type:user',
                        //q: 'location:chennai+repos:7..10+type:user',
                        //q: 'location:chennai+repos:5..6+type:user',
                        sort: 'repositories',
                        per_page: 100,
                        page: page + 1
                    },
                    function (err, result) {
                        if (err) {
                            console.info(err);
                        }
                        callback(null, result);
                        //sleep(500);
                    })
            }
        )
    });

    async.parallel(developersInLocation, function (err, response) {
        console.info(response[0]);
        var items = _.filter(_.flatten(_.map(response, "items")), function (item) {
            return !_.isUndefined(item);
        });
        next(err, _.map(items, function (element) {
            var profile = {};
            profile.loginId = element.login;
            return profile;
        }));
    });


};

var enrichPersonalInfo = function (profiles, next) {

    var developerPersonalInfo = _.map(profiles, function (profile) {
        return (function (callback) {

                github.user.getFrom(
                    {
                        user: profile.loginId
                    },
                    function (err, result) {
                        if (_.isUndefined(result)) {
                            console.info(err);
                            console.info(result);
                        }
                        profile.email = result.email ? result.email : "";
                        profile.name = result.name ? result.name : "";
                        profile.company = result.company ? result.company : "";
                        profile.blog = result.blog ? result.blog : "";
                        profile.hireable = result.hireable ? "Yes" : "No";
                        sleep(500);
                        callback(null, profile);
                    })
            }
        )
    });

    async.series(developerPersonalInfo, function (err, response) {
        next(null, profiles)
    });


};

var EnrichReposInfo = function (profiles, next) {
    var listOfCallsForRepos = _.map(profiles, function (profile) {
        return (function (callback) {
            github.repos.getFromUser({
                user: profile.loginId
            }, function (err, repositories) {
                var ownedRepositories = _.filter(repositories, {fork: false});
                var forkedRepositories = _.filter(repositories, {fork: true});
                //TODO get languages from language url.
                profile.languages_known = _.filter(_.uniq(_.map(ownedRepositories, "language")), function (language) {
                    return !_.isNull(language);
                });
                profile.own_repository_count = ownedRepositories.length;
                profile.forked_repository_count = forkedRepositories.length;
                sleep(500);
                callback(null, profile)
            });
        });
    });

    async.series(listOfCallsForRepos, function (err, profiles) {
        next(null, _.sortBy(_.reject(profiles, {own_repository_count: 0}), 'own_repository_count').reverse())
    })
};

var computeScoreOfProfiles = function (profiles, next) {
    _.each(profiles, function (profile) {
        profile["score"] = 0;
        _.each(_.keys(scores), function (score_param) {
            //console.info(score_param);
            if (score_param == 'languages_known') {
                //console.info(profile['languages_known']);
                //console.info(profile[score_param].length,typeof profile[score_param].length);
                //console.info(scores[score_param],typeof scores[score_param]);
                //console.info(profile[score_param].length * scores[score_param]);

                profile["score"] = profile["score"] + profile[score_param].length * scores[score_param]
            }else{
                //console.info(profile[score_param],typeof profile[score_param]);
                //console.info(scores[score_param],typeof scores[score_param]);
                //console.info(profile[score_param] * scores[score_param]);
                profile["score"] = profile["score"] + profile[score_param] * scores[score_param]
            }
        });
    });
    var sortedProfiles = _.orderBy(profiles,"score","desc");
    next(null, sortedProfiles);
};

var EnrichDeveloperActivity = function (profiles, next) {
    //TODO get all the events instead of only one page (there is a limitation that makes us get only events for last 90 days) .
    var developersActivityInfo = _.map(profiles, function (profile) {
        return (function (callback) {
            github.events.getFromUser({
                user: profile.loginId,
                per_page: 100,
                page: 1
            }, function (err, result) {
                if (err) {
                    console.info(err);
                }
                if (result) {
                    profile.releases_made = _.filter(result, {type: 'releaseEvent'}).length;
                    profile.push_count = _.filter(result, {type: 'PushEvent'}).length;
                    profile.pull_request_made = _.filter(result, {type: 'PullRequestEvent'}).length;
                    profile.pull_request_reviewed = _.filter(result, {type: 'PullRequestReviewCommentEvent'}).length;
                    profile.open_sourcing_private_repo_count = _.filter(result, {type: 'PublicEvent'}).length;
                    profile.wikis_contributed = _.filter(result, {type: 'GollumEvent'}).length
                }
                sleep(500);
                callback(null, profile)
            });
        });
    });

    async.series(developersActivityInfo, function (err, profiles) {
        next(null, profiles)
    })
};

const sleep = function (milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
};

var displayTopDeveloperProfiles = function (profiles) {

    var table = new Table({
        head: _.keys(profiles[0]),
        colWidths: [20, 20, 10, 15, 20, 10, 20, 20, 20, 20, 20, 20, 20, 20, 20]
    });

    _.forEach(profiles, function (profile) {
        table.push(_.values(profile));
    });
    console.log(table.toString());
};


var exportProfilesToExcel = function (profiles) {

    var xls = json2xls(profiles);

    fs.writeFileSync('data.xlsx', xls, 'binary');
};

async.waterfall([
    getTopDevelopersInChennai,
    enrichPersonalInfo,
    EnrichReposInfo,
    EnrichDeveloperActivity,
    computeScoreOfProfiles,
    //displayTopDeveloperProfiles,
    exportProfilesToExcel
], function (err, res) {
    console.info(res)
});



