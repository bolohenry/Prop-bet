const apiInput = document.getElementById("api-base");
const apiSave = document.getElementById("api-save");

const getApiBase = () => {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("api");
  if (fromQuery) {
    localStorage.setItem("api_base", fromQuery);
    return fromQuery;
  }
  return localStorage.getItem("api_base") || "";
};

const setApiBase = (value) => {
  localStorage.setItem("api_base", value);
};

const apiBase = getApiBase();
if (apiInput) {
  apiInput.value = apiBase;
  apiSave?.addEventListener("click", () => {
    setApiBase(apiInput.value.trim());
    alert("Saved API Base URL.");
  });
}

const apiFetch = async (path, options = {}) => {
  const base = getApiBase();
  if (!base) {
    throw new Error("Set the API Base URL first.");
  }
  const response = await fetch(`${base}${path}`, options);
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }
    return data;
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Request failed");
  }
  return response.text();
};

const clearErrors = (container) => {
  container.querySelectorAll(".error").forEach((node) => {
    node.textContent = "";
  });
};

const setError = (id, message) => {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
};
