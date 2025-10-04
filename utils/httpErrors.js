"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conflict = exports.NotFound = exports.Forbidden = exports.Unauthorized = exports.BadRequest = exports.HttpError = void 0;
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(status, publicMessage, code) {
        var _this = _super.call(this, publicMessage) || this;
        _this.status = status;
        _this.publicMessage = publicMessage;
        _this.code = code;
        return _this;
    }
    return HttpError;
}(Error));
exports.HttpError = HttpError;
var BadRequest = function (m, c) {
    if (m === void 0) { m = "Bad request"; }
    if (c === void 0) { c = "ERR_BAD_REQUEST"; }
    return new HttpError(400, m, c);
};
exports.BadRequest = BadRequest;
var Unauthorized = function (m, c) {
    if (m === void 0) { m = "Unauthorized"; }
    if (c === void 0) { c = "ERR_UNAUTHORIZED"; }
    return new HttpError(401, m, c);
};
exports.Unauthorized = Unauthorized;
var Forbidden = function (m, c) {
    if (m === void 0) { m = "Forbidden"; }
    if (c === void 0) { c = "ERR_FORBIDDEN"; }
    return new HttpError(403, m, c);
};
exports.Forbidden = Forbidden;
var NotFound = function (m, c) {
    if (m === void 0) { m = "NOT_FOUND"; }
    if (c === void 0) { c = "ERR_NOT_FOUND"; }
    return new HttpError(403, m, c);
};
exports.NotFound = NotFound;
var Conflict = function (m, c) {
    if (m === void 0) { m = "Conflict"; }
    if (c === void 0) { c = "ERR_CONFLICT"; }
    return new HttpError(409, m, c);
};
exports.Conflict = Conflict;
