const UUID_V4_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FLOW_KEYS = Object.freeze([
  "lp",
  "cta",
  "source",
  "medium",
  "campaign",
  "content",
  "market",
]);
const SAFE_VALUE_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export function createTrackingId(cryptoApi = globalThis.crypto) {
  const trackingId = cryptoApi.randomUUID();
  if (!UUID_V4_PATTERN.test(trackingId)) {
    throw new Error("invalid tracking_id");
  }
  return trackingId;
}

export function buildTrackingCode(flowCode, trackingId) {
  parseManagementCode(flowCode);
  if (!UUID_V4_PATTERN.test(trackingId)) {
    throw new Error("invalid tracking_id");
  }
  const trackingCode = `v1~${flowCode}~${trackingId}`;
  if (new TextEncoder().encode(trackingCode).byteLength > 2048) {
    throw new Error("tracking code too large");
  }
  return trackingCode;
}

export function parseManagementCode(flowCode) {
  const result = {};
  const segments = String(flowCode).split("|");
  if (segments.length !== FLOW_KEYS.length) {
    throw new Error("invalid flow_code");
  }

  for (let index = 0; index < FLOW_KEYS.length; index += 1) {
    const segment = segments[index];
    const separator = segment.indexOf("=");
    const key = segment.slice(0, separator);
    const value = segment.slice(separator + 1);
    if (
      separator < 1 ||
      key !== FLOW_KEYS[index] ||
      !SAFE_VALUE_PATTERN.test(value)
    ) {
      throw new Error("invalid flow_code");
    }
    result[key] = value;
  }

  if (result.market !== "general" && result.market !== "special") {
    throw new Error("invalid flow_code");
  }
  return result;
}

export function readGaIdentity(gtag, measurementId, timeoutMs = 300) {
  if (typeof gtag !== "function" || !measurementId) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const values = {};
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    const receive = (field) => (value) => {
      if (typeof value !== "string" || value.length < 1 || value.length > 128) {
        return;
      }
      values[field] = value;
      if (values.clientId && values.sessionId) {
        finish({ clientId: values.clientId, sessionId: values.sessionId });
      }
    };

    try {
      gtag("get", measurementId, "client_id", receive("clientId"));
      gtag("get", measurementId, "session_id", receive("sessionId"));
    } catch {
      finish(null);
    }
  });
}

export function buildStartPayload({
  trackingId,
  flowCode,
  gaIdentity,
  contact,
  attribution,
  acquiredAt,
}) {
  const management = parseManagementCode(flowCode);
  if (!UUID_V4_PATTERN.test(trackingId)) {
    throw new Error("invalid tracking_id");
  }
  if (!gaIdentity?.clientId || !gaIdentity?.sessionId) {
    throw new Error("invalid GA identity");
  }

  const payload = {
    tracking_id: trackingId,
    flow_code: flowCode,
    client_id: gaIdentity.clientId,
    session_id: gaIdentity.sessionId,
    contact_flow:
      contact?.values?.contact_flow || `${management.lp}_${management.cta}`,
    contact_lp: management.lp,
    contact_cta: management.cta,
    contact_market: management.market,
    acquired_at: acquiredAt,
  };
  for (const name of [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_id",
    "utm_term",
    "utm_source_platform",
  ]) {
    const value = attribution?.utm?.[name];
    if (value) payload[name] = value;
  }
  return payload;
}

export async function postTrackingStart({
  fetchApi,
  endpoint,
  payload,
  timeoutMs = 300,
}) {
  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).byteLength > 2048) {
    return { accepted: false, reason: "payload_too_large" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchApi(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
      signal: controller.signal,
    });
    if (response.ok) {
      return { accepted: true, status: response.status };
    }
    return { accepted: false, reason: "http_error", status: response.status };
  } catch {
    return {
      accepted: false,
      reason: controller.signal.aborted ? "timeout" : "network_error",
    };
  } finally {
    clearTimeout(timer);
  }
}
