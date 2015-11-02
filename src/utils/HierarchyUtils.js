(function () {
    function HierarchyUtils() {

    }

    /**
     * Finds a series of IWeaveTreeNode objects which can be traversed as a path to a descendant node.
     * @param root The root IWeaveTreeNode.
     * @param descendant The descendant IWeaveTreeNode.
     * @return An Array of IWeaveTreeNode objects which can be followed as a path from the root to the descendant, including the root and descendant nodes.
     *         The last item in the path may be the equivalent node found in the hierarchy rather than the descendant node that was passed in.
     *         Returns null if the descendant is unreachable from this node.
     * @see weave.api.data.IWeaveTreeNode#equals()
     */
    HierarchyUtils.findPathToNode = function (root, descendant) {
        if (!root || !descendant)
            return null;

        if (root.findPathToNode)
            return root.findPathToNode(descendant);

        if (root.equals(descendant))
            return [root];

        var children = root.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];

            var path = HierarchyUtils.findPathToNode(child, descendant);
            if (path) {
                path.unshift(root);
                return path;
            }
        }

        return null;
    }


    if (typeof exports !== 'undefined') {
        module.exports = HierarchyUtils;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.HierarchyUtils = HierarchyUtils;
    }

}());
