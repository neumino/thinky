var genFunc = require('generate-function');
var genObj = require('generate-object-property');
var util = require(__dirname+'/util.js');

function schemaTreeHasDefault(schema, isVirtual) {
    var nodeType, subSchema;
    var schemaKeys = Object.keys(schema);

    for (var i=0;i<schemaKeys.length;i++) {
        var key = schemaKeys[i];
        var node = schema[key];

        nodeType = util.getType(node);
        if ((nodeType === "virtual") === isVirtual && node.default !== undefined) {
            return true;
        }
        else if (nodeType === Array || Array.isArray(node)) {
            subSchema = util.getSchema(node);
            if (subSchema) {
                return schemaTreeHasDefault(subSchema, isVirtual);
            }
        }
        else if (nodeType === Object || util.isSchema(node)) {
            subSchema = util.getSchema(node);
            if (subSchema) {
                return schemaTreeHasDefault(subSchema, isVirtual);
            }
        }
    }
    return false;
}

function visit(fill, key, node, path, isVirtual, fillContext) {
    var nodeType = util.getType(node);
    path = key === "[i]" ? path + key : genObj(path, key);
    var field = "doc" + path;
    var subSchema;

    if ((nodeType === "virtual") === isVirtual && (node._type !== undefined)) {
        if (node.default !== undefined) {
            if (!isVirtual) {
                fill("if (%s === undefined) {", field);
            }

            var defaultValue = node.default;
            var defaultType = typeof defaultValue;

            if (defaultType === "number" || defaultType === "boolean") {
                fill("%s = %s;", field, defaultValue.toString());
            }
            else if (defaultType === "function") {
                fillContext.defaults[path] = defaultValue;
                if (node.default._r === undefined) {
                    fill('%s = defaults["%s"].apply(doc);', field, path);
                }
                else {
                    fill('%s = defaults["%s"];', field, path);
                }
            }
            else if (defaultType === "string") {
                fillContext.defaults[path] = defaultValue;
                fill('%s = defaults["%s"];', field, path);
            }
            else {
                fillContext.defaults[path] = defaultValue;
                fill('%s = util.deepCopy(defaults["%s"])', field, path);
            }

            if (!isVirtual) {
                fill("}");
            }
        }
        else if (isVirtual) {
            fill("if (util.isPlainObject(virtuals) && (%s !== undefined)) %s = %s",
                genObj("virtuals", key),
                field,
                genObj("virtuals", key));
        }
    }

    if (nodeType === Array || Array.isArray(node)) {
        subSchema = util.getSchema(node);
        if (subSchema && schemaTreeHasDefault(subSchema, isVirtual)) {
            if (isVirtual) {
                fill("virtuals = util.isPlainObject(virtuals) ? %s : undefined;", genObj("virtuals", key));
                fill("virtualStack.push(virtuals);");
            }

            fill("if (Array.isArray(%s)) {", field);
            fill("for (var i=0;i<%s.length;i++) {", field);
            visit(fill, "[i]", subSchema, path, isVirtual, fillContext);
            fill("}");
            fill("}");

            if (isVirtual) {
                fill("virtualStack.pop();");
                fill("virtuals = virtualStack[virtualStack.length - 1];");
            }
        }
    }
    else if (nodeType === Object || util.isSchema(node)) {
        subSchema = util.getSchema(node);
        if (subSchema && schemaTreeHasDefault(subSchema, isVirtual)) {
            if (isVirtual) {
                fill("virtuals = util.isPlainObject(virtuals) ? %s : undefined;", genObj("virtuals", key));
                fill("virtualStack.push(virtuals);");
            }

            fill("if (util.isPlainObject(%s)) {", field);
            var subKeys = Object.keys(subSchema);
            for (var i=0;i<subKeys.length;i++) {
                var subKey = subKeys[i];
                var subNode = subSchema[subKey];

                visit(fill, subKey, subNode, path, isVirtual, fillContext);
            }
            fill("}");

            if (isVirtual) {
                fill("virtualStack.pop();");
                fill("virtuals = virtualStack[virtualStack.length - 1];");
            }
        }
    }
}

var compile = module.exports = function (name, schema, isVirtual) {
    if (isVirtual) {
        var fill =  genFunc()("function _fillVirtualValue_%s(doc, virtuals) {",  name)
        ("var virtualStack = [virtuals];");
    }
    else {
        var fill = genFunc()("function _fillDefaultValue_%s(doc) {", name);
    }

    var schemaKeys = Object.keys(schema);
    var fillContext = {
        util: util,
        defaults: {}
    };

    for (var i=0;i<schemaKeys.length;i++) {
        var key = schemaKeys[i];
        var node = schema[key];

        visit(fill, key, node, "", isVirtual, fillContext);
    }

    fill("}");

    return fill.toFunction(fillContext);
};
