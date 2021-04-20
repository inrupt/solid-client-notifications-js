import { Session } from "@inrupt/solid-client-authn-browser";
import { WebsocketNotification } from "@inrupt/solid-client-notifications";

const gateway = "https://notification.dev-ess.inrupt.com/";

export function getHelpers(podRoot: string, session: Session) {
  async function connectWebsocket() {
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
