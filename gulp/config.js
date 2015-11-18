var dest = "./build";
var outputDocsFolder = dest + "/docs";
var src = './src';

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

                    'src/data/AttributeColumns/IAttributeColumn.js',
                    'src/data/AttributeColumns/IColumnWrapper.js',
                    'src/data/AttributeColumns/AbstractAttributeColumn.js',
                    'src/data/AttributeColumns/DateColumn.js',
                    'src/data/AttributeColumns/NumberColumn.js',
                    'src/data/AttributeColumns/StringColumn.js',
                    'src/data/AttributeColumns/KeyColumn.js',
                    'src/data/AttributeColumns/CSVColumn.js',
                    'src/data/AttributeColumns/ReferencedColumn.js',
                    'src/data/AttributeColumns/ProxyColumn.js',
                    'src/data/AttributeColumns/KeyColumn.js',
                    'src/data/AttributeColumns/DynamicColumn.js',
                    'src/data/AttributeColumns/ExtendedDynamicColumn.js',
                    'src/data/AttributeColumns/AlwaysDefinedColumn.js',
                    'src/data/AttributeColumns/FilteredColumn.js',
                    'src/data/AttributeColumns/ColumnDataTask.js',

                    'src/data/DataSources/IDataSource.js',
                    'src/data/DataSources/AbstractDataSource.js',
                    'src/data/DataSources/CSVDataSource.js',

                    'src/data/hierarchy/WeaveTreeDescriptorNode.js',
                    'src/data/hierarchy/ColumnTreeNode.js',
                    'src/data/hierarchy/WeaveRootDataTreeNode.js',

                    'src/primitives/Point.js',
                    'src/primitives/Rectangle.js',
                    'src/primitives/Range.js',
                    'src/primitives/Bounds2D.js',
                    'src/primitives/ZoomBounds.js',
                    'src/primitives/LinkableNumberFormatter.js',
                    'src/primitives/LinkableBounds2D.js',

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
