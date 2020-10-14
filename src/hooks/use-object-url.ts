import { useEffect, useState } from 'react';

interface State {
  objectURL?: string;
  created?: number;
}

export const useObjectURL = (blob?: Blob) => {
  const [state, setState] = useState<State>({
    objectURL: undefined,
    created: undefined,
  });

  useEffect(() => {
    if (!blob) {
      return;
    }

    const objectURL = URL.createObjectURL(blob);
    setState({
      objectURL,
      created: Date.now(),
    });
    return () => {
      URL.revokeObjectURL(objectURL);
      setState({
        objectURL: undefined,
        created: undefined,
      });
    };
  }, [blob]);

  return state;
};
