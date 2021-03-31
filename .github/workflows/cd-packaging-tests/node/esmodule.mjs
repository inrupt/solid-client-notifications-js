// Verify that imports from the main export work:
import { Notification } from "@inrupt/solid-client-notifications";
// Verify that submodule imports work:
import WebsocketNotification from "@inrupt/solid-client-notifications/websocketNotification";

console.log(Notification);
console.log(WebsocketNotification);
