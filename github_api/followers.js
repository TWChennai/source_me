'use strict';
const GitHubApi = require("github");
const _ = require('lodash');
const async = require('async');
const json2xls = require('json2xls');
const fs = require('fs');
var profileUtility = require('../utility/profile');

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


var getTopDevelopersInChennai = (next) => {
    // TODO Because of the limitations of the search api , we need to use something similar to split the developer search based
    // on the repos count to avoid getting search results more than 1000 .
    var developersInLocation = _.times(2, (page) => {
        return ( (callback) => {
                github.search.users({
                        // q: 'location:chennai+repos:>10+type:user',
                        // q: 'location:chennai+repos:7..10+type:user',
                        q: 'location:chennai+repos:5..6+type:user',
                        sortBy: 'id',
                        order: 'asc',
                        per_page: 2,
                        page: page + 1
                    },
                    (err, result) => {
                        if (err) {
                            console.info(err);
                        }
                        callback(null, result);
                        //sleep(500);
                    })
            }
        )
    });

    async.parallel(developersInLocation, (err, response) => {
        console.info(response[0]);
        var items = _.filter(_.flatten(_.map(response, "items")), (item) => {
            return !_.isUndefined(item);
        });
        next(err, profileUtility.parseItems(items));
    });
};

var computeScoreOfProfiles = (profiles, next) => {
    profileUtility.computeScoreOfProfiles(profiles);
    next(null, profileUtility.sortProfiles(profiles, "score", "desc"));
};

var enrichPersonalInfo = (profiles, next) => {
    var developerPersonalInfo = _.map(profiles, (profile) => {
        return ((callback) => {

                github.user.getFrom(
                    {
                        user: profile.loginId
                    },
                    (err, result) => {
                        if (_.isUndefined(result)) {
                            console.info(err);
                            console.info(result);
                        }
                        profile.updatePersonalInfo(result);
                        sleep(250);
                        callback(null, profile);
                    })
            }
        )
    });

    async.series(developerPersonalInfo, (err, response) => {
        next(null, profiles)
    });
};

var EnrichReposInfo = (profiles, next) => {
    var listOfCallsForRepos = _.map(profiles, (profile) => {
        return ((callback) => {
            github.repos.getFromUser({
                user: profile.loginId
            }, (err, repositories) => {
                profile.updateRepositoriesInfo(repositories);
                sleep(250);
                callback(null, profile)
            });
        });
    });

    async.series(listOfCallsForRepos, (err, profiles) => {
        next(null, profileUtility.sortProfiles(profileUtility.rejectEmptyProfiles(profiles), 'own_repository_count').reverse())
    })
};

var EnrichDeveloperActivity = (profiles, next) => {
    //TODO get all the events instead of only one page (there is a limitation that makes us get only events for last 90 days) .
    var developersActivityInfo = _.map(profiles, (profile) => {
        return ( (callback) => {
            github.events.getFromUser({
                user: profile.loginId,
                per_page: 100,
                page: 1
            }, (err, result) => {
                if (err) {
                    console.info(err);
                }
                profile.updateActivityInfo(result);
                sleep(250);
                callback(null, profile)
            });
        });
    });

    async.series(developersActivityInfo, (err, profiles) => {
        next(null, profiles);
    });
};

const sleep = (milliseconds) => {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds) {
            break;
        }
    }
};

var displayTopDeveloperProfiles = (profiles) => {    
    console.log(profileUtility.formatProfilesAsTable(profiles).toString());
};


var exportProfilesToExcel = (profiles) => {

    var xls = json2xls(profiles, 
    {
        fields: ['name', 'email', 'company', 'hireable', 'score', 
        'languages_known', 'loginId', 'blog', 'releases_made', 'push_count', 
        'pull_request_made', 'pull_request_reviewed', 'open_sourcing_private_repo_count', 
        'wikis_contributed', 'own_repository_count', 'forked_repository_count']
    });

    fs.writeFileSync('data.xlsx', xls, 'binary');
};

async.waterfall([
    getTopDevelopersInChennai,
    enrichPersonalInfo,
    EnrichReposInfo,
    EnrichDeveloperActivity,
    computeScoreOfProfiles,
   // displayTopDeveloperProfiles,
    exportProfilesToExcel
], function (err, res) {
    console.info(res);
});



