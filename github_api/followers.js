const GitHubApi = require("github");
const _ = require('lodash');
const async = require('async');
const Table = require('cli-table');
const json2xls = require('json2xls');
const fs = require('fs');

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

    var developersInLocation = _.times(10, function (page) {
        return (function (callback) {
                github.search.users({
                        q: 'location:chennai+repos:>10',
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
                profile.languages = _.uniq(_.map(ownedRepositories, "language"));
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

var EnrichDeveloperActivity = function (profiles, next) {

    var developersActivityInfo = _.map(profiles, function (profile) {
        return (function (callback) {
            github.events.getFromUser({
                user: profile.loginId,
                per_page: 100,
                page: 1
            }, function (err, result) {
                if(err){
                    console.info(err);
                }
                if(result){
                    profile.releases_made = _.filter(result,{type: 'releaseEvent'}).length
                    profile.push_count = _.filter(result,{type: 'PushEvent'}).length
                    profile.pull_request_made = _.filter(result,{type: 'PullRequestEvent'}).length
                    profile.pull_request_reviewed = _.filter(result,{type: 'PullRequestReviewCommentEvent'}).length
                    profile.open_sourcing_private_repo_count = _.filter(result,{type: 'PublicEvent'}).length
                    profile.wikis_contributed = _.filter(result,{type: 'GollumEvent'}).length
                }
                sleep(500);
                callback(null,profile)
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
        if ((new Date().getTime() - start) > milliseconds){
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


var exportProfilesToExcel = function(profiles){

    var xls = json2xls(profiles);

    fs.writeFileSync('data.xlsx', xls, 'binary');
};

async.waterfall([
    getTopDevelopersInChennai,
    enrichPersonalInfo,
    EnrichReposInfo,
    EnrichDeveloperActivity,
    //displayTopDeveloperProfiles,
    exportProfilesToExcel
], function (err, res) {
    console.info(res)
});



