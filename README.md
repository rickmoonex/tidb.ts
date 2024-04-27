# TiDB.ts

## **This project is still WIP**

## Description

TiDB.ts is a NodeJS TypeScript library that can be used to communicate with ThingsDB's TCP socket. It gives a type-save way of data access and manipulation.

## Requirements

- **ThingsDB**
- **NodeJS** (this library will not work in the browser)

## Getting started

Getting started is easy, just install with NPM:

```bash
npm i tidb.ts
```

## Usage

The `ThingsDB` class provides an interface with the ThingsDB TCP socket.

## Example

```ts
import { ThingsDB } from "tidb.ts";

const ti = new ThingsDB();
await ti.auth("admin", "pass");

const response = ti.query("@:collection", '"Hello World!";');
console.log(response);
// Hello World!
```

### Adding type safety

We can introduce type safety when calling the `query` and `run` methods.

```ts
const response = ti.query<string>("@:collection", '"Hello World!";');
// the type of `response` will be string
console.log(response);
// Hello World!
```

```ts
// Define type for the 'test' object
type Test = {
  "#": number;
  name: string;
  price: number;
};

// Define type for procedure arguments
type AddTestArgs = [string, number];

// This function takes `AddTestArgs` as arguments and types the return value with type `Test`
const runResp = await ti.run<AddTestArgs, Test>("@:states", "add_test", ["thisiscool", 2.99]);
```
