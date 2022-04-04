import { WebsocketNotification } from "@inrupt/solid-client-notifications";
import { useEffect, useState } from "react";
import {
  createContainerInContainer,
  getSourceIri,
  deleteContainer,
  getPodUrlAll,
} from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";

const session = getDefaultSession();

const MessageList = (props: { messages: Array<any> }) => {
  const { messages } = props;
  return (
    <ul data-testid="eventList">
      {messages.map((message) => (
        <li key={message.id}>
          <pre>{JSON.stringify(message, null, 2)}</pre>
        </li>
      ))}
    </ul>
  );
};

const WebSocketButtons = ({socket}: {socket?: WebsocketNotification}) => {
  if (socket === undefined) {
    return <div></div>
  }
  return <div>
    <button
      onClick={async (e) => {
        e.preventDefault();
        await socket.connect();
      }}
      data-testid="connectSocket"
    >
      Connect websocket
    </button>
    <button
      onClick={(e) => {
        e.preventDefault();
        socket.disconnect();
      }}
      data-testid="disconnectSocket"
    >
      Disconnect websocket
    </button>
  </div>
}

export default function Notifications() {
  const [socket, setSocket] = useState<WebsocketNotification>();
  const [notificationGateway, setNotificationGateway] = useState<string>("https://notification.inrupt.com");
  const [connectionStatus, setConnectionStatus] = useState<string>(
    "disconnected"
  );
  const [parentContainerUrl, setParentContainerUrl] = useState<string>();
  const [childContainerUrl, setChildContainerUrl] = useState<string>();
  const [messageBus, setMessageBus] = useState<any[]>([]);

  useEffect(() => {
    if (session.info.webId !== undefined) {
      getPodUrlAll(session.info.webId as string, {
        fetch: session.fetch,
      }).then((pods) => {
        if (pods.length === 0) {
          throw new Error("No pod root in webid profile");
        }
        setParentContainerUrl(pods[0]);
      });
    }
  }, []);

  useEffect(() => {
    if (parentContainerUrl !== undefined && socket === undefined && notificationGateway !== undefined) {
      setSocket(
        new WebsocketNotification(parentContainerUrl, {
          fetch: session.fetch,
          gateway: "https://notification.inrupt.com",
        })
      );
    }
    if (socket !== undefined) {
      socket.on("connected", () => setConnectionStatus("connected"));
      socket.on("closed", () => {
        setConnectionStatus("closed");
        setMessageBus([]);
      });
      socket.on("error", () => setConnectionStatus("error"));
      socket.on("message", (message) => {
        setMessageBus((previousMessageBus) => [
          JSON.parse(message),
          ...previousMessageBus,
        ]);
      });
    }
  }, [socket, parentContainerUrl, notificationGateway]);

  return (
    <div>
      <form>
        <input
          data-testid="notificationGatewayInput"
          type="text"
          value={notificationGateway}
          onChange={(e) => {
            setNotificationGateway(e.target.value);
          }}
        />
      </form>
      <p>
        Websocket status:{" "}
        <em>
          <span data-testid="webSocketStatus">{connectionStatus}</span>
        </em>
      </p>
      <p>
        Child container:{" "}
        <em>
          <span data-testid="childContainerUrl">
            {childContainerUrl ?? "None"}
          </span>
        </em>
      </p>
      <WebSocketButtons socket={socket}/>
      <br></br>
      <button
        onClick={async (e) => {
          e.preventDefault();
          if (parentContainerUrl !== undefined) {
            setChildContainerUrl(
              getSourceIri(
                await createContainerInContainer(parentContainerUrl, {
                  fetch: session.fetch,
                })
              )
            );
          }
        }}
        data-testid="createContainer"
      >
        Create container
      </button>
      <button
        onClick={async (e) => {
          e.preventDefault();
          if (childContainerUrl !== undefined) {
            deleteContainer(childContainerUrl, {
              fetch: session.fetch,
            });
            setChildContainerUrl("None");
          }
        }}
        data-testid="deleteContainer"
      >
        Delete container
      </button>
      <br />
      <MessageList messages={messageBus} />
    </div>
  );
}
