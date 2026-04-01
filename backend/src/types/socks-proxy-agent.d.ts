declare module 'socks-proxy-agent' {
  import { Agent } from 'http';
  
  export class SocksProxyAgent extends Agent {
    constructor(uri: string);
  }
}
