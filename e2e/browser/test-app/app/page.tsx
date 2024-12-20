"use client";

import React, { useState, useEffect } from "react";
import {
  login,
  logout,
  handleIncomingRedirect,
  ISessionInfo,
} from "@inrupt/solid-client-authn-browser";
import Notifications from "../components/notifications";

const APP_NAME = "Notifications browser-based tests app";
const DEFAULT_ISSUER = "https://login.inrupt.com/";

const NotificationContainer = ({
  sessionInfo,
}: {
  sessionInfo?: ISessionInfo;
}) => {
  if (sessionInfo?.isLoggedIn) {
    return <Notifications />;
  } else {
    return <></>;
  }
};

export default function AppContainer() {
  const [sessionInfo, setSessionInfo] = useState<ISessionInfo>();
  const [issuer, setIssuer] = useState<string>(DEFAULT_ISSUER);

  useEffect(() => {
    handleIncomingRedirect().then(setSessionInfo);
  }, []);

  const handleLogin = async () => {
    try {
      // Login will redirect the user away so that they can log in the OIDC issuer,
      // and back to the provided redirect URL (which should be controlled by your app).
      await login({
        redirectUrl: "http://localhost:3000",
        oidcIssuer: issuer,
        clientName: APP_NAME,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setSessionInfo(undefined);
  };

  return (
    <div>
      <h1>{APP_NAME}</h1>
      <p>
        {sessionInfo?.isLoggedIn
          ? `Logged in as ${sessionInfo.webId}`
          : "Not logged in yet"}
      </p>
      <form>
        <input
          data-testid="identityProviderInput"
          type="text"
          value={issuer}
          onChange={(e) => {
            setIssuer(e.target.value);
          }}
        />
        <button
          data-testid="loginButton"
          onClick={async (e) => {
            e.preventDefault();
            await handleLogin();
          }}
        >
          Log In
        </button>
        <button
          data-testid="logoutButton"
          onClick={async (e) => {
            e.preventDefault();
            await handleLogout();
          }}
        >
          Log Out
        </button>
      </form>
      <NotificationContainer sessionInfo={sessionInfo} />
    </div>
  );
}
