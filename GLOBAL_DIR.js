function getEngineGlobalDir(request) {
  return new URL("/", request.url);
}
export {getEngineGlobalDir}