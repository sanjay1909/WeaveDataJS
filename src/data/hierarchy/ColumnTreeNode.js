/**
 * A node in a tree whose leaves identify attribute columns.
 * The <code>data</code> property is used for column metadata on leaf nodes.
 * The following properties are used for equality comparison, in addition to node class definitions:<br>
 * <code>dataSource, data, idFields</code><br>
 * The following properties are used by ColumnTreeNode but not for equality comparison:<br>
 * <code>label, children, hasChildBranches</code><br>
 */
(function () {
    /**
     * The <code>data</code> parameter is used for column metadata on leaf nodes.
     * The following properties are used for equality comparison, in addition to node class definitions:
     *     <code>dependency, data, dataSource, idFields</code><br>
     * The following properties are used by ColumnTreeNode but not for equality comparison:
     *     <code>label, children, hasChildBranches</code><br>
     * @params An values for the properties of this ColumnTreeNode.
     *         The <code>dataSource</code> property is required.
     *         If no <code>dependency</code> property is given, <code>dataSource.hierarchyRefresh</code> will be used as the dependency.
     */

    function ColumnTreeNode(params) {
        weavedata.WeaveTreeDescriptorNode.call(this, params);

        /**
         * IDataSource for this node.
         */
        this.dataSource = null;

        /**
         * A list of data fields to use for node equality tests.
         */
        this.idFields = null;

        /**
         * If there is no label, this will use data['title'] if defined.
         */
        Object.defineProperty(this, 'label', {
            get: function () {
                var str = weavedata.WeaveTreeDescriptorNode.prototype.label;
                if (!str && data)
                    str = (typeof data === 'object' && data.hasOwnProperty(weavedata.ColumnMetadata.TITLE)) ? data[weavedata.ColumnMetadata.TITLE] : data.toString();
                return str;
            },
            configurable: true
        });

        this.childItemClass = ColumnTreeNode;

        if (!this.dataSource)
            throw new Error('ColumnTreeNode constructor: "dataSource" parameter is required');
        if (!this.dependency)
            this.dependency = this.dataSource.hierarchyRefresh;

    }
    ColumnTreeNode.prototype = new weavedata.WeaveTreeDescriptorNode();
    ColumnTreeNode.prototype.constructor = ColumnTreeNode;

    var p = ColumnTreeNode.prototype;


    /**
     * Compares constructor, dataSource, dependency, data, idFields.
     * @inheritDoc
     */
    p.equals = function (other) {
        var that = (other && other instanceof ColumnTreeNode) ? other : null;
        if (!that)
            return false;

        // compare constructor
        if (Object(this).constructor !== Object(that).constructor)
            return false; // constructor differs

        // compare dependency
        if (this.dependency !== that.dependency)
            return false; // dependency differs

        // compare dataSource
        if (this.dataSource !== that.dataSource)
            return false; // dataSource differs

        // compare idFields
        if (weavecore.StandardLib.compare(this.idFields, that.idFields) !== 0)
            return false; // idFields differs

        // compare data
        if (this.idFields) // partial data comparison
        {
            for (var i = 0; i < idFields.length; i++) {
                var field = idFields[i];
                if (weavecore.StandardLib.compare(this.data[field], that.data[field]) !== 0)
                    return false; // data differs
            }
        } else if (weavecore.StandardLib.compare(this.data, that.data) !== 0) // full data comparison
            return false; // data differs

        return true;
    }

    /**
     * @inheritDoc
     */
    p.getDataSource = function () {
        return this.dataSource;
    }

    /**
     * @inheritDoc
     */
    p.getColumnMetadata = function () {
        if (this.isBranch())
            return null;
        return data;
    }

    /**
     * @inheritDoc
     */
    p.findPathToNode = function (descendant) {
        // base case - if nodes are equal
        if (this.equals(descendant))
            return [this];

        // stopping condition - if ColumnTreeNode descendant dataSource or idFields values differ
        var _descendant = (descendant && descendant instanceof ColumnTreeNode) ? descendant : null;
        if (_descendant) {
            // don't look for a descendant with different a dataSource
            if (weavecore.StandardLib.compare(this.dataSource, _descendant.dataSource) != 0)
                return null;

            // if this node has idFields, make sure the id values match those of the descendant

            if (this.idFields && this.data && _descendant.data)
                for (var i = 0; i < idFields.length; i++) {
                    var field = idFields[i];
                    if (this.data[field] != _descendant.data[field])
                        return null;
                }

        }

        // finally, check each child
        var children = this.getChildren()
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var path = weavedata.HierarchyUtils.findPathToNode(child, descendant);
            if (path) {
                path.unshift(this);
                return path;
            }
        }

        return null;
    }

    if (typeof exports !== 'undefined') {
        module.exports = ColumnTreeNode;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.ColumnTreeNode = ColumnTreeNode;
    }

}());
