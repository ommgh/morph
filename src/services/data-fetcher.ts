/**
 * General purpose API data fetcher
 * Fetches data from any provided API URL and returns the JSON response
 */
export interface FetchDataParams {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}

export interface FetchDataResponse {
  success: boolean;
  data: unknown;
  status: number;
  dataType: "array" | "object" | "primitive";
  itemCount?: number;
  keys?: string[];
  error?: string;
}

export const fetchData = async (
  params: FetchDataParams,
): Promise<FetchDataResponse> => {
  const { url, method = "GET", headers = {}, body } = params;

  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body && method !== "GET") {
      fetchOptions.body = JSON.stringify(body);
    }

    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      return {
        success: false,
        data: null,
        status: res.status,
        dataType: "primitive",
        error: `HTTP ${res.status}: ${res.statusText}`,
      };
    }

    const data = await res.json();

    // Analyze the response structure to help AI choose the right component
    let dataType: "array" | "object" | "primitive" = "primitive";
    let itemCount: number | undefined;
    let keys: string[] | undefined;

    if (Array.isArray(data)) {
      dataType = "array";
      itemCount = data.length;
      if (data.length > 0 && typeof data[0] === "object") {
        keys = Object.keys(data[0]);
      }
    } else if (data !== null && typeof data === "object") {
      dataType = "object";
      keys = Object.keys(data);
    }

    return {
      success: true,
      data,
      status: res.status,
      dataType,
      itemCount,
      keys,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      status: 0,
      dataType: "primitive",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
};
