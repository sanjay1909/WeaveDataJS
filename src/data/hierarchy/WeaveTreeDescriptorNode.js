(function () {

    /**
     * A node in a tree whose leaves identify attribute columns.
     * The following properties are used for equality comparison, in addition to node class definitions:<br>
     * <code>dependency, data</code><br>
     * The following properties are used by WeaveTreeDescriptorNode but not for equality comparison:<br>
     * <code>label, children, hasChildBranches</code><br>
     */
    function WeaveTreeDescriptorNode(params) {
        weavecore.WeaveTreeItem.call(this);

        this.__hasChildBranches = null;
        /**
         * Set this to true if this node is a branch, or false if it is not.
         * Otherwise, hasChildBranches() will check isBranch() on each child returned by getChildren().
         */
        Object.defineProperty(this, '_hasChildBranches', {
            set: function (value) {
                this._counter['hasChildBranches'] = undefined;
                this.__hasChildBranches = value;
            }
        })

        this.childItemClass = WeaveTreeDescriptorNode;

        for (var key in params) {
            if (this[key] instanceof Function && this.hasOwnProperty('_' + key))
                this['_' + key] = params[key];
            else
                this[key] = params[key];
        }
    }

    WeaveTreeDescriptorNode.prototype = new weavecore.WeaveTreeItem();
    WeaveTreeDescriptorNode.prototype.constructor = WeaveTreeDescriptorNode;

    var p = WeaveTreeDescriptorNode.prototype;
    /**
     * @inheritDoc
     */
    p.equals = function (other) {
        var that = (other && other instanceof WeaveTreeDescriptorNode) ? other : null;
        if (!that)
            return false;

        // compare constructor
        if (Object(this).constructor !== Object(that).constructor)
            return false; // constructor differs

        // compare dependency
        if (this.dependency !== that.dependency)
            return false; // dependency differs

        if (weavecore.StandardLib.compare(this.data, that.data) !== 0)
            return false; // data differs

        return true;
    }

    /**
     * @inheritDoc
     */
    p.getLabel = function () {
        return this.label;
    }

    /**
     * @inheritDoc
     */
    p.isBranch = function () {
        // assume that if children property was defined that this is a branch
        return this._children != null;
    }

    /**
     * @inheritDoc
     */
    p.hasChildBranches = function () {
        const id = 'hasChildBranches';
        if (this.isCached(id))
            return this.cache(id);

        if (this.__hasChildBranches !== null)
            return this.cache(id, this.getBoolean(this.__hasChildBranches, id));

        var children = this.getChildren();
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            if (child.isBranch())
                return this.cache(id, true);
        }


        return this.cache(id, false);
    }

    /**
     * @inheritDoc
     */
    p.getChildren = function () {
        return this.children;
    }


    if (typeof exports !== 'undefined') {
        module.exports = WeaveTreeDescriptorNode;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.WeaveTreeDescriptorNode = WeaveTreeDescriptorNode;
    }
}());
