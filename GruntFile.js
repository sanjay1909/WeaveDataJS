module.exports = function(grunt) {

  // 1. All configuration goes here
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            // 2. Configuration for concatinating files goes here.
            dist: {
                src: [
                    'src/utils/*.js', // All JS in the libs folder

                    'src/data/AttributeColumns/*.js'

               ],
                dest: 'weavedata.js',
            }
        },
        uglify: {
            build: {
                src: 'weavedata.js',
                dest: 'weavedata.min.js'
            }
}

    });

    // 3. Where we tell Grunt we plan to use this plug-in.
    grunt.loadNpmTasks('grunt-contrib-concat');// to combine all files to a single file
    grunt.loadNpmTasks('grunt-contrib-uglify');// to minify the combined file

    // 4. Where we tell Grunt what to do when we type "grunt" into the terminal.
    grunt.registerTask('default', ['concat', 'uglify']);

};
