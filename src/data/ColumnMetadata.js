(function () {
    function ColumnMetadata() {

    }


    ColumnMetadata.ENTITY_TYPE = 'entityType';
    ColumnMetadata.TITLE = "title";
    ColumnMetadata.NUMBER = "number";
    ColumnMetadata.STRING = "string";
    ColumnMetadata.KEY_TYPE = "keyType";
    ColumnMetadata.DATA_TYPE = "dataType";
    ColumnMetadata.PROJECTION = "projection";
    ColumnMetadata.AGGREGATION = "aggregation";
    ColumnMetadata.DATE_FORMAT = "dateFormat";
    ColumnMetadata.DATE_DISPLAY_FORMAT = "dateDisplayFormat";
    ColumnMetadata.OVERRIDE_BINS = "overrideBins";
    ColumnMetadata.MIN = "min";
    ColumnMetadata.MAX = "max";

    ColumnMetadata.getAllMetadata = function (column) {
        var meta = {};
        var propertyNames = column.getMetadataPropertyNames();
        for (var i = 0; i < propertyNames.length; i++)
            meta[name] = column.getMetadata(name);
        return meta;

    }

    /**
     * @param propertyName The name of a metadata property.
     * @return An Array of suggested String values for the specified metadata property.
     */
    ColumnMetadata.getSuggestedPropertyValues = function (propertyName) {
        switch (propertyName) {
        case ColumnMetadata.ENTITY_TYPE:
            return weavedata.EntityType.ALL_TYPES;

        case ColumnMetadata.DATA_TYPE:
            return weavedata.DataType.ALL_TYPES;

        case ColumnMetadata.DATE_DISPLAY_FORMAT:
        case ColumnMetadata.DATE_FORMAT:
            return weavedata.DateFormat.getSuggestions();

        case ColumnMetadata.AGGREGATION:
            return weavedata.Aggregation.ALL_TYPES;

        default:
            return [];
        }
    }


    if (typeof exports !== 'undefined') {
        module.exports = ColumnMetadata;
    } else {
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColumnMetadata = ColumnMetadata;
    }

}());
