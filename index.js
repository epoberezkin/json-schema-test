'use strict';


var glob = require('glob')
  , path = require('path')
  , assert = require('assert');


module.exports = jsonSchemaTest;


function jsonSchemaTest(validators, opts) {
  for (var suiteName in opts.suites)
    addTests(suiteName, opts.suites[suiteName]);


  function addTests(suiteName, testsPath) {
    describe(suiteName, function() {
      var files = getTestFiles(testsPath);

      files.forEach(function (file) {
        var filter = {
          skip: opts.skip && opts.skip.indexOf(file.name) >= 0,
          only: opts.only && opts.only.indexOf(file.name) >= 0
        }

        skipOrOnly(filter, describe)(file.name, function() {
          var testPath = path.join(opts.cwd, file.path)
            , testDir = path.dirname(testPath);
          var testSets = require(testPath);
          testSets.forEach(function (testSet) {
            skipOrOnly(testSet, describe)(testSet.description, function() {
              testSet.tests.forEach(function (test) {
                skipOrOnly(test, it)(test.description, function() {
                  if (Array.isArray(validators)) validators.forEach(doTest)
                  else doTest(validators)
                });

                function doTest(validator) {
                  if (test.dataFile) {
                    var dataFile = path.resolve(testDir, test.dataFile);
                    var data = require(dataFile);
                  } else
                    var data = test.data;
                  var valid = validator.validate(testSet.schema, data);
                  if (valid !== test.valid) console.log('result', valid, test.valid, validator.errors);
                  assert.equal(valid, test.valid);
                  if (valid) assert(!validator.errors || validator.errors.length == 0);
                  else assert(validator.errors.length > 0);
                }
              });
            });
          });
        });
      });
    });
  }


  function skipOrOnly(filter, func) {
    return filter.only ? func.only : filter.skip ? func.skip : func;
  }


  function getTestFiles(testsPath) {
    console.log('testsPath', testsPath, opts.cwd);
    var files = glob.sync(testsPath, { cwd: opts.cwd });
    return files.map(function (file) {
      var match = file.match(/(\w+\/)\w+\.json/)
      var folder = match ? match[1] : '';
      if (opts.hideFolder && folder == opts.hideFolder) folder = '';
      return { path: file, name: folder + path.basename(file, '.json') };
    });
  }
}
