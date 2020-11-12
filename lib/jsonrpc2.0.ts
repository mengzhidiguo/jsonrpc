import { v4 } from "uuid";

export const ERROR_CODEs = {
  ParseError: { code: -32700, msg: "语法解析错误" },
  InvalidRequest: { code: -32600, msg: "无效请求" },
  MethodNotFound: { code: -32601, msg: "找不到方法" },
  InvalidParams: { code: -32602, msg: "无效的参数" },
  InternalError: { code: -32603, msg: "内部错误" },
  Timeout: { code: -32000, msg: "超时，没有收到可辨认的回复" },
};
type unknownFunction = (args: unknown) => unknown;
export class JsonRpc2 {
  private version = "2.0";
  private registerRpcCallMap = new Map();
  private waitForResult = new Map();
  private timeout: number;
  private timeoutId: number;
  private send: (msg: unknown) => unknown;
  constructor(options: { send: (msg: unknown) => unknown; timeout: number }) {
    const { send, timeout } = options;
    this.timeout = timeout || 60;
    this.send = (msg) => {
      send(typeof msg === "string" ? msg : JSON.stringify(msg));
    };
  }
  registerRpcCall(
    methodName: string,
    method: unknownFunction,
    paramsKeys: string[]
  ) {
    this.registerRpcCallMap.set(methodName, { method, paramsKeys });
  }
  unregisterRpcCall(methodName: string) {
    this.registerRpcCallMap.delete(methodName);
  }
  receive(data: string | Record<string, unknown>) {
    let id;
    try {
      const result = typeof data === "string" ? JSON.parse(data) : data;
      id = result.id;
      if (Array.isArray(result)) {
        result.forEach((r) => this.handleResponse(r));
      } else {
        this.handleResponse(result);
      }
    } catch (error) {
      console.warn("不理解的消息", error);
      this.send({
        jsonrpc: this.version,
        error: ERROR_CODEs.InvalidRequest,
        id,
      });
    }
  }
  private async handleResponse(res: any) {
    if (res.jsonrpc !== this.version) {
      throw new Error(`jsonrpc: ${res.jsonrpc}`);
    }
    // 处理 rpc 返回有效值
    if (
      (res.result || res.error) &&
      res.id != null &&
      res.id !== undefined &&
      this.waitForResult.has(res.id)
    ) {
      const { successCall, failCall } = this.waitForResult.get(res.id);
      this.waitForResult.delete(res.id);
      return res.result ? successCall(res.result) : failCall(res.error);
    }

    // 处理 rpc 有效调用
    if (res.method && this.registerRpcCallMap.has(res.method)) {
      const { method, paramsKeys } = this.registerRpcCallMap.get(res.method);
      let content;
      try {
        const result = await (Array.isArray(res.params)
          ? method(...res.params)
          : method(...paramsKeys.map((key: string) => res.params[key])));
        content = {
          jsonrpc: this.version,
          result,
          id: res.id,
        };
      } catch (error) {
        content = {
          jsonrpc: this.version,
          error: ERROR_CODEs.InternalError,
          id: res.id,
        };
      }
      return this.send(content);
    }
    // 处理 rpc 无效调用
    if (res.method && !this.registerRpcCallMap.has(res.method)) {
      return this.send({
        jsonrpc: this.version,
        error: ERROR_CODEs.MethodNotFound,
        id: res.id,
      });
    }
    throw new Error("未处理的消息");
  }

  /**
   * rpc 调用超时处理
   */
  private timeoutHandle() {
    if (this.timeoutId) {
      return;
    }
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      Object.keys(this.waitForResult).forEach((key) => {
        const { createdAt, failCall } = this.waitForResult.get(key);
        const duration = (new Date().getTime() - createdAt.getTime()) / 1000;
        if (duration > this.timeout) {
          this.handleResponse({
            jsonrpc: this.version,
            error: ERROR_CODEs.Timeout,
            id: key,
          }).catch(() => {});
        }
      });
    }, this.timeout);
  }
  async call(method: string, ...params: any[]) {
    const id = v4();
    const content = {
      jsonrpc: this.version,
      method,
      params,
      id,
    };
    const result = new Promise((resolve, reject) =>
      this.waitForResult.set(id, {
        successCall: resolve,
        failCall: reject,
        createdAt: new Date(),
      })
    );
    this.send(content);
    this.timeoutHandle();
    return result;
  }
  async bulkCall(...args: any[]) {
    const results = args.map(([method, ...params]) =>
      this.call(method, ...params)
    );
    return Promise.all(results);
  }
  notify(method: string, params: any) {
    const content = {
      jsonrpc: this.version,
      method,
      params,
    };
    this.send(content);
  }
}
