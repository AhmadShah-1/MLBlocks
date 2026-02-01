declare const acquireVsCodeApi: () => { postMessage: (message: unknown) => void };

let vscodeApi: ReturnType<typeof acquireVsCodeApi> | null = null;

export function getVsCodeApi() {
  if (!vscodeApi) {
    vscodeApi = acquireVsCodeApi();
  }
  return vscodeApi;
}

