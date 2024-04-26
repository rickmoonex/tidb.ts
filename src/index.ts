export * from "./errors";
export * from "./types";

import net from "net";
import { TiRequestType, Config } from "./types";
import { TiPackageError } from "./errors";
import { encode as msgEncode, decode as msgDecode } from "@msgpack/msgpack";
import { resolve } from "path";

export class ThingsDB {
  private socket: net.Socket;
  private id = 1;
  private readonly host: string;
  private readonly port: number;
  private readonly timeout: number;
  private readonly config: Config;
  private pending: { [index: number]: { resolve: (value: any) => void; reject: (value: any) => void } } = {};
  private closePromise: any[] = [];

  constructor(host = "127.0.0.1", port = 9200, timeout = 15, config: Config = {}) {
    this.host = host;
    this.port = port;
    this.timeout = timeout;
    this.config = config;

    this.socket = net.connect({
      host: this.host,
      port: this.port,
      noDelay: true,
    });

    this.connect();
  }

  private async connect(): Promise<void> {
    this.socket.on("connect", () => {
      this.socket.on("error", (err) => {
        if (this.closePromise.length) {
          this.closePromise[1](err);
          this.closePromise = [];
        } else {
          throw err;
        }
      });
      resolve();
    });

    this.socket.on("data", (data) => {
      const view = new DataView(data.buffer);
      const size = view.getUint32(0, true);
      const id = view.getUint16(4, true);
      const type = view.getUint8(6);
      const check = view.getUint8(7);

      if (type !== 255 - check) {
        throw new TiPackageError("Type check error");
      }

      let message: any;
      if (size) {
        message = msgDecode(data.subarray(8));
      }

      if (type >= 16 && type <= 19 && this.pending[id] !== undefined) {
        if (type === 19) this.pending[id]?.reject(message);
        else this.pending[id]?.resolve(message);
        delete this.pending[id];
      } else {
        throw new TiPackageError(`Unknown even type: ${type}`);
      }
    });
  }

  public async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.closePromise = [resolve, reject];
      this.socket.end();
    });
  }

  public async auth(username: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pending[this.send(TiRequestType.auth, [username, password])] = {
        resolve,
        reject,
      };
    });
  }

  public async run<A = any[], R = any>(scope: string, procedure: string, args?: A): Promise<R> {
    return new Promise((resolve, reject) => {
      this.pending[this.send(TiRequestType.run, [scope, procedure, args])] = { resolve, reject };
    });
  }

  public async query<T = any>(scope: string, code: string, vars?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pending[this.send(TiRequestType.query, [scope, code, vars])] = {
        resolve,
        reject,
      };
    });
  }

  private send(type: TiRequestType, data?: any): number {
    const id = this.getNextId();
    let buffer: ArrayBuffer;
    let size = 0;
    if (data === undefined) {
      buffer = new ArrayBuffer(8);
    } else {
      const message = msgEncode(data);
      size = message.byteLength;
      buffer = new ArrayBuffer(size + 8);
      new Uint8Array(buffer).set(message, 8);
    }

    const view = new DataView(buffer);
    view.setUint32(0, size, true);
    view.setUint16(4, id, true);
    view.setUint8(6, type);
    view.setUint8(7, ~type);

    const array = new Uint8Array(buffer);

    this.socket.write(array);

    return id;
  }

  private getNextId(): number {
    const id = this.id++;
    if (this.id > 65536) {
      this.id = 1;
    }
    return id;
  }
}
type Test = {
  "#": number;
  name: string;
  price: number;
};

type AddTestArgs = [string, number];

async function run() {
  const ti = new ThingsDB();

  await ti.auth("admin", "pass");

  await ti.run<AddTestArgs>("@:states", "add_test", ["thisiscool", 2.99]);

  const tests = await ti.query<Array<Test>>("@:states", ".tests;");

  tests.forEach((test) => {
    console.log(`Id: ${test["#"]}, Name: ${test.name}, Price: ${test.price}`);
  });

  await ti.disconnect();
}

run();
