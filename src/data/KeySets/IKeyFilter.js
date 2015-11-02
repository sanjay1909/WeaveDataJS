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
    Object.defineProperty(IKeyFilter, 'NS', {
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
    Object.defineProperty(IKeyFilter, 'CLASS_NAME', {
        value: 'IKeyFilter'
    });


    /**
     * This is an interface to an object that decides which IQualifiedKey objects are included in a set or not.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IKeyFilter() {
        weavecore.ILinkableObject.call(this);
    }

    IKeyFilter.prototype = new weavecore.ILinkableObject();
    IKeyFilter.prototype.constructor = IKeyFilter;
    var p = IKeyFilter.prototype;

    /**
     * This function tests if a IQualifiedKey object is contained in this IKeySet.
     * @param key A IQualifiedKey object.
     * @return true if the IQualifiedKey object is contained in the IKeySet.
     */
    p.containsKey = function (key) {}


    if (typeof exports !== 'undefined') {
        module.exports = IKeyFilter;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IKeyFilter = IKeyFilter;
    }

}());
