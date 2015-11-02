/**
 * This provides a wrapper for a dynamically created column.
 *
 * @author adufilie
 * @author asanjay
 */
/*public class DynamicColumn extends LinkableDynamicObject implements IColumnWrapper
	{*/

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
    Object.defineProperty(DynamicKeyFilter, 'NS', {
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
    Object.defineProperty(DynamicKeyFilter, 'CLASS_NAME', {
        value: 'DynamicKeyFilter'
    });



    /**
     * This is a wrapper for a dynamically created object implementing IKeyFilter.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function DynamicKeyFilter() {
        weavecore.LinkableDynamicObject.call(weavedata.KeyFilter);
    }

    DynamicKeyFilter.prototype = new weavecore.LinkableDynamicObject();
    DynamicKeyFilter.prototype.constructor = DynamicKeyFilter;

    var p = DynamicKeyFilter.prototype;

    p.getInternalKeyFilter = function () {
        var kf = (this.internalObject && this.internalObject instanceof weavedata.KeyFilter) ? this.internalObject : null;
        return kf;
    }



    if (typeof exports !== 'undefined') {
        module.exports = DynamicKeyFilter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.DynamicKeyFilter = DynamicKeyFilter;
    }

}());
