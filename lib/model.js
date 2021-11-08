"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
var builder_1 = require("./builder");
var Model = /** @class */ (function () {
    function Model(definition, dbFile, table) {
        if (definition === void 0) { definition = {}; }
        this.definition = definition;
        this.attributes = {};
        this.changed = {};
        this.dbFile = dbFile;
        this.table = table;
        this.pk = '';
        this.initialize();
    }
    Model.prototype.initialize = function () {
        if (this.pk) {
            return this;
        }
        for (var key in this.definition) {
            if (this.definition[key].pk) {
                this.pk = key;
                break;
            }
        }
        return this;
    };
    Model.prototype.attr = function (name, value) {
        this.attributes[name] = value;
    };
    Model.prototype.clone = function (instance) {
        return Object.assign(Object.create(Model.prototype), instance);
    };
    Model.prototype.instance = function (data) {
        this.changed = {};
        var instance = this.clone(this);
        for (var key in data) {
            instance.attr(key, data[key]);
        }
        var handler = {
            constructor: function (target, args) {
                return new (target.bind.apply(target, __spreadArray([void 0], args, false)))();
            },
            get: function (target, key) {
                if (Reflect.has(target.changed, key)) {
                    return Reflect.get(target.changed, key);
                }
                if (Reflect.has(target.attributes, key)) {
                    return Reflect.get(target.attributes, key);
                }
                if (Reflect.has(instance, key)) {
                    return instance[key];
                }
                return undefined;
            },
            set: function (target, key, value) {
                if (value instanceof Function) {
                    return Reflect.set(target, key, value);
                }
                if (Reflect.has(target.attributes, key)) {
                    Reflect.set(target.changed, key, value);
                }
                if (Reflect.has(instance, key)) {
                    return instance[key] = value;
                }
                return true;
            }
        };
        var proxy = new Proxy(instance, handler);
        return proxy;
    };
    Model.prototype.toObject = function () {
        return this.attributes;
    };
    Model.prototype.toJSON = function () {
        return this.toObject();
    };
    Model.prototype.exec = function (sql) {
        return this.db.exec(sql);
    };
    Model.prototype.find = function (where, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var limit = options.limit, offset = options.offset, order = options.order, fields = options.fields, group = options.group;
        var builder = new builder_1.Builder({});
        var _a = builder.table(this.table)
            .where(where)
            .fields(fields)
            .order(order)
            .group(group)
            .limit(limit)
            .offset(offset)
            .select(), sql = _a.sql, params = _a.params;
        var stmt = this.db.prepare(sql);
        var res = stmt.all.apply(stmt, params);
        return res.map(function (item) {
            return _this.instance(item);
        });
    };
    Model.prototype.findOne = function (where, options) {
        if (options === void 0) { options = {}; }
        options.limit = 1;
        var res = this.find(where, options);
        if (res.length) {
            return res[0];
        }
        return null;
    };
    Model.prototype.findAll = function (where, options) {
        if (options === void 0) { options = {}; }
        return this.find(where, options);
    };
    Model.prototype.findById = function (id) {
        return this.findOne({ id: id });
    };
    Model.prototype.findByIds = function (ids) {
        var data = this.find({ id: { '$in': ids } });
        if (!data.length) {
            return data;
        }
    };
    Model.prototype.insert = function (data) {
        var _a;
        var builder = new builder_1.Builder({});
        var _b = builder.table(this.table).insert(data), sql = _b.sql, params = _b.params;
        var lastInsertRowid = (_a = this.db.prepare(sql)).run.apply(_a, params).lastInsertRowid;
        return this.findById(lastInsertRowid);
    };
    Model.prototype.update = function (where, data) {
        var _a;
        var builder = new builder_1.Builder({});
        var _b = builder.table(this.table)
            .where(where)
            .update(data), sql = _b.sql, params = _b.params;
        return (_a = this.db.prepare(sql)).run.apply(_a, params);
    };
    Model.prototype.updateAttributes = function (data) {
        if (!this.pk) {
            throw new Error('updateAttributes must be called on instance');
        }
        return this.update({ id: this.pk }, data);
    };
    Model.prototype.upsert = function (data) {
        if (!data.id) {
            throw new Error('ID not found');
        }
        var record = this.findById(data.id);
        if (record) {
            return this.update({ id: data.id }, data);
        }
        return this.insert(data);
    };
    Model.prototype.save = function () {
        if (!this.pk || !this.attributes[this.pk]) {
            throw new Error('save must be called on instance');
        }
        this.update({ id: this.attributes[this.pk] }, this.changed);
        return this.findById(this.attributes[this.pk]);
    };
    Model.prototype.deleteById = function (id) {
        var _a;
        var record = this.findById(id);
        if (!record) {
            return false;
        }
        var builder = new builder_1.Builder({});
        var _b = builder.table(this.table)
            .where({ id: id })
            .delete(), sql = _b.sql, params = _b.params;
        (_a = this.db.prepare(sql)).run.apply(_a, params);
        return true;
    };
    Model.prototype.delete = function (where) {
        var _a;
        var builder = new builder_1.Builder({});
        var _b = builder.table(this.table)
            .where(where)
            .delete(), sql = _b.sql, params = _b.params;
        return (_a = this.db.prepare(sql)).run.apply(_a, params);
    };
    return Model;
}());
exports.Model = Model;
//# sourceMappingURL=model.js.map