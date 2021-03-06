import { v4 } from "uuid";

export const ERROR_CODEs = {
  ParseError: { code: -32700, msg: "语法解析错误" },
  InvalidRequest: { code: -32600, msg: "无效请求" },
  MethodNotFound: { code: -32601, msg: "找不到方法" },
  InvalidParams: { code: -32602, msg: "无效的参数" },
  InternalError: { code: -32603, msg: "内部错误" },
  Timeout: { code: -32000, msg: "超时，没有收到可辨认的回复" },
};
type unknownFunction = (args: any) => any;
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

  registerRpcNotifyCall(
    methodName: string,
    method: unknownFunction,
    paramsKeys: string[]
  ) {
    this.registerRpcCallMap.set(methodName, {
      method,
      paramsKeys,
      type: "notify",
    });
  }
  unregisterRpcCall(methodName: string) {
    this.registerRpcCallMap.delete(methodName);
  }
  async receive(data: string | Record<string, unknown>) {
    let receiveData;
    try {
      receiveData = typeof data === "string" ? JSON.parse(data) : data;
    } catch (error) {
      console.log("不理解的消息:", error.message);
      return this.send({
        jsonrpc: this.version,
        error: ERROR_CODEs.ParseError,
        id: null,
      });
    }
    const id = receiveData.id;

    // 当为 `回应` 时
    if (
      receiveData.jsonrpc === this.version &&
      (receiveData.result || receiveData.error) &&
      id != null &&
      id !== undefined &&
      this.waitForResult.has(id)
    ) {
      return this.handleResponse(receiveData);
    }

    // 当为 `请求` 时

    let content = Array.isArray(receiveData)
      ? await Promise.all(receiveData.map((r) => this.handleRequest(r)))
      : await this.handleRequest(receiveData);
    content = Array.isArray(receiveData)
      ? content.filter((item) => !!item)
      : content;
    if (Array.isArray(receiveData) && receiveData.length === 0) {
      this.send({
        jsonrpc: this.version,
        error: ERROR_CODEs.InvalidRequest,
        id,
      });
    } else if (Array.isArray(content) && content.length === 0) {
      return;
    } else if (!!content) {
      this.send(content);
    }
  }
  private async handleRequest(res: any) {
    if (res.jsonrpc !== this.version || typeof res !== "object") {
      return {
        jsonrpc: this.version,
        error: ERROR_CODEs.InvalidRequest,
        id: res.id,
      };
    }

    // 处理 rpc 有效调用
    if (res.method && this.registerRpcCallMap.has(res.method)) {
      const { method, paramsKeys, type } = this.registerRpcCallMap.get(
        res.method
      );
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

      return type ? undefined : content;
    }

    // 处理 rpc 无效调用
    if (res.method && !this.registerRpcCallMap.has(res.method)) {
      return {
        jsonrpc: this.version,
        error: ERROR_CODEs.MethodNotFound,
        id: res.id,
      };
    }
    return {
      jsonrpc: this.version,
      error: ERROR_CODEs.InvalidRequest,
      id: res.id,
    };
  }
  private handleResponse(res: any) {
    const { id, result, error } = res;
    const { successCall, failCall } = this.waitForResult.get(id);
    this.waitForResult.delete(id);
    return result ? successCall(result) : failCall(error);
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
          });
        }
      });
    }, this.timeout);
  }
  async call(method: string, params?: any) {
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
  async bulkCall(...args: { method: string; params: any }[]) {
    const results = args.map(({ method, params }) => this.call(method, params));
    return Promise.allSettled(results);
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
