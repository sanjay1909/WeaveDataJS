var dest = "./build";
var outputDocsFolder = dest + "/docs"

//used both for Source reference and Order reference
var buildOrder = [
                    'src/utils/*.js',

                    'src/data/Aggregation.js',
                    'src/data/StatisticsCache.js',
                    'src/data/AttributeColumnCache.js',
                    'src/data/QKeyManager.js',
                    'src/data/CSVParser.js',
                    'src/data/ColumnMetadata.js',
                    'src/data/DataType.js',
                    'src/data/DateFormat.js',
                    'src/data/EntityType.js',

                    'src/data/KeySets/*.js',
                    'src/data/AttributeColumns/*.js',

                    'src/data/DataSources/IDataSource.js',
                    'src/data/DataSources/AbstractDataSource.js',
                    'src/data/DataSources/CSVDataSource.js',

                    'src/data/hierarchy/WeaveTreeDescriptorNode.js',
                    'src/data/hierarchy/ColumnTreeNode.js',
                    'src/data/hierarchy/WeaveRootDataTreeNode.js',

                    'src/WeavePathData.js'


               ];

module.exports = {
    context: __dirname,
    browserSync: {
        server: {
            // Serve up our build folder
            baseDir: dest
        }
    },
    sass: {
        src: src + "/sass/**/*.{sass,scss}",
        dest: dest,
        settings: {
            indentedSyntax: true, // Enable .sass syntax!
            imagePath: 'images' // Used by the image-url helper
        }
    },
    images: {
        src: src + "/images/**",
        dest: dest + "/images"
    },
    markup: {
        src: src + "/htdocs/**",
        dest: dest
    },
    iconFonts: {
        name: 'Gulp Starter Icons',
        src: src + '/icons/*.svg',
        dest: dest + '/fonts',
        sassDest: src + '/sass',
        template: './gulp/tasks/iconFont/template.sass.swig',
        sassOutputName: '_icons.sass',
        fontPath: 'fonts',
        className: 'icon',
        options: {
            fontName: 'Post-Creator-Icons',
            appendCodepoints: true,
            normalize: false
        }
    },
    concat: {
        combined: 'weavedata.js',
        scriptFiles: buildOrder,
        dest: dest
    },

    lint: {
        scriptFiles: buildOrder
    },
    production: {
        cssSrc: dest + '/*.css',
        jsSrc: dest + '/*.js',
        dest: dest
    }
};
