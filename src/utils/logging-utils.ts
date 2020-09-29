const originalDebug = console.debug;
const originalError = console.error;
const originalInfo = console.info;
const originalLog = console.log;
const originalWarn = console.warn;
const noOperation = () => {};

export const enableLogging = () => {
  console.debug = originalDebug;
  console.error = originalError;
  console.info = originalInfo;
  console.log = originalLog;
  console.warn = originalWarn;
};

export const disableLogging = () => {
  console.debug = noOperation;
  console.error = noOperation;
  console.info = noOperation;
  console.log = noOperation;
  console.warn = noOperation;
};
