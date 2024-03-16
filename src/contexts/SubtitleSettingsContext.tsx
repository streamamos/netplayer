import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface SubtitleSettings {
  fontSize: number;
  backgroundOpacity: number;
  textStyle: 'none' | 'outline' | 'raised' | 'depressed' | 'dropShadow';
  fontOpacity: number;
}

type StateSelector = (
  currentState: SubtitleSettings
) => Partial<SubtitleSettings>;

type UpdateStateAction = (stateSelector: StateSelector) => void;

interface SubtitleSettingsProps {
  state: SubtitleSettings;
  setState: UpdateStateAction;
  delayTime: number;
  setDelayTime: Dispatch<SetStateAction<number>>;
}

interface SubtitleSettingsProviderProps {
  defaultState?: Partial<SubtitleSettings>;
}

export const defaultSubtitleSettings: SubtitleSettings = {
  fontSize: 1,
  backgroundOpacity: 0.75,
  fontOpacity: 1,
  textStyle: 'none',
};

export const SubtitleSettingsContext =
  React.createContext<SubtitleSettingsProps>({
    state: defaultSubtitleSettings,
    setState: () => {},
    delayTime: 0,
    setDelayTime: () => {},
  });

const LOCALSTORAGE_KEY = 'netplayer_subtitle_settings';

export const SubtitleSettingsProvider: React.FC<
  SubtitleSettingsProviderProps
> = ({ defaultState = {}, children }) => {
  const [delayTime, setDelayTime] = useState(0);
  const [state, setState] = React.useState<SubtitleSettings>({
    ...defaultSubtitleSettings,
    ...defaultState,
  });
  const updateState: UpdateStateAction = useCallback(
    (stateSelector) => {
      const newState = stateSelector(state);
      setState({ ...state, ...newState });
    },
    [state]
  );
  useEffect(() => {
    const rawSettings = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!rawSettings) return;
    const settings = JSON.parse(rawSettings);
    setState(settings);
  }, []);
  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(state));
  }, [state]);
  return (
    <SubtitleSettingsContext.Provider
      value={{ state, setState: updateState, delayTime, setDelayTime }}
    >
      {children}
    </SubtitleSettingsContext.Provider>
  );
};

export const useSubtitleSettings = () => {
  return useContext(SubtitleSettingsContext);
};
