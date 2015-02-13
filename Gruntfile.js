module.exports = function (grunt) {

    // Add the grunt-mocha-test tasks.
    grunt.loadNpmTasks('grunt-mocha-test');

    // Add the grunt watch plugin
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Add the grunt karma plugin
    grunt.loadNpmTasks('grunt-karma');

    grunt.initConfig({
        /**
         * Grunt task to run unit tests using the mocha framework.
         *
         **/
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

        /**
         *
         * This task compiles all of React's .jsx files to *.js files and places it it in the
         *
         **/
        react: {
            jsx: {
                files: [{
                    expand: true,
                    cwd: './src',
                    src: ['**/*.jsx'],
                    dest: 'public/js',
                    ext: '.js'
                }]
            }
        },

        watch: {
            js: {
                options: {
                    spawn: false
                },
                files: ['app.js', 'routes/**/*.js'],
                tasks: ['tests']
            },

            jsx: {
                files: ['**/*.jsx'],
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
    grunt.event.on('watch', function (action, filepath) {
        grunt.config('mochaTest.test.src', defaultTestSrc);
        if (filepath.match('tests/')) {
            grunt.config('mochaTest.test.src', filepath);
        }
    });

    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-react');

    grunt.registerTask('default', 'react');

    grunt.registerTask('tests', 'mochaTest');

};