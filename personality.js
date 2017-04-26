'use strict';
var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3'),
    util = require('./tools/util.js'),
    flatten = require('./tools/flatten.js');

function getDiffProfiles(profile, type) {
  var distances = util.calculateDistances(profile, type);

  // Remove celebrities to match to themselves
  if (distances[0].distance === 1.00)
    distances = distances.slice(1);

  // Return 6 most similar and different profiles
  return {
    similar: distances.slice(0, Math.min(3, distances.length)),
    different: distances.reverse().slice(0, Math.min(3, distances.length))
  };
}

var getProfile = function getProfile(userDescription, name, cb){
    var personality_insights = new PersonalityInsightsV3({
            username: process.env.PERSONALITY_INSIGHTS_USERNAME,
            password: process.env.PERSONALITY_INSIGHTS_PASSWORD,
            version_date: '2016-10-19'
        });
        
    personality_insights.profile({text: userDescription, consumption_preferences: true}, function (err, profile) {
        if (err){
            debug('Error personality_insights profile: %o', err);
            return cb(err, null);
        }
        else{
            var personalityDiff = getDiffProfiles(profile, 'personality'),
                needsDiff = getDiffProfiles(profile, 'needs'),
                valuesDiff = getDiffProfiles(profile, 'values');
            if(!name){
                name = "";
            }
            var ret = {
                user: name,
                // return the flattened user profiles for each type
                user_profile: {
                    personality: flatten.traits(profile, 'personality'),
                    needs: flatten.traits(profile, 'needs'),
                    values: flatten.traits(profile, 'values')
                },
                // return the 6 most similar/different profiles for each type
                similar_personalities: personalityDiff.similar,
                different_personalities: personalityDiff.different,
                similar_needs: needsDiff.similar,
                different_needs: needsDiff.different,
                similar_values: valuesDiff.similar,
                different_values: valuesDiff.different
            };

            return cb(null, ret);
        }
    });
}

module.exports.getProfile = getProfile;