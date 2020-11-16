import { JsonRpc2 } from "../index";

/**
 * 本地注册函数，接受调用
 * local --注册(function)--> local
 * remote --调用(function)--> local
 * local --执行(function),返回(result)--> remote
 */

async function testResponse() {
  console.group("本地注册函数，接受调用");
  function sendResponse(msg: unknown) {
    console.log(msg);
  }

  const rpcResponse = new JsonRpc2({
    timeout: 1000,
    send: sendResponse,
  });

  function subtract(a, b) {
    return a - b;
  }
  function notify(...args) {
    console.log("notification", args);
  }
  rpcResponse.registerRpcCall("subtract", subtract as any, ["a", "b"]);
  rpcResponse.registerRpcNotifyCall("notify", notify, ["a", "b"]);

  // 带索引数组参数的rpc调用:
  rpcResponse.receive(
    JSON.stringify({
      jsonrpc: "2.0",
      method: "subtract",
      params: [42, 23],
      id: 1,
    })
  );

  // 带关联数组参数的rpc调用:
  rpcResponse.receive(
    JSON.stringify({
      jsonrpc: "2.0",
      method: "subtract",
      params: { a: 23, b: 42 },
      id: 2,
    })
  );

  // 通知:
  rpcResponse.receive(
    JSON.stringify({
      jsonrpc: "2.0",
      method: "notify",
      params: [1, 2, 3, 4, 5],
    })
  );

  // 不包含调用方法的rpc调用:

  rpcResponse.receive(
    JSON.stringify({ jsonrpc: "2.0", method: "foobar", id: "5" })
  );

  // 包含无效json的rpc调用:
  rpcResponse.receive(
    '{"jsonrpc": "2.0", "method": "foobar, "params": "bar", "baz]'
  );

  // 包含无效json的rpc调用:
  rpcResponse.receive(
    JSON.stringify({ jsonrpc: "2.0", method: 1, params: "bar" })
  );

  // 包含无效json的rpc批量调用:
  rpcResponse.receive(
    `[
    {"jsonrpc": "2.0", "method": "sum", "params": [1,2,4], "id": "1"},
    {"jsonrpc": "2.0", "method"
]`
  );

  // 包含空数组的rpc调用:
  rpcResponse.receive(JSON.stringify([]));

  // 非空且无效的rpc批量调用:
  rpcResponse.receive(JSON.stringify([1]));

  // rpc批量调用:
  rpcResponse.receive(
    JSON.stringify([
      { jsonrpc: "2.0", method: "sum", params: [1, 2, 4], id: "1" },
      { jsonrpc: "2.0", method: "notify_hello", params: [7] },
      { jsonrpc: "2.0", method: "subtract", params: [42, 23], id: "2" },
      { foo: "boo" },
      {
        jsonrpc: "2.0",
        method: "foo.get",
        params: { name: "myself" },
        id: "5",
      },
      { jsonrpc: "2.0", method: "get_data", id: "9" },
    ])
  );

  // 所有都为通知的rpc批量调用:
  rpcResponse.receive(
    JSON.stringify([
      { jsonrpc: "2.0", method: "notify", params: [1, 2, 4] },
      { jsonrpc: "2.0", method: "notify", params: [7] },
    ])
  );
  setTimeout(() => {
    console.groupEnd();
  }, 1000);
}

/**
 * 本地调用远程函数
 * local --调用(function)--> remote
 * remote --返回(result)--> local
 */

async function testRequest() {
  console.group("本地调用远程函数");
  function sendRequest(msg: unknown) {
    rpcRequest.receive(msg as any);
  }

  const rpcRequest = new JsonRpc2({
    timeout: 1000,
    send: sendRequest,
  });

  function subtract1(a, b) {
    return a - b;
  }
  function notify1(...args) {}
  rpcRequest.registerRpcCall("subtract", subtract1 as any, ["a", "b"]);
  rpcRequest.registerRpcNotifyCall("notify", notify1, ["a", "b"]);

  // 带索引数组参数的rpc调用:
  let res = await rpcRequest
    .call("subtract", [42, 23])
    .catch((err) => err)
    .catch((err) => err);
  console.log("带索引数组参数的rpc调用:", res);

  // 带关联数组参数的rpc调用:
  res = await rpcRequest.call("subtract", { a: 23, b: 42 }).catch((err) => err);
  console.log("带关联数组参数的rpc调用:", res);

  // 通知:
  res = rpcRequest.call("notify", [1, 2, 3, 4, 5]).catch((err) => err);
  console.log("通知", res);

  // 不包含调用方法的rpc调用:
  res = await rpcRequest.call("foobar").catch((err) => err);
  console.log("不包含调用方法的rpc调用:", res);

  // 包含空数组的rpc调用:
  res = await rpcRequest.bulkCall().catch((err) => err);
  console.log("包含空数组的rpc调用:", res);

  // rpc批量调用:
  res = await rpcRequest
    .bulkCall(
      { method: "sum", params: [1, 2, 4] },
      { method: "notify_hello", params: [7] },
      { method: "subtract", params: [42, 23] },
      { method: "sum", params: [1, 2, 4] }
    )
    .catch((err) => err);
  console.log("rpc批量调用:", res);

  // 所有都为通知的rpc批量调用:
  res = rpcRequest
    .bulkCall(
      { method: "notify", params: [1, 2, 4] },
      { method: "notify", params: [7] }
    )
    .catch((err) => err);
  console.log("所有都为通知的rpc批量调用:", res);
  setTimeout(() => {
    console.groupEnd();
  }, 1000);
}

testResponse()
  .then(() => console.log("end"))
  .catch((err) => console.log("err", err));

testRequest()
  .then(() => console.log("end"))
  .catch((err) => console.log("err", err));
