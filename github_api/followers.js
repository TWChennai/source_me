var GitHubApi = require("github");
var _ = require('lodash');
var async = require('async');
var profile = require('./profile');
var Table = require('cli-table');

var github = new GitHubApi({
    //debug: true,
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    timeout: 5000,
    version: '3.0.0',
    headers: {
        "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
    }
});

github.authenticate({
    type: "oauth",
    key: process.env.client_id,
    secret: process.env.client_secret
});


var getTopDevelopersInChennai = function (next) {

    var developersInLocation = _.times(1, function (page) {
        return (function (callback) {
                github.search.users({
                        q: 'location:chennai+repos:>5',
                        sort: 'repositories',
                        per_page: 10,
                        page: page + 1
                    },
                    function (err, result) {
                        if (err) {
                            console.info(err);
                        }
                        callback(null, result);
                    })
            }
        )
    });

    async.parallel(developersInLocation, function (err, response) {
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

var enrichEmailAddress = function (profiles, next) {

    var developersInLocation = _.map(profiles, function (profile) {
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
                        callback(null, profile);
                    })
            }
        )
    });

    async.parallel(developersInLocation, function (err, response) {

        next(null, profiles)
    });


};

var EnrichRepos = function (profiles, next) {
    var listOfCallsForRepos = _.map(profiles, function (profile) {
        return (function (callback) {
            github.repos.getFromUser({
                user: profile.loginId
            }, function (err, repositories) {
                var ownedRepositories = _.filter(repositories, function (repository) {
                    return !repository.fork && !_.isNull(repository.language)
                });
                //TODO get languages from language url.
                profile.languages = _.uniq(_.map(ownedRepositories, "language"));
                profile.repository_count = ownedRepositories.length;
                callback(null, profile)
            });
        });
    });

    async.parallel(listOfCallsForRepos, function (err, profiles) {
        next(null, _.sortBy(_.reject(profiles, {repository_count: 0}), 'repository_count').reverse())
    })
};


var displayTopDeveloperProfiles = function (profiles) {
    var table = new Table({
        head: _.keys(profiles[0]),
        colWidths: [20, 50, 50, 10]
    });

    _.forEach(profiles, function (profile) {
        table.push(_.values(profile));
    });

    console.log(table.toString());
};

async.waterfall([
    getTopDevelopersInChennai,
    enrichEmailAddress,
    EnrichRepos,
    displayTopDeveloperProfiles
], function (err, res) {
    console.info(res)
});



