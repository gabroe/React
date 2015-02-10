module.exports = function(grunt) {

    // Add the grunt-mocha-test tasks.
    grunt.loadNpmTasks('grunt-mocha-test');

    // Add the grunt watch plugin
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Add the grunt karma plugin
    grunt.loadNpmTasks('grunt-karma');

    grunt.initConfig({
        // Configure a mochaTest task
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    captureFile: 'results.txt', // Optionally capture the reporter output to a file
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: true, // Optionally clear the require cache before running tests (defaults to false),
                    require: 'tests/blanket'
                },
                src: ['tests/integration_tests/**/*Test.js', 'tests/unit_tests/server/**/*Test.js']
            },
            coverage: {
                options: {
                    reporter: 'html-cov',
                    quiet: true,
                    captureFile: 'coverage.html'
                },
                src: ['tests/unit_tests/server/**/*Test.js']
            }
        },
        watch: {
            js: {
                options: {
                    spawn: false
                },
                files: ['app.js', 'routes/**/*.js'],
                tasks: ['default']
            }
        },
        karma: {
            unit: {
                configFile: 'karma.conf.js',
                autoWatch: true
            }
        }
    });

    // On watch events, if the changed file is a test file then configure mochaTest to only
    // run the tests from that file. Otherwise run all the tests
    var defaultTestSrc = grunt.config('mochaTest.test.src');
    grunt.event.on('watch', function(action, filepath) {
        grunt.config('mochaTest.test.src', defaultTestSrc);
        if (filepath.match('tests/')) {
            grunt.config('mochaTest.test.src', filepath);
        }
    });

    grunt.registerTask('default', 'mochaTest');

};