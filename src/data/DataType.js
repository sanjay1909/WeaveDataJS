(function () {
    function DataType() {

    }


    DataType.ALL_TYPES = [DataType.NUMBER, DataType.STRING, DataType.DATE, DataType.GEOMETRY];

    DataType.NUMBER = "number";
    DataType.STRING = "string";
    DataType.DATE = "date";
    DataType.GEOMETRY = "geometry";

    /**
     * Gets the Class associated with a dataType metadata value.
     * This Class indicates the type of values stored in a column with given dataType metadata value.
     * @param dataType A dataType metadata value.
     * @return The associated Class, which can be used to pass to IAttributeColumn.getValueFromKey().
     * @see weave.api.data.IAttributeColumn#getValueFromKey()
     */
    DataType.getClass = function (dataType) {
        switch (dataType) {
        case DataType.NUMBER:
            return Number;
        case DataType.DATE:
            return Date;
        case DataType.GEOMETRY:
            return Array;
        default:
            return String;
        }
    }


    if (typeof exports !== 'undefined') {
        module.exports = DataType;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DataType = DataType;
    }

}());
