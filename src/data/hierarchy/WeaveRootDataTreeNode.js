(function () {

    /**
     * A node in a tree whose leaves identify attribute columns.
     * The following properties are used for equality comparison, in addition to node class definitions:<br>
     * <code>dependency, data</code><br>
     * The following properties are used by WeaveRootDataTreeNode but not for equality comparison:<br>
     * <code>label, children, hasChildBranches</code><br>
     */
    function WeaveRootDataTreeNode() {
        var rootNode = this;
        var root = WeaveAPI.globalHashMap;
        WeaveAPI.SessionManager.registerLinkableChild(this, root.childListCallbacks);
        Object.defineProperty(this, 'sessionable', {
            value: true;
        });

        var obj = {
            dependency: rootNode,
            label: 'Data Sources',
            hasChildBranches: true,
            children: function () {
                var sources = root.getObjects(weavedata.IDataSource).concat(weavedata.AttributeColumnCache.globalColumnDataSource);
                var nodes = sources.map(
                    function (ds) {
                        WeaveAPI.SessionManager.registerLinkableChild(rootNode, ds);
                        return ds.getHierarchyRoot();
                    }
                );

                // only show global columns node if it has at least one child
                var globalColumnsNode = nodes[nodes.length - 1];
                if (!globalColumnsNode.getChildren().length)
                    nodes.pop();

                return nodes;
            }
        }
        weavecore.WeaveTreeDescriptorNode.call(this, obj);
    }

    WeaveRootDataTreeNode.prototype = new weavecore.WeaveTreeDescriptorNode();
    WeaveRootDataTreeNode.prototype.constructor = WeaveRootDataTreeNode;

    var p = WeaveRootDataTreeNode.prototype;



    if (typeof exports !== 'undefined') {
        module.exports = WeaveRootDataTreeNode;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.WeaveRootDataTreeNode = WeaveRootDataTreeNode;
    }

     weavecore.ClassUtils.registerClass('weavedata.WeaveRootDataTreeNode', weavedata.WeaveRootDataTreeNode);

}());
