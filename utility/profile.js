'use strict';
var _ = require('lodash')
var Table = require('cli-table')
var Profile = require('../lib/profile');
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
      return new Profile(element.login);
    });
  },
  computeScoreOfProfiles: function (profiles) {
    _.each(profiles, function (profile) {
      profile.computeScore(scores);
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
  rejectEmptyProfiles: function (profiles) {
    return _.reject(profiles, {own_repository_count: 0});
  },
  sortProfiles: function (profiles, sortBy, order = 'asc') {
    sortProfiles(profiles, sortBy, order);
    return profiles;
  }
}
