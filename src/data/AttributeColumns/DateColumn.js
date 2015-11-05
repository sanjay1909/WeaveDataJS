/**
 *
 * @author adufilie
 * @author asanjay
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
    Object.defineProperty(DateColumn, 'NS', {
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
    Object.defineProperty(DateColumn, 'CLASS_NAME', {
        value: 'DateColumn'
    });

    function DateColumn(metadata) {
        metadata = (metadata === undefined) ? null : metadata;
        weavedata.AbstractAttributeColumn.call(this, metadata);


    }



    DateColumn.prototype = new weavedata.AbstractAttributeColumn();
    DateColumn.prototype.constructor = DateColumn;
    var p = DateColumn.prototype;



    if (typeof exports !== 'undefined') {
        module.exports = DateColumn;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DateColumn = DateColumn;
    }

    weavecore.ClassUtils.registerClass('weavedata.DateColumn', weavedata.DateColumn);

}());
