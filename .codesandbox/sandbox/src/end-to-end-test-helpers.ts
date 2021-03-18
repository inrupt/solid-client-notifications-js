import { Session } from "@inrupt/solid-client-authn-browser";
import { WebsocketNotification } from "@inrupt/solid-client-notifications";

const gateway = "https://notification.dev-ess.inrupt.com/";

export function getHelpers(podRoot: string, session: Session) {
  async function connectWebsocket() {
    const notification = new WebsocketNotification(podRoot, session.fetch, {
      gateway,
    });

    notification.connect();
    console.log(notification);

    console.log("connected");

    await (() => {
      return new Promise((res, rej) => {
        notification.on("connect", () => res(undefined));
        notification.on("error", (e: Error) => rej(e));
      });
    })();

    return notification;
  }

  return {
    connectWebsocket,
  };
}
