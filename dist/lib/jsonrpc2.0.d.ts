export declare const ERROR_CODEs: {
    ParseError: {
        code: number;
        msg: string;
    };
    InvalidRequest: {
        code: number;
        msg: string;
    };
    MethodNotFound: {
        code: number;
        msg: string;
    };
    InvalidParams: {
        code: number;
        msg: string;
    };
    InternalError: {
        code: number;
        msg: string;
    };
    Timeout: {
        code: number;
        msg: string;
    };
};
declare type unknownFunction = (args: unknown) => unknown;
export declare class JsonRpc2 {
    private version;
    private registerRpcCallMap;
    private waitForResult;
    private timeout;
    private timeoutId;
    private send;
    constructor(options: {
        send: (msg: unknown) => unknown;
        timeout: number;
    });
    registerRpcCall(methodName: string, method: unknownFunction, paramsKeys: string[]): void;
    unregisterRpcCall(methodName: string): void;
    receive(data: string | Record<string, unknown>): void;
    private handleResponse;
    private timeoutHandle;
    call(method: string, ...params: any[]): Promise<unknown>;
    bulkCall(...args: any[]): Promise<unknown[]>;
    notify(method: string, params: any): void;
}
export {};
