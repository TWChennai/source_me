var GitHubApi = require("github");
var lodash = require('lodash')

  console.log("Hello world");

  var github = new GitHubApi({
      // optional
      debug: true,
      protocol: "https",
      host: "api.github.com", // should be api.github.com for GitHub
      timeout: 5000,
      version: '3.0.0',
      headers: {
          "user-agent": "My-Cool-GitHub-App" // GitHub is happy with a unique user agent
      }
  });
  console.log(github.repos);
  github.search.users({
      q:'location:chennai+repos:>50',
      sort:'repositories'
  }, function(err, res) {
    var items = res.items;
    console.log("count - "+ res.total_count);

    items.forEach(function(value){
      console.log(JSON.stringify(value.login));
      /*github.search.repos({
        q:'user:' + value.login,
        function(err, res){
          console.log(JSON.stringify(res));
        }
      })*/
    })
  });
