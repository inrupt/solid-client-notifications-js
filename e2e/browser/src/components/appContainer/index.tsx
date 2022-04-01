import React, { useState, useEffect } from "react";
import {
  login,
  logout,
  handleIncomingRedirect,
  getDefaultSession
} from "@inrupt/solid-client-authn-browser";
import Notifications from "../notifications/";

const REDIRECT_URL = "http://localhost:3000/";
const APP_NAME = "Notifications browser-based tests app";
const issuer = "https://login.inrupt.com/";

const NotificationContainer = () => {
  if(getDefaultSession().info.isLoggedIn) {
    return <Notifications />;
  } else {
    return <div></div>;
  }
}

export default function AppContainer() {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [issuer, setIssuer] = useState<string>("https://login.inrupt.com");
  
  useEffect(() => {
    (async () => {
      const info = await handleIncomingRedirect({
        restorePreviousSession: true,
      });
      if(info !== undefined) {
        setLoggedIn(info.isLoggedIn);
      }
    })()
  }, [loggedIn]);

  const handleLogin = async () => {
    // Login will redirect the user away so that they can log in the OIDC issuer,
    // and back to the provided redirect URL (which should be controlled by your app).
    await login({
      redirectUrl: REDIRECT_URL,
      oidcIssuer: issuer,
      clientName: APP_NAME,
    });
  };

  const handleLogout = async () => {
    await logout();
    setLoggedIn(false);
  };

  return (<div>
      <h1>{ APP_NAME }</h1>
      <p>{getDefaultSession().info.webId ? `Logged in as ${getDefaultSession().info.webId}` : "Not logged in yet"}</p>
      <form>
        <input
          type="text"
          value={issuer}
          onChange={(e) => {
            setIssuer(e.target.value);
          }}
        />
        <button onClick={async (e) => {e.preventDefault(); await handleLogin()}}>Log In</button>
        <button onClick={async (e) => {e.preventDefault(); await handleLogout()}}>Log Out</button>
      </form>
      <NotificationContainer />
    </div>)
}