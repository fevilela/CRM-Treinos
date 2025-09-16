import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined
): Promise<Response> {
  // Use relative URLs so Vite proxy can handle API calls
  let apiUrl = url;

  console.log("API Request:", method, apiUrl, data);

  const res = await fetch(apiUrl, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log("API Response:", res.status, res.headers.get("content-type"));

  // Check if response is HTML instead of JSON
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/html")) {
    const htmlText = await res.text();
    console.error("Received HTML instead of JSON:", htmlText.substring(0, 200));
    throw new Error(
      "Server returned HTML instead of JSON. Check API endpoint."
    );
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log("[QUERY DEBUG] Fetching:", queryKey.join("/"));
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    console.log(
      "[QUERY DEBUG] Response:",
      res.status,
      res.headers.get("content-type")
    );

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
