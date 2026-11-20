export const DEV_AUTH_STORAGE_KEY = "goldencares:dev-auth";
export const DEMO_LOGIN = {
  email: "temp@123",
  password: "12345678",
};

export const DEMO_USER = {
  id: "demo-family-user",
  email: DEMO_LOGIN.email,
  full_name: "Demo Family",
  role: "user",
};

export function isDevelopmentSession() {
  return (
    import.meta.env.DEV &&
    typeof window !== "undefined" &&
    window.localStorage.getItem(DEV_AUTH_STORAGE_KEY) === "true"
  );
}

export function startDemoSession(email, password) {
  if (
    !import.meta.env.DEV ||
    email.trim().toLowerCase() !== DEMO_LOGIN.email ||
    password !== DEMO_LOGIN.password
  ) {
    return false;
  }

  window.localStorage.setItem(DEV_AUTH_STORAGE_KEY, "true");
  return true;
}
