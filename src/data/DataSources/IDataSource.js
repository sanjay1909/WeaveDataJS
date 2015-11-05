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
    Object.defineProperty(IDataSource, 'NS', {
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
    Object.defineProperty(IDataSource, 'CLASS_NAME', {
        value: 'IDataSource'
    });


    /**
     * This is a simple and generic interface for getting columns of data from a source.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function IDataSource() {
        weavecore.ILinkableObject.call(this);


        /**
         * When explicitly triggered, this will force the hierarchy to be refreshed.
         * This should not be used to determine when the hierarchy is updated.
         * For that purpose, add a callback directly to the IDataSource instead.
         */
        Object.defineProperty(this, "hierarchyRefresh", {
            get: function () {
                return null;
            },
            configurable: true
        });
    }

    IDataSource.prototype = new weavecore.ILinkableObject();
    IDataSource.prototype.constructor = IDataSource;
    var p = IDataSource.prototype;


    /**
     * Gets the root node of the attribute hierarchy, which should have descendant nodes that implement IColumnReference.
     */
    p.getHierarchyRoot = function () {};

    /**
     * Finds the hierarchy node that corresponds to a set of metadata, or null if there is no such node.
     * @param metadata Metadata used to identify a node in the hierarchy, which may or may not reference a column.
     * @return The hierarchy node corresponding to the metadata or null if there is no corresponding node.
     */
    p.findHierarchyNode = function (metadata) {};

    /**
     * Retrieves an IAttributeColumn from this IDataSource.
     * @param metadata Metadata used to identify a column in this IDataSource.
     * @return An IAttributeColumn object that will be updated when the column data is available.
     */
    p.getAttributeColumn = function (metadata) {};


    if (typeof exports !== 'undefined') {
        module.exports = IDataSource;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.IDataSource = IDataSource;

    }

    weavecore.ClassUtils.registerClass('weavedata.IDataSource', weavedata.IDataSource);

}());
