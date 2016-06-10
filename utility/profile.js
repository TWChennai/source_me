var _ = require('lodash')
var Table = require('cli-table')

const scores = {
  forked_repository_count: 1,
  // open_sourcing_private_repo_count : 5,
  push_count: 2,
  wikis_contributed: 3,
  pull_request_reviewed: 8,
  own_repository_count: 10,
  languages_known: 10,
  releases_made: 15,
  pull_request_made: 20
}

function sortProfiles (profiles, sortBy, order) {
  return _.orderBy(profiles, sortBy, order)
}

module.exports = {
  parseItems: function (elements) {
    return _.map(elements, (element) => {
      return { loginId: element.login }
    });
  },
  computeScoreOfProfiles: function (profiles, next) {
    _.each(profiles, function (profile) {
      profile['score'] = 0
      _.each(_.keys(scores), (score_param) => {
        if (score_param == 'languages_known') {
          profile['score'] = profile['score'] + profile[score_param].length * scores[score_param]
        } else {
          profile['score'] = profile['score'] + profile[score_param] * scores[score_param]
        }
      });
    });
  },
  formatProfilesAsTable: function (profiles) {
    var table = new Table({
      head: _.keys(profiles[0]),
      colWidths: [20, 20, 10, 15, 20, 10, 20, 20, 20, 20, 20, 20, 20, 20, 20]
    });

    _.forEach(profiles, (profile) => {
      table.push(_.values(profile));
    });
    return table;
  },
  updateProfilePersonalInfo: function (profile, personalInfo) {
    if (personalInfo) {
      profile.email = personalInfo.email ? personalInfo.email : '';
      profile.name = personalInfo.name ? personalInfo.name : '';
      profile.company = personalInfo.company ? personalInfo.company : '';
      profile.blog = personalInfo.blog ? personalInfo.blog : '';
      profile.hireable = personalInfo.hireable ? 'Yes' : 'No';
    }
  },
  updateActivityInfo: function (profile, activityInfo) {
    if (activityInfo) {
      profile.releases_made = _.filter(activityInfo, {type: 'releaseEvent'}).length;
      profile.push_count = _.filter(activityInfo, {type: 'PushEvent'}).length;
      profile.pull_request_made = _.filter(activityInfo, {type: 'PullRequestEvent'}).length;
      profile.pull_request_reviewed = _.filter(activityInfo, {type: 'PullRequestReviewCommentEvent'}).length;
      profile.open_sourcing_private_repo_count = _.filter(activityInfo, {type: 'PublicEvent'}).length;
      profile.wikis_contributed = _.filter(activityInfo, {type: 'GollumEvent'}).length;
    }
  },
  updateRepositoriesInfo: function (profile, repositories) {
    if (repositories) {
      var ownedRepositories = _.filter(repositories, {fork: false});
      var forkedRepositories = _.filter(repositories, {fork: true});
      // TODO get languages from language url.
      profile.languages_known = _.filter(_.uniq(_.map(ownedRepositories, 'language')), function (language) {
        return !_.isNull(language)
      });
      profile.own_repository_count = ownedRepositories.length;
      profile.forked_repository_count = forkedRepositories.length;
    }
  },
  rejectEmptyProfiles: function (profiles) {
    return _.reject(profiles, {own_repository_count: 0});
  },
  sortProfiles: function (profiles, sortBy, order = 'asc') {
    sortProfiles(profiles, sortBy, order);
    return profiles;
  }
}
