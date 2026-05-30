import { ProxyAgent } from "undici";
import type { ServerConfig } from "./server-config";

const proxyAgents = new Map<string, ProxyAgent>();

function getProxyAgent(proxy: string): ProxyAgent {
  const existing = proxyAgents.get(proxy);
  if (existing) return existing;

  const agent = new ProxyAgent(proxy);
  proxyAgents.set(proxy, agent);
  return agent;
}

export function githubFetch(
  config: ServerConfig,
  input: string | URL,
  init: RequestInit = {},
): Promise<Response> {
  if (!config.github.proxy) {
    return fetch(input, init);
  }

  return fetch(input, {
    ...init,
    dispatcher: getProxyAgent(config.github.proxy),
  } as RequestInit);
}
