export type SubscriptionSource = {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
};

export const parseSubscriptionSources = (value: string): SubscriptionSource[] => {
  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item, index) => ({
          id: typeof item?.id === "string" && item.id ? item.id : `source-${index + 1}`,
          name: typeof item?.name === "string" && item.name ? item.name : `订阅源 ${index + 1}`,
          url: typeof item?.url === "string" ? item.url : "",
          enabled: item?.enabled !== false,
        }))
        .filter((item) => item.url.trim());
    }
  } catch {
    return [];
  }

  return [];
};

export const serializeSubscriptionSources = (sources: SubscriptionSource[]) =>
  JSON.stringify(
    sources.map((source) => ({
      id: source.id,
      name: source.name.trim() || "订阅源",
      url: source.url.trim(),
      enabled: source.enabled,
    })),
  );

export const getActiveSubscriptionInput = (value: string) =>
  parseSubscriptionSources(value)
    .filter((source) => source.enabled)
    .map((source) => source.url.trim())
    .filter(Boolean)
    .join("\n");
