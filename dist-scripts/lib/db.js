"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.db = void 0;
exports.closeDbPool = closeDbPool;
exports.getDbPool = getDbPool;
exports.query = query;
// src/lib/db.ts
var mysql = __importStar(require("mysql2/promise"));
var mysql2_1 = require("drizzle-orm/mysql2");
// dotenv.config() is removed as Next.js handles .env files automatically.
var pool; // Allow pool to be undefined initially
// Function to gracefully shut down the pool
function closeDbPool() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!pool) return [3 /*break*/, 4];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, pool.end()];
                case 2:
                    _a.sent();
                    console.log("[DB_INFO] MySQL pool closed successfully.");
                    pool = undefined; // Reset pool variable after closing
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.error("[DB_ERROR] Error closing MySQL pool:", error_1.message);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function createPool() {
    var _this = this;
    console.time("[DB_CREATE_POOL_TIME]");
    var requiredEnvVars = ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'];
    for (var _i = 0, requiredEnvVars_1 = requiredEnvVars; _i < requiredEnvVars_1.length; _i++) {
        var varName = requiredEnvVars_1[_i];
        if (!process.env[varName]) {
            var errorMessage = "Missing environment variable: ".concat(varName, ". Please ensure it is set in your .env file or Vercel environment variables.");
            console.error("[DB_ERROR] ".concat(errorMessage));
            throw new Error(errorMessage);
        }
    }
    var port = Number(process.env.MYSQL_PORT);
    if (isNaN(port) || port <= 0) {
        var portErrorMessage = "Invalid MYSQL_PORT: '".concat(process.env.MYSQL_PORT, "'. Must be a positive number.");
        console.error("[DB_ERROR] ".concat(portErrorMessage));
        throw new Error(portErrorMessage);
    }
    var connectionConfig = {
        host: process.env.MYSQL_HOST,
        port: port,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        waitForConnections: true,
        connectionLimit: process.env.MYSQL_CONNECTION_LIMIT ? parseInt(process.env.MYSQL_CONNECTION_LIMIT, 10) : 10,
        queueLimit: 0, // No limit for queued connections
        connectTimeout: process.env.MYSQL_CONNECT_TIMEOUT ? parseInt(process.env.MYSQL_CONNECT_TIMEOUT, 10) : 20000, // Increased to 20 seconds
    };
    console.log("[DB_INFO] Attempting to create new MySQL pool with config:", {
        host: connectionConfig.host,
        port: connectionConfig.port,
        user: connectionConfig.user,
        database: connectionConfig.database,
        connectionLimit: connectionConfig.connectionLimit,
        connectTimeout: connectionConfig.connectTimeout,
        password: connectionConfig.password ? '********' : undefined
    });
    try {
        var newPool = mysql.createPool(connectionConfig);
        // Event listener to handle connection acquisition and validation
        newPool.on('acquire', function (connection) { return __awaiter(_this, void 0, void 0, function () {
            var err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, connection.ping()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        console.error("[DB_EVENT_PING_FAIL] Ping failed for connection ".concat(connection.threadId, ", destroying it. Error:"), err_1.message);
                        // Destroy the problematic connection. The pool will create a new one if needed.
                        connection.destroy();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); });
        console.log("[DB_INFO] mysql.createPool called. Attempting test connection...");
        // Test the pool immediately (non-blocking for the return of createPool)
        newPool.getConnection()
            .then(function (conn) {
            console.log("[DB_INFO] Successfully obtained a test connection (ID: ".concat(conn.threadId, ") from the new pool."));
            return conn.ping().then(function () {
                console.log("[DB_INFO] Test connection (ID: ".concat(conn.threadId, ") ping successful."));
                conn.release();
                console.timeEnd("[DB_CREATE_POOL_TIME]");
            }).catch(function (pingErr) {
                console.error("[DB_ERROR] Test connection (ID: ".concat(conn.threadId, ") ping FAILED:"), pingErr.message);
                conn.release(); // Still release if ping fails
                console.timeEnd("[DB_CREATE_POOL_TIME]");
            });
        })
            .catch(function (err) {
            console.error("[DB_ERROR] Error establishing an initial test connection from the new pool:", err.message);
            console.timeEnd("[DB_CREATE_POOL_TIME]");
            // Consider if pool should be marked as unhealthy or retried
        });
        return newPool;
    }
    catch (error) {
        console.error("[DB_FATAL] Fatal error during mysql.createPool:", error.message, error.stack);
        console.timeEnd("[DB_CREATE_POOL_TIME]");
        throw error; // Re-throw if createPool itself fails
    }
}
function getDbPool() {
    if (!pool) {
        console.log("[DB_INFO] Pool does not exist or was closed. Creating a new one.");
        pool = createPool();
    }
    else {
        // Optional: Log when an existing pool is being reused
        // console.log("[DB_INFO] Reusing existing MySQL pool.");
    }
    return pool;
}
// Export the Drizzle instance
exports.db = (0, mysql2_1.drizzle)(getDbPool());
function query(sql, params) {
    return __awaiter(this, void 0, void 0, function () {
        var queryId, currentPool, connection, rows, resultInfo, packet, error_2, errorMessage;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    queryId = Math.random().toString(36).substring(2, 7);
                    console.log("[DB_QUERY_INIT-".concat(queryId, "] Attempting to get pool."));
                    currentPool = getDbPool();
                    console.log("[DB_QUERY_POOL_ACQUIRED-".concat(queryId, "] Pool acquired."));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 7]);
                    console.time("[DB_GET_CONNECTION_TIME-".concat(queryId, "]"));
                    console.log("[DB_QUERY_CONN_ATTEMPT-".concat(queryId, "] Attempting to get connection..."));
                    return [4 /*yield*/, currentPool.getConnection()];
                case 2:
                    connection = _a.sent();
                    console.timeEnd("[DB_GET_CONNECTION_TIME-".concat(queryId, "]"));
                    console.log("[DB_QUERY_CONN_SUCCESS-".concat(queryId, "] Connection (ID: ").concat(connection.threadId, ") acquired."));
                    console.log("[DB_QUERY_EXEC_START-".concat(queryId, "] Executing SQL (Conn ID: ").concat(connection.threadId, "): ").concat(sql.substring(0, 150), "..."));
                    if (params)
                        console.log("[DB_QUERY_EXEC_PARAMS-".concat(queryId, "] Params:"), JSON.stringify(params).substring(0, 100));
                    console.time("[DB_QUERY_EXEC_TIME-".concat(queryId, "]"));
                    return [4 /*yield*/, connection.execute(sql, params)];
                case 3:
                    rows = (_a.sent())[0];
                    console.timeEnd("[DB_QUERY_EXEC_TIME-".concat(queryId, "]"));
                    // Log the raw result object for detailed debugging
                    console.log("[DB_QUERY_RAW_RESULT-".concat(queryId, "]"), rows);
                    resultInfo = void 0;
                    if (Array.isArray(rows)) {
                        resultInfo = "Rows returned: ".concat(rows.length);
                    }
                    else if (rows && typeof rows === 'object' && 'affectedRows' in rows) {
                        packet = rows;
                        resultInfo = "Affected rows: ".concat(packet.affectedRows, ", Changed rows: ").concat(packet.changedRows);
                    }
                    else {
                        resultInfo = 'Result type not recognized for detailed logging.';
                    }
                    console.log("[DB_QUERY_EXEC_SUCCESS-".concat(queryId, "] SQL executed (Conn ID: ").concat(connection.threadId, "). ").concat(resultInfo));
                    // Release the connection before returning the result
                    if (connection) {
                        console.log("[DB_QUERY_RELEASE-".concat(queryId, "] Releasing connection (Conn ID: ").concat(connection.threadId, ")"));
                        connection.release();
                    }
                    return [2 /*return*/, rows];
                case 4:
                    error_2 = _a.sent();
                    errorMessage = "Error executing SQL query: ".concat(error_2.message, " (Code: ").concat(error_2.code, ", SQLState: ").concat(error_2.sqlState, ")");
                    console.error("[DB_QUERY_ERROR-".concat(queryId, "] ").concat(errorMessage));
                    console.error("[DB_QUERY_ERROR_DETAIL-".concat(queryId, "] SQL: ").concat(sql));
                    if (params && params.length > 0) {
                        try {
                            console.error("[DB_QUERY_ERROR_PARAMS-".concat(queryId, "] Params:"), JSON.stringify(params));
                        }
                        catch (e) {
                            console.error("[DB_QUERY_ERROR_PARAMS_RAW-".concat(queryId, "] Params (raw):"), params);
                        }
                    }
                    if (connection) {
                        console.error("[DB_QUERY_ERROR_CONN_INFO-".concat(queryId, "] Connection Thread ID at error: ").concat(connection.threadId));
                    }
                    if (!(error_2.code === 'PROTOCOL_CONNECTION_LOST' || error_2.message.toLowerCase().includes("connection closed") || error_2.code === 'ECONNRESET' || error_2.code === 'ETIMEDOUT' || error_2.code === 'ENOTFOUND')) return [3 /*break*/, 6];
                    console.error("[DB_QUERY_ERROR_CRITICAL_CONN-".concat(queryId, "] Critical connection error: ").concat(error_2.code, ". Pool may be closed and recreated on next call."));
                    return [4 /*yield*/, closeDbPool()];
                case 5:
                    _a.sent(); // Close the current (potentially problematic) pool
                    _a.label = 6;
                case 6:
                    // Ensure connection is released even on error
                    if (connection) {
                        connection.release();
                    }
                    throw error_2; // Re-throw the original error to preserve the stack trace and detailed info
                case 7: return [2 /*return*/];
            }
        });
    });
}
