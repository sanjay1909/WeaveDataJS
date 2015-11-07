/**
 * This object contains a mapping from keys to data values.
 *
 * @author adufilie
 * @author sanjay1909
 */

(function () {

    /**
     * temporary solution to save the namespace for this class/prototype
     * @static
     * @public
     * @property NS
     * @default weavecore
     * @readOnly
     * @type String
     */
    Object.defineProperty(IAttributeColumn, 'NS', {
        value: 'weavedata'
    });

    /**
     * TO-DO:temporary solution to save the CLASS_NAME constructor.name works for window object , but modular based won't work
     * @static
     * @public
     * @property CLASS_NAME
     * @readOnly
     * @type String
     */
    Object.defineProperty(IAttributeColumn, 'CLASS_NAME', {
        value: 'IAttributeColumn'
    });

    function IAttributeColumn() {
        weavecore.CallbackCollection.call(this);



    }



    IAttributeColumn.prototype = new weavecore.CallbackCollection();
    IAttributeColumn.prototype.constructor = IAttributeColumn;

    var p = IAttributeColumn.prototype;

    /**
     * This function gets metadata associated with the column.
     * For standard metadata property names, refer to the ColumnMetadata class.
     * @param propertyName The name of the metadata property to retrieve.
     * @return The value of the specified metadata property.
     */
    p.getMetadata = function (propertyName) {};

    /**
     * Retrieves all metadata property names for this column.
     * @return An Array of all available metadata property names.
     */
    p.getMetadataPropertyNames = function () {};

    /**
     * This function gets a value associated with a record key.
     * @param key A record key.
     * @param dataType The desired value type (Examples: Number, String, Date, Array, IQualifiedKey)
     * @return The value associated with the given record key.
     */
    p.getValueFromKey = function (key, dataType) {};

    weavedata.IAttributeColumn = IAttributeColumn;

    if (typeof exports !== 'undefined') {
        module.exports = IAttributeColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IAttributeColumn = IAttributeColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.IAttributeColumn', weavedata.IAttributeColumn);
}());
