if (this.weavedata === undefined) this.weavedata = {};
(function () {
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
        weavedata.AbstractAttributeColumn.call(this);
    }

    IColumnWrapper.prototype = new weavedata.AbstractAttributeColumn();
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
        console.log('window is used');
        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IColumnWrapper = IColumnWrapper;
    }
}());
