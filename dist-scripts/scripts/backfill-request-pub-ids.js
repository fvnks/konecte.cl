"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var db_1 = require("../lib/db");
function backfillRequestPublicationCodes() {
    return __awaiter(this, void 0, void 0, function () {
        var requestsToUpdate, _i, requestsToUpdate_1, req, pubId, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('Iniciando script para rellenar IDs de publicación de solicitudes...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 10]);
                    return [4 /*yield*/, (0, db_1.query)("SELECT id FROM property_requests WHERE publication_code IS NULL OR publication_code = ''")];
                case 2:
                    requestsToUpdate = _a.sent();
                    if (requestsToUpdate.length === 0) {
                        console.log('No hay solicitudes que necesiten actualización. ¡Todo está al día!');
                        return [2 /*return*/];
                    }
                    console.log("Se encontraron ".concat(requestsToUpdate.length, " solicitudes para actualizar."));
                    _i = 0, requestsToUpdate_1 = requestsToUpdate;
                    _a.label = 3;
                case 3:
                    if (!(_i < requestsToUpdate_1.length)) return [3 /*break*/, 6];
                    req = requestsToUpdate_1[_i];
                    pubId = "S-".concat(Math.random().toString(36).substring(2, 8).toUpperCase());
                    console.log("  - Actualizando solicitud ID ".concat(req.id, " con el nuevo c\u00F3digo: ").concat(pubId));
                    return [4 /*yield*/, (0, db_1.query)('UPDATE property_requests SET publication_code = ? WHERE id = ?', [pubId, req.id])];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    console.log('¡Actualización de solicitudes completada exitosamente!');
                    return [3 /*break*/, 10];
                case 7:
                    error_1 = _a.sent();
                    console.error('Ocurrió un error durante el proceso de backfill de solicitudes:', error_1);
                    return [3 /*break*/, 10];
                case 8: 
                // 3. Cerrar la conexión a la base de datos
                return [4 /*yield*/, (0, db_1.closeDbPool)()];
                case 9:
                    // 3. Cerrar la conexión a la base de datos
                    _a.sent();
                    console.log('Conexión a la base de datos cerrada.');
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
backfillRequestPublicationCodes();
