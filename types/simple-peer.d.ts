declare module 'simple-peer' {
  type SignalData = string | ArrayBuffer | Record<string, unknown>

  interface Options {
    initiator?: boolean
    trickle?: boolean
    trickleICE?: boolean
    stream?: MediaStream
    config?: RTCConfiguration
  }

  class SimplePeer {
    constructor(options?: Options)
    on(event: 'signal', callback: (data: SignalData) => void): this
    on(event: 'connect', callback: () => void): this
    on(event: 'stream', callback: (stream: MediaStream) => void): this
    on(event: 'error', callback: (error: Error) => void): this
    destroy(): void
  }

  namespace SimplePeer {
    type Instance = SimplePeer
  }

  export = SimplePeer
}
