import { WebsocketNotification } from "@inrupt/solid-client-notifications";
import { useEffect, useState } from "react";
import { createContainerInContainer, getSourceIri, deleteContainer, getPodUrlAll } from "@inrupt/solid-client";
import { getDefaultSession } from "@inrupt/solid-client-authn-browser";

const MessageList = (props: {messages: Array<any>}) => {
  const { messages } = props;
  return <ul data-testid="eventList">
    { messages.map((message) => <li key={message.id}><pre>{JSON.stringify(message, null, 2)}</pre></li>) }
  </ul>
}

export default function Notifications() {

  const [socket, setSocket] = useState<WebsocketNotification>();
  const [connectionStatus, setConnectionStatus] = useState<string>("disconnected");
  const [parentContainerUrl, setParentContainerUrl] = useState<string>();
  const [childContainerUrl, setChildContainerUrl] = useState<string>();
  const [messageBus, setMessageBus] = useState<any[]>([])

  useEffect(() => {
    if (getDefaultSession().info.webId !== undefined) {
      getPodUrlAll(
        getDefaultSession().info.webId as string,
        {fetch: getDefaultSession().fetch}
      ).then(pods => {
        if (pods.length === 0) {
          throw new Error("No pod root in webid profile");
        }
        setParentContainerUrl(pods[0]);
      });
    }
  }, []);

  useEffect(() => {
    if (parentContainerUrl !== undefined) {
      setSocket(new WebsocketNotification(parentContainerUrl, {
        fetch: getDefaultSession().fetch,
        gateway: "https://notification.inrupt.com",
      }));
    }
  }, [parentContainerUrl]);

  useEffect(() => {
    if (socket !== undefined) {
      socket.on("connected", () => setConnectionStatus("connected"));
      socket.on("closed", () => {
        setConnectionStatus("closed");
        setMessageBus([]);
      });
      socket.on("error", () => setConnectionStatus("error"));
      socket.on("message", (message) => {
        console.debug("New message", {message})
        messageBus.push(JSON.parse(message))
        // Reverse the message bus so that the latest message appears first
        setMessageBus([...messageBus.reverse()]);
      });
    }
  }, [socket]);

  return <div>
    <p>Websocket status: <em><span data-testid="webSocketStatus">{connectionStatus}</span></em></p>
    <p>Child container: <em><span data-testid="childContainerUrl">{childContainerUrl ?? "None"}</span></em></p>

    <button onClick={
      async (e) => {
        e.preventDefault();
        if(socket !== undefined) {
          await socket.connect();
        }
      }}
      data-testid="connectSocket"
    >
      Connect websocket
    </button>
    <button onClick={
      (e) => {
        e.preventDefault();
        if(socket !== undefined) {
          socket.disconnect();
        }
      }}
      data-testid="disconnectSocket"
    >
      Disconnect websocket
    </button>
    <br></br>
    <button onClick={
      async (e) => {
        e.preventDefault();
        if(parentContainerUrl !== undefined) {
          setChildContainerUrl(
            getSourceIri(
              await createContainerInContainer(parentContainerUrl, { fetch: getDefaultSession().fetch })
            )
          );
        }
      }}
      data-testid="createContainer"
    >
      Create container
    </button>
    <button onClick={
      async (e) => {
        e.preventDefault();
        if (childContainerUrl !== undefined) {
          deleteContainer(childContainerUrl, { fetch: getDefaultSession().fetch })
          setChildContainerUrl("None");
        }
      }}
      data-testid="deleteContainer"
    >
      Delete container
    </button>
    <br />
    <MessageList messages={messageBus}/>
  </div>
}