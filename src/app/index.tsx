import { Redirect } from "expo-router";

// The tab screens live at /dashboard and /clinical-memory; the root "/" has no
// screen of its own. Send it to the dashboard, the app's default landing tab,
// so launching the app doesn't land on an unmatched route.
export default function Index() {
  return <Redirect href="/dashboard" />;
}
