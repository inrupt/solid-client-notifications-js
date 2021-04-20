// Verify that imports from the main export work:
import { WebsocketNotification as IndexWN } from "@inrupt/solid-client-notifications";
// Verify that submodule imports work:
import { WebsocketNotification } from "@inrupt/solid-client-notifications/websocketNotification";

console.log(IndexWN);
console.log(WebsocketNotification);
