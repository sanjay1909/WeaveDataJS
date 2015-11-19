(function () {

    AttributeColumnCache._globalColumnDataSource;

    Object.defineProperty(AttributeColumnCache, 'globalColumnDataSource', {
        get: function () {
            if (!AttributeColumnCache._globalColumnDataSource)
                AttributeColumnCache._globalColumnDataSource = new weavedata.GlobalColumnDataSource();
            return AttributeColumnCache._globalColumnDataSource;
        }
    });

    function AttributeColumnCache() {
        Object.defineProperty(this, 'd2d_dataSource_metadataHash', {
            value: new weavecore.Dictionary2D(true, true)
        });
    }

    var p = AttributeColumnCache.prototype;

    /**
     * @inheritDoc
     */
    p.getColumn = function (dataSource, metadata) {
        // null means no column
        if (metadata === null || metadata === undefined)
            return null;

        // special case - if dataSource is null, use WeaveAPI.globalHashMap
        if (dataSource === null || dataSource === undefined)
            return AttributeColumnCache.globalColumnDataSource.getAttributeColumn(metadata);

        // Get the column pointer associated with the hash value.
        var hashCode = weavecore.Compiler.stringify(metadata);
        var wr = this.d2d_dataSource_metadataHash.get(dataSource, hashCode);
        var weakRef = (wr && wr instanceof weavecore.WeakReference) ? wr : null;
        if ((weakRef !== null || weakRef !== undefined) && (weakRef.value !== null || weakRef.value !== undefined)) {
            if (WeaveAPI.SessionManager.objectWasDisposed(weakRef.value))
                this.d2d_dataSource_metadataHash.remove(dataSource, hashCode);
            else
                return weakRef.value;
        }

        // If no column is associated with this hash value, request the
        // column from its data source and save the column pointer.
        var column = dataSource.getAttributeColumn(metadata);
        this.d2d_dataSource_metadataHash.set(dataSource, hashCode, new weavecore.WeakReference(column));

        return column;
    }


    if (typeof exports !== 'undefined') {
        module.exports = AttributeColumnCache;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.AttributeColumnCache = AttributeColumnCache;
        window.WeaveAPI = window.WeaveAPI ? window.WeaveAPI : {};
        window.WeaveAPI.AttributeColumnCache = new AttributeColumnCache();
    }


}());


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
    Object.defineProperty(GlobalColumnDataSource, 'NS', {
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
    Object.defineProperty(GlobalColumnDataSource, 'CLASS_NAME', {
        value: 'GlobalColumnDataSource'
    });

    /**
     * The metadata property name used to identify a column appearing in WeaveAPI.globalHashMap.
     */
    Object.defineProperty(GlobalColumnDataSource, 'NAME', {
        value: 'name'
    });



    /**
     * This is an interface to an object that decides which IQualifiedKey objects are included in a set or not.
     *
     * @author adufilie
     * @author sanjay1909
     */
    function GlobalColumnDataSource() {
        weavecore.ILinkableObject.call(this);
        Object.defineProperty(this, 'hierarchyRefresh', {
            value: WeaveAPI.SessionManager.getCallbackCollection(this)
        });
        WeaveAPI.SessionManager.registerLinkableChild(this, WeaveAPI.globalHashMap.childListCallbacks);

        var source = this;
        this._rootNode = new weavedata.ColumnTreeNode({
            dataSource: source,
            label: function () {
                return WeaveAPI.globalHashMap.getObjects(CSVColumn).length ? 'Generated columns' : 'Equations';
            },
            hasChildBranches: false,
            children: function () {
                return getGlobalColumns().map(function (column) {
                    WeaveAPI.SessionManager.registerLinkableChild(source, column);
                    return createColumnNode(WeaveAPI.globalHashMap.getName(column));
                });
            }
        });
    }

    function getGlobalColumns() {
        var csvColumns = WeaveAPI.globalHashMap.getObjects(CSVColumn);
        var equationColumns = WeaveAPI.globalHashMap.getObjects(EquationColumn);
        return equationColumns.concat(csvColumns);
    }

    function createColumnNode(name) {
        var column = this.getAttributeColumn(name);
        if (!column)
            return null;

        var meta = {};
        meta[GlobalColumnDataSource.NAME] = name;
        return new weavedata.ColumnTreeNode({
            dataSource: this,
            dependency: column,
            label: function () {
                return column.getMetadata(weavedata.ColumnMetadata.TITLE);
            },
            data: meta,
            idFields: [GlobalColumnDataSource.NAME]
        });
    }

    GlobalColumnDataSource.prototype = new weavecore.ILinkableObject();
    GlobalColumnDataSource.prototype.constructor = GlobalColumnDataSource;
    var p = GlobalColumnDataSource.prototype;


    p.getHierarchyRoot = function () {
        return this._rootNode;
    }

    p.findHierarchyNode = function (metadata) {
        var column = this.getAttributeColumn(metadata);
        if (!column)
            return null;
        var name = WeaveAPI.globalHashMap.getName(column);
        var node = createColumnNode.call(this, name);
        var path = this._rootNode.findPathToNode(node);
        if (path)
            return path[path.length - 1];
        return null;
    }

    p.getAttributeColumn = function (metadata) {
        if (!metadata)
            return null;
        var name;
        if (typeof metadata === 'object')
            name = metadata[GlobalColumnDataSource.NAME];
        else
            name = metadata;
        return WeaveAPI.globalHashMap.getObject(name);
    }



    if (typeof exports !== 'undefined') {
        module.exports = GlobalColumnDataSource;
    } else {

        window.weavedata = window.weavedata ? window.weavedata : {};
        window.weavedata.GlobalColumnDataSource = GlobalColumnDataSource;
    }

    weavecore.ClassUtils.registerClass('weavedata.GlobalColumnDataSource', weavedata.GlobalColumnDataSource);

}());
