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
    Object.defineProperty(IColumnWrapper, 'NS', {
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
    Object.defineProperty(IColumnWrapper, 'CLASS_NAME', {
        value: 'IColumnWrapper'
    });

    /**
     * This is an prototype for a column that is a wrapper for another column.
     * The data should always be retrieved from the wrapper class because the getValueFromKey() function may modify the data before returning it.
     * The purpose of this prototype is to allow you to check the type of the internal column.
     * One example usage of this is to check if the internal column is a StreamedGeometryColumn
     * so that you can request more detail from the tile service.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IColumnWrapper() {
        weavedata.IAttributeColumn.call(this);
    }

    IColumnWrapper.prototype = new weavedata.IAttributeColumn();
    IColumnWrapper.prototype.constructor = IColumnWrapper;

    var p = IColumnWrapper.prototype;
    /**
     * @return The internal column this object is a wrapper for.
     */
    p.getInternalColumn = function () {
        console.log("Implement in Child");
    };

    if (typeof exports !== 'undefined') {
        module.exports = IColumnWrapper;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IColumnWrapper = IColumnWrapper;
    }
    weavecore.ClassUtils.registerClass('weavedata.IColumnWrapper', weavedata.IColumnWrapper);

}());
