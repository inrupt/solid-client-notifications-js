import { Session } from "@inrupt/solid-client-authn-browser";
import { WebsocketNotification } from "@inrupt/solid-client-notifications";

const DEFAULT_GATEWAY = "https://notification.pod.inrupt.com/";

export function getHelpers(podRoot: string, session: Session) {
  async function connectWebsocket(gateway: string = DEFAULT_GATEWAY) {
    const notification = new WebsocketNotification(podRoot, {
      fetch: session.fetch,
      gateway,
    });

    notification.connect();

    await new Promise((resolve, reject) => {
      notification.on("connected", () => resolve(undefined));
      notification.on("error", (e: Error) => reject(e));
    });

    return notification;
  }

  return {
    connectWebsocket,
  };
}
