var GitHubApi = require("github");
var _ = require('lodash');
var async = require('async');

var github = new GitHubApi({
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub
    timeout: 5000,
    version: '3.0.0',
    headers: {
        "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
    }
});

var getUserRepos = function (users) {
    var listOfCallsForRepos = _.map(users, function (user) {
        return (function () {
            console.info(user);
            github.search.repos({
                q: 'user:' + user
            }, function (err, res) {
                console.info("===========================");
                console.log(JSON.stringify(res));
            });
        });
    });

    async.parallel(listOfCallsForRepos, function (err, result) {
        console.info(err);
        console.info(result)
    })

};

var processDeveloperRepos = function (res, next) {
    var items = res.items;
    next(null, _.map(items, "login"));
};

var getTopDevelopersInChennai = function (next) {
    github.search.users({
            q: 'location:chennai+repos:>50',
            sort: 'repositories'
        },
        function (err, result) {
            console.info(result);
            next(err, result);
        })
};

async.waterfall([
    getTopDevelopersInChennai,
    processDeveloperRepos,
    getUserRepos
], function (err, res) {
    console.info(err);
    console.info(res)
});
