module.exports = function(grunt) {

    ['grunt-mocha-test',
    'grunt-contrib-watch',
    'grunt-contrib-copy',
    'grunt-contrib-uglify',
    'grunt-browserify',
    'grunt-react',
    'grunt-karma'].forEach(grunt.loadNpmTasks);

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
        copy: {
            files: {
                cwd: 'public/src/',
                src: '**/*.js',
                dest: 'public/js',
                expand: true
            }
        },
        uglify: {
            release: {
                files: {
                    'public/js/app.min.js': ['public/js/app.js'],
                    'public/js/viewer.min.js': ['public/js/viewer.js']
                }
            }
        },
        react: {
            jsx: {
                files: [{
                    expand: true,
                    cwd: 'public/src/',
                    src: ['**/*.jsx'],
                    dest: 'public/js',
                    ext: '.js'
                }]
            }
        },
        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                }
            },
            viewerBundle: {
                src: ['public/js/app/dossiers/AllDossiers.js'],
                dest: 'public/js/viewer.js'
            },
            appBundle: {
                src: ['public/js/app/viewer/DossierApp.js'],
                dest: 'public/js/app.js'
            }
        },
        watch: {
            js: {
                options: {
                    spawn: false
                },
                files: ['app.js', 'routes/**/*.js'],
                tasks: ['default']
            },
            reactjs: {
                options: {
                    spawn: false
                },
                files: ['public/src/**/*.js'],
                tasks: ['copy', 'browserify']
            },
            jsx: {
                options: {
                    spawn: false
                },
                files: ['public/src/**/*.jsx'],
                tasks: ['react', 'browserify']
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

    grunt.registerTask('debug', ['react', 'copy', 'browserify']);

    grunt.registerTask('build', ['debug', 'uglify']);

};