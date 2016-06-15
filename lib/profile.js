'use strict'
var _ = require('lodash')
function Profile (loginid) {
  this.loginId = loginid
  this.score = 0
  this.email = ''
  this.name = ''
  this.company = ''
  this.blog = ''
  this.hireable = 'No'
  this.releases_made = 0
  this.push_count = 0
  this.pull_request_made = 0
  this.pull_request_reviewed = 0
  this.open_sourcing_private_repo_count = 0
  this.wikis_contributed = 0
  this.languages_known = ''
  this.own_repository_count = 0
  this.forked_repository_count = 0
}
Profile.prototype.computeScore = function (scores) {
  _.each(_.keys(scores), (score_param) => {
    if (score_param == 'languages_known') {
      this.score = this.score + this.languages_known.length * scores[score_param]
    } else {
      this.score = this.score + this[score_param] * scores[score_param]
    }
  })
}

Profile.prototype.updateRepositoriesInfo = function (repositories) {
  if (repositories) {
    var ownedRepositories = _.filter(repositories, {fork: false})
    var forkedRepositories = _.filter(repositories, {fork: true})
    // TODO get languages from language url.
    this.languages_known = _.filter(_.uniq(_.map(ownedRepositories, 'language')), function (language) {
      return !_.isNull(language)
    })
    this.own_repository_count = ownedRepositories.length
    this.forked_repository_count = forkedRepositories.length
  }
}
Profile.prototype.updateActivityInfo = function (activityInfo) {
  if (activityInfo) {
    this.releases_made = _.filter(activityInfo, {type: 'releaseEvent'}).length
    this.push_count = _.filter(activityInfo, {type: 'PushEvent'}).length
    this.pull_request_made = _.filter(activityInfo, {type: 'PullRequestEvent'}).length
    this.pull_request_reviewed = _.filter(activityInfo, {type: 'PullRequestReviewCommentEvent'}).length
    this.open_sourcing_private_repo_count = _.filter(activityInfo, {type: 'PublicEvent'}).length
    this.wikis_contributed = _.filter(activityInfo, {type: 'GollumEvent'}).length
  }
}
Profile.prototype.updatePersonalInfo = function (personalInfo) {
  if (personalInfo) {
    this.email = personalInfo.email ? personalInfo.email : ''
    this.name = personalInfo.name ? personalInfo.name : ''
    this.company = personalInfo.company ? personalInfo.company : ''
    this.blog = personalInfo.blog ? personalInfo.blog : ''
    this.hireable = personalInfo.hireable ? 'Yes' : 'No'
  }
}

module.exports = Profile
