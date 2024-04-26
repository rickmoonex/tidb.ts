export type Config = {
  tlsEnabled?: boolean;
};

export const TiRequestType = {
  ping: 32,
  auth: 33,
  query: 34,
  run: 37,
  join: 38,
  leave: 39,
  emit: 40,
} as const;
export type TiRequestType = (typeof TiRequestType)[keyof typeof TiRequestType];

export enum TiResponseType {
  pong = 16,
  ok = 17,
  data = 18,
  error = 19,

  nodeStatus = 0,
  warning = 5,
  onJoin = 6,
  onLeave = 7,
  onEmit = 8,
  onDelete = 9,
}

export type TiResponse = {
  id: number;
  type: TiResponseType;
  data?: any;
};
