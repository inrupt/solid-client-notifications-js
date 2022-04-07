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

interface WebSocketButtons {
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
  connectionStatus?: string;
}

const WebSocketButtons = ({
  onConnect,
  onDisconnect,
  connectionStatus,
}: WebSocketButtons) => {
  if (connectionStatus === undefined) {
    return <></>;
  }
  if (connectionStatus === "connected") {
    return (
      <button
        onClick={(e) => {
          e.preventDefault();
          onDisconnect();
        }}
        data-testid="disconnectSocket"
      >
        Disconnect websocket
      </button>
    );
  }
  return (
    <button
      onClick={async (e) => {
        e.preventDefault();
        await onConnect();
      }}
      data-testid="connectSocket"
    >
      Connect websocket
    </button>
  );
};

interface CreateResourceButtonProps {
  parentContainerUrl?: string;
  handleCreateContainer: (containerUrl: string) => void;
}

const CreateResourceButton = ({
  parentContainerUrl,
  handleCreateContainer,
}: CreateResourceButtonProps) => {
  return parentContainerUrl === undefined ? (
    <></>
  ) : (
    <button
      onClick={async (e) => {
        e.preventDefault();
        handleCreateContainer(
          getSourceIri(
            await createContainerInContainer(parentContainerUrl, {
              fetch: getDefaultSession().fetch,
            })
          )
        );
      }}
      data-testid="createContainer"
    >
      Create container
    </button>
  );
};

interface DeleteResourceButtonProps {
  childContainerUrl?: string;
  handleDeleteContainer: () => void;
}

const DeleteResourceButton = ({
  childContainerUrl,
  handleDeleteContainer,
}: DeleteResourceButtonProps) => {
  return childContainerUrl === undefined ? (
    <></>
  ) : (
    <button
      onClick={async (e) => {
        e.preventDefault();
        if (childContainerUrl !== undefined) {
          deleteContainer(childContainerUrl, {
            fetch: getDefaultSession().fetch,
          });
          handleDeleteContainer();
        }
      }}
      data-testid="deleteContainer"
    >
      Delete container
    </button>
  );
};

const ContainerDock = ({
  parentContainerUrl,
}: {
  parentContainerUrl?: string;
}) => {
  const [childContainerUrl, setChildContainerUrl] = useState<
    string | undefined
  >();

  const handleCreateContainer = (containerUrl: string) =>
    setChildContainerUrl(containerUrl);
  const handleDeleteContainer = () => setChildContainerUrl(undefined);

  return (
    <>
      <p>
        Child container:{" "}
        <em>
          <span data-testid="childContainerUrl">
            {childContainerUrl ?? "None"}
          </span>
        </em>
      </p>
      {childContainerUrl ? (
        <DeleteResourceButton
          childContainerUrl={childContainerUrl}
          handleDeleteContainer={handleDeleteContainer}
        />
      ) : (
        <CreateResourceButton
          parentContainerUrl={parentContainerUrl}
          handleCreateContainer={handleCreateContainer}
        />
      )}
    </>
  );
};

export default function Notifications() {
  const [socket, setSocket] = useState<WebsocketNotification>();
  const [connectionStatus, setConnectionStatus] = useState<string>();
  const [parentContainerUrl, setParentContainerUrl] = useState<string>();

  const [messageBus, setMessageBus] = useState<any[]>([]);

  const onConnect = async () => {
    if (socket !== undefined) {
      await socket.connect();
    }
  };

  const onDisconnect = () => {
    if (socket !== undefined) {
      socket.disconnect();
    }
  };

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
    if (parentContainerUrl !== undefined && socket === undefined) {
      setSocket(
        new WebsocketNotification(parentContainerUrl, {
          fetch: session.fetch,
        })
      );
    }
    if (socket !== undefined) {
      setConnectionStatus("closed");
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
  }, [socket, parentContainerUrl]);

  return (
    <div>
      <p>
        Websocket status:{" "}
        <em>
          {connectionStatus ? (
            <span data-testid="webSocketStatus">{connectionStatus}</span>
          ) : (
            <></>
          )}
        </em>
      </p>

      <WebSocketButtons
        connectionStatus={connectionStatus}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
      <br></br>
      <ContainerDock parentContainerUrl={parentContainerUrl} />
      <br />
      <MessageList messages={messageBus} />
    </div>
  );
}
