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
    Object.defineProperty(IKeySet, 'NS', {
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
    Object.defineProperty(IKeySet, 'CLASS_NAME', {
        value: 'IKeySet'
    });


    /**
     * This is an extension of IKeyFilter that adds a complete list of the IQualifiedKey objects contained in the key set.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IKeySet() {
        weavedata.IKeyFilter.call(this);

        /**
         * This is a list of the IQualifiedKey objects that define the key set.
         */
        Object.defineProperty(this, 'keys', {
            get: function () {
                return []
            },
            configurable: true
        })
    }

    IKeySet.prototype = new weavecore.IKeyFilter();
    IKeySet.prototype.constructor = IKeySet;

    if (typeof exports !== 'undefined') {
        module.exports = IKeySet;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IKeySet = IKeySet;
    }

}());
